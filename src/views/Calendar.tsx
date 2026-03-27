'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTaskStore, useProjectStore, useTeamStore } from '../store';
import { Avatar } from '../components/ui/Avatar';
import { PRIORITY_COLORS, STATUS_COLORS } from '../theme';
import { PRIORITY_LABELS, TASK_STATUS_LABELS } from '../constants';
import type { Task } from '../models';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = getDaysInMonth(year, month);
  const prevMonthDays = getDaysInMonth(year, month - 1);

  const days: { date: Date; current: boolean }[] = [];

  // Previous month padding
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ date: new Date(year, month - 1, prevMonthDays - i), current: false });
  }
  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ date: new Date(year, month, i), current: true });
  }
  // Next month padding
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ date: new Date(year, month + 1, i), current: false });
  }

  return days;
}

function TaskChip({ task }: { task: Task }) {
  return (
    <Link
      href={`/tasks/${task.id}`}
      className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium truncate hover:brightness-125 transition-all"
      style={{
        backgroundColor: PRIORITY_COLORS[task.priority] + '25',
        color: PRIORITY_COLORS[task.priority],
        borderLeft: `2px solid ${STATUS_COLORS[task.status]}`,
      }}
      title={`${task.title} — ${PRIORITY_LABELS[task.priority]} · ${TASK_STATUS_LABELS[task.status]}`}
    >
      <span className="truncate">{task.title}</span>
    </Link>
  );
}

export default function Calendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const tasks = useTaskStore((s) => s.tasks);
  const projects = useProjectStore((s) => s.projects);
  const members = useTeamStore((s) => s.members);

  const days = useMemo(() => getCalendarDays(year, month), [year, month]);

  // Group tasks by date string
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.dueDate) continue;
      const d = new Date(task.dueDate);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const arr = map.get(key) ?? [];
      arr.push(task);
      map.set(key, arr);
    }
    return map;
  }, [tasks]);

  // Stats for current month
  const monthTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [tasks, year, month]);

  const totalMonth = monthTasks.length;
  const doneMonth = monthTasks.filter((t) => t.status === 'done').length;
  const overdueMonth = monthTasks.filter((t) => t.status !== 'done' && new Date(t.dueDate!) < today).length;

  const goPrev = () => {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
  };

  const goNext = () => {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
  };

  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-2xl font-bold text-td-text">일정</h2>
        <div className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1.5 text-td-text-muted">
            <span className="w-2 h-2 rounded-full bg-teal-500" /> 완료 {doneMonth}
          </span>
          <span className="flex items-center gap-1.5 text-td-text-muted">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> 예정 {totalMonth - doneMonth - overdueMonth}
          </span>
          {overdueMonth > 0 && (
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500" /> 지연 {overdueMonth}
            </span>
          )}
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4 bg-td-card backdrop-blur-xl border border-td-border rounded-2xl px-4 py-3">
        <button onClick={goPrev} className="p-2 rounded-xl hover:bg-td-hover transition-colors text-td-text-muted hover:text-td-text">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-td-text">
            {year}년 {month + 1}월
          </h3>
          <button
            onClick={goToday}
            className="text-xs px-2.5 py-1 rounded-lg bg-teal-500/15 text-teal-400 hover:bg-teal-500/25 transition-colors font-medium"
          >
            오늘
          </button>
        </div>
        <button onClick={goNext} className="p-2 rounded-xl hover:bg-td-hover transition-colors text-td-text-muted hover:text-td-text">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-td-card backdrop-blur-xl border border-td-border rounded-2xl overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-td-border">
          {WEEKDAYS.map((day, i) => (
            <div
              key={day}
              className={`text-center text-xs font-semibold py-2.5 ${
                i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-td-text-muted'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {days.map(({ date, current }, idx) => {
            const isToday = isSameDay(date, today);
            const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            const dayTasks = tasksByDate.get(key) ?? [];
            const dayOfWeek = date.getDay();

            return (
              <div
                key={idx}
                className={`min-h-[5rem] sm:min-h-[6.5rem] border-b border-r border-td-border p-1 sm:p-1.5 transition-colors ${
                  current ? '' : 'bg-td-bg-soft/50'
                } ${isToday ? 'bg-teal-500/5' : ''}`}
              >
                {/* Date number */}
                <div className="flex justify-between items-start mb-0.5">
                  <span
                    className={`text-xs font-medium leading-5 w-5 h-5 flex items-center justify-center rounded-full ${
                      isToday
                        ? 'bg-teal-500 text-white'
                        : !current
                          ? 'text-td-text-faint'
                          : dayOfWeek === 0
                            ? 'text-red-400'
                            : dayOfWeek === 6
                              ? 'text-blue-400'
                              : 'text-td-text-secondary'
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-[10px] text-td-text-faint font-medium">{dayTasks.length}</span>
                  )}
                </div>

                {/* Task chips */}
                <div className="space-y-0.5 overflow-hidden">
                  {dayTasks.slice(0, 3).map((task) => (
                    <TaskChip key={task.id} task={task} />
                  ))}
                  {dayTasks.length > 3 && (
                    <span className="text-[10px] text-td-text-faint pl-1">+{dayTasks.length - 3}개 더</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming tasks list (mobile-friendly) */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-td-text mb-3">이번 달 작업</h3>
        {monthTasks.length === 0 ? (
          <p className="text-base text-td-text-muted text-center py-8">이번 달 마감 작업이 없습니다</p>
        ) : (
          <div className="space-y-2">
            {monthTasks
              .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
              .map((task) => {
                const project = projects.find((p) => p.id === task.projectId);
                const taskAssignees = members.filter((m) => (task.assigneeIds ?? []).includes(m.id));
                const dueDate = new Date(task.dueDate!);
                const isOverdue = task.status !== 'done' && dueDate < today;

                return (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="flex items-center gap-3 bg-td-card backdrop-blur-xl border border-td-border rounded-xl p-3 hover:bg-td-hover-strong transition-all"
                  >
                    {/* Date badge */}
                    <div className={`shrink-0 w-11 h-11 rounded-xl flex flex-col items-center justify-center text-xs font-semibold ${
                      isOverdue ? 'bg-red-500/15 text-red-400' : isSameDay(dueDate, today) ? 'bg-teal-500/15 text-teal-400' : 'bg-td-hover text-td-text-secondary'
                    }`}>
                      <span className="text-[10px] leading-tight">{dueDate.getMonth() + 1}월</span>
                      <span className="text-sm leading-tight">{dueDate.getDate()}</span>
                    </div>

                    {/* Task info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-td-text truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className="text-[11px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: STATUS_COLORS[task.status] + '30', color: STATUS_COLORS[task.status] }}
                        >
                          {TASK_STATUS_LABELS[task.status]}
                        </span>
                        <span
                          className="text-[11px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: PRIORITY_COLORS[task.priority] + '30', color: PRIORITY_COLORS[task.priority] }}
                        >
                          {PRIORITY_LABELS[task.priority]}
                        </span>
                        {project && (
                          <span className="text-[11px] text-td-text-faint truncate">{project.title}</span>
                        )}
                      </div>
                    </div>

                    {/* Assignees */}
                    {taskAssignees.length > 0 && (
                      <div className="flex -space-x-1 shrink-0">
                        {taskAssignees.slice(0, 3).map((a) => (
                          <Avatar key={a.id} name={a.name} color={a.avatarColor} avatarUrl={a.avatarUrl} size={20} />
                        ))}
                      </div>
                    )}
                  </Link>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
