import { create } from 'zustand';
import { loadFromStorage, saveToStorage } from './storage';
import { useActivityStore } from './activityStore';
import { useSettingsStore } from './settingsStore';
import type { TeamMember, TeamRole } from '../models';
import { generateId } from '../utils/formatters';

interface TeamStore {
  members: TeamMember[];
  addMember: (name: string, email: string, role: TeamRole, avatarColor: string) => TeamMember;
  updateMember: (id: string, updates: Partial<TeamMember>) => void;
  removeMember: (id: string) => void;
  setMembers: (members: TeamMember[]) => void;
}

const KEY = 'teamdash-team';

export const useTeamStore = create<TeamStore>()((set, get) => ({
  members: loadFromStorage<TeamMember[]>(KEY, 'members', []),
  addMember: (name, email, role, avatarColor) => {
    const member: TeamMember = { id: generateId(), name, email, role, avatarColor, createdAt: new Date().toISOString() };
    set((s) => ({ members: [...s.members, member] }));
    const actorId = useSettingsStore.getState().currentUserId;
    if (actorId) useActivityStore.getState().addActivity({ type: 'member_added', actorId, targetId: member.id, targetTitle: member.name });
    return member;
  },
  updateMember: (id, updates) => set((s) => ({ members: s.members.map((m) => (m.id === id ? { ...m, ...updates } : m)) })),
  removeMember: (id) => set((s) => ({ members: s.members.filter((m) => m.id !== id) })),
  setMembers: (members) => set({ members }),
}));

useTeamStore.subscribe((s) => saveToStorage(KEY, s.members));
