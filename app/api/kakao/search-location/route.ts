import { NextRequest } from 'next/server';
import { normalizeDocuments } from '../kakaoUtils';
import { isKoreaCoordinate, searchTextGoogle } from '../googlePlaces';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return Response.json({ error: '검색어 필요' }, { status: 400 });
  }

  const apiKey = process.env.KAKAO_REST_API_KEY;

  // Kakao 키워드 검색은 한국 밖 지명(예: "Seattle")도 이름이 비슷한 국내
  // 업체로 잘못 매칭될 수 있어, Google Places로 먼저 실제 위치를 확인한다.
  if (process.env.GOOGLE_PLACES_API_KEY) {
    try {
      const googleDocuments = await searchTextGoogle(query);
      const top = googleDocuments[0];
      if (top && !isKoreaCoordinate(parseFloat(top.y), parseFloat(top.x))) {
        return Response.json({ documents: googleDocuments });
      }
    } catch (error) {
      console.error('❌ Google Places 검색 에러 (Kakao로 계속 진행):', error);
    }
  }

  try {
    // 먼저 키워드 검색 시도
    let response = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `KakaoAK ${apiKey}`
        }
      }
    );

    let data = await response.json();

    // 결과 없으면 주소 검색 시도
    if (!data.documents || data.documents.length === 0) {
      response = await fetch(
        `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `KakaoAK ${apiKey}`
          }
        }
      );
      data = await response.json();
    }
    return Response.json({
      ...data,
      documents: normalizeDocuments(data.documents ?? []),
    });
  } catch (error) {
    console.error('❌ 검색 에러:', error);
    return Response.json({ error: '검색 실패' }, { status: 500 });
  }
}