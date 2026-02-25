'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTournamentStore } from '@/lib/store/tournament';
import { recordTournamentEntry } from '@/lib/firebase/stats';
import type { Restaurant } from '@/types';

const BYE_CARD: Restaurant = {
  id: 'bye',
  name: 'BYE',
  category: '',
  address: '',
  phone: '',
  lat: 0,
  lng: 0,
  isBye: true,
};

function getCategoryEmoji(category: string) {
  const cat = category.toLowerCase();
  if (cat.includes('카페') || cat.includes('커피')) return '☕';
  if (cat.includes('한식')) return '🍚';
  if (cat.includes('일식') || cat.includes('초밥')) return '🍣';
  if (cat.includes('중식')) return '🥡';
  if (cat.includes('양식') || cat.includes('파스타')) return '🍝';
  if (cat.includes('치킨')) return '🍗';
  if (cat.includes('피자')) return '🍕';
  if (cat.includes('버거') || cat.includes('햄버거')) return '🍔';
  if (cat.includes('분식') || cat.includes('떡볶이')) return '🍢';
  if (cat.includes('고기') || cat.includes('삼겹')) return '🥩';
  return '🍽️';
}

interface MatchSnapshot {
  matchIndex: number;
  winners: Restaurant[];
}

export default function TournamentPage() {
  const router = useRouter();
  const { restaurants: allRestaurants, swipedRestaurants, setFinalWinner } = useTournamentStore();
  const restaurants = swipedRestaurants.length > 0 ? swipedRestaurants : allRestaurants;

  const [currentRound, setCurrentRound] = useState<Restaurant[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [nextRoundWinners, setNextRoundWinners] = useState<Restaurant[]>([]);
  const [selectedSide, setSelectedSide] = useState<'left' | 'right' | null>(null);
  const [history, setHistory] = useState<MatchSnapshot[]>([]);

  useEffect(() => {
    if (restaurants.length === 0) {
      router.push('/location');
      return;
    }
    const shuffled = [...restaurants].sort(() => Math.random() - 0.5);
    if (shuffled.length % 2 !== 0) shuffled.push(BYE_CARD);
    setCurrentRound(shuffled);
    setCurrentMatchIndex(0);
    setNextRoundWinners([]);
    restaurants.forEach((r) => {
      if (!r.isBye) recordTournamentEntry(r.id);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getRoundName = () => {
    const total = currentRound.length;
    if (total === 2) return '결승전';
    if (total === 4) return '준결승';
    if (total === 8) return '8강전';
    if (total === 16) return '16강전';
    if (total === 32) return '32강전';
    return `${total}강전`;
  };

  const totalMatches = currentRound.length / 2;
  const r1 = currentRound[currentMatchIndex * 2];
  const r2 = currentRound[currentMatchIndex * 2 + 1];

  const handleSelectWinner = useCallback(
    (winner: Restaurant) => {
      setHistory((prev) => [...prev, { matchIndex: currentMatchIndex, winners: nextRoundWinners }]);
      const newWinners = [...nextRoundWinners, winner];
      const newMatchIndex = currentMatchIndex + 1;

      if (newMatchIndex >= totalMatches) {
        if (newWinners.length === 1) {
          setFinalWinner(newWinners[0]);
          router.push('/result');
        } else {
          const nextRound = [...newWinners].sort(() => Math.random() - 0.5);
          if (nextRound.length % 2 !== 0) nextRound.push(BYE_CARD);
          setCurrentRound(nextRound);
          setCurrentMatchIndex(0);
          setNextRoundWinners([]);
          setHistory([]);
        }
      } else {
        setCurrentMatchIndex(newMatchIndex);
        setNextRoundWinners(newWinners);
      }
      setSelectedSide(null);
    },
    [currentMatchIndex, nextRoundWinners, totalMatches, router, setFinalWinner]
  );

  const handleConfirm = () => {
    if (!selectedSide) return;
    const winner = selectedSide === 'left' ? r1 : r2;
    if (winner && !winner.isBye) handleSelectWinner(winner);
  };

  const handleGoBack = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory((h) => h.slice(0, -1));
      setCurrentMatchIndex(prev.matchIndex);
      setNextRoundWinners(prev.winners);
      setSelectedSide(null);
    } else {
      router.back();
    }
  };

  if (!r1 || !r2) return null;

  const matchNum = currentMatchIndex + 1;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* 헤더 */}
      <header
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ background: '#1E5C5C' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">🍴</span>
          <span className="font-bold text-base" style={{ color: '#FFD700' }}>Dangmatch</span>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="px-4 py-1.5 rounded-full text-sm font-semibold"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#FFFFFF' }}
          >
            Round {matchNum}/{totalMatches}
          </div>
          <button
            onClick={() => router.push('/location')}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-opacity hover:opacity-70"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#FFFFFF' }}
          >
            ✕
          </button>
        </div>
      </header>

<<<<<<< Updated upstream
      {/* ── 스플릿 화면 ── */}
      <div className="h-full flex">
=======
      {/* 질문 텍스트 */}
      <div
        className="py-4 text-center flex-shrink-0"
        style={{ background: '#1E5C5C' }}
      >
        <p className="text-white font-bold text-base px-4">
          세상에서 제일 힘든 선택이지? 딱 하나만 골라.
        </p>
      </div>
>>>>>>> Stashed changes

      {/* 스플릿 뷰 */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* 왼쪽 (Choice A) */}
        <button
          onClick={() => !r1.isBye && setSelectedSide('left')}
          disabled={r1.isBye}
          className="flex-1 relative overflow-hidden transition-all"
          style={{
            outline: selectedSide === 'left' ? '4px solid #FFD700' : 'none',
            outlineOffset: '-4px',
          }}
        >
          {r1.images?.[0] ? (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${r1.images[0]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: '#2A3A3A' }}
            >
              <span style={{ fontSize: '7rem', opacity: 0.25 }}>{getCategoryEmoji(r1.category)}</span>
            </div>
          )}
          {/* 어두운 그라디언트 오버레이 */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%)' }}
          />
          {/* 선택 시 하이라이트 */}
          {selectedSide === 'left' && (
            <div className="absolute inset-0" style={{ background: 'rgba(255,215,0,0.12)' }} />
          )}
          {/* 하단 정보 */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="mb-2">
              <span
                className="text-xs font-bold px-3 py-1 rounded-full"
                style={{ background: '#FFD700', color: '#1a2a4a' }}
              >
                Choice A
              </span>
            </div>
            <h2 className="text-2xl font-black text-white leading-tight">
              {r1.isBye ? '부전승' : r1.name}
            </h2>
          </div>
        </button>

        {/* 중앙 분리선 */}
        <div
          className="absolute inset-y-0 z-10 pointer-events-none"
          style={{
            left: '50%',
            transform: 'translateX(-50%)',
            width: 2,
            background: 'rgba(255,255,255,0.25)',
          }}
        />

        {/* VS 배지 */}
        <div
          className="absolute z-20 flex flex-col items-center pointer-events-none"
          style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
        >
          <div
            className="w-14 h-14 rounded-full flex flex-col items-center justify-center"
            style={{
              background: '#FF7F50',
              border: '3px solid #FFFFFF',
              boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
            }}
          >
            <span style={{ fontSize: 22 }}>😋</span>
            <span className="text-[8px] font-black text-white leading-none">DANGI</span>
          </div>
          <div
            className="mt-1 px-2.5 py-0.5 rounded-full text-xs font-black"
            style={{ background: '#FFD700', color: '#1a2a4a' }}
          >
            VS
          </div>
        </div>

        {/* 오른쪽 (Choice B) */}
        <button
          onClick={() => !r2.isBye && setSelectedSide('right')}
          disabled={r2.isBye}
          className="flex-1 relative overflow-hidden transition-all"
          style={{
            outline: selectedSide === 'right' ? '4px solid #FFD700' : 'none',
            outlineOffset: '-4px',
          }}
        >
          {r2.images?.[0] ? (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${r2.images[0]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: '#1A2A2A' }}
            >
              <span style={{ fontSize: '7rem', opacity: 0.25 }}>{getCategoryEmoji(r2.category)}</span>
            </div>
          )}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%)' }}
          />
          {selectedSide === 'right' && (
            <div className="absolute inset-0" style={{ background: 'rgba(255,215,0,0.12)' }} />
          )}
          <div className="absolute bottom-0 left-0 right-0 p-4 text-right">
            <div className="mb-2 flex justify-end">
              <span
                className="text-xs font-bold px-3 py-1 rounded-full"
                style={{ background: '#FF7F50', color: '#FFFFFF' }}
              >
                Choice B
              </span>
            </div>
            <h2 className="text-2xl font-black text-white leading-tight">
              {r2.isBye ? '부전승' : r2.name}
            </h2>
          </div>
        </button>
      </div>

<<<<<<< Updated upstream
      {/* ── VS 중앙 배지 ── */}
      <div
        className="absolute inset-y-0 z-20 flex flex-col items-center justify-center pointer-events-none"
        style={{ left: '50%', transform: 'translateX(-50%)', width: 64 }}
      >
        <div className="flex-1" style={{ width: 2, background: 'rgba(255,255,255,0.2)' }} />
        <div
          className="flex items-center justify-center font-black text-sm flex-shrink-0"
          style={{
            width: 52,
            height: 52,
            background: '#1A1A1A',
            color: '#FF9900',
            borderRadius: '50%',
            border: '3px solid #FF9900',
            boxShadow: '0 0 24px rgba(255,153,0,0.5), 0 4px 12px rgba(0,0,0,0.5)',
          }}
        >
          VS
        </div>
        <div className="flex-1" style={{ width: 2, background: 'rgba(255,255,255,0.2)' }} />
      </div>

      {/* ── 상단 헤더 오버레이 ── */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3">
=======
      {/* 하단 버튼 바 */}
      <div
        className="flex-shrink-0 px-4 py-4 flex items-center gap-3"
        style={{ background: '#1a2a4a' }}
      >
>>>>>>> Stashed changes
        <button
          onClick={handleGoBack}
          className="flex-1 py-3.5 flex items-center justify-center gap-2 font-semibold text-sm rounded-2xl transition-opacity hover:opacity-70"
          style={{ background: 'rgba(255,255,255,0.12)', color: '#FFFFFF' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 14l-4-4 4-4M5 10h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          이전으로
        </button>
        <button
          onClick={handleConfirm}
          disabled={!selectedSide}
          className="flex-1 py-3.5 flex items-center justify-center gap-2 font-bold text-sm rounded-2xl transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ background: '#FFD700', color: '#1a2a4a' }}
        >
          선택하기
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 18l6-6-6-6"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* 진행도 */}
      <div
        className="flex-shrink-0 px-4 pb-4 flex flex-col items-center gap-2"
        style={{ background: '#1a2a4a' }}
      >
        <span className="text-[10px] font-bold tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
          TOURNAMENT PROGRESS
        </span>
        <div className="w-full h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }}>
          <div
            className="h-1 rounded-full transition-all duration-300"
            style={{
              width: `${totalMatches > 0 ? (currentMatchIndex / totalMatches) * 100 : 0}%`,
              background: '#FFD700',
            }}
          />
        </div>
      </div>
    </div>
  );
}
