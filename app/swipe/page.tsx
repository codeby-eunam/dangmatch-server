'use client';

import { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useTournamentStore } from '@/lib/store/tournament';
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
  if (!distance) return '거리 정보 없음';
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
    const rotate = useTransform(x, [-220, 220], [-18, 18]);
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
        {/* PICK 표시 */}
        {isTop && (
          <motion.div
            style={{ opacity: pickOpacity }}
            className="absolute top-6 left-5 z-20 border-4 border-green-500 text-green-500
                       font-black text-xl px-3 py-1 rounded-lg select-none pointer-events-none
                       -rotate-12"
          >
            PICK ✅
          </motion.div>
        )}
        {/* SKIP 표시 */}
        {isTop && (
          <motion.div
            style={{ opacity: skipOpacity }}
            className="absolute top-6 right-5 z-20 border-4 border-red-500 text-red-500
                       font-black text-xl px-3 py-1 rounded-lg select-none pointer-events-none"
          >
            SKIP ❌
          </motion.div>
        )}

        {/* 카드 본체 */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mx-2 select-none">
          {/* 이미지 */}
          <div className="w-full h-56 bg-gradient-to-br from-orange-50 to-pink-100 flex items-center justify-center overflow-hidden">
            {restaurant.imageUrl ? (
              <img
                src={restaurant.imageUrl}
                alt={restaurant.name}
                className="w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <span className="text-8xl">{getCategoryEmoji(restaurant.category)}</span>
            )}
          </div>

          {/* 정보 */}
          <div className="px-6 py-5">
            <h2 className="text-2xl font-bold mb-1 truncate">{restaurant.name}</h2>
            <p className="text-gray-500 mb-2 text-sm">
              {restaurant.category.split('>').pop()?.trim()}
            </p>
            <p className="text-sm text-gray-400">📍 {getDistanceText(restaurant.distance)}</p>
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

  const cardRef = useRef<SwipeCardRef>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipedRight, setSwipedRight] = useState<Restaurant[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  // 거리순 정렬 (한 번만 계산)
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
    }
  }, [restaurants, router]);

  const handleSwipe = (dir: 'left' | 'right') => {
    const restaurant = sortedRestaurants[currentIndex];
    if (dir === 'right' && restaurant) {
      setSwipedRight((prev) => [...prev, restaurant]);
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

  // 현재 + 뒤 최대 2장 렌더
  const visibleCards = [0, 1, 2]
    .map((offset) => sortedRestaurants[currentIndex + offset])
    .filter(Boolean) as Restaurant[];

  const progressPercent = total > 0 ? (currentIndex / total) * 100 : 0;

  if (restaurants.length === 0) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <button
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-800 font-medium"
        >
          ← 뒤로
        </button>
        <div className="text-center">
          <span className="text-3xl font-black text-blue-700">{selectedCount}</span>
          <span className="text-lg text-gray-500">/{total}</span>
          <p className="text-xs text-gray-400 mt-0.5">선택됨</p>
        </div>
        <div className="w-14" />
      </div>

      {/* 진행 바 */}
      <div className="px-5 mb-5">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-2 bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1 text-center">
          {currentIndex} / {total} 확인
        </p>
      </div>

      {/* 카드 영역 */}
      <div className="flex-1 flex items-start justify-center px-4 pt-4">
        {allSwiped ? (
          <div className="text-center mt-12">
            <div className="text-7xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-2">모두 확인했어요!</h2>
            <p className="text-gray-500">{selectedCount}개 선택됨</p>
          </div>
        ) : (
          <div className="relative w-full max-w-sm" style={{ height: 380 }}>
            {/* 카드 스택: 뒤쪽부터 렌더링 */}
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

      {/* 하단 컨트롤 */}
      <div className="px-5 pb-8 pt-4">
        {/* ❌ / ✅ 버튼 */}
        {!allSwiped && (
          <div className="flex items-center justify-center gap-10 mb-5">
            <button
              onClick={() => handleButtonSwipe('left')}
              disabled={isAnimating}
              className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center
                         text-2xl hover:scale-110 active:scale-95 transition-transform
                         disabled:opacity-40 disabled:pointer-events-none"
              aria-label="건너뛰기"
            >
              ❌
            </button>
            <button
              onClick={() => handleButtonSwipe('right')}
              disabled={isAnimating}
              className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center
                         text-2xl hover:scale-110 active:scale-95 transition-transform
                         disabled:opacity-40 disabled:pointer-events-none"
              aria-label="선택"
            >
              ✅
            </button>
          </div>
        )}

        {/* 토너먼트 시작 버튼 */}
        <button
          onClick={startTournament}
          disabled={!canStart}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
            canStart
              ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-lg'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {selectedCount === 0
            ? '아직 선택한 식당이 없어요'
            : selectedCount === 1
            ? '바로 우승! (1개 선택됨) 🏆'
            : `토너먼트 시작 (${selectedCount}개) →`}
        </button>
      </div>
    </div>
  );
}
