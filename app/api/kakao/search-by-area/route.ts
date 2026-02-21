import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const area = searchParams.get('area');

  if (!area) {
    return Response.json({ error: '지역명 필요' }, { status: 400 });
  }

  const apiKey = process.env.KAKAO_REST_API_KEY;

  try {
    const query = `${area} 맛집`;
    
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=15`,
      {
        headers: {
          Authorization: `KakaoAK ${apiKey}`
        }
      }
    );

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: '검색 실패' }, { status: 500 });
  }
}