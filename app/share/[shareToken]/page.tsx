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
    // 1. shared_lists에서 listId 조회
    const sharedSnap = await getAdminDb().collection('shared_lists').doc(shareToken).get();
    if (!sharedSnap.exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { listId, ownerUid } = sharedSnap.data() as SharedListRef;

    // 2. public_lists에서 실제 데이터 조회
    const listSnap = await getAdminDb().collection('public_lists').doc(listId).get();
    if (!listSnap.exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const listData = listSnap.data();

    return NextResponse.json({
      ...listData,
      id: listId,
      ownerUid,
      shareToken,
    });
  } catch (err) {
    console.error('[api/share] 오류:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}