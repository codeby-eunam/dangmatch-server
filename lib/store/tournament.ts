import { create } from 'zustand';
import { Restaurant, Location } from '@/types';

interface TournamentStore {
  location: Location | null;
  radius: number | null;
  restaurants: Restaurant[];
  swipedRestaurants: Restaurant[];

  currentRound: number;
  currentMatchIndex: number;
  winners: Restaurant[];
  finalWinner: Restaurant | null;

  setLocation: (location: Location) => void;
  setRadius: (radius: number) => void;
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
  restaurants: [],
  swipedRestaurants: [],
  currentRound: 1,
  currentMatchIndex: 0,
  winners: [],
  finalWinner: null,

  setLocation: (location) => set({ location }),
  setRadius: (radius) => set({ radius }),
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
    restaurants: [],
    swipedRestaurants: [],
    currentRound: 1,
    currentMatchIndex: 0,
    winners: [],
    finalWinner: null
  })
}));