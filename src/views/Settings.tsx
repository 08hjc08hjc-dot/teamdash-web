'use client';

import { useState, useRef } from 'react';
import { googleLogout } from '@react-oauth/google';
import { useAuthStore, useTeamStore, useProjectStore, useTaskStore, useActivityStore, useSettingsStore, useWidgetStore } from '../store';
import { SEED_MEMBERS, SEED_PROJECTS, SEED_TASKS, SEED_ACTIVITIES } from '../utils/seedData';
import { Avatar } from '../components/ui/Avatar';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { PhotoCropDialog } from '../components/ui/PhotoCropDialog';
import { usePermissions, OWNER_EMAIL } from '../hooks/usePermissions';
import { ROLE_LABELS } from '../constants';
import { DatabaseBackup, Trash2, LogOut, Pencil, Check, X, Camera } from 'lucide-react';
import type { TeamRole } from '../models';

export default function Settings() {
  const authUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateAuth = useAuthStore((s) => s.updateName);
  const setCurrentUserId = useSettingsStore((s) => s.setCurrentUserId);
  const members = useTeamStore((s) => s.members);
  const setMembers = useTeamStore((s) => s.setMembers);
  const updateMember = useTeamStore((s) => s.updateMember);
  const removeMember = useTeamStore((s) => s.removeMember);
  const setProjects = useProjectStore((s) => s.setProjects);
  const setTasks = useTaskStore((s) => s.setTasks);
  const setActivities = useActivityStore((s) => s.setActivities);
  const resetWidgets = useWidgetStore((s) => s.resetWidgets);

  const { isOwner, isAdmin, member: myMember } = usePermissions();

  const [clearDialog, setClearDialog] = useState(false);
  const [demoDialog, setDemoDialog] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !myMember) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropConfirm = (croppedDataUrl: string) => {
    if (myMember) updateMember(myMember.id, { avatarUrl: croppedDataUrl });
    setCropSrc(null);
  };

  const handleLoadDemo = () => {
    setMembers(SEED_MEMBERS);
    setProjects(SEED_PROJECTS);
    setTasks(SEED_TASKS);
    setActivities(SEED_ACTIVITIES);
    setCurrentUserId('member-1');
    resetWidgets();
  };

  const handleClearAll = () => {
    setMembers([]);
    setProjects([]);
    setTasks([]);
    setActivities([]);
    setCurrentUserId('');
    resetWidgets();
    setClearDialog(false);
  };

  const availableRoles = (targetEmail: string): TeamRole[] => {
    if (targetEmail === OWNER_EMAIL) return [];
    if (isOwner) return ['owner', 'admin', 'member'];
    if (isAdmin) return ['admin', 'member'];
    return [];
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-td-text mb-6">설정</h2>

      {/* Profile */}
      <section className="mb-8">
        <h3 className="text-sm font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wide mb-1">프로필</h3>
        {authUser && (
          <div className="flex flex-wrap items-center gap-4 bg-td-card backdrop-blur-xl border border-td-border rounded-2xl p-4 mt-3">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            <button onClick={() => fileInputRef.current?.click()} className="relative shrink-0 group">
              <Avatar name={authUser.name} color={myMember?.avatarColor ?? '#0d9488'} avatarUrl={myMember?.avatarUrl} size={56} />
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={18} className="text-white" />
              </div>
            </button>
            <div className="min-w-0 flex-1 basis-40">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    autoFocus
                    className="flex-1 min-w-0 px-2 py-1 bg-td-input border border-td-input-border rounded-lg text-sm text-td-text focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && nameInput.trim()) {
                        updateAuth(nameInput.trim());
                        if (myMember) updateMember(myMember.id, { name: nameInput.trim() });
                        setEditingName(false);
                      }
                      if (e.key === 'Escape') setEditingName(false);
                    }}
                  />
                  <button
                    onClick={() => {
                      if (nameInput.trim()) {
                        updateAuth(nameInput.trim());
                        if (myMember) updateMember(myMember.id, { name: nameInput.trim() });
                        setEditingName(false);
                      }
                    }}
                    className="shrink-0 p-1 text-teal-400 hover:bg-teal-500/10 rounded transition-colors"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => setEditingName(false)}
                    className="shrink-0 p-1 text-td-text-muted hover:bg-td-hover-strong rounded transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-td-text truncate">{authUser.name}</p>
                  <button
                    onClick={() => { setNameInput(authUser.name); setEditingName(true); }}
                    className="p-1 text-td-text-muted hover:text-teal-400 hover:bg-td-hover-strong rounded transition-colors"
                  >
                    <Pencil size={12} />
                  </button>
                </div>
              )}
              <p className="text-xs text-td-text-muted truncate">{authUser.email}</p>
            </div>
            <button
              onClick={() => { googleLogout(); logout(); }}
              className="flex items-center gap-2 px-4 py-2 border border-red-500/30 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors shrink-0 max-sm:w-full max-sm:justify-center"
            >
              <LogOut size={16} /> 로그아웃
            </button>
          </div>
        )}
      </section>

      {/* Team Management - owner/admin only */}
      {(isOwner || isAdmin) && (
        <section className="mb-8">
          <h3 className="text-sm font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wide mb-3">팀 관리</h3>

          {/* Member list */}
          <div className="space-y-2">
            {members.map((m) => {
              const isMemberOwner = m.email === OWNER_EMAIL;
              const roles = availableRoles(m.email);
              return (
                <div key={m.id} className="flex items-center gap-3 p-3 bg-td-card border border-td-border rounded-xl">
                  <Avatar name={m.name} color={m.avatarColor} avatarUrl={m.avatarUrl} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-td-text truncate">{m.name}</p>
                    <p className="text-xs text-td-text-muted truncate">{m.email}</p>
                  </div>
                  {isMemberOwner ? (
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-teal-500/30 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400 font-medium">Admin</span>
                  ) : (
                    <select
                      value={m.role}
                      onChange={(e) => updateMember(m.id, { role: e.target.value as TeamRole })}
                      className="bg-td-select border border-td-border rounded-lg px-2 py-1.5 text-xs text-td-text focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                      disabled={roles.length === 0}
                    >
                      {roles.map((r) => (
                        <option key={r} value={r} className="bg-td-select text-td-text">{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                  )}
                  {!isMemberOwner && (
                    <button
                      onClick={() => removeMember(m.id)}
                      className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              );
            })}
            {members.length === 0 && (
              <p className="text-sm text-td-text-muted py-4">팀원이 없습니다. 데모 데이터를 불러오거나 직접 추가하세요.</p>
            )}
          </div>
        </section>
      )}

      {/* Data - owner only */}
      {isOwner && (
        <section className="mb-8">
          <h3 className="text-sm font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wide mb-3">데이터</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setClearDialog(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-red-500/30 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 bg-td-card backdrop-blur-xl transition-colors"
            >
              <Trash2 size={16} /> 모든 데이터 삭제
            </button>
          </div>
        </section>
      )}

      {/* About */}
      <section>
        <h3 className="text-sm font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wide mb-3">정보</h3>
        <div className="bg-td-card backdrop-blur-xl border border-td-border rounded-2xl p-4">
          <div className="flex justify-between py-1">
            <span className="text-sm text-td-text-secondary">버전</span>
            <span className="text-sm text-td-text font-medium">1.1.0</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-sm text-td-text-secondary">기술 스택</span>
            <span className="text-sm text-td-text font-medium">Next.js + Tailwind</span>
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={clearDialog}
        title="데이터 삭제"
        message="모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmLabel="삭제"
        onConfirm={handleClearAll}
        onCancel={() => setClearDialog(false)}
      />

      <PhotoCropDialog
        open={!!cropSrc}
        imageSrc={cropSrc ?? ''}
        onConfirm={handleCropConfirm}
        onCancel={() => setCropSrc(null)}
      />
    </div>
  );
}
