import { create } from 'zustand';
import { loadFromStorage, saveToStorage } from './storage';
import type { AppSettings } from '../models';

interface SettingsStore extends AppSettings {
  setThemeMode: (mode: AppSettings['themeMode']) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setCurrentUserId: (id: string) => void;
}

const KEY = 'teamdash-settings';

export const useSettingsStore = create<SettingsStore>()((set) => ({
  themeMode: loadFromStorage<AppSettings['themeMode']>(KEY, 'themeMode', 'dark'),
  notificationsEnabled: loadFromStorage<boolean>(KEY, 'notificationsEnabled', true),
  currentUserId: loadFromStorage<string>(KEY, 'currentUserId', ''),
  setThemeMode: (themeMode) => set({ themeMode }),
  setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
  setCurrentUserId: (currentUserId) => set({ currentUserId }),
}));

useSettingsStore.subscribe((s) => {
  saveToStorage(KEY, { themeMode: s.themeMode, notificationsEnabled: s.notificationsEnabled, currentUserId: s.currentUserId });
});
