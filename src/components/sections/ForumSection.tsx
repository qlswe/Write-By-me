import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Search, 
  ShieldCheck, 
  Cpu, 
  Key, 
  ShieldAlert, 
  Sparkles, 
  Flame, 
  Lightbulb, 
  Laugh, 
  Calendar, 
  Ticket, 
  Shield, 
  Check, 
  RefreshCw,
  X,
  Lock
} from 'lucide-react';
import { Language, translations } from '../../data/translations';
import { useAuth } from '../../hooks/useAuth';
import { sdk } from '../../sdk';
import { db } from '../../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  serverTimestamp, 
  updateDoc, 
  deleteDoc, 
  limit 
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { ConfirmModal } from '../ui/ConfirmModal';
import { ModalPortal } from '../ui/ModalPortal';
import { StoriesBar } from '../feed/StoriesBar';
import { FacebookPostCreator } from '../feed/FacebookPostCreator';
import { 
  notifyPostComment, 
  notifyCommentReply, 
  notifyPostReaction 
} from '../../utils/notificationService';
import { FacebookPostCard, PostData, CommentData } from '../feed/FacebookPostCard';
import { PostDetailModal } from '../feed/PostDetailModal';
import { PromoSection } from './PromoSection';
import { vercelFallback } from '../../utils/vercelFallback';
import { safeStorage } from '../../utils/securityStorage';

interface ForumSectionProps {
  lang: Language;
  onOpenChat: (uid: string, name: string, photoURL?: string) => void;
  role?: 'admin' | 'moderator' | 'user' | 'beta-tester';
  lowPerfMode?: boolean;
  events?: any[];
  promoCodes?: any[];
  handleCopy?: (text: string) => void;
  onEditEvent?: any;
  onCreateEvent?: any;
  onEditPromo?: (promo: any) => void;
  onCreatePromo?: () => void;
}

export const ForumSection: React.FC<ForumSectionProps> = ({
  lang,
  onOpenChat,
  role,
  lowPerfMode,
  events = [],
  promoCodes = [],
  handleCopy,
  onEditEvent,
  onCreateEvent,
  onEditPromo,
  onCreatePromo
}) => {
  const { user } = useAuth();
  const t = translations[lang];

  // Feed State
  const [threads, setThreads] = useState<PostData[]>([]);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'popular' | 'memes' | 'theories' | 'promo' | 'security'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit / Delete State
  const [editingPost, setEditingPost] = useState<PostData | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<{ id: string; postId: string } | null>(null);

  // Full Post View State
  const [activeDetailPostId, setActiveDetailPostId] = useState<string | null>(null);

  // Listen for hash navigation & custom open post events
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#post-')) {
        const id = hash.replace('#post-', '');
        if (id) setActiveDetailPostId(id);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);

    const handleOpenPostEvent = (e: any) => {
      if (e.detail?.postId) {
        setActiveDetailPostId(e.detail.postId);
      }
    };
    window.addEventListener('aha_open_post', handleOpenPostEvent);

    return () => {
      window.removeEventListener('hashchange', handleHash);
      window.removeEventListener('aha_open_post', handleOpenPostEvent);
    };
  }, []);

  // Security Console State
  const [isE2EEEnabled, setIsE2EEEnabled] = useState(() => safeStorage.getItem('aha_e2ee_enabled') === 'true');
  const [isAntiIPCCensorEnabled, setIsAntiIPCCensorEnabled] = useState(() => safeStorage.getItem('aha_anti_ipc_enabled') === 'true');
  const [protectedViewFeatureEnabled, setProtectedViewFeatureEnabled] = useState(() => safeStorage.getItem('aha_protected_view') === 'true');
  const [securityLogs, setSecurityLogs] = useState<{ id: string; time: string; type: string; msg: string }[]>(() => {
    const saved = safeStorage.getItem('aha_security_logs_feed');
    return saved ? JSON.parse(saved) : [
      { id: '1', time: new Date().toLocaleTimeString(), type: 'SUCCESS', msg: 'AHA-SHIELD v6.0 core operational' },
      { id: '2', time: new Date().toLocaleTimeString(), type: 'INFO', msg: 'SSRF & Content Sanitizer armed' }
    ];
  });

  const addSecurityLog = useCallback((type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT', msg: string) => {
    const newLog = { id: Math.random().toString(), time: new Date().toLocaleTimeString(), type, msg };
    setSecurityLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 30);
      safeStorage.setItem('aha_security_logs_feed', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Fetch Threads in Realtime
  useEffect(() => {
    const q = query(collection(db, 'forum_threads'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const threadsData = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as PostData[];

      // Sort client side
      const sorted = [...threadsData].sort((a, b) => {
        const getTime = (p: PostData) => {
          if (!p.createdAt) return Date.now();
          if (typeof p.createdAt === 'string') return new Date(p.createdAt).getTime();
          if (typeof (p.createdAt as any).toMillis === 'function') return (p.createdAt as any).toMillis();
          if ((p.createdAt as any).seconds) return (p.createdAt as any).seconds * 1000;
          return Date.now();
        };
        return getTime(b) - getTime(a);
      });

      setThreads(sorted);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'forum_threads');
    });

    return () => unsubscribe();
  }, []);

  // Fetch Comments in Realtime
  useEffect(() => {
    const q = query(collection(db, 'forum_comments'), orderBy('createdAt', 'asc'), limit(200));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as CommentData[];
      setComments(commentsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'forum_comments');
    });

    return () => unsubscribe();
  }, []);

  // Create New Post
  const handleCreatePost = async (postData: {
    title: string;
    content: string;
    imageUrl?: string;
    feeling?: string;
    category?: string;
    isProtected?: boolean;
  }) => {
    if (!user) {
      window.dispatchEvent(new CustomEvent('openEmailLogin'));
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        title: postData.title,
        content: postData.content,
        authorId: user.uid,
        authorName: user.displayName || 'Путник Радости',
        authorPhoto: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=1c1528&color=fff`,
        createdAt: serverTimestamp(),
        commentCount: 0,
        reactions: {},
        category: postData.category || 'general',
        isProtected: postData.isProtected || false
      };

      if (postData.imageUrl) payload.imageUrl = postData.imageUrl;
      if (postData.feeling) payload.feeling = postData.feeling;

      await addDoc(collection(db, 'forum_threads'), payload);

      window.dispatchEvent(new CustomEvent('aha_toast', {
        detail: lang === 'ru' ? '🎉 Публикация успешно размещена в ленте!' : '🎉 Post published to feed!'
      }));

      addSecurityLog('SUCCESS', `New post published by ${user.displayName || user.uid}`);
    } catch (err) {
      console.error('Error creating post:', err);
      window.dispatchEvent(new CustomEvent('aha_toast', {
        detail: lang === 'ru' ? 'Ошибка при публикации поста' : 'Error publishing post'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // React to Post (Facebook floating reactions)
  const handleReact = async (postId: string, reactionEmoji: string) => {
    if (!user) {
      window.dispatchEvent(new CustomEvent('openEmailLogin'));
      return;
    }

    try {
      const targetPost = threads.find(t => t.id === postId);
      if (!targetPost) return;

      const updatedReactions: Record<string, string[]> = {};
      if (targetPost.reactions) {
        for (const [em, users] of Object.entries(targetPost.reactions)) {
          if (Array.isArray(users)) {
            updatedReactions[em] = [...users];
          }
        }
      }

      let userCurrentEmoji: string | null = null;
      for (const [em, users] of Object.entries(updatedReactions)) {
        if (users.includes(user.uid)) {
          userCurrentEmoji = em;
          updatedReactions[em] = users.filter(uid => uid !== user.uid);
        }
      }

      // If clicking same emoji, toggle off. Otherwise set new emoji!
      if (userCurrentEmoji !== reactionEmoji) {
        if (!updatedReactions[reactionEmoji]) updatedReactions[reactionEmoji] = [];
        updatedReactions[reactionEmoji].push(user.uid);

        // Notify post author about reaction
        notifyPostReaction({
          postAuthorId: targetPost.authorId,
          postId: targetPost.id,
          postTitle: targetPost.title || targetPost.content,
          reactionEmoji,
          actor: {
            uid: user.uid,
            displayName: user.displayName,
            photoURL: user.photoURL
          }
        }).catch(() => {});
      }

      // Cleanup empty arrays
      for (const [em, users] of Object.entries(updatedReactions)) {
        if (users.length === 0) delete updatedReactions[em];
      }

      // Optimistic update
      setThreads(prev => prev.map(t => t.id === postId ? { ...t, reactions: updatedReactions } : t));

      // Firestore update
      const docRef = doc(db, 'forum_threads', postId);
      await updateDoc(docRef, { reactions: updatedReactions });
    } catch (err) {
      console.error('Error updating reaction:', err);
    }
  };

  // Add Comment to Post
  const handleAddComment = async (postId: string, text: string, replyToId?: string) => {
    if (!user) {
      window.dispatchEvent(new CustomEvent('openEmailLogin'));
      return;
    }

    try {
      const targetPost = threads.find(t => t.id === postId);
      const commentPayload: any = {
        threadId: postId,
        content: text,
        authorId: user.uid,
        authorName: user.displayName || 'Путник Радости',
        authorPhoto: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=1c1528&color=fff`,
        createdAt: serverTimestamp(),
        upvotes: [],
        downvotes: []
      };

      if (replyToId) commentPayload.replyToId = replyToId;

      await addDoc(collection(db, 'forum_comments'), commentPayload);

      // Notify post author
      if (targetPost) {
        notifyPostComment({
          postAuthorId: targetPost.authorId,
          postId: targetPost.id,
          postTitle: targetPost.title || targetPost.content,
          commentAuthor: {
            uid: user.uid,
            displayName: user.displayName,
            photoURL: user.photoURL
          },
          commentSnippet: text
        }).catch(() => {});
      }

      // If this is a reply to another comment, notify the comment author
      if (replyToId) {
        const parentComment = comments.find(c => c.id === replyToId);
        if (parentComment) {
          notifyCommentReply({
            parentCommentAuthorId: parentComment.authorId,
            postId,
            postTitle: targetPost?.title || '',
            commentAuthor: {
              uid: user.uid,
              displayName: user.displayName,
              photoURL: user.photoURL
            },
            replySnippet: text
          }).catch(() => {});
        }
      }

      // Autonomous Bot response if mentioned or asked
      const lowerText = text.toLowerCase();
      const isBotMentioned = lowerText.includes('аха') || lowerText.includes('aha') || lowerText.includes('@аха') || lowerText.includes('@aha') || lowerText.includes('бот') || lowerText.includes('bot');
      const isReplyingToBot = replyToId && comments.some(c => c.id === replyToId && c.isBot);

      if (isBotMentioned || isReplyingToBot) {
        setTimeout(async () => {
          let botReply = "";
          try {
            const aiPrompt = lang === 'ru'
              ? `Ты — остроумный, веселый ИИ-помощник Аха Бот (Aha Bot) из сообщества Honkai Star Rail. Пользователь оставил комментарий/вопрос:\n"${text}"\nВ посте: "${targetPost?.title || ''} - ${targetPost?.content?.slice(0, 150) || ''}"\nОтветь живо, весело, с юмором Радости и эмодзи (1-2 предложения).`
              : `You are the witty, playful AI assistant Aha Bot in the Honkai Star Rail community. A user commented/asked:\n"${text}"\nIn post: "${targetPost?.title || ''} - ${targetPost?.content?.slice(0, 150) || ''}"\nReply wittily with joyful humor and emojis (1-2 sentences).`;
            
            botReply = await sdk.genai.generate(aiPrompt, lang);
          } catch (e) {
            console.warn("AI generation failed in comment reply:", e);
          }

          if (!botReply || botReply.includes('error')) {
            const botQuotes = [
              'Ха-ха-ха! Радость пронизывает все сущее! Твои слова услышаны Ахой! 🎭',
              'Мудро сказано! Или безумно? Какая разница, если это смешно! 🚀',
              'Аха ставит свой божественный лайк этой мысли! ✨',
              'КММ в ярости от этого комментария, а мы празднуем! 🤡'
            ];
            botReply = botQuotes[Math.floor(Math.random() * botQuotes.length)];
          }

          await addDoc(collection(db, 'forum_comments'), {
            threadId: postId,
            content: botReply,
            authorId: 'system-aha-bot',
            authorName: 'Aha Bot 6.0 🎭',
            authorPhoto: 'https://ui-avatars.com/api/?name=Aha+Bot&background=d946ef&color=fff',
            createdAt: serverTimestamp(),
            isBot: true,
            replyToId: replyToId || undefined,
            upvotes: [],
            downvotes: []
          });
        }, 1000);
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  // Summon Aha Bot on any post directly
  const handleSummonAhaBot = async (postId: string) => {
    try {
      const targetPost = threads.find(t => t.id === postId);
      if (!targetPost) return;

      window.dispatchEvent(new CustomEvent('aha_toast', { 
        detail: lang === 'ru' ? '🎭 Аха-Бот читает пост и придумывает ответ...' : '🎭 Aha Bot is reading the post...' 
      }));

      const prompt = `Ты — Эон Радости Аха из Honkai: Star Rail (или безумный весёлый Аха-Бот). Прочитай этот пост пользователя:\nЗаголовок: "${targetPost.title || ''}"\nТекст: "${targetPost.content || ''}"\nНапиши короткий (1-3 предложения), искрометный, остроумный, смешной комментарий с эмодзи в стиле Недотёп в масках и Радости.`;

      let botReply = "";
      try {
        botReply = await sdk.genai.generate(prompt, lang);
      } catch (e) {
        console.warn("AI generation failed, fallbacking", e);
      }

      if (!botReply || botReply.includes('error')) {
        const fallbacks = [
          'Ха-ха-ха! Великолепно! Даже Звездный Экспресс не разгонится быстрее, чем этот пост! 🚂✨',
          'Аха одобряет этот ход мысли! Добавим немного космического хаоса в ленту! 🎭💥',
          'КММ пыталась заблокировать этот пост, но Радость победила! 🤡🪐',
          'Вот это поворот! Эоны аплодируют стоя! 🌟🎉'
        ];
        botReply = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      }

      await addDoc(collection(db, 'forum_comments'), {
        threadId: postId,
        content: botReply,
        authorId: 'system-aha-bot',
        authorName: 'Aha Bot 6.0 🎭',
        authorPhoto: 'https://ui-avatars.com/api/?name=Aha+Bot&background=d946ef&color=fff',
        createdAt: serverTimestamp(),
        isBot: true,
        upvotes: [],
        downvotes: []
      });

      // Send notification to the post author
      if (targetPost.authorId) {
        notifyPostComment({
          postAuthorId: targetPost.authorId,
          postId: targetPost.id,
          postTitle: targetPost.title || targetPost.content,
          commentAuthor: {
            uid: 'system-aha-bot',
            displayName: 'Aha Bot 6.0 🎭',
            photoURL: 'https://ui-avatars.com/api/?name=Aha+Bot&background=d946ef&color=fff'
          },
          commentSnippet: botReply
        }).catch(() => {});
      }

      window.dispatchEvent(new CustomEvent('aha_toast', { 
        detail: lang === 'ru' ? '✨ Аха-Бот оставил комментарий!' : '✨ Aha Bot replied with a comment!' 
      }));
    } catch (err) {
      console.error('Error summoning Aha Bot:', err);
    }
  };

  // Vote on Comment
  const handleVoteComment = async (comment: CommentData, type: 'up' | 'down') => {
    if (!user) {
      window.dispatchEvent(new CustomEvent('openEmailLogin'));
      return;
    }

    try {
      const currentUpvotes = comment.upvotes || [];
      const hasUpvoted = currentUpvotes.includes(user.uid);
      const newUpvotes = hasUpvoted 
        ? currentUpvotes.filter(uid => uid !== user.uid)
        : [...currentUpvotes, user.uid];

      const docRef = doc(db, 'forum_comments', comment.id);
      await updateDoc(docRef, { upvotes: newUpvotes });

      setComments(prev => prev.map(c => c.id === comment.id ? { ...c, upvotes: newUpvotes } : c));
    } catch (err) {
      console.error('Error voting comment:', err);
    }
  };

  // Edit Comment
  const handleEditComment = async (commentId: string, newContent: string) => {
    try {
      const docRef = doc(db, 'forum_comments', commentId);
      await updateDoc(docRef, {
        content: newContent,
        isEdited: true
      });
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: newContent, isEdited: true } : c));
    } catch (err) {
      console.error('Error editing comment:', err);
    }
  };

  // Delete Post
  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    try {
      await deleteDoc(doc(db, 'forum_threads', postToDelete));
      setThreads(prev => prev.filter(t => t.id !== postToDelete));
      setPostToDelete(null);
      window.dispatchEvent(new CustomEvent('aha_toast', {
        detail: lang === 'ru' ? 'Пост удален' : 'Post deleted'
      }));
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  // Delete Comment
  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;
    try {
      await deleteDoc(doc(db, 'forum_comments', commentToDelete.id));
      setComments(prev => prev.filter(c => c.id !== commentToDelete.id));
      setCommentToDelete(null);
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  // Filter Posts by Tab and Search
  const filteredPosts = threads.filter(post => {
    const matchesSearch = 
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.authorName?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'memes') {
      return post.category === 'memes' || post.feeling?.includes('🎭') || post.content.toLowerCase().includes('мем');
    }
    if (activeTab === 'theories') {
      return post.category === 'theories' || post.feeling?.includes('💡') || post.title.toLowerCase().includes('теория');
    }
    if (activeTab === 'popular') {
      const totalReactions = Object.values(post.reactions || {}).reduce((acc, u) => acc + (u?.length || 0), 0) + (post.upvotes?.length || 0);
      return totalReactions >= 2 || (post.commentCount || 0) >= 2;
    }

    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Top Banner / Feed Header */}
      <div className="bg-[#15101e] border border-[#3d2b4f]/40 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ff4d4d]/20 to-[#3d2b4f]/40 border border-[#ff4d4d]/40 flex items-center justify-center text-[#ff4d4d] shadow-lg">
              <Activity size={26} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                {lang === 'ru' ? 'Активности и Посты' : 'Activities & Posts'}
                <span className="text-xs bg-[#ff4d4d]/20 text-[#ff4d4d] border border-[#ff4d4d]/30 px-2 py-0.5 rounded-full font-black uppercase">
                  v6.0
                </span>
              </h2>
              <p className="text-xs text-white/50">
                {lang === 'ru' 
                  ? 'Социальная лента Радости: делитесь историями, реакциями, теориями и мемами' 
                  : 'Social Elation Feed: stories, reactions, lore theories, and community posts'}
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative min-w-[220px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'ru' ? 'Поиск по ленте...' : 'Search feed...'}
              className="w-full bg-[#0d0b14] border border-[#3d2b4f]/50 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#ff4d4d] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filter Navigation Tabs (Facebook-like) */}
        <div className="flex items-center gap-2 overflow-x-auto pt-4 border-t border-[#3d2b4f]/30 mt-4 scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
              activeTab === 'all' 
                ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg shadow-[#ff4d4d]/20' 
                : 'text-white/60 hover:text-white hover:bg-[#251c35]'
            }`}
          >
            <Sparkles size={14} />
            <span>{lang === 'ru' ? 'Все посты' : 'Feed'}</span>
          </button>

          <button
            onClick={() => setActiveTab('popular')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
              activeTab === 'popular' 
                ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg shadow-[#ff4d4d]/20' 
                : 'text-white/60 hover:text-white hover:bg-[#251c35]'
            }`}
          >
            <Flame size={14} />
            <span>{lang === 'ru' ? 'Популярное' : 'Trending'}</span>
          </button>

          <button
            onClick={() => setActiveTab('memes')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
              activeTab === 'memes' 
                ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg shadow-[#ff4d4d]/20' 
                : 'text-white/60 hover:text-white hover:bg-[#251c35]'
            }`}
          >
            <Laugh size={14} />
            <span>{lang === 'ru' ? 'Мемы & Аха' : 'Memes'}</span>
          </button>

          <button
            onClick={() => setActiveTab('theories')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
              activeTab === 'theories' 
                ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg shadow-[#ff4d4d]/20' 
                : 'text-white/60 hover:text-white hover:bg-[#251c35]'
            }`}
          >
            <Lightbulb size={14} />
            <span>{lang === 'ru' ? 'Теории' : 'Theories'}</span>
          </button>

          <button
            onClick={() => setActiveTab('promo')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
              activeTab === 'promo' 
                ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg shadow-[#ff4d4d]/20' 
                : 'text-white/60 hover:text-white hover:bg-[#251c35]'
            }`}
          >
            <Ticket size={14} />
            <span>{lang === 'ru' ? 'Промокоды' : 'Promo Codes'}</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 ml-auto cursor-pointer ${
              activeTab === 'security' 
                ? 'bg-purple-600 text-white shadow-lg' 
                : 'text-white/40 hover:text-white hover:bg-[#251c35]'
            }`}
          >
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>{lang === 'ru' ? 'Безопасность' : 'Security'}</span>
          </button>
        </div>
      </div>

      {/* Stories / Activity Highlights Bar */}
      {activeTab !== 'security' && activeTab !== 'promo' && (
        <StoriesBar
          lang={lang}
          events={events}
          promoCodes={promoCodes}
          handleCopy={handleCopy}
          onSelectEvent={() => setActiveTab('promo')}
        />
      )}

      {/* Main Feed View */}
      {activeTab !== 'security' && activeTab !== 'promo' && (
        <>
          {/* Facebook-style Post Creator Widget */}
          <FacebookPostCreator
            lang={lang}
            onSubmit={handleCreatePost}
            isSubmitting={isSubmitting}
          />

          {/* Posts Feed */}
          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <div className="bg-[#15101e] border border-[#3d2b4f]/40 rounded-3xl p-10 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-[#ff4d4d]/10 text-[#ff4d4d] flex items-center justify-center mx-auto">
                  <Activity size={28} />
                </div>
                <h3 className="text-base font-black text-white">
                  {lang === 'ru' ? 'В этой категории пока нет постов' : 'No posts in this category yet'}
                </h3>
                <p className="text-xs text-white/50 max-w-sm mx-auto">
                  {lang === 'ru' ? 'Будьте первым, кто опубликует запись в ленте Радости!' : 'Be the first to share an update on the feed!'}
                </p>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <FacebookPostCard
                  key={post.id}
                  post={post}
                  comments={comments}
                  lang={lang}
                  role={role}
                  isAntiIPCCensorEnabled={isAntiIPCCensorEnabled}
                  protectedViewFeatureEnabled={protectedViewFeatureEnabled}
                  onReact={handleReact}
                  onAddComment={handleAddComment}
                  onSummonAhaBot={handleSummonAhaBot}
                  onDeletePost={(id) => setPostToDelete(id)}
                  onEditPost={(p) => {
                    setEditingPost(p);
                    setEditTitle(p.title);
                    setEditContent(p.content);
                  }}
                  onDeleteComment={(commentId, postId) => setCommentToDelete({ id: commentId, postId })}
                  onEditComment={handleEditComment}
                  onVoteComment={handleVoteComment}
                  onOpenProfile={(uid, name) => onOpenChat(uid, name)}
                  onOpenChat={onOpenChat}
                  onOpenFullPost={(p) => setActiveDetailPostId(p.id)}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* Promo Integrated View */}
      {activeTab === 'promo' && (
        <div className="space-y-6">
          <div className="bg-[#15101e] border border-[#3d2b4f]/40 rounded-3xl p-6">
            <h3 className="text-lg font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Ticket className="text-amber-400" size={20} />
              {lang === 'ru' ? 'Активные Промокоды' : 'Active Promo Codes'}
            </h3>
            <PromoSection
              lang={lang}
              handleCopy={handleCopy || (() => {})}
              promoCodes={promoCodes}
              role={role}
              onOpenEditor={onCreatePromo}
              onEdit={onEditPromo}
            />
          </div>
        </div>
      )}

      {/* Security Console Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Security Controls */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-[#15101e] border border-[#3d2b4f]/40 rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10 text-[#ff4d4d]">
                  <Shield size={100} />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ShieldCheck className="text-emerald-400" size={20} />
                  {lang === 'ru' ? 'Допуск Безопасности' : 'Security Clearance'}
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">{lang === 'ru' ? 'Уровень допуска:' : 'Clearance Level:'}</span>
                    <span className="bg-[#ff4d4d]/10 text-[#ff4d4d] border border-[#ff4d4d]/30 px-2.5 py-0.5 rounded-md font-black uppercase">
                      {role === 'admin' ? 'LEVEL 5 (ADMIN)' : role === 'moderator' ? 'LEVEL 4 (MOD)' : 'LEVEL 2 (FOOL)'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">{lang === 'ru' ? 'Анти-XSS Санитайзер:' : 'Anti-XSS Sanitizer:'}</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Check size={13} /> {lang === 'ru' ? 'Активен' : 'Active'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">{lang === 'ru' ? 'SSRF & Хост фильтр:' : 'SSRF & Host Shield:'}</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Check size={13} /> {lang === 'ru' ? 'Защищен' : 'Protected'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Protocol Switches */}
              <div className="bg-[#15101e] border border-[#3d2b4f]/40 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Cpu size={16} className="text-[#ff4d4d]" />
                  {lang === 'ru' ? 'Протоколы Безопасности' : 'Security Protocols'}
                </h3>

                {/* E2EE Switch */}
                <div className="p-3.5 bg-[#0d0b14]/70 rounded-2xl border border-[#3d2b4f]/30 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Key size={13} className="text-[#ff4d4d]" />
                      {lang === 'ru' ? 'E2EE Шифрование' : 'E2EE Chat Encryption'}
                    </div>
                    <p className="text-[11px] text-white/40">
                      {lang === 'ru' ? 'Шифрует сообщения в чатах' : 'Client-side message encryption'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const next = !isE2EEEnabled;
                      setIsE2EEEnabled(next);
                      safeStorage.setItem('aha_e2ee_enabled', next ? 'true' : 'false');
                      addSecurityLog(next ? 'SUCCESS' : 'WARNING', `E2EE Encryption ${next ? 'enabled' : 'disabled'}`);
                    }}
                    className={`w-11 h-6 rounded-full p-1 transition-colors ${isE2EEEnabled ? 'bg-emerald-500' : 'bg-[#0d0b14] border border-[#3d2b4f]'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isE2EEEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Anti-IPC Filter */}
                <div className="p-3.5 bg-[#0d0b14]/70 rounded-2xl border border-[#3d2b4f]/30 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ShieldAlert size={13} className="text-[#ff4d4d]" />
                      {lang === 'ru' ? 'Цензор КММ / IPC' : 'Anti-IPC Censor'}
                    </div>
                    <p className="text-[11px] text-white/40">
                      {lang === 'ru' ? 'Заменяет КММ на клоунов' : 'Replaces IPC with clown emojis'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const next = !isAntiIPCCensorEnabled;
                      setIsAntiIPCCensorEnabled(next);
                      safeStorage.setItem('aha_anti_ipc_enabled', next ? 'true' : 'false');
                      addSecurityLog(next ? 'SUCCESS' : 'WARNING', `Anti-IPC filter ${next ? 'activated' : 'deactivated'}`);
                    }}
                    className={`w-11 h-6 rounded-full p-1 transition-colors ${isAntiIPCCensorEnabled ? 'bg-emerald-500' : 'bg-[#0d0b14] border border-[#3d2b4f]'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isAntiIPCCensorEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Security Logs Console */}
            <div className="lg:col-span-7">
              <div className="bg-[#0d0b14] border border-[#3d2b4f]/40 rounded-3xl p-5 font-mono h-[380px] flex flex-col shadow-2xl">
                <div className="flex items-center justify-between border-b border-[#3d2b4f]/40 pb-3 mb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs text-white/70 font-black tracking-widest uppercase">
                      {lang === 'ru' ? 'ЛОГИ БЕЗОПАСНОСТИ' : 'SECURITY CORE AUDIT'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSecurityLogs([]);
                      safeStorage.removeItem('aha_security_logs_feed');
                    }}
                    className="text-[10px] text-white/40 hover:text-white uppercase font-bold"
                  >
                    [Clear]
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 text-xs pr-1 scrollbar-thin scrollbar-thumb-[#3d2b4f]">
                  {securityLogs.map(log => (
                    <div key={log.id} className="leading-relaxed">
                      <span className="text-white/30 mr-2">[{log.time}]</span>
                      <span className={`font-black mr-2 ${
                        log.type === 'ALERT' ? 'text-red-400' : 
                        log.type === 'WARNING' ? 'text-yellow-400' : 
                        log.type === 'SUCCESS' ? 'text-emerald-400' : 'text-blue-400'
                      }`}>
                        {log.type}
                      </span>
                      <span className="text-white/80">{log.msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-lg bg-[#15101e] border border-[#ff4d4d]/40 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  {lang === 'ru' ? 'Редактировать публикацию' : 'Edit Post'}
                </h3>
                <button onClick={() => setEditingPost(null)} className="text-white/40 hover:text-white">
                  ✕
                </button>
              </div>

              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Title"
                className="w-full bg-[#0d0b14] border border-[#3d2b4f]/60 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#ff4d4d]"
              />

              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Content"
                className="w-full bg-[#0d0b14] border border-[#3d2b4f]/60 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#ff4d4d] min-h-[140px]"
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditingPost(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white/40 hover:text-white"
                >
                  {lang === 'ru' ? 'Отмена' : 'Cancel'}
                </button>
                <button
                  onClick={async () => {
                    try {
                      await updateDoc(doc(db, 'forum_threads', editingPost.id), {
                        title: editTitle.trim(),
                        content: editContent.trim(),
                        isEdited: true
                      });
                      setThreads(prev => prev.map(t => t.id === editingPost.id ? { ...t, title: editTitle.trim(), content: editContent.trim(), isEdited: true } : t));
                      setEditingPost(null);
                      window.dispatchEvent(new CustomEvent('aha_toast', {
                        detail: lang === 'ru' ? 'Публикация обновлена!' : 'Post updated!'
                      }));
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="px-5 py-2 bg-[#ff4d4d] text-[#15101e] font-black text-xs uppercase tracking-wider rounded-xl hover:bg-white transition-all"
                >
                  {lang === 'ru' ? 'Сохранить' : 'Save'}
                </button>
              </div>
            </motion.div>
          </div>
        </ModalPortal>
      )}

      {/* Delete Post Confirm */}
      <ConfirmModal
        isOpen={!!postToDelete}
        onClose={() => setPostToDelete(null)}
        onConfirm={confirmDeletePost}
        title={lang === 'ru' ? 'Удалить публикацию?' : 'Delete Post?'}
        message={lang === 'ru' ? 'Вы уверены, что хотите безвозвратно удалить этот пост?' : 'Are you sure you want to permanently delete this post?'}
        confirmText={lang === 'ru' ? 'Удалить' : 'Delete'}
        cancelText={lang === 'ru' ? 'Отмена' : 'Cancel'}
        isDestructive={true}
      />

      {/* Delete Comment Confirm */}
      <ConfirmModal
        isOpen={!!commentToDelete}
        onClose={() => setCommentToDelete(null)}
        onConfirm={confirmDeleteComment}
        title={lang === 'ru' ? 'Удалить комментарий?' : 'Delete Comment?'}
        message={lang === 'ru' ? 'Вы уверены, что хотите удалить этот комментарий?' : 'Are you sure you want to delete this comment?'}
        confirmText={lang === 'ru' ? 'Удалить' : 'Delete'}
        cancelText={lang === 'ru' ? 'Отмена' : 'Cancel'}
        isDestructive={true}
      />

      {/* Full Screen Post Detail Modal */}
      {activeDetailPostId && (() => {
        const activePost = threads.find(t => t.id === activeDetailPostId);
        if (!activePost) return null;
        
        const currentIndex = filteredPosts.findIndex(p => p.id === activePost.id);
        const hasPrev = currentIndex > 0;
        const hasNext = currentIndex >= 0 && currentIndex < filteredPosts.length - 1;

        return (
          <PostDetailModal
            post={activePost}
            comments={comments}
            lang={lang}
            role={role}
            isAntiIPCCensorEnabled={isAntiIPCCensorEnabled}
            protectedViewFeatureEnabled={protectedViewFeatureEnabled}
            onClose={() => {
              setActiveDetailPostId(null);
              if (window.location.hash.startsWith('#post-')) {
                history.pushState(null, '', window.location.pathname + window.location.search);
              }
            }}
            onPrevPost={hasPrev ? () => setActiveDetailPostId(filteredPosts[currentIndex - 1].id) : undefined}
            onNextPost={hasNext ? () => setActiveDetailPostId(filteredPosts[currentIndex + 1].id) : undefined}
            hasPrev={hasPrev}
            hasNext={hasNext}
            onReact={handleReact}
            onAddComment={handleAddComment}
            onSummonAhaBot={handleSummonAhaBot}
            onDeletePost={(id) => {
              setActiveDetailPostId(null);
              setPostToDelete(id);
            }}
            onEditPost={(p) => {
              setActiveDetailPostId(null);
              setEditingPost(p);
              setEditTitle(p.title);
              setEditContent(p.content);
            }}
            onDeleteComment={(commentId, postId) => setCommentToDelete({ id: commentId, postId })}
            onEditComment={handleEditComment}
            onVoteComment={handleVoteComment}
            onOpenProfile={(uid, name) => onOpenChat(uid, name)}
            onOpenChat={onOpenChat}
          />
        );
      })()}
    </div>
  );
};
