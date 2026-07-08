import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

interface NaverTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: string;
}

interface NaverUserInfo {
  resultcode: string;
  message: string;
  response: {
    id: string;
    nickname?: string;
    name?: string;
    email?: string;
    profile_image?: string;
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const BASE_URL = new URL(request.url).origin;

  // state = 앱에서 전달한 appRedirectUri
  const appRedirectUri = searchParams.get('state') ?? '';
  const isAppCallback = !!appRedirectUri;

  const errorRedirect = (msg: string) =>
    isAppCallback
      ? NextResponse.redirect(`${appRedirectUri}?error=${encodeURIComponent(msg)}`)
      : NextResponse.redirect(`${BASE_URL}/?error=${encodeURIComponent(msg)}`);

  if (error || !code) {
    return errorRedirect('naver_login_failed');
  }

  try {
    // 1. 네이버 액세스 토큰 발급
    const tokenRes = await fetch(
      `https://nid.naver.com/oauth2.0/token?` +
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.NAVER_CLIENT_ID!,
        client_secret: process.env.NAVER_CLIENT_SECRET!,
        redirect_uri: `${BASE_URL}/api/auth/naver/callback`,
        code,
        state: appRedirectUri,
      }),
      { method: 'POST', headers: { 'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID!, 'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET! } }
    );

    if (!tokenRes.ok) {
      const body = await tokenRes.text();
      throw new Error(`네이버 토큰 발급 실패 (${tokenRes.status}): ${body}`);
    }

    const { access_token } = (await tokenRes.json()) as NaverTokenResponse;

    // 2. 네이버 사용자 정보 조회
    const userRes = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userRes.ok) {
      const body = await userRes.text();
      throw new Error(`네이버 사용자 정보 조회 실패 (${userRes.status}): ${body}`);
    }

    const naverData = (await userRes.json()) as NaverUserInfo;
    const naverUser = naverData.response;

    const naverId = `naver:${naverUser.id}`;
    const nickname = naverUser.nickname ?? naverUser.name ?? '사용자';
    const profileImage = naverUser.profile_image || undefined;

    if (isAppCallback) {
      const db = getAdminDb();
      const userRef = db.collection('users').doc(naverId);
      const statsRef = db.collection('meta').doc('stats');
      const now = new Date().toISOString();

      const { isNewUser, joinOrder, userId, createdAt, badges, savedNickname } =
        await db.runTransaction(async (tx) => {
          const userSnap = await tx.get(userRef);

          if (!userSnap.exists) {
            const statsSnap = await tx.get(statsRef);
            const resolvedOrder =
              (statsSnap.exists ? (statsSnap.data()?.userCount ?? 0) : 0) + 1;
            const resolvedBadges: string[] = resolvedOrder <= 1000 ? ['초기멤버'] : [];

            tx.set(statsRef, { userCount: FieldValue.increment(1) }, { merge: true });
            tx.set(userRef, {
              naverId,
              provider: 'naver',
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
              savedNickname: null as string | null,
            };
          } else {
            const data = userSnap.data()!;
            tx.update(userRef, {
              ...(profileImage && { profileImage }),
              updatedAt: FieldValue.serverTimestamp(),
            });

            return {
              isNewUser: !data.userId,
              joinOrder: (data.joinOrder as number) ?? 9999,
              userId: (data.userId as string | null) ?? null,
              createdAt: (data.createdAt as string) ?? now,
              badges: (data.badges as string[]) ?? [],
              savedNickname: (data.nickname as string) ?? nickname,
            };
          }
        });

      // 앱이 이후 API 요청에 Authorization: Bearer <idToken>으로 실어 보낼 수 있도록,
      // 웹 경로와 동일하게 Firebase Custom Token을 발급한다 (uid = naverId).
      const customToken = await getAdminAuth().createCustomToken(naverId, { provider: 'naver' });

      const params = new URLSearchParams({
        naverId,
        isNewUser: String(isNewUser),
        nickname: savedNickname ?? nickname,
        joinOrder: String(joinOrder),
        badges: badges.join(','),
        createdAt,
        customToken,
      });
      if (userId) params.set('userId', userId);
      if (profileImage) params.set('profileImage', profileImage);

      return NextResponse.redirect(`${appRedirectUri}?${params.toString()}`);
    }

    return NextResponse.redirect(`${BASE_URL}/`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[네이버 로그인 오류]', message);
    return errorRedirect(message);
  }
}
