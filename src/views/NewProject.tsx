'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import { useProjectStore } from '../store';
import { PROJECT_COLORS } from '../theme';
import { usePermissions } from '../hooks/usePermissions';

export default function NewProject() {
  const router = useRouter();
  const addProject = useProjectStore((s) => s.addProject);
  const { canCreateProject } = usePermissions();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PROJECT_COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addProject(title.trim(), description.trim(), color, []);
    router.push('/projects');
  };

  if (!canCreateProject) {
    return (
      <div className="text-center py-16">
        <p className="text-td-text-muted font-medium">프로젝트 생성 권한이 없습니다</p>
        <button onClick={() => router.back()} className="text-teal-400 text-sm mt-2 hover:underline">돌아가기</button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-td-text-muted hover:text-teal-400 mb-4 transition-colors">
        <ArrowLeft size={16} /> 뒤로
      </button>
      <h2 className="text-2xl font-bold text-td-text mb-6">새 프로젝트</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-td-text-bright mb-1">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="프로젝트 이름"
            className="w-full px-4 py-2.5 bg-td-card border border-td-border rounded-xl text-sm text-td-text placeholder:text-td-text-faint focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 backdrop-blur"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-td-text-bright mb-1">설명</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="프로젝트 설명"
            rows={3}
            className="w-full px-4 py-2.5 bg-td-card border border-td-border rounded-xl text-sm text-td-text placeholder:text-td-text-faint focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 backdrop-blur resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-td-text-bright mb-2">색상</label>
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
