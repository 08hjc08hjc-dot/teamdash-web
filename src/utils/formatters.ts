import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { ko } from 'date-fns/locale';

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  if (isToday(date)) return formatDistanceToNow(date, { addSuffix: true, locale: ko });
  if (isYesterday(date)) return '어제';
  return format(date, 'M월 d일, yyyy', { locale: ko });
}

export function formatDate(dateString: string): string {
  return format(new Date(dateString), 'M월 d일, yyyy', { locale: ko });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

/** Single task progress (0-100) based on milestones or status */
export function getTaskProgress(task: { milestones?: { completed: boolean }[]; status: string }): number {
  if (task.status === 'done') return 100;
  const ms = task.milestones ?? [];
  if (ms.length > 0) return Math.round((ms.filter((m) => m.completed).length / ms.length) * 100);
  return 0;
}

/** Project progress: average of all task progresses, plus done task count */
export function getProjectProgress(tasks: { milestones?: { completed: boolean }[]; status: string }[]): { pct: number; done: number; total: number } {
  const total = tasks.length;
  if (total === 0) return { pct: 0, done: 0, total: 0 };
  const progresses = tasks.map(getTaskProgress);
  const pct = Math.round(progresses.reduce((a, b) => a + b, 0) / total);
  const done = tasks.filter((t) => getTaskProgress(t) === 100).length;
  return { pct, done, total };
}
