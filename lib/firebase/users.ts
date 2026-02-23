import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './client';

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
