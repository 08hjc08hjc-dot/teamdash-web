'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, FolderOpen } from 'lucide-react';
import { useProjectStore, useTaskStore, useTeamStore } from '../store';
import { Avatar } from '../components/ui/Avatar';
import { PROJECT_STATUS_LABELS } from '../constants';
import { usePermissions } from '../hooks/usePermissions';
import { getProjectProgress } from '../utils/formatters';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import type { ProjectStatus } from '../models';

const FILTERS: { label: string; value: ProjectStatus | 'all' }[] = [
  { label: '전체', value: 'all' },
  { label: '진행 중', value: 'active' },
  { label: '완료됨', value: 'completed' },
  { label: '보관됨', value: 'archived' },
];

export default function Projects() {
  const projects = useProjectStore((s) => s.projects);
  const tasks = useTaskStore((s) => s.tasks);
  const members = useTeamStore((s) => s.members);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all');
  const { canCreateProject } = usePermissions();

  const filtered = projects.filter((p) => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-2xl font-bold text-td-text">프로젝트</h2>
        {canCreateProject && (
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white text-sm font-medium rounded-xl transition-all self-start"
          >
            <Plus size={16} /> 새 프로젝트
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-td-text-muted" />
        <input
          type="text"
          placeholder="프로젝트 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-td-card border border-td-border rounded-xl text-sm text-td-text placeholder:text-td-text-faint focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 backdrop-blur"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              filter === f.value
                ? 'bg-teal-600 text-white border border-teal-700 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/20'
                : 'bg-td-card text-td-text-muted hover:bg-td-hover hover:text-td-text-bright'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Project Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <FolderOpen size={48} className="mx-auto text-td-text-faint mb-3" />
          <p className="text-td-text-muted font-medium">프로젝트가 없습니다</p>
          <p className="text-xs text-td-text-faint mt-1">첫 번째 프로젝트를 만들어 시작하세요</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => {
            const pTasks = tasks.filter((t) => t.projectId === project.id);
            const { pct, done, total } = getProjectProgress(pTasks);
            const assigneeIds = [...new Set(pTasks.flatMap((t) => t.assigneeIds ?? []))];
            const pMembers = members.filter((m) => assigneeIds.includes(m.id));

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="bg-td-card backdrop-blur-xl border border-td-border rounded-2xl hover:bg-td-hover hover:border-td-border-strong transition-all overflow-hidden"
              >
                <div className="h-1.5" style={{ backgroundColor: project.color }} />
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-semibold text-td-text">{project.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      project.status === 'active' ? 'bg-green-600 text-white animate-glow-active' :
                      project.status === 'completed' ? 'bg-blue-600 text-white' :
                      'bg-td-card text-td-text-muted'
                    }`}>
                      {PROJECT_STATUS_LABELS[project.status]}
                    </span>
                  </div>
                  <p className="text-xs text-td-text-muted mt-1 line-clamp-2">{project.description}</p>

                  <div className="mt-3">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-td-text-muted">진행률</span>
                      <span className="text-sm font-semibold text-teal-400"><AnimatedNumber value={pct} suffix="%" /></span>
                    </div>
                    <div className="h-1.5 bg-td-input rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all animate-bar" style={{ width: `${pct}%`, backgroundColor: project.color }} />
                    </div>
                    <p className="text-xs text-td-text-muted mt-1">{done}/{total} 완료</p>
                  </div>

                  <div className="flex items-center mt-3 -space-x-1.5">
                    {pMembers.slice(0, 4).map((m) => (
                      <Avatar key={m.id} name={m.name} color={m.avatarColor} avatarUrl={m.avatarUrl} size={24} />
                    ))}
                    {pMembers.length > 4 && (
                      <span className="text-[10px] text-td-text-muted ml-2">+{pMembers.length - 4}</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
