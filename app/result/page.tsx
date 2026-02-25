'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTournamentStore } from '@/lib/store/tournament';
import { recordWin, recordTournamentHistory } from '@/lib/firebase/stats';
import { useAuthStore } from '@/lib/store/auth';

// 컨페티 아이템 설정
const CONFETTI = [
  { left: '8%',  top: '12%', size: 12, color: '#FF7F50', shape: 'square',  rotate: 30  },
  { left: '18%', top: '6%',  size: 8,  color: '#FFD700', shape: 'diamond', rotate: 45  },
  { left: '30%', top: '18%', size: 6,  color: '#FF7F50', shape: 'circle',  rotate: 0   },
  { left: '78%', top: '8%',  size: 10, color: '#FFD700', shape: 'square',  rotate: 20  },
  { left: '88%', top: '15%', size: 8,  color: '#FF7F50', shape: 'diamond', rotate: 60  },
  { left: '92%', top: '30%', size: 6,  color: '#AAF0D1', shape: 'circle',  rotate: 0   },
  { left: '5%',  top: '40%', size: 10, color: '#FFD700', shape: 'diamond', rotate: 15  },
  { left: '12%', top: '55%', size: 8,  color: '#FF7F50', shape: 'square',  rotate: 45  },
  { left: '85%', top: '50%', size: 12, color: '#FFD700', shape: 'square',  rotate: 30  },
  { left: '95%', top: '65%', size: 6,  color: '#FF7F50', shape: 'circle',  rotate: 0   },
  { left: '7%',  top: '75%', size: 8,  color: '#AAF0D1', shape: 'diamond', rotate: 45  },
  { left: '90%', top: '80%', size: 10, color: '#FFD700', shape: 'diamond', rotate: 20  },
  { left: '20%', top: '88%', size: 6,  color: '#FF7F50', shape: 'square',  rotate: 60  },
  { left: '75%', top: '90%', size: 8,  color: '#FFD700', shape: 'circle',  rotate: 0   },
  { left: '50%', top: '5%',  size: 7,  color: '#FF7F50', shape: 'diamond', rotate: 30  },
  { left: '60%', top: '92%', size: 9,  color: '#AAF0D1', shape: 'square',  rotate: 15  },
];

function ConfettiPiece({ left, top, size, color, shape, rotate }: {
  left: string; top: string; size: number; color: string; shape: string; rotate: number;
}) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left,
    top,
    width: size,
    height: size,
    background: color,
    opacity: 0.75,
    pointerEvents: 'none',
    transform: shape === 'diamond' ? `rotate(45deg)` : `rotate(${rotate}deg)`,
    borderRadius: shape === 'circle' ? '50%' : shape === 'square' ? 2 : 0,
  };
  return <div style={style} />;
}

export default function ResultPage() {
  const router = useRouter();
  const { finalWinner, swipedRestaurants, location, reset } = useTournamentStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!finalWinner) {
      router.push('/location');
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
<<<<<<< Updated upstream
=======
    if (user?.uid && user.school?.domain) {
      recordSchoolWin(user.school.domain, user.uid, finalWinner);
    }
>>>>>>> Stashed changes
  }, [finalWinner, router]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!finalWinner) return null;

  const handleRestart = () => {
    reset();
    router.push('/location');
  };

  const categoryLabel = finalWinner.category.split('>').pop()?.trim();

  return (
    <div
      className="min-h-screen flex flex-col items-center relative overflow-hidden"
      style={{ background: '#F8F9FA' }}
    >
      {/* 컨페티 */}
      {CONFETTI.map((c, i) => (
        <ConfettiPiece key={i} {...c} />
      ))}

      {/* 다시하기 버튼 */}
      <div className="relative z-10 mt-10 mb-2">
        <button
          onClick={handleRestart}
          className="px-6 py-2.5 text-sm font-semibold rounded-full transition-opacity hover:opacity-70"
          style={{
            background: '#FFFFFF',
            color: '#1a2a4a',
            boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
          }}
        >
          다시하기
        </button>
      </div>

      {/* 타이틀 */}
      <div className="relative z-10 text-center px-6 mb-6">
        <p className="text-sm font-bold mb-2" style={{ color: '#FF7F50' }}>
          오늘의 우승!
        </p>
        <h1 className="text-2xl font-black leading-snug" style={{ color: '#1a2a4a' }}>
          당신의 완벽한 한 끼를<br />찾았어요.
        </h1>
      </div>

      {/* 우승 카드 영역 */}
      <div className="relative z-10 w-full max-w-sm px-5">
        {/* 왕관 배지 */}
        <div className="flex justify-center mb-[-22px] relative z-10">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
            style={{
              background: '#FFD700',
              boxShadow: '0 4px 16px rgba(255,215,0,0.50)',
            }}
          >
            👑
          </div>
        </div>

        {/* 카드 */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }}
        >
          {/* 이미지 영역 */}
          <div className="relative" style={{ height: 220 }}>
            {finalWinner.images?.[0] ? (
              <>
                <img
                  src={finalWinner.images[0]}
                  alt={finalWinner.name}
                  className="w-full h-full object-cover"
                />
                {/* WINNER 텍스트 오버레이 */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center"
                  style={{ background: 'rgba(30,92,92,0.55)' }}
                >
                  <p className="text-white font-black text-xl tracking-widest">WINNER</p>
                  {categoryLabel && (
                    <p className="text-white text-xs opacity-70 mt-1">{categoryLabel}</p>
                  )}
                </div>
              </>
            ) : (
              <div
                className="w-full h-full flex flex-col items-center justify-center"
                style={{ background: '#1E5C5C' }}
              >
                <p className="text-white font-black text-xl tracking-widest mb-2">WINNER</p>
                <span className="text-6xl">🏆</span>
              </div>
            )}
          </div>

          {/* 정보 */}
          <div className="px-5 py-5">
            {/* 별점 (장식) */}
            <div className="flex items-center gap-1 mb-2">
              <span style={{ color: '#FFD700', fontSize: 14 }}>★</span>
              <span className="text-sm font-bold" style={{ color: '#1a2a4a' }}>4.9</span>
              <span className="text-xs" style={{ color: '#8C8C8C' }}>(200+)</span>
            </div>

            <h2 className="text-2xl font-black mb-2" style={{ color: '#1a2a4a' }}>
              {finalWinner.name}
            </h2>

            <p className="text-sm leading-relaxed" style={{ color: '#8C8C8C' }}>
              {finalWinner.address || '오늘 당신을 위한 최고의 선택입니다.'}
            </p>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col gap-3 mt-5 mb-8">
          {finalWinner.kakaoUrl ? (
            <a
              href={finalWinner.kakaoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 text-center text-base font-bold rounded-2xl transition-opacity hover:opacity-80"
              style={{
                background: '#FF7F50',
                color: '#FFFFFF',
                boxShadow: '0 6px 20px rgba(255,127,80,0.35)',
              }}
            >
              지도 보기 (Go Eat)
            </a>
          ) : (
            <button
              onClick={() => router.push('/location')}
              className="w-full py-4 text-base font-bold rounded-2xl transition-opacity hover:opacity-80"
              style={{
                background: '#FF7F50',
                color: '#FFFFFF',
                boxShadow: '0 6px 20px rgba(255,127,80,0.35)',
              }}
            >
              지도 보기 (Go Eat)
            </button>
          )}

          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: `오늘의 맛집: ${finalWinner.name}`, url: window.location.href });
              } else {
                setListModalOpen(true);
              }
            }}
            className="w-full py-4 text-base font-semibold rounded-2xl transition-opacity hover:opacity-80"
            style={{
              background: '#FFFFFF',
              color: '#1a2a4a',
              border: '1.5px solid #E0E0E0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            공유하기 (Share)
          </button>

          <button
            onClick={() => setListModalOpen(true)}
            className="w-full py-3 text-sm font-semibold rounded-2xl transition-opacity hover:opacity-80"
            style={{
              background: '#E6F7F7',
              color: '#2EB8B8',
            }}
          >
            ★ 즐겨찾기에 저장
          </button>
        </div>
      </div>

<<<<<<< Updated upstream
        {/* 재시작 링크 */}
        <button
          onClick={handleRestart}
          className="mt-5 text-sm font-bold transition-opacity hover:opacity-70"
          style={{ color: 'rgba(255,255,255,0.8)' }}
        >
          ↩ 다시 토너먼트 하기
        </button>
      </main>
=======
      {/* 즐겨찾기 모달 */}
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

      {/* 저장 토스트 */}
      {savedToast && (
        <div
          className="fixed bottom-10 left-1/2 -translate-x-1/2 px-5 py-3 text-sm font-semibold z-50 pointer-events-none rounded-xl"
          style={{ background: '#1a2a4a', color: '#FFFFFF', whiteSpace: 'nowrap' }}
        >
          {savedToast}
        </div>
      )}
>>>>>>> Stashed changes
    </div>
  );
}
