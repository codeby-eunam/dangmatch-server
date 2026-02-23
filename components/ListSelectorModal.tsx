'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import {
  getUserLists,
  createList,
  addRestaurantToList,
} from '@/lib/firebase/lists';
import type { Restaurant, RestaurantList } from '@/types';

interface Props {
  restaurant: Restaurant;
  onClose: () => void;
  onSaved: (listTitle: string) => void;
}

export default function ListSelectorModal({ restaurant, onClose, onSaved }: Props) {
  const { user } = useAuthStore();
  const [lists, setLists] = useState<RestaurantList[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null); // listId being saved
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getUserLists(user.uid)
      .then(setLists)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const handleSelectList = async (list: RestaurantList) => {
    if (saving) return;
    // 이미 저장된 식당이면 무시
    if (list.restaurants.some((r) => r.id === restaurant.id)) {
      onSaved(list.title);
      return;
    }
    setSaving(list.id);
    try {
      await addRestaurantToList(user!.uid, list.id, list.shareToken, restaurant);
      onSaved(list.title);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(null);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim() || creating || !user) return;
    setCreating(true);
    try {
      const created = await createList(user.uid, newTitle.trim());
      await addRestaurantToList(user.uid, created.id, created.shareToken, restaurant);
      onSaved(created.title);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    /* 오버레이 */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* 시트 */}
      <div
        className="w-full max-w-md pb-safe"
        style={{
          background: '#F5EDD0',
          borderTop: '3px solid #1A1A1A',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        {/* 헤더 */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid #E8DDB8' }}
        >
          <div>
            <p className="text-xs font-black tracking-widest uppercase" style={{ color: '#FF9900' }}>
              LIST SAVE
            </p>
            <p className="text-sm font-black mt-0.5 truncate max-w-[240px]" style={{ color: '#1A1A1A' }}>
              {restaurant.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center font-black text-base transition-opacity hover:opacity-60"
            style={{ color: '#1A1A1A', border: '2px solid #1A1A1A', borderRadius: 2 }}
          >
            ✕
          </button>
        </div>

        {/* 비로그인 */}
        {!user && (
          <div className="px-5 py-8 text-center">
            <p className="text-2xl mb-3">★</p>
            <p className="text-sm font-black mb-1" style={{ color: '#1A1A1A' }}>
              로그인이 필요합니다
            </p>
            <p className="text-xs mb-5" style={{ color: '#8C8C8C' }}>
              리스트를 저장하려면 카카오 로그인을 해주세요
            </p>
            <button
              onClick={() => { window.location.href = '/api/auth/kakao'; }}
              className="w-full py-3 text-sm font-black tracking-widest uppercase"
              style={{ background: '#FF9900', color: '#FFFFFF', borderRadius: 2 }}
            >
              카카오 로그인
            </button>
          </div>
        )}

        {/* 로그인 + 로딩 */}
        {user && loading && (
          <div className="px-5 py-8 text-center">
            <div
              className="inline-block w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: '#FF9900', borderTopColor: 'transparent' }}
            />
          </div>
        )}

        {/* 로그인 + 리스트 목록 */}
        {user && !loading && (
          <div className="px-5 py-3">
            {lists.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-black tracking-widest uppercase mb-2" style={{ color: '#8C8C8C' }}>
                  내 리스트
                </p>
                {lists.map((list) => {
                  const alreadySaved = list.restaurants.some((r) => r.id === restaurant.id);
                  return (
                    <button
                      key={list.id}
                      onClick={() => handleSelectList(list)}
                      disabled={saving === list.id}
                      className="w-full flex items-center justify-between px-4 py-3 mb-2 text-left transition-opacity hover:opacity-70 disabled:opacity-40"
                      style={{
                        background: alreadySaved ? '#1A1A1A' : '#FFFFFF',
                        border: '2px solid #1A1A1A',
                        borderRadius: 2,
                      }}
                    >
                      <div>
                        <p
                          className="text-sm font-black"
                          style={{ color: alreadySaved ? '#FF9900' : '#1A1A1A' }}
                        >
                          {list.title}
                        </p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: alreadySaved ? '#E8DDB8' : '#8C8C8C' }}
                        >
                          {list.restaurants.length}개 저장됨
                        </p>
                      </div>
                      <span
                        className="text-lg font-black"
                        style={{ color: alreadySaved ? '#FF9900' : '#8C8C8C' }}
                      >
                        {saving === list.id ? '…' : alreadySaved ? '★' : '☆'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 새 리스트 만들기 */}
            {!showCreateInput ? (
              <button
                onClick={() => setShowCreateInput(true)}
                className="w-full py-3 text-sm font-black tracking-widest uppercase transition-opacity hover:opacity-70"
                style={{
                  background: '#F5EDD0',
                  border: '2px dashed #E8DDB8',
                  color: '#8C8C8C',
                  borderRadius: 2,
                }}
              >
                + 새 리스트 만들기
              </button>
            ) : (
              <div>
                <input
                  autoFocus
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                  placeholder="리스트 이름 입력"
                  maxLength={30}
                  className="w-full px-4 py-3 text-sm font-bold mb-2 outline-none"
                  style={{
                    background: '#FFFFFF',
                    border: '2px solid #1A1A1A',
                    borderRadius: 2,
                    color: '#1A1A1A',
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowCreateInput(false); setNewTitle(''); }}
                    className="flex-1 py-2.5 text-xs font-black tracking-widest uppercase"
                    style={{ border: '2px solid #E8DDB8', color: '#8C8C8C', borderRadius: 2 }}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!newTitle.trim() || creating}
                    className="flex-1 py-2.5 text-xs font-black tracking-widest uppercase transition-opacity hover:opacity-80 disabled:opacity-40"
                    style={{ background: '#FF9900', color: '#FFFFFF', borderRadius: 2 }}
                  >
                    {creating ? '저장 중…' : '만들기'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}
