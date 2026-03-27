import { useAuthStore, useTeamStore } from '../store';
import type { TeamRole } from '../models';

export const OWNER_EMAIL = '08hjc08hjc@gmail.com';

export function usePermissions() {
  const user = useAuthStore((s) => s.user);
  const members = useTeamStore((s) => s.members);

  const email = user?.email ?? '';
  const member = members.find((m) => m.email === email);

  let role: TeamRole = 'member';
  if (email === OWNER_EMAIL) {
    role = 'owner';
  } else if (member) {
    role = member.role;
  }

  return {
    role,
    member,
    email,
    isOwner: role === 'owner',
    isAdmin: role === 'owner' || role === 'admin',
    canManageTeam: role === 'owner' || role === 'admin',
    canAssignOthers: role === 'owner' || role === 'admin',
    canCreateProject: role === 'owner' || role === 'admin' || role === 'member',
    canGrantRole: (targetRole: TeamRole): boolean => {
      if (role === 'owner') return true;
      if (role === 'admin') return targetRole !== 'owner';
      return false;
    },
  };
}
