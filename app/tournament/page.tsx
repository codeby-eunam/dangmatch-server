'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTournamentStore } from '@/lib/store/tournament';
import { createTournament, getRoundName } from '@/lib/utils/tournament';
import type { Restaurant } from '@/types';

export default function TournamentPage() {
  const router = useRouter();
  const { restaurants, setFinalWinner } = useTournamentStore();
  
  const [rounds, setRounds] = useState<ReturnType<typeof createTournament>>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [winners, setWinners] = useState<Restaurant[]>([]);

  // 토너먼트 생성
  useEffect(() => {
    if (restaurants.length === 0) {
      router.push('/location');
      return;
    }

    const tournamentRounds = createTournament(restaurants);
    setRounds(tournamentRounds);
    console.log('🏆 토너먼트 생성:', tournamentRounds);
  }, [restaurants, router]);

  if (rounds.length === 0) {
    return null;
  }

  const currentRound = rounds[currentRoundIndex];
  const currentMatch = currentRound.matches[currentMatchIndex];
  const totalMatches = currentRound.matches.length;

  const selectWinner = (winner: Restaurant) => {
    const newWinners = [...winners, winner];
    setWinners(newWinners);

    // 현재 라운드의 다음 매치로
    if (currentMatchIndex < totalMatches - 1) {
      setCurrentMatchIndex(currentMatchIndex + 1);
    } else {
      // 라운드 종료
      if (currentRoundIndex < rounds.length - 1) {
        // 다음 라운드로
        setCurrentRoundIndex(currentRoundIndex + 1);
        setCurrentMatchIndex(0);
      } else {
        // 토너먼트 종료 → 우승자
        setFinalWinner(winner);
        router.push('/result');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* 상단 정보 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {getRoundName(currentRound.round, rounds.length)}
          </h1>
          <p className="text-gray-600">
            {currentMatchIndex + 1} / {totalMatches}
          </p>
        </div>

        {/* 1v1 대결 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 식당 1 */}
          <button
            onClick={() => selectWinner(currentMatch.restaurant1!)}
            className="bg-white rounded-2xl shadow-xl p-8 hover:scale-105 transition transform hover:shadow-2xl"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-3">
                {currentMatch.restaurant1?.name}
              </h2>
              <p className="text-gray-600 mb-2">
                {currentMatch.restaurant1?.category.split('>').pop()?.trim()}
              </p>
              <p className="text-sm text-gray-500">
                📍 {parseInt(currentMatch.restaurant1?.distance || '0')}m
              </p>
            </div>
          </button>

          {/* 식당 2 */}
          <button
            onClick={() => selectWinner(currentMatch.restaurant2!)}
            className="bg-white rounded-2xl shadow-xl p-8 hover:scale-105 transition transform hover:shadow-2xl"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-3">
                {currentMatch.restaurant2?.name}
              </h2>
              <p className="text-gray-600 mb-2">
                {currentMatch.restaurant2?.category.split('>').pop()?.trim()}
              </p>
              <p className="text-sm text-gray-500">
                📍 {parseInt(currentMatch.restaurant2?.distance || '0')}m
              </p>
            </div>
          </button>
        </div>

        {/* 하단 버튼 */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-800"
          >
            ← 다시 선택하기
          </button>
        </div>
      </div>
    </div>
  );
}