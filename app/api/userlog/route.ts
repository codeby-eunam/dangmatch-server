import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

/**
 * POST /api/userlog
 * 유저의 음식점 선택 기록 저장 (Admin SDK 사용)
 *
 * Body: { userId: string, restaurantId: string, restaurantName: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, restaurantId, restaurantName } = await req.json() as {
      userId: string;
      restaurantId: string;
      restaurantName: string;
    };

    if (!userId || !restaurantId || !restaurantName) {
      return NextResponse.json(
        { error: 'userId, restaurantId, restaurantName 필드가 필요합니다.' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const docRef = await db.collection('selections').add({
      userId,
      restaurantId,
      restaurantName,
      selectedAt: new Date(),
    });

    return NextResponse.json({ id: docRef.id }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/userlog]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
