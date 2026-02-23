import { NextRequest } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  const { restaurantId, imageUrl, secret } = await req.json();

  const isProd = process.env.NODE_ENV === 'production';
  if (isProd && secret !== process.env.ADMIN_SECRET) {
    return Response.json({ error: '인증 실패' }, { status: 401 });
  }

  if (!restaurantId || !imageUrl) {
    return Response.json({ error: '필수 파라미터 누락' }, { status: 400 });
  }

  // URL 형식 검증
  try {
    new URL(imageUrl);
  } catch {
    return Response.json({ error: '유효하지 않은 URL' }, { status: 400 });
  }

  const db = getAdminDb();
  await db.collection('restaurants').doc(restaurantId).update({
    images: FieldValue.arrayUnion(imageUrl),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return Response.json({ success: true, imageUrl });
}
