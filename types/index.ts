export interface Restaurant {
  id: string;
  name: string;
  category: string;
  address: string;
  roadAddress: string;
  phone: string;
  x: string; // 경도
  y: string; // 위도
  distance?: string;
  placeUrl?: string;
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

// export type FoodCategory = 
//   | '한식' 
//   | '중식' 
//   | '일식' 
//   | '양식' 
//   | '카페' 
//   | '분식';