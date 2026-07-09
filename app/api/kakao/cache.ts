export const NEARBY_TTL_SECONDS = 1800; // 30분 — 맛집 목록은 자주 안 바뀌고, 유료 API가 걸린 경로라 절감 우선
export const LOCATION_TTL_SECONDS = 86400; // 24시간 — 지명→좌표 변환은 사실상 불변

const GRID_FACTOR = 100; // 0.01° ≈ 1.1km 단위로 좌표를 묶어 캐시 히트율을 높인다.

/** 좌표를 그리드에 맞춰 반올림한다 — 근처 검색끼리 같은 캐시 키를 쓰게 하기 위함. */
export function roundToGrid(value: number): number {
  return Math.round(value * GRID_FACTOR) / GRID_FACTOR;
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
