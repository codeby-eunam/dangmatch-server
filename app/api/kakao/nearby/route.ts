import { NextRequest } from 'next/server';
import { unstable_cache } from 'next/cache';
import { normalizeDocuments } from '../kakaoUtils';
import { isKoreaCoordinate, searchNearbyGoogle } from '../googlePlaces';
import {
  roundToGrid,
  clampRadius,
  clampMaxPages,
  assertNonEmpty,
  respondWithDocuments,
  NEARBY_TTL_SECONDS,
} from '../cache';

const CATEGORY_MAP: Record<string, { query: string; categoryGroupCode?: string }> = {
  '한식': { query: '한식', categoryGroupCode: 'FD6' },
  '중식': { query: '중식', categoryGroupCode: 'FD6' },
  '일식': { query: '일식', categoryGroupCode: 'FD6' },
  '양식': { query: '양식', categoryGroupCode: 'FD6' },
  '분식': { query: '분식', categoryGroupCode: 'FD6' },
  '카페': { query: '카페', categoryGroupCode: 'CE7' },
  '기타': { query: '음식점', categoryGroupCode: 'FD6' },
};

// 캐시 키 카디널리티를 유한하게 유지하기 위해, 알 수 없는 category 값은 여기서
// '기타'로 접어버린다 — 안 그러면 매 요청마다 다른 문자열을 보내는 것만으로
// 캐시를 무한정 우회(=매번 유료 API 호출)할 수 있다.
const VALID_CATEGORIES = new Set(Object.keys(CATEGORY_MAP));
function resolveCategoryKey(categoryParam: string): string {
  return VALID_CATEGORIES.has(categoryParam) ? categoryParam : '기타';
}

// 좌표를 그리드에 맞춰 반올림한 뒤 캐싱하므로, 같은 동네에서 여러 사용자가
// 검색해도 실제 외부 API 호출은 TTL 동안 1번만 나간다.
const getCachedNearbyGoogle = unstable_cache(
  async (latKey: number, lngKey: number, radius: number, categoryParam: string) => {
    console.log(`[cache-miss] nearby-google ${latKey},${lngKey} r=${radius} cat=${categoryParam}`);
    return assertNonEmpty(await searchNearbyGoogle(latKey, lngKey, radius, categoryParam));
  },
  ['kakao-nearby-google-v1'],
  { revalidate: NEARBY_TTL_SECONDS },
);

const getCachedNearbyKakao = unstable_cache(
  async (
    latKey: number,
    lngKey: number,
    radius: string,
    categoryParam: string,
    maxPages: number,
  ) => {
    console.log(`[cache-miss] nearby-kakao ${latKey},${lngKey} r=${radius} cat=${categoryParam}`);
    const apiKey = process.env.KAKAO_REST_API_KEY;
    if (!apiKey) throw new Error('KAKAO_REST_API_KEY not configured');

    const { query, categoryGroupCode } = CATEGORY_MAP[categoryParam] ?? CATEGORY_MAP['기타'];

    const pageNumbers = Array.from({ length: maxPages }, (_, i) => i + 1);
    const pages = await Promise.all(pageNumbers.map(page => {
      const url = new URL('https://dapi.kakao.com/v2/local/search/keyword.json');
      url.searchParams.set('query', query);
      url.searchParams.set('x', String(lngKey));
      url.searchParams.set('y', String(latKey));
      url.searchParams.set('radius', radius);
      url.searchParams.set('size', '15');
      url.searchParams.set('page', String(page));
      if (categoryGroupCode) {
        url.searchParams.set('category_group_code', categoryGroupCode);
      }

      return fetch(url.toString(), {
        headers: { Authorization: `KakaoAK ${apiKey}` },
        cache: 'no-store',
      }).then(async r => {
        if (!r.ok) throw new Error(`Kakao keyword search failed: ${r.status}`);
        return r.json();
      });
    }));

    const seen = new Set();
    const documents = pages
      .flatMap(data => data.documents || [])
      .filter(doc => {
        if (seen.has(doc.id)) return false;
        seen.add(doc.id);
        return true;
      });

    console.log(`✅ [${categoryParam}] 식당 ${documents.length}개 찾음`);

    return assertNonEmpty(normalizeDocuments(documents));
  },
  ['kakao-nearby-kakao-v1'],
  { revalidate: NEARBY_TTL_SECONDS },
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return Response.json({ error: '위치 정보 필요' }, { status: 400 });
  }

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
    return Response.json({ error: '위치 정보가 올바르지 않습니다' }, { status: 400 });
  }

  const latKey = roundToGrid(latNum);
  const lngKey = roundToGrid(lngNum);
  const radiusNum = clampRadius(parseInt(searchParams.get('radius') || '', 10));
  const maxPages = clampMaxPages(parseInt(searchParams.get('maxPages') || '', 10));
  const categoryKey = resolveCategoryKey(searchParams.get('category') || '기타');

  // 한국 밖 좌표면 Kakao(한국 전용 데이터) 대신 Google Places를 사용한다.
  if (!isKoreaCoordinate(latNum, lngNum)) {
    return respondWithDocuments(
      () => getCachedNearbyGoogle(latKey, lngKey, radiusNum, categoryKey),
      'Google Places API 에러',
    );
  }

  return respondWithDocuments(
    () => getCachedNearbyKakao(latKey, lngKey, String(radiusNum), categoryKey, maxPages),
    'Kakao API 에러',
  );
}
