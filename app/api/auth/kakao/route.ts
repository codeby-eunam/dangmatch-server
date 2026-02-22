import { NextRequest, NextResponse } from 'next/server';

// 카카오 OAuth 로그인 페이지로 리다이렉트
export async function GET(request: NextRequest) {
  const KAKAO_CLIENT_ID = process.env.KAKAO_REST_API_KEY;
  const origin = new URL(request.url).origin;
  const REDIRECT_URI = `${origin}/api/auth/kakao/callback`;

  const kakaoAuthUrl =
    `https://kauth.kakao.com/oauth/authorize` +
    `?client_id=${KAKAO_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code`;

  return NextResponse.redirect(kakaoAuthUrl);
}
