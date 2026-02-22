'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { upsertUser } from '@/lib/firebase/users';
import { useAuthStore } from '@/lib/store/auth';

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setLoading } = useAuthStore();
  const processed = useRef(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const token = searchParams.get('token');
    const nickname = searchParams.get('nickname') ?? '사용자';

    if (!token) {
      setErrorMsg('token 없음 - 카카오 콜백에서 token이 전달되지 않았습니다.');
      return;
    }

    (async () => {
      try {
        const credential = await signInWithCustomToken(auth, token);
        const { uid } = credential.user;
        setUser({ uid, nickname });
        upsertUser({ uid, nickname }).catch((err) =>
          console.error('[Firestore 유저 저장 실패]', err)
        );
        router.replace('/');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[Firebase 로그인 오류]', err);
        setErrorMsg(`Firebase 오류: ${message}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [searchParams, router, setUser, setLoading]);

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <div className="bg-white rounded-2xl shadow p-6 max-w-lg w-full">
          <h2 className="text-red-500 font-bold text-lg mb-3">로그인 오류</h2>
          <pre className="text-sm text-gray-700 whitespace-pre-wrap break-all bg-gray-50 p-3 rounded-lg">
            {errorMsg}
          </pre>
          <button
            onClick={() => router.replace('/')}
            className="mt-4 px-4 py-2 bg-gray-200 rounded-lg text-sm"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">로그인 처리 중...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">로그인 처리 중...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
