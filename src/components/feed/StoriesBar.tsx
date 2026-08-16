import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Sparkles, Calendar, Ticket, Palette, Clock, Copy, Check, Smile, Flame, Shield, ArrowRight, Eye } from 'lucide-react';
import { Language, translations } from '../../data/translations';
import { useAuth } from '../../hooks/useAuth';
import { getEventProgress, formatCountdown } from '../../utils/time';
import { safeStorage } from '../../utils/securityStorage';
import { useStories, UserStory } from '../../hooks/useStories';
import { CreateStoryModal } from './CreateStoryModal';
import { StoryViewerModal } from './StoryViewerModal';

interface StoriesBarProps {
  lang: Language;
  events?: any[];
  promoCodes?: any[];
  handleCopy?: (text: string) => void;
  onOpenCanvas?: () => void;
  onOpenAi?: () => void;
  onSelectEvent?: (event: any) => void;
}

export const StoriesBar: React.FC<StoriesBarProps> = ({
  lang,
  events = [],
  promoCodes = [],
  handleCopy,
  onOpenCanvas,
  onOpenAi,
  onSelectEvent
}) => {
  const { user } = useAuth();
  const t = translations[lang];
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Real stories hook
  const { 
    stories, 
    loading: storiesLoading, 
    createStory, 
    markStoryViewed, 
    toggleLikeStory, 
    deleteStory 
  } = useStories();

  const [createStoryModalOpen, setCreateStoryModalOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerStartIndex, setViewerStartIndex] = useState(0);

  // Custom user status vibe
  const [myVibe, setMyVibe] = useState(() => {
    return safeStorage.getItem(`user_vibe_${user?.uid || 'guest'}`) || '🎭 На волне Радости';
  });
  const [isSettingVibe, setIsSettingVibe] = useState(false);
  const [newVibeText, setNewVibeText] = useState('');

  const now = new Date();
  const nextEvent = events.length > 0 ? events[0] : null;
  const nextPromo = promoCodes.length > 0 ? promoCodes[0] : null;

  const eventProgress = nextEvent ? getEventProgress(nextEvent, now) : null;
  const eventCountdown = eventProgress && nextEvent ? formatCountdown(eventProgress.nextDate, t, lang, now) : null;

  const handleSaveVibe = (vibe: string) => {
    setMyVibe(vibe);
    safeStorage.setItem(`user_vibe_${user?.uid || 'guest'}`, vibe);
    setIsSettingVibe(false);
    setNewVibeText('');
  };

  const quickVibes = [
    '🎭 На волне Радости',
    '🔥 Жду патч и крутки',
    '💡 Строю безумные теории',
    '☕ Отдыхаю на Экспрессе',
    '🎮 Фармлю реликвии',
    '🤡 Троллю КММ'
  ];

  // Check if current user has active stories
  const myStories = stories.filter(s => s.authorId === user?.uid);
  const otherStories = stories.filter(s => s.authorId !== user?.uid);
  const userActiveStory = myStories[0];

  const handleOpenMyStory = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (myStories.length > 0) {
      const idx = stories.findIndex(s => s.id === myStories[0].id);
      setViewerStartIndex(idx >= 0 ? idx : 0);
      setViewerOpen(true);
    } else {
      setCreateStoryModalOpen(true);
    }
  };

  const handleOpenOtherStory = (storyId: string) => {
    const idx = stories.findIndex(s => s.id === storyId);
    setViewerStartIndex(idx >= 0 ? idx : 0);
    setViewerOpen(true);
  };

  return (
    <div className="w-full relative mb-6">
      {/* Horizontal Stories Track with ample padding to avoid clipping */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-1 scrollbar-thin scrollbar-thumb-[#3d2b4f] scrollbar-track-transparent">
        
        {/* Story 1: My Profile & Story Creator */}
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={myStories.length > 0 ? () => handleOpenMyStory() : () => setCreateStoryModalOpen(true)}
          className="min-w-[155px] sm:min-w-[170px] w-40 sm:w-44 h-52 sm:h-56 rounded-2xl bg-gradient-to-b from-[#281c3b] via-[#1d142b] to-[#120c1c] border border-[#ff4d4d]/40 p-3.5 flex flex-col justify-between shrink-0 cursor-pointer shadow-xl relative overflow-hidden group select-none transition-all hover:border-[#ff4d4d] hover:shadow-[0_0_22px_rgba(255,77,77,0.25)]"
        >
          {/* Active story photo background on card 1 if user uploaded photo */}
          {userActiveStory?.mediaUrl ? (
            <div className="absolute inset-0 z-0">
              <img src={userActiveStory.mediaUrl} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/50" />
            </div>
          ) : (
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#ff4d4d]/15 rounded-full blur-xl group-hover:bg-[#ff4d4d]/30 transition-all pointer-events-none" />
          )}
          
          {/* Top Row: Avatar with Plus / Story Indicator */}
          <div className="relative z-10 flex items-center justify-between">
            <div 
              onClick={handleOpenMyStory}
              className="relative p-1 inline-flex items-center justify-center cursor-pointer group/avatar"
              title={myStories.length > 0 ? (lang === 'ru' ? 'Смотреть мою историю' : 'View my story') : (lang === 'ru' ? 'Создать историю' : 'Create story')}
            >
              {/* Glowing Story Ring if user has active stories */}
              {myStories.length > 0 && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-400 via-[#ff4d4d] to-fuchsia-500 animate-spin-slow p-0.5 shadow-md" />
              )}

              <img
                src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'User')}&background=1c1528&color=fff`}
                alt="My Avatar"
                className={`w-10 h-10 shrink-0 aspect-square rounded-full object-cover relative z-10 ${myStories.length > 0 ? 'border border-black' : 'border-2 border-[#ff4d4d]'}`}
              />

              {/* Plus Badge positioned with safe margins */}
              <div 
                onClick={(e) => { e.stopPropagation(); setCreateStoryModalOpen(true); }}
                className="absolute bottom-0 right-0 z-20 w-4 h-4 bg-[#ff4d4d] hover:bg-white text-[#15101e] rounded-full flex items-center justify-center shadow-lg border border-[#15101e] transition-transform group-hover/avatar:scale-110"
                title={lang === 'ru' ? 'Создать историю' : 'Add story'}
              >
                <Plus size={11} className="stroke-[3.5]" />
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsSettingVibe(true); }}
              className="text-[10px] font-black uppercase tracking-wider text-[#ff4d4d] bg-[#ff4d4d]/15 hover:bg-[#ff4d4d]/25 border border-[#ff4d4d]/30 px-2 py-0.5 rounded-full shadow-sm transition-colors"
            >
              {lang === 'ru' ? 'Статус' : 'Status'}
            </button>
          </div>

          {/* Bottom Card Area */}
          <div className="relative z-10 space-y-1.5 bg-[#0e0917]/85 border border-[#3d2b4f]/60 group-hover:border-[#ff4d4d]/50 rounded-xl p-2.5 backdrop-blur-sm transition-colors">
            <div className="text-xs font-black text-white leading-snug line-clamp-2">
              {myStories.length > 0 ? (userActiveStory?.text || (lang === 'ru' ? '🔥 Ваша история активна' : '🔥 Story is active')) : myVibe}
            </div>
            <div className="text-[10px] text-white/50 font-bold flex items-center justify-between">
              <span 
                onClick={(e) => { e.stopPropagation(); setCreateStoryModalOpen(true); }}
                className="flex items-center gap-1 text-[#ff4d4d] hover:underline cursor-pointer"
              >
                <Plus size={11} className="stroke-[3]" />
                {lang === 'ru' ? 'Создать историю' : 'Create story'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Stories from other Community Members (deduplicated without user story) */}
        {otherStories.map((story) => {
          return (
            <motion.div
              key={story.id}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleOpenOtherStory(story.id)}
              className={`min-w-[155px] sm:min-w-[170px] w-40 sm:w-44 h-52 sm:h-56 rounded-2xl p-3.5 flex flex-col justify-between shrink-0 cursor-pointer shadow-xl relative overflow-hidden group select-none transition-all border border-white/20 hover:border-white/50 ${
                story.gradient || 'bg-gradient-to-b from-[#ff2d55] via-[#8e24aa] to-[#240046]'
              }`}
            >
              {/* Media image background if present */}
              {story.mediaUrl && (
                <div className="absolute inset-0 z-0">
                  <img src={story.mediaUrl} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/50" />
                </div>
              )}

              {/* Author & Active Ring */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="relative shrink-0 p-0.5 rounded-full bg-gradient-to-tr from-amber-400 via-[#ff4d4d] to-fuchsia-500 shadow-md">
                  <img
                    src={story.authorPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(story.authorName)}&background=1c1528&color=fff`}
                    alt={story.authorName}
                    className="w-9 h-9 shrink-0 aspect-square rounded-full object-cover border border-black/40"
                  />
                </div>

                <span className="text-[9px] font-black uppercase tracking-wider text-white/90 bg-black/40 border border-white/20 px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-md">
                  <Eye size={10} />
                  <span>{story.views?.length || 1}</span>
                </span>
              </div>

              {/* Story Content Snippet */}
              <div className="relative z-10 space-y-1 bg-black/60 border border-white/15 rounded-xl p-2.5 backdrop-blur-md">
                <h4 className="text-[11px] font-black text-white truncate">
                  {story.authorName}
                </h4>
                <p className="text-[10px] text-white/85 font-medium line-clamp-2 leading-tight">
                  {story.text || (lang === 'ru' ? '📷 Фото-история' : '📷 Photo story')}
                </p>
              </div>
            </motion.div>
          );
        })}

        {/* Story: Next Event Live Countdown */}
        {nextEvent && (
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectEvent?.(nextEvent)}
            className="min-w-[155px] sm:min-w-[170px] w-40 sm:w-44 h-52 sm:h-56 rounded-2xl bg-gradient-to-b from-[#1c1830] via-[#141026] to-[#0a0714] border border-indigo-500/35 p-3.5 flex flex-col justify-between shrink-0 cursor-pointer shadow-xl relative overflow-hidden group select-none transition-all hover:border-indigo-400 hover:shadow-[0_0_20px_rgba(99,102,241,0.25)]"
          >
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-indigo-600/15 rounded-full blur-xl group-hover:bg-indigo-600/25 transition-all pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400 shadow-md">
                <Calendar size={18} />
              </div>
              <span className="text-[9px] font-black uppercase text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Clock size={10} /> {lang === 'ru' ? 'Ивент' : 'Event'}
              </span>
            </div>

            <div className="relative z-10 space-y-1 bg-[#090610]/90 border border-indigo-500/30 rounded-xl p-2.5 backdrop-blur-sm">
              <h4 className="text-xs font-black text-white line-clamp-1 leading-tight">
                {nextEvent.title?.[lang] || nextEvent.title?.['en'] || 'Хроника событий'}
              </h4>
              <div className="text-[9px] font-bold text-indigo-300/80 uppercase">
                {lang === 'ru' ? 'До сброса:' : 'Resets in:'}
              </div>
              <div className="text-xs font-black text-indigo-300 truncate font-mono">
                {eventCountdown || 'Active'}
              </div>
            </div>
          </motion.div>
        )}

        {/* Story: Active Promo Code */}
        {nextPromo && (
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (handleCopy) handleCopy(nextPromo.code);
              setCopiedCode(nextPromo.code);
              setTimeout(() => setCopiedCode(null), 2000);
            }}
            className="min-w-[155px] sm:min-w-[170px] w-40 sm:w-44 h-52 sm:h-56 rounded-2xl bg-gradient-to-b from-[#2b1f1a] via-[#1a120e] to-[#0e0806] border border-amber-500/35 p-3.5 flex flex-col justify-between shrink-0 cursor-pointer shadow-xl relative overflow-hidden group select-none transition-all hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.25)]"
          >
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-amber-500/15 rounded-full blur-xl group-hover:bg-amber-500/25 transition-all pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-md">
                <Ticket size={18} />
              </div>
              <span className="text-[9px] font-black uppercase text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles size={10} /> {lang === 'ru' ? 'Промо' : 'Promo'}
              </span>
            </div>

            <div className="relative z-10 space-y-1 bg-[#0a0503]/90 border border-amber-500/30 rounded-xl p-2.5 backdrop-blur-sm">
              <div className="text-[10px] text-amber-300/80 font-bold uppercase truncate">
                {nextPromo.description?.[lang] || nextPromo.description?.['en'] || 'Stellar Jade'}
              </div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-black text-amber-300 font-mono tracking-wider truncate">
                  {nextPromo.code}
                </span>
                {copiedCode === nextPromo.code ? (
                  <Check size={14} className="text-emerald-400 shrink-0" />
                ) : (
                  <Copy size={13} className="text-amber-400/70 group-hover:text-amber-300 shrink-0" />
                )}
              </div>
              <div className="text-[9px] text-white/40 font-medium truncate">
                {copiedCode === nextPromo.code ? (lang === 'ru' ? 'Скопировано!' : 'Copied!') : (lang === 'ru' ? 'Клик для копирования' : 'Click to copy')}
              </div>
            </div>
          </motion.div>
        )}

      </div>

      {/* Story Creator Modal */}
      <CreateStoryModal
        isOpen={createStoryModalOpen}
        onClose={() => setCreateStoryModalOpen(false)}
        lang={lang}
        onPublishStory={async (params) => {
          await createStory(params);
        }}
      />

      {/* Full-screen Story Viewer Modal */}
      <StoryViewerModal
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        stories={stories}
        initialIndex={viewerStartIndex}
        lang={lang}
        onLikeStory={toggleLikeStory}
        onDeleteStory={deleteStory}
        onMarkViewed={markStoryViewed}
      />

      {/* Vibe / Status Selection Modal */}
      {isSettingVibe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-[#15101e] border border-[#ff4d4d]/40 rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Smile className="text-[#ff4d4d]" size={20} />
                {lang === 'ru' ? 'Ваш статус и настроение' : 'Set Your Status / Vibe'}
              </h3>
              <button
                onClick={() => setIsSettingVibe(false)}
                className="text-white/40 hover:text-white text-sm font-bold p-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-white/60">
              {lang === 'ru' ? 'Выберите готовый статус или напишите свой для ленты:' : 'Choose a quick vibe or type your own for the community feed:'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickVibes.map((v) => (
                <button
                  key={v}
                  onClick={() => handleSaveVibe(v)}
                  className="p-3 bg-[#0d0b14] hover:bg-[#ff4d4d]/10 border border-[#3d2b4f]/40 hover:border-[#ff4d4d]/40 rounded-xl text-left text-xs font-bold text-white/90 transition-all"
                >
                  {v}
                </button>
              ))}
            </div>

            <div className="pt-2 space-y-2">
              <input
                type="text"
                value={newVibeText}
                onChange={(e) => setNewVibeText(e.target.value)}
                placeholder={lang === 'ru' ? 'Или свой статус...' : 'Or enter custom status...'}
                maxLength={60}
                className="w-full bg-[#0d0b14] border border-[#3d2b4f]/60 rounded-xl p-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#ff4d4d]"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsSettingVibe(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white/40 hover:text-white"
                >
                  {lang === 'ru' ? 'Отмена' : 'Cancel'}
                </button>
                <button
                  onClick={() => {
                    if (newVibeText.trim()) handleSaveVibe(newVibeText.trim());
                  }}
                  disabled={!newVibeText.trim()}
                  className="px-5 py-2 bg-[#ff4d4d] text-[#15101e] font-black text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 hover:bg-white"
                >
                  {lang === 'ru' ? 'Сохранить' : 'Save'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
