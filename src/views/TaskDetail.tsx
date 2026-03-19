'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Trash2, Plus, X, CheckSquare, Square } from 'lucide-react';
import { useState } from 'react';
import { useTaskStore, useProjectStore, useTeamStore } from '../store';
import { Avatar } from '../components/ui/Avatar';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { TASK_STATUS_LABELS, PRIORITY_LABELS } from '../constants';
import { STATUS_COLORS, PRIORITY_COLORS } from '../theme';
import { formatDate } from '../utils/formatters';
import { usePermissions } from '../hooks/usePermissions';
import type { TaskStatus } from '../models';

export default function TaskDetail() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const task = useTaskStore((s) => s.tasks.find((t) => t.id === id));
  const project = useProjectStore((s) => s.projects.find((p) => p.id === task?.projectId));
  const assignee = useTeamStore((s) => s.members.find((m) => m.id === task?.assigneeId));
  const moveTask = useTaskStore((s) => s.moveTask);
  const removeTask = useTaskStore((s) => s.removeTask);
  const addMilestone = useTaskStore((s) => s.addMilestone);
  const toggleMilestone = useTaskStore((s) => s.toggleMilestone);
  const removeMilestone = useTaskStore((s) => s.removeMilestone);
  const { isAdmin, member: myMember } = usePermissions();
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [msInput, setMsInput] = useState('');

  if (!task) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400">작업을 찾을 수 없습니다</p>
        <Link href="/tasks" className="text-teal-400 text-sm mt-2 inline-block hover:underline">작업 목록으로</Link>
      </div>
    );
  }

  const isAssignee = myMember?.id === task.assigneeId;
  const canChangeStatus = isAdmin || isAssignee;
  const canEditMilestones = isAdmin || isAssignee;

  const milestones = task.milestones ?? [];
  const msDone = milestones.filter((m) => m.completed).length;
  const msTotal = milestones.length;
  const msPct = msTotal > 0 ? Math.round((msDone / msTotal) * 100) : 0;

  const handleDelete = () => {
    removeTask(task.id);
    router.push('/tasks');
  };

  const handleAddMilestone = () => {
    if (!msInput.trim()) return;
    addMilestone(task.id, msInput.trim());
    setMsInput('');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-base text-slate-400 hover:text-teal-400 mb-4 transition-colors">
        <ArrowLeft size={16} /> 뒤로
      </button>

      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: PRIORITY_COLORS[task.priority] + '15', color: PRIORITY_COLORS[task.priority] }}>
                {PRIORITY_LABELS[task.priority]}
              </span>
              <span className="text-sm px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: STATUS_COLORS[task.status] + '15', color: STATUS_COLORS[task.status] }}>
                {TASK_STATUS_LABELS[task.status]}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">{task.title}</h2>
          </div>
          {isAdmin && (
            <button
              onClick={() => setDeleteDialog(true)}
              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors self-start shrink-0"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>

        {task.description && (
          <p className="text-base text-slate-300 mt-3">{task.description}</p>
        )}

        <div className="mt-6 space-y-3">
          {project && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400 w-16 shrink-0">프로젝트</span>
              <Link href={`/projects/${project.id}`} className="flex items-center gap-1.5 hover:text-teal-400 transition-colors">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: project.color }} />
                <span className="text-base font-medium text-white">{project.title}</span>
              </Link>
            </div>
          )}
          {assignee && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400 w-16 shrink-0">담당자</span>
              <div className="flex items-center gap-1.5">
                <Avatar name={assignee.name} color={assignee.avatarColor} avatarUrl={assignee.avatarUrl} size={20} />
                <span className="text-base text-white">{assignee.name}</span>
              </div>
            </div>
          )}
          {task.dueDate && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400 w-16 shrink-0">마감일</span>
              <div className="flex items-center gap-1.5 text-slate-200">
                <Calendar size={14} />
                <span className="text-base">{formatDate(task.dueDate)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Milestones */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-200">마일스톤</p>
            {msTotal > 0 && (
              <span className="text-xs font-semibold text-teal-400">{msPct}% ({msDone}/{msTotal})</span>
            )}
          </div>
          {msTotal > 0 && (
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
              <div className="h-full rounded-full bg-teal-500 transition-all animate-bar" style={{ width: `${msPct}%` }} />
            </div>
          )}
          <div className="space-y-2">
            {milestones.map((ms) => (
              <div key={ms.id} className="flex items-start gap-3 py-1.5 group">
                <button
                  onClick={() => canEditMilestones && toggleMilestone(task.id, ms.id)}
                  disabled={!canEditMilestones}
                  className="shrink-0 text-teal-400 disabled:text-slate-600 transition-colors p-1"
                >
                  {ms.completed ? <CheckSquare size={22} /> : <Square size={22} />}
                </button>
                <span className={`text-base flex-1 ${ms.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                  {ms.title}
                </span>
                {canEditMilestones && (
                  <button
                    onClick={() => removeMilestone(task.id, ms.id)}
                    className="p-1.5 text-slate-600 hover:text-red-400 lg:opacity-0 lg:group-hover:opacity-100 transition-all"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {canEditMilestones && (
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                value={msInput}
                onChange={(e) => setMsInput(e.target.value)}
                placeholder="마일스톤 추가..."
                className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-base text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddMilestone(); }}
              />
              <button
                onClick={handleAddMilestone}
                disabled={!msInput.trim()}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium rounded-xl transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Move task */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <p className="text-sm text-slate-400 mb-2">상태 변경</p>
          {canChangeStatus ? (
            <div className="flex gap-2">
              {(['todo', 'in_progress', 'done'] as TaskStatus[]).map((s) => (
                <button
                  key={s}
                  disabled={task.status === s}
                  onClick={() => moveTask(task.id, s)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    task.status === s
                      ? 'text-white'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                  style={task.status === s ? { backgroundColor: STATUS_COLORS[s] } : undefined}
                >
                  {TASK_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">담당자만 상태를 변경할 수 있습니다</p>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialog}
        title="작업 삭제"
        message={`'${task.title}' 작업을 삭제하시겠습니까?`}
        confirmLabel="삭제"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog(false)}
      />
    </div>
  );
}
