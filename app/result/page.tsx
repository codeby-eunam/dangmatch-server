'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTournamentStore } from '@/lib/store/tournament';

export default function ResultPage() {
  const router = useRouter();
  const { finalWinner, reset } = useTournamentStore();

  useEffect(() => {
    if (!finalWinner) {
      router.push('/location');
    }
  }, [finalWinner, router]);

  if (!finalWinner) {
    return null;
  }

  const handleRestart = () => {
    reset();
    router.push('/location');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="text-6xl mb-4">🏆</div>
        <h1 className="text-3xl font-bold mb-2">우승!</h1>
        <h2 className="text-2xl font-semibold mb-4">{finalWinner.name}</h2>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 mb-1">
            {finalWinner.category.split('>').pop()?.trim()}
          </p>
          <p className="text-sm text-gray-500 mb-2">
            📍 {finalWinner.address}
          </p>
          {finalWinner.phone && (
            <p className="text-sm text-gray-500">
              📞 {finalWinner.phone}
            </p>
          )}
        </div>

        <div className="space-y-3">
          {finalWinner.placeUrl && (
            <a
              href={finalWinner.placeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 bg-yellow-400 text-gray-900 rounded-xl font-semibold hover:bg-yellow-500"
            >
              카카오맵에서 보기
            </a>
          )}
          
          <button
            onClick={handleRestart}
            className="w-full py-3 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-900"
          >
            처음부터 다시
          </button>
        </div>
      </div>
    </div>
  );
}