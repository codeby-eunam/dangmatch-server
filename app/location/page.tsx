'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTournamentStore } from '@/lib/store/tournament';
import type { Location } from '@/types';

const CATEGORIES = ['한식', '중식', '일식', '양식', '분식', '카페', '기타'];

async function fetchByCategories(
  lat: number,
  lng: number,
  radius: number,
  categories: string[]
): Promise<any[]> {
  const maxPages = Math.max(1, Math.ceil(3 / categories.length));
  const results = await Promise.all(
    categories.map((cat) =>
      fetch(
        `/api/kakao/nearby?lat=${lat}&lng=${lng}&radius=${radius}&category=${encodeURIComponent(cat)}&maxPages=${maxPages}`
      ).then((r) => r.json())
    )
  );

  const seen = new Set<string>();
  return results
    .flatMap((data) => data.documents || [])
    .filter((doc) => {
      if (seen.has(doc.id)) return false;
      seen.add(doc.id);
      return true;
    });
}

export default function LocationPage() {
  const router = useRouter();
  const { setLocation, setRestaurants, categories, setCategories } = useTournamentStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleCategory = (cat: string) => {
    if (categories.includes(cat)) {
      if (categories.length === 1) return; // 최소 1개 유지
      setCategories(categories.filter((c) => c !== cat));
    } else {
      setCategories([...categories, cat]);
    }
    setError(null);
  };

  const useCurrentLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('위치 서비스를 지원하지 않는 브라우저입니다');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        router.push('/radius');
      },
      () => {
        setError('위치 권한을 허용해주세요');
        setLoading(false);
      }
    );
  };

  const searchRestaurantsDirectly = async (location: Location) => {
    try {
      const radius = 3000;
      const documents = await fetchByCategories(location.lat, location.lng, radius, categories);

      if (documents.length > 0) {
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
            isBye: false,
          }))
        );
        router.push(documents.length > 16 ? '/swipe' : '/restaurants');
      } else {
        setError('해당 지역에 식당이 없습니다. 다른 지역을 검색해보세요.');
      }
    } catch {
      setError('식당 검색에 실패했습니다');
    }
  };

  const searchAddress = async () => {
    if (!searchQuery.trim()) {
      setError('지역을 입력해주세요');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/kakao/search-location?query=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();

      if (data.documents && data.documents.length > 0) {
        const first = data.documents[0];
        const location = {
          lat: parseFloat(first.y),
          lng: parseFloat(first.x),
          address: first.address_name || first.place_name,
        };
        setLocation(location);
        await searchRestaurantsDirectly(location);
      } else {
        setError('검색 결과가 없습니다. 다른 키워드로 시도해보세요.');
      }
    } catch {
      setError('검색에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-2">어디서 먹을까요?</h1>
        <p className="text-gray-600 text-center mb-6">위치를 설정해주세요</p>

        {/* 카테고리 필터 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">음식 종류</p>
            <span className="text-xs text-gray-400">{categories.length}개 선택됨</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const selected = categories.includes(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition ${
                    selected
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* 현재 위치 */}
        <button
          onClick={useCurrentLocation}
          disabled={loading}
          className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed mb-4 transition"
        >
          {loading ? '위치 확인 중...' : '📍 현재 위치 사용'}
        </button>

        {/* 구분선 */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-gray-500 text-sm">또는</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* 지역 검색 */}
        <div className="space-y-3">
          <input
            type="text"
            placeholder="예: 홍대입구역, 강남역"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchAddress()}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={searchAddress}
            disabled={loading}
            className="w-full py-3 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-900 disabled:bg-gray-400 transition"
          >
            🔍 지역 검색
          </button>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* 예시 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-2">💡 검색 예시</p>
          <div className="flex flex-wrap gap-2">
            {['홍대입구역', '강남역', '부산 서면', '대구 동성로'].map((example) => (
              <button
                key={example}
                onClick={() => setSearchQuery(example)}
                className="px-3 py-1 bg-white border border-gray-300 rounded-full text-xs hover:border-blue-500 hover:text-blue-600 transition"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
