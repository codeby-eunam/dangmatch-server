import { NextRequest, NextResponse } from 'next/server';
import { getUserLists, createListWithPlaces } from '@/lib/firebase/lists-admin';
import type { Restaurant } from '@/types';

// 앱에서 넘어오는 간소화된 Place 타입 (lat/lng/phone 없음)
interface AppPlace {
  id: string;
  name: string;
  categoryName: string;
  address: string;
  image: string;
  placeUrl: string;
}

function appPlaceToRestaurant(p: AppPlace): Restaurant {
  return {
    id: p.id,
    name: p.name,
    category: p.categoryName,
    address: p.address,
    phone: '',
    lat: 0,
    lng: 0,
    ...(p.placeUrl && { kakaoUrl: p.placeUrl }),
    images: [p.image],
  };
}

/**
 * GET /api/lists?uid=...
 * 유저의 전체 리스트 로드 (최신순)
 */
export async function GET(req: NextRequest) {
  try {
    const uid = req.nextUrl.searchParams.get('uid');
    if (!uid) {
      return NextResponse.json({ error: 'uid 파라미터가 필요합니다.' }, { status: 400 });
    }
    const lists = await getUserLists(uid);
    return NextResponse.json({ lists });
  } catch (err) {
    console.error('[GET /api/lists]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/lists
 * 새 리스트 생성 (초기 식당 포함)
 *
 * Body: { uid: string, title: string, places?: AppPlace[] }
 */
export async function POST(req: NextRequest) {
  try {
    const { uid, title, places = [] } = await req.json() as {
      uid: string;
      title: string;
      places?: AppPlace[];
    };

    if (!uid || !title) {
      return NextResponse.json({ error: 'uid, title 필드가 필요합니다.' }, { status: 400 });
    }

    const restaurants: Restaurant[] = places.map(appPlaceToRestaurant);
    const list = await createListWithPlaces(uid, title, restaurants);

    return NextResponse.json({ list }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/lists]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
