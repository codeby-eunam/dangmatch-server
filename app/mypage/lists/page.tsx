'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth';
import { getUserLists, deleteList } from '@/lib/firebase/lists';
import type { RestaurantList } from '@/types';

export default function MyListsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const [lists, setLists] = useState<RestaurantList[]>([]);
  const [fetching, setFetching] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!user) { setFetching(false); return; }
    getUserLists(user.uid)
      .then(setLists)
      .catch(console.error)
      .finally(() => setFetching(false));
  }, [user, isLoading]);

  const handleDelete = async (list: RestaurantList) => {
    if (!user || deletingId) return;
    if (!confirm(`"${list.title}" 리스트를 삭제할까요?\n공유 링크도 함께 삭제됩니다.`)) return;
    setDeletingId(list.id);
    try {
      await deleteList(user.uid, list.id, list.shareToken);
      setLists((prev) => prev.filter((l) => l.id !== list.id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5EDD0' }}>
      {/* 헤더 */}
      <header style={{ borderBottom: '2px solid #1A1A1A' }}>
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-8 h-8 flex items-center justify-center font-black text-base transition-opacity hover:opacity-60"
              style={{ border: '2px solid #1A1A1A', borderRadius: 2, color: '#1A1A1A' }}
            >
              ←
            </button>
            <div>
              <p className="text-xs font-black tracking-widest uppercase" style={{ color: '#FF9900' }}>
                MY PAGE
              </p>
              <p className="text-sm font-black" style={{ color: '#1A1A1A' }}>
                내 맛집 리스트
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="text-xs font-black tracking-widest uppercase transition-opacity hover:opacity-60"
            style={{ color: '#8C8C8C' }}
          >
            HOME
          </Link>
        </div>
      </header>

      {/* 콘텐츠 */}
      <main className="flex-1 px-6 py-5">
        {/* 비로그인 */}
        {!isLoading && !user && (
          <div className="text-center mt-16">
            <p className="text-4xl mb-4">★</p>
            <p className="text-base font-black mb-1" style={{ color: '#1A1A1A' }}>
              로그인이 필요합니다
            </p>
            <p className="text-xs mb-6" style={{ color: '#8C8C8C' }}>
              내 리스트를 보려면 카카오 로그인을 해주세요
            </p>
            <button
              onClick={() => { window.location.href = '/api/auth/kakao'; }}
              className="px-8 py-3 text-sm font-black tracking-widest uppercase"
              style={{ background: '#FF9900', color: '#FFFFFF', borderRadius: 2 }}
            >
              카카오 로그인
            </button>
          </div>
        )}

        {/* 로딩 */}
        {(isLoading || (user && fetching)) && (
          <div className="flex justify-center mt-16">
            <div
              className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: '#FF9900', borderTopColor: 'transparent' }}
            />
          </div>
        )}

        {/* 리스트 목록 */}
        {user && !fetching && (
          <>
            {lists.length === 0 ? (
              <div className="text-center mt-16">
                <p className="text-4xl mb-4">☆</p>
                <p className="text-base font-black mb-1" style={{ color: '#1A1A1A' }}>
                  저장된 리스트가 없어요
                </p>
                <p className="text-xs mb-6" style={{ color: '#8C8C8C' }}>
                  스와이프 또는 결과 페이지에서 ★ 버튼을 눌러 저장해보세요
                </p>
                <Link
                  href="/location"
                  className="inline-block px-8 py-3 text-sm font-black tracking-widest uppercase"
                  style={{ background: '#1A1A1A', color: '#FF9900', borderRadius: 2 }}
                >
                  토너먼트 시작
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {lists.map((list) => (
                  <div
                    key={list.id}
                    className="flex items-center"
                    style={{ background: '#FFFFFF', border: '2px solid #1A1A1A', borderRadius: 2 }}
                  >
                    <Link
                      href={`/mypage/lists/${list.id}`}
                      className="flex-1 px-4 py-4 min-w-0 transition-opacity hover:opacity-70"
                    >
                      <p className="text-sm font-black truncate" style={{ color: '#1A1A1A' }}>
                        {list.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs" style={{ color: '#8C8C8C' }}>
                          {list.restaurants.length}개 저장됨
                        </span>
                        <span className="text-xs" style={{ color: '#E8DDB8' }}>·</span>
                        <span className="text-xs" style={{ color: '#8C8C8C' }}>
                          {new Date(list.updatedAt).toLocaleDateString('ko-KR', {
                            month: 'short', day: 'numeric',
                          })}
                        </span>
                      </div>
                    </Link>
                    <button
                      onClick={() => handleDelete(list)}
                      disabled={deletingId === list.id}
                      className="w-12 h-full flex items-center justify-center text-lg transition-opacity hover:opacity-60 disabled:opacity-30 self-stretch"
                      style={{ borderLeft: '2px solid #E8DDB8', color: '#8C8C8C' }}
                      aria-label="삭제"
                    >
                      {deletingId === list.id ? '…' : '✕'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* 하단 텍스트 */}
      <div className="py-2 overflow-hidden" style={{ background: '#1A1A1A' }}>
        <div className="flex gap-8 text-xs font-black tracking-widest uppercase" style={{ color: '#F5EDD0' }}>
          {Array(6).fill('★ MY FOOD LIST ★ RETRO COLLECTION ★ 맛집 리스트').map((text, i) => (
            <span key={i} className="whitespace-nowrap">{text}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
