import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { Language, translations } from '../../data/translations';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { Trash2, Send, Heart, Edit2, X, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS, be, ja, de, fr, zhCN } from 'date-fns/locale';
import { ConfirmModal } from '../ui/ConfirmModal';

interface Comment {
  id: string;
  targetId: string;
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

export const CommentsSection: React.FC<CommentsSectionProps> = ({ targetId, lang }) => {
  const { user, loginWithGoogle } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showReactionsFor, setShowReactionsFor] = useState<string | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const t = translations[lang];

  const MAX_COMMENTS_PER_POST = 5;
  const userCommentCount = user ? comments.filter(c => c.authorUid === user.uid).length : 0;
  const hasReachedLimit = userCommentCount >= MAX_COMMENTS_PER_POST;

  const EMOJIS = ['👍', '❤️', '😂', '😮', '😢'];

  const EMOJI_MAP: Record<string, string> = {
    '👍': '1f44d',
    '❤️': '2764',
    '😂': '1f602',
    '😮': '1f62e',
    '😢': '1f622'
  };

  const getTwemojiUrl = (emoji: string) => {
    const hex = EMOJI_MAP[emoji];
    return hex ? `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${hex}.svg` : '';
  };

  useEffect(() => {
    if (!targetId) return;

    const q = query(
      collection(db, 'comments'),
      where('targetId', '==', targetId),
      orderBy('createdAt', 'desc')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'comments'), {
        targetId,
        authorUid: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorPhoto: user.photoURL || '',
        content: newComment.trim(),
        likesCount: 0,
        likedBy: [],
        reactions: {},
        isEdited: false,
        createdAt: new Date().toISOString()
      });
      setNewComment('');
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
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

  return (
    <div className="mt-8 pt-8 border-t border-[#5C4B8B]">
      <h3 className="text-xl font-bold text-[#C3A6E6] mb-6">
        {t.comments || "Комментарии"} ({comments.length})
      </h3>

      {user ? (
        <div className="mb-8">
          <form onSubmit={handleSubmit} className="relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={hasReachedLimit ? (t.commentLimitReached || "You have reached the comment limit") : (t.writeComment || "Написать комментарий... (Enter для отправки)")}
              className={`w-full bg-[#2F244F] border border-[#5C4B8B] rounded-xl p-3 sm:p-4 pr-12 text-gray-200 focus:outline-none focus:border-[#C3A6E6] resize-none min-h-[100px] text-sm sm:text-base ${hasReachedLimit ? 'opacity-50 cursor-not-allowed' : ''}`}
              maxLength={2000}
              disabled={hasReachedLimit}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting || hasReachedLimit}
              className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 p-2 bg-[#C3A6E6] text-[#2F244F] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#B094EB] transition-colors"
            >
              <Send size={18} />
            </button>
          </form>
          {hasReachedLimit && (
            <p className="text-red-400 text-sm mt-2">{t.commentLimitReached || "You have reached the comment limit (max 5) for this post."}</p>
          )}
        </div>
      ) : (
        <div className="bg-[#2F244F] border border-[#5C4B8B] rounded-xl p-6 text-center mb-8">
          <p className="text-gray-300 mb-4">{t.loginToComment || "Войдите, чтобы оставить комментарий"}</p>
          <button
            onClick={loginWithGoogle}
            className="inline-flex items-center gap-2 bg-[#C3A6E6] hover:bg-[#B094EB] text-[#2F244F] px-4 py-2 rounded-lg font-bold transition-colors"
          >
            {t.loginWithGoogle || "Войти через Google"}
          </button>
        </div>
      )}

      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:block">
              <img
                src={comment.authorPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.authorName)}&background=5C4B8B&color=fff`}
                alt={comment.authorName}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-[#5C4B8B] shrink-0"
              />
              <span className="font-bold text-white sm:hidden">{comment.authorName}</span>
            </div>
            <div className="flex-1 bg-[#2F244F] rounded-2xl sm:rounded-tl-none p-3 sm:p-4 border border-[#5C4B8B]">
              <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <span className="font-bold text-white mr-2 hidden sm:inline">{comment.authorName}</span>
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                      locale: locales[lang] || locales.en
                    })}
                    {comment.isEdited && <span className="ml-1 italic">(изменено)</span>}
                  </span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 ml-auto">
                  {user && user.uid === comment.authorUid && (
                    <>
                      <button
                        onClick={() => handleEdit(comment)}
                        className="text-gray-400 hover:text-[#C3A6E6] transition-colors p-1"
                        title="Редактировать"
                      >
                        <Edit2 size={14} className="sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => setCommentToDelete(comment.id)}
                        className="text-gray-400 hover:text-red-400 transition-colors p-1"
                        title={t.delete || "Удалить"}
                      >
                        <Trash2 size={14} className="sm:w-4 sm:h-4" />
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
                    className="w-full bg-[#3E3160] border border-[#5C4B8B] rounded-xl p-2 sm:p-3 text-sm sm:text-base text-gray-200 focus:outline-none focus:border-[#C3A6E6] resize-none min-h-[80px]"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => setEditingCommentId(null)}
                      className="p-1 sm:p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <X size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                    <button
                      onClick={() => handleUpdate(comment.id)}
                      className="p-1 sm:p-2 text-[#C3A6E6] hover:text-white transition-colors"
                    >
                      <Check size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm sm:text-base text-gray-300 whitespace-pre-wrap break-words">{comment.content}</p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2 relative">
                {/* Render existing reactions */}
                {comment.reactions && Object.entries(comment.reactions).map(([emoji, users]) => {
                  if (users.length === 0) return null;
                  const hasReacted = user && users.includes(user.uid);
                  return (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(comment.id, emoji, comment.reactions)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${hasReacted ? 'bg-[#C3A6E6]/20 border border-[#C3A6E6]/50' : 'bg-[#3E3160] border border-transparent hover:border-[#5C4B8B]'}`}
                    >
                      <img 
                        src={getTwemojiUrl(emoji)} 
                        alt={emoji} 
                        className="w-4 h-4" 
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <span className="hidden leading-none text-sm">{emoji}</span>
                      <span className="text-gray-300">{users.length}</span>
                    </button>
                  );
                })}

                {/* Add reaction button */}
                {user && (
                  <div className="relative">
                    <button
                      onClick={() => setShowReactionsFor(showReactionsFor === comment.id ? null : comment.id)}
                      className="p-1.5 rounded-full bg-[#3E3160] text-gray-400 hover:text-[#C3A6E6] transition-colors"
                    >
                      <Heart size={14} />
                    </button>
                    
                    {showReactionsFor === comment.id && (
                      <div className="absolute bottom-full left-0 mb-2 bg-[#3E3160] border border-[#5C4B8B] rounded-full p-1 flex gap-1 shadow-xl z-10">
                        {EMOJIS.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(comment.id, emoji, comment.reactions)}
                            className="p-2 hover:bg-[#5C4B8B] rounded-full transition-colors"
                          >
                            <img 
                              src={getTwemojiUrl(emoji)} 
                              alt={emoji} 
                              className="w-6 h-6" 
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            <span className="hidden text-xl leading-none">{emoji}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
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
