import { NextRequest } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import type { Restaurant } from '@/types';

export async function POST(req: NextRequest) {
  const { restaurant, secret } = (await req.json()) as { restaurant: Restaurant; secret: string };

  const isProd = process.env.NODE_ENV === 'production';
  if (isProd && secret !== process.env.ADMIN_SECRET) {
    return Response.json({ error: '인증 실패' }, { status: 401 });
  }

  if (!restaurant?.id || !restaurant?.name) {
    return Response.json({ error: '필수 파라미터 누락' }, { status: 400 });
  }

  const db = getAdminDb();
  const ref = db.collection('school_feeds').doc('ynu').collection('restaurants').doc(restaurant.id);
  const snap = await ref.get();

  if (snap.exists()) {
    await ref.update({
      nominateCount: FieldValue.increment(1),
      lastUpdated: FieldValue.serverTimestamp(),
      restaurant,
    });
  } else {
    await ref.set({
      restaurant,
      winCount: 0,
      likeCount: 0,
      nominateCount: 1,
      nominatedBy: ['admin'],
      contributedBy: [],
      lastUpdated: FieldValue.serverTimestamp(),
    });
  }

  return Response.json({ success: true });
}
