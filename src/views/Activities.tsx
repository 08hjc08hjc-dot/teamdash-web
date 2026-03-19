'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, ArrowRight, CheckCircle2, FolderPlus, UserPlus, MessageSquarePlus, FolderKanban, ClipboardList, Lightbulb, Vote, MessageCircle } from 'lucide-react';
import { useActivityStore, useTeamStore } from '../store';
import { Avatar } from '../components/ui/Avatar';
import { formatRelativeDate } from '../utils/formatters';
import type { ActivityType } from '../models';

const ACTIVITY_ICONS: Record<ActivityType, typeof Plus> = {
  task_created: Plus,
  task_moved: ArrowRight,
  task_completed: CheckCircle2,
  project_created: FolderPlus,
  member_added: UserPlus,
  comment_added: MessageSquarePlus,
  milestone_added: Plus,
  milestone_toggled: CheckCircle2,
  task_deleted: ClipboardList,
  project_deleted: FolderKanban,
  idea_created: Lightbulb,
  idea_voted: Vote,
  idea_comment: MessageCircle,
};
const ACTIVITY_LABELS: Record<ActivityType, string> = {
  task_created: '작업 생성',
  task_moved: '작업 이동',
  task_completed: '작업 완료',
  project_created: '프로젝트 생성',
  member_added: '멤버 추가',
  comment_added: '댓글 작성',
  milestone_added: '마일스톤 추가',
  milestone_toggled: '마일스톤 체크',
  task_deleted: '작업 삭제',
  project_deleted: '프로젝트 삭제',
  idea_created: '아이디어 건의',
  idea_voted: '아이디어 투표',
  idea_comment: '아이디어 댓글',
};

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'task', label: '작업' },
  { value: 'project', label: '프로젝트' },
  { value: 'member', label: '멤버' },
  { value: 'milestone', label: '마일스톤' },
  { value: 'idea', label: '아이디어' },
];

export default function Activities() {
  const activities = useActivityStore((s) => s.activities);
  const members = useTeamStore((s) => s.members);
  const [filter, setFilter] = useState('all');

  const filtered = activities.filter((act) => {
    if (filter === 'all') return true;
    if (filter === 'task') return act.type.startsWith('task_');
    if (filter === 'project') return act.type.startsWith('project_');
    if (filter === 'member') return act.type === 'member_added';
    if (filter === 'milestone') return act.type.startsWith('milestone_');
    if (filter === 'idea') return act.type.startsWith('idea_');
    return true;
  });

  return (
    <div>
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-teal-400 mb-4 transition-colors">
        <ArrowLeft size={16} /> 대시보드로
      </Link>

      <h2 className="text-2xl font-bold text-white mb-4">활동 내역</h2>

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

      {/* Activity list */}
      {filtered.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-12">활동 내역이 없습니다</p>
      ) : (
        <div className="space-y-1">
          {filtered.map((act) => {
            const actor = members.find((m) => m.id === act.actorId);
            const Icon = ACTIVITY_ICONS[act.type];
            return (
              <div key={act.id} className="flex items-start gap-3 py-3 px-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl hover:bg-white/8 transition-all">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={14} className="text-teal-400" />
                </div>
                {actor && <Avatar name={actor.name} color={actor.avatarColor} avatarUrl={actor.avatarUrl} size={32} />}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-300">
                    <span className="font-semibold text-white">{actor?.name ?? '알 수 없음'}</span>{' '}
                    {ACTIVITY_LABELS[act.type]}{' '}
                    <span className="font-semibold text-white">{act.targetTitle}</span>
                    {act.metadata?.from && (
                      <span className="text-slate-400"> ({act.metadata.from} → {act.metadata.to})</span>
                    )}
                    {act.metadata?.milestone && !act.metadata?.from && (
                      <span className="text-slate-400"> — {act.metadata.milestone}{act.metadata.status ? ` (${act.metadata.status})` : ''}</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{formatRelativeDate(act.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
