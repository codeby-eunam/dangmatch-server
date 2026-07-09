import { NextRequest } from 'next/server';
import { unstable_cache } from 'next/cache';
import { normalizeDocuments } from '../kakaoUtils';
import { isKoreaCoordinate, searchTextGoogle } from '../googlePlaces';
import {
  normalizeQuery,
  assertNonEmpty,
  respondWithDocuments,
  LOCATION_TTL_SECONDS,
  MAX_QUERY_LENGTH,
} from '../cache';

// Google 우선 확인 → Kakao 키워드 → Kakao 주소, 세 갈래 전체를 "이 쿼리의 최종 답"
// 이라는 한 캐시 단위로 묶는다.
const getCachedLocationDocuments = unstable_cache(
  async (normalizedQuery: string) => {
    console.log(`[cache-miss] search-location "${normalizedQuery}"`);
    const apiKey = process.env.KAKAO_REST_API_KEY;

    // Kakao 키워드 검색은 한국 밖 지명(예: "Seattle")도 이름이 비슷한 국내
    // 업체로 잘못 매칭될 수 있어, Google Places로 먼저 실제 위치를 확인한다.
    if (process.env.GOOGLE_PLACES_API_KEY) {
      try {
        const googleDocuments = await searchTextGoogle(normalizedQuery);
        const top = googleDocuments[0];
        if (top && !isKoreaCoordinate(parseFloat(top.y), parseFloat(top.x))) {
          return assertNonEmpty(googleDocuments);
        }
      } catch (error) {
        console.error('❌ Google Places 검색 에러 (Kakao로 계속 진행):', error);
      }
    }

    // 먼저 키워드 검색 시도
    let response = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(normalizedQuery)}`,
      {
        headers: {
          Authorization: `KakaoAK ${apiKey}`
        }
      }
    );
    if (!response.ok) throw new Error(`Kakao keyword search failed: ${response.status}`);

    let data = await response.json();

    // 결과 없으면 주소 검색 시도
    if (!data.documents || data.documents.length === 0) {
      response = await fetch(
        `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(normalizedQuery)}`,
        {
          headers: {
            Authorization: `KakaoAK ${apiKey}`
          }
        }
      );
      if (!response.ok) throw new Error(`Kakao address search failed: ${response.status}`);
      data = await response.json();
    }
    return assertNonEmpty(normalizeDocuments(data.documents ?? []));
  },
  ['kakao-search-location-v1'],
  { revalidate: LOCATION_TTL_SECONDS },
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return Response.json({ error: '검색어 필요' }, { status: 400 });
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return Response.json({ error: '검색어가 너무 깁니다' }, { status: 400 });
  }

  const normalizedQuery = normalizeQuery(query);
  if (!normalizedQuery) {
    return Response.json({ error: '검색어 필요' }, { status: 400 });
  }

  return respondWithDocuments(() => getCachedLocationDocuments(normalizedQuery), '검색 에러');
}