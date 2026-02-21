'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTournamentStore } from '@/lib/store/tournament';
import type { Restaurant } from '@/types';

const BYE_CARD: Restaurant = {id: 'bye', name: 'BYE', category: '', address: '', roadAddress: '', phone: '', x: '', y: '', distance: '', placeUrl: '', isBye: true};

export default function TournamentPage() {
	const router = useRouter();
	const { restaurants, setFinalWinner } = useTournamentStore();

	const [currentRound, setCurrentRound] = useState<Restaurant[]>([]);
	const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
	const [nextRoundWinners, setNextRoundWinners] = useState<Restaurant[]>([]);
	useEffect(() => {
		if (restaurants.length === 0) {
			router.push('/location');
			return;
		}
		
		const shuffled = [...restaurants].sort(() => Math.random() - 0.5);
			if (restaurants.length % 2 !== 0) {
				shuffled.push(BYE_CARD);
			}
			setCurrentRound(shuffled);
			setCurrentMatchIndex(0);
			setNextRoundWinners([]);
	}, []);

	const getRoundName = () => {
		const totalMatches = currentRound.length / 2;
		if (totalMatches === 1) return '결승전';
		if (totalMatches === 2) return '준결승전';
		return `라운드 ${Math.log2(currentRound.length)}`;
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

	if (!r1 || !r2) 
		return null;

	return (
    	<div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex flex-col items-center justify-center p-4">
		<div className="max-w-4xl w-full">
		{/* 상단 정보 */}
		<div className="text-center mb-8">
			<h1 className="text-3xl font-bold mb-2">{getRoundName()}</h1>
			<p className="text-gray-600">
				{currentMatchIndex + 1} / {totalMatches}
			</p>
        </div>

        {/* 1v1 대결 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[r1, r2].map((restaurant, idx) => (
            <button
				key={`${restaurant.id}-${idx}`}
				onClick={restaurant.isBye ? undefined : () => handleSelectWinner(restaurant)}
				disabled={restaurant.isBye}
				className={`bg-white rounded-2xl shadow-xl p-8 text-left transition-transform
				${restaurant.isBye
					? 'opacity-40 cursor-not-allowed grayscale'
					: 'hover:scale-105 hover:shadow-2xl'
				}`}
			>
				{restaurant.isBye ? (
				<div className="text-center">
					<h2 className="text-2xl font-bold mb-3 text-gray-400">부전승</h2>
					<p className="text-gray-400 text-sm">자동 진출</p>
				</div>
				) : (
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-3">{restaurant.name}</h2>
                <p className="text-gray-600 mb-2">
                  {restaurant.category.split('>').pop()?.trim()}
                </p>
                <p className="text-sm text-gray-500">
                  📍 {getDistanceText(restaurant.distance)}
                </p>
              </div>
				)}
            </button>
          ))}
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