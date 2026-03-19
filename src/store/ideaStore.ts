import { create } from 'zustand';
import { loadFromStorage, saveToStorage } from './storage';
import type { Idea, IdeaStatus } from '../models';
import { generateId } from '../utils/formatters';

interface IdeaStore {
  ideas: Idea[];
  addIdea: (params: { title: string; description: string; authorId: string }) => void;
  updateStatus: (id: string, status: IdeaStatus) => void;
  toggleVote: (id: string, memberId: string) => void;
  removeIdea: (id: string) => void;
  setIdeas: (ideas: Idea[]) => void;
}

const KEY = 'teamdash-ideas';

export const useIdeaStore = create<IdeaStore>()((set) => ({
  ideas: loadFromStorage<Idea[]>(KEY, 'ideas', []),
  addIdea: (params) => {
    const idea: Idea = {
      id: generateId(),
      ...params,
      status: 'open',
      votes: [],
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ ideas: [idea, ...s.ideas] }));
  },
  updateStatus: (id, status) =>
    set((s) => ({ ideas: s.ideas.map((i) => (i.id === id ? { ...i, status } : i)) })),
  toggleVote: (id, memberId) =>
    set((s) => ({
      ideas: s.ideas.map((i) =>
        i.id === id
          ? { ...i, votes: i.votes.includes(memberId) ? i.votes.filter((v) => v !== memberId) : [...i.votes, memberId] }
          : i
      ),
    })),
  removeIdea: (id) => set((s) => ({ ideas: s.ideas.filter((i) => i.id !== id) })),
  setIdeas: (ideas) => set({ ideas }),
}));

useIdeaStore.subscribe((s) => saveToStorage(KEY, s.ideas));
