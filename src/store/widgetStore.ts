import { create } from 'zustand';
import { loadFromStorage, saveToStorage } from './storage';
import type { DashboardWidget } from '../models';

const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'w1', type: 'stats', order: 0, visible: true },
  { id: 'w2', type: 'my_tasks', order: 1, visible: true },
  { id: 'w3', type: 'project_progress', order: 2, visible: true },
  { id: 'w4', type: 'activity', order: 3, visible: true },
  { id: 'w5', type: 'team_overview', order: 4, visible: true },
];

interface WidgetStore {
  widgets: DashboardWidget[];
  toggleWidget: (id: string) => void;
  resetWidgets: () => void;
}

const KEY = 'teamdash-widgets';

export const useWidgetStore = create<WidgetStore>()((set) => ({
  widgets: loadFromStorage<DashboardWidget[]>(KEY, 'widgets', DEFAULT_WIDGETS),
  toggleWidget: (id) => set((s) => ({
    widgets: s.widgets.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)),
  })),
  resetWidgets: () => set({ widgets: DEFAULT_WIDGETS }),
}));

useWidgetStore.subscribe((s) => saveToStorage(KEY, s.widgets));
