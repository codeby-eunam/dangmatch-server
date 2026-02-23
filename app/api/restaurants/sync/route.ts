import { NextRequest } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import type { Restaurant } from '@/types';

interface KakaoDoc {
  id: string;
  place_name: string;
  category_name: string;
  road_address_name: string;
  address_name: string;
  phone: string;
  x: string; // 경도
  y: string; // 위도
  place_url?: string;
  distance?: string;
}

async function fetchNaverImage(name: string, address: string): Promise<string | null> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const city = address.split(' ').slice(0, 2).join(' ');
  const query = `${name} ${city} 음식점`;

  try {
    const res = await fetch(
      `https://openapi.naver.com/v1/search/image?query=${encodeURIComponent(query)}&display=1&sort=sim`,
      {
        headers: {
          'X-Naver-Client-Id': clientId,
          'X-Naver-Client-Secret': clientSecret,
        },
        cache: 'no-store',
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.items?.[0]?.link ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const { documents } = await req.json();

  if (!Array.isArray(documents) || documents.length === 0) {
    return Response.json({ error: '잘못된 요청' }, { status: 400 });
  }

  const db = getAdminDb();

  // 1. Firestore에서 기존 데이터 병렬 조회
  const refs = documents.map((d: KakaoDoc) => db.collection('restaurants').doc(d.id));
  const firestoreDocs = await Promise.all(refs.map((ref) => ref.get()));

  // 2. 신규/기존 분류 및 결과 배열 초기화
  const results: Restaurant[] = [];
  const toRegister: KakaoDoc[] = [];
  const noImageIndices: number[] = [];

  for (let i = 0; i < documents.length; i++) {
    const kakao = documents[i] as KakaoDoc;
    const fsDoc = firestoreDocs[i];

    const base: Restaurant = {
      id: kakao.id,
      name: kakao.place_name,
      category: kakao.category_name,
      address: kakao.road_address_name || kakao.address_name,
      phone: kakao.phone || '',
      lat: parseFloat(kakao.y),
      lng: parseFloat(kakao.x),
      kakaoUrl: kakao.place_url || '',
      distance: kakao.distance,
    };

    if (!fsDoc.exists) {
      // 신규 가게 → 등록 예정
      results.push(base);
      toRegister.push(kakao);
      noImageIndices.push(i);
    } else {
      // 기존 가게 → Firebase images 가져오기
      const data = fsDoc.data()!;
      const images = data.images as string[] | undefined;
      results.push({ ...base, images });
      if (!images || images.length === 0) noImageIndices.push(i);
    }
  }

  // 3. 신규 가게 Firebase 등록 (병렬)
  await Promise.all(
    toRegister.map((kakao) =>
      db.collection('restaurants').doc(kakao.id).set({
        kakaoPlaceId: kakao.id,
        name: kakao.place_name,
        category: kakao.category_name,
        address: kakao.road_address_name || kakao.address_name,
        phone: kakao.phone || '',
        lat: parseFloat(kakao.y),
        lng: parseFloat(kakao.x),
        kakaoUrl: kakao.place_url || null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    )
  );

  // 4. 이미지 없는 가게들 Naver 이미지 fetch (병렬, 실패해도 무시)
  await Promise.allSettled(
    noImageIndices.map(async (idx) => {
      const r = results[idx];
      const imageUrl = await fetchNaverImage(r.name, r.address);
      if (imageUrl) {
        results[idx] = { ...r, images: [imageUrl] };
        await db.collection('restaurants').doc(r.id).update({
          images: FieldValue.arrayUnion(imageUrl),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    })
  );

  return Response.json({ restaurants: results });
}
