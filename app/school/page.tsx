'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import {
  getSchoolRestaurantRanking,
  getSchoolLists,
  createSchoolList,
  addRestaurantToSchoolList,
  removeRestaurantFromSchoolList,
} from '@/lib/firebase/school-feeds';
import type { SchoolFeedRestaurant, SchoolFeedList, Restaurant } from '@/types';

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

type Tab = 'ranking' | 'lists';
interface UnivItem { name: string; domain: string; }

// ─── 비로그인용 학교 검색 피커 ────────────────────────────────────────────────

function SchoolPicker({ onSelect }: { onSelect: (s: UnivItem) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UnivItem[]>([]);
  const [fetching, setFetching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setFetching(true);
      try {
        const res = await fetch(`/api/universities?q=${encodeURIComponent(query.trim())}`);
        setResults((await res.json()).items ?? []);
      } finally { setFetching(false); }
    }, 350);
  }, [query]);

  return (
    <div className="px-6 py-8 flex flex-col gap-4">
      <div>
        <p className="font-black text-lg" style={{ color: '#1A1A1A' }}>학교 맛집 랭킹 보기</p>
        <p className="text-sm mt-1" style={{ color: '#5C5C5C' }}>학교를 검색해서 랭킹을 확인하세요</p>
      </div>
      <div className="relative">
        <input
          type="text" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="학교 이름 검색 (예: 연세, 고려)" autoFocus
          className="w-full px-4 py-3 text-sm font-bold outline-none"
          style={{ background: '#FFFFFF', border: '2px solid #1A1A1A', borderRadius: 4, color: '#1A1A1A' }}
        />
        {fetching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 rounded-full animate-spin"
            style={{ borderColor: '#FF9900', borderTopColor: 'transparent' }} />
        )}
      </div>
      {results.length > 0 && (
        <div className="overflow-y-auto" style={{ border: '2px solid #1A1A1A', borderRadius: 4, maxHeight: 280 }}>
          {results.map((item, idx) => (
            <button key={item.domain} onClick={() => onSelect(item)}
              className="w-full text-left px-4 py-3 text-sm font-bold"
              style={{ background: '#FFFFFF', borderBottom: idx < results.length - 1 ? '1px solid #E8E4DC' : 'none', color: '#1A1A1A' }}>
              {item.name}
            </button>
          ))}
        </div>
      )}
      {!fetching && query.trim() && results.length === 0 && (
        <p className="text-sm text-center" style={{ color: '#8C8C8C' }}>검색 결과가 없습니다</p>
      )}
      {!query.trim() && (
        <div className="flex flex-col items-center py-10 gap-2">
          <span className="text-4xl">🎓</span>
          <p className="text-sm" style={{ color: '#8C8C8C' }}>학교 이름을 입력하면 검색됩니다</p>
        </div>
      )}
    </div>
  );
}

// ─── 리스트 추가 모달 ──────────────────────────────────────────────────────────

function AddToListModal({
  restaurant, schoolDomain, uid, lists, onClose, onAdded, onListCreated,
}: {
  restaurant: Restaurant;
  schoolDomain: string;
  uid: string;
  lists: SchoolFeedList[];
  onClose: () => void;
  onAdded: (listId: string) => void;
  onListCreated: (list: SchoolFeedList) => void;
}) {
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  async function handleAdd(listId: string) {
    setAdding(listId);
    try {
      await addRestaurantToSchoolList(schoolDomain, listId, restaurant);
      onAdded(listId);
    } finally { setAdding(null); }
  }

  async function handleCreate() {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const listId = await createSchoolList(schoolDomain, uid, newTitle.trim());
      await addRestaurantToSchoolList(schoolDomain, listId, restaurant);
      onListCreated({ id: listId, title: newTitle.trim(), restaurants: [restaurant], createdBy: uid, isPublic: true, shareToken: '', createdAt: null });
      onAdded(listId);
    } finally { setCreating(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-h-[70vh] flex flex-col"
        style={{ background: '#F5EDD0', borderRadius: '12px 12px 0 0', border: '2px solid #1A1A1A' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1A1A1A' }}>
          <div>
            <p className="text-xs font-black tracking-widest uppercase" style={{ color: '#FF9900' }}>SCHOOL LIST</p>
            <p className="text-sm font-black" style={{ color: '#1A1A1A' }}>{restaurant.name} 추가</p>
          </div>
          <button onClick={onClose} className="text-lg font-black" style={{ color: '#8C8C8C' }}>✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
          {showCreate ? (
            <div className="flex gap-2">
              <input autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="리스트 이름"
                className="flex-1 px-3 py-2 text-sm font-bold outline-none"
                style={{ border: '2px solid #1A1A1A', borderRadius: 4, background: '#FFFFFF', color: '#1A1A1A' }} />
              <button onClick={handleCreate} disabled={!newTitle.trim() || creating}
                className="px-4 py-2 text-xs font-black"
                style={{ background: '#FF9900', borderRadius: 4, color: '#1A1A1A', opacity: creating ? 0.6 : 1 }}>
                {creating ? '...' : '생성'}
              </button>
              <button onClick={() => setShowCreate(false)} className="px-3 py-2 text-xs font-black"
                style={{ background: '#D0CABC', borderRadius: 4, color: '#5C5C5C' }}>취소</button>
            </div>
          ) : (
            <button onClick={() => setShowCreate(true)}
              className="w-full py-3 text-sm font-black text-left px-4"
              style={{ border: '2px dashed #1A1A1A', borderRadius: 4, color: '#1A1A1A', background: 'transparent' }}>
              + 새 학교 리스트 만들기
            </button>
          )}
          {lists.length === 0 && !showCreate && (
            <p className="text-sm text-center py-4" style={{ color: '#8C8C8C' }}>내가 만든 학교 리스트가 없어요</p>
          )}
          {lists.map((list) => {
            const alreadyIn = list.restaurants.some((r) => r.id === restaurant.id);
            return (
              <button key={list.id} onClick={() => !alreadyIn && handleAdd(list.id!)}
                disabled={alreadyIn || adding === list.id}
                className="w-full flex items-center justify-between px-4 py-3"
                style={{ background: '#FFFFFF', border: '2px solid #1A1A1A', borderRadius: 4, opacity: alreadyIn ? 0.5 : 1 }}>
                <div className="text-left">
                  <p className="text-sm font-black" style={{ color: '#1A1A1A' }}>{list.title}</p>
                  <p className="text-xs" style={{ color: '#8C8C8C' }}>{list.restaurants.length}개 맛집</p>
                </div>
                <span className="text-xs font-black" style={{ color: alreadyIn ? '#8C8C8C' : '#FF9900' }}>
                  {alreadyIn ? '추가됨' : adding === list.id ? '...' : '+ 추가'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────────

export default function SchoolPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  const [viewSchool, setViewSchool] = useState<UnivItem | null>(null);
  const [tab, setTab] = useState<Tab>('ranking');
  const [ranking, setRanking] = useState<SchoolFeedRestaurant[]>([]);
  const [lists, setLists] = useState<SchoolFeedList[]>([]);
  const [loading, setLoading] = useState(false);
  const [addTarget, setAddTarget] = useState<Restaurant | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const isOwnSchool = !!user?.school && user.school.domain === viewSchool?.domain;

  // 로그인 유저 → 자기 학교 자동 설정
  useEffect(() => {
    if (isLoading) return;
    if (user?.school) { setViewSchool(user.school); return; }
    if (user && !user.school) { router.replace('/school-select'); }
    // 비로그인 → viewSchool null 유지, SchoolPicker 표시
  }, [user, isLoading, router]);

  // 학교 변경 시 데이터 로드
  useEffect(() => {
    if (!viewSchool) return;
    setLoading(true);
    setRanking([]); setLists([]);
    Promise.all([
      getSchoolRestaurantRanking(viewSchool.domain, 30),
      getSchoolLists(viewSchool.domain, 20),
    ])
      .then(([r, l]) => { setRanking(r); setLists(l); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [viewSchool]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  function handleAdded(listId: string) {
    const list = lists.find((l) => l.id === listId);
    showToast(`"${list?.title ?? '리스트'}"에 추가됨`);
    if (addTarget) {
      setLists((prev) => prev.map((l) =>
        l.id === listId ? { ...l, restaurants: [...l.restaurants, addTarget] } : l
      ));
    }
    setAddTarget(null);
  }

  function handleListCreated(list: SchoolFeedList) {
    setLists((prev) => [list, ...prev]);
    showToast(`"${list.title}" 리스트 생성`);
    setAddTarget(null);
  }

  async function handleRemoveRestaurant(listId: string, restaurantId: string) {
    await removeRestaurantFromSchoolList(viewSchool!.domain, listId, restaurantId);
    setLists((prev) => prev.map((l) =>
      l.id === listId ? { ...l, restaurants: l.restaurants.filter((r) => r.id !== restaurantId) } : l
    ));
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5EDD0' }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: '#FF9900', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-16" style={{ background: '#F5EDD0' }}>
      {/* 헤더 */}
      <header style={{ borderBottom: '2px solid #1A1A1A' }}>
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <button onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center font-black"
            style={{ border: '2px solid #1A1A1A', borderRadius: 2, color: '#1A1A1A' }}>←</button>
          <div className="text-center">
            <p className="text-xs font-black tracking-widest uppercase" style={{ color: '#FF9900' }}>SCHOOL FEED</p>
            {viewSchool && <p className="text-sm font-black" style={{ color: '#1A1A1A' }}>{viewSchool.name}</p>}
          </div>
          {/* 비로그인은 학교 변경 가능 */}
          {!user?.school && viewSchool ? (
            <button onClick={() => setViewSchool(null)}
              className="text-xs font-black" style={{ color: '#8C8C8C' }}>변경</button>
          ) : <div className="w-8" />}
        </div>

        {viewSchool && (
          <div className="flex" style={{ borderTop: '1px solid #1A1A1A' }}>
            {(['ranking', 'lists'] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className="flex-1 py-3 text-xs font-black tracking-widest uppercase"
                style={{ background: tab === t ? '#1A1A1A' : 'transparent', color: tab === t ? '#FF9900' : '#1A1A1A' }}>
                {t === 'ranking' ? '맛집 랭킹' : `공유 리스트${lists.length > 0 ? ` (${lists.length})` : ''}`}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1">
        {!viewSchool ? (
          <SchoolPicker onSelect={(s) => { setViewSchool(s); setTab('ranking'); }} />
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 rounded-full animate-spin"
              style={{ borderColor: '#FF9900', borderTopColor: 'transparent' }} />
          </div>
        ) : tab === 'ranking' ? (
          <RankingTab ranking={ranking} canManage={isOwnSchool} onAddToList={setAddTarget} />
        ) : (
          <ListsTab
            lists={lists} canManage={isOwnSchool} ranking={ranking}
            schoolDomain={viewSchool.domain} uid={user?.uid ?? ''}
            onListCreated={handleListCreated} onRemoveRestaurant={handleRemoveRestaurant}
          />
        )}
      </main>

      {addTarget && viewSchool && user && (
        <AddToListModal
          restaurant={addTarget}
          schoolDomain={viewSchool.domain}
          uid={user.uid}
          lists={lists.filter((l) => l.createdBy === user.uid)}
          onClose={() => setAddTarget(null)}
          onAdded={handleAdded}
          onListCreated={handleListCreated}
        />
      )}

      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 px-5 py-3 text-xs font-black z-50 whitespace-nowrap"
          style={{ background: '#1A1A1A', color: '#FF9900', borderRadius: 2 }}>
          ★ {toast}
        </div>
      )}
    </div>
  );
}

// ─── 랭킹 탭 ─────────────────────────────────────────────────────────────────

function RankingTab({
  ranking, canManage, onAddToList,
}: {
  ranking: SchoolFeedRestaurant[];
  canManage: boolean;
  onAddToList: (r: Restaurant) => void;
}) {
  if (ranking.length === 0)
    return <EmptyState emoji="🏆" title="아직 랭킹이 없어요" desc="토너먼트를 완료하면 학교 맛집 랭킹에 자동으로 기록됩니다!" />;

  return (
    <div className="flex flex-col gap-3 px-4 py-6">
      {ranking.map((item, idx) => {
        const studentCount = (item.contributedBy as string[] | undefined)?.length ?? 0;
        return (
          <div key={item.restaurant.id} className="flex items-center gap-3 px-4 py-4"
            style={{ background: '#FFFFFF', border: '2px solid #1A1A1A', borderRadius: 4 }}>
            <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center font-black text-sm"
              style={{
                background: idx === 0 ? '#FF9900' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : '#F0EDEA',
                color: idx < 3 ? '#FFFFFF' : '#1A1A1A', borderRadius: 2,
              }}>
              {idx + 1}
            </div>
            <span className="text-xl flex-shrink-0">{getCategoryEmoji(item.restaurant.category)}</span>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm truncate" style={{ color: '#1A1A1A' }}>{item.restaurant.name}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs font-bold" style={{ color: '#FF9900' }}>🎓 {studentCount}명 선택</span>
                <span className="text-xs" style={{ color: '#8C8C8C' }}>🏆{item.winCount} · ♥{item.likeCount}</span>
              </div>
            </div>
            {canManage && (
              <button onClick={() => onAddToList(item.restaurant)}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center font-black text-lg"
                style={{ background: '#FF9900', color: '#1A1A1A', borderRadius: 2 }}>+</button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── 리스트 탭 ────────────────────────────────────────────────────────────────

function ListsTab({
  lists, canManage, ranking, schoolDomain, uid, onListCreated, onRemoveRestaurant,
}: {
  lists: SchoolFeedList[];
  canManage: boolean;
  ranking: SchoolFeedRestaurant[];
  schoolDomain: string;
  uid: string;
  onListCreated: (list: SchoolFeedList) => void;
  onRemoveRestaurant: (listId: string, restaurantId: string) => void;
}) {
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function handleCreate() {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const listId = await createSchoolList(schoolDomain, uid, newTitle.trim());
      onListCreated({ id: listId, title: newTitle.trim(), restaurants: [], createdBy: uid, isPublic: true, shareToken: '', createdAt: null });
      setNewTitle(''); setShowForm(false);
    } finally { setCreating(false); }
  }

  return (
    <div className="flex flex-col gap-3 px-4 py-6">
      {canManage && (
        showForm ? (
          <div className="flex gap-2">
            <input autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="리스트 이름"
              className="flex-1 px-3 py-2 text-sm font-bold outline-none"
              style={{ border: '2px solid #1A1A1A', borderRadius: 4, background: '#FFFFFF', color: '#1A1A1A' }} />
            <button onClick={handleCreate} disabled={!newTitle.trim() || creating}
              className="px-4 py-2 text-xs font-black"
              style={{ background: '#FF9900', borderRadius: 4, color: '#1A1A1A', opacity: creating ? 0.6 : 1 }}>
              {creating ? '...' : '생성'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-3 py-2 text-xs font-black"
              style={{ background: '#D0CABC', borderRadius: 4, color: '#5C5C5C' }}>취소</button>
          </div>
        ) : (
          <button onClick={() => setShowForm(true)}
            className="w-full py-3 px-4 text-sm font-black text-left"
            style={{ border: '2px dashed #1A1A1A', borderRadius: 4, background: 'transparent', color: '#1A1A1A' }}>
            + 새 학교 리스트 만들기
          </button>
        )
      )}

      {lists.length === 0 && (
        <EmptyState emoji="📋" title="아직 리스트가 없어요"
          desc={canManage ? '위 버튼으로 첫 번째 학교 리스트를 만들어보세요!' : '우리 학교 학생이 리스트를 만들면 여기에 표시됩니다'} />
      )}

      {lists.map((list) => (
        <div key={list.id} className="px-4 py-4"
          style={{ background: '#FFFFFF', border: '2px solid #1A1A1A', borderRadius: 4 }}>
          <div className="flex items-center justify-between mb-2">
            <p className="font-black text-sm" style={{ color: '#1A1A1A' }}>{list.title}</p>
            <p className="text-xs" style={{ color: '#8C8C8C' }}>{list.restaurants.length}개 맛집</p>
          </div>
          {list.restaurants.length === 0 ? (
            <p className="text-xs" style={{ color: '#8C8C8C' }}>
              {canManage && list.createdBy === uid ? '랭킹 탭에서 + 버튼으로 가게를 추가하세요' : '아직 추가된 가게가 없어요'}
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {list.restaurants.map((r) => {
                const stat = ranking.find((rk) => rk.restaurant.id === r.id);
                const studentCount = (stat?.contributedBy as string[] | undefined)?.length ?? 0;
                return (
                  <div key={r.id} className="flex items-center justify-between px-3 py-2"
                    style={{ background: '#F5EDD0', borderRadius: 2 }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm">{getCategoryEmoji(r.category)}</span>
                      <span className="text-xs font-bold truncate" style={{ color: '#1A1A1A' }}>{r.name}</span>
                      {studentCount > 0 && (
                        <span className="text-xs flex-shrink-0 font-bold" style={{ color: '#FF9900' }}>
                          🎓{studentCount}명
                        </span>
                      )}
                    </div>
                    {canManage && list.createdBy === uid && (
                      <button onClick={() => onRemoveRestaurant(list.id!, r.id)}
                        className="flex-shrink-0 ml-2 text-xs font-black" style={{ color: '#8C8C8C' }}>✕</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── 빈 상태 ──────────────────────────────────────────────────────────────────

function EmptyState({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3 px-6">
      <span className="text-5xl">{emoji}</span>
      <p className="font-black text-lg" style={{ color: '#1A1A1A' }}>{title}</p>
      <p className="text-sm leading-relaxed max-w-xs" style={{ color: '#5C5C5C' }}>{desc}</p>
    </div>
  );
}
