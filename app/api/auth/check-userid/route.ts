import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ available: false });
  }

  try {
    const db = getAdminDb();
    const existing = await db.collection('users')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    return NextResponse.json({ available: existing.empty });
  } catch (err) {
    console.error('[check-userid 오류]', err);
    return NextResponse.json({ available: true });
  }
}
