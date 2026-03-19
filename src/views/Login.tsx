'use client';

import { GoogleLogin } from '@react-oauth/google';
import { useAuthStore, useTeamStore } from '../store';
import type { GoogleUser } from '../store/authStore';
import { OWNER_EMAIL } from '../hooks/usePermissions';
import { AVATAR_COLORS } from '../theme';

function decodeJwt(token: string): Record<string, unknown> {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

export default function Login() {
  const login = useAuthStore((s) => s.login);
  const members = useTeamStore((s) => s.members);
  const addMember = useTeamStore((s) => s.addMember);

  const handleSuccess = (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) return;
    const payload = decodeJwt(credentialResponse.credential);
    const user: GoogleUser = {
      name: (payload.name as string) ?? '',
      email: (payload.email as string) ?? '',
      picture: (payload.picture as string) ?? '',
    };
    // Auto-add to team if not already a member; preserve existing name
    const existing = members.find((m) => m.email === user.email);
    if (existing) {
      login({ ...user, name: existing.name });
    } else {
      login(user);
      const role = user.email === OWNER_EMAIL ? 'owner' : 'member';
      const color = AVATAR_COLORS[members.length % AVATAR_COLORS.length];
      addMember(user.name, user.email, role, color);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0d1a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent mb-2">
          팀대시
        </h1>
        <p className="text-slate-400 mb-8">팀 프로젝트 관리를 시작하려면 로그인하세요</p>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          <p className="text-white font-medium mb-6">Google 계정으로 로그인</p>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => {}}
              shape="pill"
              size="large"
              theme="filled_black"
              width={280}
            />
          </div>
        </div>

        <p className="text-sm text-slate-500 mt-6">
          로그인하면 대시보드, 프로젝트, 작업을 관리할 수 있습니다
        </p>
      </div>
    </div>
  );
}
