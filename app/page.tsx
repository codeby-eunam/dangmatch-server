'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import KakaoLoginButton from '@/components/KakaoLoginButton';
import { useAuthStore } from '@/lib/store/auth';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const errorMsg = searchParams.get('error');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
      {/* 우상단 로그인 버튼 */}
      <div className="absolute top-4 right-4">
        <KakaoLoginButton />
      </div>

      <div className="text-center px-4">
        <h1 className="text-5xl font-bold mb-4">🍽️</h1>
        <h2 className="text-4xl font-bold mb-4">오늘 뭐 먹지?</h2>
        <p className="text-gray-600 mb-8">
          토너먼트로 결정하세요
        </p>
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl max-w-sm mx-auto">
            <p className="text-xs text-red-600 break-all">{decodeURIComponent(errorMsg)}</p>
          </div>
        )}
        {user && (
          <p className="text-sm text-purple-600 mb-4 font-medium">
            {user.nickname}님, 반가워요!
          </p>
        )}
        <button
          onClick={() => router.push('/location')}
          className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition shadow-lg"
        >
          시작하기
        </button>
      </div>
    </div>
  );
}
