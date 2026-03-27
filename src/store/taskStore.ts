import { create } from 'zustand';
import { loadFromStorage, saveToStorage } from './storage';
import { useActivityStore } from './activityStore';
import { useProjectStore } from './projectStore';
import { useSettingsStore } from './settingsStore';
import { TASK_STATUS_LABELS } from '../constants';
import type { Task, TaskStatus, Priority, Milestone } from '../models';
import { generateId } from '../utils/formatters';

interface TaskStore {
  tasks: Task[];
  addTask: (params: {
    title: string;
    description: string;
    status: TaskStatus;
    priority: Priority;
    projectId: string;
    assigneeId: string | null;
    dueDate: string | null;
  }) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  moveTask: (id: string, newStatus: TaskStatus) => void;
  reorderTasks: (status: TaskStatus, orderedIds: string[]) => void;
  setTasks: (tasks: Task[]) => void;
  addMilestone: (taskId: string, title: string) => void;
  toggleMilestone: (taskId: string, milestoneId: string) => void;
  removeMilestone: (taskId: string, milestoneId: string) => void;
}

const KEY = 'teamdash-tasks';

export const useTaskStore = create<TaskStore>()((set, get) => ({
  tasks: loadFromStorage<Task[]>(KEY, 'tasks', []),
  addTask: (params) => {
    const now = new Date().toISOString();
    const tasksInStatus = get().tasks.filter((t) => t.status === params.status);
    const task: Task = { id: generateId(), ...params, milestones: [], order: tasksInStatus.length, createdAt: now, updatedAt: now };
    set((s) => ({ tasks: [...s.tasks, task] }));
    const actorId = useSettingsStore.getState().currentUserId;
    if (actorId) useActivityStore.getState().addActivity({ type: 'task_created', actorId, targetId: task.id, targetTitle: task.title });
    return task;
  },
  updateTask: (id, updates) => set((s) => ({
    tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t)),
  })),
  removeTask: (id) => {
    const task = get().tasks.find((t) => t.id === id);
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
    if (task) {
      const actorId = useSettingsStore.getState().currentUserId;
      if (actorId) useActivityStore.getState().addActivity({ type: 'task_deleted', actorId, targetId: id, targetTitle: task.title });
    }
  },
  moveTask: (id, newStatus) => {
    const task = get().tasks.find((t) => t.id === id);
    const oldStatus = task?.status;
    set((s) => {
      const count = s.tasks.filter((t) => t.status === newStatus && t.id !== id).length;
      return {
        tasks: s.tasks.map((t) =>
          t.id === id ? { ...t, status: newStatus, order: count, updatedAt: new Date().toISOString() } : t
        ),
      };
    });
    if (task && oldStatus !== newStatus) {
      const actorId = useSettingsStore.getState().currentUserId;
      if (actorId) {
        const type = newStatus === 'done' ? 'task_completed' : 'task_moved';
        useActivityStore.getState().addActivity({
          type,
          actorId,
          targetId: id,
          targetTitle: task.title,
          metadata: { from: TASK_STATUS_LABELS[oldStatus!] ?? oldStatus!, to: TASK_STATUS_LABELS[newStatus] ?? newStatus },
        });
      }
    }
    // Auto-update project status based on task completion
    if (task) {
      const tasks = get().tasks;
      const projectTasks = tasks.filter((t) => t.projectId === task.projectId);
      const allDone = projectTasks.length > 0 && projectTasks.every((t) => t.status === 'done');
      const project = useProjectStore.getState().projects.find((p) => p.id === task.projectId);
      if (project) {
        if (allDone && project.status === 'active') {
          useProjectStore.getState().updateProject(task.projectId, { status: 'completed' });
        } else if (!allDone && project.status === 'completed') {
          useProjectStore.getState().updateProject(task.projectId, { status: 'active' });
        }
      }
    }
  },
  reorderTasks: (status, orderedIds) => set((s) => ({
    tasks: s.tasks.map((t) => {
      if (t.status !== status) return t;
      const idx = orderedIds.indexOf(t.id);
      return idx >= 0 ? { ...t, order: idx } : t;
    }),
  })),
  setTasks: (tasks) => set({ tasks }),
  addMilestone: (taskId, title) => {
    const task = get().tasks.find((t) => t.id === taskId);
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? { ...t, milestones: [...(t.milestones ?? []), { id: generateId(), title, completed: false }], updatedAt: new Date().toISOString() }
          : t
      ),
    }));
    if (task) {
      const actorId = useSettingsStore.getState().currentUserId;
      if (actorId) useActivityStore.getState().addActivity({ type: 'milestone_added', actorId, targetId: taskId, targetTitle: task.title, metadata: { milestone: title } });
    }
  },
  toggleMilestone: (taskId, milestoneId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    const oldStatus = task?.status;
    set((s) => ({
      tasks: s.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const milestones = (t.milestones ?? []).map((m) => (m.id === milestoneId ? { ...m, completed: !m.completed } : m));
        const doneCount = milestones.filter((m) => m.completed).length;
        const total = milestones.length;
        let status = t.status;
        if (total > 0) {
          if (doneCount === total) status = 'done';
          else if (doneCount > 0) status = 'in_progress';
          else status = 'todo';
        }
        const count = s.tasks.filter((x) => x.status === status && x.id !== t.id).length;
        return { ...t, milestones, status, order: status !== t.status ? count : t.order, updatedAt: new Date().toISOString() };
      }),
    }));
    if (task) {
      const actorId = useSettingsStore.getState().currentUserId;
      const milestone = (task.milestones ?? []).find((m) => m.id === milestoneId);
      if (actorId && milestone) {
        useActivityStore.getState().addActivity({
          type: 'milestone_toggled',
          actorId,
          targetId: taskId,
          targetTitle: task.title,
          metadata: { milestone: milestone.title, status: milestone.completed ? '해제' : '완료' },
        });
      }
      const newStatus = get().tasks.find((t) => t.id === taskId)?.status;
      if (newStatus && newStatus !== oldStatus && actorId) {
        const type = newStatus === 'done' ? 'task_completed' : 'task_moved';
        useActivityStore.getState().addActivity({
          type,
          actorId,
          targetId: taskId,
          targetTitle: task.title,
          metadata: { from: TASK_STATUS_LABELS[oldStatus!] ?? oldStatus!, to: TASK_STATUS_LABELS[newStatus] ?? newStatus },
        });
      }
    }
  },
  removeMilestone: (taskId, milestoneId) => set((s) => ({
    tasks: s.tasks.map((t) =>
      t.id === taskId
        ? { ...t, milestones: (t.milestones ?? []).filter((m) => m.id !== milestoneId), updatedAt: new Date().toISOString() }
        : t
    ),
  })),
}));

useTaskStore.subscribe((s) => saveToStorage(KEY, s.tasks));
