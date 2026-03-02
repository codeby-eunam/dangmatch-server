import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

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

  // state = 앱에서 전달한 redirect_uri (route.ts에서 Kakao state로 넘김)
  const appRedirectUri = searchParams.get('state') ?? '';
  const isAppCallback = appRedirectUri.startsWith('dangmatch') || appRedirectUri.startsWith('exp://');

  const errorRedirect = (msg: string) =>
    isAppCallback
      ? NextResponse.redirect(`${appRedirectUri}?error=${encodeURIComponent(msg)}`)
      : NextResponse.redirect(`${BASE_URL}/?error=${encodeURIComponent(msg)}`);

  if (error || !code) {
    return errorRedirect('kakao_login_failed');
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

    const { access_token } = (await tokenRes.json()) as KakaoTokenResponse;

    // 2. 카카오 사용자 정보 조회
    const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userRes.ok) {
      const body = await userRes.text();
      throw new Error(`카카오 사용자 정보 조회 실패 (${userRes.status}): ${body}`);
    }

    const kakaoUser = (await userRes.json()) as KakaoUserInfo;
    const kakaoId = `kakao:${kakaoUser.id}`;
    const nickname = kakaoUser.kakao_account?.profile?.nickname ?? '사용자';
    const email = kakaoUser.kakao_account?.email;
    const profileImage = kakaoUser.kakao_account?.profile?.profile_image_url;

    if (isAppCallback) {
      // ── 앱 경로: Firestore 기반, 앱 딥링크로 리다이렉트 ──
      const db = getAdminDb();
      const userRef = db.collection('users').doc(kakaoId);
      const statsRef = db.collection('meta').doc('stats');
      const now = new Date().toISOString();

      const { isNewUser, joinOrder, userId, createdAt, badges } =
        await db.runTransaction(async (tx) => {
          const userSnap = await tx.get(userRef);

          if (!userSnap.exists) {
            const statsSnap = await tx.get(statsRef);
            const resolvedOrder =
              (statsSnap.exists ? (statsSnap.data()?.userCount ?? 0) : 0) + 1;
            const resolvedBadges: string[] = resolvedOrder <= 1000 ? ['초기멤버'] : [];

            tx.set(statsRef, { userCount: FieldValue.increment(1) }, { merge: true });
            tx.set(userRef, {
              kakaoId,
              nickname,
              ...(profileImage && { profileImage }),
              joinOrder: resolvedOrder,
              userId: null,
              badges: resolvedBadges,
              createdAt: now,
              updatedAt: FieldValue.serverTimestamp(),
            });

            return {
              isNewUser: true,
              joinOrder: resolvedOrder,
              userId: null as string | null,
              createdAt: now,
              badges: resolvedBadges,
            };
          } else {
            const data = userSnap.data()!;
            tx.update(userRef, {
              nickname,
              ...(profileImage && { profileImage }),
              updatedAt: FieldValue.serverTimestamp(),
            });

            return {
              isNewUser: !data.userId,
              joinOrder: (data.joinOrder as number) ?? 9999,
              userId: (data.userId as string | null) ?? null,
              createdAt: (data.createdAt as string) ?? now,
              badges: (data.badges as string[]) ?? [],
            };
          }
        });

      const params = new URLSearchParams({
        kakaoId,
        isNewUser: String(isNewUser),
        nickname,
        joinOrder: String(joinOrder),
        badges: badges.join(','),
        createdAt,
      });
      if (userId) params.set('userId', userId);
      if (profileImage) params.set('profileImage', profileImage);
	  
	  console.log("FINAL =", `${appRedirectUri}?${params}`);
      return NextResponse.redirect(`${appRedirectUri}?${params.toString()}`);
    } else {
      // ── 웹 경로: Firebase Custom Token으로 리다이렉트 ──
      const adminAuth = getAdminAuth();
      const customToken = await adminAuth.createCustomToken(kakaoId, {
        provider: 'kakao',
        nickname,
        ...(email && { email }),
        ...(profileImage && { photoURL: profileImage }),
      });

      return NextResponse.redirect(
        `${BASE_URL}/auth/callback?token=${customToken}&nickname=${encodeURIComponent(nickname)}`
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[카카오 로그인 오류]', message);
    return errorRedirect(message);
  }
}
