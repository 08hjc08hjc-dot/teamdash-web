'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FolderKanban, ClipboardCheck, Users, Settings, X, LogOut, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useAuthStore, useTeamStore } from '../../store';
import { Avatar } from '../ui/Avatar';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: '대시보드' },
  { to: '/projects', icon: FolderKanban, label: '프로젝트' },
  { to: '/tasks', icon: ClipboardCheck, label: '작업 보드' },
  { to: '/team', icon: Users, label: '팀' },
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
          fixed top-0 left-0 z-50 h-full w-64 bg-[#0f0d1a]/90 backdrop-blur-2xl border-r border-white/10
          transform transition-transform duration-200 ease-in-out
          flex flex-col md:hidden
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between h-16 px-5 border-b border-white/10 shrink-0 pt-[env(safe-area-inset-top)]">
          <Link href="/" onClick={onClose} className="text-xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">팀대시</Link>
          <button onClick={onClose} className="p-1.5 rounded-lg active:bg-white/10 transition-colors">
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        {authUser && (
          <Link href="/settings" onClick={onClose} className="block px-4 py-4 border-b border-white/5 active:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <Avatar name={authUser.name} color={myMember?.avatarColor ?? '#0d9488'} avatarUrl={myMember?.avatarUrl} size={36} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{authUser.name}</p>
                <p className="text-xs text-slate-500 truncate">{authUser.email}</p>
              </div>
            </div>
          </Link>
        )}

        <nav className="flex-1 p-3 overflow-y-auto relative">
          {/* Sliding indicator */}
          {activeIdx >= 0 && (
            <div
              className="absolute left-3 right-3 bg-teal-500/15 rounded-xl pointer-events-none transition-all duration-300 ease-out"
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
                    isActive ? 'text-teal-300' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-3 border-t border-white/5 shrink-0">
          <button
            onClick={() => { logout(); onClose(); }}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
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
          bg-[#0f0d1a]/90 backdrop-blur-2xl border-r border-white/10
          transition-all duration-200 ease-in-out shrink-0
          ${collapsed ? 'w-[4.5rem]' : 'w-64'}
        `}
      >
        {/* Header */}
        <div className={`flex items-center border-b border-white/10 shrink-0 pt-[calc(2.5rem+env(safe-area-inset-top))] pb-4 lg:pt-5 lg:pb-4 ${collapsed ? 'justify-center px-2' : 'justify-between px-5'}`}>
          {!collapsed && (
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">팀대시</Link>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            title={collapsed ? '메뉴 펼치기' : '메뉴 접기'}
          >
            {collapsed ? <ChevronsRight size={18} className="text-slate-400" /> : <ChevronsLeft size={18} className="text-slate-400" />}
          </button>
        </div>

        {/* Nav */}
        <nav className={`flex-1 overflow-y-auto relative ${collapsed ? 'p-2' : 'p-3'}`}>
          {/* Sliding indicator */}
          {activeIdx >= 0 && (
            <div
              className={`absolute bg-teal-500/15 rounded-xl pointer-events-none transition-all duration-300 ease-out ${collapsed ? 'left-2 right-2' : 'left-3 right-3'}`}
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
                    isActive ? 'text-teal-300' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <Icon size={18} />
                  {!collapsed && label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User profile (bottom) */}
        {authUser && (
          <Link
            href="/settings"
            title={collapsed ? authUser.name : undefined}
            className={`border-t border-white/5 shrink-0 hover:bg-white/5 transition-colors ${collapsed ? 'p-3 flex justify-center' : 'px-4 py-3 flex items-center gap-3'}`}
          >
            <Avatar name={authUser.name} color={myMember?.avatarColor ?? '#0d9488'} avatarUrl={myMember?.avatarUrl} size={32} />
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{authUser.name}</p>
                <p className="text-xs text-slate-500 truncate">{authUser.email}</p>
              </div>
            )}
          </Link>
        )}
      </aside>
    </>
  );
}
