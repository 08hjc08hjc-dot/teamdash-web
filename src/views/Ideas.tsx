'use client';

import { useState } from 'react';
import { Lightbulb, Plus, ThumbsUp, Check, X, Trash2 } from 'lucide-react';
import { useIdeaStore, useTeamStore } from '../store';
import { usePermissions } from '../hooks/usePermissions';
import { Avatar } from '../components/ui/Avatar';
import { formatRelativeDate } from '../utils/formatters';
import type { IdeaStatus } from '../models';

const STATUS_LABELS: Record<IdeaStatus, string> = {
  open: '검토중',
  accepted: '채택',
  rejected: '보류',
};

const STATUS_COLORS: Record<IdeaStatus, string> = {
  open: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/20',
  accepted: 'bg-teal-500/15 text-teal-300 border-teal-500/20',
  rejected: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
};

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'open', label: '검토중' },
  { value: 'accepted', label: '채택' },
  { value: 'rejected', label: '보류' },
];

export default function Ideas() {
  const ideas = useIdeaStore((s) => s.ideas);
  const addIdea = useIdeaStore((s) => s.addIdea);
  const toggleVote = useIdeaStore((s) => s.toggleVote);
  const updateStatus = useIdeaStore((s) => s.updateStatus);
  const removeIdea = useIdeaStore((s) => s.removeIdea);
  const members = useTeamStore((s) => s.members);
  const { isOwner, isAdmin, member: myMember } = usePermissions();

  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const filtered = ideas.filter((idea) => filter === 'all' || idea.status === filter);

  const handleSubmit = () => {
    if (!title.trim() || !myMember) return;
    addIdea({ title: title.trim(), description: description.trim(), authorId: myMember.id });
    setTitle('');
    setDescription('');
    setShowForm(false);
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">아이디어 건의</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-xl text-sm font-medium text-white transition-colors"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? '취소' : '건의하기'}
        </button>
      </div>

      {/* New idea form */}
      {showForm && (
        <div className="mb-6 p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl space-y-3">
          <input
            type="text"
            placeholder="아이디어 제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSubmit(); }}
          />
          <textarea
            placeholder="상세 설명 (선택)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50 resize-none"
          />
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="w-full py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-medium text-white transition-colors"
          >
            등록
          </button>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              filter === opt.value
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/20'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Ideas list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Lightbulb size={40} className="mx-auto text-slate-600 mb-3" />
          <p className="text-sm text-slate-400">
            {filter === 'all' ? '아직 건의된 아이디어가 없습니다' : '해당 상태의 아이디어가 없습니다'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((idea) => {
            const author = members.find((m) => m.id === idea.authorId);
            const hasVoted = myMember ? idea.votes.includes(myMember.id) : false;
            return (
              <div key={idea.id} className="p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:bg-white/[0.07] transition-all">
                <div className="flex items-start gap-3">
                  {/* Vote button */}
                  <button
                    onClick={() => myMember && toggleVote(idea.id, myMember.id)}
                    className={`flex flex-col items-center gap-0.5 pt-0.5 shrink-0 transition-colors ${
                      hasVoted ? 'text-teal-400' : 'text-slate-500 hover:text-teal-400'
                    }`}
                  >
                    <ThumbsUp size={18} fill={hasVoted ? 'currentColor' : 'none'} />
                    <span className="text-xs font-medium">{idea.votes.length}</span>
                  </button>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-white">{idea.title}</h3>
                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded-md border ${STATUS_COLORS[idea.status]}`}>
                        {STATUS_LABELS[idea.status]}
                      </span>
                    </div>
                    {idea.description && (
                      <p className="text-xs text-slate-400 mb-2 whitespace-pre-wrap">{idea.description}</p>
                    )}
                    <div className="flex items-center gap-2">
                      {author && <Avatar name={author.name} color={author.avatarColor} avatarUrl={author.avatarUrl} size={18} />}
                      <span className="text-[11px] text-slate-500">{author?.name ?? '알 수 없음'}</span>
                      <span className="text-[11px] text-slate-600">{formatRelativeDate(idea.createdAt)}</span>
                    </div>
                  </div>

                  {/* Admin actions */}
                  {(isOwner || isAdmin) && (
                    <div className="flex items-center gap-1 shrink-0">
                      {idea.status !== 'accepted' && (
                        <button
                          onClick={() => updateStatus(idea.id, 'accepted')}
                          title="채택"
                          className="p-1.5 text-slate-500 hover:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-colors"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      {idea.status !== 'rejected' && (
                        <button
                          onClick={() => updateStatus(idea.id, 'rejected')}
                          title="보류"
                          className="p-1.5 text-slate-500 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors"
                        >
                          <X size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => removeIdea(idea.id)}
                        title="삭제"
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
