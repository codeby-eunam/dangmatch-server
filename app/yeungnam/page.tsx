'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { useTournamentStore } from '@/lib/store/tournament';
import { getSchoolRestaurantRanking, nominateRestaurantToSchoolFeed } from '@/lib/firebase/school-feeds';
import type { SchoolFeedRestaurant, Restaurant } from '@/types';

const YNU_DOMAIN = 'ynu';
const YNU_LAT = 35.8384;
const YNU_LNG = 128.7525;
const YNU_DEFAULT_RADIUS = 1000;

function getCategoryEmoji(category: string) {
  const cat = category.toLowerCase();
  if (cat.includes('카페') || cat.includes('커피')) return '☕';
  if (cat.includes('한식')) return '🍚';
  if (cat.includes('일식') || cat.includes('초밥')) return '🍣';
  if (cat.includes('중식') || cat.includes('중국')) return '🥡';
  if (cat.includes('양식') || cat.includes('파스타')) return '🍝';
  if (cat.includes('치킨') || cat.includes('닭')) return '🍗';
  if (cat.includes('피자')) return '🍕';
  if (cat.includes('버거') || cat.includes('햄버거')) return '🍔';
  if (cat.includes('분식') || cat.includes('떡볶이')) return '🍢';
  if (cat.includes('고기') || cat.includes('삼겹')) return '🥩';
  return '🍽️';
}

// ─── 식당 추가 모달 ────────────────────────────────────────────────────────────

function AddRestaurantModal({
  uid,
  onClose,
  onAdded,
}: {
  uid: string;
  onClose: () => void;
  onAdded: (name: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Restaurant[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/kakao/keyword?q=${encodeURIComponent(query.trim())}&lat=${YNU_LAT}&lng=${YNU_LNG}&radius=2000`
        );
        const data = await res.json();
        const docs = data.documents ?? [];
        setResults(
          docs.map((d: Record<string, string>) => ({
            id: d.id,
            name: d.place_name,
            category: d.category_name ?? '',
            address: d.road_address_name || d.address_name,
            phone: d.phone ?? '',
            lat: parseFloat(d.y),
            lng: parseFloat(d.x),
            kakaoUrl: d.place_url,
          }))
        );
      } finally {
        setSearching(false);
      }
    }, 350);
  }, [query]);

  async function handleSelect(restaurant: Restaurant) {
    setSubmitting(restaurant.id);
    try {
      await nominateRestaurantToSchoolFeed(YNU_DOMAIN, uid, restaurant);
      onAdded(restaurant.name);
    } catch (err) {
      console.error('[YNU] 식당 추가 실패', err);
      alert('식당 추가에 실패했어요. 콘솔을 확인해주세요.');
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full flex flex-col"
        style={{
          background: '#F5EDD0',
          borderRadius: '12px 12px 0 0',
          border: '2px solid #1A1A1A',
          maxHeight: '80vh',
        }}
      >
        {/* 헤더 */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '2px solid #1A1A1A' }}
        >
          <div>
            <p className="text-xs font-black tracking-widest uppercase" style={{ color: '#FF9900' }}>
              YNU FOOD
            </p>
            <p className="text-sm font-black" style={{ color: '#1A1A1A' }}>
              영남대 근처 식당 추가
            </p>
          </div>
          <button onClick={onClose} className="text-lg font-black" style={{ color: '#8C8C8C' }}>
            ✕
          </button>
        </div>

        {/* 검색창 */}
        <div className="px-6 py-4 flex-shrink-0">
          <div className="relative">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="식당 이름 검색 (예: 돈까스, 파스타)"
              className="w-full px-4 py-3 text-sm font-bold outline-none"
              style={{
                background: '#FFFFFF',
                border: '2px solid #1A1A1A',
                borderRadius: 4,
                color: '#1A1A1A',
              }}
            />
            {searching && (
              <div
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 rounded-full animate-spin"
                style={{ borderColor: '#FF9900', borderTopColor: 'transparent' }}
              />
            )}
          </div>
          <p className="text-xs mt-2" style={{ color: '#8C8C8C' }}>
            영남대 반경 2km 이내 식당만 검색됩니다
          </p>
        </div>

        {/* 결과 목록 */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 flex flex-col gap-2">
          {!query.trim() && (
            <div className="flex flex-col items-center py-10 gap-2">
              <span className="text-4xl">🔍</span>
              <p className="text-sm" style={{ color: '#8C8C8C' }}>
                식당 이름을 입력하면 검색됩니다
              </p>
            </div>
          )}
          {!searching && query.trim() && results.length === 0 && (
            <p className="text-sm text-center py-8" style={{ color: '#8C8C8C' }}>
              검색 결과가 없습니다
            </p>
          )}
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => handleSelect(r)}
              disabled={!!submitting}
              className="w-full flex items-center gap-3 px-4 py-3 text-left"
              style={{
                background: '#FFFFFF',
                border: '2px solid #1A1A1A',
                borderRadius: 4,
                opacity: submitting === r.id ? 0.6 : 1,
              }}
            >
              <span className="text-xl flex-shrink-0">{getCategoryEmoji(r.category)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black truncate" style={{ color: '#1A1A1A' }}>
                  {r.name}
                </p>
                <p className="text-xs truncate" style={{ color: '#8C8C8C' }}>
                  {r.address}
                </p>
              </div>
              <span className="text-xs font-black flex-shrink-0" style={{ color: '#FF9900' }}>
                {submitting === r.id ? '...' : '+ 추가'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────────

export default function YeungnamPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const { setLocation, setRadius, setRestaurants, setSwipedRestaurants, reset } = useTournamentStore();

  const [ranking, setRanking] = useState<SchoolFeedRestaurant[]>([]);
  const [rankingLoading, setRankingLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    getSchoolRestaurantRanking(YNU_DOMAIN, 20)
      .then(setRanking)
      .catch(console.error)
      .finally(() => setRankingLoading(false));
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function handleAdded(name: string) {
    setShowAddModal(false);
    showToast(`"${name}" 추가 완료!`);
    // 랭킹 새로고침
    getSchoolRestaurantRanking(YNU_DOMAIN, 20).then(setRanking).catch(console.error);
  }

  function startService(mode: 'swipe' | 'tournament') {
    if (ranking.length === 0) {
      showToast('아직 추가된 식당이 없어요');
      return;
    }
    const restaurants = ranking.map((item) => item.restaurant);
    reset();
    setLocation({ lat: YNU_LAT, lng: YNU_LNG, address: '영남대학교' });
    setRadius(YNU_DEFAULT_RADIUS);
    setRestaurants(restaurants);
    setSwipedRestaurants(restaurants);
    router.push(mode === 'swipe' ? '/yeungnam/swipe' : '/yeungnam/tournament');
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5EDD0' }}>
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: '#FF9900', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5EDD0' }}>
      {/* 헤더 */}
      <header
        className="flex-shrink-0 px-6 pt-6 pb-4"
        style={{ borderBottom: '2px solid #1A1A1A' }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 mr-3">
            <p className="text-xs font-black tracking-widest uppercase" style={{ color: '#FF9900' }}>
              YNU FOOD
            </p>
            <h1 className="text-2xl font-black mt-0.5" style={{ color: '#1A1A1A' }}>
              영남대학교 맛집
            </h1>
            <p className="text-xs mt-1" style={{ color: '#8C8C8C' }}>
              🎓 영남대 학생들이 직접 고른 맛집 랭킹
            </p>
          </div>
          {user ? (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-black"
              style={{
                background: '#FF9900',
                border: '2px solid #1A1A1A',
                borderRadius: 4,
                color: '#1A1A1A',
                flexShrink: 0,
              }}
            >
              + 식당 추가
            </button>
          ) : (
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-1 px-4 py-2.5 text-xs font-black"
              style={{
                background: 'transparent',
                border: '2px solid #1A1A1A',
                borderRadius: 4,
                color: '#1A1A1A',
                flexShrink: 0,
              }}
            >
              로그인
            </button>
          )}
        </div>
      </header>

      {/* 랭킹 */}
      <main className="flex-1 overflow-y-auto pb-36">
        <div className="px-6 pt-5 pb-2">
          <p className="text-xs font-black tracking-widest uppercase" style={{ color: '#1A1A1A' }}>
            🏆 맛집 랭킹 TOP {ranking.length > 0 ? ranking.length : 20}
          </p>
        </div>

        {rankingLoading ? (
          <div className="flex items-center justify-center py-20">
            <div
              className="w-8 h-8 border-2 rounded-full animate-spin"
              style={{ borderColor: '#FF9900', borderTopColor: 'transparent' }}
            />
          </div>
        ) : ranking.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-3">
            <span className="text-5xl">🍽️</span>
            <p className="font-black text-lg" style={{ color: '#1A1A1A' }}>
              아직 랭킹이 없어요
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#5C5C5C' }}>
              아래 버튼으로 토너먼트나 스와이프를 즐기면<br />
              영남대 맛집 랭킹이 자동으로 쌓여요!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 px-4 py-3">
            {ranking.map((item, idx) => {
              const studentCount = (item.contributedBy as string[] | undefined)?.length ?? 0;
              return (
                <div
                  key={item.restaurant.id}
                  className="flex items-center gap-3 px-4 py-4"
                  style={{
                    background: '#FFFFFF',
                    border: '2px solid #1A1A1A',
                    borderRadius: 4,
                  }}
                >
                  {/* 순위 뱃지 */}
                  <div
                    className="w-8 h-8 flex-shrink-0 flex items-center justify-center font-black text-sm"
                    style={{
                      background:
                        idx === 0 ? '#FF9900' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : '#F0EDEA',
                      color: idx < 3 ? '#FFFFFF' : '#1A1A1A',
                      borderRadius: 2,
                    }}
                  >
                    {idx + 1}
                  </div>

                  {/* 카테고리 이모지 */}
                  <span className="text-xl flex-shrink-0">
                    {getCategoryEmoji(item.restaurant.category)}
                  </span>

                  {/* 식당 정보 */}
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm truncate" style={{ color: '#1A1A1A' }}>
                      {item.restaurant.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {studentCount > 0 && (
                        <span className="text-xs font-bold" style={{ color: '#FF9900' }}>
                          🎓 {studentCount}명 선택
                        </span>
                      )}
                      <span className="text-xs" style={{ color: '#8C8C8C' }}>
                        🏆{item.winCount} · ♥{item.likeCount}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 하단 버튼 */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 py-4 flex gap-3"
        style={{
          background: '#F5EDD0',
          borderTop: '2px solid #1A1A1A',
        }}
      >
        <button
          onClick={() => startService('swipe')}
          className="flex-1 py-4 font-black text-sm"
          style={{
            background: '#1A1A1A',
            borderRadius: 4,
            color: '#F5EDD0',
            border: '2px solid #1A1A1A',
          }}
        >
          스와이프
        </button>
        <button
          onClick={() => startService('tournament')}
          className="flex-1 py-4 font-black text-sm"
          style={{
            background: '#FF9900',
            borderRadius: 4,
            color: '#1A1A1A',
            border: '2px solid #1A1A1A',
          }}
        >
          토너먼트
        </button>
      </div>

      {/* 식당 추가 모달 */}
      {showAddModal && user && (
        <AddRestaurantModal
          uid={user.uid}
          onClose={() => setShowAddModal(false)}
          onAdded={handleAdded}
        />
      )}

      {/* 토스트 */}
      {toast && (
        <div
          className="fixed bottom-32 left-1/2 -translate-x-1/2 px-5 py-3 text-xs font-black z-50 whitespace-nowrap"
          style={{ background: '#1A1A1A', color: '#FF9900', borderRadius: 2 }}
        >
          ★ {toast}
        </div>
      )}
    </div>
  );
}
