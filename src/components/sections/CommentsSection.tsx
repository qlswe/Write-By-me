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
  likesCount?: number;
  likedBy?: string[];
  reactions?: Record<string, string[]>;
  isEdited?: boolean;
  createdAt: string;
}

interface CommentsSectionProps {
  targetId: string;
  lang: Language;
  lowPerfMode?: boolean;
  role?: 'admin' | 'moderator' | 'user';
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
  const [showReactionsFor, setShowReactionsFor] = useState<string | null>(null);
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

  const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '✨'];

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
        likesCount: 0,
        likedBy: [],
        reactions: {},
        isEdited: false,
        createdAt: new Date().toISOString()
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

  const handleReaction = async (commentId: string, emoji: string, currentReactions: Record<string, string[]> = {}) => {
    if (!user) return;
    try {
      const commentRef = doc(db, 'comments', commentId);
      const updates: Record<string, any> = {};
      
      let previousEmoji: string | null = null;
      for (const [e, users] of Object.entries(currentReactions)) {
        if (users.includes(user.uid)) {
          previousEmoji = e;
          break;
        }
      }

      if (previousEmoji === emoji) {
        // Toggle off if clicking the same emoji
        updates[`reactions.${emoji}`] = arrayRemove(user.uid);
      } else {
        // Remove previous reaction if exists
        if (previousEmoji) {
          updates[`reactions.${previousEmoji}`] = arrayRemove(user.uid);
        }
        // Add new reaction
        updates[`reactions.${emoji}`] = arrayUnion(user.uid);
      }
      
      if (Object.keys(updates).length > 0) {
        await updateDoc(commentRef, updates);
      }
      setShowReactionsFor(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `comments/${commentId}`);
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

    return (
      <div key={comment.id} className={`flex gap-2 sm:gap-4 group ${isReply ? 'mt-4' : 'mt-8'}`}>
        <img
          src={comment.authorPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.authorName)}&background=3E3160&color=fff&size=${lowPerfMode ? '32' : '64'}`}
          alt={comment.authorName}
          loading="lazy"
          className={`${isReply ? 'w-8 h-8' : 'w-10 h-10'} rounded-2xl border-2 border-[#5C4B8B]/50 shrink-0 mt-1 shadow-lg group-hover:border-[#8B5CF6] transition-colors object-cover`}
        />
        <div className="flex-1 min-w-0">
          <div className={`bg-[#2F244F]/30 backdrop-blur-xl rounded-[1.5rem] ${isReply ? 'rounded-tl-none' : 'rounded-tl-none'} p-4 sm:p-5 border border-[#5C4B8B]/20 shadow-xl transition-all group-hover:border-[#8B5CF6]/30 group-hover:bg-[#2F244F]/50`}>
            <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
              <div className="flex items-center flex-wrap gap-3">
                <span className="font-black text-white text-sm uppercase tracking-wider">{comment.authorName}</span>
                {user && user.uid !== comment.authorUid && onOpenChat && (
                  <button
                    onClick={() => onOpenChat(comment.authorUid, comment.authorName)}
                    className="p-1.5 bg-[#1A1625] text-[#8B5CF6] hover:text-white hover:bg-[#8B5CF6] rounded-lg transition-all active:scale-90 border border-[#5C4B8B]/30"
                    title={t.sendMessage}
                  >
                    <MessageCircle size={12} />
                  </button>
                )}
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                    locale: locales[lang] || locales.en
                  })}
                  {comment.isEdited && <span className="ml-1 italic opacity-70">(изм.)</span>}
                </span>
              </div>
              <div className="flex items-center gap-1 ml-auto opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                {user && (user.uid === comment.authorUid || isModerator) && (
                <>
                  {user.uid === comment.authorUid && (
                    <button
                      onClick={() => handleEdit(comment)}
                      className="p-1.5 bg-[#1A1625] text-gray-400 hover:text-white hover:bg-[#8B5CF6] rounded-lg transition-all border border-[#5C4B8B]/30"
                      title="Ред."
                    >
                      <Edit2 size={12} />
                    </button>
                  )}
                  <button
                    onClick={() => setCommentToDelete(comment.id)}
                    className="p-1.5 bg-[#1A1625] text-gray-400 hover:text-white hover:bg-red-500 rounded-lg transition-all border border-[#5C4B8B]/30"
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
                className="w-full bg-[#1A1625] border border-[#5C4B8B]/50 rounded-2xl p-4 text-sm text-gray-200 focus:outline-none focus:border-[#8B5CF6]/50 resize-none min-h-[100px] font-medium"
              />
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => setEditingCommentId(null)}
                  className="px-4 py-2 bg-[#2F244F] text-gray-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-[#5C4B8B]/30 transition-all"
                >
                  {t.cancelBtn}
                </button>
                <button
                  onClick={() => handleUpdate(comment.id)}
                  className="px-4 py-2 bg-[#8B5CF6] text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/20 transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                >
                  {t.saveBtn || "Save"}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className={`text-sm text-gray-200 whitespace-pre-wrap break-words leading-relaxed font-medium ${!isExpanded && isLong ? 'line-clamp-4' : ''}`}>
                {comment.content}
              </p>
              {isLong && (
                <button
                  onClick={() => toggleExpand(comment.id)}
                  className="text-[#8B5CF6] text-[10px] mt-2 hover:text-white focus:outline-none font-black uppercase tracking-widest flex items-center gap-1 transition-colors"
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

          <div className="mt-4 pt-4 border-t border-[#5C4B8B]/10 flex flex-wrap items-center gap-2 relative">
            {/* Render reactions as direct buttons */}
            {EMOJIS.map(emoji => {
              const users = (comment.reactions && comment.reactions[emoji]) || [];
              const count = users.length;
              const hasReacted = user && users.includes(user.uid);
              
              if (count === 0 && !user) return null;

              return (
                <button
                  key={emoji}
                  onClick={() => handleReaction(comment.id, emoji, comment.reactions)}
                  disabled={!user}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] transition-all border ${
                    hasReacted 
                      ? 'bg-[#8B5CF6]/20 border-[#8B5CF6]/50 text-[#8B5CF6]' 
                      : count > 0
                        ? 'bg-[#1A1625] border-[#5C4B8B]/30 text-gray-400'
                        : 'bg-transparent border-transparent text-gray-500 opacity-0 group-hover:opacity-100 hover:border-[#5C4B8B]/30'
                  } ${!user ? 'cursor-not-allowed' : 'hover:scale-110 active:scale-95'}`}
                >
                  <span className={`text-sm leading-none ${count === 0 && !hasReacted ? 'grayscale opacity-50' : ''}`}>{emoji}</span>
                  {count > 0 && <span className="font-black">{count}</span>}
                </button>
              );
            })}

            {/* Reply button */}
            {!isReply && user && (
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="ml-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-[#8B5CF6] transition-all px-4 py-2 rounded-xl hover:bg-[#8B5CF6]/10 border border-transparent hover:border-[#8B5CF6]/30"
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

  return (
    <div className="mt-12 pt-12 border-t border-[#2F244F]">
      <h3 className="text-3xl font-black text-white mb-10 tracking-tighter uppercase flex items-center gap-4">
        <MessageCircle className="text-[#8B5CF6]" size={32} />
        {t.comments || "Комментарии"} <span className="text-gray-500 text-xl">({comments.length})</span>
      </h3>

      {user ? (
        <div className="mb-12">
          <form onSubmit={handleSubmit} className="relative group">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={hasReachedLimit ? (t.commentLimitReached || "You have reached the comment limit") : (t.writeComment || "Написать комментарий... (Enter для отправки)")}
              className={`w-full bg-[#2F244F]/30 border border-[#5C4B8B]/20 rounded-[2rem] p-6 pr-16 text-gray-200 focus:outline-none focus:border-[#8B5CF6]/50 focus:bg-[#2F244F]/50 transition-all resize-none min-h-[150px] text-base font-medium ${hasReachedLimit ? 'opacity-50 cursor-not-allowed' : ''}`}
              maxLength={2000}
              disabled={hasReachedLimit}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting || hasReachedLimit}
              className="absolute bottom-6 right-6 p-4 bg-[#8B5CF6] text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#7C3AED] hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] border border-white/20"
            >
              <Send size={20} />
            </button>
          </form>
          {hasReachedLimit && (
            <p className="text-red-400 text-[10px] mt-3 font-black uppercase tracking-widest">{t.commentLimitReached || "You have reached the comment limit (max 5) for this post."}</p>
          )}
        </div>
      ) : (
        <div className="bg-[#2F244F]/20 border border-[#5C4B8B]/20 rounded-[2.5rem] p-12 text-center mb-12 backdrop-blur-xl">
          <MessageCircle size={48} className="mx-auto text-gray-600 mb-6" />
          <p className="text-gray-400 mb-8 font-black uppercase tracking-widest text-sm">{t.loginToComment || "Войдите, чтобы оставить комментарий"}</p>
          <button
            onClick={loginWithGoogle}
            className="inline-flex items-center gap-4 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:scale-105 active:scale-95 border border-white/20"
          >
            {t.loginWithGoogle || "Войти через Google"}
          </button>
        </div>
      )}

      <div className="space-y-10">
        {topLevelComments.map((comment) => {
          const replies = repliesMap[comment.id] || [];
          
          return (
            <div key={comment.id} className="space-y-4">
              {renderCommentContent(comment, false)}
              
              {/* Replies */}
              {replies.length > 0 && (
                <div className="ml-6 sm:ml-16 mt-4 space-y-0 border-l-2 border-[#2F244F] pl-4 sm:pl-8">
                  {replies.map(reply => renderCommentContent(reply, true))}
                </div>
              )}

              {/* Reply Input */}
              {replyingTo === comment.id && (
                <div className="ml-6 sm:ml-16 mt-6 pl-4 sm:pl-8 border-l-2 border-transparent">
                  <form onSubmit={(e) => handleSubmit(e, comment.id)} className="relative group">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, comment.id)}
                      placeholder={t.writeReply || "Написать ответ..."}
                      className="w-full bg-[#2F244F]/30 border border-[#5C4B8B]/20 rounded-2xl p-4 pr-14 text-gray-200 focus:outline-none focus:border-[#8B5CF6]/50 focus:bg-[#2F244F]/50 transition-all resize-none min-h-[100px] text-sm font-medium"
                      maxLength={1000}
                    />
                    <button
                      type="submit"
                      disabled={!replyContent.trim() || isSubmitting}
                      className="absolute bottom-4 right-4 p-3 bg-[#8B5CF6] text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#7C3AED] hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] border border-white/20"
                    >
                      <Send size={16} />
                    </button>
                  </form>
                </div>
              )}
            </div>
          );
        })}
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
