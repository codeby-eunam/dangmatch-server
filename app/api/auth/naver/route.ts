import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
  const url = new URL(request.url);
  const origin = url.origin;
  const REDIRECT_URI = `${origin}/api/auth/naver/callback`;

  const appRedirectUri = url.searchParams.get('redirect_uri') ?? '';

  const naverAuthUrl =
    `https://nid.naver.com/oauth2.0/authorize` +
    `?client_id=${NAVER_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code` +
    `&state=${encodeURIComponent(appRedirectUri)}`;

  return NextResponse.redirect(naverAuthUrl);
}
