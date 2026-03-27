'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTaskStore, useProjectStore } from '../store';
import { PRIORITY_COLORS, STATUS_COLORS } from '../theme';
import { TASK_STATUS_LABELS } from '../constants';
import type { Task } from '../models';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/* ── Date helpers ── */

function strip(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function same(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/* ── Calendar weeks ── */

function getWeeks(year: number, month: number): Date[][] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const start = addDays(first, -first.getDay());
  const end = addDays(last, 6 - last.getDay());

  const weeks: Date[][] = [];
  let cur = new Date(start);
  while (cur <= end) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cur));
      cur = addDays(cur, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

/* ── Bar layout (lane assignment) ── */

interface Bar {
  task: Task;
  col: number;   // 0-based start column
  span: number;  // number of columns
  lane: number;  // vertical lane (0-based)
  isHead: boolean; // bar starts this week
  isTail: boolean; // bar ends this week
  color: string;
}

function layoutBars(tasks: Task[], week: Date[], projects: { id: string; color: string }[]): Bar[] {
  const ws = strip(week[0]);
  const we = strip(week[6]);

  // Filter tasks that overlap this week
  const hits = tasks.filter((t) => {
    const s = strip(new Date(t.startDate ?? t.createdAt));
    const e = t.dueDate ? strip(new Date(t.dueDate)) : s;
    const [lo, hi] = s <= e ? [s, e] : [e, s];
    return lo <= we && hi >= ws;
  });

  // Sort: group by project → longer duration first → earlier start
  const projOrder = new Map(projects.map((p, i) => [p.id, i]));
  hits.sort((a, b) => {
    const pa = projOrder.get(a.projectId) ?? 999;
    const pb = projOrder.get(b.projectId) ?? 999;
    if (pa !== pb) return pa - pb;
    const as_ = new Date(a.startDate ?? a.createdAt).getTime();
    const bs_ = new Date(b.startDate ?? b.createdAt).getTime();
    const ae = a.dueDate ? new Date(a.dueDate).getTime() : as_;
    const be = b.dueDate ? new Date(b.dueDate).getTime() : bs_;
    const durA = ae - as_;
    const durB = be - bs_;
    if (durA !== durB) return durB - durA;
    return as_ - bs_;
  });

  const bars: Bar[] = [];
  const lanes: { col: number; end: number }[][] = [];

  for (const task of hits) {
    const s = strip(new Date(task.startDate ?? task.createdAt));
    const e = task.dueDate ? strip(new Date(task.dueDate)) : s;
    const [lo, hi] = s <= e ? [s, e] : [e, s];

    // Clamp to week boundaries
    const barStart = lo < ws ? ws : lo;
    const barEnd = hi > we ? we : hi;

    // Map to columns
    let col = 0;
    let endCol = 6;
    for (let i = 0; i < 7; i++) { if (same(week[i], barStart)) { col = i; break; } }
    for (let i = 6; i >= 0; i--) { if (same(week[i], barEnd)) { endCol = i; break; } }
    const span = endCol - col + 1;

    // Find first non-conflicting lane
    let lane = 0;
    outer: while (true) {
      if (!lanes[lane]) { lanes[lane] = []; break; }
      for (const b of lanes[lane]) {
        if (!(b.end < col || endCol < b.col)) { lane++; continue outer; }
      }
      break;
    }
    if (!lanes[lane]) lanes[lane] = [];
    lanes[lane].push({ col, end: endCol });

    const proj = projects.find((p) => p.id === task.projectId);
    const color = proj?.color ?? PRIORITY_COLORS[task.priority];

    bars.push({
      task,
      col,
      span,
      lane,
      isHead: lo >= ws,
      isTail: hi <= we,
      color,
    });
  }

  return bars;
}

/* ── Component ── */

export default function Calendar() {
  const today = strip(new Date());
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const tasks = useTaskStore((s) => s.tasks);
  const projects = useProjectStore((s) => s.projects);

  const weeks = useMemo(() => getWeeks(year, month), [year, month]);
  const projColors = useMemo(() => projects.map((p) => ({ id: p.id, color: p.color })), [projects]);
  const weekBars = useMemo(() => weeks.map((w) => layoutBars(tasks, w, projColors)), [weeks, tasks, projColors]);

  // Stats
  const monthTasks = useMemo(() => tasks.filter((t) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    return d.getFullYear() === year && d.getMonth() === month;
  }), [tasks, year, month]);

  const doneMonth = monthTasks.filter((t) => t.status === 'done').length;
  const overdueMonth = monthTasks.filter((t) => t.status !== 'done' && new Date(t.dueDate!) < today).length;
  const pendingMonth = monthTasks.length - doneMonth - overdueMonth;

  const goPrev = () => { if (month === 0) { setYear(year - 1); setMonth(11); } else setMonth(month - 1); };
  const goNext = () => { if (month === 11) { setYear(year + 1); setMonth(0); } else setMonth(month + 1); };
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-2xl font-bold text-td-text">일정</h2>
        <div className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1.5 text-td-text-muted"><span className="w-2 h-2 rounded-full bg-teal-500" /> 완료 {doneMonth}</span>
          <span className="flex items-center gap-1.5 text-td-text-muted"><span className="w-2 h-2 rounded-full bg-amber-500" /> 예정 {pendingMonth}</span>
          {overdueMonth > 0 && (
            <span className="flex items-center gap-1.5 text-red-400"><span className="w-2 h-2 rounded-full bg-red-500" /> 지연 {overdueMonth}</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-4 bg-td-card backdrop-blur-xl border border-td-border rounded-2xl px-4 py-3">
        <button onClick={goPrev} className="p-2 rounded-xl hover:bg-td-hover transition-colors text-td-text-muted hover:text-td-text">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-td-text">{year}년 {month + 1}월</h3>
          <button onClick={goToday} className="text-xs px-2.5 py-1 rounded-lg bg-teal-500/15 text-teal-400 hover:bg-teal-500/25 transition-colors font-medium">오늘</button>
        </div>
        <button onClick={goNext} className="p-2 rounded-xl hover:bg-td-hover transition-colors text-td-text-muted hover:text-td-text">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Calendar */}
      <div className="bg-td-card backdrop-blur-xl border border-td-border rounded-2xl overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-td-border">
          {WEEKDAYS.map((d, i) => (
            <div key={d} className={`text-center text-xs font-semibold py-2.5 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-td-text-muted'}`}>{d}</div>
          ))}
        </div>

        {/* Week rows */}
        {weeks.map((week, wi) => {
          const bars = weekBars[wi];
          const laneCount = bars.length > 0 ? Math.max(...bars.map((b) => b.lane)) + 1 : 0;

          return (
            <div key={wi} className="border-b border-td-border last:border-b-0">
              <div className="grid grid-cols-7">
                {week.map((date, di) => {
                  const cur = date.getMonth() === month;
                  const isToday = same(date, today);
                  const dow = date.getDay();
                  return (
                    <div key={di} className={`border-r border-td-border/50 last:border-r-0 ${!cur ? 'bg-td-bg-soft/50' : ''} ${isToday ? 'bg-teal-500/5' : ''}`}>
                      {/* Day number */}
                      <div className="px-1 sm:px-1.5 pt-1">
                        <span className={`text-xs font-medium w-5 h-5 inline-flex items-center justify-center rounded-full ${
                          isToday ? 'bg-teal-500 text-white'
                            : !cur ? 'text-td-text-faint'
                              : dow === 0 ? 'text-red-400'
                                : dow === 6 ? 'text-blue-400'
                                  : 'text-td-text-secondary'
                        }`}>
                          {date.getDate()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Task bars — overlaid with column guides */}
              {laneCount > 0 ? (
                <div className="relative">
                  {/* Column divider lines */}
                  <div className="absolute inset-0 grid grid-cols-7 pointer-events-none" aria-hidden="true">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div key={i} className="border-r border-td-border/50 last:border-r-0" />
                    ))}
                  </div>
                  <div
                    className="relative grid grid-cols-7 gap-y-[3px] px-[2px] pb-1.5 pt-0.5"
                    style={{ gridTemplateRows: `repeat(${laneCount}, 20px)` }}
                  >
                    {bars.map((bar) => {
                      const isDone = bar.task.status === 'done';
                      return (
                        <Link
                          key={`${bar.task.id}-w${wi}`}
                          href={`/tasks/${bar.task.id}`}
                          title={`${bar.task.title}\n${new Date(bar.task.startDate ?? bar.task.createdAt).toLocaleDateString('ko')} → ${bar.task.dueDate ? new Date(bar.task.dueDate).toLocaleDateString('ko') : '마감일 없음'}\n${TASK_STATUS_LABELS[bar.task.status]}`}
                          className={`truncate text-[10px] sm:text-[11px] font-medium px-1.5 leading-[20px] hover:brightness-125 transition-all ${isDone ? 'opacity-50 line-through' : ''}`}
                          style={{
                            gridColumn: `${bar.col + 1} / span ${bar.span}`,
                            gridRow: bar.lane + 1,
                            backgroundColor: bar.color + '28',
                            color: bar.color,
                            borderRadius: `${bar.isHead ? '4px' : '0'} ${bar.isTail ? '4px' : '0'} ${bar.isTail ? '4px' : '0'} ${bar.isHead ? '4px' : '0'}`,
                            borderLeft: bar.isHead ? `3px solid ${bar.color}` : 'none',
                          }}
                        >
                          {bar.task.title}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-2" />
              )}
            </div>
          );
        })}
      </div>

      {/* Monthly task list */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-td-text mb-3">이번 달 마감 작업</h3>
        {monthTasks.length === 0 ? (
          <p className="text-base text-td-text-muted text-center py-8">이번 달 마감 작업이 없습니다</p>
        ) : (
          <div className="space-y-2">
            {monthTasks
              .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
              .map((task) => {
                const project = projects.find((p) => p.id === task.projectId);
                const dueDate = new Date(task.dueDate!);
                const created = new Date(task.startDate ?? task.createdAt);
                const isOverdue = task.status !== 'done' && dueDate < today;

                return (
                  <Link key={task.id} href={`/tasks/${task.id}`}
                    className="flex items-center gap-3 bg-td-card backdrop-blur-xl border border-td-border rounded-xl p-3 hover:bg-td-hover-strong transition-all"
                  >
                    <div className={`shrink-0 w-11 h-11 rounded-xl flex flex-col items-center justify-center text-xs font-semibold ${
                      isOverdue ? 'bg-red-500/15 text-red-400' : same(dueDate, today) ? 'bg-teal-500/15 text-teal-400' : 'bg-td-hover text-td-text-secondary'
                    }`}>
                      <span className="text-[10px] leading-tight">{dueDate.getMonth() + 1}월</span>
                      <span className="text-sm leading-tight">{dueDate.getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-td-text truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[11px] px-1.5 py-0.5 rounded-full font-medium"
                          className="badge-colored" style={{ backgroundColor: STATUS_COLORS[task.status], '--badge-color': STATUS_COLORS[task.status] } as React.CSSProperties}
                        >{TASK_STATUS_LABELS[task.status]}</span>
                        <span className="text-[11px] text-td-text-faint">
                          {created.getMonth() + 1}/{created.getDate()} ~ {dueDate.getMonth() + 1}/{dueDate.getDate()}
                        </span>
                        {project && <span className="text-[11px] text-td-text-faint truncate">{project.title}</span>}
                      </div>
                    </div>
                  </Link>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
