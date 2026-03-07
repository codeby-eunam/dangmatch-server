export interface School {
  name: string;    // 대학교 전체 명칭 (예: "연세대학교")
  domain: string;  // Firestore 경로용 식별자 (예: "연세대학교") — school_feeds/{domain}
}

export interface SchoolFeedRestaurant {
  restaurant: Restaurant;
  winCount: number;
  likeCount: number;
  contributedBy: string[]; // uid 배열 (중복 제거용)
  lastUpdated: unknown;    // serverTimestamp
}

export interface SchoolFeedList {
  id?: string;
  title: string;
  restaurants: Restaurant[];
  createdBy: string;
  isPublic: boolean;
  shareToken: string;
  createdAt: unknown;
}

export interface Restaurant {
  id: string;        // kakaoPlaceId — Firestore 문서 ID와 동일
  name: string;
  category: string;
  address: string;
  phone: string;
  lat: number;       // 위도 (Kakao y → parseFloat)
  lng: number;       // 경도 (Kakao x → parseFloat)
  kakaoUrl?: string; // 카카오맵 URL
  distance?: string; // UI 표시용, Firestore 미저장
  images?: string[]; // 이미지 URL 배열
  isBye?: boolean;   // 토너먼트 부전승 카드
}

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface TournamentMatch {
  round: number;
  matchIndex: number;
  restaurant1: Restaurant | null;
  restaurant2: Restaurant | null;
  winner?: Restaurant;
}

export interface RestaurantList {
  id: string;
  ownerUid: string;
  title: string;
  restaurants: Restaurant[];
  isPublic: boolean;
  shareToken: string;
  createdAt: string;   // ISO string (serverTimestamp().toDate().toISOString())
  updatedAt: string;
}

export interface SharedList {
  ownerUid: string;
  listId: string;
  title: string;
  restaurants: Restaurant[];
  createdAt: string;
}