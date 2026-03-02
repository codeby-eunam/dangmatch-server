import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const { kakaoId, userId, nickname } = await request.json();

    if (!kakaoId || !userId || !nickname) {
      return NextResponse.json({ error: '필수 값이 없습니다.' }, { status: 400 });
    }

    const db = getAdminDb();

    // userId 중복 확인
    const existing = await db.collection('users')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json({ error: '이미 사용 중인 아이디입니다.' }, { status: 409 });
    }

    const userRef = db.collection('users').doc(kakaoId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    await userRef.update({
      userId,
      nickname,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const data = userSnap.data()!;
    return NextResponse.json({
      joinOrder: data.joinOrder,
      createdAt: data.createdAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[setup-profile 오류]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
