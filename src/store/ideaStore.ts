import { create } from 'zustand';
import { loadFromStorage, saveToStorage } from './storage';
import type { Idea, IdeaStatus, IdeaAttachment, IdeaComment, VoteType } from '../models';
import { generateId } from '../utils/formatters';

interface IdeaStore {
  ideas: Idea[];
  addIdea: (params: { title: string; description: string; authorId: string; attachments?: IdeaAttachment[] }) => void;
  updateIdea: (id: string, params: { title?: string; description?: string; attachments?: IdeaAttachment[] }) => void;
  updateStatus: (id: string, status: IdeaStatus) => void;
  setVote: (ideaId: string, memberId: string, vote: VoteType | null) => void;
  removeIdea: (id: string) => void;
  addComment: (ideaId: string, authorId: string, content: string) => void;
  updateComment: (ideaId: string, commentId: string, content: string) => void;
  removeComment: (ideaId: string, commentId: string) => void;
  setIdeas: (ideas: Idea[]) => void;
}

const KEY = 'teamdash-ideas';

function migrateIdea(raw: Idea): Idea {
  return {
    ...raw,
    votes: raw.votes && !Array.isArray(raw.votes) ? raw.votes : { agree: [], disagree: [], neutral: [] },
    attachments: raw.attachments ?? [],
    comments: raw.comments ?? [],
  };
}

export const useIdeaStore = create<IdeaStore>()((set) => ({
  ideas: loadFromStorage<Idea[]>(KEY, 'ideas', []).map(migrateIdea),
  addIdea: (params) => {
    const idea: Idea = {
      id: generateId(),
      title: params.title,
      description: params.description,
      authorId: params.authorId,
      status: 'open',
      votes: { agree: [], disagree: [], neutral: [] },
      attachments: params.attachments ?? [],
      comments: [],
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ ideas: [idea, ...s.ideas] }));
  },
  updateIdea: (id, params) =>
    set((s) => ({
      ideas: s.ideas.map((i) => (i.id === id ? { ...i, ...params } : i)),
    })),
  updateStatus: (id, status) =>
    set((s) => ({ ideas: s.ideas.map((i) => (i.id === id ? { ...i, status } : i)) })),
  setVote: (ideaId, memberId, vote) =>
    set((s) => ({
      ideas: s.ideas.map((i) => {
        if (i.id !== ideaId) return i;
        const votes = {
          agree: i.votes.agree.filter((v) => v !== memberId),
          disagree: i.votes.disagree.filter((v) => v !== memberId),
          neutral: i.votes.neutral.filter((v) => v !== memberId),
        };
        if (vote) votes[vote].push(memberId);
        return { ...i, votes };
      }),
    })),
  removeIdea: (id) => set((s) => ({ ideas: s.ideas.filter((i) => i.id !== id) })),
  addComment: (ideaId, authorId, content) =>
    set((s) => ({
      ideas: s.ideas.map((i) =>
        i.id === ideaId
          ? { ...i, comments: [...i.comments, { id: generateId(), authorId, content, createdAt: new Date().toISOString() }] }
          : i
      ),
    })),
  updateComment: (ideaId, commentId, content) =>
    set((s) => ({
      ideas: s.ideas.map((i) =>
        i.id === ideaId
          ? { ...i, comments: i.comments.map((c) => (c.id === commentId ? { ...c, content } : c)) }
          : i
      ),
    })),
  removeComment: (ideaId, commentId) =>
    set((s) => ({
      ideas: s.ideas.map((i) =>
        i.id === ideaId
          ? { ...i, comments: i.comments.filter((c) => c.id !== commentId) }
          : i
      ),
    })),
  setIdeas: (ideas) => set({ ideas }),
}));

useIdeaStore.subscribe((s) => saveToStorage(KEY, s.ideas));
