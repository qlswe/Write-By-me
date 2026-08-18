import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ThumbsUp, 
  MessageSquare, 
  Share2, 
  Bookmark, 
  MoreHorizontal, 
  Clock, 
  Globe, 
  FileDown, 
  Pencil, 
  Trash2, 
  Send, 
  Check, 
  ShieldCheck, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Smile,
  Flame,
  Laugh,
  Heart,
  Eye,
  CornerDownRight,
  Pin,
  Bot,
  Maximize2
} from 'lucide-react';
import { Language, translations } from '../../data/translations';
import { useAuth } from '../../hooks/useAuth';
import { TimeAgo } from '../ui/TimeAgo';
import { MediaViewer } from '../ui/MediaViewer';
import { exportContentToPDF } from '../../utils/pdfExport';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';
import { safeStorage } from '../../utils/securityStorage';
import { getLocalizedCategory } from '../../utils/categories';

export interface PostReactionMap {
  [emoji: string]: string[]; // emoji -> array of user uids
}

export interface PostData {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  createdAt: any;
  commentCount?: number;
  imageUrl?: string;
  feeling?: string;
  category?: string;
  upvotes?: string[];
  downvotes?: string[];
  reactions?: PostReactionMap;
  isProtected?: boolean;
  isEdited?: boolean;
  pinned?: boolean;
  shares?: number;
}

export interface CommentData {
  id: string;
  threadId: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  createdAt: any;
  upvotes?: string[];
  downvotes?: string[];
  reactions?: Record<string, string[]>;
  replyToId?: string;
  isBot?: boolean;
  isEdited?: boolean;
}

interface FacebookPostCardProps {
  post: PostData;
  comments: CommentData[];
  lang: Language;
  role?: 'admin' | 'moderator' | 'user' | 'beta-tester';
  isAntiIPCCensorEnabled?: boolean;
  protectedViewFeatureEnabled?: boolean;
  onReact: (postId: string, reactionEmoji: string) => Promise<void>;
  onAddComment: (postId: string, content: string, replyToId?: string) => Promise<void>;
  onSummonAhaBot?: (postId: string) => Promise<void>;
  onEditPost?: (post: PostData) => void;
  onDeletePost?: (postId: string) => void;
  onDeleteComment?: (commentId: string, postId: string) => void;
  onEditComment?: (commentId: string, newContent: string) => void;
  onVoteComment?: (comment: CommentData, type: 'up' | 'down') => void;
  onOpenProfile?: (uid: string, name: string) => void;
  onOpenChat?: (uid: string, name: string) => void;
  onOpenFullPost?: (post: PostData) => void;
}

const REACTION_TYPES = [
  { emoji: '👍', name: 'like', labelRu: 'Нравится', labelEn: 'Like', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { emoji: '❤️', name: 'love', labelRu: 'Супер', labelEn: 'Love', color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { emoji: '🎭', name: 'haha', labelRu: 'Аха-ха', labelEn: 'Joyful', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { emoji: '🔥', name: 'fire', labelRu: 'Огонь', labelEn: 'Fire', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { emoji: '😮', name: 'wow', labelRu: 'Вау', labelEn: 'Wow', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { emoji: '😢', name: 'sad', labelRu: 'Грущу', labelEn: 'Sad', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { emoji: '🤯', name: 'mindblown', labelRu: 'Шок', labelEn: 'Shock', color: 'text-purple-400', bg: 'bg-purple-500/10' },
];

export const FacebookPostCard: React.FC<FacebookPostCardProps> = ({
  post,
  comments,
  lang,
  role,
  isAntiIPCCensorEnabled = false,
  protectedViewFeatureEnabled = false,
  onReact,
  onAddComment,
  onSummonAhaBot,
  onEditPost,
  onDeletePost,
  onDeleteComment,
  onEditComment,
  onVoteComment,
  onOpenProfile,
  onOpenChat,
  onOpenFullPost
}) => {
  const { user } = useAuth();
  const t = translations[lang];

  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSummoningBot, setIsSummoningBot] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(() => {
    const saved = safeStorage.getItem('saved_posts');
    return saved ? JSON.parse(saved).includes(post.id) : false;
  });
  const [isExpandedText, setIsExpandedText] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');

  const handleSummonBotClick = async () => {
    if (isSummoningBot) return;
    setIsSummoningBot(true);
    setShowComments(true);
    try {
      if (onSummonAhaBot) {
        await onSummonAhaBot(post.id);
      }
    } finally {
      setIsSummoningBot(false);
    }
  };
  const [isHighlighted, setIsHighlighted] = useState(false);

  // Listen for scroll & highlight post event from notifications
  useEffect(() => {
    const handleHighlight = (e: any) => {
      if (e.detail?.postId === post.id) {
        setIsHighlighted(true);
        setTimeout(() => setIsHighlighted(false), 3500);
      }
    };
    window.addEventListener('aha_highlight_post', handleHighlight);
    return () => window.removeEventListener('aha_highlight_post', handleHighlight);
  }, [post.id]);

  const isAuthor = user?.uid === post.authorId;
  const canModerate = role === 'admin' || role === 'moderator';

  // Calculate current user's reaction on this post
  const userReaction = React.useMemo(() => {
    if (!user || !post.reactions) return null;
    for (const [emoji, users] of Object.entries(post.reactions)) {
      if (Array.isArray(users) && users.includes(user.uid)) {
        return REACTION_TYPES.find(r => r.emoji === emoji) || { emoji, name: 'custom', labelRu: emoji, labelEn: emoji, color: 'text-[#ff4d4d]', bg: 'bg-[#ff4d4d]/10' };
      }
    }
    // Check upvotes / downvotes fallback
    if (post.upvotes?.includes(user.uid)) {
      return REACTION_TYPES[0]; // 👍
    }
    return null;
  }, [post.reactions, post.upvotes, user]);

  // Aggregate top reactions and total reaction count
  const { totalReactions, topReactions } = React.useMemo(() => {
    let total = 0;
    const counts: { emoji: string; count: number }[] = [];
    
    if (post.reactions) {
      for (const [emoji, users] of Object.entries(post.reactions)) {
        const count = Array.isArray(users) ? users.length : 0;
        if (count > 0) {
          total += count;
          counts.push({ emoji, count });
        }
      }
    }
    
    // Add legacy upvotes if no modern reactions recorded
    if (total === 0 && (post.upvotes?.length || 0) > 0) {
      total = post.upvotes?.length || 0;
      counts.push({ emoji: '👍', count: total });
    }

    counts.sort((a, b) => b.count - a.count);
    return {
      totalReactions: total,
      topReactions: counts.slice(0, 3)
    };
  }, [post.reactions, post.upvotes]);

  // Handle reaction click
  const handleReactionClick = async (emoji: string) => {
    setShowReactionPicker(false);
    if (!user) {
      window.dispatchEvent(new CustomEvent('openEmailLogin'));
      return;
    }
    await onReact(post.id, emoji);
  };

  // Handle Share button click
  const handleShare = () => {
    const shareUrl = `${window.location.origin}/#post_${post.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      window.dispatchEvent(new CustomEvent('aha_toast', {
        detail: lang === 'ru' ? 'Ссылка на публикацию скопирована в буфер!' : 'Post link copied to clipboard!'
      }));
    }
  };

  // Handle Bookmark / Save
  const handleToggleSave = () => {
    const saved = JSON.parse(safeStorage.getItem('saved_posts') || '[]');
    let updated: string[];
    if (saved.includes(post.id)) {
      updated = saved.filter((id: string) => id !== post.id);
      setIsSaved(false);
      window.dispatchEvent(new CustomEvent('aha_toast', {
        detail: lang === 'ru' ? 'Удалено из сохраненных закладок' : 'Removed from saved bookmarks'
      }));
    } else {
      updated = [...saved, post.id];
      setIsSaved(true);
      window.dispatchEvent(new CustomEvent('aha_toast', {
        detail: lang === 'ru' ? 'Сохранено в закладки!' : 'Saved to your bookmarks!'
      }));
    }
    safeStorage.setItem('saved_posts', JSON.stringify(updated));
  };

  // Submit comment
  const handleCommentSubmit = async (replyToId?: string) => {
    const text = replyToId ? replyInput.trim() : commentInput.trim();
    if (!text || isSubmittingComment || !user) return;

    setIsSubmittingComment(true);
    try {
      await onAddComment(post.id, text, replyToId);
      if (replyToId) {
        setReplyInput('');
        setReplyingToId(null);
      } else {
        setCommentInput('');
      }
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Text content processing for censorship and preview limit
  let displayTitle = post.title || '';
  let displayContent = post.content || '';
  if (isAntiIPCCensorEnabled) {
    displayTitle = displayTitle.replace(/кмм/gi, '🤡 КММ').replace(/ipc/gi, '🤡 IPC').replace(/стелларон/gi, '🔮 Стелларон');
    displayContent = displayContent.replace(/кмм/gi, '🤡 КММ').replace(/ipc/gi, '🤡 IPC').replace(/стелларон/gi, '🔮 Стелларон');
  }

  const isContentLong = displayContent.length > 340;
  const renderedContent = isContentLong && !isExpandedText 
    ? displayContent.slice(0, 340) + '...' 
    : displayContent;

  const relevantComments = comments.filter(c => c.threadId === post.id);

  return (
    <div 
      id={`post-${post.id}`}
      className={`bg-[#15101e] border transition-all duration-500 rounded-3xl p-5 sm:p-6 mb-5 shadow-xl relative group ${
        isHighlighted
          ? 'border-[#ff4d4d] ring-4 ring-[#ff4d4d]/30 shadow-[0_0_30px_rgba(255,77,77,0.35)] scale-[1.01]'
          : 'border-[#3d2b4f]/40 hover:border-[#ff4d4d]/30'
      }`}
    >
      
      {/* Pinned Post Badge */}
      {post.pinned && (
        <div className="flex items-center gap-1.5 text-xs font-black text-amber-400 uppercase tracking-widest mb-3 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full w-fit">
          <Pin size={12} className="rotate-45" />
          <span>{lang === 'ru' ? 'Закрепленный пост' : 'Pinned Post'}</span>
        </div>
      )}

      {/* Post Header (Facebook style) */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <img
              src={post.authorPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.authorName || 'User')}&background=1c1528&color=fff`}
              alt={post.authorName}
              onClick={() => onOpenProfile?.(post.authorId, post.authorName)}
              className="w-11 sm:w-12 h-11 sm:h-12 shrink-0 aspect-square rounded-full border-2 border-[#3d2b4f]/60 hover:border-[#ff4d4d] cursor-pointer object-cover transition-colors"
            />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span 
                onClick={() => onOpenProfile?.(post.authorId, post.authorName)}
                className="font-black text-white text-sm sm:text-base hover:text-[#ff4d4d] cursor-pointer transition-colors truncate max-w-[200px] sm:max-w-none"
              >
                {post.authorName}
              </span>

              {/* Verified badge */}
              <ShieldCheck size={15} className="text-[#ff4d4d] shrink-0" />

              {/* Feeling Tag */}
              {post.feeling && (
                <span className="text-xs text-white/60 font-medium">
                  {lang === 'ru' ? '—' : '—'} {post.feeling}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-white/40 mt-0.5">
              <span className="flex items-center gap-1">
                <Clock size={11} />
                <TimeAgo date={post.createdAt} lang={lang} />
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Globe size={11} />
                {lang === 'ru' ? 'Публично' : 'Public'}
              </span>
              {post.category && (
                <>
                  <span>•</span>
                  <span className="px-2 py-0.5 rounded-md bg-[#251c35] text-white/70 text-[10px] font-black uppercase tracking-wider">
                    {getLocalizedCategory(post.category, lang)}
                  </span>
                </>
              )}
              {post.isEdited && (
                <span className="text-[10px] italic text-white/30">
                  ({t.edited || 'изменено'})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Top Header Actions (Expand Fullscreen & 3-Dots Dropdown Menu) */}
        <div className="flex items-center gap-1 shrink-0">
          {onOpenFullPost && (
            <button
              type="button"
              onClick={() => onOpenFullPost(post)}
              className="p-2 text-white/40 hover:text-white hover:bg-[#251c35] rounded-xl transition-all"
              title={lang === 'ru' ? 'Открыть пост полностью' : 'Open full post'}
            >
              <Maximize2 size={17} />
            </button>
          )}

          {/* 3-Dots Dropdown Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-white/40 hover:text-white rounded-xl hover:bg-[#251c35] transition-all"
            >
              <MoreHorizontal size={20} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-10 w-52 bg-[#0d0b14] border border-[#3d2b4f] rounded-2xl shadow-2xl p-1.5 z-30 space-y-1">
                {onOpenFullPost && (
                  <button
                    onClick={() => {
                      onOpenFullPost(post);
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-white/80 hover:text-white hover:bg-[#251c35] rounded-xl flex items-center gap-2.5 transition-colors"
                  >
                    <Maximize2 size={14} className="text-[#ff4d4d]" />
                    {lang === 'ru' ? 'Открыть полностью' : 'Open full post'}
                  </button>
                )}

                <button
                  onClick={() => {
                    handleShare();
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-white/80 hover:text-white hover:bg-[#251c35] rounded-xl flex items-center gap-2.5 transition-colors"
                >
                  <Share2 size={14} className="text-blue-400" />
                  {lang === 'ru' ? 'Скопировать ссылку' : 'Copy post link'}
                </button>

                <button
                  onClick={() => {
                    handleToggleSave();
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-white/80 hover:text-white hover:bg-[#251c35] rounded-xl flex items-center gap-2.5 transition-colors"
                >
                  <Bookmark size={14} className={isSaved ? 'text-amber-400 fill-amber-400' : 'text-amber-400'} />
                  {isSaved 
                    ? (lang === 'ru' ? 'Удалить из закладок' : 'Remove from saved') 
                    : (lang === 'ru' ? 'Сохранить в закладки' : 'Save to bookmarks')}
                </button>

                <button
                  onClick={() => {
                    exportContentToPDF({
                      title: post.title || 'Пост Ахи',
                      author: post.authorName,
                      createdAt: post.createdAt,
                      contentHtml: `<p style="white-space: pre-wrap;">${post.content}</p>`,
                      mediaUrl: post.imageUrl,
                      sectionName: lang === 'ru' ? 'Публикация' : 'Post',
                      lang
                    });
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-white/80 hover:text-white hover:bg-[#251c35] rounded-xl flex items-center gap-2.5 transition-colors"
                >
                  <FileDown size={14} className="text-emerald-400" />
                  {lang === 'ru' ? 'Экспорт в PDF' : 'Export to PDF'}
                </button>

                {isAuthor && onEditPost && (
                  <button
                    onClick={() => {
                      onEditPost(post);
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-white/80 hover:text-white hover:bg-[#251c35] rounded-xl flex items-center gap-2.5 transition-colors"
                  >
                    <Pencil size={14} className="text-sky-400" />
                    {lang === 'ru' ? 'Редактировать' : 'Edit Post'}
                  </button>
                )}

                {(isAuthor || canModerate) && onDeletePost && (
                  <button
                    onClick={() => {
                      onDeletePost(post.id);
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl flex items-center gap-2.5 transition-colors"
                  >
                    <Trash2 size={14} />
                    {lang === 'ru' ? 'Удалить пост' : 'Delete Post'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post Title (if present and distinct from short text) */}
      {displayTitle && displayTitle !== displayContent && (
        <h3 
          onClick={() => onOpenFullPost?.(post)}
          className={`text-lg sm:text-xl font-black text-white tracking-tight mb-2 ${onOpenFullPost ? 'cursor-pointer hover:text-[#ff4d4d] transition-colors' : ''}`}
        >
          {displayTitle}
        </h3>
      )}

      {/* Post Body (Markdown support & Sanitized) */}
      <div className="text-white/90 text-sm sm:text-base leading-relaxed mb-4 whitespace-pre-wrap break-words">
        <MarkdownRenderer content={renderedContent} />
        {isContentLong && (
          <button
            onClick={() => onOpenFullPost ? onOpenFullPost(post) : setIsExpandedText(!isExpandedText)}
            className="text-[#ff4d4d] font-bold text-xs hover:underline mt-1 block"
          >
            {isExpandedText ? (lang === 'ru' ? 'Свернуть' : 'Show less') : (lang === 'ru' ? 'Показать полностью...' : 'See more...')}
          </button>
        )}
      </div>

      {/* Post Media Attachments (Images, YouTube, Videos) */}
      {post.imageUrl && (
        <div 
          onClick={() => onOpenFullPost?.(post)}
          className={`mb-4 rounded-2xl overflow-hidden bg-[#0d0b14] border border-[#3d2b4f]/40 relative group/media ${onOpenFullPost ? 'cursor-pointer' : ''}`}
        >
          <MediaViewer
            url={post.imageUrl}
            isProtected={protectedViewFeatureEnabled && post.isProtected !== false}
            title={post.title}
            maxHeight="max-h-[500px]"
          />
          {onOpenFullPost && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/media:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
              <div className="bg-[#15101e]/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-[#ff4d4d]/50 text-white text-xs font-bold flex items-center gap-2 shadow-2xl scale-95 group-hover/media:scale-100 transition-transform">
                <Maximize2 size={16} className="text-[#ff4d4d]" />
                <span>{lang === 'ru' ? 'Нажмите, чтобы открыть полностью' : 'Click to view full post'}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reaction Summary Bar (Facebook style counter) */}
      <div className="flex items-center justify-between text-xs text-white/50 border-b border-[#3d2b4f]/30 pb-3 mb-2 px-1">
        <div className="flex items-center gap-1.5">
          {topReactions.length > 0 ? (
            <div className="flex items-center -space-x-1">
              {topReactions.map((r, i) => (
                <span
                  key={r.emoji + i}
                  className="w-5 h-5 rounded-full bg-[#251c35] border border-[#3d2b4f] flex items-center justify-center text-xs shadow"
                >
                  {r.emoji}
                </span>
              ))}
            </div>
          ) : (
            <ThumbsUp size={14} className="text-blue-400" />
          )}
          <span className="font-bold text-white/70 ml-1">
            {totalReactions > 0 ? totalReactions : (lang === 'ru' ? 'Будьте первым!' : 'Be the first!')}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowComments(!showComments)}
            className="hover:underline flex items-center gap-1"
          >
            <span>{relevantComments.length || post.commentCount || 0}</span>
            <span>{lang === 'ru' ? 'коммент.' : 'comments'}</span>
          </button>
          <span>•</span>
          <button onClick={handleShare} className="hover:underline flex items-center gap-1">
            <span>{post.shares || 0}</span>
            <span>{lang === 'ru' ? 'репост.' : 'shares'}</span>
          </button>
        </div>
      </div>

      {/* Main Interaction Action Buttons (Facebook Bar: Like, Comment, Bot, Share, Bookmark) */}
      <div className="relative flex items-center justify-between gap-1 sm:gap-2 pt-1 pb-1">
        
        {/* Like / Reaction Button with Floating Reaction Picker */}
        <div 
          className="relative flex-1 min-w-0"
          onMouseEnter={() => setShowReactionPicker(true)}
          onMouseLeave={() => setShowReactionPicker(false)}
        >
          <button
            type="button"
            onClick={() => handleReactionClick(userReaction?.emoji || '👍')}
            className={`w-full flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1.5 sm:px-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
              userReaction 
                ? `${userReaction.bg} ${userReaction.color}` 
                : 'text-white/70 hover:text-white hover:bg-[#251c35]'
            }`}
          >
            <span className="text-sm sm:text-base shrink-0">{userReaction ? userReaction.emoji : '👍'}</span>
            <span className="truncate">{userReaction ? (lang === 'ru' ? userReaction.labelRu : userReaction.labelEn) : (lang === 'ru' ? 'Нравится' : 'Like')}</span>
          </button>

          {/* Floating Animated Reaction Picker (Facebook popover) */}
          <AnimatePresence>
            {showReactionPicker && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: -45, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="absolute left-0 -top-2 z-40 bg-[#0d0b14]/95 backdrop-blur-md border border-[#ff4d4d]/30 rounded-full px-2.5 py-1.5 shadow-2xl flex items-center gap-2"
              >
                {REACTION_TYPES.map((r) => (
                  <motion.button
                    key={r.name}
                    type="button"
                    whileHover={{ scale: 1.35, y: -4 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReactionClick(r.emoji);
                    }}
                    title={lang === 'ru' ? r.labelRu : r.labelEn}
                    className="text-2xl transition-transform cursor-pointer select-none"
                  >
                    {r.emoji}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Comment Button */}
        <button
          type="button"
          onClick={() => setShowComments(!showComments)}
          className={`flex-1 min-w-0 flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1.5 sm:px-2.5 rounded-xl text-xs sm:text-sm font-black text-white/70 hover:text-white hover:bg-[#251c35] transition-all ${showComments ? 'bg-[#251c35] text-white' : ''}`}
        >
          <MessageSquare size={15} className="shrink-0" />
          <span className="truncate">{lang === 'ru' ? 'Коммент' : 'Comment'}</span>
        </button>

        {/* Aha Bot Summon Button */}
        <button
          type="button"
          onClick={handleSummonBotClick}
          disabled={isSummoningBot}
          title={lang === 'ru' ? 'Призвать Аха-Бота для комментария/шутки' : 'Summon Aha Bot to comment'}
          className="flex-1 min-w-0 flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1.5 sm:px-2.5 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-fuchsia-600/20 to-purple-600/20 hover:from-fuchsia-600/35 hover:to-purple-600/35 border border-fuchsia-500/30 text-fuchsia-300 hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-60"
        >
          <Bot size={15} className={`text-fuchsia-400 shrink-0 ${isSummoningBot ? 'animate-spin' : ''}`} />
          <span className="truncate">{isSummoningBot ? (lang === 'ru' ? 'Думает...' : 'Thinking...') : (lang === 'ru' ? 'Аха-Бот' : 'Aha Bot')}</span>
        </button>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          className="flex-1 min-w-0 flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1.5 sm:px-2.5 rounded-xl text-xs sm:text-sm font-black text-white/70 hover:text-white hover:bg-[#251c35] transition-all"
        >
          <Share2 size={15} className="shrink-0" />
          <span className="truncate">{lang === 'ru' ? 'Поделиться' : 'Share'}</span>
        </button>

        {/* Bookmark Button */}
        <button
          type="button"
          onClick={handleToggleSave}
          title={isSaved ? (lang === 'ru' ? 'В закладках' : 'Saved') : (lang === 'ru' ? 'Сохранить' : 'Save')}
          className={`p-2 rounded-xl text-xs shrink-0 transition-all ${
            isSaved ? 'text-amber-400 bg-amber-400/10' : 'text-white/50 hover:text-white hover:bg-[#251c35]'
          }`}
        >
          <Bookmark size={16} className={isSaved ? 'fill-amber-400' : ''} />
        </button>
      </div>

      {/* Inline Comments Section (Facebook style) */}
      {showComments && (
        <div className="border-t border-[#3d2b4f]/30 mt-3 pt-4 space-y-4">
          
          {/* New Comment Input Box */}
          {user ? (
            <div className="flex items-start gap-3">
              <img
                src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=1c1528&color=fff`}
                alt={user.displayName || 'User'}
                className="w-8 h-8 shrink-0 aspect-square rounded-full border border-[#3d2b4f]/60 mt-1 object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="bg-[#0d0b14] border border-[#3d2b4f]/50 focus-within:border-[#ff4d4d] rounded-2xl p-2.5 flex items-center gap-2">
                  <input
                    type="text"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleCommentSubmit();
                      }
                    }}
                    placeholder={lang === 'ru' ? 'Написать комментарий (или позовите @Аха)...' : 'Write a comment (or call @Aha)...'}
                    className="w-full bg-transparent text-sm text-white placeholder-white/40 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSummonBotClick}
                    disabled={isSummoningBot}
                    title={lang === 'ru' ? 'Позвать Аха-Бота' : 'Summon Aha Bot'}
                    className="p-1.5 bg-fuchsia-500/20 hover:bg-fuchsia-500/40 border border-fuchsia-500/30 text-fuchsia-300 rounded-xl transition-all shrink-0 flex items-center gap-1 text-[11px] font-bold"
                  >
                    <Sparkles size={13} className="text-fuchsia-400" />
                    <span className="hidden sm:inline">{lang === 'ru' ? 'Аха' : 'Aha'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCommentSubmit()}
                    disabled={!commentInput.trim() || isSubmittingComment}
                    className="p-1.5 bg-[#ff4d4d] text-[#15101e] rounded-xl font-bold transition-all disabled:opacity-30 hover:bg-white shrink-0"
                  >
                    <Send size={13} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-2 text-xs text-white/50">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('openEmailLogin'))}
                className="text-[#ff4d4d] font-bold hover:underline"
              >
                {lang === 'ru' ? 'Войдите' : 'Sign in'}
              </button>
              {lang === 'ru' ? ', чтобы оставить комментарий' : ' to comment'}
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-3 pt-1">
            {relevantComments.length === 0 ? (
              <p className="text-xs text-white/40 text-center py-3 italic">
                {lang === 'ru' ? 'Комментариев пока нет. Станьте первым!' : 'No comments yet. Be the first!'}
              </p>
            ) : (
              relevantComments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-2.5 group/comment">
                  <img
                    src={comment.authorPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.authorName)}&background=1c1528&color=fff`}
                    alt={comment.authorName}
                    onClick={() => onOpenProfile?.(comment.authorId, comment.authorName)}
                    className="w-8 h-8 shrink-0 aspect-square rounded-full border border-[#3d2b4f]/60 cursor-pointer object-cover mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="bg-[#0d0b14]/90 border border-[#3d2b4f]/30 rounded-2xl px-3.5 py-2.5 w-fit max-w-full">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          onClick={() => onOpenProfile?.(comment.authorId, comment.authorName)}
                          className="text-xs font-black text-white hover:text-[#ff4d4d] cursor-pointer"
                        >
                          {comment.authorName}
                        </span>
                        {comment.isBot && (
                          <span className="text-[9px] bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30 px-1.5 py-0.2 rounded font-black uppercase">
                            BOT
                          </span>
                        )}
                        <span className="text-[10px] text-white/40">
                          <TimeAgo date={comment.createdAt} lang={lang} />
                        </span>
                      </div>

                      {editingCommentId === comment.id ? (
                        <div className="space-y-2 mt-1">
                          <input
                            type="text"
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            className="w-full bg-[#15101e] border border-[#ff4d4d]/40 rounded-xl p-2 text-xs text-white"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingCommentId(null)}
                              className="text-[10px] font-bold text-white/40 hover:text-white"
                            >
                              {lang === 'ru' ? 'Отмена' : 'Cancel'}
                            </button>
                            <button
                              onClick={() => {
                                if (onEditComment && editCommentText.trim()) {
                                  onEditComment(comment.id, editCommentText.trim());
                                  setEditingCommentId(null);
                                }
                              }}
                              className="text-[10px] font-black text-[#ff4d4d] hover:underline"
                            >
                              {lang === 'ru' ? 'Сохранить' : 'Save'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-white/80 whitespace-pre-wrap break-words">
                          {comment.content}
                        </p>
                      )}
                    </div>

                    {/* Comment Sub-Actions (Like, Reply, Edit, Delete) */}
                    <div className="flex items-center gap-3 text-[11px] text-white/40 mt-1 ml-2">
                      <button
                        onClick={() => onVoteComment?.(comment, 'up')}
                        className={`font-bold hover:underline ${
                          comment.upvotes?.includes(user?.uid || '') ? 'text-[#ff4d4d]' : ''
                        }`}
                      >
                        {lang === 'ru' ? 'Нравится' : 'Like'}
                        {(comment.upvotes?.length || 0) > 0 && ` (${comment.upvotes?.length})`}
                      </button>

                      {user && (
                        <button
                          onClick={() => {
                            setReplyingToId(replyingToId === comment.id ? null : comment.id);
                            setReplyInput(`@${comment.authorName} `);
                          }}
                          className="font-bold hover:underline"
                        >
                          {lang === 'ru' ? 'Ответить' : 'Reply'}
                        </button>
                      )}

                      {user?.uid === comment.authorId && (
                        <button
                          onClick={() => {
                            setEditingCommentId(comment.id);
                            setEditCommentText(comment.content);
                          }}
                          className="opacity-0 group-hover/comment:opacity-100 transition-opacity hover:text-blue-400"
                        >
                          <Pencil size={11} />
                        </button>
                      )}

                      {(user?.uid === comment.authorId || canModerate) && onDeleteComment && (
                        <button
                          onClick={() => onDeleteComment(comment.id, post.id)}
                          className="opacity-0 group-hover/comment:opacity-100 transition-opacity hover:text-red-400"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>

                    {/* Reply Input Box */}
                    {replyingToId === comment.id && (
                      <div className="mt-2 ml-4 flex items-center gap-2 bg-[#0d0b14] border border-[#3d2b4f]/40 rounded-xl p-2">
                        <CornerDownRight size={13} className="text-[#ff4d4d]" />
                        <input
                          type="text"
                          value={replyInput}
                          onChange={(e) => setReplyInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleCommentSubmit(comment.id);
                            }
                          }}
                          placeholder={lang === 'ru' ? 'Ваш ответ...' : 'Your reply...'}
                          className="w-full bg-transparent text-xs text-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleCommentSubmit(comment.id)}
                          disabled={!replyInput.trim()}
                          className="px-2.5 py-1 bg-[#ff4d4d] text-[#15101e] font-black text-xs rounded-lg disabled:opacity-30"
                        >
                          {lang === 'ru' ? 'Ответить' : 'Reply'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
