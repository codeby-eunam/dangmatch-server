'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

// 탭바를 숨길 경로 (풀스크린 게임 화면)
const HIDDEN_PATHS = ['/swipe', '/tournament', '/result'];

const tabs = [
  {
    href: '/',
    label: '홈',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"
          stroke={active ? '#FF9900' : '#8C8C8C'}
          strokeWidth="2"
          strokeLinejoin="round"
          fill={active ? '#FF9900' : 'none'}
        />
        <path
          d="M9 21V12h6v9"
          stroke={active ? '#FFFFFF' : '#8C8C8C'}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    isActive: (path: string) => path === '/',
  },
  {
    href: '/school',
    label: '학교',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3L2 8l10 5 10-5-10-5z"
          stroke={active ? '#FF9900' : '#8C8C8C'}
          strokeWidth="2"
          strokeLinejoin="round"
          fill={active ? '#FF9900' : 'none'}
        />
        <path
          d="M6 11v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5"
          stroke={active ? '#FF9900' : '#8C8C8C'}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    isActive: (path: string) => path.startsWith('/school'),
  },
  {
    href: '/mypage/lists',
    label: '리스트',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2l2.09 6.26L21 9.27l-5 4.73 1.18 6.5L12 17.27l-5.18 3.23L8 14l-5-4.73 6.91-1.01L12 2z"
          stroke={active ? '#FF9900' : '#8C8C8C'}
          strokeWidth="2"
          strokeLinejoin="round"
          fill={active ? '#FF9900' : 'none'}
        />
      </svg>
    ),
    isActive: (path: string) => path.startsWith('/mypage/lists'),
  },
  {
    href: '/mypage',
    label: '마이',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle
          cx="12" cy="8" r="4"
          stroke={active ? '#FF9900' : '#8C8C8C'}
          strokeWidth="2"
          fill={active ? '#FF9900' : 'none'}
        />
        <path
          d="M4 20c0-4 3.58-7 8-7s8 3 8 7"
          stroke={active ? '#FF9900' : '#8C8C8C'}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    isActive: (path: string) => path === '/mypage',
  },
];

const UNDER_DEVELOPMENT_PATHS = ['/school'];

export default function BottomNav() {
  const pathname = usePathname();
  const [showDevAlert, setShowDevAlert] = useState(false);

  if (HIDDEN_PATHS.some((p) => pathname.startsWith(p))) return null;

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex"
        style={{
          background: '#FFFFFF',
          borderTop: '2px solid #1A1A1A',
          height: 60,
        }}
      >
        {tabs.map((tab) => {
          const active = tab.isActive(pathname);
          const isUnderDev = UNDER_DEVELOPMENT_PATHS.some((p) => tab.href.startsWith(p));

          if (isUnderDev) {
            return (
              <button
                key={tab.href}
                onClick={() => setShowDevAlert(true)}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-opacity hover:opacity-70"
              >
                {tab.icon(false)}
                <span
                  className="text-[10px] font-black tracking-widest"
                  style={{ color: '#8C8C8C' }}
                >
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-opacity hover:opacity-70"
            >
              {tab.icon(active)}
              <span
                className="text-[10px] font-black tracking-widest"
                style={{ color: active ? '#FF9900' : '#8C8C8C' }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {showDevAlert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowDevAlert(false)}
        >
          <div
            className="flex flex-col items-center gap-4 rounded-2xl p-8"
            style={{
              background: '#FFFFFF',
              border: '2px solid #1A1A1A',
              minWidth: 260,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <span style={{ fontSize: 36 }}>🚧</span>
            <p className="font-black text-base text-center" style={{ color: '#1A1A1A' }}>
              개발 중인 기능이에요
            </p>
            <p className="text-sm text-center" style={{ color: '#8C8C8C' }}>
              곧 만날 수 있어요. 조금만 기다려 주세요!
            </p>
            <button
              onClick={() => setShowDevAlert(false)}
              className="w-full rounded-xl py-3 font-black text-sm"
              style={{ background: '#FF9900', color: '#FFFFFF', border: '2px solid #1A1A1A' }}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
}
