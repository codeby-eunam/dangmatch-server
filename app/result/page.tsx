'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTournamentStore } from '@/lib/store/tournament';
import { recordWin, recordTournamentHistory } from '@/lib/firebase/stats';
import { useAuthStore } from '@/lib/store/auth';

export default function ResultPage() {
  const router = useRouter();
  const { finalWinner, swipedRestaurants, location, reset } = useTournamentStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!finalWinner) {
      router.push('/location');
      return;
    }
    // 우승 식당 winCount + winRate 갱신
    recordWin(finalWinner.id);
    // 토너먼트 히스토리 저장 (로그인 유저만)
    recordTournamentHistory({
      uid: user?.uid ?? null,
      winnerId: finalWinner.id,
      winnerName: finalWinner.name,
      participants: swipedRestaurants.map((r) => r.id),
      location: location?.address ?? (location ? `${location.lat},${location.lng}` : ''),
    });
  }, [finalWinner, router]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!finalWinner) return null;

  const handleRestart = () => {
    reset();
    router.push('/location');
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FFFDF9' }}>
      {/* 헤더 */}
      <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #F0EDEA' }}>
        <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: '#8C8C8C' }}>
          Dangmatch
        </span>
        <span
          className="text-xs font-bold tracking-widest uppercase px-2 py-0.5"
          style={{ background: '#FFB800', color: '#1F1F1F' }}
        >
          Editor&apos;s Choice
        </span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* 골드 우승 뱃지 */}
          <div className="text-center mb-8">
            <div
              className="inline-block text-xs font-black tracking-widest uppercase px-4 py-1.5 mb-6"
              style={{ background: '#FFB800', color: '#1F1F1F' }}
            >
              No. 1 Winner
            </div>
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#FF4D2E' }}>
              {finalWinner.category.split('>').pop()?.trim()}
            </p>
            <h1
              className="text-5xl font-black leading-none tracking-tight mb-2"
              style={{ color: '#1F1F1F' }}
            >
              {finalWinner.name}
            </h1>
          </div>

          {/* 정보 카드 */}
          <div className="p-5 mb-6" style={{ background: '#F0EDEA' }}>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <span className="text-xs font-bold tracking-widest uppercase w-12 flex-shrink-0 mt-0.5" style={{ color: '#FF4D2E' }}>주소</span>
                <p className="text-sm" style={{ color: '#1F1F1F' }}>{finalWinner.address}</p>
              </div>
              {finalWinner.phone && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold tracking-widest uppercase w-12 flex-shrink-0" style={{ color: '#FF4D2E' }}>전화</span>
                  <p className="text-sm" style={{ color: '#1F1F1F' }}>{finalWinner.phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="space-y-2">
            {finalWinner.kakaoUrl && (
              <a
                href={finalWinner.kakaoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-4 text-center text-sm font-bold tracking-widest uppercase transition-opacity hover:opacity-80"
                style={{ background: '#FFB800', color: '#1F1F1F' }}
              >
                카카오맵에서 보기
              </a>
            )}

            <button
              onClick={handleRestart}
              className="w-full py-4 text-sm font-bold tracking-widest uppercase transition-opacity hover:opacity-80"
              style={{ background: '#1F1F1F', color: '#FFFDF9' }}
            >
              다시 시작하기
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
