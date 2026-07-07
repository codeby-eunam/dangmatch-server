import { NextRequest } from 'next/server';

const MOBILE_USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 ' +
  '(KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1';

/**
 * Kakao Local API는 사진을 반환하지 않으므로, place.map.kakao.com의 og:image
 * 메타 태그를 대신 읽어온다. 스와이프 카드 1장당 1회만 호출되는 lazy 조회.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id || !/^\d+$/.test(id)) {
    return Response.json({ photo_url: '' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://place.map.kakao.com/${id}`, {
      headers: { 'User-Agent': MOBILE_USER_AGENT },
    });
    if (!response.ok) {
      return Response.json({ photo_url: '' });
    }

    const html = await response.text();
    const match =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);

    // og:image가 프로토콜 상대 URL(//img1.kakaocdn.net/...)로 오는 경우가 있어
    // 클라이언트가 스킴 없이는 로드할 수 없으므로 https:를 붙여준다.
    let photoUrl = match?.[1] ?? '';
    if (photoUrl.startsWith('//')) {
      photoUrl = `https:${photoUrl}`;
    }

    return Response.json({
      photo_url: photoUrl,
    }, {
      // 짧은 시간 내 같은 카드로 다시 돌아와도 재요청하지 않도록 캐시.
      headers: { 'Cache-Control': 'public, max-age=3600' },
    });
  } catch (error) {
    console.error('❌ Kakao 사진 조회 에러:', error);
    return Response.json({ photo_url: '' });
  }
}
