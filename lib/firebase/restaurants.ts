import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from './client';
import type { Restaurant } from '@/types';

/**
 * 카카오 식당 데이터를 Firestore restaurants/{kakaoPlaceId} 에 upsert.
 * - 이미 존재하면 카카오 데이터만 갱신 (images[], winCount 등 기존 필드 유지)
 * - Batch write로 한 번에 커밋 (최대 200건 단위)
 */
export async function upsertRestaurants(restaurants: Restaurant[]): Promise<void> {
  if (restaurants.length === 0) return;

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
          kakaoPlaceId: r.id,
          name: r.name,
          category: r.category,
          address: r.address,
          phone: r.phone,
          lat: r.lat,
          lng: r.lng,
          kakaoUrl: r.kakaoUrl ?? null,
          updatedAt: serverTimestamp(),
        },
        { merge: true } // images[], winCount, tournamentCount, winRate, createdAt 등 기존 필드 보존
      );
    }

    await batch.commit();
  }
}
