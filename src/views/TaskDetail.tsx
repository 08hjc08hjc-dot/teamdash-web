'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Trash2, Plus, X, CheckSquare, Square, Pencil, Check } from 'lucide-react';
import { useState } from 'react';
import { useTaskStore, useProjectStore, useTeamStore } from '../store';
import { Avatar } from '../components/ui/Avatar';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { TASK_STATUS_LABELS, PRIORITY_LABELS } from '../constants';
import { STATUS_COLORS, PRIORITY_COLORS } from '../theme';
import { formatDate } from '../utils/formatters';
import { usePermissions } from '../hooks/usePermissions';
import type { TaskStatus, Priority } from '../models';

export default function TaskDetail() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const task = useTaskStore((s) => s.tasks.find((t) => t.id === id));
  const project = useProjectStore((s) => s.projects.find((p) => p.id === task?.projectId));
  const allProjects = useProjectStore((s) => s.projects);
  const activeProjects = allProjects.filter((p) => p.status !== 'archived');
  const allMembers = useTeamStore((s) => s.members);
  const assignees = allMembers.filter((m) => (task?.assigneeIds ?? []).includes(m.id));
  const moveTask = useTaskStore((s) => s.moveTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const removeTask = useTaskStore((s) => s.removeTask);
  const addMilestone = useTaskStore((s) => s.addMilestone);
  const toggleMilestone = useTaskStore((s) => s.toggleMilestone);
  const removeMilestone = useTaskStore((s) => s.removeMilestone);
  const { isAdmin } = usePermissions();
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [msInput, setMsInput] = useState('');

  // Single edit mode toggle
  const [editing, setEditing] = useState(false);
  const [titleVal, setTitleVal] = useState('');
  const [descVal, setDescVal] = useState('');

  if (!task) {
    return (
      <div className="text-center py-16">
        <p className="text-td-text-muted">작업을 찾을 수 없습니다</p>
        <Link href="/tasks" className="text-teal-400 text-sm mt-2 inline-block hover:underline">작업 목록으로</Link>
      </div>
    );
  }

  const milestones = task.milestones ?? [];
  const msDone = milestones.filter((m) => m.completed).length;
  const msTotal = milestones.length;
  const msPct = task.status === 'done' ? 100 : msTotal > 0 ? Math.round((msDone / msTotal) * 100) : 0;

  const handleDelete = () => {
    removeTask(task.id);
    router.push('/tasks');
  };

  const handleAddMilestone = () => {
    if (!msInput.trim()) return;
    addMilestone(task.id, msInput.trim());
    setMsInput('');
  };

  const startEditing = () => {
    setTitleVal(task.title);
    setDescVal(task.description);
    setEditing(true);
  };

  const saveEditing = () => {
    if (titleVal.trim()) updateTask(task.id, { title: titleVal.trim(), description: descVal });
    setEditing(false);
  };

  const statusOptions: { value: TaskStatus; label: string }[] = [
    { value: 'todo', label: '할 일' },
    { value: 'in_progress', label: '진행 중' },
    { value: 'done', label: '완료' },
  ];
  const priorityOptions: Priority[] = ['low', 'medium', 'high', 'urgent'];

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-base text-td-text-secondary hover:text-teal-600 dark:hover:text-teal-400 mb-4 transition-colors">
        <ArrowLeft size={16} /> 뒤로
      </button>

      <div className="bg-td-card backdrop-blur-xl rounded-2xl border border-td-border p-4 sm:p-6">
        {/* Header: badges + action buttons */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm px-2 py-0.5 rounded-full font-medium badge-colored" style={{ backgroundColor: PRIORITY_COLORS[task.priority], '--badge-color': PRIORITY_COLORS[task.priority] } as React.CSSProperties}>
              {PRIORITY_LABELS[task.priority]}
            </span>
            <span className="text-sm px-2 py-0.5 rounded-full font-medium badge-colored" style={{ backgroundColor: STATUS_COLORS[task.status], '--badge-color': STATUS_COLORS[task.status] } as React.CSSProperties}>
              {TASK_STATUS_LABELS[task.status]}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={editing ? saveEditing : startEditing}
              className={`p-2 rounded-lg transition-colors ${editing ? 'text-teal-400 hover:bg-teal-500/10' : 'text-td-text-muted hover:bg-td-hover'}`}
            >
              {editing ? <Check size={18} /> : <Pencil size={18} />}
            </button>
            <button
              onClick={() => setDeleteDialog(true)}
              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {editing ? (
          /* ── Edit mode: NewTask-style form ── */
          <div className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-td-text-bright mb-1">제목</label>
              <input
                autoFocus
                type="text"
                value={titleVal}
                onChange={(e) => setTitleVal(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveEditing(); if (e.key === 'Escape') setEditing(false); }}
                placeholder="작업 제목"
                className="w-full px-4 py-2.5 bg-td-card border border-td-border rounded-xl text-sm text-td-text placeholder:text-td-text-faint focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 backdrop-blur"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-td-text-bright mb-1">설명</label>
              <textarea
                value={descVal}
                onChange={(e) => setDescVal(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') setEditing(false); }}
                rows={3}
                placeholder="작업 설명"
                className="w-full px-4 py-2.5 bg-td-card border border-td-border rounded-xl text-sm text-td-text placeholder:text-td-text-faint focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 backdrop-blur resize-none"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-td-text-bright mb-2">상태</label>
              <div className="flex gap-2">
                {statusOptions.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => moveTask(task.id, s.value)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                      task.status === s.value
                        ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white'
                        : 'bg-td-card text-td-text-muted hover:bg-td-hover-strong hover:text-td-text-bright'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-td-text-bright mb-2">우선순위</label>
              <div className="flex gap-2 flex-wrap">
                {priorityOptions.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => updateTask(task.id, { priority: p })}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                      task.priority === p
                        ? 'text-white'
                        : 'bg-td-card text-td-text-muted hover:bg-td-hover-strong hover:text-td-text-bright'
                    }`}
                    style={task.priority === p ? { backgroundColor: PRIORITY_COLORS[p] } : undefined}
                  >
                    {PRIORITY_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>

            {/* Project */}
            <div>
              <label className="block text-sm font-medium text-td-text-bright mb-1">프로젝트</label>
              <select
                value={task.projectId}
                onChange={(e) => updateTask(task.id, { projectId: e.target.value })}
                className="w-full px-4 py-2.5 border border-td-border rounded-xl text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 backdrop-blur"
                style={{ backgroundColor: 'var(--td-input)', color: 'var(--td-text)' }}
              >
                {activeProjects.map((p) => (
                  <option key={p.id} value={p.id} style={{ backgroundColor: 'var(--td-input)', color: 'var(--td-text)' }}>{p.title}</option>
                ))}
              </select>
            </div>

            {/* Assignees */}
            <div>
              <label className="block text-sm font-medium text-td-text-bright mb-2">담당자 ({(task.assigneeIds ?? []).length}명)</label>
              <div className="flex gap-2 flex-wrap">
                {allMembers.map((m) => {
                  const selected = (task.assigneeIds ?? []).includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        const current = task.assigneeIds ?? [];
                        const next = selected ? current.filter((x) => x !== m.id) : [...current, m.id];
                        updateTask(task.id, { assigneeIds: next });
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                        selected
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/20'
                          : 'bg-td-card text-td-text-muted hover:bg-td-hover-strong hover:text-td-text-bright'
                      }`}
                    >
                      <Avatar name={m.name} color={m.avatarColor} avatarUrl={m.avatarUrl} size={16} />
                      {m.name}
                      {selected && <Check size={14} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dates: 2-column grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-td-text-bright mb-1">작업 시작일</label>
                <input
                  type="date"
                  value={(task.startDate ?? task.createdAt).slice(0, 10)}
                  onChange={(e) => updateTask(task.id, { startDate: e.target.value || null })}
                  className="w-full px-4 py-2.5 bg-td-card border border-td-border rounded-xl text-sm text-td-text focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 backdrop-blur"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-td-text-bright mb-1">마감일</label>
                <input
                  type="date"
                  value={task.dueDate ?? ''}
                  onChange={(e) => updateTask(task.id, { dueDate: e.target.value || null })}
                  className="w-full px-4 py-2.5 bg-td-card border border-td-border rounded-xl text-sm text-td-text focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 backdrop-blur"
                />
                <p className="text-xs text-td-text-faint mt-1">선택 사항</p>
              </div>
            </div>

            {/* Save button */}
            <button
              type="button"
              onClick={saveEditing}
              disabled={!titleVal.trim()}
              className="w-full py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-medium text-sm rounded-xl transition-all"
            >
              저장
            </button>
          </div>
        ) : (
          /* ── View mode ── */
          <>
            <h2 className="text-xl sm:text-2xl font-bold text-td-text">{task.title}</h2>
            {task.description && <p className="text-base text-td-text-secondary mt-3">{task.description}</p>}

            <div className="mt-6 space-y-3">
              {/* Project */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-td-text-muted w-16 shrink-0">프로젝트</span>
                {project ? (
                  <Link href={`/projects/${project.id}`} className="flex items-center gap-1.5 hover:text-teal-400 transition-colors">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: project.color }} />
                    <span className="text-base font-medium text-td-text">{project.title}</span>
                  </Link>
                ) : null}
              </div>

              {/* Assignees */}
              <div className="flex items-start gap-3">
                <span className="text-sm text-td-text-muted w-16 shrink-0 pt-1">담당자</span>
                {assignees.length > 0 ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    {assignees.map((a) => (
                      <div key={a.id} className="flex items-center gap-1.5">
                        <Avatar name={a.name} color={a.avatarColor} avatarUrl={a.avatarUrl} size={20} />
                        <span className="text-base text-td-text">{a.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-base text-td-text-faint">미배정</span>
                )}
              </div>

              {/* Start date */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-td-text-muted w-16 shrink-0">시작일</span>
                <span className="text-base text-td-text-bright">{formatDate(task.startDate ?? task.createdAt)}</span>
              </div>

              {/* Due date */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-td-text-muted w-16 shrink-0">마감일</span>
                {task.dueDate ? (
                  <div className="flex items-center gap-1.5 text-td-text-bright">
                    <Calendar size={14} />
                    <span className="text-base">{formatDate(task.dueDate)}</span>
                  </div>
                ) : (
                  <span className="text-base text-td-text-faint">없음</span>
                )}
              </div>
            </div>
          </>
        )}

        {/* Milestones */}
        <div className="mt-6 pt-4 border-t border-td-border">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-td-text-bright">마일스톤</p>
            {msTotal > 0 && (
              <span className="text-xs font-semibold text-teal-400">{msPct}% ({msDone}/{msTotal})</span>
            )}
          </div>
          {msTotal > 0 && (
            <div className="h-1.5 bg-slate-200 dark:bg-td-input rounded-full overflow-hidden mb-3">
              <div className="h-full rounded-full bg-teal-500 transition-all animate-bar" style={{ width: `${msPct}%` }} />
            </div>
          )}
          <div className="space-y-2">
            {milestones.map((ms) => (
              <div key={ms.id} className="flex items-start gap-3 py-1.5 group">
                <button
                  onClick={() => toggleMilestone(task.id, ms.id)}
                  className="shrink-0 text-teal-400 transition-colors p-1"
                >
                  {ms.completed ? <CheckSquare size={22} /> : <Square size={22} />}
                </button>
                <span className={`text-base flex-1 ${ms.completed ? 'text-td-text-faint line-through' : 'text-td-text-bright'}`}>
                  {ms.title}
                </span>
                <button
                  onClick={() => removeMilestone(task.id, ms.id)}
                  className="p-1.5 text-td-text-faint hover:text-red-400 lg:opacity-0 lg:group-hover:opacity-100 transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <input
              type="text"
              value={msInput}
              onChange={(e) => setMsInput(e.target.value)}
              placeholder="마일스톤 추가..."
              className="flex-1 px-3 py-2.5 bg-td-card border border-td-border rounded-xl text-base text-td-text placeholder:text-td-text-faint focus:outline-none focus:ring-1 focus:ring-teal-500/50"
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
        </div>

        {/* Move task (view mode only) */}
        {!editing && (
          <div className="mt-6 pt-4 border-t border-td-border">
            <p className="text-sm text-td-text-muted mb-2">상태 변경</p>
            <div className="flex gap-2">
              {(['todo', 'in_progress', 'done'] as TaskStatus[]).map((s) => (
                <button
                  key={s}
                  disabled={task.status === s}
                  onClick={() => moveTask(task.id, s)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    task.status === s
                      ? 'text-white'
                      : 'bg-td-card text-td-text-secondary hover:bg-td-hover-strong hover:text-td-text'
                  }`}
                  style={task.status === s ? { backgroundColor: STATUS_COLORS[s] } : undefined}
                >
                  {TASK_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        )}
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
