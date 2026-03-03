import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function PATCH(request: NextRequest) {
  try {
    const { kakaoId, nickname } = await request.json();

    if (!kakaoId || !nickname) {
      return NextResponse.json({ error: '필수 값이 없습니다.' }, { status: 400 });
    }

    if (typeof nickname !== 'string' || nickname.trim().length === 0 || nickname.trim().length > 20) {
      return NextResponse.json({ error: '닉네임은 1~20자여야 합니다.' }, { status: 400 });
    }

    const db = getAdminDb();
    const userRef = db.collection('users').doc(kakaoId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    await userRef.update({
      nickname: nickname.trim(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, nickname: nickname.trim() });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[update-profile 오류]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
