'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Trash2, Pencil } from 'lucide-react';
import { useProjectStore, useTaskStore, useTeamStore } from '../store';
import { Avatar } from '../components/ui/Avatar';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { TASK_STATUS_LABELS, PRIORITY_LABELS } from '../constants';
import { STATUS_COLORS, PRIORITY_COLORS } from '../theme';
import { formatDate, getTaskProgress, getProjectProgress } from '../utils/formatters';
import { usePermissions } from '../hooks/usePermissions';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import type { TaskStatus } from '../models';

export default function ProjectDetail() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const project = useProjectStore((s) => s.projects.find((p) => p.id === id));
  const removeProject = useProjectStore((s) => s.removeProject);
  const updateProject = useProjectStore((s) => s.updateProject);
  const allTasks = useTaskStore((s) => s.tasks);
  const tasks = allTasks.filter((t) => t.projectId === id).sort((a, b) => a.order - b.order);
  const allMembers = useTeamStore((s) => s.members);
  const members = allMembers.filter((m) => project?.memberIds.includes(m.id));
  const moveTask = useTaskStore((s) => s.moveTask);
  const { isAdmin, isOwner } = usePermissions();
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [titleVal, setTitleVal] = useState('');
  const [descVal, setDescVal] = useState('');
  const canDelete = isAdmin || isOwner;

  if (!project) {
    return (
      <div className="text-center py-16">
        <p className="text-td-text-muted">프로젝트를 찾을 수 없습니다</p>
        <Link href="/projects" className="text-teal-400 text-sm mt-2 inline-block hover:underline">프로젝트 목록으로</Link>
      </div>
    );
  }

  const { pct, done, total } = getProjectProgress(tasks);

  return (
    <div>
      <Link href="/projects" className="inline-flex items-center gap-1.5 text-base text-td-text-muted hover:text-teal-400 mb-4 transition-colors">
        <ArrowLeft size={16} /> 프로젝트 목록으로
      </Link>

      <div className="h-1.5 rounded-t-2xl" style={{ backgroundColor: project.color }} />
      <div className="bg-td-card backdrop-blur-xl rounded-b-2xl border border-t-0 border-td-border p-4 sm:p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {editingTitle ? (
              <input
                autoFocus
                value={titleVal}
                onChange={(e) => setTitleVal(e.target.value)}
                onBlur={() => { if (titleVal.trim()) updateProject(project.id, { title: titleVal.trim() }); setEditingTitle(false); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { if (titleVal.trim()) updateProject(project.id, { title: titleVal.trim() }); setEditingTitle(false); } if (e.key === 'Escape') setEditingTitle(false); }}
                className="w-full text-xl sm:text-2xl font-bold text-td-text bg-transparent border-b-2 border-teal-500 focus:outline-none"
              />
            ) : (
              <h2
                onClick={() => { setTitleVal(project.title); setEditingTitle(true); }}
                className="text-xl sm:text-2xl font-bold text-td-text cursor-pointer hover:text-teal-300 transition-colors group"
              >
                {project.title} <Pencil size={14} className="inline ml-1 text-td-text-faint opacity-0 group-hover:opacity-100 transition-opacity" />
              </h2>
            )}
          </div>
          {canDelete && (
            <button
              onClick={() => setDeleteDialog(true)}
              className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors shrink-0"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
        {editingDesc ? (
          <textarea
            autoFocus
            value={descVal}
            onChange={(e) => setDescVal(e.target.value)}
            onBlur={() => { updateProject(project.id, { description: descVal }); setEditingDesc(false); }}
            onKeyDown={(e) => { if (e.key === 'Escape') setEditingDesc(false); }}
            rows={3}
            className="w-full mt-2 text-base text-td-text-muted bg-transparent border border-td-border rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-teal-500/50 resize-none"
          />
        ) : (
          <p
            onClick={() => { setDescVal(project.description); setEditingDesc(true); }}
            className="text-base text-td-text-muted mt-2 cursor-pointer hover:text-td-text transition-colors group min-h-[24px]"
          >
            {project.description || '설명을 추가하세요...'} <Pencil size={12} className="inline ml-1 text-td-text-faint opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        )}

        {/* Progress */}
        <div className="mt-5">
          <div className="flex justify-between mb-2">
            <span className="text-base font-medium text-td-text-bright">진행률</span>
            <span className="text-lg font-semibold text-teal-400"><AnimatedNumber value={pct} suffix="%" /></span>
          </div>
          <div className="h-2.5 bg-slate-200 dark:bg-td-input rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all animate-bar" style={{ width: `${pct}%`, backgroundColor: project.color }} />
          </div>
          <p className="text-sm text-td-text-muted mt-1">{done}/{total} 작업 완료</p>
        </div>

        {/* Members */}
        <div className="mt-5">
          <h4 className="text-sm font-semibold text-td-text-bright mb-2">멤버</h4>
          <div className="flex gap-4 flex-wrap">
            {members.map((m) => (
              <div key={m.id} className="flex flex-col items-center gap-1">
                <Avatar name={m.name} color={m.avatarColor} avatarUrl={m.avatarUrl} size={32} />
                <span className="text-sm text-td-text-muted">{m.name.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status chips */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {(['todo', 'in_progress', 'done'] as const).map((status) => {
            const count = tasks.filter((t) => t.status === status).length;
            return (
              <span key={status} className="text-sm px-3 py-1 rounded-full font-medium" style={{ backgroundColor: STATUS_COLORS[status] + '30', color: STATUS_COLORS[status] }}>
                {TASK_STATUS_LABELS[status]}: {count}
              </span>
            );
          })}
        </div>
      </div>

      {/* Tasks */}
      <h3 className="text-lg font-semibold text-td-text mb-3">작업 목록</h3>
      {tasks.length === 0 ? (
        <p className="text-base text-td-text-muted text-center py-8">이 프로젝트에 아직 작업이 없습니다</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const assignee = allMembers.find((m) => m.id === task.assigneeId);
            const taskPct = getTaskProgress(task);
            return (
              <Link href={`/tasks/${task.id}`} key={task.id} className="block bg-td-card backdrop-blur-xl rounded-xl p-3 sm:p-4 border border-td-border hover:bg-td-hover-strong transition-all">
                {/* Title + Progress */}
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-td-text truncate hover:text-teal-300 transition-colors">{task.title}</p>
                  <span className="text-sm font-semibold text-teal-400 shrink-0 ml-2">{taskPct}%</span>
                </div>
                <div className="h-1.5 bg-slate-200 dark:bg-td-input rounded-full overflow-hidden mb-3">
                  <div className="h-full rounded-full transition-all animate-bar" style={{ width: `${taskPct}%`, backgroundColor: project.color }} />
                </div>
                {/* Badges row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: STATUS_COLORS[task.status] + '35', color: STATUS_COLORS[task.status] }}>
                    {TASK_STATUS_LABELS[task.status]}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: PRIORITY_COLORS[task.priority] + '35', color: PRIORITY_COLORS[task.priority] }}>
                    {PRIORITY_LABELS[task.priority]}
                  </span>
                  {assignee && (
                    <div className="flex items-center gap-1">
                      <Avatar name={assignee.name} color={assignee.avatarColor} avatarUrl={assignee.avatarUrl} size={16} />
                      <span className="text-xs text-td-text-secondary">{assignee.name.split(' ')[0]}</span>
                    </div>
                  )}
                  {task.dueDate && (
                    <div className="flex items-center gap-1 text-td-text-muted">
                      <Calendar size={11} />
                      <span className="text-xs">{formatDate(task.dueDate)}</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={deleteDialog}
        title="프로젝트 삭제"
        message={`"${project.title}" 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        onConfirm={() => { removeProject(project.id); router.push('/projects'); }}
        onCancel={() => setDeleteDialog(false)}
      />
    </div>
  );
}
