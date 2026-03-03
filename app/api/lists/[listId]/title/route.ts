import { NextRequest, NextResponse } from 'next/server';
import { updateListTitle } from '@/lib/firebase/lists-admin';

/**
 * PATCH /api/lists/[listId]/title
 *
 * 공개 리스트의 제목 수정.
 * users/{uid}/lists/{listId} 한 곳만 갱신 (단일 진실 원천).
 *
 * Body: { uid: string, title: string }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ listId: string }> },
) {
  try {
    const { listId } = await params;
    const { uid, title } = await req.json() as {
      uid: string;
      title: string;
    };

    if (!uid || !title) {
      return NextResponse.json({ error: 'uid, title 필드가 필요합니다.' }, { status: 400 });
    }

    await updateListTitle(uid, listId, title);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PATCH /api/lists/[listId]/title]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
