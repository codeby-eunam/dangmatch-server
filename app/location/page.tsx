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
    <div className="min-h-screen flex flex-col" style={{ background: '#FFFFFF' }}>
      {/* 헤더 */}
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '2px solid #1A1A1A' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 flex items-center justify-center text-sm font-black"
            style={{ background: '#FF9900', color: '#FFFFFF', borderRadius: 4 }}
          >
            A
          </div>
          <span className="text-sm font-black tracking-[0.2em] uppercase" style={{ color: '#1A1A1A' }}>
            위치 설정
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-xs font-bold hover:opacity-60 transition-opacity" style={{ color: '#8C8C8C' }}>
            ← BACK
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          {/* 타이틀 */}
          <div className="mb-8">
            <h1 className="text-4xl font-black tracking-tight mb-2" style={{ color: '#1A1A1A' }}>
              어디에{' '}
              <span style={{ color: '#FF9900' }}>계신가요?</span>
            </h1>
            <p className="text-sm" style={{ color: '#8C8C8C' }}>
              모험을 시작하기 위해 원하는 위치를 골라주세요!
            </p>
          </div>

          {/* 카테고리 필터 */}
          <div className="mb-6 p-4" style={{ background: '#F5EDD0', border: '1px solid #E8DDB8', borderRadius: 4 }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-black tracking-widest uppercase" style={{ color: '#1A1A1A' }}>음식 종류</p>
              <span
                className="text-xs font-bold px-2 py-0.5"
                style={{ background: '#1C8B40', color: '#FFFFFF', borderRadius: 2 }}
              >
                {categories.length}개 선택
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const selected = categories.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className="px-3 py-1.5 text-xs font-bold transition-all hover:opacity-80"
                    style={selected
                      ? { background: '#FF9900', color: '#FFFFFF', borderRadius: 2 }
                      : { background: '#FFFFFF', color: '#8C8C8C', border: '1px solid #E8DDB8', borderRadius: 2 }
                    }
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 내 위치 찾기 버튼 */}
          <button
            onClick={useCurrentLocation}
            disabled={loading}
            className="w-full py-4 text-sm font-black tracking-widest uppercase transition-opacity hover:opacity-80 disabled:opacity-40 mb-4"
            style={{ background: '#FF9900', color: '#FFFFFF', borderRadius: 2 }}
          >
            {loading ? '위치 확인 중...' : '📍 내 위치 찾기'}
          </button>

          {/* 검색 바 */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="도시 이름 검색 지역"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchAddress()}
              className="flex-1 px-4 py-3 text-sm outline-none transition-all"
              style={{
                border: '2px solid #E8DDB8',
                borderRadius: 2,
                background: '#FFFFFF',
                color: '#1A1A1A',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#FF9900')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#E8DDB8')}
            />
            <button
              onClick={searchAddress}
              disabled={loading}
              className="px-5 py-3 text-sm font-black tracking-wider uppercase transition-opacity hover:opacity-80 disabled:opacity-40 whitespace-nowrap"
              style={{ background: '#1A1A1A', color: '#FFFFFF', borderRadius: 2 }}
            >
              {loading ? '...' : '검색'}
            </button>
          </div>

          {/* 에러 */}
          {error && (
            <div
              className="mb-4 px-4 py-3 text-xs"
              style={{ background: '#FFF0D0', color: '#CC4400', border: '1px solid #FF9900', borderRadius: 2 }}
            >
              {error}
            </div>
          )}

          {/* 빠른 검색 */}
          <div>
            <p className="text-xs font-bold mb-2" style={{ color: '#8C8C8C' }}>빠른 검색</p>
            <div className="flex flex-wrap gap-2">
              {['홍대입구역', '강남역', '부산 서면', '대구 동성로'].map((example) => (
                <button
                  key={example}
                  onClick={() => setSearchQuery(example)}
                  className="px-3 py-1 text-xs transition-all hover:opacity-70"
                  style={{ border: '1px solid #E8DDB8', color: '#8C8C8C', background: '#FFFFFF', borderRadius: 2 }}
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
