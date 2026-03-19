'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Trash2 } from 'lucide-react';
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
  const allTasks = useTaskStore((s) => s.tasks);
  const tasks = allTasks.filter((t) => t.projectId === id).sort((a, b) => a.order - b.order);
  const allMembers = useTeamStore((s) => s.members);
  const members = allMembers.filter((m) => project?.memberIds.includes(m.id));
  const moveTask = useTaskStore((s) => s.moveTask);
  const { isAdmin, isOwner } = usePermissions();
  const [deleteDialog, setDeleteDialog] = useState(false);
  const canDelete = isAdmin || isOwner;

  if (!project) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400">프로젝트를 찾을 수 없습니다</p>
        <Link href="/projects" className="text-teal-400 text-sm mt-2 inline-block hover:underline">프로젝트 목록으로</Link>
      </div>
    );
  }

  const { pct, done, total } = getProjectProgress(tasks);

  return (
    <div>
      <Link href="/projects" className="inline-flex items-center gap-1.5 text-base text-slate-400 hover:text-teal-400 mb-4 transition-colors">
        <ArrowLeft size={16} /> 프로젝트 목록으로
      </Link>

      <div className="h-1.5 rounded-t-2xl" style={{ backgroundColor: project.color }} />
      <div className="bg-white/5 backdrop-blur-xl rounded-b-2xl border border-t-0 border-white/10 p-4 sm:p-6 mb-6">
        <div className="flex items-start justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-white">{project.title}</h2>
          {canDelete && (
            <button
              onClick={() => setDeleteDialog(true)}
              className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors shrink-0"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
        <p className="text-base text-slate-400 mt-2">{project.description}</p>

        {/* Progress */}
        <div className="mt-5">
          <div className="flex justify-between mb-2">
            <span className="text-base font-medium text-slate-200">진행률</span>
            <span className="text-lg font-semibold text-teal-400"><AnimatedNumber value={pct} suffix="%" /></span>
          </div>
          <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all animate-bar" style={{ width: `${pct}%`, backgroundColor: project.color }} />
          </div>
          <p className="text-sm text-slate-400 mt-1">{done}/{total} 작업 완료</p>
        </div>

        {/* Members */}
        <div className="mt-5">
          <h4 className="text-sm font-semibold text-slate-200 mb-2">멤버</h4>
          <div className="flex gap-4 flex-wrap">
            {members.map((m) => (
              <div key={m.id} className="flex flex-col items-center gap-1">
                <Avatar name={m.name} color={m.avatarColor} avatarUrl={m.avatarUrl} size={32} />
                <span className="text-sm text-slate-400">{m.name.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status chips */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {(['todo', 'in_progress', 'done'] as const).map((status) => {
            const count = tasks.filter((t) => t.status === status).length;
            return (
              <span key={status} className="text-sm px-3 py-1 rounded-full font-medium" style={{ backgroundColor: STATUS_COLORS[status] + '15', color: STATUS_COLORS[status] }}>
                {TASK_STATUS_LABELS[status]}: {count}
              </span>
            );
          })}
        </div>
      </div>

      {/* Tasks */}
      <h3 className="text-lg font-semibold text-white mb-3">작업 목록</h3>
      {tasks.length === 0 ? (
        <p className="text-base text-slate-400 text-center py-8">이 프로젝트에 아직 작업이 없습니다</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const assignee = allMembers.find((m) => m.id === task.assigneeId);
            const taskPct = getTaskProgress(task);
            return (
              <Link href={`/tasks/${task.id}`} key={task.id} className="block bg-white/5 backdrop-blur-xl rounded-xl p-3 sm:p-4 border border-white/10 hover:bg-white/10 transition-all">
                {/* Title + Progress */}
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-white truncate hover:text-teal-300 transition-colors">{task.title}</p>
                  <span className="text-sm font-semibold text-teal-400 shrink-0 ml-2">{taskPct}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
                  <div className="h-full rounded-full transition-all animate-bar" style={{ width: `${taskPct}%`, backgroundColor: project.color }} />
                </div>
                {/* Badges row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: STATUS_COLORS[task.status] + '20', color: STATUS_COLORS[task.status] }}>
                    {TASK_STATUS_LABELS[task.status]}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: PRIORITY_COLORS[task.priority] + '20', color: PRIORITY_COLORS[task.priority] }}>
                    {PRIORITY_LABELS[task.priority]}
                  </span>
                  {assignee && (
                    <div className="flex items-center gap-1">
                      <Avatar name={assignee.name} color={assignee.avatarColor} avatarUrl={assignee.avatarUrl} size={16} />
                      <span className="text-xs text-slate-300">{assignee.name.split(' ')[0]}</span>
                    </div>
                  )}
                  {task.dueDate && (
                    <div className="flex items-center gap-1 text-slate-400">
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
