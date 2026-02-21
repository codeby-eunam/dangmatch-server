import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = searchParams.get('radius') || '1000';

  if (!lat || !lng) {
    return Response.json({ error: '위치 정보 필요' }, { status: 400 });
  }

  const apiKey = process.env.KAKAO_REST_API_KEY;
  
  if (!apiKey) {
    return Response.json({ error: 'API 키 설정 필요' }, { status: 500 });
  }

  const query = '맛집';

  try {
    const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&x=${lng}&y=${lat}&radius=${radius}&size=15`;

    const response = await fetch(url, {
      headers: {
        Authorization: `KakaoAK ${apiKey}`
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Kakao API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ 식당 ${data.documents.length}개 찾음`);
    
    return Response.json(data);
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