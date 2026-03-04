import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return Response.json({ error: '검색어 필요' }, { status: 400 });
  }

  const apiKey = process.env.KAKAO_REST_API_KEY;

  try {
    // 키워드 검색 API 사용
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=1`,
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