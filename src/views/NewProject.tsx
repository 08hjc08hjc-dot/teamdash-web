'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import { useProjectStore, useTeamStore } from '../store';
import { Avatar } from '../components/ui/Avatar';
import { PROJECT_COLORS } from '../theme';
import { usePermissions } from '../hooks/usePermissions';

export default function NewProject() {
  const router = useRouter();
  const addProject = useProjectStore((s) => s.addProject);
  const members = useTeamStore((s) => s.members);
  const { canCreateProject } = usePermissions();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [memberIds, setMemberIds] = useState<string[]>([]);

  const toggleMember = (id: string) => {
    setMemberIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addProject(title.trim(), description.trim(), color, memberIds);
    router.push('/projects');
  };

  if (!canCreateProject) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400 font-medium">프로젝트 생성 권한이 없습니다</p>
        <button onClick={() => router.back()} className="text-teal-400 text-sm mt-2 hover:underline">돌아가기</button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-teal-400 mb-4 transition-colors">
        <ArrowLeft size={16} /> 뒤로
      </button>
      <h2 className="text-2xl font-bold text-white mb-6">새 프로젝트</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-200 mb-1">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="프로젝트 이름"
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 backdrop-blur"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-200 mb-1">설명</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="프로젝트 설명"
            rows={3}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 backdrop-blur resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-200 mb-2">색상</label>
          <div className="flex gap-2 flex-wrap">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                style={{ backgroundColor: c }}
              >
                {color === c && <Check size={14} className="text-white" />}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-200 mb-2">멤버</label>
          <div className="space-y-1">
            {members.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleMember(m.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                  memberIds.includes(m.id)
                    ? 'bg-teal-500/15 border border-teal-500/20'
                    : 'bg-white/5 hover:bg-white/10 border border-transparent'
                }`}
              >
                <Avatar name={m.name} color={m.avatarColor} avatarUrl={m.avatarUrl} size={28} />
                <span className="text-sm text-slate-200 flex-1 truncate">{m.name}</span>
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                  memberIds.includes(m.id) ? 'border-teal-500 bg-teal-500' : 'border-white/20'
                }`}>
                  {memberIds.includes(m.id) && <Check size={10} className="text-white" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={!title.trim()}
          className="w-full py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-medium text-sm rounded-xl transition-all"
        >
          프로젝트 만들기
        </button>
      </form>
    </div>
  );
}
