'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTournamentStore } from '@/lib/store/tournament';

const RADIUS_OPTIONS = [
  { label: '도보 가까이', value: 500, description: '5분 거리 · 500m' },
  { label: '도보 멀리', value: 1000, description: '10분 거리 · 1km' },
  { label: '차량 가까이', value: 3000, description: '5분 운전 · 3km' },
  { label: '차량 멀리', value: 5000, description: '10분 운전 · 5km' },
];

export default function RadiusPage() {
  const router = useRouter();
  const { location, categories, setRadius, setRestaurants } = useTournamentStore();

  const [selectedRadius, setSelectedRadius] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  if (!location) {
    router.push('/location');
    return null;
  }

  const handleNext = async () => {
    if (!selectedRadius) return;

    setLoading(true);

    try {
      const maxPages = Math.max(1, Math.ceil(3 / categories.length));
      const results = await Promise.all(
        categories.map((cat) =>
          fetch(
            `/api/kakao/nearby?lat=${location.lat}&lng=${location.lng}&radius=${selectedRadius}&category=${encodeURIComponent(cat)}&maxPages=${maxPages}`
          ).then((r) => r.json())
        )
      );

      const seen = new Set<string>();
      const documents = results
        .flatMap((data) => data.documents || [])
        .filter((doc) => {
          if (seen.has(doc.id)) return false;
          seen.add(doc.id);
          return true;
        });

      if (documents.length > 0) {
        setRadius(selectedRadius);
        setRestaurants(
          documents.map((doc: any) => ({
            id: doc.id,
            name: doc.place_name,
            category: doc.category_name,
            address: doc.address_name,
            roadAddress: doc.road_address_name || doc.address_name,
            phone: doc.phone || '',
            x: doc.x,
            y: doc.y,
            distance: doc.distance,
            placeUrl: doc.place_url,
          }))
        );
        router.push('/swipe');
      } else {
        alert('주변에 식당이 없습니다. 반경을 늘려보세요.');
      }
    } catch {
      alert('검색 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FFFDF9' }}>
      {/* 헤더 */}
      <header className="flex items-center px-6 py-4" style={{ borderBottom: '1px solid #F0EDEA' }}>
        <button onClick={() => router.back()} className="text-sm mr-4 hover:opacity-60 transition-opacity" style={{ color: '#8C8C8C' }}>
          ←
        </button>
        <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: '#8C8C8C' }}>
          반경 설정
        </span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-md">
          {/* 섹션 타이틀 */}
          <div className="mb-8">
            <div
              className="inline-block text-xs font-bold tracking-widest uppercase px-2 py-0.5 mb-3"
              style={{ background: '#FF4D2E', color: '#FFFDF9' }}
            >
              Step 2
            </div>
            <h1 className="text-3xl font-black tracking-tight" style={{ color: '#1F1F1F' }}>
              얼마나 멀리까지?
            </h1>
            <p className="text-sm mt-1" style={{ color: '#8C8C8C' }}>
              {location.address || '현재 위치'} 기준
            </p>
          </div>

          {/* 반경 옵션 */}
          <div className="space-y-2 mb-8">
            {RADIUS_OPTIONS.map((option) => {
              const selected = selectedRadius === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setSelectedRadius(option.value)}
                  className="w-full p-4 text-left transition-all flex items-center justify-between"
                  style={{
                    background: selected ? '#1F1F1F' : '#F0EDEA',
                    border: selected ? '1.5px solid #1F1F1F' : '1.5px solid transparent',
                  }}
                >
                  <div>
                    <p className="font-bold text-sm" style={{ color: selected ? '#FFFDF9' : '#1F1F1F' }}>
                      {option.label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: selected ? '#8C8C8C' : '#8C8C8C' }}>
                      {option.description}
                    </p>
                  </div>
                  {selected && (
                    <span className="text-xs font-bold" style={{ color: '#FF4D2E' }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleNext}
            disabled={!selectedRadius || loading}
            className="w-full py-4 text-sm font-bold tracking-widest uppercase transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ background: '#FF4D2E', color: '#FFFDF9' }}
          >
            {loading ? '검색 중...' : '맛집 찾기'}
          </button>
        </div>
      </main>
    </div>
  );
}
