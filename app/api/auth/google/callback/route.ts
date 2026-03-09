import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

interface GoogleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  id_token?: string;
}

interface GoogleUserInfo {
  id: string;
  name?: string;
  given_name?: string;
  email?: string;
  picture?: string;
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
    return errorRedirect('google_login_failed');
  }

  try {
    // 1. 구글 액세스 토큰 발급
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${BASE_URL}/api/auth/google/callback`,
        code,
      }),
    });

    if (!tokenRes.ok) {
      const body = await tokenRes.text();
      throw new Error(`구글 토큰 발급 실패 (${tokenRes.status}): ${body}`);
    }

    const { access_token } = (await tokenRes.json()) as GoogleTokenResponse;

    // 2. 구글 사용자 정보 조회
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userRes.ok) {
      const body = await userRes.text();
      throw new Error(`구글 사용자 정보 조회 실패 (${userRes.status}): ${body}`);
    }

    const googleUser = (await userRes.json()) as GoogleUserInfo;

    const googleId = `google:${googleUser.id}`;
    const nickname = googleUser.name ?? googleUser.given_name ?? '사용자';
    const profileImage = googleUser.picture || undefined;

    if (isAppCallback) {
      const db = getAdminDb();
      const userRef = db.collection('users').doc(googleId);
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
              googleId,
              provider: 'google',
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

      const params = new URLSearchParams({
        googleId,
        isNewUser: String(isNewUser),
        nickname: savedNickname ?? nickname,
        joinOrder: String(joinOrder),
        badges: badges.join(','),
        createdAt,
      });
      if (userId) params.set('userId', userId);
      if (profileImage) params.set('profileImage', profileImage);

      return NextResponse.redirect(`${appRedirectUri}?${params.toString()}`);
    }

    return NextResponse.redirect(`${BASE_URL}/`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[구글 로그인 오류]', message);
    return errorRedirect(message);
  }
}
