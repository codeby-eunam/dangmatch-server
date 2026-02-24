'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTournamentStore } from '@/lib/store/tournament';
import { recordWin, recordTournamentHistory } from '@/lib/firebase/stats';
import { recordSchoolWin } from '@/lib/firebase/school-feeds';
import { useAuthStore } from '@/lib/store/auth';
import ListSelectorModal from '@/components/ListSelectorModal';

const YNU_DOMAIN = 'ynu';

export default function YnuResultPage() {
  const router = useRouter();
  const { finalWinner, swipedRestaurants, location, reset } = useTournamentStore();
  const { user } = useAuthStore();
  const [listModalOpen, setListModalOpen] = useState(false);
  const [savedToast, setSavedToast] = useState<string | null>(null);

  useEffect(() => {
    if (!finalWinner) {
      router.push('/yeungnam');
      return;
    }
    recordWin(finalWinner.id);
    recordTournamentHistory({
      uid: user?.uid ?? null,
      winnerId: finalWinner.id,
      winnerName: finalWinner.name,
      participants: swipedRestaurants.map((r) => r.id),
      location: location?.address ?? (location ? `${location.lat},${location.lng}` : ''),
    });
    // 영남대 피드에 우승 기록
    if (user?.uid) {
      recordSchoolWin(YNU_DOMAIN, user.uid, finalWinner);
    }
  }, [finalWinner, router]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!finalWinner) return null;

  const handleRestart = () => {
    reset();
    router.push('/yeungnam');
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(135deg, #FF9900 0%, #FF6600 100%)' }}
    >
      {/* 헤더 */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 flex items-center justify-center text-xs font-black"
            style={{ background: 'rgba(0,0,0,0.2)', color: '#FFFFFF', borderRadius: 4 }}
          >
            🏆
          </div>
          <span className="text-xs font-black tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.8)' }}>
            토너먼트 결과
          </span>
        </div>
        <button
          onClick={handleRestart}
          className="w-8 h-8 flex items-center justify-center font-black text-lg transition-opacity hover:opacity-70"
          style={{ background: 'rgba(0,0,0,0.2)', color: '#FFFFFF', borderRadius: '50%' }}
        >
          ✕
        </button>
      </header>

      {/* 메인 */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <h1
          className="font-black text-white text-center mb-2 leading-tight"
          style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', textShadow: '2px 2px 0 rgba(0,0,0,0.15)' }}
        >
          축하합니다!
        </h1>
        <p className="text-sm text-white mb-8 opacity-90 font-bold">
          최종 우승 메뉴를 찾았습니다
        </p>

        {/* 트로피 + 챔피언 배지 */}
        <div className="text-center mb-6">
          <div className="text-7xl mb-3">🏆</div>
          <div
            className="inline-block text-xs font-black tracking-widest uppercase px-4 py-1.5"
            style={{ background: '#1A1A1A', color: '#FF9900', borderRadius: 2 }}
          >
            챔피언
          </div>
        </div>

        {/* 우승 카드 */}
        <div
          className="w-full max-w-sm overflow-hidden"
          style={{ background: '#FFFFFF', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}
        >
          <div
            className="px-5 py-3 flex items-center justify-between"
            style={{ borderBottom: '1px solid #F0EDEA' }}
          >
            <span className="text-xs font-black tracking-widest uppercase" style={{ color: '#FF9900' }}>
              OVERALL WINNER
            </span>
            <span className="text-xs" style={{ color: '#8C8C8C' }}>
              {finalWinner.category.split('>').pop()?.trim()}
            </span>
          </div>

          {finalWinner.images?.[0] ? (
            <div className="w-full overflow-hidden" style={{ height: 200 }}>
              <img src={finalWinner.images[0]} alt={finalWinner.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-full flex items-center justify-center" style={{ height: 160, background: '#F5EDD0' }}>
              <span className="text-7xl">🏆</span>
            </div>
          )}

          <div className="px-5 py-5">
            <h2
              className="font-black mb-2 leading-tight"
              style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', color: '#1A1A1A' }}
            >
              {finalWinner.name}
            </h2>
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} style={{ color: '#FF9900', fontSize: 14 }}>★</span>
              ))}
              <span className="text-xs ml-1" style={{ color: '#8C8C8C' }}>최고의 선택</span>
            </div>
            <div className="flex items-start gap-2">
              <span style={{ color: '#FF9900', fontSize: 14, marginTop: 1 }}>📍</span>
              <p className="text-sm leading-relaxed" style={{ color: '#5C5C5C' }}>{finalWinner.address}</p>
            </div>
            {finalWinner.phone && (
              <div className="flex items-center gap-2 mt-2">
                <span style={{ color: '#FF9900', fontSize: 14 }}>📞</span>
                <p className="text-sm" style={{ color: '#5C5C5C' }}>{finalWinner.phone}</p>
              </div>
            )}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="w-full max-w-sm flex gap-2 mt-4">
          {finalWinner.kakaoUrl && (
            <a
              href={finalWinner.kakaoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-4 text-center text-sm font-black tracking-wider uppercase transition-opacity hover:opacity-80"
              style={{ background: '#1A1A1A', color: '#FFFFFF', borderRadius: 4 }}
            >
              🗺 지도 보기
            </a>
          )}
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: `오늘의 맛집: ${finalWinner.name}`, url: window.location.href });
              }
            }}
            className="flex-1 py-4 text-sm font-black tracking-wider uppercase transition-opacity hover:opacity-80"
            style={{ background: 'rgba(0,0,0,0.2)', color: '#FFFFFF', borderRadius: 4 }}
          >
            결과 공유
          </button>
        </div>

        <button
          onClick={() => setListModalOpen(true)}
          className="w-full max-w-sm mt-2 py-4 text-sm font-black tracking-wider uppercase transition-opacity hover:opacity-80"
          style={{ background: 'rgba(255,255,255,0.15)', color: '#FFFFFF', borderRadius: 4, border: '2px solid rgba(255,255,255,0.4)' }}
        >
          ★ 리스트에 저장
        </button>

        <button
          onClick={handleRestart}
          className="mt-5 text-sm font-bold transition-opacity hover:opacity-70"
          style={{ color: 'rgba(255,255,255,0.8)' }}
        >
          ↩ 다시 토너먼트 하기
        </button>
      </main>

      {listModalOpen && (
        <ListSelectorModal
          restaurant={finalWinner}
          onClose={() => setListModalOpen(false)}
          onSaved={(listTitle) => {
            setListModalOpen(false);
            setSavedToast(`"${listTitle}" 에 저장됨`);
            setTimeout(() => setSavedToast(null), 2500);
          }}
        />
      )}

      {savedToast && (
        <div
          className="fixed bottom-10 left-1/2 -translate-x-1/2 px-5 py-3 text-xs font-black tracking-wide z-50 pointer-events-none"
          style={{ background: '#1A1A1A', color: '#FF9900', borderRadius: 2, whiteSpace: 'nowrap' }}
        >
          ★ {savedToast}
        </div>
      )}
    </div>
  );
}
