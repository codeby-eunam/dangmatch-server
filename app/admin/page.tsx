'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

interface AdminRestaurant {
  id: string;
  name: string;
  category: string;
  address: string;
  images?: string[];
}

type ActionState = 'idle' | 'loading' | 'success' | 'error';

interface CardState {
  action: ActionState;
  message: string;
  urlInputVisible: boolean;
  urlInputValue: string;
  currentImage?: string;
}

const PAGE_SIZE = 20;

function AdminContent() {
  const searchParams = useSearchParams();
  const secret = searchParams.get('s') ?? '';
  const authed = !!secret;

  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
  const [cardStates, setCardStates] = useState<Record<string, CardState>>({});
  const [filterNoImage, setFilterNoImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadRestaurants = useCallback(async (after: DocumentSnapshot | null = null) => {
    setLoading(true);
    try {
      const base = query(
        collection(db, 'restaurants'),
        orderBy('updatedAt', 'desc'),
        limit(PAGE_SIZE),
        ...(after ? [startAfter(after)] : [])
      );
      const snap = await getDocs(base);

      const docs: AdminRestaurant[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<AdminRestaurant, 'id'>),
      }));

      const lastVisible = snap.docs[snap.docs.length - 1] ?? null;
      setLastDoc(lastVisible);
      setHasMore(snap.docs.length === PAGE_SIZE);

      if (after) {
        setRestaurants((prev) => [...prev, ...docs]);
      } else {
        setRestaurants(docs);
      }

      // 초기 카드 상태 세팅
      setCardStates((prev) => {
        const next = { ...prev };
        for (const r of docs) {
          if (!next[r.id]) {
            next[r.id] = {
              action: 'idle',
              message: '',
              urlInputVisible: false,
              urlInputValue: '',
              currentImage: r.images?.[0],
            };
          }
        }
        return next;
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) loadRestaurants();
  }, [authed, loadRestaurants]);

  const updateCard = (id: string, patch: Partial<CardState>) =>
    setCardStates((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  // 🔍 자동 1순위 이미지
  const handleAutoFetch = async (r: AdminRestaurant) => {
    updateCard(r.id, { action: 'loading', message: '이미지 검색 중...' });
    try {
      const res = await fetch('/api/admin/fetch-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: r.id,
          name: r.name,
          address: r.address,
          secret,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '실패');
      updateCard(r.id, {
        action: 'success',
        message: '이미지 저장 완료',
        currentImage: data.imageUrl,
      });
    } catch (e) {
      updateCard(r.id, {
        action: 'error',
        message: e instanceof Error ? e.message : '오류 발생',
      });
    }
  };

  // 🖼️ 직접 URL 저장
  const handleManualSave = async (r: AdminRestaurant) => {
    const url = cardStates[r.id]?.urlInputValue?.trim();
    if (!url) return;
    updateCard(r.id, { action: 'loading', message: 'URL 저장 중...' });
    try {
      const res = await fetch('/api/admin/update-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId: r.id, imageUrl: url, secret }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '실패');
      updateCard(r.id, {
        action: 'success',
        message: '이미지 저장 완료',
        currentImage: url,
        urlInputVisible: false,
        urlInputValue: '',
      });
    } catch (e) {
      updateCard(r.id, {
        action: 'error',
        message: e instanceof Error ? e.message : '오류 발생',
      });
    }
  };

  const displayed = filterNoImage
    ? restaurants.filter((r) => !cardStates[r.id]?.currentImage && !r.images?.length)
    : restaurants;

  /* ── 인증 없음 ───────────────────────────────────────────────── */
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1A1A1A' }}>
        <p className="text-sm font-bold" style={{ color: '#8C8C8C' }}>
          URL에 <span style={{ color: '#FF9900' }}>?s=시크릿</span> 을 추가하세요
        </p>
      </div>
    );
  }

  /* ── 메인 어드민 UI ──────────────────────────────────────────── */
  return (
    <div className="min-h-screen" style={{ background: '#1A1A1A' }}>
      {/* 헤더 */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
        style={{ background: '#1A1A1A', borderBottom: '1px solid #333' }}
      >
        <span className="font-black tracking-widest uppercase text-sm" style={{ color: '#FF9900' }}>
          ADMIN / 이미지 관리
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFilterNoImage(false)}
            className="text-xs font-black px-3 py-1 tracking-widest uppercase"
            style={{
              background: !filterNoImage ? '#FF9900' : 'transparent',
              color: !filterNoImage ? '#1A1A1A' : '#8C8C8C',
              border: '1px solid #333',
            }}
          >
            전체
          </button>
          <button
            onClick={() => setFilterNoImage(true)}
            className="text-xs font-black px-3 py-1 tracking-widest uppercase"
            style={{
              background: filterNoImage ? '#FF9900' : 'transparent',
              color: filterNoImage ? '#1A1A1A' : '#8C8C8C',
              border: '1px solid #333',
            }}
          >
            이미지 없음
          </button>
          <span className="text-xs" style={{ color: '#8C8C8C' }}>
            {displayed.length}건
          </span>
        </div>
      </header>

      {/* 리스트 */}
      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">
        {displayed.map((r) => {
          const cs = cardStates[r.id] ?? {
            action: 'idle' as ActionState,
            message: '',
            urlInputVisible: false,
            urlInputValue: '',
          };
          const isLoading = cs.action === 'loading';
          const hasImage = !!cs.currentImage;

          return (
            <div
              key={r.id}
              style={{ background: '#242424', border: '1px solid #333' }}
              className="overflow-hidden"
            >
              {/* 이미지 + 정보 */}
              <div className="flex gap-0">
                {/* 이미지 썸네일 */}
                <div
                  className="flex-shrink-0 flex items-center justify-center"
                  style={{ width: 80, height: 80, background: '#333' }}
                >
                  {hasImage ? (
                    <img
                      src={cs.currentImage}
                      alt={r.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">🍽️</span>
                  )}
                </div>

                {/* 텍스트 */}
                <div className="flex-1 px-4 py-3 min-w-0">
                  <p className="font-black text-sm truncate" style={{ color: '#F5EDD0' }}>
                    {r.name}
                  </p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: '#FF9900' }}>
                    {r.category.split('>').pop()?.trim()}
                  </p>
                  <p className="text-xs mt-1 truncate" style={{ color: '#8C8C8C' }}>
                    {r.address}
                  </p>
                </div>

                {/* 상태 뱃지 */}
                <div className="flex-shrink-0 flex items-center pr-4">
                  {hasImage ? (
                    <span
                      className="text-xs font-black px-2 py-0.5"
                      style={{ background: '#1C8B40', color: '#fff' }}
                    >
                      OK
                    </span>
                  ) : (
                    <span
                      className="text-xs font-black px-2 py-0.5"
                      style={{ background: '#555', color: '#aaa' }}
                    >
                      없음
                    </span>
                  )}
                </div>
              </div>

              {/* 상태 메시지 */}
              {cs.message && (
                <div
                  className="px-4 py-1.5 text-xs font-bold"
                  style={{
                    background: cs.action === 'error' ? '#3A1A1A' : '#1A2A1A',
                    color: cs.action === 'error' ? '#FF6B6B' : '#6BFF6B',
                  }}
                >
                  {cs.message}
                </div>
              )}

              {/* URL 입력 */}
              {cs.urlInputVisible && (
                <div className="flex gap-2 px-4 py-3" style={{ borderTop: '1px solid #333' }}>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={cs.urlInputValue}
                    onChange={(e) =>
                      updateCard(r.id, { urlInputValue: e.target.value })
                    }
                    className="flex-1 px-3 py-2 text-xs outline-none"
                    style={{ background: '#333', color: '#F5EDD0', border: '1px solid #555' }}
                  />
                  <button
                    onClick={() => handleManualSave(r)}
                    disabled={isLoading || !cs.urlInputValue.trim()}
                    className="px-4 py-2 text-xs font-black disabled:opacity-40"
                    style={{ background: '#FF9900', color: '#1A1A1A' }}
                  >
                    저장
                  </button>
                  <button
                    onClick={() => updateCard(r.id, { urlInputVisible: false, urlInputValue: '' })}
                    className="px-3 py-2 text-xs font-black"
                    style={{ background: '#333', color: '#8C8C8C' }}
                  >
                    취소
                  </button>
                </div>
              )}

              {/* 버튼 바 */}
              <div className="flex" style={{ borderTop: '1px solid #333' }}>
                <button
                  onClick={() => handleAutoFetch(r)}
                  disabled={isLoading}
                  className="flex-1 py-2.5 text-xs font-black tracking-widest uppercase transition-opacity hover:opacity-80 disabled:opacity-30 flex items-center justify-center gap-1.5"
                  style={{ background: '#2A2A2A', color: '#F5EDD0' }}
                >
                  {isLoading ? (
                    <span style={{ color: '#FF9900' }}>검색 중...</span>
                  ) : (
                    <>
                      <span>🔍</span>
                      <span>자동 1순위 이미지</span>
                    </>
                  )}
                </button>
                <div style={{ width: 1, background: '#333' }} />
                <button
                  onClick={() =>
                    updateCard(r.id, { urlInputVisible: !cs.urlInputVisible })
                  }
                  disabled={isLoading}
                  className="flex-1 py-2.5 text-xs font-black tracking-widest uppercase transition-opacity hover:opacity-80 disabled:opacity-30 flex items-center justify-center gap-1.5"
                  style={{ background: '#2A2A2A', color: '#F5EDD0' }}
                >
                  <span>🖼️</span>
                  <span>직접 URL 입력</span>
                </button>
              </div>
            </div>
          );
        })}

        {/* 더 보기 */}
        {hasMore && !filterNoImage && (
          <button
            onClick={() => loadRestaurants(lastDoc)}
            disabled={loading}
            className="w-full py-4 text-sm font-black tracking-widest uppercase disabled:opacity-40"
            style={{ background: '#2A2A2A', color: '#FF9900', border: '1px solid #333' }}
          >
            {loading ? '로딩 중...' : '더 보기'}
          </button>
        )}

        {displayed.length === 0 && !loading && (
          <p className="text-center py-12 text-sm" style={{ color: '#8C8C8C' }}>
            {filterNoImage ? '이미지 없는 가게가 없어요 🎉' : 'Firestore에 식당이 없습니다.'}
          </p>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#1A1A1A' }}>
          <p className="text-sm font-bold" style={{ color: '#8C8C8C' }}>로딩 중...</p>
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
