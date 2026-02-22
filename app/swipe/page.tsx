'use client';

import { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useTournamentStore } from '@/lib/store/tournament';
import { upsertRestaurants } from '@/lib/firebase/restaurants';
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
            style={{ opacity: pickOpacity, border: '3px solid #FF4D2E', color: '#FF4D2E' }}
            className="absolute top-6 left-5 z-20 font-black text-lg px-3 py-1 select-none pointer-events-none -rotate-12"
          >
            PICK
          </motion.div>
        )}
        {/* SKIP 표시 */}
        {isTop && (
          <motion.div
            style={{ opacity: skipOpacity, border: '3px solid #8C8C8C', color: '#8C8C8C' }}
            className="absolute top-6 right-5 z-20 font-black text-lg px-3 py-1 select-none pointer-events-none"
          >
            SKIP
          </motion.div>
        )}

        {/* 카드 본체 */}
        <div className="rounded-none overflow-hidden mx-2 select-none" style={{ background: '#FFFDF9', boxShadow: '0 4px 24px rgba(31,31,31,0.10)' }}>
          {/* 이미지 영역 */}
          <div
            className="w-full h-56 flex items-center justify-center overflow-hidden"
            style={{ background: '#F0EDEA' }}
          >
            {restaurant.images?.[0] ? (
              <img
                src={restaurant.images[0]}
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
            <h2 className="text-2xl font-black mb-1 truncate" style={{ color: '#1F1F1F' }}>
              {restaurant.name}
            </h2>
            <p className="text-sm mb-2" style={{ color: '#8C8C8C' }}>
              {restaurant.category.split('>').pop()?.trim()}
            </p>
            <p className="text-xs" style={{ color: '#8C8C8C' }}>
              {getDistanceText(restaurant.distance)}
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
    // rules: allow create, update: if true → 인증 불필요
    upsertRestaurants(restaurants).catch((err) =>
      console.error('[Firestore upsert 실패]', err)
    );
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

  const visibleCards = [0, 1, 2]
    .map((offset) => sortedRestaurants[currentIndex + offset])
    .filter(Boolean) as Restaurant[];

  const progressPercent = total > 0 ? (currentIndex / total) * 100 : 0;

  if (restaurants.length === 0) return null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FFFDF9' }}>
      {/* 헤더 */}
      <header style={{ borderBottom: '1px solid #F0EDEA' }}>
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <button
            onClick={() => router.back()}
            className="text-sm hover:opacity-60 transition-opacity"
            style={{ color: '#8C8C8C' }}
          >
            ← 뒤로
          </button>
          <div className="text-center">
            <span className="text-3xl font-black" style={{ color: '#FF4D2E' }}>{selectedCount}</span>
            <span className="text-lg" style={{ color: '#8C8C8C' }}>/{total}</span>
            <p className="text-xs mt-0.5" style={{ color: '#8C8C8C' }}>선택됨</p>
          </div>
          <div className="w-14" />
        </div>

        {/* 진행 바 */}
        <div className="px-6 pb-4">
          <div className="h-1 rounded-none overflow-hidden" style={{ background: '#F0EDEA' }}>
            <div
              className="h-1 transition-all duration-300"
              style={{ width: `${progressPercent}%`, background: '#FF4D2E' }}
            />
          </div>
          <p className="text-xs mt-1 text-center" style={{ color: '#8C8C8C' }}>
            {currentIndex} / {total}
          </p>
        </div>
      </header>

      {/* 카드 영역 */}
      <div className="flex-1 flex items-start justify-center px-4 pt-6">
        {allSwiped ? (
          <div className="text-center mt-12">
            <div className="text-5xl mb-4">✓</div>
            <h2 className="text-2xl font-black mb-2" style={{ color: '#1F1F1F' }}>모두 확인했어요</h2>
            <p style={{ color: '#8C8C8C' }}>{selectedCount}개 선택됨</p>
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

      {/* 하단 컨트롤 */}
      <div className="px-6 pb-8 pt-4">
        {!allSwiped && (
          <div className="flex items-center justify-center gap-10 mb-5">
            <button
              onClick={() => handleButtonSwipe('left')}
              disabled={isAnimating}
              className="w-16 h-16 flex items-center justify-center text-base font-bold transition-all hover:opacity-70 active:scale-95 disabled:opacity-30"
              style={{ background: '#F0EDEA', color: '#8C8C8C' }}
              aria-label="건너뛰기"
            >
              SKIP
            </button>
            <button
              onClick={() => handleButtonSwipe('right')}
              disabled={isAnimating}
              className="w-16 h-16 flex items-center justify-center text-base font-bold transition-all hover:opacity-80 active:scale-95 disabled:opacity-30"
              style={{ background: '#FF4D2E', color: '#FFFDF9' }}
              aria-label="선택"
            >
              PICK
            </button>
          </div>
        )}

        <button
          onClick={startTournament}
          disabled={!canStart}
          className="w-full py-4 text-sm font-bold tracking-widest uppercase transition-opacity hover:opacity-80 disabled:opacity-30"
          style={{ background: canStart ? '#1F1F1F' : '#F0EDEA', color: canStart ? '#FFFDF9' : '#8C8C8C' }}
        >
          {selectedCount === 0
            ? '아직 선택한 식당이 없어요'
            : selectedCount === 1
            ? '바로 우승 확정 (1개)'
            : `토너먼트 시작 (${selectedCount}개)`}
        </button>
      </div>
    </div>
  );
}
