'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTournamentStore } from '@/lib/store/tournament';

export default function RestaurantsPage() {
  const router = useRouter();
  const { restaurants: allRestaurants, setRestaurants } = useTournamentStore();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (allRestaurants.length === 0) {
      router.push('/location');
    }
  }, [allRestaurants, router]);

  const sortedRestaurants = [...allRestaurants].sort((a, b) => {
    const distA = parseInt(a.distance || '999999');
    const distB = parseInt(b.distance || '999999');
    return distA - distB;
  });

  useEffect(() => {
    if (sortedRestaurants.length > 0 && selected.size === 0) {
      const initial = new Set(
        sortedRestaurants.slice(0, Math.min(16, sortedRestaurants.length)).map(r => r.id)
      );
      setSelected(initial);
    }
  }, [sortedRestaurants, selected.size]);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      if (newSelected.size >= 16) {
        alert('최대 16개까지 선택 가능합니다');
        return;
      }
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

	const startTournament = () => {
	if (selected.size < 2) {
		alert('최소 2개 이상 선택해주세요');
		return;
	}
	const selectedRestaurants = sortedRestaurants.filter(r => selected.has(r.id));
	setRestaurants(selectedRestaurants);
	router.push('/tournament');
	};

  const displayRestaurants = showAll
    ? sortedRestaurants
    : sortedRestaurants.slice(0, 20);

  if (allRestaurants.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: '#FFFDF9' }}>
      {/* 헤더 */}
      <div className="sticky top-0 z-10" style={{ background: '#FFFDF9', borderBottom: '1px solid #F0EDEA' }}>
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black tracking-tight" style={{ color: '#1F1F1F' }}>맛집 선택</h1>
            <p className="text-xs mt-0.5" style={{ color: '#8C8C8C' }}>
              총 {allRestaurants.length}개 · {selected.size}/16개 선택
            </p>
          </div>
          <div
            className="text-xs font-bold px-2 py-1"
            style={{ background: '#FF4D2E', color: '#FFFDF9' }}
          >
            {selected.size}/16
          </div>
        </div>
      </div>

      {/* 안내 */}
      {allRestaurants.length > 16 && (
        <div className="max-w-2xl mx-auto px-6 py-3 mt-4">
          <p className="text-xs" style={{ color: '#8C8C8C', borderLeft: '3px solid #FF4D2E', paddingLeft: 10 }}>
            가까운 순으로 16개가 자동 선택됐습니다. 탭해서 변경하세요.
          </p>
        </div>
      )}

      {/* 식당 목록 */}
      <div className="max-w-2xl mx-auto px-6 py-4 space-y-2">
        {displayRestaurants.map((restaurant) => {
          const isSelected = selected.has(restaurant.id);
          return (
            <button
              key={restaurant.id}
              onClick={() => toggleSelect(restaurant.id)}
              className="w-full p-4 text-left transition-all"
              style={{
                background: isSelected ? '#1F1F1F' : '#F0EDEA',
                border: isSelected ? '1.5px solid #1F1F1F' : '1.5px solid transparent',
              }}
            >
              <div className="flex items-center gap-3">
                {/* 이미지 or 이모지 */}
                <div
                  className="w-14 h-14 flex-shrink-0 overflow-hidden flex items-center justify-center"
                  style={{ background: isSelected ? '#333' : '#E0DDD8' }}
                >
                  {restaurant.images?.[0] ? (
                    <img
                      src={restaurant.images[0]}
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">🍽️</span>
                  )}
                </div>
                {/* 텍스트 */}
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-bold text-base truncate"
                    style={{ color: isSelected ? '#FFFDF9' : '#1F1F1F' }}
                  >
                    {restaurant.name}
                  </h3>
                  <p className="text-xs mt-0.5 truncate" style={{ color: '#8C8C8C' }}>
                    {restaurant.category.split('>').pop()?.trim()}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#8C8C8C' }}>
                    {parseInt(restaurant.distance || '0')}m
                  </p>
                </div>
                {isSelected && (
                  <span className="text-sm font-bold flex-shrink-0" style={{ color: '#FF4D2E' }}>✓</span>
                )}
              </div>
            </button>
          );
        })}

        {!showAll && sortedRestaurants.length > 20 && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full py-3 text-xs font-bold tracking-widest uppercase transition-opacity hover:opacity-60"
            style={{ color: '#8C8C8C' }}
          >
            전체 {sortedRestaurants.length}개 보기 →
          </button>
        )}
      </div>

      {/* 하단 고정 버튼 */}
      <div
        className="fixed bottom-0 left-0 right-0"
        style={{ background: '#FFFDF9', borderTop: '1px solid #F0EDEA' }}
      >
        <div className="max-w-2xl mx-auto px-6 py-4 flex gap-3">
          <button
            onClick={() => router.back()}
            className="px-5 py-3 text-sm font-medium transition-opacity hover:opacity-60"
            style={{ color: '#8C8C8C' }}
          >
            ← 뒤로
          </button>
          <button
            onClick={() => router.push('/swipe')}
            className="flex-1 py-3 text-xs font-bold tracking-widest uppercase transition-opacity hover:opacity-80"
            style={{ background: '#F0EDEA', color: '#1F1F1F' }}
          >
            스와이프로 선택
          </button>
          <button
            onClick={startTournament}
            disabled={selected.size < 2}
            className="flex-1 py-3 text-xs font-bold tracking-widest uppercase transition-opacity hover:opacity-80 disabled:opacity-30"
            style={{ background: '#FF4D2E', color: '#FFFDF9' }}
          >
            시작 ({selected.size}개)
          </button>
        </div>
      </div>
    </div>
  );
}
