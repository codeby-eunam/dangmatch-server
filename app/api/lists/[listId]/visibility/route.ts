import { NextRequest, NextResponse } from 'next/server';
import { togglePublicStatus } from '@/lib/firebase/lists-admin';

/**
 * PATCH /api/lists/[listId]/visibility
 *
 * 공개 ↔ 비공개 전환 (Atomic update).
 * 데이터는 users/{uid}/lists/{listId} 한 곳에만 있으므로
 * isPublic + updatedAt 두 필드만 갱신한다.
 *
 * Body: { uid: string, isPublic: boolean }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ listId: string }> },
) {
  try {
    const { listId } = await params;
    const { uid, isPublic } = await req.json() as {
      uid: string;
      isPublic: boolean;
    };
	console.log('[visibility] uid:', uid, 'isPublic:', isPublic);

    if (!uid || typeof isPublic !== 'boolean') {
      return NextResponse.json({ error: 'uid, isPublic 필드가 필요합니다.' }, { status: 400 });
    }

    await togglePublicStatus(uid, listId, isPublic);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PATCH /api/lists/[listId]/visibility]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
