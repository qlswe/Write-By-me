import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
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
  ShieldCheck, 
  Sparkles, 
  Smile, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  Maximize2, 
  Minimize2, 
  Bot, 
  Pin, 
  ShieldAlert, 
  ExternalLink,
  Layers
} from 'lucide-react';
import { Language, translations } from '../../data/translations';
import { useAuth } from '../../hooks/useAuth';
import { TimeAgo } from '../ui/TimeAgo';
import { resolveMediaUrl, isVideoMedia, getEmbedVideoUrl } from '../ui/MediaViewer';
import { KuruVideoPlayer } from '../ui/KuruVideoPlayer';
import { exportContentToPDF } from '../../utils/pdfExport';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';
import { safeStorage } from '../../utils/securityStorage';
import { getLocalizedCategory } from '../../utils/categories';
import { ModalPortal } from '../ui/ModalPortal';
import { PostData, CommentData } from './FacebookPostCard';

interface PostDetailModalProps {
  post: PostData;
  comments: CommentData[];
  lang: Language;
  role?: 'admin' | 'moderator' | 'user' | 'beta-tester';
  isAntiIPCCensorEnabled?: boolean;
  protectedViewFeatureEnabled?: boolean;
  onClose: () => void;
  onPrevPost?: () => void;
  onNextPost?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
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

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  comments,
  lang,
  role,
  isAntiIPCCensorEnabled = false,
  protectedViewFeatureEnabled = false,
  onClose,
  onPrevPost,
  onNextPost,
  hasPrev = false,
  hasNext = false,
  onReact,
  onAddComment,
  onSummonAhaBot,
  onEditPost,
  onDeletePost,
  onDeleteComment,
  onEditComment,
  onVoteComment,
  onOpenProfile,
  onOpenChat
}) => {
  const { user } = useAuth();
  const t = translations[lang];

  // Comment input state
  const [commentInput, setCommentInput] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSummoningBot, setIsSummoningBot] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Zoom & Image viewing controls
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pixelated, setPixelated] = useState(true);
  const [fullscreenImage, setFullscreenImage] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  // Edit comment state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');

  // Saved / Bookmark
  const [isSaved, setIsSaved] = useState(() => {
    const saved = safeStorage.getItem('saved_posts');
    return saved ? JSON.parse(saved).includes(post.id) : false;
  });

  // Hotkeys: ESC to close, Left/Right arrow for navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (fullscreenImage) {
          setFullscreenImage(false);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowLeft' && hasPrev && onPrevPost) {
        onPrevPost();
      } else if (e.key === 'ArrowRight' && hasNext && onNextPost) {
        onNextPost();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrevPost, onNextPost, hasPrev, hasNext, fullscreenImage]);

  // Lock body scroll
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const handleShare = () => {
    const url = `${window.location.origin}/#post-${post.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  const handleToggleSave = () => {
    const saved = safeStorage.getItem('saved_posts');
    let list: string[] = saved ? JSON.parse(saved) : [];
    if (list.includes(post.id)) {
      list = list.filter(id => id !== post.id);
      setIsSaved(false);
    } else {
      list.push(post.id);
      setIsSaved(true);
    }
    safeStorage.setItem('saved_posts', JSON.stringify(list));
  };

  const handleCommentSubmit = async (replyToId?: string) => {
    const text = replyToId ? replyInput : commentInput;
    if (!text.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      await onAddComment(post.id, text.trim(), replyToId);
      if (replyToId) {
        setReplyInput('');
        setReplyingToId(null);
      } else {
        setCommentInput('');
      }
    } catch (err) {
      console.error('Failed to post comment in modal:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleSummonBotClick = async () => {
    if (isSummoningBot) return;
    setIsSummoningBot(true);
    try {
      if (onSummonAhaBot) {
        await onSummonAhaBot(post.id);
      }
    } finally {
      setIsSummoningBot(false);
    }
  };

  const isAuthor = user && (user.uid === post.authorId);
  const canModerate = role === 'admin' || role === 'moderator';

  // Find user's active reaction
  const userReaction = REACTION_TYPES.find(r => 
    user && post.reactions?.[r.emoji]?.includes(user.uid)
  );

  // Reaction counts
  const totalReactions = Object.values(post.reactions || {}).reduce((acc, u) => acc + (u?.length || 0), 0) + (post.upvotes?.length || 0);
  const topReactions = REACTION_TYPES
    .filter(r => (post.reactions?.[r.emoji]?.length || 0) > 0)
    .sort((a, b) => (post.reactions?.[b.emoji]?.length || 0) - (post.reactions?.[a.emoji]?.length || 0));

  let displayTitle = post.title || '';
  let displayContent = post.content || '';
  if (isAntiIPCCensorEnabled) {
    displayTitle = displayTitle.replace(/кмм/gi, '🤡 КММ').replace(/ipc/gi, '🤡 IPC').replace(/стелларон/gi, '🔮 Стелларон');
    displayContent = displayContent.replace(/кмм/gi, '🤡 КММ').replace(/ipc/gi, '🤡 IPC').replace(/стелларон/gi, '🔮 Стелларон');
  }

  const relevantComments = comments.filter(c => c.threadId === post.id);
  const resolvedMedia = post.imageUrl ? resolveMediaUrl(post.imageUrl) : '';
  const isVideo = post.imageUrl ? isVideoMedia(post.imageUrl) : false;
  const embedVideo = post.imageUrl ? getEmbedVideoUrl(resolvedMedia) : null;

  return (
    <ModalPortal>
      <div
        id="post-detail-backdrop"
        className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
      {/* Toast */}
      {copiedToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[70] bg-[#1a1426] text-[#ff4d4d] border border-[#ff4d4d] px-4 py-2 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2">
          <Sparkles size={16} />
          <span>{lang === 'ru' ? 'Ссылка на пост скопирована!' : 'Post link copied!'}</span>
        </div>
      )}

      {/* Navigation Arrow Left (Prev Post) */}
      {hasPrev && onPrevPost && (
        <button
          type="button"
          onClick={onPrevPost}
          className="hidden md:flex fixed left-4 top-1/2 -translate-y-1/2 z-[60] w-12 h-12 rounded-2xl bg-[#1a1426]/90 hover:bg-[#ff4d4d] text-white hover:text-[#15101e] border border-[#3d2b4f] items-center justify-center shadow-2xl transition-all cursor-pointer group"
          title={lang === 'ru' ? 'Предыдущий пост (Стрелка влево)' : 'Previous post (Left arrow)'}
        >
          <ChevronLeft size={24} className="group-hover:-translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* Navigation Arrow Right (Next Post) */}
      {hasNext && onNextPost && (
        <button
          type="button"
          onClick={onNextPost}
          className="hidden md:flex fixed right-4 top-1/2 -translate-y-1/2 z-[60] w-12 h-12 rounded-2xl bg-[#1a1426]/90 hover:bg-[#ff4d4d] text-white hover:text-[#15101e] border border-[#3d2b4f] items-center justify-center shadow-2xl transition-all cursor-pointer group"
          title={lang === 'ru' ? 'Следующий пост (Стрелка вправо)' : 'Next post (Right arrow)'}
        >
          <ChevronRight size={24} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* Main Modal Card Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.18 }}
        className="relative w-full max-w-2xl max-h-[88vh] bg-[#15101e] border border-[#3d2b4f] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#1a1426]/90 border-b border-[#3d2b4f]/40 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={post.authorPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.authorName || 'User')}&background=1c1528&color=fff`}
              alt={post.authorName}
              onClick={() => onOpenProfile?.(post.authorId, post.authorName)}
              className="w-10 h-10 rounded-full border-2 border-[#3d2b4f]/70 hover:border-[#ff4d4d] cursor-pointer object-cover shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  onClick={() => onOpenProfile?.(post.authorId, post.authorName)}
                  className="font-black text-white text-sm sm:text-base hover:text-[#ff4d4d] cursor-pointer truncate"
                >
                  {post.authorName}
                </span>
                <ShieldCheck size={15} className="text-[#ff4d4d] shrink-0" />
                {post.feeling && (
                  <span className="text-xs text-white/60 truncate hidden sm:inline">
                    — {post.feeling}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-white/40 mt-0.5">
                <Clock size={11} />
                <TimeAgo date={post.createdAt} lang={lang} />
                <span>•</span>
                <Globe size={11} />
                <span>{lang === 'ru' ? 'Публично' : 'Public'}</span>
                {post.category && (
                  <>
                    <span>•</span>
                    <span className="px-2 py-0.5 rounded-md bg-[#251c35] text-white/70 text-[10px] font-black uppercase tracking-wider">
                      {getLocalizedCategory(post.category, lang)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Action Tools in Header */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Share */}
            <button
              type="button"
              onClick={handleShare}
              title={lang === 'ru' ? 'Поделиться' : 'Share'}
              className="p-2 text-white/60 hover:text-white rounded-xl hover:bg-[#251c35] transition-all"
            >
              <Share2 size={17} />
            </button>

            {/* Bookmark */}
            <button
              type="button"
              onClick={handleToggleSave}
              title={isSaved ? (lang === 'ru' ? 'В закладках' : 'Saved') : (lang === 'ru' ? 'Сохранить' : 'Save')}
              className={`p-2 rounded-xl text-xs transition-all ${
                isSaved ? 'text-amber-400 bg-amber-400/10' : 'text-white/60 hover:text-white hover:bg-[#251c35]'
              }`}
            >
              <Bookmark size={17} className={isSaved ? 'fill-amber-400' : ''} />
            </button>

            {/* PDF Export */}
            <button
              type="button"
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
              }}
              title={lang === 'ru' ? 'Экспорт в PDF' : 'Export to PDF'}
              className="p-2 text-white/60 hover:text-white rounded-xl hover:bg-[#251c35] transition-all"
            >
              <FileDown size={17} />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-white/60 hover:text-white hover:bg-[#ff4d4d] hover:text-[#15101e] rounded-xl transition-all ml-1 cursor-pointer"
              title={lang === 'ru' ? 'Закрыть (ESC)' : 'Close (ESC)'}
            >
              <X size={19} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content: Title -> Text -> Full Media -> Reactions -> Comments */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-4">
          
          {/* Pinned Badge */}
          {post.pinned && (
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-400 uppercase tracking-widest bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full w-fit">
              <Pin size={12} className="rotate-45" />
              <span>{lang === 'ru' ? 'Закрепленный пост' : 'Pinned Post'}</span>
            </div>
          )}

          {/* Post Title */}
          {displayTitle && (
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug">
              {displayTitle}
            </h1>
          )}

          {/* Post Content Body */}
          {displayContent && (
            <div className="text-white/90 text-sm sm:text-base leading-relaxed break-words whitespace-pre-wrap">
              <MarkdownRenderer content={displayContent} />
            </div>
          )}

          {/* Full Media Area (Uncropped, natural aspect ratio) */}
          {post.imageUrl && (
            <div className="rounded-2xl overflow-hidden bg-[#0d0b14] border border-[#3d2b4f]/40 relative group/media select-none my-3">
              {/* Media Controls Toolbar */}
              {!isVideo && !embedVideo && (
                <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-[#15101e]/85 backdrop-blur-md border border-[#3d2b4f]/60 rounded-xl p-1 shadow-lg opacity-80 group-hover/media:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
                    title={lang === 'ru' ? 'Приблизить' : 'Zoom In'}
                    className="p-1.5 text-white/70 hover:text-white hover:bg-[#251c35] rounded-lg transition-all"
                  >
                    <ZoomIn size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                    title={lang === 'ru' ? 'Отдалить' : 'Zoom Out'}
                    className="p-1.5 text-white/70 hover:text-white hover:bg-[#251c35] rounded-lg transition-all"
                  >
                    <ZoomOut size={15} />
                  </button>

                  {zoomLevel !== 1 && (
                    <button
                      type="button"
                      onClick={() => setZoomLevel(1)}
                      title={lang === 'ru' ? 'Сбросить масштаб' : 'Reset Zoom'}
                      className="p-1.5 text-white/70 hover:text-white hover:bg-[#251c35] rounded-lg text-[11px] font-mono font-bold"
                    >
                      {Math.round(zoomLevel * 100)}%
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setPixelated(!pixelated)}
                    title={pixelated ? (lang === 'ru' ? 'Пиксельный режим' : 'Pixel Mode') : (lang === 'ru' ? 'Сглаживание' : 'Smooth Mode')}
                    className={`p-1.5 rounded-lg transition-all flex items-center gap-1 text-[11px] font-bold ${
                      pixelated ? 'bg-[#ff4d4d]/20 text-[#ff4d4d]' : 'text-white/60 hover:text-white hover:bg-[#251c35]'
                    }`}
                  >
                    <Layers size={13} />
                  </button>

                  {!protectedViewFeatureEnabled && (
                    <a
                      href={resolvedMedia}
                      download={`aha_post_${post.id}.png`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={lang === 'ru' ? 'Скачать оригинал' : 'Download Original'}
                      className="p-1.5 text-white/70 hover:text-white hover:bg-[#251c35] rounded-lg transition-all"
                    >
                      <Download size={15} />
                    </a>
                  )}
                </div>
              )}

              {/* Media Content Display */}
              <div className="w-full flex items-center justify-center p-1 bg-black/40">
                {embedVideo ? (
                  <div className="w-full aspect-video rounded-xl overflow-hidden border border-[#3d2b4f]">
                    <iframe
                      src={embedVideo.url}
                      title={post.title || 'Video'}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : isVideo ? (
                  <KuruVideoPlayer
                    src={resolvedMedia}
                    title={post.title}
                    maxHeight="max-h-[60vh]"
                  />
                ) : (
                  <div className="w-full flex items-center justify-center overflow-auto p-1">
                    <img
                      src={resolvedMedia}
                      alt={post.title || 'Attachment'}
                      style={{
                        transform: `scale(${zoomLevel})`,
                        imageRendering: pixelated ? 'pixelated' : 'auto',
                      }}
                      className="max-w-full max-h-[65vh] w-auto h-auto object-contain rounded-xl shadow-xl transition-all duration-150"
                    />
                  </div>
                )}
              </div>

              {protectedViewFeatureEnabled && post.isProtected !== false && (
                <div className="absolute bottom-3 right-3 z-20 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-[#ff4d4d]/40 text-[10px] font-black uppercase text-[#ff4d4d] flex items-center gap-1.5 select-none">
                  <ShieldAlert size={13} />
                  <span>Защищенный просмотр</span>
                </div>
              )}
            </div>
          )}

          {/* Reactions Summary */}
          <div className="flex items-center justify-between text-xs text-white/50 border-t border-b border-[#3d2b4f]/30 py-2.5">
            <div className="flex items-center gap-1.5">
              {topReactions.length > 0 ? (
                <div className="flex items-center -space-x-1">
                  {topReactions.map((r, i) => (
                    <span
                      key={r.emoji + i}
                      className="w-6 h-6 rounded-full bg-[#251c35] border border-[#3d2b4f] flex items-center justify-center text-xs shadow"
                    >
                      {r.emoji}
                    </span>
                  ))}
                </div>
              ) : (
                <ThumbsUp size={15} className="text-blue-400" />
              )}
              <span className="font-bold text-white/80 ml-1.5">
                {totalReactions > 0 ? `${totalReactions} ${lang === 'ru' ? 'реакций' : 'reactions'}` : (lang === 'ru' ? 'Будьте первым!' : 'Be the first!')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span>{relevantComments.length} {lang === 'ru' ? 'комментариев' : 'comments'}</span>
            </div>
          </div>

          {/* Action Bar (Reactions, Bot, Share) */}
          <div className="relative flex items-center justify-between gap-1.5">
            {/* Like / Reaction Button */}
            <div 
              className="relative flex-1"
              onMouseEnter={() => setShowReactionPicker(true)}
              onMouseLeave={() => setShowReactionPicker(false)}
            >
              <button
                type="button"
                onClick={() => onReact(post.id, userReaction?.emoji || '👍')}
                className={`w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all ${
                  userReaction 
                    ? `${userReaction.bg} ${userReaction.color}` 
                    : 'text-white/70 hover:text-white hover:bg-[#251c35]'
                }`}
              >
                <span className="text-base">{userReaction ? userReaction.emoji : '👍'}</span>
                <span>{userReaction ? (lang === 'ru' ? userReaction.labelRu : userReaction.labelEn) : (lang === 'ru' ? 'Нравится' : 'Like')}</span>
              </button>

              {/* Floating Reaction Picker */}
              <AnimatePresence>
                {showReactionPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: -45, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="absolute left-0 -top-2 z-40 bg-[#0d0b14]/95 backdrop-blur-md border border-[#ff4d4d]/40 rounded-full px-3 py-1.5 shadow-2xl flex items-center gap-2"
                  >
                    {REACTION_TYPES.map((r) => (
                      <motion.button
                        key={r.name}
                        type="button"
                        whileHover={{ scale: 1.35, y: -4 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onReact(post.id, r.emoji);
                          setShowReactionPicker(false);
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

            {/* Summon Aha Bot */}
            <button
              type="button"
              onClick={handleSummonBotClick}
              disabled={isSummoningBot}
              title={lang === 'ru' ? 'Позвать Аха-Бота' : 'Summon Aha Bot'}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-fuchsia-600/20 to-purple-600/20 hover:from-fuchsia-600/35 hover:to-purple-600/35 border border-fuchsia-500/30 text-fuchsia-300 hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-60"
            >
              <Bot size={16} className={`text-fuchsia-400 ${isSummoningBot ? 'animate-spin' : ''}`} />
              <span>{isSummoningBot ? (lang === 'ru' ? 'Думает...' : 'Thinking...') : (lang === 'ru' ? 'Аха-Бот' : 'Aha Bot')}</span>
            </button>

            {/* Share */}
            <button
              type="button"
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black text-white/70 hover:text-white hover:bg-[#251c35] transition-all"
            >
              <Share2 size={16} />
              <span>{lang === 'ru' ? 'Поделиться' : 'Share'}</span>
            </button>
          </div>

          {/* Comments Header */}
          <div className="pt-2">
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <MessageSquare size={16} className="text-[#ff4d4d]" />
              <span>{lang === 'ru' ? 'Обсуждение' : 'Discussion'}</span>
              <span className="text-xs text-white/40 font-normal">({relevantComments.length})</span>
            </h3>

            {/* Comment Input Box */}
            {user ? (
              <div className="flex items-start gap-3 mb-4">
                <img
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=1c1528&color=fff`}
                  alt={user.displayName || 'User'}
                  className="w-8 h-8 shrink-0 rounded-full border border-[#3d2b4f]/60 object-cover mt-1"
                />
                <div className="flex-1">
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
                      placeholder={lang === 'ru' ? 'Написать комментарий...' : 'Write a comment...'}
                      className="w-full bg-transparent text-sm text-white placeholder-white/40 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleCommentSubmit()}
                      disabled={!commentInput.trim() || isSubmittingComment}
                      className="p-1.5 bg-[#ff4d4d] text-[#15101e] rounded-xl font-bold transition-all disabled:opacity-30 hover:bg-white shrink-0"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-3 bg-[#0d0b14] rounded-2xl border border-[#3d2b4f]/30 mb-4 text-xs text-white/50">
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('openEmailLogin'))}
                  className="text-[#ff4d4d] font-bold hover:underline"
                >
                  {lang === 'ru' ? 'Войдите' : 'Sign in'}
                </button>
                {lang === 'ru' ? ', чтобы участвовать в обсуждении' : ' to join the discussion'}
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-3 pb-4">
              {relevantComments.length === 0 ? (
                <p className="text-xs text-white/40 text-center py-4 italic">
                  {lang === 'ru' ? 'Комментариев пока нет. Напишите первый отзыв!' : 'No comments yet. Write the first response!'}
                </p>
              ) : (
                relevantComments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-2.5">
                    <img
                      src={comment.authorPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.authorName)}&background=1c1528&color=fff`}
                      alt={comment.authorName}
                      onClick={() => onOpenProfile?.(comment.authorId, comment.authorName)}
                      className="w-8 h-8 shrink-0 rounded-full border border-[#3d2b4f]/60 cursor-pointer object-cover mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="bg-[#0d0b14]/90 border border-[#3d2b4f]/30 rounded-2xl px-3.5 py-2.5">
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
                          <p className="text-xs text-white/85 whitespace-pre-wrap break-words leading-relaxed">
                            {comment.content}
                          </p>
                        )}
                      </div>

                      {/* Comment Actions: Reply, Like, Delete */}
                      <div className="flex items-center gap-3 px-2 mt-1 text-[11px] text-white/40 font-semibold">
                        <button
                          onClick={() => {
                            if (user) {
                              setReplyingToId(replyingToId === comment.id ? null : comment.id);
                            } else {
                              window.dispatchEvent(new CustomEvent('openEmailLogin'));
                            }
                          }}
                          className="hover:text-white transition-colors"
                        >
                          {lang === 'ru' ? 'Ответить' : 'Reply'}
                        </button>

                        {(user?.uid === comment.authorId || canModerate) && onDeleteComment && (
                          <button
                            onClick={() => onDeleteComment(comment.id, post.id)}
                            className="hover:text-red-400 text-white/30 transition-colors"
                          >
                            {lang === 'ru' ? 'Удалить' : 'Delete'}
                          </button>
                        )}
                      </div>

                      {/* Reply Input Box */}
                      {replyingToId === comment.id && (
                        <div className="mt-2 pl-4 flex items-center gap-2">
                          <input
                            type="text"
                            value={replyInput}
                            onChange={(e) => setReplyInput(e.target.value)}
                            placeholder={`${lang === 'ru' ? 'Ответ для' : 'Reply to'} @${comment.authorName}...`}
                            className="flex-1 bg-[#0d0b14] border border-[#3d2b4f]/60 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#ff4d4d]"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleCommentSubmit(comment.id);
                              }
                            }}
                          />
                          <button
                            onClick={() => handleCommentSubmit(comment.id)}
                            disabled={!replyInput.trim() || isSubmittingComment}
                            className="p-1.5 bg-[#ff4d4d] text-[#15101e] rounded-xl font-bold disabled:opacity-30"
                          >
                            <Send size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </motion.div>
    </div>
    </ModalPortal>
  );
};
