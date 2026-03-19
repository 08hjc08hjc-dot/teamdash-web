import { create } from 'zustand';
import { loadFromStorage, saveToStorage } from './storage';
import type { Activity, ActivityType } from '../models';
import { generateId } from '../utils/formatters';

interface ActivityStore {
  activities: Activity[];
  addActivity: (params: {
    type: ActivityType;
    actorId: string;
    targetId: string;
    targetTitle: string;
    metadata?: Record<string, string>;
  }) => void;
  setActivities: (activities: Activity[]) => void;
  clearActivities: () => void;
}

const KEY = 'teamdash-activities';

export const useActivityStore = create<ActivityStore>()((set) => ({
  activities: loadFromStorage<Activity[]>(KEY, 'activities', []),
  addActivity: (params) => {
    const activity: Activity = { id: generateId(), ...params, createdAt: new Date().toISOString() };
    set((s) => ({ activities: [activity, ...s.activities].slice(0, 100) }));
  },
  setActivities: (activities) => set({ activities }),
  clearActivities: () => set({ activities: [] }),
}));

useActivityStore.subscribe((s) => saveToStorage(KEY, s.activities));
