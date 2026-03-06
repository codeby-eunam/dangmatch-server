import { getAdminDb } from '@/lib/firebase/admin';
import { NextResponse } from 'next/server';

interface SharedListRef {
  listId: string;
  ownerUid: string;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  const { shareToken } = await params;

  try {
    const sharedSnap = await getAdminDb().collection('shared_lists').doc(shareToken).get();
    if (!sharedSnap.exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { listId, ownerUid } = sharedSnap.data() as SharedListRef;

    const listSnap = await getAdminDb().collection('public_lists').doc(listId).get();
    if (!listSnap.exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const userSnap = await getAdminDb().collection('users').doc(ownerUid).get();
    const userId = userSnap.exists ? (userSnap.data()?.userId ?? null) : null;

    const listData = listSnap.data();

    return NextResponse.json({
      ...listData,
      id: listId,
      ownerUid,
      ownerUserId: userId,
      shareToken,
    });
  } catch (err) {
    console.error('[api/share] 오류:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}