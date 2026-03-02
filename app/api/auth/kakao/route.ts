import { NextRequest, NextResponse } from 'next/server';

// 카카오 OAuth 로그인 페이지로 리다이렉트
export async function GET(request: NextRequest) {
  const KAKAO_CLIENT_ID = process.env.KAKAO_REST_API_KEY;
  const url = new URL(request.url);
  const origin = url.origin;
  const REDIRECT_URI = `${origin}/api/auth/kakao/callback`;

  // 앱에서 전달한 redirect_uri (e.g. dangmatchapp://auth/callback)
  // Kakao state 파라미터에 담아서 callback 시 그대로 돌려받음
  const appRedirectUri = url.searchParams.get('redirect_uri') ?? '';
  console.log("STATE =", appRedirectUri);

  const kakaoAuthUrl =
    `https://kauth.kakao.com/oauth/authorize` +
    `?client_id=${KAKAO_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code` +
    (appRedirectUri ? `&state=${encodeURIComponent(appRedirectUri)}` : '');

  return NextResponse.redirect(kakaoAuthUrl);
}
