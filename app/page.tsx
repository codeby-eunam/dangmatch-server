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
    <div className="min-h-screen flex flex-col" style={{ background: '#F5EDD0' }}>
      {/* 헤더 */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 flex items-center justify-center text-base font-black"
            style={{ background: '#FF9900', color: '#FFFFFF', borderRadius: 4 }}
          >
            🍴
          </div>
          <span className="text-sm font-black tracking-[0.15em]" style={{ color: '#1A1A1A' }}>
            당맷치
          </span>
        </div>
        <KakaoLoginButton />
      </header>

      {/* 메인 */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center relative">
        {/* 배경 원형 장식 */}
        <div
          className="absolute"
          style={{
            width: 320,
            height: 320,
            border: '2px dashed rgba(255,153,0,0.25)',
            borderRadius: '50%',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -60%)',
          }}
        />

        {/* 서브 태그 */}
        <p className="text-xs font-bold tracking-widest mb-4" style={{ color: '#FF9900' }}>
          최고의 맛 결장전
        </p>

        {/* 메인 헤딩 */}
        <h1
          className="font-black leading-none mb-6 tracking-tight"
          style={{
            fontSize: 'clamp(4rem, 15vw, 8rem)',
            color: '#FF9900',
            textShadow: '4px 4px 0 rgba(0,0,0,0.15)',
            fontStyle: 'italic',
          }}
        >
          당맷치
        </h1>

        <p className="text-sm mb-8 max-w-xs leading-relaxed" style={{ color: '#5C4A1A' }}>
          가장 끌리는 맛을 골라보세요
        </p>

        {errorMsg && (
          <div
            className="mb-5 px-4 py-3 text-xs max-w-xs w-full"
            style={{ background: '#FFF0D0', color: '#CC4400', border: '1px solid #FF9900', borderRadius: 2 }}
          >
            {decodeURIComponent(errorMsg)}
          </div>
        )}

        {user && (
          <p className="text-sm mb-4 font-bold" style={{ color: '#FF9900' }}>
            {user.nickname}님, 반가워요 👋
          </p>
        )}

        {/* 시작 버튼 */}
        <button
          onClick={() => router.push('/location')}
          className="w-full max-w-xs py-4 text-base font-black tracking-widest uppercase transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] mb-4"
          style={{
            background: '#FF9900',
            color: '#FFFFFF',
            borderRadius: 4,
            boxShadow: '4px 4px 0 rgba(0,0,0,0.15)',
          }}
        >
          시작하기
        </button>
      </main>

      {/* 하단 이미지 띠 */}
      <div className="flex gap-1 overflow-hidden px-0 pb-0" style={{ height: 100 }}>
        {['🥩', '🍕', '🦞', '🍜'].map((emoji, i) => (
          <div
            key={i}
            className="flex-1 flex items-center justify-center text-5xl"
            style={{
              background: '#1A1A1A',
              filter: 'grayscale(1)',
              opacity: 0.8,
            }}
          >
            {emoji}
          </div>
        ))}
      </div>

      {/* 푸터 */}
      <footer
        className="flex items-center justify-between px-6 py-3 text-xs"
        style={{ borderTop: '1px solid #E8DDB8', color: '#8C8C8C' }}
      >
        <div className="flex gap-4">
          <span className="cursor-pointer hover:text-orange-500 transition-colors">랭킹</span>
          <span className="cursor-pointer hover:text-orange-500 transition-colors">맛집의 전당</span>
          <span className="cursor-pointer hover:text-orange-500 transition-colors">이용 방법</span>
        </div>
        <span style={{ color: '#C0A060' }}>© 당맛치</span>
      </footer>
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
