import { NextRequest } from 'next/server';

/**
 * Google Places Photo Media 프록시. googlePlaces.ts가 반환하는 photo_url
 * (/api/kakao/photo?name=places/.../photos/...)을 클라이언트가 그대로
 * Image로 로드하면 이 라우트가 서버 사이드 API 키로 실제 이미지를 대신 받아온다.
 * (API 키를 클라이언트/네트워크 로그에 노출하지 않기 위함)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  if (!name || !name.startsWith('places/')) {
    return Response.json({ error: '잘못된 name' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'GOOGLE_PLACES_API_KEY not configured' }, { status: 500 });
  }

  try {
    const upstream = await fetch(
      `https://places.googleapis.com/v1/${name}/media?maxWidthPx=480&key=${apiKey}`,
    );

    if (!upstream.ok) {
      return Response.json({ error: '이미지 로드 실패' }, { status: upstream.status });
    }

    const contentType = upstream.headers.get('content-type') ?? 'image/jpeg';
    const buffer = await upstream.arrayBuffer();
    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('❌ Google Places 사진 프록시 에러:', error);
    return Response.json({ error: '이미지 로드 실패' }, { status: 500 });
  }
}
