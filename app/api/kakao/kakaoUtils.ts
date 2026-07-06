/** 카카오가 반환하는 place_url이 http:// 인 경우 https:// 로 변환 */
export function toHttps(url: string | undefined): string {
  if (!url) return '';
  return url.startsWith('http://') ? 'https://' + url.slice(7) : url;
}

/** documents 배열 내 place_url 을 일괄 정규화 */
export function normalizeDocuments(documents: any[]): any[] {
  return documents.map((doc) => ({
    ...doc,
    place_url: toHttps(doc.place_url),
  }));
}
