import React, { useState, useEffect, useMemo, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc, increment, arrayUnion, arrayRemove, limit, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { Language, translations } from '../../data/translations';
import { GoogleLoginButton } from '../ui/GoogleLoginButton';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { usePerfLogger } from '../../utils/logger';
import { 
  Trash2, Send, Heart, Edit2, X, Check, MessageCircle, 
  ChevronDown, ChevronUp, Sparkles, Bold, Italic, Code, 
  CornerDownRight, Smile, ThumbsUp, Flame, Star, Award, 
  MessageSquare, HelpCircle, ArrowUpDown, Clock, Mail, ShieldAlert
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS, be, ja, de, fr, zhCN } from 'date-fns/locale';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useLimits } from '../../hooks/useLimits';
import { vercelFallback } from '../../utils/vercelFallback';
import { motion, AnimatePresence } from 'motion/react';

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
  reactions?: Record<string, string[]>;
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

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '🎉', '🚀', '👑', '😱'];

export const CommentsSection: React.FC<CommentsSectionProps> = ({ targetId, lang, lowPerfMode, role, onOpenChat }) => {
  const { trackRender } = usePerfLogger('CommentsSection');
  trackRender();
  
  const { user, loginWithGoogle, isVerified } = useAuth();
  const isModerator = role === 'admin' || role === 'moderator';
  const { checkLimit, incrementUsage } = useLimits();
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');
  
  // Cache for dynamic profile metadata to render live roles, level, XP, premium status
  const [authorProfiles, setAuthorProfiles] = useState<Record<string, any>>({});
  const [activeEmojiPicker, setActiveEmojiPicker] = useState<string | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const t = translations[lang];

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setActiveEmojiPicker(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

    let fallbackInterval: ReturnType<typeof setInterval>;
    const fetchFallback = async () => {
      if (vercelFallback.isAvailable()) {
        try {
          const fallbackData = await vercelFallback.lrange(`comments:${targetId}`, 0, 100);
          if (fallbackData && fallbackData.length > 0) {
            const parsed = fallbackData.map((str: any) => typeof str === 'string' ? JSON.parse(str) : str).reverse() as Comment[];
            setComments(prev => {
              const mapped = new Map([...prev, ...parsed].map(c => [c.id, c]));
              const sorted = Array.from(mapped.values()).sort((a, b) => {
                  const timeA = new Date(a.createdAt).getTime();
                  const timeB = new Date(b.createdAt).getTime();
                  return timeB - timeA;
              });
              return sorted;
            });
          }
        } catch (e) {}
      }
    };
    
    fetchFallback();
    fallbackInterval = setInterval(fetchFallback, 5000);

    return () => {
      unsubscribe();
      clearInterval(fallbackInterval);
    };
  }, [targetId]);

  // Dynamic profiles fetching
  useEffect(() => {
    if (comments.length === 0) return;
    const uidsToFetch = Array.from(new Set(comments.map(c => c.authorUid))).filter(uid => !authorProfiles[uid]);
    if (uidsToFetch.length === 0) return;

    const fetchProfiles = async () => {
      const newProfiles: Record<string, any> = {};
      for (const uid of uidsToFetch) {
        try {
          const snap = await getDoc(doc(db, 'public_profiles', uid));
          if (snap.exists()) {
            newProfiles[uid] = snap.data();
          }
        } catch (e) {
          console.error("Error fetching author profile:", e);
        }
      }
      if (Object.keys(newProfiles).length > 0) {
        setAuthorProfiles(prev => ({ ...prev, ...newProfiles }));
      }
    };
    fetchProfiles();
  }, [comments, authorProfiles]);

  const handleSubmit = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    if (!checkLimit('comments_daily')) {
      alert(lang === 'ru' ? 'Вы исчерпали лимит в 50 комментариев за день. Приобретите Aha Premium.' : 'You have reached the daily comment limit of 50. Get Aha Premium.');
      return;
    }
    const content = parentId ? replyContent : newComment;
    if (!user || !content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    incrementUsage('comments_daily');
    try {
      const payload = {
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
      };

      if (vercelFallback.isAvailable()) {
        const commentId = Date.now().toString() + '_' + user.uid;
        const fullPayload = { ...payload, id: commentId };
        await vercelFallback.lpush(`comments:${targetId}`, JSON.stringify(fullPayload));
        setComments(prev => [fullPayload, ...prev]);
      } else {
        await addDoc(collection(db, 'comments'), payload);
        // Grant XP for posting a comment
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          xp: increment(25) // 25 XP for a comment
        });
      }

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
            repChange = 2;
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
            repChange = -2;
          } else {
            repChange = -1;
          }
          await updateDoc(commentRef, updates);
        }
      }

      if (repChange !== 0 && comment.authorUid !== user.uid) {
        await updateDoc(authorRef, { 
          reputation: increment(repChange),
          xp: increment(repChange * 10)
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `comments/${comment.id}`);
    }
  };

  // Reactions engine
  const handleReaction = async (commentId: string, emoji: string) => {
    if (!user) return;
    
    const commentRef = doc(db, 'comments', commentId);
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    const reactions = comment.reactions || {};
    const currentUsers = reactions[emoji] || [];
    const hasReacted = currentUsers.includes(user.uid);

    let updatedUsers;
    if (hasReacted) {
      updatedUsers = currentUsers.filter(uid => uid !== user.uid);
    } else {
      updatedUsers = [...currentUsers, user.uid];
    }

    const updatedReactions = {
      ...reactions,
      [emoji]: updatedUsers
    };

    if (updatedUsers.length === 0) {
      delete updatedReactions[emoji];
    }

    try {
      await updateDoc(commentRef, {
        reactions: updatedReactions
      });
      setActiveEmojiPicker(null);
    } catch (error) {
      console.error("Error updating reaction:", error);
    }
  };

  // Helper text formatters
  const formatCommentText = (text: string) => {
    const regex = /(@\w+|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
    const match = text.match(regex);
    if (!match) return text;

    const formatted: React.ReactNode[] = [];
    text.split(regex).forEach((part, i) => {
      if (part.startsWith('@')) {
        formatted.push(
          <span key={i} className="text-[#ff4d4d] font-bold bg-[#ff4d4d]/10 px-1.5 py-0.5 rounded-md text-[11px] sm:text-xs tracking-wide border border-[#ff4d4d]/20">
            {part}
          </span>
        );
      } else if (part.startsWith('**') && part.endsWith('**')) {
        formatted.push(
          <strong key={i} className="text-white font-extrabold">
            {part.slice(2, -2)}
          </strong>
        );
      } else if (part.startsWith('*') && part.endsWith('*')) {
        formatted.push(
          <em key={i} className="text-white/80 italic">
            {part.slice(1, -1)}
          </em>
        );
      } else if (part.startsWith('`') && part.endsWith('`')) {
        formatted.push(
          <code key={i} className="bg-[#0d0b14] border border-[#3d2b4f]/40 px-1.5 py-0.5 rounded-md text-xs text-[#ff4d4d] font-mono">
            {part.slice(1, -1)}
          </code>
        );
      } else {
        formatted.push(part);
      }
    });

    return formatted;
  };

  const insertTextFormat = (type: 'bold' | 'italic' | 'code', isReply = false) => {
    const textToModify = isReply ? replyContent : newComment;
    const setFunc = isReply ? setReplyContent : setNewComment;
    
    let formattedText = '';
    if (type === 'bold') formattedText = '**жирный**';
    else if (type === 'italic') formattedText = '*курсив*';
    else if (type === 'code') formattedText = '`код`';

    setFunc(textToModify + formattedText);
  };

  const insertEmoji = (emoji: string, isReply = false) => {
    const textToModify = isReply ? replyContent : newComment;
    const setFunc = isReply ? setReplyContent : setNewComment;
    setFunc(textToModify + emoji);
  };

  // Dispatch custom profile viewing event
  const handleProfileClick = (comment: Comment) => {
    const profile = authorProfiles[comment.authorUid];
    window.dispatchEvent(new CustomEvent('openProfile', { 
      detail: { 
        uid: comment.authorUid, 
        displayName: profile?.displayName || comment.authorName, 
        photoURL: profile?.photoURL || comment.authorPhoto,
        role: profile?.role || 'user'
      } 
    }));
  };

  // Compile hierarchical comments lists with sorting
  const repliesMap = useMemo(() => {
    const map: Record<string, Comment[]> = {};
    comments.forEach(c => {
      if (c.parentId) {
        if (!map[c.parentId]) map[c.parentId] = [];
        map[c.parentId].push(c);
      }
    });
    
    Object.keys(map).forEach(parentId => {
      map[parentId].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    });
    return map;
  }, [comments]);

  const topLevelComments = useMemo(() => {
    const raw = comments.filter(c => !c.parentId);
    if (sortBy === 'popular') {
      return [...raw].sort((a, b) => {
        const scoreA = (a.upvotes || []).length - (a.downvotes || []).length;
        const scoreB = (b.upvotes || []).length - (b.downvotes || []).length;
        return scoreB - scoreA;
      });
    }
    return raw;
  }, [comments, sortBy]);

  const renderCommentContent = (comment: Comment, isReply = false) => {
    const isExpanded = expandedComments[comment.id];
    const isLong = comment.content.length > 250;
    const upvotesCount = (comment.upvotes || []).length;
    const downvotesCount = (comment.downvotes || []).length;
    const score = upvotesCount - downvotesCount;
    const hasUpvoted = user && (comment.upvotes || []).includes(user.uid);
    const hasDownvoted = user && (comment.downvotes || []).includes(user.uid);
    
    // Profiles details
    const profile = authorProfiles[comment.authorUid];
    const userRole = profile?.role || 'user';
    const isPremiumUser = profile?.isPremium || false;
    const userLevel = profile?.xp ? Math.floor(profile.xp / 1000) + 1 : 1;
    const userRep = profile?.reputation || 0;

    const getRoleDisplay = () => {
      if (userRole === 'admin') {
        return (
          <span className="bg-red-500/20 text-red-400 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full border border-red-500/30 flex items-center gap-1 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
            <Award size={10} className="shrink-0" />
            Admin
          </span>
        );
      }
      if (userRole === 'moderator') {
        return (
          <span className="bg-violet-500/20 text-violet-400 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full border border-violet-500/30 flex items-center gap-1">
            <Flame size={10} className="shrink-0" />
            Mod
          </span>
        );
      }
      if (userRole === 'beta-tester') {
        return (
          <span className="bg-blue-500/20 text-blue-400 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full border border-blue-500/30 flex items-center gap-1">
            <Star size={10} className="shrink-0" />
            Tester
          </span>
        );
      }
      return null;
    };

    return (
      <motion.div 
        layout
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        key={comment.id} 
        className="flex gap-3 sm:gap-4 group mt-6"
      >
        <button
          onClick={() => handleProfileClick(comment)}
          className="relative shrink-0 hover:scale-110 active:scale-95 transition-transform h-fit mt-1"
        >
          <img
            src={profile?.photoURL || comment.authorPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.authorName)}&background=1c1528&color=fff&size=${lowPerfMode ? '32' : '64'}`}
            alt={comment.authorName}
            loading="lazy"
            className={`w-11 h-11 rounded-2xl border-2 ${isPremiumUser ? 'border-amber-400/80 shadow-[0_0_12px_rgba(251,191,36,0.3)]' : 'border-[#3d2b4f]/50'} shrink-0 object-cover shadow-lg group-hover:border-[#ff4d4d] transition-all`}
          />
          {profile?.lastSeen && (Date.now() - new Date(profile.lastSeen).getTime() < 3 * 60 * 1000) && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#15101e] rounded-full shadow-lg" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="py-2.5 transition-all relative overflow-hidden">
            {/* Background premium aura */}
            {isPremiumUser && (
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-xl pointer-events-none rounded-full" />
            )}

            <div className="flex flex-col gap-1 mb-3 pr-16 relative">
              <div className="flex items-center flex-wrap gap-2">
                <button
                  onClick={() => handleProfileClick(comment)}
                  className="font-black text-white text-sm uppercase tracking-wider hover:text-[#ff4d4d] transition-colors text-left"
                >
                  {profile?.displayName || comment.authorName}
                </button>
                
                {/* Custom badges */}
                {getRoleDisplay()}
                {isPremiumUser && (
                  <span className="bg-amber-500/20 text-amber-400 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1 shadow-[0_0_10px_rgba(251,191,36,0.2)]">
                    <Sparkles size={10} className="shrink-0" />
                    Premium
                  </span>
                )}

                {/* Level / Rep */}
                <span className="text-[10px] font-mono text-gray-500">
                  Lvl {userLevel}
                </span>
                <span className="text-[10px] font-mono text-green-500/80">
                  +{userRep} rep
                </span>

                {user && user.uid !== comment.authorUid && onOpenChat && (
                  <button
                    onClick={() => onOpenChat(comment.authorUid, profile?.displayName || comment.authorName)}
                    className="p-1 bg-[#0d0b14] text-[#ff4d4d] hover:text-white hover:bg-[#ff4d4d] rounded-lg transition-all active:scale-90 border border-[#3d2b4f]/30"
                    title={t.sendMessage}
                  >
                    <MessageCircle size={10} />
                  </button>
                )}
              </div>

              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                  locale: locales[lang] || locales.en
                })}
                {comment.isEdited && <span className="ml-1 italic text-amber-400 opacity-75">({t.edited || "изменено"})</span>}
              </span>

              {/* Edit/Delete menus */}
              <div className="absolute top-0 right-0 flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                {user && (user.uid === comment.authorUid || isModerator) && (
                  <>
                    {user.uid === comment.authorUid && (
                      <button
                        onClick={() => handleEdit(comment)}
                        className="p-1.5 bg-[#0d0b14]/55 text-white/60 hover:text-white hover:bg-[#ff4d4d] rounded-lg transition-all border border-[#3d2b4f]/30"
                        title={t.edit || "Edit"}
                      >
                        <Edit2 size={11} />
                      </button>
                    )}
                    <button
                      onClick={() => setCommentToDelete(comment.id)}
                      className="p-1.5 bg-[#0d0b14]/55 text-white/60 hover:text-white hover:bg-red-500 rounded-lg transition-all border border-[#3d2b4f]/30"
                      title={t.delete || "Удал."}
                    >
                      <Trash2 size={11} />
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
                  {formatCommentText(comment.content)}
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

            {/* Actions bottom footer */}
            <div className="mt-2.5 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-[#0d0b14]/50 p-1 rounded-xl border border-[#3d2b4f]/30">
                  <button
                    onClick={() => handleVote(comment, 'up')}
                    disabled={!user}
                    className={`p-1.5 rounded-lg transition-all ${hasUpvoted ? 'text-green-500 bg-green-500/10' : 'text-white/40 hover:text-green-500 hover:bg-green-500/5'}`}
                  >
                    <ChevronUp size={18} />
                  </button>
                  <span className={`text-xs font-black px-1.5 min-w-[1.5rem] text-center ${score > 0 ? 'text-green-500' : score < 0 ? 'text-red-500' : 'text-white/40'}`}>
                    {score > 0 ? `+${score}` : score}
                  </span>
                  <button
                    onClick={() => handleVote(comment, 'down')}
                    disabled={!user}
                    className={`p-1.5 rounded-lg transition-all ${hasDownvoted ? 'text-red-500 bg-red-500/10' : 'text-white/40 hover:text-red-500 hover:bg-red-500/5'}`}
                  >
                    <ChevronDown size={18} />
                  </button>
                </div>
              </div>

              {user && isVerified && (
                <button
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-[#ff4d4d] transition-all px-3 py-2 rounded-xl hover:bg-[#ff4d4d]/10 border border-transparent hover:border-[#ff4d4d]/30"
                >
                  <CornerDownRight size={14} className="opacity-80" />
                  {t.reply || "Ответить"}
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderCommentTree = (parentId: string | null = null, depth: number = 0) => {
    const commentsAtLevel = parentId ? (repliesMap[parentId] || []) : topLevelComments;
    
    if (commentsAtLevel.length === 0) return null;

    // Do not indent recursively. Only indent the first reply level (depth === 1).
    // Deeper levels (depth > 1) stack straight down with a thin indicator line but no extra margin.
    const indentClass = depth === 1 
      ? 'ml-3 sm:ml-8 mt-3 border-l-2 border-[#3d2b4f]/25 pl-3 sm:pl-6' 
      : depth > 1 
        ? 'mt-3 border-l-2 border-[#3d2b4f]/15 pl-3 sm:pl-4' 
        : '';

    return (
      <div className={`space-y-4 ${indentClass}`}>
        {commentsAtLevel.map(comment => (
          <div key={comment.id} className="space-y-3">
            {renderCommentContent(comment, depth > 0)}
            
            {/* Recursive Replies */}
            {renderCommentTree(comment.id, depth + 1)}

            {/* Reply Input Drawer */}
            {replyingTo === comment.id && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`mt-3 ${depth === 0 ? 'ml-3 sm:ml-8 pl-3 sm:pl-6 border-l-2 border-[#3d2b4f]/25' : ''}`}
              >
                <form onSubmit={(e) => handleSubmit(e, comment.id)} className="space-y-2.5">
                  <div className="relative group">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, comment.id)}
                      placeholder={`${lang === 'ru' ? 'Написать ответ...' : 'Write a reply...'} (Enter для отправки)`}
                      className="w-full bg-[#15101e]/30 border border-[#3d2b4f]/25 rounded-2xl p-4 pr-14 text-white/90 focus:outline-none focus:border-[#ff4d4d]/50 focus:bg-[#15101e]/50 transition-all resize-none min-h-[100px] text-sm font-medium"
                      maxLength={1000}
                    />
                    <button
                      type="submit"
                      disabled={!replyContent.trim() || isSubmitting}
                      className="absolute bottom-4 right-4 p-2.5 bg-[#ff4d4d] text-[#15101e] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#ff7a7a] hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,77,77,0.3)] border border-white/10"
                    >
                      <Send size={14} />
                    </button>
                  </div>

                  {/* Toolbar inside reply form */}
                  <div className="flex justify-between items-center bg-[#0d0b14]/40 px-3 py-2 rounded-xl border border-[#3d2b4f]/20">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => insertTextFormat('bold', true)}
                        className="p-1.5 text-white/40 hover:text-white rounded hover:bg-[#3d2b4f]/30"
                        title="Bold"
                      >
                        <Bold size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTextFormat('italic', true)}
                        className="p-1.5 text-white/40 hover:text-white rounded hover:bg-[#3d2b4f]/30"
                        title="Italic"
                      >
                        <Italic size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTextFormat('code', true)}
                        className="p-1.5 text-white/40 hover:text-white rounded hover:bg-[#3d2b4f]/30"
                        title="Code block"
                      >
                        <Code size={13} />
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="mt-12 pt-12 border-t border-[#15101e]/60">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
          <MessageSquare className="text-[#ff4d4d] shrink-0" size={28} />
          <span>{t.comments || "Комментарии"}</span>
          <span className="bg-[#ff4d4d]/10 text-[#ff4d4d] text-base px-3 py-1 rounded-full border border-[#ff4d4d]/25 shadow-[0_0_15px_rgba(255,77,77,0.15)] font-mono">
            {comments.length}
          </span>
        </h3>

        {/* Sorting Tabs */}
        <div className="flex items-center gap-1.5 bg-[#0d0b14] border border-[#3d2b4f]/40 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setSortBy('newest')}
            className={`flex items-center gap-1 px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
              sortBy === 'newest' 
                ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg' 
                : 'text-white/40 hover:text-white/80'
            }`}
          >
            <Clock size={11} />
            {lang === 'ru' ? 'Новые' : 'Newest'}
          </button>
          <button
            onClick={() => setSortBy('popular')}
            className={`flex items-center gap-1 px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
              sortBy === 'popular' 
                ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg' 
                : 'text-white/40 hover:text-white/80'
            }`}
          >
            <ArrowUpDown size={11} />
            {lang === 'ru' ? 'Популярные' : 'Top'}
          </button>
        </div>
      </div>

      {user ? (
        <div className="mb-12 relative overflow-hidden rounded-[2rem] border border-[#3d2b4f]/20 bg-[#15101e]/15">
          {!isVerified && (
            <div className="absolute inset-0 bg-[#0d0b14]/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center">
              <ShieldAlert size={36} className="text-[#ff4d4d] mb-2 animate-bounce" />
              <h5 className="text-white font-black uppercase tracking-wider text-xs mb-1">
                {lang === 'ru' ? 'Требуется верификация аккаунта' : 'Account Verification Required'}
              </h5>
              <p className="text-white/60 text-[10px] font-black uppercase tracking-widest max-w-sm mb-1 leading-relaxed">
                {lang === 'ru' ? 'Для предотвращения спама и защиты сервиса, писать комментарии могут только подтвержденные пользователи.' : 'To prevent spam and keep the service safe, commenting is restricted to approved members.'}
              </p>
              <p className="text-amber-400 text-[9px] font-black uppercase tracking-widest">
                {lang === 'ru' ? 'Обратитесь к администратору или модератору' : 'Please contact an administrator or moderator'}
              </p>
            </div>
          )}
          <div className="p-5 sm:p-6 space-y-3">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative group">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={hasReachedLimit ? (t.commentLimitReached || "You have reached the comment limit") : (t.writeComment || "Написать комментарий... (Enter для отправки)")}
                  className={`w-full bg-[#15101e]/30 border border-[#3d2b4f]/20 rounded-[2rem] p-5 sm:p-6 pr-16 text-white/90 focus:outline-none focus:border-[#ff4d4d]/50 focus:bg-[#15101e]/50 transition-all resize-none min-h-[140px] text-base font-medium shadow-inner ${hasReachedLimit ? 'opacity-50 cursor-not-allowed' : ''}`}
                  maxLength={2000}
                  disabled={hasReachedLimit}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting || hasReachedLimit}
                  className="absolute bottom-6 right-6 p-3.5 sm:p-4 bg-[#ff4d4d] text-[#15101e] rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#ff7a7a] hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,77,77,0.35)] border border-white/20"
                >
                  <Send size={18} />
                </button>
              </div>

            {/* Input helpers and toolbars */}
            {!hasReachedLimit && (
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#15101e]/50 border border-[#3d2b4f]/30 px-5 py-3 rounded-2xl">
                <div className="flex gap-2 items-center flex-wrap">
                  <span className="text-[10px] font-black uppercase text-white/30 tracking-widest mr-1">{lang === 'ru' ? 'Форматирование:' : 'Format:'}</span>
                  <button
                    type="button"
                    onClick={() => insertTextFormat('bold')}
                    className="p-2 text-white/50 hover:text-white rounded-xl bg-[#0d0b14]/50 border border-[#3d2b4f]/20 hover:border-white/20 transition-all"
                    title="Bold (**text**)"
                  >
                    <Bold size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTextFormat('italic')}
                    className="p-2 text-white/50 hover:text-white rounded-xl bg-[#0d0b14]/50 border border-[#3d2b4f]/20 hover:border-white/20 transition-all"
                    title="Italic (*text*)"
                  >
                    <Italic size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTextFormat('code')}
                    className="p-2 text-white/50 hover:text-white rounded-xl bg-[#0d0b14]/50 border border-[#3d2b4f]/20 hover:border-white/20 transition-all"
                    title="Inline Code (`code`)"
                  >
                    <Code size={14} />
                  </button>
                </div>
              </div>
            )}
          </form>
          
          {hasReachedLimit && (
            <p className="text-red-400 text-[10px] mt-2 font-black uppercase tracking-widest">{t.commentLimitReached || "You have reached the comment limit (max 5) for this post."}</p>
          )}
          </div>
        </div>
      ) : (
        <div className="bg-[#15101e]/60 border border-[#3d2b4f]/20 rounded-[2.5rem] p-8 sm:p-12 text-center mb-12 backdrop-blur-md">
          <MessageSquare size={44} className="mx-auto text-[#ff4d4d]/60 mb-5" />
          <h4 className="text-xl font-black text-white uppercase tracking-wider mb-2">
            {lang === 'ru' ? 'Авторизация' : 'Authorization'}
          </h4>
          <p className="text-white/60 mb-8 font-black uppercase tracking-widest text-xs max-w-md mx-auto">
            {t.loginToComment || "Войдите, чтобы оставить комментарий"}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <GoogleLoginButton lang={lang} />
            <button
              onClick={() => window.dispatchEvent(new Event('openEmailLogin'))}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#3d2b4f]/40 border border-[#3d2b4f] text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-[#ff4d4d] hover:text-[#15101e] hover:border-[#ff4d4d] transition-all active:scale-95 shadow-xl"
            >
              <Mail size={16} />
              {lang === 'ru' ? 'Зарегистрироваться через почту' : 'Register via email'}
            </button>
          </div>
        </div>
      )}

      {/* Dynamic comments render lists */}
      <div className="space-y-6 pb-24">
        {comments.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 bg-[#15101e]/20 border border-[#3d2b4f]/20 rounded-[2.5rem]"
          >
            <MessageSquare size={48} className="mx-auto text-white/10 mb-4 animate-pulse" />
            <h4 className="text-white font-black uppercase tracking-widest text-sm mb-2">
              {lang === 'ru' ? 'Здесь пока пусто' : 'No comments yet'}
            </h4>
            <p className="text-gray-500 text-xs max-w-sm mx-auto leading-relaxed px-4">
              {lang === 'ru' ? 'Будьте первым, кто оставит здесь своё мнение и запустит обсуждение!' : 'Be the first to share your thoughts and start the conversation!'}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {renderCommentTree(null, 0)}
          </AnimatePresence>
        )}
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
