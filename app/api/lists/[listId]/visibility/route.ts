import { NextRequest, NextResponse } from 'next/server';
import { togglePublicStatus } from '@/lib/firebase/lists-admin';
import { verifyRequestUid } from '@/lib/firebase/auth-helpers';

/**
 * PATCH /api/lists/[listId]/visibility
 *
 * 공개 ↔ 비공개 전환 (Atomic update).
 * 데이터는 users/{uid}/lists/{listId} 한 곳에만 있으므로
 * isPublic + updatedAt 두 필드만 갱신한다.
 *
 * Body: { isPublic: boolean }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ listId: string }> },
) {
  try {
    const { listId } = await params;
    const uid = await verifyRequestUid(req);
    if (!uid) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { isPublic } = await req.json() as { isPublic: boolean };

    if (typeof isPublic !== 'boolean') {
      return NextResponse.json({ error: 'isPublic 필드가 필요합니다.' }, { status: 400 });
    }

    await togglePublicStatus(uid, listId, isPublic);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PATCH /api/lists/[listId]/visibility]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
