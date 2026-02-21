'use client';

import { useState } from 'react';
import { createTournament, getRoundName } from '@/lib/utils/tournament';
import type { Restaurant } from '@/types';

export default function TestTournamentPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [tournament, setTournament] = useState<ReturnType<typeof createTournament> | null>(null);

  // 더미 데이터 생성
  const generateDummyRestaurants = (count: number) => {
    const dummies: Restaurant[] = [];
    for (let i = 1; i <= count; i++) {
      dummies.push({
        id: `dummy-${i}`,
        name: `식당 ${i}`,
        category: '한식',
        address: `서울시 강남구 ${i}`,
        roadAddress: `테헤란로 ${i}`,
        phone: '02-123-4567',
        x: '127.0',
        y: '37.5',
        distance: '100'
      });
    }
    return dummies;
  };

  const startTournament = (count: number) => {
    const dummies = generateDummyRestaurants(count);
    setRestaurants(dummies);
    const rounds = createTournament(dummies);
    setTournament(rounds);
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">토너먼트 로직 테스트</h1>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">더미 데이터 생성</h2>
          <div className="flex gap-3">
            {[5, 7, 10, 15].map(count => (
              <button
                key={count}
                onClick={() => startTournament(count)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {count}개 식당
              </button>
            ))}
          </div>
        </div>

        {tournament && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-2">
                토너먼트 정보
              </h2>
              <p className="text-gray-600">
                총 {restaurants.length}개 식당 → {tournament.length}라운드
              </p>
            </div>

            {tournament.map((round, idx) => (
              <div key={idx} className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">
                  {getRoundName(round.round, tournament.length)} (라운드 {round.round})
                </h3>
                
                <div className="space-y-3">
                  {round.matches.map((match, matchIdx) => (
                    <div key={matchIdx} className="border rounded p-4 bg-gray-50">
                      <p className="text-sm text-gray-500 mb-2">
                        매치 {matchIdx + 1}
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-white rounded border border-blue-200">
                          <p className="font-medium">{match.restaurant1?.name}</p>
                          <p className="text-sm text-gray-600">{match.restaurant1?.category}</p>
                        </div>
                        <div className="p-3 bg-white rounded border border-red-200">
                          <p className="font-medium">{match.restaurant2?.name}</p>
                          <p className="text-sm text-gray-600">{match.restaurant2?.category}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}