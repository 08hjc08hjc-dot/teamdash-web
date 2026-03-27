export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type ProjectStatus = 'active' | 'completed' | 'archived';
export type TeamRole = 'owner' | 'admin' | 'member';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type ActivityType =
  | 'task_created'
  | 'task_moved'
  | 'task_completed'
  | 'project_created'
  | 'member_added'
  | 'comment_added'
  | 'milestone_added'
  | 'milestone_toggled'
  | 'task_deleted'
  | 'project_deleted'
  | 'idea_created'
  | 'idea_voted'
  | 'idea_comment';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  avatarColor: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  color: string;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  projectId: string;
  assigneeId: string | null;
  dueDate: string | null;
  milestones?: Milestone[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  actorId: string;
  targetId: string;
  targetTitle: string;
  metadata?: Record<string, string>;
  createdAt: string;
}

export interface DashboardWidget {
  id: string;
  type: 'stats' | 'activity' | 'project_progress' | 'my_tasks' | 'team_overview';
  order: number;
  visible: boolean;
}

export type IdeaStatus = 'open' | 'accepted' | 'rejected';
export type VoteType = 'agree' | 'disagree' | 'neutral';

export interface IdeaAttachment {
  id: string;
  type: 'file' | 'link';
  name: string;
  url: string;
}

export interface IdeaComment {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  authorId: string;
  status: IdeaStatus;
  votes: Record<VoteType, string[]>;
  attachments: IdeaAttachment[];
  comments: IdeaComment[];
  createdAt: string;
}

export interface AppSettings {
  themeMode: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  currentUserId: string;
}
