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
      if (categories.length === 1) return;
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
            address: doc.road_address_name || doc.address_name,
            phone: doc.phone || '',
            lat: parseFloat(doc.y),
            lng: parseFloat(doc.x),
            kakaoUrl: doc.place_url || '',
            distance: doc.distance,
            isBye: false,
          }))
        );
        router.push('/swipe');
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
    <div className="min-h-screen flex flex-col" style={{ background: '#FFFDF9' }}>
      {/* 헤더 */}
      <header className="flex items-center px-6 py-4" style={{ borderBottom: '1px solid #F0EDEA' }}>
        <button onClick={() => router.back()} className="text-sm mr-4 hover:opacity-60 transition-opacity" style={{ color: '#8C8C8C' }}>
          ←
        </button>
        <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: '#8C8C8C' }}>
          위치 설정
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
              Step 1
            </div>
            <h1 className="text-3xl font-black tracking-tight" style={{ color: '#1F1F1F' }}>
              어디서 먹을까요?
            </h1>
          </div>

          {/* 카테고리 필터 */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold tracking-widest uppercase" style={{ color: '#1F1F1F' }}>음식 종류</p>
              <span className="text-xs" style={{ color: '#8C8C8C' }}>{categories.length}개 선택</span>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-2">
              {CATEGORIES.map((cat) => {
                const selected = categories.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className="text-sm font-medium transition-all hover:opacity-80"
                    style={selected
                      ? { color: '#FF4D2E', fontWeight: 700 }
                      : { color: '#8C8C8C', fontWeight: 400 }
                    }
                  >
                    #{cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 현재 위치 버튼 */}
          <button
            onClick={useCurrentLocation}
            disabled={loading}
            className="w-full py-4 text-sm font-bold tracking-widest uppercase transition-opacity hover:opacity-80 disabled:opacity-40 mb-4"
            style={{ background: '#1F1F1F', color: '#FFFDF9' }}
          >
            {loading ? '위치 확인 중...' : '현재 위치 사용'}
          </button>

          {/* 구분선 */}
          <div className="flex items-center my-6">
            <div className="flex-1" style={{ height: 1, background: '#F0EDEA' }} />
            <span className="px-4 text-xs tracking-widest" style={{ color: '#8C8C8C' }}>OR</span>
            <div className="flex-1" style={{ height: 1, background: '#F0EDEA' }} />
          </div>

          {/* 지역 검색 */}
          <div className="space-y-3">
            <input
              type="text"
              placeholder="예: 홍대입구역, 강남역"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchAddress()}
              className="w-full px-4 py-3 text-sm outline-none transition-all"
              style={{
                background: '#F0EDEA',
                color: '#1F1F1F',
                border: '1.5px solid #F0EDEA',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#FF4D2E')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#F0EDEA')}
            />
            <button
              onClick={searchAddress}
              disabled={loading}
              className="w-full py-3 text-sm font-bold tracking-widest uppercase transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ background: '#FF4D2E', color: '#FFFDF9' }}
            >
              {loading ? '검색 중...' : '지역 검색'}
            </button>
          </div>

          {/* 에러 */}
          {error && (
            <div
              className="mt-4 px-4 py-3 text-xs"
              style={{ background: '#F0EDEA', color: '#FF4D2E', borderLeft: '3px solid #FF4D2E' }}
            >
              {error}
            </div>
          )}

          {/* 검색 예시 */}
          <div className="mt-6">
            <p className="text-xs mb-2" style={{ color: '#8C8C8C' }}>빠른 검색</p>
            <div className="flex flex-wrap gap-2">
              {['홍대입구역', '강남역', '부산 서면', '대구 동성로'].map((example) => (
                <button
                  key={example}
                  onClick={() => setSearchQuery(example)}
                  className="px-3 py-1 text-xs transition-all hover:opacity-60"
                  style={{ border: '1px solid #F0EDEA', color: '#8C8C8C', background: '#FFFDF9' }}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
