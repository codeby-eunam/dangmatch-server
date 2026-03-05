import { notFound } from 'next/navigation';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://dangmatch-y7al.vercel.app';

interface Restaurant {
  id: string;
  name: string;
  category: string;
  address: string;
  kakaoUrl?: string;
  images?: string[];
}

interface ListData {
  id: string;
  title: string;
  ownerUid: string;
  restaurants: Restaurant[];
  isPublic: boolean;
}

async function getList(listId: string): Promise<ListData | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/lists/public`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    const found = (data.lists ?? []).find((l: ListData) => l.id === listId);
    return found ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ searchParams }: { searchParams: { listId?: string } }) {
  const listId = searchParams.listId;
  if (!listId) return { title: 'Dangmatch' };
  const list = await getList(listId);
  return {
    title: list ? `${list.title} - Dangmatch` : 'Dangmatch',
    description: list ? `${list.restaurants.length}개의 맛집이 담긴 리스트` : '',
  };
}

export default async function SharePage({ searchParams }: { searchParams: { listId?: string } }) {
  const listId = searchParams.listId;
  if (!listId) notFound();

  const list = await getList(listId);

  if (!list || !list.isPublic) {
    return (
      <main style={styles.container}>
        <div style={styles.errorBox}>
          <span style={styles.errorEmoji}>🔒</span>
          <h2 style={styles.errorTitle}>볼 수 없는 보관함이에요</h2>
          <p style={styles.errorDesc}>비공개이거나 존재하지 않는 보관함이에요</p>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.container}>
      {/* 헤더 */}
      <div style={styles.header}>
        <div style={styles.logo}>🍽️ Dangmatch</div>
      </div>

      {/* 타이틀 */}
      <div style={styles.titleSection}>
        <div style={styles.breadcrumb}>
          <div style={styles.breadcrumbDot} />
          <span style={styles.breadcrumbTxt}>{list.ownerUid}의 찜 리스트</span>
        </div>
        <h1 style={styles.listTitle}>{list.title}</h1>
        <p style={styles.listSubtitle}>찜한 최고의 맛집 리스트 ({list.restaurants.length}곳)</p>
      </div>

      {/* 가게 그리드 */}
      <div style={styles.grid}>
        {list.restaurants.map((r) => {
          const image = r.images?.[0] ?? `https://picsum.photos/seed/${r.id}/300/220`;
          const categoryShort = r.category?.split(' > ').pop() ?? r.category ?? '기타';
          return (
            <a
              key={r.id}
              href={r.kakaoUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.card}
            >
              <div style={styles.imgWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt={r.name} style={styles.cardImg} />
              </div>
              <div style={styles.cardBody}>
                <p style={styles.cardName}>{r.name}</p>
                <p style={styles.cardDesc}>{r.address}</p>
              </div>
              <div style={styles.cardFooter}>
                <span style={styles.categoryChip}>{categoryShort}</span>
              </div>
            </a>
          );
        })}
      </div>

      {/* 앱 유도 배너 */}
      <div style={styles.appBanner}>
        <p style={styles.bannerTxt}>나만의 맛집 리스트를 만들고 싶다면?</p>
        <a href="https://dangmatch.com" style={styles.bannerBtn}>
          Dangmatch 앱 보러가기 →
        </a>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#F8F9FA',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E5E7EB',
    padding: '16px 20px',
  },
  logo: {
    fontSize: 20,
    fontWeight: 800,
    color: '#FF6B35',
  },
  titleSection: {
    padding: '24px 20px 20px',
    maxWidth: 720,
    margin: '0 auto',
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  breadcrumbDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#1E7874',
  },
  breadcrumbTxt: {
    fontSize: 13,
    fontWeight: 600,
    color: '#1E7874',
  },
  listTitle: {
    fontSize: 28,
    fontWeight: 800,
    color: '#111827',
    margin: '0 0 6px',
    letterSpacing: -0.5,
  },
  listSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    margin: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 12,
    padding: '0 20px 32px',
    maxWidth: 720,
    margin: '0 auto',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  },
  imgWrap: {
    width: '100%',
    aspectRatio: '4/3',
    overflow: 'hidden',
  },
  cardImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  cardBody: {
    padding: '10px 12px 6px',
  },
  cardName: {
    fontSize: 14,
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 4px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  cardDesc: {
    fontSize: 11,
    color: '#9CA3AF',
    margin: 0,
    lineHeight: 1.5,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  cardFooter: {
    padding: '4px 12px 12px',
  },
  categoryChip: {
    display: 'inline-block',
    padding: '3px 10px',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    fontSize: 11,
    color: '#6B7280',
    fontWeight: 500,
  },
  appBanner: {
    margin: '0 20px 40px',
    maxWidth: 680,
    marginLeft: 'auto',
    marginRight: 'auto',
    backgroundColor: '#FF6B35',
    borderRadius: 20,
    padding: '24px',
    textAlign: 'center',
  },
  bannerTxt: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 600,
    margin: '0 0 12px',
  },
  bannerBtn: {
    display: 'inline-block',
    backgroundColor: '#FFFFFF',
    color: '#FF6B35',
    fontWeight: 700,
    fontSize: 14,
    padding: '10px 24px',
    borderRadius: 20,
    textDecoration: 'none',
  },
  errorBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: 12,
  },
  errorEmoji: { fontSize: 48 },
  errorTitle: { fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 },
  errorDesc: { fontSize: 14, color: '#9CA3AF', margin: 0 },
};