import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  X, 
  MessageSquare, 
  CornerDownRight, 
  Share2, 
  Sparkles, 
  Heart, 
  Flame, 
  Smile, 
  ExternalLink,
  ShieldCheck,
  Check
} from 'lucide-react';
import { NotificationItem } from '../../utils/notificationService';
import { TimeAgo } from '../ui/TimeAgo';
import { Language } from '../../data/translations';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  onMarkAsRead: (id: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  onDeleteNotification: (id: string) => Promise<void>;
  onClearAll: () => Promise<void>;
  lang: Language;
  onNavigateToPost?: (postId: string, section?: string) => void;
}

type FilterTab = 'all' | 'posts' | 'comments' | 'reactions' | 'system';

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  loading,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAll,
  lang,
  onNavigateToPost,
}) => {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Filter items according to tab
  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'posts') return item.type === 'post_comment' || item.type === 'post_reaction' || item.type === 'post_share';
    if (activeTab === 'comments') return item.type === 'post_comment' || item.type === 'comment_reply';
    if (activeTab === 'reactions') return item.type === 'post_reaction';
    if (activeTab === 'system') return item.type === 'system' || item.type === 'mention';
    return true;
  });

  const getActionIcon = (type: NotificationItem['type'], emoji?: string) => {
    switch (type) {
      case 'post_comment':
        return <MessageSquare size={14} className="text-blue-400" />;
      case 'comment_reply':
        return <CornerDownRight size={14} className="text-emerald-400" />;
      case 'post_reaction':
        return <span className="text-xs">{emoji || '❤️'}</span>;
      case 'post_share':
        return <Share2 size={14} className="text-amber-400" />;
      case 'system':
      default:
        return <Sparkles size={14} className="text-[#ff4d4d]" />;
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      await onMarkAsRead(item.id);
    }
    if (item.postId) {
      onNavigateToPost?.(item.postId, item.targetSection || 'forum');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[990] transition-opacity"
          />

          {/* Curtain / Drawer container */}
          <motion.div
            ref={drawerRef}
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="fixed top-16 right-2 sm:right-6 md:right-8 w-[calc(100vw-1rem)] sm:w-[460px] max-h-[85vh] bg-[#15101e] border border-[#3d2b4f] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.95)] z-[999] flex flex-col overflow-hidden box-border overscroll-contain touch-pan-y"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#251c35] flex items-center justify-between gap-3 bg-[#1c1528]/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 flex items-center justify-center text-[#ff4d4d]">
                  <Bell size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-white tracking-tight">
                      {lang === 'ru' ? 'Шторка уведомлений' : 'Notifications'}
                    </h2>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#ff4d4d] text-white shadow-md shadow-[#ff4d4d]/30 animate-pulse">
                        {unreadCount} {lang === 'ru' ? 'новых' : 'new'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/40 font-medium">
                    {lang === 'ru' ? 'Активность под вашими постами и аккаунтом' : 'Activity on your posts & account'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    onClick={() => onMarkAllAsRead()}
                    title={lang === 'ru' ? 'Отметить все как прочитанные' : 'Mark all as read'}
                    className="p-2 rounded-xl bg-[#251c35] hover:bg-[#ff4d4d]/20 text-white/70 hover:text-[#ff4d4d] border border-[#3d2b4f]/60 transition-all cursor-pointer"
                  >
                    <CheckCheck size={16} />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={() => onClearAll()}
                    title={lang === 'ru' ? 'Очистить все уведомления' : 'Clear all'}
                    className="p-2 rounded-xl bg-[#251c35] hover:bg-rose-500/20 text-white/70 hover:text-rose-400 border border-[#3d2b4f]/60 transition-all cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-[#251c35] hover:bg-white/10 text-white/60 hover:text-white border border-[#3d2b4f]/60 transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="px-4 pt-3 pb-2 border-b border-[#251c35] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { id: 'all', labelRu: 'Все', labelEn: 'All' },
                { id: 'posts', labelRu: 'Посты', labelEn: 'Posts' },
                { id: 'comments', labelRu: 'Комменты', labelEn: 'Comments' },
                { id: 'reactions', labelRu: 'Реакции', labelEn: 'Reactions' },
                { id: 'system', labelRu: 'Система', labelEn: 'System' },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as FilterTab)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#ff4d4d] text-[#15101e] shadow-md shadow-[#ff4d4d]/20'
                        : 'bg-[#251c35]/60 hover:bg-[#251c35] text-white/70 hover:text-white border border-[#3d2b4f]/40'
                    }`}
                  >
                    {lang === 'ru' ? tab.labelRu : tab.labelEn}
                  </button>
                );
              })}
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[58vh] no-scrollbar">
              {loading ? (
                <div className="p-8 text-center text-white/40 text-sm flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-[#ff4d4d] border-t-transparent rounded-full animate-spin" />
                  <span>{lang === 'ru' ? 'Загрузка уведомлений...' : 'Loading notifications...'}</span>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="p-10 text-center flex flex-col items-center justify-center gap-3 text-white/40">
                  <div className="w-14 h-14 rounded-3xl bg-[#251c35]/80 border border-[#3d2b4f]/40 flex items-center justify-center text-white/30">
                    <Bell size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white/80 text-sm">
                      {lang === 'ru' ? 'Нет уведомлений' : 'No notifications'}
                    </h3>
                    <p className="text-xs text-white/40 mt-1 max-w-[240px]">
                      {lang === 'ru'
                        ? 'Когда кто-то оставит комментарий или реакцию на ваш пост, вы увидите это здесь!'
                        : 'When someone comments or reacts to your posts, you will see it right here!'}
                    </p>
                  </div>
                </div>
              ) : (
                filteredNotifications.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative group flex items-start gap-3 ${
                      !item.isRead
                        ? 'bg-[#251c35]/90 border-[#ff4d4d]/40 shadow-lg shadow-[#ff4d4d]/5 hover:border-[#ff4d4d]'
                        : 'bg-[#1a1424]/60 border-[#3d2b4f]/30 hover:bg-[#251c35]/50 hover:border-[#3d2b4f]'
                    }`}
                  >
                    {/* Actor Avatar with Action Badge */}
                    <div className="relative shrink-0 mt-0.5">
                      <img
                        src={
                          item.actorPhoto ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            item.actorName || 'User'
                          )}&background=1c1528&color=fff`
                        }
                        alt={item.actorName}
                        className="w-10 h-10 shrink-0 aspect-square rounded-full border border-[#3d2b4f]/80 object-cover"
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#15101e] border border-[#3d2b4f] flex items-center justify-center shadow">
                        {getActionIcon(item.type, item.reactionEmoji)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-black text-xs text-white truncate max-w-[160px]">
                          {item.actorName}
                        </span>
                        <span className="text-[10px] text-white/40">•</span>
                        <span className="text-[10px] text-white/40 shrink-0">
                          <TimeAgo date={item.createdAt} lang={lang} />
                        </span>
                      </div>

                      <p className="text-xs text-white/80 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>

                      {item.postTitle && (
                        <div className="mt-2 text-[11px] font-bold text-[#ff4d4d] flex items-center gap-1 bg-[#ff4d4d]/10 border border-[#ff4d4d]/20 px-2 py-0.5 rounded-lg w-fit truncate max-w-full">
                          <span>{item.postTitle}</span>
                          <ExternalLink size={10} className="shrink-0" />
                        </div>
                      )}
                    </div>

                    {/* Unread indicator & Quick Delete */}
                    <div className="absolute right-3 top-3.5 flex flex-col items-end gap-2">
                      {!item.isRead && (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ff4d4d] shadow-[0_0_8px_rgba(255,77,77,0.8)]" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteNotification(item.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-white/40 hover:text-rose-400 transition-opacity rounded"
                        title={lang === 'ru' ? 'Удалить' : 'Delete'}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-[#251c35] bg-[#1c1528]/60 flex items-center justify-between text-xs text-white/50 px-4">
                <span>
                  {notifications.length} {lang === 'ru' ? 'уведомлений всего' : 'total'}
                </span>
                <button
                  onClick={() => onMarkAllAsRead()}
                  className="text-[#ff4d4d] hover:underline font-bold cursor-pointer"
                >
                  {lang === 'ru' ? 'Отметить все прочитанными' : 'Mark all as read'}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
