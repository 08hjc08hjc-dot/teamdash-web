'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Trash2, Plus, X, CheckSquare, Square, Pencil } from 'lucide-react';
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
  const activeProjects = useProjectStore((s) => s.projects.filter((p) => p.status !== 'archived'));
  const allMembers = useTeamStore((s) => s.members);
  const assignee = allMembers.find((m) => m.id === task?.assigneeId);
  const moveTask = useTaskStore((s) => s.moveTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const removeTask = useTaskStore((s) => s.removeTask);
  const addMilestone = useTaskStore((s) => s.addMilestone);
  const toggleMilestone = useTaskStore((s) => s.toggleMilestone);
  const removeMilestone = useTaskStore((s) => s.removeMilestone);
  const { isAdmin } = usePermissions();
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [msInput, setMsInput] = useState('');

  // Editing states
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
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

  const startEditTitle = () => { setTitleVal(task.title); setEditingTitle(true); };
  const saveTitle = () => { if (titleVal.trim()) updateTask(task.id, { title: titleVal.trim() }); setEditingTitle(false); };

  const startEditDesc = () => { setDescVal(task.description); setEditingDesc(true); };
  const saveDesc = () => { updateTask(task.id, { description: descVal }); setEditingDesc(false); };

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-base text-td-text-muted hover:text-teal-400 mb-4 transition-colors">
        <ArrowLeft size={16} /> 뒤로
      </button>

      <div className="bg-td-card backdrop-blur-xl rounded-2xl border border-td-border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <select
                value={task.priority}
                onChange={(e) => updateTask(task.id, { priority: e.target.value as Priority })}
                className="text-sm px-2 py-0.5 rounded-full font-medium border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-500/50 appearance-none text-center"
                style={{ backgroundColor: PRIORITY_COLORS[task.priority] + '30', color: PRIORITY_COLORS[task.priority] }}
              >
                {(Object.entries(PRIORITY_LABELS) as [Priority, string][]).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
              <span className="text-sm px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: STATUS_COLORS[task.status] + '30', color: STATUS_COLORS[task.status] }}>
                {TASK_STATUS_LABELS[task.status]}
              </span>
            </div>
            {editingTitle ? (
              <input
                autoFocus
                value={titleVal}
                onChange={(e) => setTitleVal(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
                className="w-full text-xl sm:text-2xl font-bold text-td-text bg-transparent border-b-2 border-teal-500 focus:outline-none"
              />
            ) : (
              <h2 onClick={startEditTitle} className="text-xl sm:text-2xl font-bold text-td-text cursor-pointer hover:text-teal-300 transition-colors group">
                {task.title} <Pencil size={14} className="inline ml-1 text-td-text-faint opacity-0 group-hover:opacity-100 transition-opacity" />
              </h2>
            )}
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

        {/* Description */}
        {editingDesc ? (
          <textarea
            autoFocus
            value={descVal}
            onChange={(e) => setDescVal(e.target.value)}
            onBlur={saveDesc}
            onKeyDown={(e) => { if (e.key === 'Escape') setEditingDesc(false); }}
            rows={3}
            className="w-full mt-3 text-base text-td-text-secondary bg-transparent border border-td-border rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-teal-500/50 resize-none"
          />
        ) : (
          <p onClick={startEditDesc} className="text-base text-td-text-secondary mt-3 cursor-pointer hover:text-td-text transition-colors group min-h-[24px]">
            {task.description || '설명을 추가하세요...'} <Pencil size={12} className="inline ml-1 text-td-text-faint opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        )}

        <div className="mt-6 space-y-3">
          {/* Project */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-td-text-muted w-16 shrink-0">프로젝트</span>
            <select
              value={task.projectId}
              onChange={(e) => updateTask(task.id, { projectId: e.target.value })}
              className="text-base font-medium text-td-text bg-transparent border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-500/50 rounded"
            >
              {activeProjects.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          {/* Assignee */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-td-text-muted w-16 shrink-0">담당자</span>
            <div className="flex items-center gap-1.5">
              {assignee && <Avatar name={assignee.name} color={assignee.avatarColor} avatarUrl={assignee.avatarUrl} size={20} />}
              <select
                value={task.assigneeId ?? ''}
                onChange={(e) => updateTask(task.id, { assigneeId: e.target.value || null })}
                className="text-base text-td-text bg-transparent border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-500/50 rounded"
              >
                <option value="">미배정</option>
                {allMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Due date */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-td-text-muted w-16 shrink-0">마감일</span>
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-td-text-muted" />
              <input
                type="date"
                value={task.dueDate ?? ''}
                onChange={(e) => updateTask(task.id, { dueDate: e.target.value || null })}
                className="text-base text-td-text bg-transparent border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-500/50 rounded"
              />
            </div>
          </div>
        </div>

        {/* Milestones */}
        <div className="mt-6 pt-4 border-t border-td-border">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-td-text-bright">마일스톤</p>
            {msTotal > 0 && (
              <span className="text-xs font-semibold text-teal-400">{msPct}% ({msDone}/{msTotal})</span>
            )}
          </div>
          {msTotal > 0 && (
            <div className="h-1.5 bg-td-input rounded-full overflow-hidden mb-3">
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

        {/* Move task */}
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
