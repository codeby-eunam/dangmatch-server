'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

export default function MyPage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  const handleLogout = async () => {
    await signOut(auth);
    logout();
    router.push('/');
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5EDD0' }}>
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: '#FF9900', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5EDD0' }}>
      {/* 헤더 */}
      <header style={{ borderBottom: '2px solid #1A1A1A' }}>
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center font-black text-base transition-opacity hover:opacity-60"
            style={{ border: '2px solid #1A1A1A', borderRadius: 2, color: '#1A1A1A' }}
          >
            ←
          </button>
          <span className="text-xs font-black tracking-widest uppercase" style={{ color: '#1A1A1A' }}>
            MY PAGE
          </span>
          <button
            onClick={handleLogout}
            className="text-xs font-black tracking-widest uppercase transition-opacity hover:opacity-60"
            style={{ color: '#8C8C8C' }}
          >
            로그아웃
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        {/* 유저 프로필 */}
        <section
          className="flex items-center gap-4 px-5 py-5"
          style={{ background: '#1A1A1A', borderRadius: 2 }}
        >
          <div
            className="w-14 h-14 flex-shrink-0 flex items-center justify-center font-black text-2xl"
            style={{ background: '#FF9900', color: '#FFFFFF', borderRadius: '50%' }}
          >
            {user.nickname?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black tracking-widest uppercase" style={{ color: '#FF9900' }}>
              MEMBER
            </p>
            <p className="text-lg font-black truncate" style={{ color: '#FFFFFF' }}>
              {user.nickname}
            </p>
            {user.email && (
              <p className="text-xs truncate" style={{ color: '#8C8C8C' }}>
                {user.email}
              </p>
            )}
          </div>
        </section>
      </main>

      {/* 하단 텍스트 */}
      <div className="py-2 overflow-hidden" style={{ background: '#1A1A1A' }}>
        <div className="flex gap-8 text-xs font-black tracking-widest uppercase" style={{ color: '#F5EDD0' }}>
          {Array(6).fill('★ MY PAGE ★ RETRO FOOD PICKER ★ 당겨먹자').map((text, i) => (
            <span key={i} className="whitespace-nowrap">{text}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
