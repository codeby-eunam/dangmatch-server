import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { School } from '@/types';

export interface User {
  uid: string;
  nickname: string;
  email?: string;
  photoURL?: string;
  school?: School; // 1회 설정, 이후 locked
}

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setSchool: (school: School) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      setSchool: (school) =>
        set((state) => ({
          user: state.user ? { ...state.user, school } : null,
        })),
      logout: () => set({ user: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
