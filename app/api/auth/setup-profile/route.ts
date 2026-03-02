import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const { kakaoId, userId, nickname } = await request.json();

    if (!kakaoId || !userId || !nickname) {
      return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 });
    }

    const db = getAdminDb();
    const userRef = db.collection('users').doc(kakaoId);
    const userIdRef = db.collection('userIds').doc(userId);

    const result = await db.runTransaction(async (tx) => {
      // userId 중복 확인 (원자적)
      const userIdSnap = await tx.get(userIdRef);
      if (userIdSnap.exists) throw new Error('USERID_TAKEN');

      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) throw new Error('USER_NOT_FOUND');

      const data = userSnap.data()!;

      // userId 예약
      tx.set(userIdRef, { kakaoId, createdAt: FieldValue.serverTimestamp() });
      // users 문서 업데이트
      tx.update(userRef, {
        userId,
        nickname,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        joinOrder: data.joinOrder as number,
        createdAt: data.createdAt as string,
        badges: (data.badges ?? []) as string[],
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === 'USERID_TAKEN') {
      return NextResponse.json({ error: 'USERID_TAKEN' }, { status: 409 });
    }
    if (message === 'USER_NOT_FOUND') {
      return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 });
    }
    console.error('[setup-profile 오류]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
