// DANGMATCH API SERVER

/*
'use client';

import { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useTournamentStore } from '@/lib/store/tournament';
import { upsertRestaurants } from '@/lib/firebase/restaurants';
import { useAuthStore } from '@/lib/store/auth';
import type { Restaurant } from '@/types';

const SWIPE_THRESHOLD = 80;

function getCategoryEmoji(category: string) {
  const cat = category.toLowerCase();
  if (cat.includes('카페') || cat.includes('커피')) return '☕';
  if (cat.includes('한식')) return '🍚';
  if (cat.includes('일식') || cat.includes('초밥') || cat.includes('스시')) return '🍣';
  if (cat.includes('중식') || cat.includes('중국')) return '🥡';
  if (cat.includes('양식') || cat.includes('이탈리아') || cat.includes('파스타')) return '🍝';
  if (cat.includes('치킨') || cat.includes('닭')) return '🍗';
  if (cat.includes('피자')) return '🍕';
  if (cat.includes('버거') || cat.includes('햄버거')) return '🍔';
  if (cat.includes('분식') || cat.includes('떡볶이')) return '🍢';
  if (cat.includes('고기') || cat.includes('삼겹') || cat.includes('갈비')) return '🥩';
  if (cat.includes('해산물') || cat.includes('회') || cat.includes('횟집')) return '🦞';
  if (cat.includes('술') || cat.includes('주점') || cat.includes('bar')) return '🍺';
  return '🍽️';
}

function getDistanceText(distance?: string) {
  if (!distance) return '';
  const dist = parseInt(distance);
  if (dist < 1000) return `${dist}m`;
  return `${(dist / 1000).toFixed(1)}km`;
}

// ─── SwipeCard ────────────────────────────────────────────────────────────────

interface SwipeCardRef {
  swipeLeft: () => Promise<void>;
  swipeRight: () => Promise<void>;
}

interface SwipeCardProps {
  restaurant: Restaurant;
  onSwipe: (dir: 'left' | 'right') => void;
  stackIndex: number;
  disabled?: boolean;
}

const SwipeCard = forwardRef<SwipeCardRef, SwipeCardProps>(
  ({ restaurant, onSwipe, stackIndex, disabled }, ref) => {
    const isTop = stackIndex === 0;

    const x = useMotionValue(0);
    const rotate = useTransform(x, [-220, 220], [-10, 10]);
    const pickOpacity = useTransform(x, [30, 100], [0, 1]);
    const skipOpacity = useTransform(x, [-100, -30], [1, 0]);

    const doSwipe = async (dir: 'left' | 'right') => {
      await animate(x, dir === 'right' ? 600 : -600, {
        duration: 0.28,
        ease: 'easeOut',
      });
      onSwipe(dir);
    };

    useImperativeHandle(ref, () => ({
      swipeLeft: () => doSwipe('left'),
      swipeRight: () => doSwipe('right'),
    }));

    const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
      if (info.offset.x > SWIPE_THRESHOLD) {
        doSwipe('right');
      } else if (info.offset.x < -SWIPE_THRESHOLD) {
        doSwipe('left');
      } else {
        animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
      }
    };

    return (
      <motion.div
        animate={{
          scale: 1 - stackIndex * 0.05,
          y: stackIndex * 14,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        style={{
          x: isTop ? x : 0,
          rotate: isTop ? rotate : 0,
          zIndex: 10 - stackIndex,
          position: 'absolute',
          width: '100%',
          touchAction: 'none',
        }}
        drag={isTop && !disabled ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={isTop ? handleDragEnd : undefined}
        className="cursor-grab active:cursor-grabbing"
      >
        // { PICK 스탬프 }
        {isTop && (
          <motion.div
            style={{ opacity: pickOpacity, border: '3px solid #FF7F50', color: '#FF7F50' }}
            className="absolute top-5 left-4 z-20 font-black text-lg px-3 py-1 select-none pointer-events-none -rotate-12 rounded-lg"
          >
            PICK
          </motion.div>
        )}
        // { SKIP 스탬프 }
        {isTop && (
          <motion.div
            style={{ opacity: skipOpacity, border: '3px solid #8C8C8C', color: '#8C8C8C' }}
            className="absolute top-5 right-4 z-20 font-black text-lg px-3 py-1 select-none pointer-events-none rotate-12 rounded-lg"
          >
            SKIP
          </motion.div>
        )}

        // { 카드 본체 }
        <div
          className="overflow-hidden mx-1 select-none"
          style={{
            background: '#FFFFFF',
            borderRadius: 20,
            boxShadow: isTop
              ? '0 12px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.07)'
              : '0 6px 20px rgba(0,0,0,0.07)',
          }}
        >
        //   { 이미지 영역 }
          <div
            className="w-full overflow-hidden relative"
            style={{ height: 220, background: '#F5EDD0' }}
          >
            {restaurant.images?.[0] ? (
              <img
                src={restaurant.images[0]}
                alt={restaurant.name}
                className="w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-8xl">{getCategoryEmoji(restaurant.category)}</span>
              </div>
            )}
            // { 거리 배지 }
            {restaurant.distance && (
              <div
                className="absolute top-3 right-3 text-xs font-semibold px-3 py-1"
                style={{
                  background: 'rgba(255,255,255,0.95)',
                  color: '#8C8C8C',
                  borderRadius: 20,
                }}
              >
                {getDistanceText(restaurant.distance)}
              </div>
            )}
          </div>

        //   { 정보 }
          <div className="px-5 py-4">
            // { 카테고리 칩 }
            <div className="mb-2">
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: '#E6F7F7', color: '#2EB8B8' }}
              >
                {restaurant.category.split('>').pop()?.trim()}
              </span>
            </div>
            <h2 className="text-xl font-bold mb-1 truncate" style={{ color: '#1a2a4a' }}>
              {restaurant.name}
            </h2>
            <p className="text-xs leading-relaxed" style={{ color: '#8C8C8C' }}>
              {restaurant.address}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }
);

SwipeCard.displayName = 'SwipeCard';

// ─── SwipePage ────────────────────────────────────────────────────────────────

export default function SwipePage() {
  const router = useRouter();
  const { restaurants, setSwipedRestaurants, setFinalWinner } = useTournamentStore();
  const { user } = useAuthStore();

  const cardRef = useRef<SwipeCardRef>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipedRight, setSwipedRight] = useState<Restaurant[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const sortedRestaurants = (() => {
    return [...restaurants].sort((a, b) => {
      const distA = parseInt(a.distance || '999999');
      const distB = parseInt(b.distance || '999999');
      return distA - distB;
    });
  })();

  const total = sortedRestaurants.length;
  const allSwiped = currentIndex >= total;
  const selectedCount = swipedRight.length;
  const canStart = selectedCount >= 1;

  useEffect(() => {
    if (restaurants.length === 0) {
      router.push('/location');
      return;
    }
    upsertRestaurants(restaurants).catch((err) =>
      console.error('[Firestore upsert 실패]', err)
    );
  }, [restaurants, router]);

  const handleSwipe = (dir: 'left' | 'right') => {
    const restaurant = sortedRestaurants[currentIndex];
    if (dir === 'right' && restaurant) {
      setSwipedRight((prev) => [...prev, restaurant]);
      if (user?.uid && user.school?.domain) {
        recordSchoolLike(user.school.domain, user.uid, restaurant);
      }
    }
    setCurrentIndex((prev) => prev + 1);
    setIsAnimating(false);
  };

  const handleButtonSwipe = async (dir: 'left' | 'right') => {
    if (isAnimating || allSwiped || !cardRef.current) return;
    setIsAnimating(true);
    try {
      if (dir === 'right') {
        await cardRef.current.swipeRight();
      } else {
        await cardRef.current.swipeLeft();
      }
    } finally {
      setIsAnimating(false);
    }
  };

  const startTournament = () => {
    if (selectedCount === 0) return;
    if (selectedCount === 1) {
      setFinalWinner(swipedRight[0]);
      router.push('/result');
      return;
    }
    setSwipedRestaurants(swipedRight);
    router.push('/tournament');
  };

  const visibleCards = [0, 1, 2]
    .map((offset) => sortedRestaurants[currentIndex + offset])
    .filter(Boolean) as Restaurant[];

  const progressPercent = total > 0 ? (currentIndex / total) * 100 : 0;

  if (restaurants.length === 0) return null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F8F9FA' }}>
    //   { 헤더 }
      <header
        className="flex items-center justify-between px-5 pt-5 pb-4"
        style={{ background: '#FFFFFF', borderBottom: '1px solid #F0F0F0' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center transition-opacity hover:opacity-70 rounded-full"
            style={{ background: '#F5F5F5' }}
            aria-label="뒤로가기"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M19 12H5M5 12l7-7M5 12l7 7"
                stroke="#1a2a4a"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <span className="text-base font-bold" style={{ color: '#1a2a4a' }}>
            음식 선택
          </span>
        </div>
        <div
          className="px-3 py-1.5 rounded-full"
          style={{ background: '#E6F7F7' }}
        >
          <span className="text-sm font-bold" style={{ color: '#2EB8B8' }}>
            {selectedCount} / {total}
          </span>
        </div>
      </header>

    //   { 진행 바 }
      <div style={{ background: '#F0F0F0', height: 4 }}>
        <div
          className="transition-all duration-300"
          style={{ width: `${progressPercent}%`, background: '#2EB8B8', height: 4 }}
        />
      </div>

    //   { 카드 영역 }
      <div className="flex-1 flex items-start justify-center px-4 pt-6">
        {allSwiped ? (
          <div className="text-center mt-12 px-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
              style={{ background: '#E6F7F7', color: '#2EB8B8' }}
            >
              ✓
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#1a2a4a' }}>
              모두 확인했어요!
            </h2>
            <p style={{ color: '#8C8C8C' }}>{selectedCount}개 선택됨</p>
            {redirectCountdown !== null && (
              <p className="mt-4 text-xs" style={{ color: '#8C8C8C' }}>
                {redirectCountdown}초 후 위치 선택으로 돌아갑니다
              </p>
            )}
          </div>
        ) : (
          <div className="relative w-full max-w-sm" style={{ height: 380 }}>
            {[...visibleCards].reverse().map((restaurant, reversedIdx) => {
              const stackIndex = visibleCards.length - 1 - reversedIdx;
              return (
                <SwipeCard
                  key={restaurant.id}
                  ref={stackIndex === 0 ? cardRef : undefined}
                  restaurant={restaurant}
                  onSwipe={stackIndex === 0 ? handleSwipe : () => {}}
                  stackIndex={stackIndex}
                  disabled={isAnimating}
                />
              );
            })}
          </div>
        )}
      </div>

    //   { 하단 컨트롤 }
      <div className="px-6 pb-6 pt-4">
        {!allSwiped && (
          <div className="flex items-center justify-center gap-6 mb-5">
            // { 건너뛰기 버튼 }
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={() => handleButtonSwipe('left')}
                disabled={isAnimating}
                className="w-14 h-14 flex items-center justify-center transition-all hover:opacity-70 active:scale-95 disabled:opacity-30 rounded-full"
                style={{
                  background: '#FFFFFF',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
                  border: '1.5px solid #EBEBEB',
                }}
                aria-label="건너뛰기"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="#8C8C8C"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <span className="text-xs" style={{ color: '#8C8C8C' }}>건너뛰기</span>
            </div>

            // { 선택 버튼 }
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={() => handleButtonSwipe('right')}
                disabled={isAnimating}
                className="w-16 h-16 flex items-center justify-center transition-all hover:opacity-80 active:scale-95 disabled:opacity-30 rounded-full"
                style={{
                  background: '#FF7F50',
                  boxShadow: '0 6px 20px rgba(255,127,80,0.40)',
                }}
                aria-label="선택"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12l5 5L19 7"
                    stroke="#FFFFFF"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <span className="text-xs font-semibold" style={{ color: '#FF7F50' }}>선택</span>
            </div>

            // { 즐겨찾기 버튼 }
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={() => {
                  const current = sortedRestaurants[currentIndex];
                  if (current) setListModalRestaurant(current);
                }}
                disabled={isAnimating}
                className="w-14 h-14 flex items-center justify-center transition-all hover:opacity-70 active:scale-95 disabled:opacity-30 rounded-full"
                style={{
                  background: '#E0FAF0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
                aria-label="즐겨찾기"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z"
                    stroke="#2EB8B8"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <span className="text-xs" style={{ color: '#8C8C8C' }}>즐겨찾기</span>
            </div>
          </div>
        )}

        // { 토너먼트 시작 버튼 }
        <button
          onClick={startTournament}
          disabled={!canStart}
          className="w-full py-4 text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-40 rounded-2xl"
          style={{
            background: canStart ? '#FF7F50' : '#E0E0E0',
            color: canStart ? '#FFFFFF' : '#8C8C8C',
            boxShadow: canStart ? '0 6px 20px rgba(255,127,80,0.35)' : 'none',
          }}
        >
          {selectedCount === 0
            ? '아직 선택한 식당이 없어요'
            : selectedCount === 1
            ? '바로 결정 (1개)'
            : `토너먼트 시작 (${selectedCount}개)`}
        </button>
      </div>

    //   { 즐겨찾기 모달 }
      {listModalRestaurant && (
        <ListSelectorModal
          restaurant={listModalRestaurant}
          onClose={() => setListModalRestaurant(null)}
          onSaved={(listTitle) => {
            setListModalRestaurant(null);
            setSavedToast(`"${listTitle}" 에 저장됨`);
            setTimeout(() => setSavedToast(null), 2500);
          }}
        />
      )}

    //   {/* 저장 토스트 *}
      {savedToast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 px-5 py-3 text-sm font-semibold z-50 pointer-events-none rounded-xl"
          style={{ background: '#1a2a4a', color: '#FFFFFF', whiteSpace: 'nowrap' }}
        >
          {savedToast}
        </div>
      )}
    </div>
  );
}
  */
