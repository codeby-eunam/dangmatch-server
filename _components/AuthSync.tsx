'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useAuthStore } from '@/lib/store/auth';

/**
 * Firebase Auth 상태와 Zustand 스토어를 동기화.
 * Firebase Auth 세션이 만료되면 Zustand의 user도 null로 초기화.
 */
export default function AuthSync() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        // Firebase Auth 세션 없음 → Zustand도 로그아웃 처리
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [setUser, setLoading]);

  return null;
}
