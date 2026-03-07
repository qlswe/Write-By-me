import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { Language, translations } from '../../data/translations';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { Trash2, Send, Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS, be, ja, de, fr, zhCN } from 'date-fns/locale';

interface Comment {
  id: string;
  targetId: string;
  authorUid: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  likesCount?: number;
  likedBy?: string[];
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
  const t = translations[lang];

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
        createdAt: new Date().toISOString()
      });
      setNewComment('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'comments');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'comments', commentId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `comments/${commentId}`);
    }
  };

  const handleLike = async (commentId: string, isLiked: boolean) => {
    if (!user) return;
    try {
      const commentRef = doc(db, 'comments', commentId);
      if (isLiked) {
        await updateDoc(commentRef, {
          likesCount: increment(-1),
          likedBy: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(commentRef, {
          likesCount: increment(1),
          likedBy: arrayUnion(user.uid)
        });
      }
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
        <form onSubmit={handleSubmit} className="mb-8 relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t.writeComment || "Написать комментарий..."}
            className="w-full bg-[#2F244F] border border-[#5C4B8B] rounded-xl p-4 pr-12 text-gray-200 focus:outline-none focus:border-[#C3A6E6] resize-none min-h-[100px]"
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="absolute bottom-4 right-4 p-2 bg-[#C3A6E6] text-[#2F244F] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#B094EB] transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
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
          <div key={comment.id} className="flex gap-4">
            <img
              src={comment.authorPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.authorName)}&background=5C4B8B&color=fff`}
              alt={comment.authorName}
              className="w-10 h-10 rounded-full border border-[#5C4B8B] shrink-0"
            />
            <div className="flex-1 bg-[#2F244F] rounded-2xl rounded-tl-none p-4 border border-[#5C4B8B]">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-bold text-white mr-2">{comment.authorName}</span>
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                      locale: locales[lang] || locales.en
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLike(comment.id, comment.likedBy?.includes(user?.uid || '') || false)}
                    className={`flex items-center gap-1 transition-colors p-1 ${comment.likedBy?.includes(user?.uid || '') ? 'text-red-400' : 'text-gray-400 hover:text-red-400'}`}
                    title={t.like || "Нравится"}
                    disabled={!user}
                  >
                    <Heart size={16} fill={comment.likedBy?.includes(user?.uid || '') ? "currentColor" : "none"} />
                    <span className="text-xs">{comment.likesCount || 0}</span>
                  </button>
                  {user && user.uid === comment.authorUid && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors p-1"
                      title={t.delete || "Удалить"}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-gray-300 whitespace-pre-wrap break-words">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
