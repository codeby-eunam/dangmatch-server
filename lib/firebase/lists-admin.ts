/**
 * lists.ts — Firebase Admin SDK 사용 (서버 전용)
 *
 * Next.js API 라우트에서 호출되며, Admin SDK는 Firestore 보안 규칙을
 * 우회하므로 별도 인증 없이 users/{uid}/lists 를 안전하게 읽기·쓰기 가능.
 */
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { nanoid } from 'nanoid';
import { getAdminDb } from './admin';
import type { Restaurant, RestaurantList, SharedList } from '@/types';

// ─── 내부 유틸 ──────────────────────────────────────────────────────────────

function toISO(ts: unknown): string {
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  if (ts instanceof Date) return ts.toISOString();
  return new Date().toISOString();
}

/**
 * shared_lists 에서 충돌하지 않는 8자리 토큰 생성.
 * shared_lists 는 이제 토큰 → uid/listId 맵핑 전용.
 */
async function generateUniqueToken(): Promise<string> {
  const db = getAdminDb();
  for (let i = 0; i < 5; i++) {
    const token = nanoid(8);
    const snap = await db.collection('shared_lists').doc(token).get();
    if (!snap.exists) return token;
  }
  throw new Error('[lists] shareToken 생성 실패: 5회 충돌');
}

// ─── 조회 ───────────────────────────────────────────────────────────────────

/** 유저의 모든 리스트 (최신순) */
export async function getUserLists(uid: string): Promise<RestaurantList[]> {
  const db = getAdminDb();
  const snap = await db
    .collection('users').doc(uid)
    .collection('lists')
    .orderBy('updatedAt', 'desc')
    .get();

  return snap.docs
    .filter((d) => !d.data().deleted)
    .map((d) => {
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

/** 특정 리스트 조회 (편집용) */
export async function getList(uid: string, listId: string): Promise<RestaurantList | null> {
  const db = getAdminDb();
  const snap = await db.collection('users').doc(uid).collection('lists').doc(listId).get();
  if (!snap.exists) return null;
  const data = snap.data()!;
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

/**
 * 공개 열람 — 비로그인 가능.
 * shared_lists/{token} 에서 ownerUid/listId 조회 후
 * users/{uid}/lists/{listId} 에서 실제 데이터를 읽는다.
 */
export async function getSharedList(shareToken: string): Promise<SharedList | null> {
  const db = getAdminDb();

  // 1단계: 토큰 → uid/listId
  const tokenSnap = await db.collection('shared_lists').doc(shareToken).get();
  if (!tokenSnap.exists) return null;
  const { ownerUid, listId } = tokenSnap.data()!;

  // 2단계: 실제 리스트 (isPublic 확인)
  const listSnap = await db.collection('users').doc(ownerUid).collection('lists').doc(listId).get();
  if (!listSnap.exists) return null;
  const data = listSnap.data()!;
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
 * 새 리스트 생성 (초기 식당 포함 가능).
 * - users/{uid}/lists/{listId} : 전체 데이터 (단일 진실 원천)
 * - shared_lists/{shareToken}  : 토큰 맵핑 전용
 */
export async function createListWithPlaces(
  uid: string,
  title: string,
  initialRestaurants: Restaurant[] = [],
): Promise<RestaurantList> {
  const db = getAdminDb();
  const shareToken = await generateUniqueToken();
  const listRef = db.collection('users').doc(uid).collection('lists').doc();
  const now = FieldValue.serverTimestamp();

  const batch = db.batch();
  batch.set(listRef, {
    title,
    restaurants: initialRestaurants,
    isPublic: false,
    shareToken,
    createdAt: now,
    updatedAt: now,
  });
  batch.set(db.collection('shared_lists').doc(shareToken), {
    ownerUid: uid,
    listId: listRef.id,
  });
  await batch.commit();

  return {
    id: listRef.id,
	ownerUid: uid,
    title,
    restaurants: initialRestaurants,
    isPublic: false,
    shareToken,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/** 빈 리스트 생성 (하위 호환) */
export async function createList(uid: string, title: string): Promise<RestaurantList> {
  return createListWithPlaces(uid, title, []);
}

// ─── 식당 추가 / 제거 ────────────────────────────────────────────────────────

/**
 * 리스트에 식당 추가.
 * users/{uid}/lists/{listId} 한 곳만 갱신.
 */
export async function addRestaurantToList(
  uid: string,
  listId: string,
  restaurant: Restaurant,
): Promise<void> {
  const db = getAdminDb();
  const listRef = db.collection('users').doc(uid).collection('lists').doc(listId);

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

  // 중복 체크
  const snap = await listRef.get();
  const data = snap.data()!;
  const existing: Restaurant[] = data.restaurants ?? [];
  if (existing.some((r) => r.id === restaurant.id)) return;

  const newRestaurants = [...existing, snapshot];
  const batch = db.batch();
  batch.update(listRef, {
	restaurants: newRestaurants,
	updatedAt: FieldValue.serverTimestamp(),
  });
  if (data.isPublic) {
	batch.update(db.collection('public_lists').doc(listId), { restaurants: newRestaurants, updatedAt: FieldValue.serverTimestamp() });
  }
  await batch.commit();
}

/**
 * 리스트에서 식당 제거.
 * arrayRemove는 deep-equal이 필요하므로 현재 배열을 읽어 필터링.
 */
export async function removeRestaurantFromList(
  uid: string,
  listId: string,
  restaurantId: string,
): Promise<void> {
  const db = getAdminDb();
  const listRef = db.collection('users').doc(uid).collection('lists').doc(listId);

  const snap = await listRef.get();
  const data = snap.data()!;
  const restaurants: Restaurant[] = (data.restaurants ?? []).filter(
    (r: Restaurant) => r.id !== restaurantId,
  );
  
  const batch = db.batch();
  batch.update(listRef, { restaurants, updatedAt: FieldValue.serverTimestamp() });
  if (data.isPublic) {
	batch.update(db.collection('public_lists').doc(listId), { restaurants, updatedAt: FieldValue.serverTimestamp() });
  }

  await batch.commit();
}

// ─── 수정 ───────────────────────────────────────────────────────────────────

/** 리스트 제목 수정 */
export async function updateListTitle(
  uid: string,
  listId: string,
  title: string,
): Promise<void> {
  const db = getAdminDb();
  const listRef = db.collection('users').doc(uid).collection('lists').doc(listId);

  const snap = await listRef.get();
  const data = snap.data()!;

  const batch = db.batch();
  batch.update(listRef, {
	title,
	updatedAt: FieldValue.serverTimestamp(),
  });

  if (data.isPublic) {
	const publicRef = db.collection('public_lists').doc(listId);
	batch.update(publicRef, {
	  title,
	  updatedAt: FieldValue.serverTimestamp(),
	});
  }

  await batch.commit();
}

// ─── 공개 전환 ───────────────────────────────────────────────────────────────

export async function togglePublicStatus(
  uid: string,
  listId: string,
  isPublic: boolean,
): Promise<void> {
  const db = getAdminDb();
  const listRef = db.collection('users').doc(uid).collection('lists').doc(listId);
  const publicRef = db.collection('public_lists').doc(listId);
  // get을 먼저!
  const snap = await listRef.get();
  const data = snap.data()!;
  const batch = db.batch();

  batch.update(listRef, {
    isPublic,
    updatedAt: FieldValue.serverTimestamp(),
  });

  if (isPublic) {
    batch.set(publicRef, {
      ownerUid: uid,
      title: data.title,
      restaurants: data.restaurants,
      shareToken: data.shareToken,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    batch.delete(publicRef);
  }

  await batch.commit();
}

export async function getPublicLists() {
  const db = getAdminDb();
  const snap = await db
    .collection('public_lists')
    .orderBy('updatedAt', 'desc')
    .limit(100)
    .get();

  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ownerUid: data.ownerUid,
      title: data.title ?? '',
      restaurants: data.restaurants ?? [],
      shareToken: data.shareToken ?? '',
      updatedAt: toISO(data.updatedAt),
    };
  });
}

// ─── 삭제 ───────────────────────────────────────────────────────────────────

/**
 * 리스트 소프트 삭제 (deleted: true).
 * 문서는 유지하되 조회에서 제외됨.
 * 공개 상태였다면 public_lists·shared_lists 에서도 제거.
 */
export async function deleteList(
  uid: string,
  listId: string,
): Promise<void> {
  const db = getAdminDb();
  const listRef = db.collection('users').doc(uid).collection('lists').doc(listId);

  const snap = await listRef.get();
  const data = snap.data();

  const batch = db.batch();
  batch.update(listRef, { deleted: true, updatedAt: FieldValue.serverTimestamp() });

  if (data?.isPublic) {
    batch.delete(db.collection('public_lists').doc(listId));
  }
  if (data?.shareToken) {
    batch.delete(db.collection('shared_lists').doc(data.shareToken));
  }

  await batch.commit();
}
