'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Clock, Search } from 'lucide-react';
import { useTaskStore, useProjectStore, useTeamStore } from '../store';
import { Avatar } from '../components/ui/Avatar';
import { PRIORITY_COLORS, STATUS_COLORS } from '../theme';
import { TASK_STATUS_LABELS, PRIORITY_LABELS } from '../constants';
import { formatDate } from '../utils/formatters';
import { usePermissions } from '../hooks/usePermissions';
import type { Task, TaskStatus } from '../models';

function TaskCard({ task }: { task: Task }) {
  const router = useRouter();
  const assignee = useTeamStore((s) => s.members.find((m) => m.id === task.assigneeId));
  const project = useProjectStore((s) => s.projects.find((p) => p.id === task.projectId));
  const moveTask = useTaskStore((s) => s.moveTask);
  const { isAdmin, member: myMember } = usePermissions();

  const isAssignee = myMember?.id === task.assigneeId;
  const canChangeStatus = isAdmin || isAssignee;

  const milestones = task.milestones ?? [];
  const msDone = milestones.filter((m) => m.completed).length;
  const msTotal = milestones.length;
  const msPct = msTotal > 0 ? Math.round((msDone / msTotal) * 100) : 0;

  return (
    <div
      onClick={() => router.push(`/tasks/${task.id}`)}
      className="bg-td-card backdrop-blur-xl border border-td-border rounded-2xl hover:bg-td-hover hover:border-td-border-strong transition-all overflow-hidden cursor-pointer"
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-td-text hover:text-teal-300 transition-colors leading-snug">{task.title}</p>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 animate-pulse-dot" style={{ backgroundColor: PRIORITY_COLORS[task.priority] + '15', color: PRIORITY_COLORS[task.priority] }}>
            {PRIORITY_LABELS[task.priority]}
          </span>
        </div>
        {project && (
          <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: project.color + '30', color: project.color }}>
            {project.title}
          </span>
        )}

        <div className="mt-3">
          <div className="flex justify-between mb-1">
            <span className="text-xs text-td-text-muted">진행률</span>
            <span className="text-sm font-semibold text-teal-400">{msPct}%</span>
          </div>
          <div className="h-1.5 bg-td-input rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all animate-bar" style={{ width: `${msPct}%`, backgroundColor: PRIORITY_COLORS[task.priority] }} />
          </div>
          <p className="text-xs text-td-text-muted mt-1">{msDone}/{msTotal} 완료</p>
        </div>

        <div className="flex items-center justify-between mt-3">
          {assignee ? (
            <div className="flex items-center gap-1.5">
              <Avatar name={assignee.name} color={assignee.avatarColor} avatarUrl={assignee.avatarUrl} size={22} />
              <span className="text-xs text-td-text-secondary">{assignee.name}</span>
            </div>
          ) : <div />}
          <div className="flex items-center gap-1.5 text-td-text-muted">
            <Clock size={11} />
            <span className="text-xs">{formatDate(task.updatedAt)}</span>
          </div>
        </div>

        {/* Quick move buttons */}
        {canChangeStatus && (
          <div className="flex gap-1.5 mt-3 pt-3 border-t border-td-border">
            {(['todo', 'in_progress', 'done'] as TaskStatus[]).map((s) => (
              <button
                key={s}
                disabled={task.status === s}
                onClick={(e) => { e.stopPropagation(); moveTask(task.id, s); }}
                className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-all ${
                  task.status === s
                    ? 'text-white cursor-default'
                    : 'bg-td-card hover:bg-td-hover text-td-text-muted hover:text-td-text-bright'
                }`}
                style={task.status === s ? { backgroundColor: STATUS_COLORS[s] + '40', color: STATUS_COLORS[s] } : undefined}
              >
                {TASK_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Tasks() {
  const tasks = useTaskStore((s) => s.tasks);
  const allProjects = useProjectStore((s) => s.projects);
  const projects = allProjects.filter((p) => p.status === 'active');
  const [projectFilter, setProjectFilter] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const [mobileTab, setMobileTab] = useState<TaskStatus>('todo');

  const filteredTasks = tasks.filter((t) => {
    if (projectFilter && t.projectId !== projectFilter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const columns: TaskStatus[] = ['todo', 'in_progress', 'done'];

  return (
    <div className="lg:h-full lg:flex lg:flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-2xl font-bold text-td-text">작업 보드</h2>
        <Link
          href="/tasks/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white text-sm font-medium rounded-xl transition-all self-start"
        >
          <Plus size={16} /> 새 작업
        </Link>
      </div>

      {/* Project filter */}
      <div className="flex gap-2 md:gap-2.5 flex-wrap mb-4">
        <button
          onClick={() => setProjectFilter(undefined)}
          className={`px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded-lg transition-all ${
            !projectFilter
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/20'
              : 'bg-td-card text-td-text-muted hover:bg-td-hover hover:text-td-text-bright'
          }`}
        >
          전체 프로젝트
        </button>
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => setProjectFilter(projectFilter === p.id ? undefined : p.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              projectFilter === p.id ? 'text-white' : 'bg-td-card text-td-text-muted hover:bg-td-hover hover:text-td-text-bright'
            }`}
            style={projectFilter === p.id ? { backgroundColor: p.color } : undefined}
          >
            {p.title}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-td-text-muted" />
        <input
          type="text"
          placeholder="작업 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-td-card border border-td-border rounded-xl text-sm text-td-text placeholder:text-td-text-faint focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 backdrop-blur"
        />
      </div>

      {/* Mobile tabs (phone only) */}
      <div className="flex gap-1 mb-4 md:hidden">
        {columns.map((status) => {
          const count = filteredTasks.filter((t) => t.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setMobileTab(status)}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                mobileTab === status
                  ? 'text-white'
                  : 'bg-td-card text-td-text-muted'
              }`}
              style={mobileTab === status ? { backgroundColor: STATUS_COLORS[status] + '30', color: STATUS_COLORS[status] } : undefined}
            >
              {TASK_STATUS_LABELS[status]} ({count})
            </button>
          );
        })}
      </div>

      {/* Kanban Board — tablet & desktop: 3 columns */}
      <div className="lg:flex-1 lg:overflow-x-auto pb-4">
        <div className="hidden md:grid md:grid-cols-3 gap-4">
          {columns.map((status) => {
            const colTasks = filteredTasks
              .filter((t) => t.status === status)
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            return (
              <div key={status} className="bg-td-surface backdrop-blur-xl rounded-2xl p-4 border border-td-border-subtle">
                <div className="flex items-center gap-2 mb-4 px-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }} />
                  <h3 className="text-sm font-semibold text-td-text">{TASK_STATUS_LABELS[status]}</h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: STATUS_COLORS[status] + '20', color: STATUS_COLORS[status] }}>
                    {colTasks.length}
                  </span>
                </div>
                <div className="space-y-3 lg:max-h-[calc(100vh-280px)] lg:overflow-y-auto lg:scroll-section lg:pr-1">
                  {colTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                  {colTasks.length === 0 && (
                    <p className="text-xs text-td-text-faint text-center py-8">작업 없음</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Phone: single column based on active tab */}
        <div className="md:hidden">
          {(() => {
            const colTasks = filteredTasks
              .filter((t) => t.status === mobileTab)
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            return (
              <div className="space-y-3">
                {colTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {colTasks.length === 0 && (
                  <p className="text-xs text-td-text-faint text-center py-8">작업 없음</p>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
