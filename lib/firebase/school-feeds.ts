import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  orderBy,
  limit,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  runTransaction,
} from 'firebase/firestore';
import { db } from './client';
import type { Restaurant, SchoolFeedRestaurant, SchoolFeedList } from '@/types';
import { nanoid } from 'nanoid';

// ─── 스탯 기록 ────────────────────────────────────────────────────────────────

/** 토너먼트 우승 → winCount +1, contributedBy에 uid 추가 */
export async function recordSchoolWin(
  schoolDomain: string,
  uid: string,
  restaurant: Restaurant
): Promise<void> {
  const ref = doc(db, 'school_feeds', schoolDomain, 'restaurants', restaurant.id);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists()) {
        tx.update(ref, {
          winCount: increment(1),
          contributedBy: arrayUnion(uid),
          lastUpdated: serverTimestamp(),
          restaurant,
        });
      } else {
        tx.set(ref, {
          restaurant,
          winCount: 1,
          likeCount: 0,
          contributedBy: [uid],
          lastUpdated: serverTimestamp(),
        });
      }
    });
  } catch (err) {
    console.warn('[school-feeds] recordSchoolWin 실패', err);
  }
}

/** 스와이프 PICK → likeCount +1, contributedBy에 uid 추가 */
export async function recordSchoolLike(
  schoolDomain: string,
  uid: string,
  restaurant: Restaurant
): Promise<void> {
  const ref = doc(db, 'school_feeds', schoolDomain, 'restaurants', restaurant.id);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await setDoc(ref, {
        likeCount: increment(1),
        contributedBy: arrayUnion(uid),
        lastUpdated: serverTimestamp(),
        restaurant,
      }, { merge: true });
    } else {
      await setDoc(ref, {
        restaurant,
        winCount: 0,
        likeCount: 1,
        contributedBy: [uid],
        lastUpdated: serverTimestamp(),
      });
    }
  } catch (err) {
    console.warn('[school-feeds] recordSchoolLike 실패', err);
  }
}

// ─── 랭킹 조회 ────────────────────────────────────────────────────────────────

/** 학교 맛집 랭킹 (winCount 기준 상위 N개) */
export async function getSchoolRestaurantRanking(
  schoolDomain: string,
  maxCount = 30
): Promise<SchoolFeedRestaurant[]> {
  const q = query(
    collection(db, 'school_feeds', schoolDomain, 'restaurants'),
    orderBy('winCount', 'desc'),
    limit(maxCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as SchoolFeedRestaurant);
}

// ─── 스탯 일괄 조회 (swipe 카드 표시용) ──────────────────────────────────────

export interface SchoolStats {
  winCount: number;
  likeCount: number;
  studentCount: number; // contributedBy.length = 선택한 학생 수
}

/**
 * 여러 식당의 학교 스탯을 한 번에 조회.
 * swipe 페이지에서 "우리 학교 N명이 선택한 가게" 표시용.
 */
export async function batchGetSchoolStats(
  schoolDomain: string,
  restaurantIds: string[]
): Promise<Record<string, SchoolStats>> {
  const results: Record<string, SchoolStats> = {};
  await Promise.all(
    restaurantIds.map(async (id) => {
      const snap = await getDoc(doc(db, 'school_feeds', schoolDomain, 'restaurants', id));
      if (snap.exists()) {
        const data = snap.data();
        results[id] = {
          winCount: data.winCount ?? 0,
          likeCount: data.likeCount ?? 0,
          studentCount: (data.contributedBy as string[] | undefined)?.length ?? 0,
        };
      }
    })
  );
  return results;
}

// ─── 학교 리스트 CRUD ─────────────────────────────────────────────────────────

/** 학교 공개 리스트 목록 */
export async function getSchoolLists(
  schoolDomain: string,
  maxCount = 20
): Promise<SchoolFeedList[]> {
  const q = query(
    collection(db, 'school_feeds', schoolDomain, 'lists'),
    orderBy('createdAt', 'desc'),
    limit(maxCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SchoolFeedList));
}

/** 새 학교 리스트 생성 (빈 리스트) */
export async function createSchoolList(
  schoolDomain: string,
  uid: string,
  title: string
): Promise<string> {
  const listId = nanoid(10);
  const ref = doc(db, 'school_feeds', schoolDomain, 'lists', listId);
  await setDoc(ref, {
    title,
    restaurants: [],
    createdBy: uid,
    isPublic: true,
    shareToken: nanoid(8),
    createdAt: serverTimestamp(),
  });
  return listId;
}

/** 학교 리스트에 가게 추가 (id 기준 중복 방지) */
export async function addRestaurantToSchoolList(
  schoolDomain: string,
  listId: string,
  restaurant: Restaurant
): Promise<void> {
  const ref = doc(db, 'school_feeds', schoolDomain, 'lists', listId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('리스트가 존재하지 않습니다');
    const current: Restaurant[] = snap.data().restaurants ?? [];
    if (current.some((r) => r.id === restaurant.id)) return; // 이미 있음
    tx.update(ref, { restaurants: [...current, restaurant] });
  });
}

/** 학교 리스트에서 가게 제거 */
export async function removeRestaurantFromSchoolList(
  schoolDomain: string,
  listId: string,
  restaurantId: string
): Promise<void> {
  const ref = doc(db, 'school_feeds', schoolDomain, 'lists', listId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const restaurants: Restaurant[] = snap.data().restaurants ?? [];
  const target = restaurants.find((r) => r.id === restaurantId);
  if (target) {
    await setDoc(ref, { restaurants: arrayRemove(target) }, { merge: true });
  }
}

/** 학생이 직접 식당 제보 — nominateCount +1, nominatedBy에 uid 추가 */
export async function nominateRestaurantToSchoolFeed(
  schoolDomain: string,
  uid: string,
  restaurant: Restaurant
): Promise<void> {
  const ref = doc(db, 'school_feeds', schoolDomain, 'restaurants', restaurant.id);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists()) {
        tx.update(ref, {
          nominateCount: increment(1),
          nominatedBy: arrayUnion(uid),
          lastUpdated: serverTimestamp(),
          restaurant,
        });
      } else {
        tx.set(ref, {
          restaurant,
          winCount: 0,
          likeCount: 0,
          nominateCount: 1,
          nominatedBy: [uid],
          contributedBy: [],
          lastUpdated: serverTimestamp(),
        });
      }
    });
  } catch (err) {
    console.error('[school-feeds] nominateRestaurantToSchoolFeed 실패', err);
    throw err;
  }
}

/** 개인 리스트를 학교 피드에 공유 (전체 복사) */
export async function saveSchoolList(
  schoolDomain: string,
  uid: string,
  title: string,
  restaurants: Restaurant[]
): Promise<string> {
  const listId = nanoid(10);
  const ref = doc(db, 'school_feeds', schoolDomain, 'lists', listId);
  await setDoc(ref, {
    title,
    restaurants,
    createdBy: uid,
    isPublic: true,
    shareToken: nanoid(8),
    createdAt: serverTimestamp(),
  });
  return listId;
}
