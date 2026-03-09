import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';

/**
 * POST /api/reviews
 * 리뷰 저장 (Admin SDK 사용)
 * 저장 경로: users/{userId}/reviews/{docId}
 *
 * Body: { userId, restaurantId, restaurantName, rating, content }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, restaurantId, restaurantName, rating, content } = await req.json() as {
      userId: string;
      restaurantId: string;
      restaurantName: string;
      rating: number;
      content: string;
    };

    if (!userId || !restaurantId || !restaurantName || !rating || !content) {
      return NextResponse.json(
        { error: 'userId, restaurantId, restaurantName, rating, content 필드가 필요합니다.' },
        { status: 400 },
      );
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'rating은 1~5 사이여야 합니다.' }, { status: 400 });
    }
    if (content.trim().length < 5) {
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
        rating,
        content: content.trim(),
        createdAt: FieldValue.serverTimestamp(),
      });

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
