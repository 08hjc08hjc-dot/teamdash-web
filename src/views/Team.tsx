'use client';

import { useTeamStore, useTaskStore } from '../store';
import { Avatar } from '../components/ui/Avatar';
import { ROLE_LABELS } from '../constants';
import { Mail, Users } from 'lucide-react';

export default function Team() {
  const members = useTeamStore((s) => s.members);
  const tasks = useTaskStore((s) => s.tasks);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">팀</h2>
          <p className="text-base text-slate-400 mt-1">{members.length}명의 팀원</p>
        </div>
      </div>

      {members.length === 0 ? (
        <div className="text-center py-16">
          <Users size={48} className="mx-auto text-slate-600 mb-3" />
          <p className="text-lg text-slate-400 font-medium">팀원이 없습니다</p>
          <p className="text-base text-slate-500 mt-1">첫 번째 팀원을 추가하세요</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {members.map((member) => {
            const activeTasks = tasks.filter((t) => t.assigneeId === member.id && t.status !== 'done').length;
            const completedTasks = tasks.filter((t) => t.assigneeId === member.id && t.status === 'done').length;

            return (
              <div key={member.id} className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-white/10 hover:bg-white/10 hover:border-white/15 transition-all">
                <div className="flex items-center gap-3">
                  <Avatar name={member.name} color={member.avatarColor} avatarUrl={member.avatarUrl} size={48} />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-white truncate">{member.name}</h3>
                    <span className={`text-sm px-2 py-0.5 rounded-full font-medium ${
                      member.role === 'owner' ? 'bg-amber-500/15 text-amber-400' :
                      member.role === 'admin' ? 'bg-teal-500/15 text-teal-400' :
                      'bg-white/5 text-slate-400'
                    }`}>
                      {ROLE_LABELS[member.role]}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-3 text-slate-400">
                  <Mail size={13} />
                  <span className="text-sm truncate">{member.email}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/10">
                  <div className="text-center">
                    <p className="text-xl font-bold text-white">{activeTasks}</p>
                    <p className="text-sm text-slate-400">진행 중</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-emerald-400">{completedTasks}</p>
                    <p className="text-sm text-slate-400">완료</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
