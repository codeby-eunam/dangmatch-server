'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTournamentStore } from '@/lib/store/tournament';

export default function AreaSearchPage() {
  const router = useRouter();
  const { location, setRestaurants } = useTournamentStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!location || !location.address) {
      router.push('/location');
      return;
    }

    searchRestaurants();
  }, []);

  const searchRestaurants = async () => {
    if (!location) return;

    try {
      // 지역명으로 검색 (반경 제한 없음)
      const response = await fetch(
        `/api/kakao/search-by-area?area=${encodeURIComponent(location.address!)}`
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

        setRestaurants(restaurants);
        router.push('/swipe');
      } else {
        alert('해당 지역에 식당이 없습니다.');
        router.push('/location');
      }
    } catch (error) {
      alert('검색 실패');
      router.push('/location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="text-4xl mb-4">🔍</div>
        <p className="text-gray-600">
          {location?.address} 맛집 검색 중...
        </p>
      </div>
    </div>
  );
}