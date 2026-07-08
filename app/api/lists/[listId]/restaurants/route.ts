import { NextRequest, NextResponse } from 'next/server';
import { addRestaurantToList, removeRestaurantFromList } from '@/lib/firebase/lists-admin';
import { verifyRequestUid } from '@/lib/firebase/auth-helpers';
import type { Restaurant } from '@/types';

/**
 * PATCH /api/lists/[listId]/restaurants
 *
 * 공개 리스트의 식당 추가 / 제거.
 * users/{uid}/lists/{listId} 한 곳만 갱신 (단일 진실 원천).
 *
 * Body:
 *   add    — { action: 'add',    restaurant: Restaurant }
 *   remove — { action: 'remove', restaurantId: string  }
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

    const body = await req.json() as {
      action: 'add' | 'remove';
      restaurant?: Restaurant;
      restaurantId?: string;
    };

    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: 'action 필드가 필요합니다.' }, { status: 400 });
    }

    if (action === 'add') {
      if (!body.restaurant) {
        return NextResponse.json({ error: 'add 액션에는 restaurant 객체가 필요합니다.' }, { status: 400 });
      }
      await addRestaurantToList(uid, listId, body.restaurant);
    } else if (action === 'remove') {
      if (!body.restaurantId) {
        return NextResponse.json({ error: 'remove 액션에는 restaurantId 가 필요합니다.' }, { status: 400 });
      }
      await removeRestaurantFromList(uid, listId, body.restaurantId);
    } else {
      return NextResponse.json({ error: 'action 은 add 또는 remove 여야 합니다.' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PATCH /api/lists/[listId]/restaurants]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
