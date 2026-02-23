import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  arrayRemove,
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

/** shared_lists에서 충돌하지 않는 8자리 토큰 생성 */
async function generateUniqueToken(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const token = nanoid(8);
    const snap = await getDoc(doc(db, 'shared_lists', token));
    if (!snap.exists()) return token;
  }
  throw new Error('[lists] shareToken 생성 실패: 5회 충돌');
}

// ─── 조회 ───────────────────────────────────────────────────────────────────

/** 유저의 모든 리스트 (최신순) */
export async function getUserLists(uid: string): Promise<RestaurantList[]> {
  const ref = collection(db, 'users', uid, 'lists');
  const q = query(ref, orderBy('updatedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      title: data.title ?? '',
      restaurants: data.restaurants ?? [],
      isPublic: data.isPublic ?? true,
      shareToken: data.shareToken ?? '',
      createdAt: toISO(data.createdAt),
      updatedAt: toISO(data.updatedAt),
    } satisfies RestaurantList;
  });
}

/** 특정 리스트 조회 (편집용) */
export async function getList(uid: string, listId: string): Promise<RestaurantList | null> {
  const snap = await getDoc(doc(db, 'users', uid, 'lists', listId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    title: data.title ?? '',
    restaurants: data.restaurants ?? [],
    isPublic: data.isPublic ?? true,
    shareToken: data.shareToken ?? '',
    createdAt: toISO(data.createdAt),
    updatedAt: toISO(data.updatedAt),
  };
}

/** 공개 열람 — 비로그인 가능 (shared_lists 읽기) */
export async function getSharedList(shareToken: string): Promise<SharedList | null> {
  const snap = await getDoc(doc(db, 'shared_lists', shareToken));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    ownerUid: data.ownerUid ?? '',
    listId: data.listId ?? '',
    title: data.title ?? '',
    restaurants: data.restaurants ?? [],
    createdAt: toISO(data.createdAt),
  };
}

// ─── 생성 ───────────────────────────────────────────────────────────────────

/**
 * 새 리스트 생성.
 * users/{uid}/lists/{listId} + shared_lists/{shareToken} 동시 batch write.
 */
export async function createList(uid: string, title: string): Promise<RestaurantList> {
  const shareToken = await generateUniqueToken();
  const listRef = doc(collection(db, 'users', uid, 'lists'));
  const sharedRef = doc(db, 'shared_lists', shareToken);
  const now = serverTimestamp();

  const batch = writeBatch(db);
  batch.set(listRef, {
    title,
    restaurants: [],
    isPublic: true,
    shareToken,
    createdAt: now,
    updatedAt: now,
  });
  batch.set(sharedRef, {
    ownerUid: uid,
    listId: listRef.id,
    title,
    restaurants: [],
    createdAt: now,
  });
  await batch.commit();

  return {
    id: listRef.id,
    title,
    restaurants: [],
    isPublic: true,
    shareToken,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ─── 식당 추가 / 제거 ────────────────────────────────────────────────────────

/**
 * 리스트에 식당 추가.
 * users + shared_lists 동시 batch update.
 * 이미 존재하는 식당은 중복 추가하지 않음.
 */
export async function addRestaurantToList(
  uid: string,
  listId: string,
  shareToken: string,
  restaurant: Restaurant,
): Promise<void> {
  // 스냅샷 저장 — distance, isBye는 제외
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

  const userListRef = doc(db, 'users', uid, 'lists', listId);
  const sharedRef = doc(db, 'shared_lists', shareToken);

  // 중복 체크
  const snap = await getDoc(userListRef);
  const existing: Restaurant[] = snap.data()?.restaurants ?? [];
  if (existing.some((r) => r.id === restaurant.id)) return;

  const batch = writeBatch(db);
  batch.update(userListRef, {
    restaurants: arrayUnion(snapshot),
    updatedAt: serverTimestamp(),
  });
  batch.update(sharedRef, {
    restaurants: arrayUnion(snapshot),
  });
  await batch.commit();
}

/**
 * 리스트에서 식당 제거.
 * arrayRemove는 객체 deep-equal이 필요해서 현재 배열을 읽은 뒤 필터링.
 */
export async function removeRestaurantFromList(
  uid: string,
  listId: string,
  shareToken: string,
  restaurantId: string,
): Promise<void> {
  const userListRef = doc(db, 'users', uid, 'lists', listId);
  const sharedRef = doc(db, 'shared_lists', shareToken);

  const snap = await getDoc(userListRef);
  const restaurants: Restaurant[] = (snap.data()?.restaurants ?? []).filter(
    (r: Restaurant) => r.id !== restaurantId,
  );

  const batch = writeBatch(db);
  batch.update(userListRef, { restaurants, updatedAt: serverTimestamp() });
  batch.update(sharedRef, { restaurants });
  await batch.commit();
}

// ─── 수정 ───────────────────────────────────────────────────────────────────

/** 리스트 제목 수정 */
export async function updateListTitle(
  uid: string,
  listId: string,
  shareToken: string,
  title: string,
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', uid, 'lists', listId), {
    title,
    updatedAt: serverTimestamp(),
  });
  batch.update(doc(db, 'shared_lists', shareToken), { title });
  await batch.commit();
}

// ─── 삭제 ───────────────────────────────────────────────────────────────────

/**
 * 리스트 삭제.
 * users/{uid}/lists/{listId} + shared_lists/{shareToken} 동시 batch delete.
 * 고아 문서 방지.
 */
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
