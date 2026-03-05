import { getAdminDb } from '@/lib/firebase/admin';
import type { Metadata } from 'next';
import type { Restaurant } from '@/types';
import Link from 'next/link';

interface SharedListRef {
  listId: string;
  ownerUid: string;
}

interface ListData {
  title: string;
  restaurants: Restaurant[];
}

// ─── 카테고리 이모지 ─────────────────────────────────────────────────────────

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

// ─── 공통 데이터 조회 헬퍼 ───────────────────────────────────────────────────

async function getListData(shareToken: string): Promise<ListData | null> {
  // 1. shared_lists에서 listId 조회
  const sharedSnap = await getAdminDb().collection('shared_lists').doc(shareToken).get();
  if (!sharedSnap.exists) return null;

  const { listId } = sharedSnap.data() as SharedListRef;

  // 2. public_lists에서 실제 데이터 조회
  const listSnap = await getAdminDb().collection('public_lists').doc(listId).get();
  if (!listSnap.exists) return null;

  return listSnap.data() as ListData;
}

// ─── 메타데이터 (OG) ────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}): Promise<Metadata> {
  const { shareToken } = await params;
  try {
    const data = await getListData(shareToken);
    if (!data) return { title: '공유 리스트 — 당겨먹자' };
    return {
      title: `${data.title} — 당겨먹자`,
      description: `${data.restaurants.length}개 맛집이 담긴 리스트`,
    };
  } catch {
    return { title: '공유 리스트 — 당겨먹자' };
  }
}

// ─── 페이지 ──────────────────────────────────────────────────────────────────

export default async function SharePage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;

  let data: ListData | null = null;
  try {
    data = await getListData(shareToken);
  } catch {
    // Firestore 오류 시 not found 처리
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#F5EDD0' }}>
        <p className="text-4xl mb-4">☆</p>
        <p className="text-base font-black mb-1" style={{ color: '#1A1A1A' }}>
          리스트를 찾을 수 없습니다
        </p>
        <p className="text-xs mb-6" style={{ color: '#8C8C8C' }}>
          링크가 만료되었거나 삭제된 리스트입니다
        </p>
        <Link
          href="/"
          className="px-8 py-3 text-sm font-black tracking-widest uppercase"
          style={{ background: '#FF9900', color: '#FFFFFF', borderRadius: 2 }}
        >
          홈으로
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5EDD0' }}>
      {/* 헤더 */}
      <header style={{ borderBottom: '2px solid #1A1A1A' }}>
        <div className="px-6 pt-5 pb-3">
          <p className="text-xs font-black tracking-widest uppercase" style={{ color: '#FF9900' }}>
            SHARED LIST
          </p>
          <h1 className="text-xl font-black mt-0.5" style={{ color: '#1A1A1A' }}>
            {data.title}
          </h1>
          <p className="text-xs mt-1" style={{ color: '#8C8C8C' }}>
            {data.restaurants.length}개 맛집
          </p>
        </div>
      </header>

      {/* 로그인 유도 배너 */}
      <div
        className="px-6 py-3 flex items-center justify-between gap-3"
        style={{ background: '#1A1A1A', borderBottom: '2px solid #FF9900' }}
      >
        <p className="text-xs font-bold" style={{ color: '#E8DDB8' }}>
          이 리스트를 내 계정에 저장하려면 로그인하세요
        </p>
        <a
          href="/api/auth/kakao"
          className="flex-shrink-0 px-4 py-1.5 text-xs font-black tracking-widest uppercase"
          style={{ background: '#FF9900', color: '#FFFFFF', borderRadius: 2 }}
        >
          로그인
        </a>
      </div>

      {/* 식당 목록 */}
      <main className="flex-1 px-6 py-5">
        {data.restaurants.length === 0 ? (
          <div className="text-center mt-16">
            <p className="text-3xl mb-3">☆</p>
            <p className="text-sm" style={{ color: '#8C8C8C' }}>저장된 식당이 없습니다</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {data.restaurants.map((r, idx) => (
              <div
                key={r.id}
                className="flex items-center overflow-hidden"
                style={{ background: '#FFFFFF', border: '2px solid #E8DDB8', borderRadius: 2 }}
              >
                {/* 순번 */}
                <div
                  className="w-10 flex-shrink-0 flex items-center justify-center text-xs font-black self-stretch"
                  style={{ background: '#1A1A1A', color: '#FF9900' }}
                >
                  {idx + 1}
                </div>

                {/* 이미지 또는 이모지 */}
                {r.images?.[0] ? (
                  <img
                    src={r.images[0]}
                    alt={r.name}
                    className="w-14 h-14 flex-shrink-0 object-cover"
                    style={{ borderRight: '1px solid #E8DDB8' }}
                  />
                ) : (
                  <div
                    className="w-14 h-14 flex-shrink-0 flex items-center justify-center text-2xl"
                    style={{ background: '#F5EDD0', borderRight: '1px solid #E8DDB8' }}
                  >
                    {getCategoryEmoji(r.category)}
                  </div>
                )}

                {/* 정보 */}
                <div className="flex-1 min-w-0 px-3 py-3">
                  <p className="text-sm font-black truncate" style={{ color: '#1A1A1A' }}>
                    {r.name}
                  </p>
                  <p className="text-xs truncate mt-0.5" style={{ color: '#FF9900' }}>
                    {r.category.split('>').pop()?.trim()}
                  </p>
                  <p className="text-xs truncate mt-0.5" style={{ color: '#8C8C8C' }}>
                    {r.address}
                  </p>
                </div>

                {/* 카카오맵 링크 */}
                {r.kakaoUrl && (
                  <a
                    href={r.kakaoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-full flex-shrink-0 flex items-center justify-center text-base transition-opacity hover:opacity-60 self-stretch"
                    style={{ borderLeft: '1px solid #E8DDB8', color: '#8C8C8C' }}
                  >
                    🗺
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 푸터 */}
      <div className="px-6 pb-8 pt-4 text-center">
        <Link
          href="/"
          className="inline-block px-8 py-3 text-sm font-black tracking-widest uppercase"
          style={{ background: '#FF9900', color: '#FFFFFF', borderRadius: 2 }}
        >
          당겨먹자로 시작하기
        </Link>
        <p className="text-xs mt-3" style={{ color: '#8C8C8C' }}>
          토너먼트로 오늘의 맛집을 골라보세요
        </p>
      </div>

      {/* 하단 텍스트 */}
      <div className="py-2 overflow-hidden" style={{ background: '#1A1A1A' }}>
        <div className="flex gap-8 text-xs font-black tracking-widest uppercase" style={{ color: '#F5EDD0' }}>
          {Array(6).fill('★ SHARED LIST ★ 당겨먹자 ★ FOOD COLLECTION').map((text, i) => (
            <span key={i} className="whitespace-nowrap">{text}</span>
          ))}
        </div>
      </div>
    </div>
  );
}