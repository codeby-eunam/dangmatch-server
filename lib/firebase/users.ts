import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  addDoc,
} from 'firebase/firestore';
import { db } from './client';
import type { School } from '@/types';

interface UpsertUserParams {
  uid: string;          // Firebase UID (= 카카오 사용자 ID)
  nickname: string;
  profileImage?: string;
  email?: string;
}

/**
 * 카카오 로그인 성공 시 Firestore users/{uid} 에 유저 정보 upsert.
 * - 처음 로그인이면 createdAt 기록
 * - 재로그인이면 nickname/profileImage 갱신, createdAt 유지 (merge: true)
 * - school 필드는 건드리지 않음 (별도 setUserSchool 함수로만 설정)
 */
export async function upsertUser({ uid, nickname, profileImage, email }: UpsertUserParams): Promise<void> {
  const ref = doc(db, 'users', uid);
  await setDoc(
    ref,
    {
      uid,
      kakaoId: uid, // Firebase custom token UID = 카카오 사용자 ID
      nickname,
      ...(profileImage && { profileImage }),
      ...(email && { email }),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * 유저의 학교 정보 조회. 설정 전이면 null 반환.
 */
export async function getUserSchool(uid: string): Promise<School | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return data.school ?? null;
}

/**
 * 학교 1회 설정. 이미 설정된 경우 덮어쓰기 금지 (서버 측 보안은 Firestore rules 로 별도 처리).
 */
export async function setUserSchool(uid: string, school: School): Promise<void> {
  const ref = doc(db, 'users', uid);
  await setDoc(
    ref,
    {
      school,
      schoolSetAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * 학교 변경 건의 — reports/{uid} 에 사유 저장.
 * 관리자가 Firebase 콘솔에서 직접 확인 후 처리.
 */
export async function submitSchoolChangeReport(uid: string, reason: string): Promise<void> {
  await addDoc(collection(db, 'reports'), {
    uid,
    type: 'school_change',
    reason,
    createdAt: serverTimestamp(),
  });
}
