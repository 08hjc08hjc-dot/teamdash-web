'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FolderKanban, ClipboardCheck, Users, Lightbulb, Settings, X, LogOut, ChevronsLeft, ChevronsRight, Sun, Moon } from 'lucide-react';
import { useAuthStore, useTeamStore, useSettingsStore } from '../../store';
import { Avatar } from '../ui/Avatar';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: '대시보드' },
  { to: '/projects', icon: FolderKanban, label: '프로젝트' },
  { to: '/tasks', icon: ClipboardCheck, label: '작업 보드' },
  { to: '/team', icon: Users, label: '팀' },
  { to: '/ideas', icon: Lightbulb, label: '아이디어' },
  { to: '/settings', icon: Settings, label: '설정' },
];

function getActiveIndex(pathname: string) {
  // Exact match for home, startsWith for others
  for (let i = NAV_ITEMS.length - 1; i >= 0; i--) {
    const item = NAV_ITEMS[i];
    if (item.to === '/') {
      if (pathname === '/') return i;
    } else if (pathname.startsWith(item.to)) {
      return i;
    }
  }
  return -1;
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ open, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  const authUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const members = useTeamStore((s) => s.members);
  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const toggleTheme = () => setThemeMode(themeMode === 'dark' ? 'light' : 'dark');
  const myMember = members.find((m) => m.email === authUser?.email);
  const pathname = usePathname() ?? '/';
  const activeIdx = useMemo(() => getActiveIndex(pathname), [pathname]);

  // Item heights: mobile = 40px (py-2.5 + text), desktop expanded = 40px, collapsed = 42px (p-3)
  // gap from space-y-1 = 4px
  const mobileItemH = 40;
  const mobileGap = 4;
  const desktopItemH = collapsed ? 42 : 40;
  const desktopGap = 4;

  return (
    <>
      {/* Mobile overlay (phone only) */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={onClose} />
      )}

      {/* Mobile slide-out sidebar (phone only) */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-td-sidebar backdrop-blur-2xl border-r border-td-border
          transform transition-transform duration-200 ease-in-out
          flex flex-col md:hidden
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between h-16 px-5 border-b border-td-border shrink-0 pt-[env(safe-area-inset-top)]">
          <Link href="/" onClick={onClose} className="text-xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">팀대시</Link>
          <button onClick={onClose} className="p-1.5 rounded-lg active:bg-td-hover-strong transition-colors">
            <X size={18} className="text-td-text-muted" />
          </button>
        </div>

        {authUser && (
          <Link href="/settings" onClick={onClose} className="block px-4 py-4 border-b border-td-border-subtle active:bg-td-hover transition-colors">
            <div className="flex items-center gap-3">
              <Avatar name={authUser.name} color={myMember?.avatarColor ?? '#0d9488'} avatarUrl={myMember?.avatarUrl} size={36} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-td-text truncate">{authUser.name}</p>
                <p className="text-xs text-td-text-faint truncate">{authUser.email}</p>
              </div>
            </div>
          </Link>
        )}

        <nav className="flex-1 p-3 overflow-y-auto relative">
          {/* Sliding indicator */}
          {activeIdx >= 0 && (
            <div
              className="absolute left-3 right-3 bg-teal-500/25 dark:bg-teal-500/15 rounded-xl pointer-events-none transition-all duration-300 ease-out"
              style={{
                top: `${12 + activeIdx * (mobileItemH + mobileGap)}px`,
                height: `${mobileItemH}px`,
              }}
            />
          )}
          <div className="relative z-10 space-y-1">
            {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
              const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  href={to}

                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 ${
                    isActive ? 'text-teal-700 dark:text-teal-300' : 'text-td-text-muted hover:bg-td-hover hover:text-td-text-bright'
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-3 border-t border-td-border-subtle shrink-0 space-y-1">
          <button onClick={toggleTheme} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-td-text-muted hover:bg-td-hover hover:text-td-text-bright transition-all">
            <div className="relative w-8 h-[18px] rounded-full bg-td-border border border-td-border-strong transition-colors shrink-0">
              <div className={`absolute top-[2px] w-3.5 h-3.5 rounded-full shadow flex items-center justify-center transition-all duration-200 ${themeMode === 'dark' ? 'left-[0.875rem] bg-slate-700' : 'left-[2px] bg-white'}`}>
                {themeMode === 'dark' ? <Moon size={8} className="text-blue-300" /> : <Sun size={8} className="text-amber-500" />}
              </div>
            </div>
            {themeMode === 'dark' ? '다크 모드' : '라이트 모드'}
          </button>
          <button
            onClick={() => { logout(); onClose(); }}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-td-text-muted hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <LogOut size={18} />
            로그아웃
          </button>
        </div>
      </aside>

      {/* Tablet & Desktop persistent sidebar */}
      <aside
        className={`
          hidden md:flex md:flex-col md:static md:z-auto h-full
          bg-td-sidebar backdrop-blur-2xl border-r border-td-border
          transition-all duration-200 ease-in-out shrink-0
          ${collapsed ? 'w-[4.5rem]' : 'w-64'}
        `}
      >
        {/* Header */}
        <div className={`flex items-center border-b border-td-border shrink-0 pt-[calc(2.5rem+env(safe-area-inset-top))] pb-4 lg:pt-5 lg:pb-4 ${collapsed ? 'justify-center px-2' : 'justify-between px-5'}`}>
          {!collapsed && (
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">팀대시</Link>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-xl hover:bg-td-hover-strong transition-colors"
            title={collapsed ? '메뉴 펼치기' : '메뉴 접기'}
          >
            {collapsed ? <ChevronsRight size={18} className="text-td-text-muted" /> : <ChevronsLeft size={18} className="text-td-text-muted" />}
          </button>
        </div>

        {/* Nav */}
        <nav className={`flex-1 overflow-y-auto relative ${collapsed ? 'p-2' : 'p-3'}`}>
          {/* Sliding indicator */}
          {activeIdx >= 0 && (
            <div
              className={`absolute bg-teal-500/25 dark:bg-teal-500/15 rounded-xl pointer-events-none transition-all duration-300 ease-out ${collapsed ? 'left-2 right-2' : 'left-3 right-3'}`}
              style={{
                top: `${(collapsed ? 8 : 12) + activeIdx * (desktopItemH + desktopGap)}px`,
                height: `${desktopItemH}px`,
              }}
            />
          )}
          <div className="relative z-10 space-y-1">
            {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
              const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  href={to}

                  title={collapsed ? label : undefined}
                  className={`flex items-center rounded-xl text-sm font-medium transition-colors duration-200 ${
                    collapsed ? 'justify-center p-3' : 'gap-3 px-4 py-2.5'
                  } ${
                    isActive ? 'text-teal-700 dark:text-teal-300' : 'text-td-text-muted hover:bg-td-hover hover:text-td-text-bright'
                  }`}
                >
                  <Icon size={18} />
                  {!collapsed && label}
                </Link>
              );
            })}
            {/* Theme toggle - below settings */}
            <div className={`border-t border-td-border-subtle ${collapsed ? 'mx-1 pt-1 mt-1' : 'mx-2 pt-1 mt-1'}`}>
              <button
                onClick={toggleTheme}
                title={collapsed ? (themeMode === 'dark' ? '라이트 모드' : '다크 모드') : undefined}
                className={`flex items-center rounded-xl text-sm font-medium text-td-text-muted hover:bg-td-hover hover:text-td-text-bright transition-all w-full ${collapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'}`}
              >
                <div className="relative w-10 h-[22px] rounded-full bg-td-border border border-td-border-strong transition-colors shrink-0">
                  <div className={`absolute top-[2px] w-4 h-4 rounded-full shadow flex items-center justify-center transition-all duration-200 ${themeMode === 'dark' ? 'left-[1.25rem] bg-slate-700' : 'left-[2px] bg-white'}`}>
                    {themeMode === 'dark' ? <Moon size={10} className="text-blue-300" /> : <Sun size={10} className="text-amber-500" />}
                  </div>
                </div>
                {!collapsed && (themeMode === 'dark' ? '다크 모드' : '라이트 모드')}
              </button>
            </div>
          </div>
        </nav>

        {/* User profile (bottom) */}
        {authUser && (
          <Link
            href="/settings"
            title={collapsed ? authUser.name : undefined}
            className={`border-t border-td-border-subtle shrink-0 hover:bg-td-hover transition-colors ${collapsed ? 'p-3 flex justify-center' : 'px-4 py-3 flex items-center gap-3'}`}
          >
            <Avatar name={authUser.name} color={myMember?.avatarColor ?? '#0d9488'} avatarUrl={myMember?.avatarUrl} size={32} />
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-semibold text-td-text truncate">{authUser.name}</p>
                <p className="text-xs text-td-text-faint truncate">{authUser.email}</p>
              </div>
            )}
          </Link>
        )}
      </aside>
    </>
  );
}
