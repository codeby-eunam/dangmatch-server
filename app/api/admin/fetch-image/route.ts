import { NextRequest } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  const { restaurantId, name, address, secret, schoolDomain } = await req.json();

  const isProd = process.env.NODE_ENV === 'production';
  if (isProd && secret !== process.env.ADMIN_SECRET) {
    return Response.json({ error: '인증 실패' }, { status: 401 });
  }

  if (!restaurantId || !name) {
    return Response.json({ error: '필수 파라미터 누락' }, { status: 400 });
  }

  const naverClientId = process.env.NAVER_CLIENT_ID;
  const naverClientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!naverClientId || !naverClientSecret) {
    return Response.json({ error: 'Naver API 키 없음' }, { status: 500 });
  }

  try {
    // 1. Naver 이미지 검색
    const city = address?.split(' ').slice(0, 2).join(' ') || '';
    const query = `${name} ${city} 음식점`.trim();

    const naverRes = await fetch(
      `https://openapi.naver.com/v1/search/image?query=${encodeURIComponent(query)}&display=1&sort=sim`,
      {
        headers: {
          'X-Naver-Client-Id': naverClientId,
          'X-Naver-Client-Secret': naverClientSecret,
        },
        cache: 'no-store',
      }
    );

    if (!naverRes.ok) {
      return Response.json({ error: `Naver 이미지 검색 실패 (${naverRes.status})` }, { status: 502 });
    }

    const naverData = await naverRes.json();
    const imageUrl: string | undefined = naverData.items?.[0]?.link;

    if (!imageUrl) {
      return Response.json({ error: '검색 결과 없음' }, { status: 404 });
    }

    // 2. Firestore images 배열에 직접 저장
    const db = getAdminDb();
    await db.collection('restaurants').doc(restaurantId).update({
      images: FieldValue.arrayUnion(imageUrl),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 3. schoolDomain이 있으면 school_feeds 중첩 필드도 업데이트
    if (schoolDomain) {
      await db
        .collection('school_feeds').doc(schoolDomain)
        .collection('restaurants').doc(restaurantId)
        .update({
          'restaurant.images': FieldValue.arrayUnion(imageUrl),
          lastUpdated: FieldValue.serverTimestamp(),
        });
    }

    return Response.json({ imageUrl });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[fetch-image error]', message);
    return Response.json({ error: message }, { status: 500 });
  }
}
