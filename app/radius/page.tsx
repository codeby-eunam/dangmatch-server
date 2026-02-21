'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTournamentStore } from '@/lib/store/tournament';

const RADIUS_OPTIONS = [
  { label: '🚶 도보 가까이', value: 500, description: '5분 거리' },
  { label: '🚶 도보 멀리', value: 1000, description: '10분 거리' },
  { label: '🚗 차량 가까이', value: 3000, description: '5분 운전' },
  { label: '🚗 차량 멀리', value: 5000, description: '10분 운전' },
];

export default function RadiusPage() {
  const router = useRouter();
  const { location, searchType, setRadius, setRestaurants } = useTournamentStore();
  
  const [selectedRadius, setSelectedRadius] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // 현재 위치가 아니거나 위치 정보 없으면 리다이렉트
  if (!location || searchType !== 'current') {
    router.push('/location');
    return null;
  }

  const handleNext = async () => {
    if (!selectedRadius) return;

    setLoading(true);

    try {
      const response = await fetch(
        `/api/kakao/nearby?lat=${location.lat}&lng=${location.lng}&radius=${selectedRadius}`
      );
      const data = await response.json();

      if (data.documents && data.documents.length > 0) {
        const restaurants = data.documents.map((doc: any) => ({
          id: doc.id,
          name: doc.place_name,
          category: doc.category_name,
          address: doc.address_name,
          roadAddress: doc.road_address_name || doc.address_name,
          phone: doc.phone || '',
          x: doc.x,
          y: doc.y,
          distance: doc.distance,
          placeUrl: doc.place_url
        }));

        setRadius(selectedRadius);
        setRestaurants(restaurants);
        
        router.push('/restaurants');
      } else {
        alert('주변에 식당이 없습니다. 반경을 늘려보세요.');
      }
    } catch (error) {
      alert('검색 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-2">
          얼마나 멀리까지?
        </h1>
        <p className="text-gray-600 text-center mb-8">
          현재 위치 기준
        </p>

        <div className="space-y-3">
          {RADIUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedRadius(option.value)}
              className={`w-full p-4 rounded-xl border-2 transition text-left ${
                selectedRadius === option.value
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">{option.label}</p>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>
                <div className="text-gray-400">
                  {selectedRadius === option.value && (
                    <span className="text-blue-600 text-2xl">✓</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={!selectedRadius || loading}
          className="w-full mt-6 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
        >
          {loading ? '검색 중...' : '다음'}
        </button>

        <button
          onClick={() => router.back()}
          className="w-full mt-3 py-3 text-gray-600 hover:text-gray-800 transition"
        >
          ← 뒤로
        </button>
      </div>
    </div>
  );
}