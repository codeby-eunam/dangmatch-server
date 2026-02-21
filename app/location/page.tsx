'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTournamentStore } from '@/lib/store/tournament';

export default function LocationPage() {
  const router = useRouter();
  const { setLocation } = useTournamentStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setLocation(
			{
				lat: position.coords.latitude,
				lng: position.coords.longitude
        	},
			'current'
		);
        router.push('/radius');
      },
      (err) => {
        setError('위치 권한을 허용해주세요');
        setLoading(false);
      }
    );
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
        `/api/kakao/search-address?query=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();

      if (data.documents && data.documents.length > 0) {
        const first = data.documents[0];
        setLocation(
			{
				lat: parseFloat(first.y),
				lng: parseFloat(first.x),
				address: first.address_name
        	},
			'area'
		);
        router.push('/radius');
      } else {
        setError('검색 결과가 없습니다. 다시 시도해주세요.');
      }
    } catch (err) {
      setError('검색에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-2">
          어디서 먹을까요?
        </h1>
        <p className="text-gray-600 text-center mb-8">
          위치를 설정해주세요
        </p>

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
            placeholder="예: 부산 남포동, 강남역"
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
            {['홍대입구', '강남역', '부산 남포동', '대구 동성로'].map(example => (
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