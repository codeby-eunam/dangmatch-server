import { doc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from './client';
import type { Restaurant } from '@/types';

/**
 * 카카오 식당 데이터를 Firestore restaurants/{kakaoPlaceId} 에 upsert.
 * - 이미 존재하면 카카오 데이터만 갱신 (images 배열은 건드리지 않음)
 * - Batch write로 한 번에 커밋 (최대 500개, 실제 최대 45개 × 3페이지 = ~135개)
 */
export async function upsertRestaurants(restaurants: Restaurant[]): Promise<void> {
  if (restaurants.length === 0) return;

  // Firestore batch 최대 500 건. 안전하게 200 단위로 자름
  const chunks: Restaurant[][] = [];
  for (let i = 0; i < restaurants.length; i += 200) {
    chunks.push(restaurants.slice(i, i + 200));
  }

  for (const chunk of chunks) {
    const batch = writeBatch(db);

    for (const r of chunk) {
      const ref = doc(db, 'restaurants', r.id);
      batch.set(
        ref,
        {
          id: r.id,
          name: r.name,
          category: r.category,
          address: r.address,
          roadAddress: r.roadAddress,
          phone: r.phone,
          x: r.x,
          y: r.y,
          placeUrl: r.placeUrl ?? null,
          updatedAt: serverTimestamp(),
        },
        // merge: true → images 배열 등 기존 필드 유지, createdAt 처음 1회만 써야 하므로
        // createdAt은 별도로 처리하지 않고 콘솔/Admin에서 수동 관리
        { merge: true }
      );
    }

    await batch.commit();
  }
}
