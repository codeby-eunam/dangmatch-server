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
    <div className="min-h-screen flex flex-col" style={{ background: '#FFFDF9' }}>
      {/* 헤더 */}
      <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #F0EDEA' }}>
        <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: '#8C8C8C' }}>
          Dangmatch
        </span>
        <KakaoLoginButton />
      </header>

      {/* 메인 */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* 레드 태그 */}
        <div
          className="inline-block text-xs font-bold tracking-widest uppercase px-3 py-1 mb-8"
          style={{ background: '#FF4D2E', color: '#FFFDF9' }}
        >
          Editor&apos;s Pick
        </div>

        <h1
          className="text-6xl font-black leading-none mb-4 tracking-tight"
          style={{ color: '#1F1F1F' }}
        >
          오늘<br />뭐 먹지?
        </h1>

        <p className="text-base mb-10" style={{ color: '#8C8C8C' }}>
          토너먼트로 오늘의 맛집을 골라드립니다
        </p>

        {errorMsg && (
          <div
            className="mb-6 px-4 py-3 text-xs max-w-xs"
            style={{ background: '#F0EDEA', color: '#FF4D2E', border: '1px solid #FF4D2E' }}
          >
            {decodeURIComponent(errorMsg)}
          </div>
        )}

        {user && (
          <p className="text-sm mb-6 font-medium" style={{ color: '#FF4D2E' }}>
            {user.nickname}님, 반가워요
          </p>
        )}

        <button
          onClick={() => router.push('/location')}
          className="px-12 py-4 text-base font-bold tracking-widest uppercase transition-opacity hover:opacity-80"
          style={{ background: '#1F1F1F', color: '#FFFDF9' }}
        >
          시작하기
        </button>

        <div className="mt-16 flex items-center gap-4">
          <div style={{ width: 40, height: 1, background: '#F0EDEA' }} />
          <span className="text-xs tracking-widest" style={{ color: '#8C8C8C' }}>FOOD TOURNAMENT</span>
          <div style={{ width: 40, height: 1, background: '#F0EDEA' }} />
        </div>
      </main>
    </div>
  );
}
