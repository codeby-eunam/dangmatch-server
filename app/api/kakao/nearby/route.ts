import { NextRequest } from 'next/server';

const CATEGORY_MAP: Record<string, { query: string; categoryGroupCode?: string }> = {
  '한식': { query: '한식', categoryGroupCode: 'FD6' },
  '중식': { query: '중식', categoryGroupCode: 'FD6' },
  '일식': { query: '일식', categoryGroupCode: 'FD6' },
  '양식': { query: '양식', categoryGroupCode: 'FD6' },
  '분식': { query: '분식', categoryGroupCode: 'FD6' },
  '카페': { query: '카페', categoryGroupCode: 'CE7' },
  '기타': { query: '음식점', categoryGroupCode: 'FD6' },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = searchParams.get('radius') || '1000';
  const categoryParam = searchParams.get('category') || '기타';
  const maxPages = Math.min(3, Math.max(1, parseInt(searchParams.get('maxPages') || '3', 10)));

  if (!lat || !lng) {
    return Response.json({ error: '위치 정보 필요' }, { status: 400 });
  }

  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'API 키 설정 필요' }, { status: 500 });
  }

  const { query, categoryGroupCode } = CATEGORY_MAP[categoryParam] ?? CATEGORY_MAP['기타'];

  try {
    const pageNumbers = Array.from({ length: maxPages }, (_, i) => i + 1);
    const pages = await Promise.all(pageNumbers.map(page => {
      const url = new URL('https://dapi.kakao.com/v2/local/search/keyword.json');
      url.searchParams.set('query', query);
      url.searchParams.set('x', lng);
      url.searchParams.set('y', lat);
      url.searchParams.set('radius', radius);
      url.searchParams.set('size', '15');
      url.searchParams.set('page', String(page));
      if (categoryGroupCode) {
        url.searchParams.set('category_group_code', categoryGroupCode);
      }

      return fetch(url.toString(), {
        headers: { Authorization: `KakaoAK ${apiKey}` },
        cache: 'no-store',
      }).then(r => r.json());
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

    return Response.json({ documents });
  } catch (error) {
    console.error('❌ API 에러:', error);
    return Response.json(
      {
        error: '검색 실패',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
