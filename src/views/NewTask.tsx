'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
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
  const [assigneeId, setAssigneeId] = useState<string | null>(canAssignOthers ? null : (myMember?.id ?? null));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId) return;
    addTask({ title: title.trim(), description: description.trim(), status, priority, projectId, assigneeId, dueDate: null });
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
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-td-text-muted hover:text-teal-400 mb-4 transition-colors">
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
          <label className="block text-sm font-medium text-td-text-bright mb-2">프로젝트</label>
          <div className="flex gap-2 flex-wrap">
            {projects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProjectId(p.id)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  projectId === p.id
                    ? 'text-white'
                    : 'bg-td-card text-td-text-muted hover:bg-td-hover-strong hover:text-td-text-bright'
                }`}
                style={projectId === p.id ? { backgroundColor: p.color } : undefined}
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-td-text-bright mb-2">담당자</label>
          <div className="flex gap-2 flex-wrap">
            {canAssignOthers && (
              <button
                type="button"
                onClick={() => setAssigneeId(null)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  assigneeId === null
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/20'
                    : 'bg-td-card text-td-text-muted hover:bg-td-hover-strong hover:text-td-text-bright'
                }`}
              >
                미배정
              </button>
            )}
            {assignableMembers.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setAssigneeId(m.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  assigneeId === m.id
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/20'
                    : 'bg-td-card text-td-text-muted hover:bg-td-hover-strong hover:text-td-text-bright'
                }`}
              >
                <Avatar name={m.name} color={m.avatarColor} avatarUrl={m.avatarUrl} size={16} />
                {m.name}
              </button>
            ))}
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
