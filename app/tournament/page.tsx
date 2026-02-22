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

    // 토너먼트 참가 기록 (BYE 제외)
    restaurants.forEach((r) => {
      if (!r.isBye) recordTournamentEntry(r.id);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getRoundName = () => {
    if (currentRound.length === 2) return '결승전';
    return `라운드 ${currentRound.length}`;
  };

  const totalMatches = currentRound.length / 2;
  const r1 = currentRound[currentMatchIndex * 2];
  const r2 = currentRound[currentMatchIndex * 2 + 1];

  const getDistanceText = (distance?: string) => {
    if (!distance) return '거리 정보 없음';
    const dist = parseInt(distance);
    if (dist < 1000) return `${dist}m`;
    return `${(dist / 1000).toFixed(1)}km`;
  };

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
    <div className="min-h-screen flex flex-col" style={{ background: '#FFFDF9' }}>
      {/* 헤더 */}
      <header style={{ borderBottom: '1px solid #F0EDEA' }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-sm hover:opacity-60 transition-opacity"
            style={{ color: '#8C8C8C' }}
          >
            ←
          </button>
          <div className="text-center">
            <span
              className="text-xs font-bold tracking-widest uppercase px-2 py-0.5"
              style={{ background: '#FF4D2E', color: '#FFFDF9' }}
            >
              {getRoundName()}
            </span>
          </div>
          <span className="text-xs" style={{ color: '#8C8C8C' }}>
            {currentMatchIndex + 1}/{totalMatches}
          </span>
        </div>
      </header>

      {/* 콘텐츠 */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl">
          <p className="text-xs font-bold tracking-widest uppercase text-center mb-6" style={{ color: '#8C8C8C' }}>
            둘 중 하나를 선택하세요
          </p>

          {/* 1v1 대결 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[r1, r2].map((restaurant, idx) => (
              <button
                key={`${restaurant.id}-${idx}`}
                onClick={restaurant.isBye ? undefined : () => handleSelectWinner(restaurant)}
                disabled={restaurant.isBye}
                className="p-8 text-left transition-all hover:opacity-80 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: restaurant.isBye ? '#F0EDEA' : '#1F1F1F',
                  border: '1.5px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!restaurant.isBye) e.currentTarget.style.borderColor = '#FF4D2E';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                {restaurant.isBye ? (
                  <div className="text-center py-4">
                    <h2 className="text-xl font-bold" style={{ color: '#8C8C8C' }}>부전승</h2>
                    <p className="text-xs mt-1" style={{ color: '#8C8C8C' }}>자동 진출</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#FF4D2E' }}>
                      Pick
                    </p>
                    <h2 className="text-2xl font-black mb-2 leading-tight" style={{ color: '#FFFDF9' }}>
                      {restaurant.name}
                    </h2>
                    <p className="text-sm mb-1" style={{ color: '#8C8C8C' }}>
                      {restaurant.category.split('>').pop()?.trim()}
                    </p>
                    <p className="text-xs" style={{ color: '#8C8C8C' }}>
                      {getDistanceText(restaurant.distance)}
                    </p>
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center mt-4">
            <span className="text-xs font-black tracking-widest" style={{ color: '#FF4D2E' }}>VS</span>
          </div>
        </div>
      </main>
    </div>
  );
}
