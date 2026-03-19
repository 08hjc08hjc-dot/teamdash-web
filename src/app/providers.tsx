'use client';

import { useState, useEffect, useRef } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Link from 'next/link';
import { Menu, Sun, Moon } from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { useAuthStore, useTeamStore, useProjectStore, useTaskStore, useActivityStore, useSettingsStore } from '../store';
import { SEED_MEMBERS, SEED_PROJECTS, SEED_TASKS, SEED_ACTIVITIES } from '../utils/seedData';
import { Avatar } from '../components/ui/Avatar';
import Login from '../views/Login';
import { initFirestoreSync } from '../lib/firestoreSync';

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
  const themeMode = useSettingsStore((s) => s.themeMode);

  useEffect(() => {
    if (themeMode === 'light') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gradient: any;
    let cancelled = false;

    (async () => {
      const { WaveGradient } = await import('wave-gradient');
      if (cancelled) return;
      gradient = new WaveGradient(canvas, {
        colors: ['#0a0a0a', '#171717', '#111111', '#1c1c1c'],
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
  }, [themeMode]);

  if (themeMode === 'light') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 animate-bg-shift"
        style={{ background: 'linear-gradient(-45deg, #e2e8f0, #cbd5e1, #e2e8f0, #d1d5db, #e5e7eb, #e2e8f0)', backgroundSize: '300% 300%' }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}

function ThemeToggle() {
  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);

  return (
    <button
      onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
      className="relative w-10 h-[22px] rounded-full bg-td-border hover:bg-td-hover-strong border border-td-border-strong transition-colors"
    >
      <div className={`absolute top-[2px] w-4 h-4 rounded-full shadow flex items-center justify-center transition-all duration-200 ${themeMode === 'dark' ? 'left-[1.25rem] bg-slate-700' : 'left-[2px] bg-white'}`}>
        {themeMode === 'dark' ? <Moon size={10} className="text-blue-300" /> : <Sun size={10} className="text-amber-500" />}
      </div>
    </button>
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
    <div className="min-h-screen overflow-hidden">
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
          <header className="flex items-center justify-between px-4 border-b border-td-border bg-td-bg-soft backdrop-blur-xl md:hidden shrink-0 pt-[calc(0.75rem+env(safe-area-inset-top))] h-[calc(4.5rem+env(safe-area-inset-top))]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-xl active:bg-td-hover-strong transition-colors"
              >
                <Menu size={18} className="text-td-text-secondary" />
              </button>
              <Link href="/" className="text-base font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">팀대시</Link>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {authUser && (
                <Link href="/settings">
                  <Avatar name={authUser.name} color={myMember?.avatarColor ?? '#0d9488'} avatarUrl={myMember?.avatarUrl} size={30} />
                </Link>
              )}
            </div>
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

  const themeMode = useSettingsStore((s) => s.themeMode);

  useEffect(() => {
    const cleanup = initFirestoreSync();
    return cleanup;
  }, []);

  // Apply .dark class to <html>
  useEffect(() => {
    const html = document.documentElement;
    if (themeMode === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [themeMode]);

  const user = useAuthStore((s) => s.user);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="min-h-screen bg-td-bg flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-400 font-medium mb-2">NEXT_PUBLIC_GOOGLE_CLIENT_ID가 설정되지 않았습니다</p>
          <p className="text-td-text-faint text-sm">.env 파일에 Google OAuth Client ID를 추가하세요</p>
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
