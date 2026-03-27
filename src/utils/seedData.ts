import type { TeamMember, Project, Task, Activity } from '../models';
import { AVATAR_COLORS, PROJECT_COLORS } from '../theme';

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();
const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400000).toISOString();

export const SEED_MEMBERS: TeamMember[] = [
  { id: 'member-1', name: '김민준', email: 'minjun@teamdash.io', role: 'owner', avatarColor: AVATAR_COLORS[0], createdAt: daysAgo(90) },
  { id: 'member-2', name: '이서연', email: 'seoyeon@teamdash.io', role: 'admin', avatarColor: AVATAR_COLORS[1], createdAt: daysAgo(85) },
  { id: 'member-3', name: '박지호', email: 'jiho@teamdash.io', role: 'member', avatarColor: AVATAR_COLORS[2], createdAt: daysAgo(60) },
  { id: 'member-4', name: '최수아', email: 'sua@teamdash.io', role: 'member', avatarColor: AVATAR_COLORS[3], createdAt: daysAgo(45) },
  { id: 'member-5', name: '정현우', email: 'hyunwoo@teamdash.io', role: 'member', avatarColor: AVATAR_COLORS[4], createdAt: daysAgo(30) },
];

export const SEED_PROJECTS: Project[] = [
  { id: 'proj-1', title: '모바일 앱 v2.0', description: '새로운 기능과 개선된 UX로 모바일 앱 전면 리디자인', status: 'active', color: PROJECT_COLORS[0], memberIds: ['member-1', 'member-2', 'member-3'], createdAt: daysAgo(30), updatedAt: daysAgo(1) },
  { id: 'proj-2', title: '마케팅 웹사이트', description: '애니메이션과 CMS가 포함된 모던 랜딩 페이지 구축', status: 'active', color: PROJECT_COLORS[1], memberIds: ['member-2', 'member-4'], createdAt: daysAgo(20), updatedAt: daysAgo(2) },
  { id: 'proj-3', title: 'API 인프라', description: '백엔드를 마이크로서비스 아키텍처로 마이그레이션', status: 'active', color: PROJECT_COLORS[2], memberIds: ['member-1', 'member-5', 'member-3'], createdAt: daysAgo(45), updatedAt: daysAgo(3) },
  { id: 'proj-4', title: '사용자 리서치', description: 'Q2 로드맵을 위한 사용자 인터뷰 및 사용성 테스트', status: 'completed', color: PROJECT_COLORS[3], memberIds: ['member-4', 'member-2'], createdAt: daysAgo(60), updatedAt: daysAgo(5) },
];

export const SEED_TASKS: Task[] = [
  { id: 'task-1', title: '새 온보딩 플로우 디자인', description: '온보딩용 와이어프레임 및 고화질 목업 제작', status: 'done', priority: 'high', projectId: 'proj-1', assigneeIds: ['member-2'], dueDate: daysAgo(3), order: 0, createdAt: daysAgo(20), updatedAt: daysAgo(3) },
  { id: 'task-2', title: '푸시 알림 구현', description: 'iOS 및 Android용 Firebase Cloud Messaging 설정', status: 'in_progress', priority: 'high', projectId: 'proj-1', assigneeIds: ['member-3'], dueDate: daysFromNow(5), order: 0, createdAt: daysAgo(10), updatedAt: daysAgo(1) },
  { id: 'task-3', title: '생체 인증 추가', description: 'Face ID 및 Touch ID를 활용한 보안 로그인 지원', status: 'todo', priority: 'medium', projectId: 'proj-1', assigneeIds: ['member-1'], dueDate: daysFromNow(14), order: 0, createdAt: daysAgo(5), updatedAt: daysAgo(5) },
  { id: 'task-4', title: '성능 최적화', description: '앱 시작 시간 단축 및 리스트 렌더링 최적화', status: 'todo', priority: 'medium', projectId: 'proj-1', assigneeIds: [], dueDate: daysFromNow(21), order: 1, createdAt: daysAgo(3), updatedAt: daysAgo(3) },
  { id: 'task-5', title: '인증 모듈 단위 테스트 작성', description: '인증 플로우 80% 커버리지 달성', status: 'in_progress', priority: 'medium', projectId: 'proj-1', assigneeIds: ['member-1'], dueDate: daysFromNow(7), order: 1, createdAt: daysAgo(7), updatedAt: daysAgo(2) },
  { id: 'task-6', title: '히어로 섹션 디자인', description: '제품 스크린샷과 CTA가 포함된 애니메이션 히어로', status: 'done', priority: 'high', projectId: 'proj-2', assigneeIds: ['member-4'], dueDate: daysAgo(5), order: 0, createdAt: daysAgo(15), updatedAt: daysAgo(5) },
  { id: 'task-7', title: 'CMS 연동 설정', description: '블로그 및 콘텐츠 관리용 Sanity CMS 연결', status: 'in_progress', priority: 'medium', projectId: 'proj-2', assigneeIds: ['member-2'], dueDate: daysFromNow(3), order: 0, createdAt: daysAgo(8), updatedAt: daysAgo(1) },
  { id: 'task-8', title: 'SEO 최적화', description: '메타 태그, 사이트맵, 구조화 데이터, 페이지 속도', status: 'todo', priority: 'low', projectId: 'proj-2', assigneeIds: [], dueDate: daysFromNow(10), order: 0, createdAt: daysAgo(4), updatedAt: daysAgo(4) },
  { id: 'task-9', title: 'API 게이트웨이 설계', description: 'Kong 또는 AWS API Gateway 라우팅 설정', status: 'done', priority: 'urgent', projectId: 'proj-3', assigneeIds: ['member-5'], dueDate: daysAgo(7), order: 0, createdAt: daysAgo(30), updatedAt: daysAgo(7) },
  { id: 'task-10', title: '사용자 서비스 마이그레이션', description: '사용자 관리를 독립 마이크로서비스로 분리', status: 'in_progress', priority: 'high', projectId: 'proj-3', assigneeIds: ['member-5'], dueDate: daysFromNow(10), order: 0, createdAt: daysAgo(14), updatedAt: daysAgo(1) },
  { id: 'task-11', title: 'CI/CD 파이프라인 구축', description: '자동 테스트 및 배포를 위한 GitHub Actions 워크플로우', status: 'todo', priority: 'high', projectId: 'proj-3', assigneeIds: ['member-3'], dueDate: daysFromNow(14), order: 0, createdAt: daysAgo(7), updatedAt: daysAgo(7) },
  { id: 'task-12', title: '데이터베이스 마이그레이션 스크립트', description: 'PostgreSQL용 롤백 안전 마이그레이션 스크립트 작성', status: 'todo', priority: 'urgent', projectId: 'proj-3', assigneeIds: ['member-1'], dueDate: daysFromNow(5), order: 1, createdAt: daysAgo(5), updatedAt: daysAgo(5) },
];

export const SEED_ACTIVITIES: Activity[] = [
  { id: 'act-1', type: 'task_completed', actorId: 'member-5', targetId: 'task-9', targetTitle: 'API 게이트웨이 설계', createdAt: hoursAgo(2) },
  { id: 'act-2', type: 'task_moved', actorId: 'member-2', targetId: 'task-7', targetTitle: 'CMS 연동 설정', metadata: { from: '할 일', to: '진행 중' }, createdAt: hoursAgo(5) },
  { id: 'act-3', type: 'task_created', actorId: 'member-1', targetId: 'task-12', targetTitle: '데이터베이스 마이그레이션 스크립트', createdAt: hoursAgo(8) },
  { id: 'act-4', type: 'project_created', actorId: 'member-2', targetId: 'proj-2', targetTitle: '마케팅 웹사이트', createdAt: daysAgo(1) },
  { id: 'act-5', type: 'member_added', actorId: 'member-1', targetId: 'member-5', targetTitle: '정현우', createdAt: daysAgo(2) },
  { id: 'act-6', type: 'task_completed', actorId: 'member-4', targetId: 'task-6', targetTitle: '히어로 섹션 디자인', createdAt: daysAgo(3) },
  { id: 'act-7', type: 'task_moved', actorId: 'member-3', targetId: 'task-2', targetTitle: '푸시 알림 구현', metadata: { from: '할 일', to: '진행 중' }, createdAt: daysAgo(4) },
  { id: 'act-8', type: 'task_completed', actorId: 'member-2', targetId: 'task-1', targetTitle: '새 온보딩 플로우 디자인', createdAt: daysAgo(5) },
];
