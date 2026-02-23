'use client';

import { useAuthStore } from '@/lib/store/auth';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

export default function KakaoLoginButton() {
  const { user, logout } = useAuthStore();

  const handleLogin = () => {
    window.location.href = '/api/auth/kakao';
  };

  const handleLogout = async () => {
    await signOut(auth);
    logout();
  };

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs" style={{ color: '#8C8C8C' }}>{user.nickname}님</span>
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-60"
          style={{ border: '1px solid #F0EDEA', color: '#8C8C8C', background: 'transparent' }}
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      className="flex items-center gap-2 px-3 py-2 text-xs font-bold transition-opacity hover:opacity-80"
      style={{ background: '#FEE500', color: '#3C1E1E' }}
    >
      <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
        <path
          d="M9 1C4.582 1 1 3.857 1 7.382c0 2.24 1.467 4.204 3.683 5.355l-.94 3.506a.2.2 0 0 0 .303.221L8.19 13.93c.269.02.54.03.81.03 4.418 0 8-2.857 8-6.382C17 3.857 13.418 1 9 1Z"
          fill="#3C1E1E"
        />
      </svg>
      카카오 로그인
    </button>
  );
}
