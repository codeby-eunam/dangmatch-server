import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';

/**
 * POST /api/reviews
 * 리뷰 저장 (Admin SDK 사용)
 * 저장 경로: users/{userId}/reviews/{docId}
 * 리뷰 저장 후 userlog의 해당 restaurantId 도큐먼트에 reviewed: true 자동 설정
 *
 * Body: { userId, restaurantId, restaurantName, comment, peopleCount?, totalPrice?, pricePerPerson? }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, restaurantId, restaurantName, comment, peopleCount, totalPrice, pricePerPerson } = await req.json() as {
      userId: string;
      restaurantId: string;
      restaurantName: string;
      comment: string;
      peopleCount?: number | null;
      totalPrice?: number | null;
      pricePerPerson?: number | null;
    };

    if (!userId || !restaurantId || !restaurantName || !comment) {
      return NextResponse.json(
        { error: 'userId, restaurantId, restaurantName, comment 필드가 필요합니다.' },
        { status: 400 },
      );
    }
    if (comment.trim().length < 5) {
      return NextResponse.json({ error: '리뷰 내용은 5자 이상이어야 합니다.' }, { status: 400 });
    }

    const db = getAdminDb();

    // 중복 리뷰 방지 (같은 식당에 이미 리뷰가 있으면 거절)
    const existing = await db
      .collection('users').doc(userId)
      .collection('reviews')
      .where('restaurantId', '==', restaurantId)
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json({ error: '이미 리뷰를 작성했습니다.' }, { status: 409 });
    }

    const docRef = await db
      .collection('users').doc(userId)
      .collection('reviews').add({
        restaurantId,
        restaurantName,
        comment: comment.trim(),
        peopleCount: peopleCount ?? null,
        totalPrice: totalPrice ?? null,
        pricePerPerson: pricePerPerson ?? null,
        createdAt: FieldValue.serverTimestamp(),
      });

    // userlog에서 해당 restaurantId 도큐먼트에 reviewed: true 설정
    const userlogSnap = await db
      .collection('users').doc(userId)
      .collection('userlog')
      .where('restaurantId', '==', restaurantId)
      .get();

    if (!userlogSnap.empty) {
      const batch = db.batch();
      userlogSnap.docs.forEach((doc) => batch.update(doc.ref, { reviewed: true }));
      await batch.commit();
    }

    return NextResponse.json({ id: docRef.id }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/reviews]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * GET /api/reviews?userId=...
 * 유저의 리뷰 목록 조회 (최신순)
 */
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId 파라미터가 필요합니다.' }, { status: 400 });
    }

    const db = getAdminDb();
    const snap = await db
      .collection('users').doc(userId)
      .collection('reviews')
      .orderBy('createdAt', 'desc')
      .get();

    const reviews = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ reviews });
  } catch (err) {
    console.error('[GET /api/reviews]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
