import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc, increment, arrayUnion, arrayRemove, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { Language, translations } from '../../data/translations';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { usePerfLogger } from '../../utils/logger';
import { Trash2, Send, Heart, Edit2, X, Check, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS, be, ja, de, fr, zhCN } from 'date-fns/locale';
import { ConfirmModal } from '../ui/ConfirmModal';

interface Comment {
  id: string;
  targetId: string;
  parentId?: string | null;
  authorUid: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  upvotes?: string[];
  downvotes?: string[];
  isEdited?: boolean;
  createdAt: string;
}

interface CommentsSectionProps {
  targetId: string;
  lang: Language;
  lowPerfMode?: boolean;
  role?: 'admin' | 'moderator' | 'user' | 'beta-tester';
  onOpenChat?: (uid: string, name: string) => void;
}

const locales = {
  ru,
  en: enUS,
  by: be,
  jp: ja,
  de,
  fr,
  zh: zhCN
};

export const CommentsSection: React.FC<CommentsSectionProps> = ({ targetId, lang, lowPerfMode, role, onOpenChat }) => {
  const { trackRender } = usePerfLogger('CommentsSection');
  trackRender();
  
  const { user, loginWithGoogle } = useAuth();
  const isModerator = role === 'admin' || role === 'moderator';
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const t = translations[lang];

  const toggleExpand = (id: string) => {
    setExpandedComments(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const MAX_COMMENTS_PER_POST = 50;
  const userCommentCount = user ? comments.filter(c => c.authorUid === user.uid).length : 0;
  const hasReachedLimit = userCommentCount >= MAX_COMMENTS_PER_POST;

  useEffect(() => {
    if (!targetId) return;

    const q = query(
      collection(db, 'comments'),
      where('targetId', '==', targetId),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      setComments(commentsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'comments');
    });

    return () => unsubscribe();
  }, [targetId]);

  const handleSubmit = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    const content = parentId ? replyContent : newComment;
    if (!user || !content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'comments'), {
        targetId,
        parentId: parentId || null,
        authorUid: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorPhoto: user.photoURL || '',
        content: content.trim(),
        upvotes: [],
        downvotes: [],
        isEdited: false,
        createdAt: new Date().toISOString()
      });

      // Grant XP for posting a comment
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        xp: increment(25) // 25 XP for a comment
      });

      if (parentId) {
        setReplyingTo(null);
        setReplyContent('');
      } else {
        setNewComment('');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'comments');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !commentToDelete) return;
    try {
      await deleteDoc(doc(db, 'comments', commentToDelete));
      setCommentToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `comments/${commentToDelete}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, parentId?: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any, parentId);
    }
  };

  const handleEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const handleUpdate = async (commentId: string) => {
    if (!editContent.trim()) return;
    try {
      await updateDoc(doc(db, 'comments', commentId), {
        content: editContent.trim(),
        isEdited: true
      });
      setEditingCommentId(null);
      setEditContent('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `comments/${commentId}`);
    }
  };

  const handleVote = async (comment: Comment, type: 'up' | 'down') => {
    if (!user) return;
    
    const commentRef = doc(db, 'comments', comment.id);
    const authorRef = doc(db, 'users', comment.authorUid);
    
    const upvotes = comment.upvotes || [];
    const downvotes = comment.downvotes || [];
    
    const hasUpvoted = upvotes.includes(user.uid);
    const hasDownvoted = downvotes.includes(user.uid);

    try {
      let repChange = 0;

      if (type === 'up') {
        if (hasUpvoted) {
          await updateDoc(commentRef, { upvotes: arrayRemove(user.uid) });
          repChange = -1;
        } else {
          const updates: any = { upvotes: arrayUnion(user.uid) };
          if (hasDownvoted) {
            updates.downvotes = arrayRemove(user.uid);
            repChange = 2; // Remove downvote (-1) and add upvote (+1)
          } else {
            repChange = 1;
          }
          await updateDoc(commentRef, updates);
        }
      } else {
        if (hasDownvoted) {
          await updateDoc(commentRef, { downvotes: arrayRemove(user.uid) });
          repChange = 1;
        } else {
          const updates: any = { downvotes: arrayUnion(user.uid) };
          if (hasUpvoted) {
            updates.upvotes = arrayRemove(user.uid);
            repChange = -2; // Remove upvote (+1) and add downvote (-1)
          } else {
            repChange = -1;
          }
          await updateDoc(commentRef, updates);
        }
      }

      // Update author's reputation
      if (repChange !== 0 && comment.authorUid !== user.uid) {
        await updateDoc(authorRef, { 
          reputation: increment(repChange),
          xp: increment(repChange * 10) // XP also scales with reputation
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `comments/${comment.id}`);
    }
  };

  const topLevelComments = useMemo(() => comments.filter(c => !c.parentId), [comments]);
  const repliesMap = useMemo(() => {
    const map: Record<string, Comment[]> = {};
    comments.forEach(c => {
      if (c.parentId) {
        if (!map[c.parentId]) map[c.parentId] = [];
        map[c.parentId].push(c);
      }
    });
    // Sort replies by date
    Object.keys(map).forEach(parentId => {
      map[parentId].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    });
    return map;
  }, [comments]);

  const renderCommentContent = (comment: Comment, isReply = false) => {
    const isExpanded = expandedComments[comment.id];
    const isLong = comment.content.length > 250;
    const upvotesCount = (comment.upvotes || []).length;
    const downvotesCount = (comment.downvotes || []).length;
    const score = upvotesCount - downvotesCount;
    const hasUpvoted = user && (comment.upvotes || []).includes(user.uid);
    const hasDownvoted = user && (comment.downvotes || []).includes(user.uid);

    return (
      <div key={comment.id} className={`flex gap-2 sm:gap-4 group ${isReply ? 'mt-4' : 'mt-8'}`}>
        <img
          src={comment.authorPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.authorName)}&background=1c1528&color=fff&size=${lowPerfMode ? '32' : '64'}`}
          alt={comment.authorName}
          loading="lazy"
          className={`${isReply ? 'w-8 h-8' : 'w-10 h-10'} rounded-2xl border-2 border-[#3d2b4f]/50 shrink-0 mt-1 shadow-lg group-hover:border-[#ff4d4d] transition-colors object-cover`}
        />
        <div className="flex-1 min-w-0">
          <div className={`bg-[#15101e] rounded-[1.5rem] rounded-tl-none p-4 sm:p-5 border border-[#3d2b4f]/20 shadow-xl transition-all group-hover:border-[#ff4d4d]/30 group-hover:bg-[#251c35]`}>
            <div className="flex flex-col gap-1 mb-3 pr-16 relative">
              <div className="flex items-center flex-wrap gap-3">
                <span className="font-black text-white text-sm uppercase tracking-wider">{comment.authorName}</span>
                {user && user.uid !== comment.authorUid && onOpenChat && (
                  <button
                    onClick={() => onOpenChat(comment.authorUid, comment.authorName)}
                    className="p-1.5 bg-[#0d0b14] text-[#ff4d4d] hover:text-white hover:bg-[#ff4d4d] rounded-lg transition-all active:scale-90 border border-[#3d2b4f]/30"
                    title={t.sendMessage}
                  >
                    <MessageCircle size={12} />
                  </button>
                )}
              </div>
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                  locale: locales[lang] || locales.en
                })}
                {comment.isEdited && <span className="ml-1 italic opacity-70">({t.edited || "edited"})</span>}
              </span>
              <div className="absolute top-0 right-0 flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                {user && (user.uid === comment.authorUid || isModerator) && (
                <>
                  {user.uid === comment.authorUid && (
                    <button
                      onClick={() => handleEdit(comment)}
                      className="p-1.5 bg-[#0d0b14] text-white/60 hover:text-white hover:bg-[#ff4d4d] rounded-lg transition-all border border-[#3d2b4f]/30"
                      title={t.edit || "Edit"}
                    >
                      <Edit2 size={12} />
                    </button>
                  )}
                  <button
                    onClick={() => setCommentToDelete(comment.id)}
                    className="p-1.5 bg-[#0d0b14] text-white/60 hover:text-white hover:bg-red-500 rounded-lg transition-all border border-[#3d2b4f]/30"
                    title={t.delete || "Удал."}
                  >
                    <Trash2 size={12} />
                  </button>
                </>
              )}
            </div>
          </div>
          
          {editingCommentId === comment.id ? (
            <div className="mt-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-[#0d0b14] border border-[#3d2b4f]/50 rounded-2xl p-4 text-sm text-white/90 focus:outline-none focus:border-[#ff4d4d]/50 resize-none min-h-[100px] font-medium"
              />
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => setEditingCommentId(null)}
                  className="px-4 py-2 bg-[#15101e] text-white/60 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-[#3d2b4f]/30 transition-all"
                >
                  {t.cancelBtn}
                </button>
                <button
                  onClick={() => handleUpdate(comment.id)}
                  className="px-4 py-2 bg-[#ff4d4d] text-[#15101e] rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/20 transition-all shadow-[0_0_15px_rgba(255,77,77,0.3)]"
                >
                  {t.saveBtn || "Save"}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className={`text-sm text-white/90 whitespace-pre-wrap break-words leading-relaxed font-medium ${!isExpanded && isLong ? 'line-clamp-4' : ''}`}>
                {comment.content}
              </p>
              {isLong && (
                <button
                  onClick={() => toggleExpand(comment.id)}
                  className="text-[#ff4d4d] text-[10px] mt-2 hover:text-white focus:outline-none font-black uppercase tracking-widest flex items-center gap-1 transition-colors"
                >
                  {isExpanded ? (
                    <>
                      {t.showLess || "Свернуть"}
                      <ChevronUp size={12} />
                    </>
                  ) : (
                    <>
                      {t.showMore || "Читать далее"}
                      <ChevronDown size={12} />
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-[#3d2b4f]/10 flex items-center justify-between">
            <div className="flex items-center gap-1 bg-[#0d0b14]/50 p-1 rounded-xl border border-[#3d2b4f]/30">
              <button
                onClick={() => handleVote(comment, 'up')}
                disabled={!user}
                className={`p-1.5 rounded-lg transition-all ${hasUpvoted ? 'text-green-500 bg-green-500/10' : 'text-white/40 hover:text-green-500 hover:bg-green-500/5'}`}
              >
                <ChevronUp size={20} />
              </button>
              <span className={`text-xs font-black px-2 min-w-[2rem] text-center ${score > 0 ? 'text-green-500' : score < 0 ? 'text-red-500' : 'text-white/40'}`}>
                {score > 0 ? `+${score}` : score}
              </span>
              <button
                onClick={() => handleVote(comment, 'down')}
                disabled={!user}
                className={`p-1.5 rounded-lg transition-all ${hasDownvoted ? 'text-red-500 bg-red-500/10' : 'text-white/40 hover:text-red-500 hover:bg-red-500/5'}`}
              >
                <ChevronDown size={20} />
              </button>
            </div>

            {user && (
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-[#ff4d4d] transition-all px-4 py-2 rounded-xl hover:bg-[#ff4d4d]/10 border border-transparent hover:border-[#ff4d4d]/30"
              >
                <MessageCircle size={14} />
                {t.reply || "Ответить"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    );
  };

  const renderCommentTree = (parentId: string | null = null, depth: number = 0) => {
    const commentsAtLevel = parentId ? (repliesMap[parentId] || []) : topLevelComments;
    
    if (commentsAtLevel.length === 0) return null;

    return (
      <div className={`space-y-4 ${depth > 0 ? 'ml-4 sm:ml-8 mt-4 border-l-2 border-[#3d2b4f]/30 pl-4 sm:pl-6' : ''}`}>
        {commentsAtLevel.map(comment => (
          <div key={comment.id} className="space-y-4">
            {renderCommentContent(comment, depth > 0)}
            
            {/* Recursive Replies */}
            {renderCommentTree(comment.id, depth + 1)}

            {/* Reply Input */}
            {replyingTo === comment.id && (
              <div className={`mt-4 ${depth === 0 ? 'ml-4 sm:ml-8 pl-4 sm:pl-6 border-l-2 border-[#3d2b4f]/30' : ''}`}>
                <form onSubmit={(e) => handleSubmit(e, comment.id)} className="relative group">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, comment.id)}
                    placeholder={t.writeReply || "Написать ответ..."}
                    className="w-full bg-[#15101e]/30 border border-[#3d2b4f]/20 rounded-2xl p-4 pr-14 text-white/90 focus:outline-none focus:border-[#ff4d4d]/50 focus:bg-[#15101e]/50 transition-all resize-none min-h-[100px] text-sm font-medium"
                    maxLength={1000}
                  />
                  <button
                    type="submit"
                    disabled={!replyContent.trim() || isSubmitting}
                    className="absolute bottom-4 right-4 p-2.5 bg-[#ff4d4d] text-[#15101e] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#ff7a7a] hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,77,77,0.3)]"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="mt-12 pt-12 border-t border-[#15101e]">
      <h3 className="text-3xl font-black text-white mb-10 tracking-tighter uppercase flex items-center gap-4">
        <MessageCircle className="text-[#ff4d4d]" size={32} />
        {t.comments || "Комментарии"} <span className="text-white/40 text-xl">({comments.length})</span>
      </h3>

      {user ? (
        <div className="mb-12">
          <form onSubmit={handleSubmit} className="relative group">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={hasReachedLimit ? (t.commentLimitReached || "You have reached the comment limit") : (t.writeComment || "Написать комментарий... (Enter для отправки)")}
              className={`w-full bg-[#15101e]/30 border border-[#3d2b4f]/20 rounded-[2rem] p-6 pr-16 text-white/90 focus:outline-none focus:border-[#ff4d4d]/50 focus:bg-[#15101e]/50 transition-all resize-none min-h-[150px] text-base font-medium ${hasReachedLimit ? 'opacity-50 cursor-not-allowed' : ''}`}
              maxLength={2000}
              disabled={hasReachedLimit}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting || hasReachedLimit}
              className="absolute bottom-6 right-6 p-4 bg-[#ff4d4d] text-[#15101e] rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#ff7a7a] hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,77,77,0.3)] border border-white/20"
            >
              <Send size={20} />
            </button>
          </form>
          {hasReachedLimit && (
            <p className="text-red-400 text-[10px] mt-3 font-black uppercase tracking-widest">{t.commentLimitReached || "You have reached the comment limit (max 5) for this post."}</p>
          )}
        </div>
      ) : (
        <div className="bg-[#15101e] border border-[#3d2b4f]/20 rounded-[2.5rem] p-12 text-center mb-12">
          <MessageCircle size={48} className="mx-auto text-white/20 mb-6" />
          <p className="text-white/60 mb-8 font-black uppercase tracking-widest text-sm">{t.loginToComment || "Войдите, чтобы оставить комментарий"}</p>
          <button
            onClick={loginWithGoogle}
            className="inline-flex items-center gap-4 bg-[#ff4d4d] hover:bg-[#ff7a7a] text-[#15101e] px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(255,77,77,0.3)] hover:scale-105 active:scale-95 border border-white/20"
          >
            {t.loginWithGoogle || "Войти через Google"}
          </button>
        </div>
      )}

      <div className="space-y-10">
        {renderCommentTree(null, 0)}
      </div>

      <ConfirmModal
        isOpen={!!commentToDelete}
        onClose={() => setCommentToDelete(null)}
        onConfirm={handleDelete}
        title={t.confirmDeleteTitle || "Delete Comment"}
        message={t.confirmDeleteMessage || "Are you sure you want to delete this comment? This action cannot be undone."}
        confirmText={t.delete || "Delete"}
        cancelText={t.cancelBtn || "Cancel"}
        isDestructive={true}
      />
    </div>
  );
};
