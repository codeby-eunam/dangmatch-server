import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

/**
 * Firestore universities 컬렉션에서 대학교 검색
 * GET /api/universities?q=연세
 *
 * - 검색어 없으면 빈 배열 반환 (검색 유도)
 * - 검색어 있으면 name 필드 prefix 검색 (최대 30건)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.trim() ?? '';

  if (!query) {
    return NextResponse.json({ items: [] });
  }

  try {
    const db = getAdminDb();
    const snap = await db
      .collection('universities')
      .where('name', '>=', query)
      .where('name', '<=', query + '\uf8ff')
      .limit(30)
      .get();

    const items = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        name: data.name as string,
        domain: data.name as string,
        address: (data.address as string) ?? '',
      };
    });

    // 이름순 정렬
    items.sort((a, b) => a.name.localeCompare(b.name, 'ko'));

    return NextResponse.json({ items });
  } catch (err) {
    console.error('[universities] Firestore 검색 오류:', err);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}
