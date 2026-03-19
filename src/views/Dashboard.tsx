'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { FolderKanban, ClipboardList, CheckCircle2, Users, Plus, ArrowRight, UserPlus, MessageSquarePlus, FolderPlus, Lightbulb, Vote, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore, useTeamStore, useProjectStore, useTaskStore, useActivityStore } from '../store';
import { Avatar } from '../components/ui/Avatar';
import { PRIORITY_COLORS, STATUS_COLORS } from '../theme';
import { PRIORITY_LABELS, TASK_STATUS_LABELS } from '../constants';
import { formatRelativeDate, getTaskProgress, getProjectProgress } from '../utils/formatters';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
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

export default function Dashboard() {
  const authUser = useAuthStore((s) => s.user);
  const tasks = useTaskStore((s) => s.tasks);
  const members = useTeamStore((s) => s.members);
  const projects = useProjectStore((s) => s.projects);
  const allActivities = useActivityStore((s) => s.activities);
  const activities = allActivities.slice(0, 8);

  const projectCount = projects.filter((p) => p.status === 'active').length;
  const openTasks = tasks.filter((t) => t.status !== 'done').length;
  const completedTasks = tasks.filter((t) => t.status === 'done').length;

  const myMember = members.find((m) => m.email === authUser?.email);
  const myTasks = tasks
    .filter((t) => t.assigneeId === myMember?.id && t.status !== 'done')
    .sort((a, b) => {
      const po: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
      return po[a.priority] - po[b.priority];
    })
    .slice(0, 5);

  const activeProjects = projects;

  const stats = [
    { title: '프로젝트', value: projectCount, icon: FolderKanban, color: '#0d9488', to: '/projects' },
    { title: '진행 중 작업', value: openTasks, icon: ClipboardList, color: '#0d9488', to: '/tasks' },
    { title: '완료된 작업', value: completedTasks, icon: CheckCircle2, color: '#10b981', to: '/tasks' },
    { title: '팀원', value: members.length, icon: Users, color: '#0d9488', to: '/team' },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-td-text">
          안녕하세요, {authUser?.name.split(' ')[0] ?? '사용자'}님
        </h2>
        <p className="text-xs text-td-text-muted mt-1">{format(new Date(), 'M월 d일 EEEE', { locale: ko })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {stats.map(({ title, value, icon: Icon, color, to }) => (
          <Link
            key={title}
            href={to}
            className="bg-td-card backdrop-blur-xl border border-td-border rounded-2xl p-4 md:p-5 hover:bg-td-hover-strong hover:border-td-border-strong transition-all"
          >
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: color + '20' }}>
              <Icon size={18} style={{ color }} className="md:!w-5 md:!h-5" />
            </div>
            <p className="text-2xl md:text-3xl font-bold text-td-text pl-2"><AnimatedNumber value={value} /></p>
            <p className="text-xs md:text-sm text-td-text-muted pl-2">{title}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* My Tasks */}
        <div className="bg-td-card backdrop-blur-xl border border-td-border rounded-2xl p-4 md:p-5 hover:bg-td-hover-strong transition-all min-w-0">
          <h3 className="text-sm md:text-base font-semibold text-td-text mb-3">내 작업</h3>
          {myTasks.length === 0 && <p className="text-xs text-td-text-muted">배정된 작업이 없습니다</p>}
          <div className="space-y-2 lg:max-h-[400px] lg:overflow-y-auto lg:scroll-section lg:pr-1">
            {myTasks.map((task) => {
              const proj = projects.find((p) => p.id === task.projectId);
              const msPct = getTaskProgress(task);
              return (
                <Link href={`/tasks/${task.id}`} key={task.id} className="block p-3 border border-td-border rounded-xl hover:bg-td-hover transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse-dot" style={{ backgroundColor: PRIORITY_COLORS[task.priority], color: PRIORITY_COLORS[task.priority] }} />
                      <p className="text-sm font-medium text-td-text truncate">{task.title}</p>
                    </div>
                    <p className="text-sm font-semibold text-td-text shrink-0 ml-2">{msPct}%</p>
                  </div>
                  <div className="h-1.5 bg-td-input rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-teal-500 transition-all animate-bar" style={{ width: `${msPct}%` }} />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex items-center gap-2">
                      {proj && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: proj.color + '15', color: proj.color }}>{proj.title}</span>
                      )}
                      <span className="text-xs" style={{ color: STATUS_COLORS[task.status] }}>{TASK_STATUS_LABELS[task.status]}</span>
                    </div>
                    <span className="text-xs text-td-text-muted">{msPct}% 진행</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Project Progress */}
        <div className="bg-td-card backdrop-blur-xl border border-td-border rounded-2xl p-4 md:p-5 hover:bg-td-hover-strong transition-all min-w-0">
          <h3 className="text-sm md:text-base font-semibold text-td-text mb-3">프로젝트 진행률</h3>
          {activeProjects.length === 0 && <p className="text-xs text-td-text-muted">진행 중인 프로젝트가 없습니다</p>}
          <div className="space-y-3 lg:max-h-[400px] lg:overflow-y-auto lg:scroll-section lg:pr-1">
            {activeProjects.map((project) => {
              const pTasks = tasks.filter((t) => t.projectId === project.id);
              const { pct, done, total } = getProjectProgress(pTasks);
              return (
                <Link href={`/projects/${project.id}`} key={project.id} className="block p-3 border border-td-border rounded-xl hover:bg-td-hover transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                      <p className="text-sm font-medium text-td-text truncate">{project.title}</p>
                    </div>
                    <p className="text-sm font-semibold text-td-text shrink-0 ml-2">{pct}%</p>
                  </div>
                  <div className="h-1.5 bg-td-input rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all animate-bar" style={{ width: `${pct}%`, backgroundColor: project.color }} />
                  </div>
                  <p className="text-xs text-td-text-muted mt-1.5">{done}/{total} 완료</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Team Overview */}
        <div className="bg-td-card backdrop-blur-xl border border-td-border rounded-2xl p-4 md:p-5 hover:bg-td-hover-strong transition-all min-w-0">
          <h3 className="text-sm md:text-base font-semibold text-td-text mb-3">팀원</h3>
          {members.length === 0 && <p className="text-xs text-td-text-muted">팀원이 없습니다</p>}
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x md:grid md:grid-cols-4 lg:grid-cols-5 md:overflow-x-visible md:overflow-y-auto md:snap-none md:pb-0 lg:max-h-[400px] lg:scroll-section lg:pr-1">
            {members.map((member) => {
              const activeTasks = tasks.filter((t) => t.assigneeId === member.id && t.status !== 'done').length;
              return (
                <div key={member.id} className="flex flex-col items-center min-w-[60px] snap-start md:min-w-0">
                  <Avatar name={member.name} color={member.avatarColor} avatarUrl={member.avatarUrl} size={44} />
                  <p className="text-xs font-medium text-td-text mt-1.5 truncate max-w-[60px] text-center">{member.name.split(' ')[0]}</p>
                  <p className="text-xs text-td-text-muted">{activeTasks}건</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-td-card backdrop-blur-xl border border-td-border rounded-2xl p-4 md:p-5 hover:bg-td-hover-strong transition-all min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm md:text-base font-semibold text-td-text">최근 활동</h3>
            <Link href="/activities" className="text-xs text-teal-400 hover:text-teal-300 transition-colors">전체보기</Link>
          </div>
          {activities.length === 0 && <p className="text-xs text-td-text-muted">최근 활동이 없습니다</p>}
          <div className="space-y-1 max-h-[400px] overflow-y-auto scroll-section pr-1">
            {activities.map((act) => {
              const actor = members.find((m) => m.id === act.actorId);
              return (
                <div key={act.id} className="flex items-start gap-2.5 py-2">
                  {actor && <Avatar name={actor.name} color={actor.avatarColor} avatarUrl={actor.avatarUrl} size={28} />}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-td-text-secondary">
                      <span className="font-semibold text-td-text">{actor?.name ?? '알 수 없음'}</span>{' '}
                      {ACTIVITY_LABELS[act.type]}{' '}
                      <span className="font-semibold text-td-text">{act.targetTitle}</span>
                      {act.metadata?.from && (
                        <span className="text-td-text-muted"> ({act.metadata.from} → {act.metadata.to})</span>
                      )}
                    </p>
                    <p className="text-xs text-td-text-muted mt-0.5">{formatRelativeDate(act.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
