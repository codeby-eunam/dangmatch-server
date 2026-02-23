'use client';

import { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useTournamentStore } from '@/lib/store/tournament';
import { upsertRestaurants } from '@/lib/firebase/restaurants';
import { useAuthStore } from '@/lib/store/auth';
import ListSelectorModal from '@/components/ListSelectorModal';
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
    const rotate = useTransform(x, [-220, 220], [-12, 12]);
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
        {/* PICK 스탬프 */}
        {isTop && (
          <motion.div
            style={{ opacity: pickOpacity, border: '3px solid #FF9900', color: '#FF9900' }}
            className="absolute top-5 left-4 z-20 font-black text-lg px-3 py-1 select-none pointer-events-none -rotate-12"
          >
            PICK
          </motion.div>
        )}
        {/* SKIP 스탬프 */}
        {isTop && (
          <motion.div
            style={{ opacity: skipOpacity, border: '3px solid #8C8C8C', color: '#8C8C8C' }}
            className="absolute top-5 right-4 z-20 font-black text-lg px-3 py-1 select-none pointer-events-none rotate-12"
          >
            SKIP
          </motion.div>
        )}

        {/* 카드 본체 */}
        <div
          className="overflow-hidden mx-1 select-none"
          style={{
            background: '#FFFFFF',
            border: '2px solid #E8DDB8',
            boxShadow: isTop ? '6px 6px 0 rgba(0,0,0,0.10)' : '3px 3px 0 rgba(0,0,0,0.06)',
          }}
        >
          {/* 상단 배지 */}
          <div className="px-4 pt-3 pb-2 flex items-center justify-between">
            <span
              className="text-xs font-black tracking-widest uppercase px-2 py-0.5"
              style={{ background: '#FF9900', color: '#FFFFFF' }}
            >
              SEASON IN COLLECTION
            </span>
            <span className="text-xs" style={{ color: '#8C8C8C' }}>
              {getDistanceText(restaurant.distance)}
            </span>
          </div>

          {/* 이미지 영역 */}
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
            {/* PICK 오버레이 라벨 */}
            <div
              className="absolute top-3 right-3 text-xs font-black px-2 py-0.5"
              style={{ background: '#1C8B40', color: '#FFFFFF' }}
            >
              PICK
            </div>
          </div>

          {/* 정보 */}
          <div className="px-4 py-4">
            <h2 className="text-xl font-black mb-1 truncate" style={{ color: '#1A1A1A' }}>
              {restaurant.name}
            </h2>
            <p className="text-xs mb-3 font-bold italic" style={{ color: '#FF9900' }}>
              {restaurant.category.split('>').pop()?.trim()}
            </p>
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
  const [listModalRestaurant, setListModalRestaurant] = useState<Restaurant | null>(null);
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

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

  useEffect(() => {
    if (!allSwiped) return;
    setRedirectCountdown(5);
    const interval = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          router.push('/location');
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [allSwiped, router]);

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
    <div className="min-h-screen flex flex-col" style={{ background: '#F5EDD0' }}>
      {/* 헤더 */}
      <header style={{ borderBottom: '1px solid #E8DDB8' }}>
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="w-7 h-7 flex items-center justify-center text-xs font-black hover:opacity-70 transition-opacity"
              style={{ background: '#FF9900', color: '#FFFFFF', borderRadius: 2 }}
              aria-label="뒤로가기"
            >
              ✕
            </button>
            <span className="text-xs font-black tracking-widest uppercase" style={{ color: '#1A1A1A' }}>
              음식 선택
            </span>
          </div>
          <div className="flex items-center gap-5">
            <button
              onClick={() => router.back()}
              className="text-xs font-black hover:opacity-60 transition-opacity tracking-widest uppercase"
              style={{ color: '#1A1A1A' }}
            >
              MENU
            </button>
            <button
              onClick={() => {
                setSavedToast('개발중!');
                setTimeout(() => setSavedToast(null), 2500);
              }}
              className="text-xs font-black hover:opacity-60 transition-opacity tracking-widest uppercase"
              style={{ color: '#8C8C8C' }}
            >
              HISTORY
            </button>
            <button
              onClick={() => router.push('/mypage')}
              className="w-8 h-8 flex items-center justify-center font-black text-sm transition-opacity hover:opacity-70"
              style={{ background: '#1A1A1A', color: '#FFFFFF', borderRadius: '50%' }}
              aria-label="마이페이지"
            >
              {user ? user.nickname?.[0]?.toUpperCase() || '?' : '?'}
            </button>
          </div>
        </div>
      </header>

      {/* 섹션 라벨 */}
      <div className="px-6 pt-4 pb-2 flex items-center justify-between">
        <p className="text-xs font-black tracking-widest uppercase" style={{ color: '#FF9900' }}>
          SEASON IN COLLECTION
        </p>
        <div className="text-right">
          <div
            className="inline-block px-3 py-1.5 font-black text-sm"
            style={{ background: '#1A1A1A', color: '#FFFFFF' }}
          >
            <span style={{ color: '#FF9900' }}>{selectedCount}</span>
            <span> / {total}개 선택됨</span>
          </div>
        </div>
      </div>

      {/* 카드 영역 */}
      <div className="flex-1 flex items-start justify-center px-4 pt-2">
        {allSwiped ? (
          <div className="text-center mt-12">
            <div
              className="text-5xl mb-4 font-black"
              style={{ color: '#FF9900' }}
            >
              ✓
            </div>
            <h2 className="text-2xl font-black mb-2" style={{ color: '#1A1A1A' }}>모두 확인했어요</h2>
            <p style={{ color: '#8C8C8C' }}>{selectedCount}개 선택됨</p>
            {redirectCountdown !== null && (
              <p className="mt-4 text-xs font-bold" style={{ color: '#8C8C8C' }}>
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

      {/* 하단 컨트롤 */}
      <div className="px-6 pb-6 pt-4">
        {!allSwiped && (
          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => handleButtonSwipe('left')}
                disabled={isAnimating}
                className="w-14 h-14 flex items-center justify-center text-xl font-bold transition-all hover:opacity-70 active:scale-95 disabled:opacity-30 rounded-full"
                style={{ background: '#FFFFFF', color: '#8C8C8C', border: '2px solid #E8DDB8' }}
                aria-label="건너뛰기"
              >
                ✕
              </button>
              <span className="text-xs" style={{ color: '#8C8C8C' }}>삭제</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => handleButtonSwipe('right')}
                disabled={isAnimating}
                className="w-16 h-16 flex items-center justify-center text-2xl transition-all hover:opacity-80 active:scale-95 disabled:opacity-30 rounded-full"
                style={{ background: '#FF9900', color: '#FFFFFF', border: '2px solid #FF9900' }}
                aria-label="선택"
              >
                ✓
              </button>
              <span className="text-xs font-bold" style={{ color: '#FF9900' }}>선택</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => {
                  const current = sortedRestaurants[currentIndex];
                  if (current) setListModalRestaurant(current);
                }}
                disabled={isAnimating}
                className="w-14 h-14 flex items-center justify-center text-xl transition-all hover:opacity-70 active:scale-95 disabled:opacity-30 rounded-full"
                style={{ background: '#FFFFFF', color: '#FF9900', border: '2px solid #E8DDB8' }}
                aria-label="즐겨찾기"
              >
                ★
              </button>
              <span className="text-xs" style={{ color: '#8C8C8C' }}>즐겨찾기</span>
            </div>
          </div>
        )}

        {/* 진행 바 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold" style={{ color: '#8C8C8C' }}>트레이닝 진척도</span>
            <span className="text-xs font-black" style={{ color: '#FF9900' }}>{Math.round(progressPercent)}% 에너지</span>
          </div>
          <div className="h-2 overflow-hidden" style={{ background: '#E8DDB8', borderRadius: 2 }}>
            <div
              className="h-2 transition-all duration-300"
              style={{ width: `${progressPercent}%`, background: '#FF9900', borderRadius: 2 }}
            />
          </div>
        </div>

        <button
          onClick={startTournament}
          disabled={!canStart}
          className="w-full py-4 text-sm font-black tracking-widest uppercase transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{
            background: canStart ? '#1A1A1A' : '#E8DDB8',
            color: canStart ? '#FFFFFF' : '#8C8C8C',
            borderRadius: 2,
          }}
        >
          {selectedCount === 0
            ? '아직 선택한 식당이 없어요'
            : selectedCount === 1
            ? '바로 우승 확정 (1개)'
            : `토너먼트 시작 (${selectedCount}개)`}
        </button>
      </div>

      {/* 하단 흐르는 텍스트 */}
      <div
        className="py-2 overflow-hidden"
        style={{ background: '#1A1A1A' }}
      >
        <div className="flex gap-8 text-xs font-black tracking-widest uppercase" style={{ color: '#F5EDD0' }}>
          {Array(6).fill('★ RETRO FOOD PICKER ★ MENU ARENA ★ 맛집 토너먼트').map((text, i) => (
            <span key={i} className="whitespace-nowrap">{text}</span>
          ))}
        </div>
      </div>

      {/* 즐겨찾기 리스트 선택 모달 */}
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

      {/* 저장 완료 토스트 */}
      {savedToast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 px-5 py-3 text-xs font-black tracking-wide z-50 pointer-events-none"
          style={{ background: '#1A1A1A', color: '#FF9900', borderRadius: 2, whiteSpace: 'nowrap' }}
        >
          ★ {savedToast}
        </div>
      )}
    </div>
  );
}
