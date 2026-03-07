import { NextRequest, NextResponse } from 'next/server';
import { deleteList } from '@/lib/firebase/lists-admin';

/**
 * DELETE /api/lists/[listId]
 * 리스트 + 토큰 맵핑 동시 삭제
 *
 * Body: { uid: string, shareToken: string }
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ listId: string }> },
) {
  try {
    const { listId } = await params;
    const { uid } = await req.json() as { uid: string };

    if (!uid) {
      return NextResponse.json({ error: 'uid 필드가 필요합니다.' }, { status: 400 });
    }

    await deleteList(uid, listId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/lists/[listId]]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
