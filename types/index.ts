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

  // 토너먼트 통계 (Firestore에서 읽어올 때 포함)
  winCount?: number;          // 1v1 토너먼트에서 이긴 횟수 (기본값 0)
  loseCount?: number;         // 1v1 토너먼트에서 진 횟수 (기본값 0)
  tournamentCount?: number;   // 토너먼트 노출 횟수
  winRate?: number;           // winCount / tournamentCount

  // 스와이프 통계
  choiceCount?: number;       // 스와이프에서 선택된 횟수 (기본값 0)
  passCount?: number;         // 스와이프에서 넘긴 횟수 (기본값 0)

  // 방문 비용 통계 (사용자 자발 입력)
  totalPriceSum?: number;     // 1인당 비용 합계 (원)
  priceCount?: number;        // 비용 입력 횟수
  avgPrice?: number;          // 평균 1인당 비용 (💰 12,800원)

  // 방문 인원 통계 (사용자 자발 입력)
  totalPartySizeSum?: number; // 인원 합계
  partySizeCount?: number;    // 인원 입력 횟수
  avgPartySize?: number;      // 평균 방문 인원 (👥 2.4명)
}

/** 결과 화면에서 수집하는 방문 데이터 */
export interface VisitData {
  restaurantId: string;
  price?: number;      // 1인당 비용 (원), 선택 입력
  partySize?: number;  // 방문 인원, 선택 입력
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