import { NextRequest, NextResponse } from 'next/server';

// 카카오 OAuth 로그인 페이지로 리다이렉트
export async function GET(request: NextRequest) {
  const KAKAO_CLIENT_ID = process.env.KAKAO_REST_API_KEY;

  const { searchParams } = new URL(request.url);
  const redirect_uri = searchParams.get('redirect_uri');

  if (!redirect_uri) {
    return NextResponse.json({ error: 'redirect_uri missing' }, { status: 400 });
  }

  const kakaoAuthUrl =
    `https://kauth.kakao.com/oauth/authorize` +
    `?client_id=${KAKAO_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirect_uri)}` +
    `&response_type=code`;

  return NextResponse.redirect(kakaoAuthUrl);
}