'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

// 탭바를 숨길 경로 (풀스크린 게임 화면)
const HIDDEN_PATHS = ['/swipe', '/tournament', '/result', '/yeungnam'];

const tabs = [
  {
    href: '/',
    label: '홈',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"
          stroke={active ? '#FF7F50' : '#8C8C8C'}
          strokeWidth="2"
          strokeLinejoin="round"
          fill={active ? '#FF7F50' : 'none'}
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
    href: '/area-search',
    label: '탐색',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle
          cx="11" cy="11" r="7"
          stroke={active ? '#FF7F50' : '#8C8C8C'}
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M20 20l-3.5-3.5"
          stroke={active ? '#FF7F50' : '#8C8C8C'}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M11 8v6M8 11h6"
          stroke={active ? '#FF7F50' : '#8C8C8C'}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    isActive: (path: string) => path.startsWith('/area-search'),
  },
  {
    href: '/mypage/lists',
    label: '찜',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
          stroke={active ? '#FF7F50' : '#8C8C8C'}
          strokeWidth="2"
          strokeLinejoin="round"
          fill={active ? '#FF7F50' : 'none'}
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
          stroke={active ? '#FF7F50' : '#8C8C8C'}
          strokeWidth="2"
          fill={active ? '#FF7F50' : 'none'}
        />
        <path
          d="M4 20c0-4 3.58-7 8-7s8 3 8 7"
          stroke={active ? '#FF7F50' : '#8C8C8C'}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    isActive: (path: string) => path === '/mypage',
  },
];

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
          borderTop: '1px solid #F0F0F0',
          height: 60,
          boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
        }}
      >
        {tabs.map((tab) => {
          const active = tab.isActive(pathname);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-opacity hover:opacity-70"
            >
              {tab.icon(active)}
              <span
                className="text-[10px] font-semibold"
                style={{ color: active ? '#FF7F50' : '#8C8C8C' }}
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
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setShowDevAlert(false)}
        >
          <div
            className="flex flex-col items-center gap-4 rounded-3xl p-8"
            style={{
              background: '#FFFFFF',
              minWidth: 260,
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <span style={{ fontSize: 36 }}>🚧</span>
            <p className="font-bold text-base text-center" style={{ color: '#1a2a4a' }}>
              개발 중인 기능이에요
            </p>
            <p className="text-sm text-center" style={{ color: '#8C8C8C' }}>
              곧 만날 수 있어요. 조금만 기다려 주세요!
            </p>
            <button
              onClick={() => setShowDevAlert(false)}
              className="w-full rounded-2xl py-3 font-bold text-sm"
              style={{ background: '#FF7F50', color: '#FFFFFF' }}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
}
