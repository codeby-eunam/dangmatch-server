'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTournamentStore } from '@/lib/store/tournament';

export default function RestaurantsPage() {
  const router = useRouter();
  const { restaurants: allRestaurants, setRestaurants } = useTournamentStore();
  
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  // 식당 데이터 없으면 리다이렉트
  useEffect(() => {
    if (allRestaurants.length === 0) {
      router.push('/location');
    }
  }, [allRestaurants, router]);

  // 거리순 정렬
  const sortedRestaurants = [...allRestaurants].sort((a, b) => {
    const distA = parseInt(a.distance || '999999');
    const distB = parseInt(b.distance || '999999');
    return distA - distB;
  });

  // 초기 선택: 가까운 순 16개
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
	
	// 선택된 식당만 필터링
	const selectedRestaurants = sortedRestaurants.filter(r => selected.has(r.id));
	
	console.log('🏁 토너먼트 시작:', selectedRestaurants.length, '개');
	
	setRestaurants(selectedRestaurants); // 스토어 업데이트
	router.push('/tournament');
	};

  const displayRestaurants = showAll 
    ? sortedRestaurants 
    : sortedRestaurants.slice(0, 20);

  if (allRestaurants.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 헤더 */}
      <div className="sticky top-0 bg-white shadow-sm z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">식당 선택</h1>
          <p className="text-sm text-gray-600 mt-1">
            총 {allRestaurants.length}개 · {selected.size}/16개 선택됨
          </p>
        </div>
      </div>

      {/* 안내 */}
      {allRestaurants.length > 16 && (
        <div className="max-w-2xl mx-auto px-4 py-3 mt-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 가까운 순으로 16개가 자동 선택되었습니다. 변경하려면 식당을 탭하세요.
          </p>
        </div>
      )}

      {/* 식당 목록 */}
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {displayRestaurants.map((restaurant) => {
          const isSelected = selected.has(restaurant.id);
          
          return (
            <button
              key={restaurant.id}
              onClick={() => toggleSelect(restaurant.id)}
              className={`w-full p-4 rounded-xl border-2 transition text-left ${
                isSelected
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-blue-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">
                    {restaurant.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-1">
                    {restaurant.category.split('>').pop()?.trim()}
                  </p>
                  <p className="text-xs text-gray-500">
                    📍 {parseInt(restaurant.distance || '0')}m
                  </p>
                </div>
                <div className="ml-3">
                  {isSelected && (
                    <span className="text-blue-600 text-2xl">✓</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {!showAll && sortedRestaurants.length > 20 && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full py-3 text-blue-600 hover:text-blue-700"
          >
            전체 {sortedRestaurants.length}개 보기 →
          </button>
        )}
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4 flex gap-3">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 text-gray-600 hover:text-gray-800"
          >
            ← 뒤로
          </button>
          <button
            onClick={() => router.push('/swipe')}
            className="flex-1 py-3 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600"
          >
            👆 스와이프로 선택
          </button>
          <button
            onClick={startTournament}
            disabled={selected.size < 2}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            목록으로 시작 ({selected.size}개)
          </button>
        </div>
      </div>
    </div>
  );
}