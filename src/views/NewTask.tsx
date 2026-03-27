'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import { useTaskStore, useProjectStore, useTeamStore } from '../store';
import { Avatar } from '../components/ui/Avatar';
import { PRIORITY_COLORS } from '../theme';
import { PRIORITY_LABELS } from '../constants';
import { usePermissions } from '../hooks/usePermissions';
import type { TaskStatus, Priority } from '../models';

export default function NewTask() {
  const router = useRouter();
  const addTask = useTaskStore((s) => s.addTask);
  const allProjects = useProjectStore((s) => s.projects);
  const projects = allProjects.filter((p) => p.status === 'active');
  const members = useTeamStore((s) => s.members);
  const { canAssignOthers, email: myEmail } = usePermissions();

  const myMember = members.find((m) => m.email === myEmail);
  const assignableMembers = canAssignOthers ? members : members.filter((m) => m.email === myEmail);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<Priority>('medium');
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
  const [assigneeIds, setAssigneeIds] = useState<string[]>(canAssignOthers ? [] : (myMember ? [myMember.id] : []));
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');

  const toggleAssignee = (id: string) => {
    setAssigneeIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId) return;
    addTask({ title: title.trim(), description: description.trim(), status, priority, projectId, assigneeIds, startDate: startDate || null, dueDate: dueDate || null });
    router.push('/tasks');
  };

  const statusOptions: { value: TaskStatus; label: string }[] = [
    { value: 'todo', label: '할 일' },
    { value: 'in_progress', label: '진행 중' },
    { value: 'done', label: '완료' },
  ];

  const priorityOptions: Priority[] = ['low', 'medium', 'high', 'urgent'];

  return (
    <div className="max-w-xl mx-auto">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-td-text-secondary hover:text-teal-600 dark:hover:text-teal-400 mb-4 transition-colors">
        <ArrowLeft size={16} /> 뒤로
      </button>
      <h2 className="text-2xl font-bold text-td-text mb-6">새 작업</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-td-text-bright mb-1">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="작업 제목"
            className="w-full px-4 py-2.5 bg-td-card border border-td-border rounded-xl text-sm text-td-text placeholder:text-td-text-faint focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 backdrop-blur"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-td-text-bright mb-1">설명</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="작업 설명"
            rows={3}
            className="w-full px-4 py-2.5 bg-td-card border border-td-border rounded-xl text-sm text-td-text placeholder:text-td-text-faint focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 backdrop-blur resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-td-text-bright mb-2">상태</label>
          <div className="flex gap-2">
            {statusOptions.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStatus(s.value)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  status === s.value
                    ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white'
                    : 'bg-td-card text-td-text-muted hover:bg-td-hover-strong hover:text-td-text-bright'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-td-text-bright mb-2">우선순위</label>
          <div className="flex gap-2 flex-wrap">
            {priorityOptions.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  priority === p
                    ? 'text-white'
                    : 'bg-td-card text-td-text-muted hover:bg-td-hover-strong hover:text-td-text-bright'
                }`}
                style={priority === p ? { backgroundColor: PRIORITY_COLORS[p] } : undefined}
              >
                {PRIORITY_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-td-text-bright mb-1">프로젝트</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full px-4 py-2.5 border border-td-border rounded-xl text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 backdrop-blur"
            style={{ backgroundColor: 'var(--td-input)', color: 'var(--td-text)' }}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id} style={{ backgroundColor: 'var(--td-input)', color: 'var(--td-text)' }}>{p.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-td-text-bright mb-2">담당자 ({assigneeIds.length}명)</label>
          <div className="flex gap-2 flex-wrap">
            {assignableMembers.map((m) => {
              const selected = assigneeIds.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleAssignee(m.id)}
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-td-text-bright mb-1">작업 시작일</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-td-card border border-td-border rounded-xl text-sm text-td-text focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 backdrop-blur"
            />
            <p className="text-xs text-td-text-faint mt-1">기본값: 오늘</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-td-text-bright mb-1">마감일</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-td-card border border-td-border rounded-xl text-sm text-td-text focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 backdrop-blur"
            />
            <p className="text-xs text-td-text-faint mt-1">선택 사항</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={!title.trim() || !projectId}
          className="w-full py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-medium text-sm rounded-xl transition-all"
        >
          작업 만들기
        </button>
      </form>
    </div>
  );
}
