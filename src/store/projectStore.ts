import { create } from 'zustand';
import { loadFromStorage, saveToStorage } from './storage';
import { useActivityStore } from './activityStore';
import { useSettingsStore } from './settingsStore';
import type { Project } from '../models';
import { generateId } from '../utils/formatters';

interface ProjectStore {
  projects: Project[];
  addProject: (title: string, description: string, color: string, memberIds: string[]) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
  setProjects: (projects: Project[]) => void;
}

const KEY = 'teamdash-projects';

export const useProjectStore = create<ProjectStore>()((set, get) => ({
  projects: loadFromStorage<Project[]>(KEY, 'projects', []),
  addProject: (title, description, color, memberIds) => {
    const now = new Date().toISOString();
    const project: Project = { id: generateId(), title, description, status: 'active', color, memberIds, createdAt: now, updatedAt: now };
    set((s) => ({ projects: [...s.projects, project] }));
    const actorId = useSettingsStore.getState().currentUserId;
    if (actorId) useActivityStore.getState().addActivity({ type: 'project_created', actorId, targetId: project.id, targetTitle: project.title });
    return project;
  },
  updateProject: (id, updates) => set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)) })),
  removeProject: (id) => {
    const project = get().projects.find((p) => p.id === id);
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
    if (project) {
      const actorId = useSettingsStore.getState().currentUserId;
      if (actorId) useActivityStore.getState().addActivity({ type: 'project_deleted', actorId, targetId: id, targetTitle: project.title });
    }
  },
  setProjects: (projects) => set({ projects }),
}));

useProjectStore.subscribe((s) => saveToStorage(KEY, s.projects));
