'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTournamentStore } from '@/lib/store/tournament';

const RADIUS_OPTIONS = [
  { label: '도보 가까이', value: 500, description: '5분 거리 · 500m', icon: '🚶' },
  { label: '도보 멀리', value: 1000, description: '10분 거리 · 1km', icon: '🚶' },
  { label: '차량 가까이', value: 3000, description: '5분 운전 · 3km', icon: '🚗' },
  { label: '차량 멀리', value: 5000, description: '10분 운전 · 5km', icon: '🚗' },
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
            phone: doc.phone || '',
            lat: parseFloat(doc.y),
            lng: parseFloat(doc.x),
            distance: doc.distance,
            kakaoUrl: doc.place_url,
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

  const selectedOption = RADIUS_OPTIONS.find((o) => o.value === selectedRadius);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5EDD0' }}>
      {/* 헤더 */}
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid #E8DDB8' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 flex items-center justify-center text-sm font-black"
            style={{ background: '#FF9900', color: '#FFFFFF', borderRadius: 4 }}
          >
            A
          </div>
          <span className="text-xs font-black tracking-[0.2em] uppercase" style={{ color: '#8C8C8C' }}>
            위치 매개변수
          </span>
        </div>
        <button
          onClick={() => router.back()}
          className="text-xs font-bold hover:opacity-60 transition-opacity"
          style={{ color: '#8C8C8C' }}
        >
          ← BACK
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          {/* 섹션 타이틀 */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-black tracking-tight mb-1" style={{ color: '#FF9900' }}>
              반경 조절
            </h1>
            <p className="text-sm" style={{ color: '#8C8C8C' }}>
              교통에 맞는 거리 설정
            </p>
          </div>

          {/* 원형 반경 표시 */}
          <div className="flex justify-center mb-8">
            <div
              className="relative flex items-center justify-center"
              style={{ width: 180, height: 180 }}
            >
              {/* 원형 배경 */}
              <div
                className="absolute inset-0 rounded-full"
                style={{ border: '12px solid #E8DDB8' }}
              />
              {/* 선택된 경우 오렌지 오버레이 */}
              {selectedOption && (
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    border: '12px solid #FF9900',
                    clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 50% 0%)',
                  }}
                />
              )}
              {/* 중앙 텍스트 */}
              <div className="text-center z-10">
                {selectedOption ? (
                  <>
                    <div className="text-4xl font-black" style={{ color: '#FF9900', lineHeight: 1 }}>
                      {selectedOption.value >= 1000
                        ? `${selectedOption.value / 1000}km`
                        : `${selectedOption.value}m`}
                    </div>
                    <div className="text-xs mt-1" style={{ color: '#8C8C8C' }}>
                      {selectedOption.icon} {selectedOption.label}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-black" style={{ color: '#C0A060', lineHeight: 1 }}>
                      ?
                    </div>
                    <div className="text-xs mt-1" style={{ color: '#8C8C8C' }}>
                      반경 선택
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 반경 옵션 */}
          <div className="grid grid-cols-2 gap-2 mb-8">
            {RADIUS_OPTIONS.map((option) => {
              const selected = selectedRadius === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setSelectedRadius(option.value)}
                  className="p-4 text-left transition-all hover:opacity-80"
                  style={{
                    background: selected ? '#FF9900' : '#FFFFFF',
                    border: selected ? '2px solid #FF9900' : '2px solid #E8DDB8',
                    borderRadius: 4,
                    boxShadow: selected ? '3px 3px 0 rgba(0,0,0,0.15)' : 'none',
                  }}
                >
                  <p className="font-black text-sm mb-0.5" style={{ color: selected ? '#FFFFFF' : '#1A1A1A' }}>
                    {option.icon} {option.label}
                  </p>
                  <p className="text-xs" style={{ color: selected ? 'rgba(255,255,255,0.8)' : '#8C8C8C' }}>
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* 위치 정보 */}
          <div
            className="flex items-center gap-2 px-4 py-3 mb-6 text-xs"
            style={{ background: '#FFFFFF', border: '1px solid #E8DDB8', borderRadius: 4 }}
          >
            <span style={{ color: '#FF9900' }}>📍</span>
            <span style={{ color: '#8C8C8C' }}>
              {location.address || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
            </span>
          </div>

          {/* 버튼 */}
          <div className="flex gap-2">
            <button
              onClick={() => router.back()}
              className="flex-1 py-3 text-sm font-bold transition-opacity hover:opacity-80"
              style={{ background: '#E8DDB8', color: '#5C4A1A', borderRadius: 2 }}
            >
              취소
            </button>
            <button
              onClick={handleNext}
              disabled={!selectedRadius || loading}
              className="flex-[2] py-3 text-sm font-black tracking-widest uppercase transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ background: '#FF9900', color: '#FFFFFF', borderRadius: 2 }}
            >
              {loading ? '검색 중...' : '맛집 찾기 →'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
