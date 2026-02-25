'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import KakaoLoginButton from '@/components/KakaoLoginButton';
import { useAuthStore } from '@/lib/store/auth';

function HomePageInner() {
  const router = useRouter();
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const errorMsg = searchParams.get('error');

  return (
    <div className="min-h-screen flex flex-col pb-[60px]" style={{ background: '#F8F9FA' }}>
      {/* 상단 위치 바 + 로그인 */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <div
          className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
        >
          <svg width="18" height="20" viewBox="0 0 18 20" fill="none">
            <path
              d="M9 0C5.13 0 2 3.13 2 7c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
              fill="#FF7F50"
            />
            <circle cx="9" cy="7" r="2.5" fill="#FFFFFF" />
          </svg>
          <span className="flex-1 text-sm font-medium" style={{ color: '#1a2a4a' }}>
            {user?.school?.name ? `${user.school.name} 근처` : '위치를 설정하세요'}
          </span>
          <button
            onClick={() => router.push('/location')}
            className="transition-opacity hover:opacity-70"
            aria-label="검색"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="#8C8C8C" strokeWidth="2" />
              <path d="M20 20l-3.5-3.5" stroke="#8C8C8C" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <KakaoLoginButton />
      </div>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* 음식 일러스트 카드 */}
        <div
          className="mb-8 flex items-center justify-center"
          style={{
            width: 260,
            height: 260,
            background: '#F5EDD0',
            borderRadius: 28,
            boxShadow: '0 12px 40px rgba(0,0,0,0.10)',
          }}
        >
          <span style={{ fontSize: 110 }}>🥗</span>
        </div>

        {errorMsg && (
          <div
            className="mb-5 px-4 py-3 text-xs max-w-xs w-full rounded-2xl"
            style={{ background: '#FFF0ED', color: '#CC4400', border: '1px solid #FF7F50' }}
          >
            {decodeURIComponent(errorMsg)}
          </div>
        )}

        {user && (
          <p className="text-sm mb-4 font-semibold" style={{ color: '#2EB8B8' }}>
            {user.nickname}님, 반가워요 👋
          </p>
        )}

        {/* 시작하기 버튼 */}
        <button
          onClick={() => router.push('/location')}
          className="w-full max-w-xs py-4 text-base font-bold transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] mb-3"
          style={{
            background: '#FF7F50',
            color: '#FFFFFF',
            borderRadius: 50,
            boxShadow: '0 6px 20px rgba(255,127,80,0.40)',
          }}
        >
          시작하기
        </button>

        <p className="text-sm font-semibold" style={{ color: '#FF7F50' }}>
          고민하지 말고, 맛있게!
        </p>
      </main>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense>
      <HomePageInner />
    </Suspense>
  );
}
