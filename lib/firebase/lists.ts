/**
 * lists.ts — Firebase Client SDK 사용 (클라이언트 컴포넌트 전용)
 *
 * 'use client' 페이지에서 직접 import.
 * API 라우트(서버)에서는 lists-admin.ts 를 사용할 것.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  query,
  orderBy,
} from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { db } from './client';
import type { Restaurant, RestaurantList, SharedList } from '@/types';

// ─── 내부 유틸 ──────────────────────────────────────────────────────────────

function toISO(ts: unknown): string {
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  if (ts instanceof Date) return ts.toISOString();
  return new Date().toISOString();
}

async function generateUniqueToken(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const token = nanoid(8);
    const snap = await getDoc(doc(db, 'shared_lists', token));
    if (!snap.exists()) return token;
  }
  throw new Error('[lists] shareToken 생성 실패: 5회 충돌');
}

// ─── 조회 ───────────────────────────────────────────────────────────────────

export async function getUserLists(uid: string): Promise<RestaurantList[]> {
  const ref = collection(db, 'users', uid, 'lists');
  const q = query(ref, orderBy('updatedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
	  ownerUid: uid,
      title: data.title ?? '',
      restaurants: data.restaurants ?? [],
      isPublic: data.isPublic ?? false,
      shareToken: data.shareToken ?? '',
      createdAt: toISO(data.createdAt),
      updatedAt: toISO(data.updatedAt),
    } satisfies RestaurantList;
  });
}

export async function getList(uid: string, listId: string): Promise<RestaurantList | null> {
  const snap = await getDoc(doc(db, 'users', uid, 'lists', listId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    ownerUid: uid,
    title: data.title ?? '',
    restaurants: data.restaurants ?? [],
    isPublic: data.isPublic ?? false,
    shareToken: data.shareToken ?? '',
    createdAt: toISO(data.createdAt),
    updatedAt: toISO(data.updatedAt),
  };
}

/** 공개 열람 — 2단계 조회 (token → uid/listId → 실제 데이터) */
export async function getSharedList(shareToken: string): Promise<SharedList | null> {
  const tokenSnap = await getDoc(doc(db, 'shared_lists', shareToken));
  if (!tokenSnap.exists()) return null;
  const { ownerUid, listId } = tokenSnap.data();

  const listSnap = await getDoc(doc(db, 'users', ownerUid, 'lists', listId));
  if (!listSnap.exists()) return null;
  const data = listSnap.data();
  if (!data.isPublic) return null;

  return {
    ownerUid,
    listId,
    title: data.title ?? '',
    restaurants: data.restaurants ?? [],
    createdAt: toISO(data.createdAt),
  };
}

// ─── 생성 ───────────────────────────────────────────────────────────────────

/**
 * 새 리스트 생성.
 * shared_lists 는 토큰 맵핑 전용 (ownerUid + listId만 저장, 데이터 없음).
 */
export async function createList(uid: string, title: string): Promise<RestaurantList> {
  const shareToken = await generateUniqueToken();
  const listRef = doc(collection(db, 'users', uid, 'lists'));
  const now = serverTimestamp();

  const batch = writeBatch(db);
  batch.set(listRef, {
    title,
    restaurants: [],
    isPublic: false,
    shareToken,
    createdAt: now,
    updatedAt: now,
  });
  batch.set(doc(db, 'shared_lists', shareToken), {
    ownerUid: uid,
    listId: listRef.id,
  });
  await batch.commit();

  return {
    id: listRef.id,
    ownerUid: uid,
    title,
    restaurants: [],
    isPublic: false,
    shareToken,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ─── 식당 추가 / 제거 ────────────────────────────────────────────────────────

/** 식당 추가 — users 컬렉션만 갱신 */
export async function addRestaurantToList(
  uid: string,
  listId: string,
  restaurant: Restaurant,
): Promise<void> {
  const userListRef = doc(db, 'users', uid, 'lists', listId);

  const snapshot: Restaurant = {
    id: restaurant.id,
    name: restaurant.name,
    category: restaurant.category,
    address: restaurant.address,
    phone: restaurant.phone,
    lat: restaurant.lat,
    lng: restaurant.lng,
    ...(restaurant.kakaoUrl && { kakaoUrl: restaurant.kakaoUrl }),
    ...(restaurant.images?.length && { images: restaurant.images }),
  };

  const snap = await getDoc(userListRef);
  const existing: Restaurant[] = snap.data()?.restaurants ?? [];
  if (existing.some((r) => r.id === restaurant.id)) return;

  await updateDoc(userListRef, {
    restaurants: arrayUnion(snapshot),
    updatedAt: serverTimestamp(),
  });
}

/** 식당 제거 — users 컬렉션만 갱신 */
export async function removeRestaurantFromList(
  uid: string,
  listId: string,
  restaurantId: string,
): Promise<void> {
  const userListRef = doc(db, 'users', uid, 'lists', listId);
  const snap = await getDoc(userListRef);
  const restaurants: Restaurant[] = (snap.data()?.restaurants ?? []).filter(
    (r: Restaurant) => r.id !== restaurantId,
  );
  await updateDoc(userListRef, { restaurants, updatedAt: serverTimestamp() });
}

// ─── 수정 ───────────────────────────────────────────────────────────────────

/** 제목 수정 — users 컬렉션만 갱신 */
export async function updateListTitle(
  uid: string,
  listId: string,
  title: string,
): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'lists', listId), {
    title,
    updatedAt: serverTimestamp(),
  });
}

/** 공개 전환 — isPublic + updatedAt 원자적 갱신 */
export async function togglePublicStatus(
  uid: string,
  listId: string,
  isPublic: boolean,
): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'lists', listId), {
    isPublic,
    updatedAt: serverTimestamp(),
  });
}

// ─── 삭제 ───────────────────────────────────────────────────────────────────

/** 리스트 + 토큰 맵핑 동시 삭제 */
export async function deleteList(
  uid: string,
  listId: string,
  shareToken: string,
): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'users', uid, 'lists', listId));
  batch.delete(doc(db, 'shared_lists', shareToken));
  await batch.commit();
}
