'use client';

import { useGoogleLogin } from '@react-oauth/google';
import { useAuthStore, useTeamStore } from '../store';
import type { GoogleUser } from '../store/authStore';
import { OWNER_EMAIL } from '../hooks/usePermissions';
import { AVATAR_COLORS } from '../theme';
import { setDriveToken } from '../lib/googleDrive';

export default function Login() {
  const login = useAuthStore((s) => s.login);
  const members = useTeamStore((s) => s.members);
  const addMember = useTeamStore((s) => s.addMember);

  const googleLogin = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/drive.file',
    onSuccess: async (tokenResponse) => {
      setDriveToken(tokenResponse.access_token);

      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });
      const info = await res.json();

      const user: GoogleUser = {
        name: info.name ?? '',
        email: info.email ?? '',
        picture: info.picture ?? '',
      };

      const existing = members.find((m) => m.email === user.email);
      if (existing) {
        login({ ...user, name: existing.name });
      } else {
        login(user);
        const role = user.email === OWNER_EMAIL ? 'owner' : 'member';
        const color = AVATAR_COLORS[members.length % AVATAR_COLORS.length];
        addMember(user.name, user.email, role, color);
      }
    },
    onError: () => {},
  });

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
            <button
              onClick={() => googleLogin()}
              className="flex items-center gap-3 px-6 py-3 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-lg"
            >
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <span className="text-gray-700 font-medium text-sm">Google로 로그인</span>
            </button>
          </div>
        </div>

        <p className="text-sm text-slate-500 mt-6">
          로그인하면 대시보드, 프로젝트, 작업을 관리할 수 있습니다
        </p>
      </div>
    </div>
  );
}
