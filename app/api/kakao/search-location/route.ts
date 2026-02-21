import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return Response.json({ error: '검색어 필요' }, { status: 400 });
  }

  const apiKey = process.env.KAKAO_REST_API_KEY;

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

    console.log(`🔍 "${query}" 검색 결과: ${data.documents?.length}개`);
    
    return Response.json(data);
  } catch (error) {
    console.error('❌ 검색 에러:', error);
    return Response.json({ error: '검색 실패' }, { status: 500 });
  }
}