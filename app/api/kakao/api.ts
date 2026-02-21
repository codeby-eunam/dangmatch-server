import { Restaurant } from '@/types';

export async function searchNearbyRestaurants(
  lat: number,
  lng: number,
  category?: string,
  radius: number = 1000
): Promise<Restaurant[]> {
  const response = await fetch(
    `/api/kakao/nearby?lat=${lat}&lng=${lng}&category=${category || ''}&radius=${radius}`
  );
  
  if (!response.ok) throw new Error('식당 검색 실패');
  
  const data = await response.json();
  return data.documents.map((doc: any) => ({
    id: doc.id,
    name: doc.place_name,
    category: doc.category_name,
    address: doc.address_name,
    roadAddress: doc.road_address_name,
    phone: doc.phone,
    x: doc.x,
    y: doc.y,
    distance: doc.distance,
    placeUrl: doc.place_url
  }));
}