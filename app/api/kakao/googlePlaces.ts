import { normalizeDocuments } from './kakaoUtils';

/** Places API (New)의 places[] 항목 중 이 파일에서 실제로 쓰는 필드만. */
interface GooglePlace {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  primaryTypeDisplayName?: { text?: string };
  internationalPhoneNumber?: string;
  googleMapsUri?: string;
  types?: string[];
  photos?: { name?: string }[];
}

/** Kakao/Google 판단 기준: 한국의 대략적인 경계 박스 (Flutter의 isKoreaCoordinate와 동일). */
export function isKoreaCoordinate(lat: number, lng: number): boolean {
  return lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132;
}

/** Kakao 카테고리 파라미터 → Google Places "Included Type" 매핑. */
const GOOGLE_CATEGORY_MAP: Record<string, string> = {
  '한식': 'korean_restaurant',
  '중식': 'chinese_restaurant',
  '일식': 'japanese_restaurant',
  '양식': 'italian_restaurant',
  '분식': 'restaurant',
  '카페': 'cafe',
  '기타': 'restaurant',
};

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.primaryTypeDisplayName',
  'places.internationalPhoneNumber',
  'places.googleMapsUri',
  'places.types',
  'places.photos',
].join(',');

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Google Places (New) 응답 한 건을 Kakao documents와 동일한 형태로 변환. */
function toDocument(place: GooglePlace, origin?: { lat: number; lng: number }) {
  const lat = place.location?.latitude ?? 0;
  const lng = place.location?.longitude ?? 0;
  const photoName = place.photos?.[0]?.name;
  return {
    id: place.id ?? '',
    place_name: place.displayName?.text ?? '',
    category_name: place.primaryTypeDisplayName?.text ?? place.types?.[0] ?? '',
    address_name: place.formattedAddress ?? '',
    road_address_name: place.formattedAddress ?? '',
    phone: place.internationalPhoneNumber ?? '',
    x: String(lng),
    y: String(lat),
    distance: origin ? String(Math.round(haversineMeters(origin.lat, origin.lng, lat, lng))) : '',
    place_url: place.googleMapsUri ?? '',
    // 사진 자체는 API 키가 필요해 클라이언트에 직접 노출하지 않고,
    // 우리 서버의 /api/kakao/photo 프록시를 거쳐 받아온다.
    photo_url: photoName ? `/api/kakao/photo?name=${encodeURIComponent(photoName)}` : '',
  };
}

/** Places API (New) - Nearby Search. Kakao의 /nearby 대체용. */
export async function searchNearbyGoogle(
  lat: number,
  lng: number,
  radius: number,
  categoryParam: string,
) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_PLACES_API_KEY not configured');

  const includedType = GOOGLE_CATEGORY_MAP[categoryParam] ?? 'restaurant';
  const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      includedTypes: [includedType],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: Math.min(radius, 50000),
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Google Places nearby search failed: ${response.status}`);
  }
  const data = await response.json();
  const places = (data.places ?? []) as GooglePlace[];
  return normalizeDocuments(places.map((p) => toDocument(p, { lat, lng })));
}

/** Places API (New) - Text Search. Kakao의 /search-location 대체용. */
export async function searchTextGoogle(query: string) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_PLACES_API_KEY not configured');

  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({ textQuery: query }),
  });

  if (!response.ok) {
    throw new Error(`Google Places text search failed: ${response.status}`);
  }
  const data = await response.json();
  const places = (data.places ?? []) as GooglePlace[];
  return normalizeDocuments(places.map((p) => toDocument(p)));
}
