export const NEARBY_TTL_SECONDS = 1800; // 30분 — 맛집 목록은 자주 안 바뀌고, 유료 API가 걸린 경로라 절감 우선
export const LOCATION_TTL_SECONDS = 86400; // 24시간 — 지명→좌표 변환은 사실상 불변

const GRID_FACTOR = 100; // 0.01° ≈ 1.1km 단위로 좌표를 묶어 캐시 히트율을 높인다.

const MIN_RADIUS = 1;
const MAX_RADIUS = 20000; // Kakao Local API 허용 최대값(0~20000m); Google 쪽도 이 범위로 통일
const DEFAULT_RADIUS = 1000;

const MIN_MAX_PAGES = 1;
const MAX_MAX_PAGES = 3;
const DEFAULT_MAX_PAGES = 3;

export const MAX_QUERY_LENGTH = 200;

/** 좌표를 그리드에 맞춰 반올림한다 — 근처 검색끼리 같은 캐시 키를 쓰게 하기 위함. */
export function roundToGrid(value: number): number {
  return Math.round(value * GRID_FACTOR) / GRID_FACTOR;
}

/**
 * radius 쿼리 파라미터를 안전한 범위로 정규화한다. 파싱 실패(NaN)는 기본값으로,
 * 범위를 벗어나면 클램프해서 잘못된 입력이 그대로 캐시 키나 업스트림 호출에
 * 흘러가지 않게 한다.
 */
export function clampRadius(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_RADIUS;
  return Math.min(MAX_RADIUS, Math.max(MIN_RADIUS, Math.round(value)));
}

/** maxPages 쿼리 파라미터를 안전한 범위로 정규화한다 (NaN → 기본값, 그 외 1~3 클램프). */
export function clampMaxPages(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_MAX_PAGES;
  return Math.min(MAX_MAX_PAGES, Math.max(MIN_MAX_PAGES, Math.round(value)));
}

/** 검색어를 정규화해 같은 의미의 쿼리가 같은 캐시 키를 쓰게 한다. */
export function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * 빈 결과/실패를 캐시에 저장하지 않기 위한 sentinel. unstable_cache는 성공적으로
 * resolve된 값만 저장하므로, 이걸 throw하면 다음 요청이 바로 재시도하게 된다.
 */
export class EmptyResultError extends Error {}

export function assertNonEmpty<T>(documents: T[]): T[] {
  if (documents.length === 0) throw new EmptyResultError();
  return documents;
}

/**
 * 캐시된 fetcher를 호출해 {documents} 또는 에러 응답으로 변환하는 공통 헬퍼.
 * EmptyResultError는 정상적인 "결과 없음"(200)으로, 그 외 에러는 실패(500)로 처리한다.
 */
export async function respondWithDocuments(
  fetcher: () => Promise<unknown[]>,
  errorLabel: string,
): Promise<Response> {
  try {
    const documents = await fetcher();
    return Response.json({ documents });
  } catch (error) {
    if (error instanceof EmptyResultError) {
      return Response.json({ documents: [] });
    }
    console.error(`❌ ${errorLabel}:`, error);
    return Response.json(
      { error: '검색 실패', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
