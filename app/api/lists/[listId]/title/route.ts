import { NextRequest, NextResponse } from 'next/server';
import { updateListTitle } from '@/lib/firebase/lists-admin';
import { verifyRequestUid } from '@/lib/firebase/auth-helpers';

/**
 * PATCH /api/lists/[listId]/title
 *
 * 공개 리스트의 제목 수정.
 * users/{uid}/lists/{listId} 한 곳만 갱신 (단일 진실 원천).
 *
 * Body: { title: string }
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

    const { title } = await req.json() as { title: string };

    if (!title) {
      return NextResponse.json({ error: 'title 필드가 필요합니다.' }, { status: 400 });
    }

    await updateListTitle(uid, listId, title);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PATCH /api/lists/[listId]/title]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
