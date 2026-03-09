import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const url = new URL(request.url);
  const origin = url.origin;
  const REDIRECT_URI = `${origin}/api/auth/google/callback`;

  const appRedirectUri = url.searchParams.get('redirect_uri') ?? '';

  const googleAuthUrl =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent('openid email profile')}` +
    `&access_type=online` +
    (appRedirectUri ? `&state=${encodeURIComponent(appRedirectUri)}` : '');

  return NextResponse.redirect(googleAuthUrl);
}
