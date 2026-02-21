import { create } from 'zustand';
import { Restaurant, Location } from '@/types';

interface TournamentStore {
  location: Location | null;
  searchType: 'current' | 'area' | null;
  radius: number | null;
  restaurants: Restaurant[];
  
  currentRound: number;
  currentMatchIndex: number;
  winners: Restaurant[];
  finalWinner: Restaurant | null;
  
  setLocation: (location: Location, searchType: 'current' | 'area') => void;
  setRadius: (radius: number) => void;
  setRestaurants: (restaurants: Restaurant[]) => void;
  
  selectWinner: (winner: Restaurant) => void;
  nextMatch: () => void;
  setFinalWinner: (winner: Restaurant) => void;
  
  reset: () => void;
}

export const useTournamentStore = create<TournamentStore>((set) => ({
  location: null,
  searchType: null,
  radius: null,
  restaurants: [],
  currentRound: 1,
  currentMatchIndex: 0,
  winners: [],
  finalWinner: null,
  
  setLocation: (location, searchType) => set({ location, searchType }),
  setRadius: (radius) => set({ radius }),
  setRestaurants: (restaurants) => set({ restaurants }),
  
  selectWinner: (winner) => set((state) => ({
    winners: [...state.winners, winner]
  })),
  
  nextMatch: () => set((state) => ({
    currentMatchIndex: state.currentMatchIndex + 1
  })),
  
  setFinalWinner: (winner) => set({ finalWinner: winner }),
  
  reset: () => set({
    location: null,
	searchType: null,
    radius: null,
    restaurants: [],
    currentRound: 1,
    currentMatchIndex: 0,
    winners: [],
    finalWinner: null
  })
}));