'use client';

import { useState, useRef } from 'react';
import { Lightbulb, Plus, X, Check, Trash2, Pencil, MessageCircle, Paperclip, Link2, ChevronDown, ChevronUp } from 'lucide-react';
import { useIdeaStore, useTeamStore, useActivityStore } from '../store';
import { usePermissions } from '../hooks/usePermissions';
import { Avatar } from '../components/ui/Avatar';
import { formatRelativeDate } from '../utils/formatters';
import type { IdeaStatus, IdeaAttachment, VoteType } from '../models';
import { uploadToGoogleDrive } from '../lib/googleDrive';

const STATUS_LABELS: Record<IdeaStatus, string> = { open: '검토중', accepted: '채택', rejected: '보류' };
const STATUS_COLORS: Record<IdeaStatus, string> = {
  open: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/20',
  accepted: 'bg-teal-500/15 text-teal-300 border-teal-500/20',
  rejected: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
};
const VOTE_CONFIG: { type: VoteType; label: string; activeColor: string }[] = [
  { type: 'agree', label: '찬성', activeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  { type: 'disagree', label: '반대', activeColor: 'bg-red-500/20 text-red-300 border-red-500/30' },
  { type: 'neutral', label: '중립', activeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
];
const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'open', label: '검토중' },
  { value: 'accepted', label: '채택' },
  { value: 'rejected', label: '보류' },
];

export default function Ideas() {
  const ideas = useIdeaStore((s) => s.ideas);
  const addIdea = useIdeaStore((s) => s.addIdea);
  const updateIdea = useIdeaStore((s) => s.updateIdea);
  const setVote = useIdeaStore((s) => s.setVote);
  const updateStatus = useIdeaStore((s) => s.updateStatus);
  const removeIdea = useIdeaStore((s) => s.removeIdea);
  const addComment = useIdeaStore((s) => s.addComment);
  const updateComment = useIdeaStore((s) => s.updateComment);
  const removeComment = useIdeaStore((s) => s.removeComment);
  const members = useTeamStore((s) => s.members);
  const addActivity = useActivityStore((s) => s.addActivity);
  const { isOwner, isAdmin, member: myMember } = usePermissions();

  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<IdeaAttachment[]>([]);
  const [linkInput, setLinkInput] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Edit idea state
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editAttachments, setEditAttachments] = useState<IdeaAttachment[]>([]);
  const [editLinkInput, setEditLinkInput] = useState('');
  const [showEditLinkInput, setShowEditLinkInput] = useState(false);
  const editFileRef = useRef<HTMLInputElement>(null);

  // Comments
  const [expandedIdea, setExpandedIdea] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');

  const filtered = ideas.filter((idea) => filter === 'all' || idea.status === filter);
  const canManage = isOwner || isAdmin;

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'new' | 'edit') => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (file.size > MAX_FILE_SIZE) {
      alert(`파일 크기가 너무 큽니다 (${(file.size / (1024 * 1024)).toFixed(1)}MB). 최대 50MB까지 첨부할 수 있습니다.`);
      return;
    }
    try {
      const url = await uploadToGoogleDrive(file);
      const att: IdeaAttachment = { id: Date.now().toString(), type: 'file', name: file.name, url };
      if (target === 'new') setAttachments((p) => [...p, att]);
      else setEditAttachments((p) => [...p, att]);
    } catch (err) {
      alert('파일 업로드에 실패했습니다.');
      console.error('[Upload]', err);
    }
  };

  const addLink = (url: string, target: 'new' | 'edit') => {
    if (!url.trim()) return;
    const finalUrl = url.startsWith('http') ? url : `https://${url}`;
    const att: IdeaAttachment = { id: Date.now().toString(), type: 'link', name: finalUrl, url: finalUrl };
    if (target === 'new') { setAttachments((p) => [...p, att]); setLinkInput(''); setShowLinkInput(false); }
    else { setEditAttachments((p) => [...p, att]); setEditLinkInput(''); setShowEditLinkInput(false); }
  };

  const handleSubmit = () => {
    if (!title.trim() || !myMember) return;
    addIdea({ title: title.trim(), description: description.trim(), authorId: myMember.id, attachments });
    addActivity({ type: 'idea_created', actorId: myMember.id, targetId: '', targetTitle: title.trim() });
    setTitle(''); setDescription(''); setAttachments([]); setShowForm(false);
  };

  const startEditIdea = (id: string) => {
    const idea = ideas.find((i) => i.id === id);
    if (!idea) return;
    setEditingIdeaId(id); setEditTitle(idea.title); setEditDesc(idea.description); setEditAttachments([...idea.attachments]); setShowEditLinkInput(false);
  };

  const saveEditIdea = () => {
    if (!editingIdeaId || !editTitle.trim()) return;
    updateIdea(editingIdeaId, { title: editTitle.trim(), description: editDesc.trim(), attachments: editAttachments });
    setEditingIdeaId(null);
  };

  const getMyVote = (ideaId: string): VoteType | null => {
    if (!myMember) return null;
    const idea = ideas.find((i) => i.id === ideaId);
    if (!idea) return null;
    if (idea.votes.agree.includes(myMember.id)) return 'agree';
    if (idea.votes.disagree.includes(myMember.id)) return 'disagree';
    if (idea.votes.neutral.includes(myMember.id)) return 'neutral';
    return null;
  };

  const renderAttachments = (atts: IdeaAttachment[], onRemove?: (id: string) => void) => (
    atts.length > 0 && (
      <div className="flex flex-wrap gap-2 mt-2">
        {atts.map((att) => (
          <div key={att.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs">
            {att.type === 'link' ? <Link2 size={12} className="text-teal-400 shrink-0" /> : <Paperclip size={12} className="text-slate-400 shrink-0" />}
            {att.type === 'link' ? (
              <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline truncate max-w-[200px]">{att.name}</a>
            ) : (
              <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-teal-400 hover:underline truncate max-w-[200px] cursor-pointer">{att.name}</a>
            )}
            {onRemove && (
              <button onClick={() => onRemove(att.id)} className="text-slate-500 hover:text-red-400 ml-1"><X size={12} /></button>
            )}
          </div>
        ))}
      </div>
    )
  );

  const renderAttachmentControls = (
    target: 'new' | 'edit',
    fRef: React.RefObject<HTMLInputElement | null>,
    showLink: boolean,
    setShowLink: (v: boolean) => void,
    linkVal: string,
    setLinkVal: (v: string) => void,
  ) => (
    <div className="flex items-center gap-2">
      <input ref={fRef} type="file" className="hidden" onChange={(e) => handleFileUpload(e, target)} />
      <button type="button" onClick={() => fRef.current?.click()} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-colors">
        <Paperclip size={12} /> 파일
      </button>
      <button type="button" onClick={() => setShowLink(!showLink)} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-colors">
        <Link2 size={12} /> 링크
      </button>
      {showLink && (
        <div className="flex items-center gap-1.5 flex-1">
          <input
            type="url"
            value={linkVal}
            onChange={(e) => setLinkVal(e.target.value)}
            placeholder="https://..."
            className="flex-1 min-w-0 px-2.5 py-1.5 bg-white/10 border border-white/20 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
            onKeyDown={(e) => { if (e.key === 'Enter') addLink(linkVal, target); }}
          />
          <button onClick={() => addLink(linkVal, target)} className="px-2 py-1.5 bg-teal-500 rounded-lg text-xs text-white hover:bg-teal-600 transition-colors">추가</button>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">아이디어 건의</h2>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-xl text-sm font-medium text-white transition-colors">
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? '취소' : '건의하기'}
        </button>
      </div>

      {/* New idea form */}
      {showForm && (
        <div className="mb-6 p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl space-y-3">
          <input type="text" placeholder="아이디어 제목" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSubmit(); }}
          />
          <textarea placeholder="상세 설명 (선택)" value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50 resize-none"
          />
          {renderAttachmentControls('new', fileRef, showLinkInput, setShowLinkInput, linkInput, setLinkInput)}
          {renderAttachments(attachments, (id) => setAttachments((p) => p.filter((a) => a.id !== id)))}
          <button onClick={handleSubmit} disabled={!title.trim()}
            className="w-full py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-medium text-white transition-colors">
            등록
          </button>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        {FILTER_OPTIONS.map((opt) => (
          <button key={opt.value} onClick={() => setFilter(opt.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${filter === opt.value ? 'bg-teal-500/20 text-teal-300 border border-teal-500/20' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'}`}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Ideas list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Lightbulb size={40} className="mx-auto text-slate-600 mb-3" />
          <p className="text-sm text-slate-400">{filter === 'all' ? '아직 건의된 아이디어가 없습니다' : '해당 상태의 아이디어가 없습니다'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((idea) => {
            const author = members.find((m) => m.id === idea.authorId);
            const myVote = getMyVote(idea.id);
            const isAuthor = myMember?.id === idea.authorId;
            const canEdit = isAuthor || canManage;
            const isEditing = editingIdeaId === idea.id;
            const isExpanded = expandedIdea === idea.id;

            return (
              <div key={idea.id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-4">
                  {isEditing ? (
                    /* Edit mode */
                    <div className="space-y-3">
                      <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-500/50" />
                      <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={3}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-500/50 resize-none" />
                      {renderAttachmentControls('edit', editFileRef, showEditLinkInput, setShowEditLinkInput, editLinkInput, setEditLinkInput)}
                      {renderAttachments(editAttachments, (id) => setEditAttachments((p) => p.filter((a) => a.id !== id)))}
                      <div className="flex gap-2">
                        <button onClick={saveEditIdea} className="flex-1 py-2 bg-teal-500 hover:bg-teal-600 rounded-xl text-sm font-medium text-white transition-colors">저장</button>
                        <button onClick={() => setEditingIdeaId(null)} className="flex-1 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors">취소</button>
                      </div>
                    </div>
                  ) : (
                    /* View mode */
                    <>
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="text-base font-semibold text-white">{idea.title}</h3>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-md border ${STATUS_COLORS[idea.status]}`}>{STATUS_LABELS[idea.status]}</span>
                          </div>
                          {idea.description && <p className="text-sm text-slate-400 mb-2 whitespace-pre-wrap">{idea.description}</p>}
                          {renderAttachments(idea.attachments)}
                          <div className="flex items-center gap-2 mt-2">
                            {author && <Avatar name={author.name} color={author.avatarColor} avatarUrl={author.avatarUrl} size={22} />}
                            <span className="text-xs text-slate-500">{author?.name ?? '알 수 없음'}</span>
                            <span className="text-xs text-slate-600">{formatRelativeDate(idea.createdAt)}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        {canEdit && (
                          <div className="flex items-center gap-1 shrink-0">
                            {isAuthor && <button onClick={() => startEditIdea(idea.id)} title="수정" className="p-1.5 text-slate-500 hover:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-colors"><Pencil size={14} /></button>}
                            <button onClick={() => removeIdea(idea.id)} title="삭제" className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={14} /></button>
                            {canManage && idea.status !== 'accepted' && (
                              <button onClick={() => updateStatus(idea.id, 'accepted')} title="채택" className="p-1.5 text-slate-500 hover:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-colors"><Check size={14} /></button>
                            )}
                            {canManage && idea.status !== 'rejected' && (
                              <button onClick={() => updateStatus(idea.id, 'rejected')} title="보류" className="p-1.5 text-slate-500 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors"><X size={14} /></button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Votes */}
                      <div className="flex items-center gap-2 mt-3">
                        {VOTE_CONFIG.map(({ type, label, activeColor }) => (
                          <button
                            key={type}
                            onClick={() => { if (!myMember) return; const newVote = myVote === type ? null : type; setVote(idea.id, myMember.id, newVote); if (newVote) addActivity({ type: 'idea_voted', actorId: myMember.id, targetId: idea.id, targetTitle: idea.title, metadata: { vote: label } }); }}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${myVote === type ? activeColor : 'bg-white/5 text-slate-500 border-white/10 hover:bg-white/10 hover:text-slate-300'}`}
                          >
                            {label} {idea.votes[type].length > 0 && <span className="ml-1">{idea.votes[type].length}</span>}
                          </button>
                        ))}
                      </div>

                      {/* Comments toggle */}
                      <button
                        onClick={() => setExpandedIdea(isExpanded ? null : idea.id)}
                        className="flex items-center gap-1.5 mt-3 text-sm text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        <MessageCircle size={13} />
                        댓글 {idea.comments.length > 0 && `(${idea.comments.length})`}
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    </>
                  )}
                </div>

                {/* Comments section */}
                {isExpanded && !isEditing && (
                  <div className="border-t border-white/5 bg-white/[0.02] px-4 py-3 space-y-2">
                    {idea.comments.map((c) => {
                      const cAuthor = members.find((m) => m.id === c.authorId);
                      const canEditComment = (myMember?.id === c.authorId) || canManage;
                      const isEditingComment = editingCommentId === c.id;
                      return (
                        <div key={c.id} className="flex items-start gap-2 group">
                          {cAuthor && <Avatar name={cAuthor.name} color={cAuthor.avatarColor} avatarUrl={cAuthor.avatarUrl} size={22} />}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-white">{cAuthor?.name ?? '알 수 없음'}</span>
                              <span className="text-xs text-slate-600">{formatRelativeDate(c.createdAt)}</span>
                              {canEditComment && !isEditingComment && (
                                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {myMember?.id === c.authorId && <button onClick={() => { setEditingCommentId(c.id); setEditCommentContent(c.content); }} className="p-0.5 text-slate-600 hover:text-teal-400"><Pencil size={10} /></button>}
                                  <button onClick={() => removeComment(idea.id, c.id)} className="p-0.5 text-slate-600 hover:text-red-400"><Trash2 size={10} /></button>
                                </div>
                              )}
                            </div>
                            {isEditingComment ? (
                              <div className="flex items-center gap-2 mt-1">
                                <input type="text" value={editCommentContent} onChange={(e) => setEditCommentContent(e.target.value)} autoFocus
                                  className="flex-1 min-w-0 px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && editCommentContent.trim()) { updateComment(idea.id, c.id, editCommentContent.trim()); setEditingCommentId(null); }
                                    if (e.key === 'Escape') setEditingCommentId(null);
                                  }}
                                />
                                <button onClick={() => { if (editCommentContent.trim()) { updateComment(idea.id, c.id, editCommentContent.trim()); setEditingCommentId(null); } }} className="p-1 text-teal-400"><Check size={12} /></button>
                                <button onClick={() => setEditingCommentId(null)} className="p-1 text-slate-400"><X size={12} /></button>
                              </div>
                            ) : (
                              <p className="text-sm text-slate-400 mt-0.5">{c.content}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {/* New comment */}
                    <div className="flex items-center gap-2 pt-1">
                      {myMember && <Avatar name={myMember.name} color={myMember.avatarColor} avatarUrl={myMember.avatarUrl} size={22} />}
                      <input
                        type="text"
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        placeholder="댓글 작성..."
                        className="flex-1 min-w-0 px-2.5 py-1.5 bg-white/10 border border-white/10 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && commentInput.trim() && myMember) {
                            addComment(idea.id, myMember.id, commentInput.trim());
                            addActivity({ type: 'idea_comment', actorId: myMember.id, targetId: idea.id, targetTitle: idea.title });
                            setCommentInput('');
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (commentInput.trim() && myMember) {
                            addComment(idea.id, myMember.id, commentInput.trim());
                            addActivity({ type: 'idea_comment', actorId: myMember.id, targetId: idea.id, targetTitle: idea.title });
                            setCommentInput('');
                          }
                        }}
                        disabled={!commentInput.trim()}
                        className="shrink-0 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-medium text-white transition-colors"
                      >
                        작성
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
