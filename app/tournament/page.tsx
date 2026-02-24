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

export default function TournamentPage() {
  const router = useRouter();
  const { restaurants: allRestaurants, swipedRestaurants, setFinalWinner } = useTournamentStore();
  const restaurants = swipedRestaurants.length > 0 ? swipedRestaurants : allRestaurants;

  const [currentRound, setCurrentRound] = useState<Restaurant[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [nextRoundWinners, setNextRoundWinners] = useState<Restaurant[]>([]);

  useEffect(() => {
    if (restaurants.length === 0) {
      router.push('/location');
      return;
    }
    const shuffled = [...restaurants].sort(() => Math.random() - 0.5);
    if (shuffled.length % 2 !== 0) {
      shuffled.push(BYE_CARD);
    }
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

  const handleSelectWinner = useCallback((winner: Restaurant) => {
    const newWinners = [...nextRoundWinners, winner];
    const newMatchIndex = currentMatchIndex + 1;

    if (newMatchIndex >= totalMatches) {
      if (newWinners.length === 1) {
        setFinalWinner(newWinners[0]);
        router.push('/result');
      } else {
        const nextRound = [...newWinners].sort(() => Math.random() - 0.5);
        if (nextRound.length % 2 !== 0) {
          nextRound.push(BYE_CARD);
        }
        setCurrentRound(nextRound);
        setCurrentMatchIndex(0);
        setNextRoundWinners([]);
      }
    } else {
      setCurrentMatchIndex(newMatchIndex);
      setNextRoundWinners(newWinners);
    }
  }, [currentMatchIndex, nextRoundWinners, totalMatches, router, setFinalWinner]);

  if (!r1 || !r2) return null;

  return (
    <div className="h-screen relative overflow-hidden" style={{ fontFamily: 'Arial, sans-serif' }}>

      {/* ── 스플릿 화면 ── */}
      <div className="h-full flex flex-col md:flex-row">

        {/* 왼쪽 — 레드 */}
        <button
          onClick={() => !r1.isBye && handleSelectWinner(r1)}
          disabled={r1.isBye}
          className="flex-1 relative flex flex-col items-center justify-center overflow-hidden group"
          style={{ background: r1.isBye ? '#555' : '#C8232C' }}
        >
          {r1.images?.[0] && (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${r1.images[0]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.35,
              }}
            />
          )}
          {!r1.images?.[0] && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
              style={{ opacity: 0.07 }}
            >
              <span style={{ fontSize: '16rem', lineHeight: 1 }}>{getCategoryEmoji(r1.category)}</span>
            </div>
          )}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.45) 100%)' }}
          />
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          />

          <div className="relative z-10 text-center px-6 py-20">
            {r1.isBye ? (
              <>
                <h2 className="text-5xl font-black text-white mb-3">부전승</h2>
                <p className="text-sm text-white opacity-70">자동 진출</p>
              </>
            ) : (
              <>
                <p
                  className="text-xs font-black tracking-widest uppercase mb-4"
                  style={{ color: '#FFD580', opacity: 0.9 }}
                >
                  {r1.category.split('>').pop()?.trim()}
                </p>
                <h2
                  className="font-black text-white mb-8 leading-tight"
                  style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', textShadow: '2px 2px 8px rgba(0,0,0,0.5)' }}
                >
                  {r1.name}
                </h2>
                <div
                  className="inline-flex items-center gap-2 px-7 py-3 font-black text-sm text-white"
                  style={{ border: '2px solid rgba(255,255,255,0.8)', borderRadius: 2 }}
                >
                  투표하기 👆
                </div>
              </>
            )}
          </div>
        </button>

        {/* 오른쪽 — 그린 */}
        <button
          onClick={() => !r2.isBye && handleSelectWinner(r2)}
          disabled={r2.isBye}
          className="flex-1 relative flex flex-col items-center justify-center overflow-hidden group"
          style={{ background: r2.isBye ? '#555' : '#1C8B40' }}
        >
          {r2.images?.[0] && (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${r2.images[0]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.35,
              }}
            />
          )}
          {!r2.images?.[0] && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
              style={{ opacity: 0.07 }}
            >
              <span style={{ fontSize: '16rem', lineHeight: 1 }}>{getCategoryEmoji(r2.category)}</span>
            </div>
          )}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.45) 100%)' }}
          />
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          />

          <div className="relative z-10 text-center px-6 py-20">
            {r2.isBye ? (
              <>
                <h2 className="text-5xl font-black text-white mb-3">부전승</h2>
                <p className="text-sm text-white opacity-70">자동 진출</p>
              </>
            ) : (
              <>
                <p
                  className="text-xs font-black tracking-widest uppercase mb-4"
                  style={{ color: '#A8FFB8', opacity: 0.9 }}
                >
                  {r2.category.split('>').pop()?.trim()}
                </p>
                <h2
                  className="font-black text-white mb-8 leading-tight"
                  style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', textShadow: '2px 2px 8px rgba(0,0,0,0.5)' }}
                >
                  {r2.name}
                </h2>
                <div
                  className="inline-flex items-center gap-2 px-7 py-3 font-black text-sm text-white"
                  style={{ border: '2px solid rgba(255,255,255,0.8)', borderRadius: 2 }}
                >
                  투표하기 👆
                </div>
              </>
            )}
          </div>
        </button>
      </div>

      {/* ── VS 배지 (모바일: 수평) ── */}
      <div
        className="md:hidden absolute inset-x-0 z-20 flex flex-row items-center justify-center pointer-events-none"
        style={{ top: '50%', transform: 'translateY(-50%)', height: 64 }}
      >
        <div className="flex-1" style={{ height: 2, background: 'rgba(255,255,255,0.2)' }} />
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
        <div className="flex-1" style={{ height: 2, background: 'rgba(255,255,255,0.2)' }} />
      </div>

      {/* ── VS 배지 (웹: 수직) ── */}
      <div
        className="hidden md:flex absolute inset-y-0 z-20 flex-col items-center justify-center pointer-events-none"
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
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs font-bold px-3 py-2 transition-opacity hover:opacity-80"
          style={{
            background: 'rgba(0,0,0,0.55)',
            color: '#FFFFFF',
            backdropFilter: 'blur(6px)',
            borderRadius: 4,
          }}
        >
          ← 대진표
        </button>

        <div
          className="text-xs font-black tracking-wider px-3 py-2"
          style={{
            background: 'rgba(0,0,0,0.55)',
            color: '#FFFFFF',
            backdropFilter: 'blur(6px)',
            borderRadius: 4,
          }}
        >
          토너먼트 {getRoundName()}
        </div>

        <button
          onClick={() => router.push('/location')}
          className="text-xs font-black px-3 py-2 transition-opacity hover:opacity-80"
          style={{ background: '#FF9900', color: '#1A1A1A', borderRadius: 4 }}
        >
          STOP 토너먼트
        </button>
      </div>

      {/* ── 하단 바 ── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-3"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      >
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full flex-shrink-0"
                style={{ background: `hsl(${i * 80}, 60%, 55%)`, border: '1.5px solid #222' }}
              />
            ))}
          </div>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {currentMatchIndex + 1}/{totalMatches} 경기
          </span>
        </div>

        <div
          className="text-xs font-black px-3 py-1"
          style={{ background: '#FF9900', color: '#1A1A1A', borderRadius: 2 }}
        >
          {getRoundName()}
        </div>

        <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {nextRoundWinners.length}승 진출
        </span>
      </div>

    </div>
  );
}
