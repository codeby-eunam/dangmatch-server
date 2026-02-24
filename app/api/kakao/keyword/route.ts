import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = searchParams.get('radius') || '2000';
  const page = searchParams.get('page') || '1';

  if (!q || !lat || !lng) {
    return Response.json({ error: '필수 파라미터 누락 (q, lat, lng)' }, { status: 400 });
  }

  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'API 키 설정 필요' }, { status: 500 });
  }

  try {
    const url = new URL('https://dapi.kakao.com/v2/local/search/keyword.json');
    url.searchParams.set('query', q);
    url.searchParams.set('x', lng);
    url.searchParams.set('y', lat);
    url.searchParams.set('radius', radius);
    url.searchParams.set('size', '15');
    url.searchParams.set('page', page);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `KakaoAK ${apiKey}` },
      cache: 'no-store',
    });
    const data = await res.json();
    return Response.json({ documents: data.documents ?? [] });
  } catch (error) {
    console.error('[kakao/keyword] 검색 실패', error);
    return Response.json({ error: '검색 실패' }, { status: 500 });
  }
}
