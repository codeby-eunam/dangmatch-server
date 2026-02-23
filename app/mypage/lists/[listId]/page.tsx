'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth';
import { useTournamentStore } from '@/lib/store/tournament';
import {
  getList,
  addRestaurantToList,
  removeRestaurantFromList,
  updateListTitle,
  deleteList,
} from '@/lib/firebase/lists';
import type { Restaurant, RestaurantList } from '@/types';

function getCategoryEmoji(category: string) {
  const c = category.toLowerCase();
  if (c.includes('카페') || c.includes('커피')) return '☕';
  if (c.includes('한식')) return '🍚';
  if (c.includes('일식') || c.includes('초밥')) return '🍣';
  if (c.includes('중식')) return '🥡';
  if (c.includes('양식') || c.includes('파스타')) return '🍝';
  if (c.includes('치킨')) return '🍗';
  if (c.includes('피자')) return '🍕';
  if (c.includes('버거')) return '🍔';
  if (c.includes('분식')) return '🍢';
  if (c.includes('고기') || c.includes('삼겹')) return '🥩';
  return '🍽️';
}

export default function ListDetailPage() {
  const router = useRouter();
  const params = useParams();
  const listId = params.listId as string;
  const { user } = useAuthStore();
  const { reset, setRestaurants, setSwipedRestaurants, setFinalWinner } = useTournamentStore();

  const [list, setList] = useState<RestaurantList | null>(null);
  const [loading, setLoading] = useState(true);

  // 제목 편집
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [savingTitle, setSavingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // 식당 검색
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Restaurant[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  // 식당 제거
  const [removingId, setRemovingId] = useState<string | null>(null);

  // 공유 링크
  const [copied, setCopied] = useState(false);

  // 리스트 삭제
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    getList(user.uid, listId)
      .then((l) => {
        if (!l) { router.push('/mypage/lists'); return; }
        setList(l);
        setTitleDraft(l.title);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, listId, router]);

  // ── 제목 편집 ──────────────────────────────────────────────────────────────

  const startEditTitle = () => {
    setEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 50);
  };

  const saveTitle = async () => {
    if (!list || !user || !titleDraft.trim() || savingTitle) return;
    setSavingTitle(true);
    try {
      await updateListTitle(user.uid, listId, list.shareToken, titleDraft.trim());
      setList((prev) => prev ? { ...prev, title: titleDraft.trim() } : prev);
      setEditingTitle(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingTitle(false);
    }
  };

  // ── 식당 검색 ──────────────────────────────────────────────────────────────

  const handleSearch = async () => {
    if (!searchQuery.trim() || searching) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(
        `/api/kakao/search-by-area?query=${encodeURIComponent(searchQuery)}&page=1`,
      );
      if (!res.ok) throw new Error('검색 실패');
      const data = await res.json();
      setSearchResults(data.restaurants ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleAddRestaurant = async (restaurant: Restaurant) => {
    if (!list || !user || addingId) return;
    setAddingId(restaurant.id);
    try {
      await addRestaurantToList(user.uid, listId, list.shareToken, restaurant);
      setList((prev) => {
        if (!prev) return prev;
        if (prev.restaurants.some((r) => r.id === restaurant.id)) return prev;
        const snapshot: Restaurant = {
          id: restaurant.id,
          name: restaurant.name,
          category: restaurant.category,
          address: restaurant.address,
          phone: restaurant.phone,
          lat: restaurant.lat,
          lng: restaurant.lng,
          ...(restaurant.kakaoUrl && { kakaoUrl: restaurant.kakaoUrl }),
          ...(restaurant.images?.length && { images: restaurant.images }),
        };
        return { ...prev, restaurants: [...prev.restaurants, snapshot] };
      });
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      console.error(err);
    } finally {
      setAddingId(null);
    }
  };

  // ── 식당 제거 ──────────────────────────────────────────────────────────────

  const handleRemove = async (restaurantId: string) => {
    if (!list || !user || removingId) return;
    setRemovingId(restaurantId);
    try {
      await removeRestaurantFromList(user.uid, listId, list.shareToken, restaurantId);
      setList((prev) =>
        prev ? { ...prev, restaurants: prev.restaurants.filter((r) => r.id !== restaurantId) } : prev
      );
    } catch (err) {
      console.error(err);
    } finally {
      setRemovingId(null);
    }
  };

  // ── 공유 링크 복사 ─────────────────────────────────────────────────────────

  const handleCopyLink = async () => {
    if (!list) return;
    const url = `${window.location.origin}/share/${list.shareToken}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      prompt('링크를 복사하세요:', url);
    }
  };

  // ── 토너먼트 / 스와이프 시작 ───────────────────────────────────────────────

  const handleStartSwipe = () => {
    if (!list || list.restaurants.length === 0) return;
    reset();
    setRestaurants(list.restaurants);
    router.push('/swipe');
  };

  const handleStartTournament = () => {
    if (!list || list.restaurants.length === 0) return;
    reset();
    if (list.restaurants.length === 1) {
      setFinalWinner(list.restaurants[0]);
      router.push('/result');
    } else {
      setSwipedRestaurants(list.restaurants);
      router.push('/tournament');
    }
  };

  // ── 리스트 삭제 ────────────────────────────────────────────────────────────

  const handleDeleteList = async () => {
    if (!list || !user || deleting) return;
    if (!confirm(`"${list.title}" 리스트를 삭제할까요?\n공유 링크도 함께 삭제됩니다.`)) return;
    setDeleting(true);
    try {
      await deleteList(user.uid, listId, list.shareToken);
      router.push('/mypage/lists');
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  };

  // ── 렌더 ───────────────────────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5EDD0' }}>
        <p className="text-sm font-black" style={{ color: '#8C8C8C' }}>로그인이 필요합니다</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5EDD0' }}>
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#FF9900', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (!list) return null;

  const alreadySavedIds = new Set(list.restaurants.map((r) => r.id));

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5EDD0' }}>
      {/* 헤더 */}
      <header style={{ borderBottom: '2px solid #1A1A1A' }}>
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Link
              href="/mypage/lists"
              className="w-8 h-8 flex-shrink-0 flex items-center justify-center font-black text-base transition-opacity hover:opacity-60"
              style={{ border: '2px solid #1A1A1A', borderRadius: 2, color: '#1A1A1A' }}
            >
              ←
            </Link>

            {/* 제목 인라인 편집 */}
            {editingTitle ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <input
                  ref={titleInputRef}
                  type="text"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
                  maxLength={30}
                  className="flex-1 min-w-0 px-3 py-1.5 text-sm font-black outline-none"
                  style={{ border: '2px solid #FF9900', borderRadius: 2, background: '#FFFFFF', color: '#1A1A1A' }}
                />
                <button
                  onClick={saveTitle}
                  disabled={savingTitle}
                  className="text-xs font-black px-3 py-1.5 transition-opacity hover:opacity-70 disabled:opacity-40"
                  style={{ background: '#FF9900', color: '#FFFFFF', borderRadius: 2 }}
                >
                  {savingTitle ? '…' : '저장'}
                </button>
                <button
                  onClick={() => { setEditingTitle(false); setTitleDraft(list.title); }}
                  className="text-xs font-black px-2 py-1.5"
                  style={{ color: '#8C8C8C' }}
                >
                  취소
                </button>
              </div>
            ) : (
              <button
                onClick={startEditTitle}
                className="text-left flex-1 min-w-0 transition-opacity hover:opacity-70"
              >
                <p className="text-xs font-black tracking-widest uppercase" style={{ color: '#FF9900' }}>
                  MY LIST ✎
                </p>
                <p className="text-sm font-black truncate" style={{ color: '#1A1A1A' }}>
                  {list.title}
                </p>
              </button>
            )}
          </div>

          {/* 공유 버튼 */}
          {!editingTitle && (
            <button
              onClick={handleCopyLink}
              className="ml-2 flex-shrink-0 w-9 h-9 flex items-center justify-center text-lg transition-opacity hover:opacity-60"
              style={{
                background: copied ? '#1C8B40' : 'transparent',
                color: copied ? '#FFFFFF' : '#1A1A1A',
                border: `2px solid ${copied ? '#1C8B40' : '#E8DDB8'}`,
                borderRadius: 2,
              }}
              aria-label="공유 링크 복사"
            >
              {copied ? '✓' : '⎙'}
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 px-6 py-5 flex flex-col gap-5">
        {/* 식당 검색 추가 */}
        <section>
          <p className="text-xs font-black tracking-widest uppercase mb-2" style={{ color: '#8C8C8C' }}>
            식당 검색 추가
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              placeholder="식당 이름 또는 지역 검색"
              className="flex-1 px-4 py-2.5 text-sm font-bold outline-none"
              style={{ background: '#FFFFFF', border: '2px solid #E8DDB8', borderRadius: 2, color: '#1A1A1A' }}
            />
            <button
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim()}
              className="px-4 py-2.5 text-xs font-black tracking-widest uppercase transition-opacity hover:opacity-70 disabled:opacity-40"
              style={{ background: '#1A1A1A', color: '#FF9900', borderRadius: 2 }}
            >
              {searching ? '…' : '검색'}
            </button>
          </div>

          {/* 검색 결과 */}
          {searchResults.length > 0 && (
            <div
              className="mt-2 max-h-56 overflow-y-auto"
              style={{ border: '2px solid #E8DDB8', borderRadius: 2, background: '#FFFFFF' }}
            >
              {searchResults.map((r) => {
                const saved = alreadySavedIds.has(r.id);
                return (
                  <button
                    key={r.id}
                    onClick={() => !saved && handleAddRestaurant(r)}
                    disabled={saved || addingId === r.id}
                    className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50 disabled:opacity-50"
                    style={{ borderBottom: '1px solid #F5EDD0' }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-black truncate" style={{ color: '#1A1A1A' }}>
                        {r.name}
                      </p>
                      <p className="text-xs truncate" style={{ color: '#8C8C8C' }}>
                        {r.category.split('>').pop()?.trim()} · {r.address}
                      </p>
                    </div>
                    <span className="text-base ml-3 flex-shrink-0" style={{ color: saved ? '#FF9900' : '#E8DDB8' }}>
                      {addingId === r.id ? '…' : saved ? '★' : '+'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* 저장된 식당 목록 */}
        <section>
          <p className="text-xs font-black tracking-widest uppercase mb-2" style={{ color: '#8C8C8C' }}>
            저장된 식당 ({list.restaurants.length}개)
          </p>
          {list.restaurants.length === 0 ? (
            <div
              className="py-10 text-center"
              style={{ border: '2px dashed #E8DDB8', borderRadius: 2 }}
            >
              <p className="text-2xl mb-2">☆</p>
              <p className="text-xs" style={{ color: '#8C8C8C' }}>
                아직 저장된 식당이 없어요
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {list.restaurants.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center"
                  style={{ background: '#FFFFFF', border: '2px solid #E8DDB8', borderRadius: 2 }}
                >
                  {/* 이모지 */}
                  <div
                    className="w-12 h-12 flex-shrink-0 flex items-center justify-center text-xl"
                    style={{ background: '#F5EDD0', borderRight: '1px solid #E8DDB8' }}
                  >
                    {r.images?.[0]
                      ? <img src={r.images[0]} alt={r.name} className="w-12 h-12 object-cover" />
                      : getCategoryEmoji(r.category)
                    }
                  </div>
                  {/* 정보 */}
                  <div className="flex-1 min-w-0 px-3 py-2">
                    <p className="text-sm font-black truncate" style={{ color: '#1A1A1A' }}>
                      {r.name}
                    </p>
                    <p className="text-xs truncate" style={{ color: '#8C8C8C' }}>
                      {r.category.split('>').pop()?.trim()}
                    </p>
                  </div>
                  {/* 카카오맵 링크 */}
                  {r.kakaoUrl && (
                    <a
                      href={r.kakaoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-full flex-shrink-0 flex items-center justify-center text-sm transition-opacity hover:opacity-60 self-stretch"
                      style={{ borderLeft: '1px solid #E8DDB8', color: '#8C8C8C' }}
                    >
                      🗺
                    </a>
                  )}
                  {/* 삭제 */}
                  <button
                    onClick={() => handleRemove(r.id)}
                    disabled={removingId === r.id}
                    className="w-10 h-full flex-shrink-0 flex items-center justify-center text-base transition-opacity hover:opacity-60 disabled:opacity-30 self-stretch"
                    style={{ borderLeft: '1px solid #E8DDB8', color: '#8C8C8C' }}
                    aria-label="제거"
                  >
                    {removingId === r.id ? '…' : '✕'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 토너먼트 / 스와이프 시작 */}
        <section className="flex gap-2">
          <button
            onClick={handleStartSwipe}
            disabled={list.restaurants.length === 0}
            className="flex-1 py-4 text-xs font-black tracking-widest uppercase transition-opacity hover:opacity-80 disabled:opacity-30"
            style={{
              background: list.restaurants.length === 0 ? '#E8DDB8' : '#FFFFFF',
              border: '2px solid #1A1A1A',
              color: '#1A1A1A',
              borderRadius: 2,
            }}
          >
            <span className="block text-base mb-0.5">🃏</span>
            스와이프
          </button>
          <button
            onClick={handleStartTournament}
            disabled={list.restaurants.length === 0}
            className="flex-1 py-4 text-xs font-black tracking-widest uppercase transition-opacity hover:opacity-80 disabled:opacity-30"
            style={{
              background: list.restaurants.length === 0 ? '#E8DDB8' : '#FF9900',
              border: '2px solid #1A1A1A',
              color: list.restaurants.length === 0 ? '#8C8C8C' : '#FFFFFF',
              borderRadius: 2,
            }}
          >
            <span className="block text-base mb-0.5">🏆</span>
            토너먼트
          </button>
        </section>

        {/* 리스트 삭제 */}
        <section className="pb-4">
          <button
            onClick={handleDeleteList}
            disabled={deleting}
            className="w-full py-3 text-xs font-black tracking-widest uppercase transition-opacity hover:opacity-70 disabled:opacity-40"
            style={{ border: '2px solid #E8DDB8', color: '#8C8C8C', borderRadius: 2 }}
          >
            {deleting ? '삭제 중…' : '리스트 삭제'}
          </button>
        </section>
      </main>
    </div>
  );
}
