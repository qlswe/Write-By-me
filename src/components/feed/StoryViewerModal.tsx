import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Heart, Flame, Sparkles, Trash2, Eye, Share2, Smile, Clock } from 'lucide-react';
import { Language } from '../../data/translations';
import { useAuth } from '../../hooks/useAuth';
import { UserStory } from '../../hooks/useStories';

interface StoryViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  stories: UserStory[];
  initialIndex?: number;
  lang: Language;
  onLikeStory?: (storyId: string) => void;
  onDeleteStory?: (storyId: string) => void;
  onMarkViewed?: (storyId: string) => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  isOpen,
  onClose,
  stories,
  initialIndex = 0,
  lang,
  onLikeStory,
  onDeleteStory,
  onMarkViewed
}) => {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showReactionBurst, setShowReactionBurst] = useState<string | null>(null);
  const STORY_DURATION = 6000; // 6 seconds per story

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setProgress(0);
  }, [initialIndex, isOpen]);

  const currentStory = stories[currentIndex];

  useEffect(() => {
    if (!isOpen || !currentStory) return;
    if (onMarkViewed) {
      onMarkViewed(currentStory.id);
    }
  }, [currentIndex, isOpen, currentStory?.id]);

  useEffect(() => {
    if (!isOpen || isPaused || !currentStory) return;

    const interval = 50; // update progress every 50ms
    const step = (interval / STORY_DURATION) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex(c => c + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isOpen, isPaused, currentIndex, stories.length]);

  if (!isOpen || !currentStory) return null;

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex(c => c - 1);
      setProgress(0);
    }
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(c => c + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const isLiked = currentStory.likes?.includes(user?.uid || '');
  const isOwnStory = user?.uid === currentStory.authorId;

  const handleSendReaction = (emoji: string) => {
    setShowReactionBurst(emoji);
    setTimeout(() => setShowReactionBurst(null), 1200);
    if (onLikeStory) {
      onLikeStory(currentStory.id);
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-xl select-none"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Close Button Top Right */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-50 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md"
        >
          <X size={24} />
        </button>

        {/* Prev Arrow */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrev}
            className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all backdrop-blur-md hover:scale-110"
          >
            <ChevronLeft size={28} />
          </button>
        )}

        {/* Next Arrow */}
        {currentIndex < stories.length - 1 && (
          <button
            onClick={handleNext}
            className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all backdrop-blur-md hover:scale-110"
          >
            <ChevronRight size={28} />
          </button>
        )}

        {/* Story Card Container */}
        <motion.div
          key={currentStory.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`w-full max-w-[420px] h-[85vh] max-h-[780px] rounded-3xl overflow-hidden shadow-2xl relative flex flex-col justify-between p-5 border border-white/10 ${
            currentStory.gradient || 'bg-gradient-to-b from-[#ff2d55] via-[#8e24aa] to-[#240046]'
          }`}
        >
          {/* Background image if present */}
          {currentStory.mediaUrl && (
            <div className="absolute inset-0 z-0">
              <img
                src={currentStory.mediaUrl}
                alt="Story content"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/60" />
            </div>
          )}

          {/* Top Bars & Header */}
          <div className="relative z-20 space-y-3">
            {/* Story Progress Indicators */}
            <div className="flex gap-1.5 w-full">
              {stories.map((s, idx) => (
                <div
                  key={s.id}
                  className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
                >
                  <div
                    className="h-full bg-white transition-all duration-75 ease-linear rounded-full"
                    style={{
                      width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%'
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Author Info & Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-amber-400 to-[#ff4d4d]">
                  <img
                    src={currentStory.authorPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentStory.authorName)}&background=1c1528&color=fff`}
                    alt={currentStory.authorName}
                    className="w-9 h-9 rounded-full object-cover border border-black/40"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white drop-shadow-md">
                    {currentStory.authorName}
                  </h4>
                  <p className="text-[10px] text-white/70 font-bold drop-shadow">
                    Honkai Star Rail Story
                  </p>
                </div>
              </div>

              {isOwnStory && (
                <button
                  onClick={() => {
                    if (onDeleteStory) {
                      onDeleteStory(currentStory.id);
                      if (stories.length <= 1) onClose();
                      else handleNext();
                    }
                  }}
                  className="p-2 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/40 hover:text-white transition-colors"
                  title={lang === 'ru' ? 'Удалить историю' : 'Delete story'}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Left/Right Tap zones for mobile */}
          <div className="absolute inset-0 z-10 flex">
            <div className="w-1/3 h-full cursor-pointer" onClick={handlePrev} />
            <div className="w-2/3 h-full cursor-pointer" onClick={handleNext} />
          </div>

          {/* Story Text / Quote Center */}
          <div className="relative z-20 my-auto text-center px-4">
            <p className="text-xl sm:text-2xl font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] leading-relaxed break-words">
              {currentStory.text}
            </p>
          </div>

          {/* Reaction burst animation */}
          {showReactionBurst && (
            <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
              <motion.div
                initial={{ scale: 0.4, opacity: 0, y: 30 }}
                animate={{ scale: 2.2, opacity: 1, y: -40 }}
                exit={{ opacity: 0, scale: 3 }}
                transition={{ duration: 0.8 }}
                className="text-6xl drop-shadow-2xl"
              >
                {showReactionBurst}
              </motion.div>
            </div>
          )}

          {/* Footer Reaction Bar */}
          <div className="relative z-20 flex items-center justify-between gap-2 pt-3 border-t border-white/10">
            <div className="flex items-center gap-1.5 text-xs text-white/80 font-bold bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full">
              <Eye size={13} className="text-white/70" />
              <span>{currentStory.views?.length || 1}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSendReaction('❤️')}
                className={`p-2.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md transition-all active:scale-125 ${
                  isLiked ? 'text-red-400 bg-red-500/20' : 'text-white/80 hover:text-white'
                }`}
              >
                <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
              </button>

              <button
                type="button"
                onClick={() => handleSendReaction('🔥')}
                className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-amber-400 hover:text-amber-300 transition-all active:scale-125"
              >
                <Flame size={18} />
              </button>

              <button
                type="button"
                onClick={() => handleSendReaction('🎭')}
                className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-fuchsia-400 hover:text-fuchsia-300 transition-all active:scale-125"
              >
                <Sparkles size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
