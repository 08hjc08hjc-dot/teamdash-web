'use client';

import { useState, useEffect, useRef } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { useAuthStore, useTeamStore, useProjectStore, useTaskStore, useActivityStore, useSettingsStore } from '../store';
import { SEED_MEMBERS, SEED_PROJECTS, SEED_TASKS, SEED_ACTIVITIES } from '../utils/seedData';
import { Avatar } from '../components/ui/Avatar';
import Login from '../views/Login';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

// Seed data initialization
let seeded = false;
function ensureSeedData() {
  if (seeded) return;
  seeded = true;
  if (useTeamStore.getState().members.length === 0) {
    useTeamStore.getState().setMembers(SEED_MEMBERS);
    useProjectStore.getState().setProjects(SEED_PROJECTS);
    useTaskStore.getState().setTasks(SEED_TASKS);
    useActivityStore.getState().setActivities(SEED_ACTIVITIES);
    useSettingsStore.getState().setCurrentUserId('member-1');
  }
}

function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gradient: any;
    let cancelled = false;

    (async () => {
      const { WaveGradient } = await import('wave-gradient');
      if (cancelled) return;
      gradient = new WaveGradient(canvas, {
        colors: ['#061a20', '#08232b', '#041518', '#020d11'],
        speed: 1.0,
        amplitude: 320,
        fps: 30,
        seed: 5,
      });
    })();

    return () => {
      cancelled = true;
      if (gradient && typeof gradient.pause === 'function') gradient.pause();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const authUser = useAuthStore((s) => s.user);
  const members = useTeamStore((s) => s.members);
  const myMember = members.find((m) => m.email === authUser?.email);

  useEffect(() => {
    if (myMember) useSettingsStore.getState().setCurrentUserId(myMember.id);
  }, [myMember?.id]);

  return (
    <div className="bg-[#0f0d1a] min-h-screen overflow-hidden">
      <AnimatedBackground />

      <div className="flex h-screen relative z-10">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top bar (phone only) */}
          <header className="flex items-center justify-between px-4 border-b border-white/10 bg-[#0f0d1a]/80 backdrop-blur-xl md:hidden shrink-0 pt-[calc(0.75rem+env(safe-area-inset-top))] h-[calc(4.5rem+env(safe-area-inset-top))]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-xl active:bg-white/10 transition-colors"
              >
                <Menu size={18} className="text-slate-300" />
              </button>
              <Link href="/" className="text-base font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">팀대시</Link>
            </div>
            {authUser && (
              <Link href="/settings">
                <Avatar name={authUser.name} color={myMember?.avatarColor ?? '#0d9488'} avatarUrl={myMember?.avatarUrl} size={30} />
              </Link>
            )}
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 md:pt-[calc(2.5rem+env(safe-area-inset-top))] lg:pt-8 pb-[calc(3rem+env(safe-area-inset-bottom))] sm:pb-6 md:pb-[calc(3rem+env(safe-area-inset-bottom))]">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  ensureSeedData();

  const user = useAuthStore((s) => s.user);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="min-h-screen bg-[#0f0d1a] flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-400 font-medium mb-2">NEXT_PUBLIC_GOOGLE_CLIENT_ID가 설정되지 않았습니다</p>
          <p className="text-slate-500 text-sm">.env 파일에 Google OAuth Client ID를 추가하세요</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {user ? (
        <AppShell>{children}</AppShell>
      ) : (
        <Login />
      )}
    </GoogleOAuthProvider>
  );
}
