import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';

interface KakaoTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface KakaoUserInfo {
  id: number;
  kakao_account?: {
    email?: string;
    profile?: {
      nickname?: string;
      profile_image_url?: string;
    };
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const BASE_URL = new URL(request.url).origin;

  if (error || !code) {
    return NextResponse.redirect(`${BASE_URL}/?error=kakao_login_failed`);
  }

  try {
    // 1. 카카오 액세스 토큰 발급
    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_REST_API_KEY!,
        redirect_uri: `${BASE_URL}/api/auth/kakao/callback`,
        code,
      }),
    });

    if (!tokenRes.ok) {
      const body = await tokenRes.text();
      throw new Error(`카카오 토큰 발급 실패 (${tokenRes.status}): ${body}`);
    }

    const tokenData: KakaoTokenResponse = await tokenRes.json();
    const { access_token } = tokenData;

    // 2. 카카오 사용자 정보 조회
    const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userRes.ok) {
      const body = await userRes.text();
      throw new Error(`카카오 사용자 정보 조회 실패 (${userRes.status}): ${body}`);
    }

    const kakaoUser: KakaoUserInfo = await userRes.json();
    const uid = `kakao:${kakaoUser.id}`;
    const nickname = kakaoUser.kakao_account?.profile?.nickname ?? '사용자';
    const email = kakaoUser.kakao_account?.email;
    const photoURL = kakaoUser.kakao_account?.profile?.profile_image_url;

    // 3. Firebase Custom Token 발급
    const adminAuth = getAdminAuth();
    const customToken = await adminAuth.createCustomToken(uid, {
      provider: 'kakao',
      nickname,
      ...(email && { email }),
      ...(photoURL && { photoURL }),
    });

    // 4. 클라이언트로 커스텀 토큰 전달 (쿼리스트링으로)
    return NextResponse.redirect(
      `${BASE_URL}/auth/callback?token=${customToken}&nickname=${encodeURIComponent(nickname)}`
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[카카오 로그인 오류]', message);
    return NextResponse.redirect(
      `${BASE_URL}/?error=${encodeURIComponent(message)}`
    );
  }
}
