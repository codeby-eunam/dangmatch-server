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