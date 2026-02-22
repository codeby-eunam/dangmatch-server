import { create } from 'zustand';
import { Restaurant, Location } from '@/types';

const ALL_CATEGORIES = ['한식', '중식', '일식', '양식', '분식', '카페', '기타'];

interface TournamentStore {
  location: Location | null;
  radius: number | null;
  categories: string[];
  restaurants: Restaurant[];
  swipedRestaurants: Restaurant[];

  currentRound: number;
  currentMatchIndex: number;
  winners: Restaurant[];
  finalWinner: Restaurant | null;

  setLocation: (location: Location) => void;
  setRadius: (radius: number) => void;
  setCategories: (categories: string[]) => void;
  setRestaurants: (restaurants: Restaurant[]) => void;
  setSwipedRestaurants: (restaurants: Restaurant[]) => void;

  selectWinner: (winner: Restaurant) => void;
  nextMatch: () => void;
  setFinalWinner: (winner: Restaurant) => void;

  reset: () => void;
}

export const useTournamentStore = create<TournamentStore>((set) => ({
  location: null,
  radius: null,
  categories: ALL_CATEGORIES,
  restaurants: [],
  swipedRestaurants: [],
  currentRound: 1,
  currentMatchIndex: 0,
  winners: [],
  finalWinner: null,

  setLocation: (location) => set({ location }),
  setRadius: (radius) => set({ radius }),
  setCategories: (categories) => set({ categories }),
  setRestaurants: (restaurants) => set({ restaurants }),
  setSwipedRestaurants: (restaurants) => set({ swipedRestaurants: restaurants }),

  selectWinner: (winner) => set((state) => ({
    winners: [...state.winners, winner]
  })),

  nextMatch: () => set((state) => ({
    currentMatchIndex: state.currentMatchIndex + 1
  })),

  setFinalWinner: (winner) => set({ finalWinner: winner }),

  reset: () => set({
    location: null,
    radius: null,
    categories: ALL_CATEGORIES,
    restaurants: [],
    swipedRestaurants: [],
    currentRound: 1,
    currentMatchIndex: 0,
    winners: [],
    finalWinner: null
  })
}));
