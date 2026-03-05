'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://dangmatch-y7al.vercel.app';
const APP_SCHEME = 'dangmatch';

export default function SharePage() {
  const { shareToken } = useParams<{ shareToken: string }>();

  useEffect(() => {
    const deepLink = `${APP_SCHEME}://share-detail?shareToken=${shareToken}`;

    // 딥링크 시도
    window.location.href = deepLink;

    // 앱 없으면 2초 후 웹으로 fallback
    const timer = setTimeout(() => {
      window.location.href = APP_URL;
    }, 2000);

    return () => clearTimeout(timer);
  }, [shareToken]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p>잠시만 기다려주세요...</p>
    </div>
  );
}