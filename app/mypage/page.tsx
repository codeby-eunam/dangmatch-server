'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { submitSchoolChangeReport } from '@/lib/firebase/users';

export default function MyPage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuthStore();

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSending, setReportSending] = useState(false);
  const [reportDone, setReportDone] = useState(false);


  const handleLogout = async () => {
    await signOut(auth);
    logout();
    router.push('/');
  };

  const handleSubmitReport = async () => {
    if (!user || !reportReason.trim()) return;
    setReportSending(true);
    try {
      await submitSchoolChangeReport(user.uid, reportReason.trim());
      setReportDone(true);
      setReportReason('');
      setTimeout(() => {
        setReportOpen(false);
        setReportDone(false);
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setReportSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5EDD0' }}>
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: '#FF9900', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-8" style={{ background: '#F5EDD0' }}>
        <span className="text-5xl">★</span>
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-xl font-black" style={{ color: '#1A1A1A' }}>
            로그인이 필요합니다
          </p>
          <p className="text-sm" style={{ color: '#5C5C5C' }}>
            내 프로필을 보려면 카카오 로그인을 해주세요!
          </p>
        </div>
        <button
          onClick={() => { window.location.href = '/api/auth/kakao'; }}
          className="flex items-center gap-2 px-6 py-3 text-sm font-black transition-opacity hover:opacity-80"
          style={{ background: '#FEE500', color: '#3C1E1E', borderRadius: 4 }}
        >
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path
              d="M9 1C4.582 1 1 3.857 1 7.382c0 2.24 1.467 4.204 3.683 5.355l-.94 3.506a.2.2 0 0 0 .303.221L8.19 13.93c.269.02.54.03.81.03 4.418 0 8-2.857 8-6.382C17 3.857 13.418 1 9 1Z"
              fill="#3C1E1E"
            />
          </svg>
          카카오 로그인
        </button>
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

      <main className="flex-1 px-6 py-8 flex flex-col gap-4">
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

        {/* 학교 정보 */}
        <section
          className="px-5 py-4"
          style={{ background: '#FFFFFF', border: '2px solid #1A1A1A', borderRadius: 2 }}
        >
          <p className="text-xs font-black tracking-widest uppercase mb-2" style={{ color: '#FF9900' }}>
            MY SCHOOL
          </p>
          {user.school ? (
            <div className="flex items-center justify-between">
              <p className="text-base font-black" style={{ color: '#1A1A1A' }}>
                {user.school.name}
              </p>
              <button
                onClick={() => setReportOpen(true)}
                className="text-xs font-bold transition-opacity hover:opacity-60"
                style={{ color: '#8C8C8C', textDecoration: 'underline' }}
              >
                학교 변경 건의하기
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: '#8C8C8C' }}>
                학교가 설정되지 않았습니다
              </p>
              <button
                onClick={() => router.push('/school-select')}
                className="text-xs font-black tracking-wider uppercase px-3 py-1 transition-opacity hover:opacity-80"
                style={{ background: '#FF9900', color: '#1A1A1A', borderRadius: 2 }}
              >
                학교 설정
              </button>
            </div>
          )}
        </section>

        {/* 학교 피드 바로가기 */}
        {user.school && (
          <button
            onClick={() => router.push('/school')}
            className="w-full px-5 py-4 text-left transition-opacity hover:opacity-80"
            style={{ background: '#FF9900', borderRadius: 2 }}
          >
            <p className="text-xs font-black tracking-widest uppercase" style={{ color: '#1A1A1A' }}>
              OUR SCHOOL
            </p>
            <p className="text-base font-black mt-0.5" style={{ color: '#1A1A1A' }}>
              우리 학교 맛집 랭킹 →
            </p>
          </button>
        )}

        {/* 내 리스트 바로가기 */}
        <button
          onClick={() => router.push('/mypage/lists')}
          className="w-full px-5 py-4 text-left transition-opacity hover:opacity-80"
          style={{ background: '#1A1A1A', borderRadius: 2 }}
        >
          <p className="text-xs font-black tracking-widest uppercase" style={{ color: '#FF9900' }}>
            MY LISTS
          </p>
          <p className="text-base font-black mt-0.5" style={{ color: '#FFFFFF' }}>
            내 맛집 리스트 보기 →
          </p>
        </button>
      </main>

      {/* 학교 변경 건의 모달 */}
      {reportOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => e.target === e.currentTarget && setReportOpen(false)}
        >
          <div
            className="w-full px-6 py-8 flex flex-col gap-4"
            style={{ background: '#F5EDD0', borderRadius: '12px 12px 0 0', border: '2px solid #1A1A1A' }}
          >
            <h2 className="font-black text-lg" style={{ color: '#1A1A1A' }}>
              학교 변경 건의하기
            </h2>
            <p className="text-sm" style={{ color: '#5C5C5C' }}>
              편입, 입력 오류 등 변경 사유를 적어주세요.<br />
              관리자가 확인 후 처리해 드립니다.
            </p>

            {reportDone ? (
              <div
                className="py-4 text-center font-black text-sm"
                style={{ background: '#FF9900', borderRadius: 4, color: '#1A1A1A' }}
              >
                건의가 접수되었습니다!
              </div>
            ) : (
              <>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="변경 사유를 입력해 주세요"
                  rows={4}
                  className="w-full px-4 py-3 text-sm outline-none resize-none"
                  style={{
                    background: '#FFFFFF',
                    border: '2px solid #1A1A1A',
                    borderRadius: 4,
                    color: '#1A1A1A',
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setReportOpen(false)}
                    className="flex-1 py-3 text-sm font-black"
                    style={{ background: '#D0CABC', borderRadius: 4, color: '#5C5C5C' }}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSubmitReport}
                    disabled={!reportReason.trim() || reportSending}
                    className="flex-1 py-3 text-sm font-black transition-opacity"
                    style={{
                      background: reportReason.trim() ? '#1A1A1A' : '#D0CABC',
                      borderRadius: 4,
                      color: reportReason.trim() ? '#FF9900' : '#8C8C8C',
                      opacity: reportSending ? 0.7 : 1,
                    }}
                  >
                    {reportSending ? '전송 중...' : '건의 보내기'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
