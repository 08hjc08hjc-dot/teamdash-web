import { create } from 'zustand';
import { loadFromStorage, saveToStorage } from './storage';

export interface GoogleUser {
  name: string;
  email: string;
  picture: string;
}

interface AuthStore {
  user: GoogleUser | null;
  login: (user: GoogleUser) => void;
  logout: () => void;
  updateName: (name: string) => void;
}

const KEY = 'teamdash-auth';

export const useAuthStore = create<AuthStore>()((set) => ({
  user: loadFromStorage<GoogleUser | null>(KEY, 'user', null),
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
  updateName: (name) => set((s) => (s.user ? { user: { ...s.user, name } } : {})),
}));

useAuthStore.subscribe((s) => {
  saveToStorage(KEY, { user: s.user });
});
