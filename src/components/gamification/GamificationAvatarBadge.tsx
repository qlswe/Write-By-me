import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Gift, Star, ChevronRight, Zap } from 'lucide-react';
import { useGamification } from '../../hooks/useGamification';
import { Language } from '../../data/translations';

interface GamificationAvatarBadgeProps {
  lang?: Language;
  size?: 'sm' | 'md' | 'lg';
  position?: 'top-right' | 'bottom-right' | 'top-left';
  showFloatingNumbers?: boolean;
  onOpenChallenges?: () => void;
  className?: string;
}

export const GamificationAvatarBadge: React.FC<GamificationAvatarBadgeProps> = ({
  lang = 'ru',
  size = 'sm',
  position = 'top-right',
  showFloatingNumbers = true,
  onOpenChallenges,
  className = ''
}) => {
  const { badgeCount, unclaimedCount, newUnlockedCount, points, recentFloatingPoints, challenges, claimAll } = useGamification();
  const [showTooltip, setShowTooltip] = useState(false);

  if (badgeCount <= 0 && recentFloatingPoints.length === 0) {
    return null;
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right':
        return 'bottom-0 right-0 translate-x-1 translate-y-1';
      case 'top-left':
        return 'top-0 left-0 -translate-x-1 -translate-y-1';
      case 'top-right':
      default:
        return 'top-0 right-0 translate-x-1 -translate-y-1';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'lg':
        return 'min-w-[22px] h-[22px] text-[11px] px-1.5';
      case 'md':
        return 'min-w-[18px] h-[18px] text-[10px] px-1';
      case 'sm':
      default:
        return 'min-w-[15px] h-[15px] text-[9px] px-1';
    }
  };

  const isRewardReady = unclaimedCount > 0;

  return (
    <div 
      className={`absolute z-30 pointer-events-auto ${getPositionClasses()} ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Floating Animated Points Numbers on avatar */}
      {showFloatingNumbers && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center">
          <AnimatePresence>
            {recentFloatingPoints.slice(-2).map((fp) => (
              <motion.div
                key={fp.id}
                initial={{ opacity: 0, y: 8, scale: 0.6 }}
                animate={{ opacity: 1, y: -16, scale: 1.1 }}
                exit={{ opacity: 0, y: -30, scale: 0.8 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="whitespace-nowrap flex items-center gap-0.5 px-2 py-0.5 rounded-full font-black text-[10px] bg-gradient-to-r from-[#ff4d4d] to-[#ff758c] text-white shadow-[0_0_12px_rgba(255,77,77,0.8)] border border-white/40 mb-1"
              >
                <Sparkles size={9} className="text-yellow-200 animate-spin" />
                <span>+{fp.amount}</span>
                <span className="text-[8px] opacity-90">✦</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Main Avatar Notification Badge */}
      {badgeCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenChallenges) {
              onOpenChallenges();
            }
          }}
          className={`relative flex items-center justify-center font-black rounded-full shadow-lg cursor-pointer border border-white/60 ${getSizeClasses()} ${
            isRewardReady
              ? 'bg-gradient-to-tr from-[#ff4d4d] via-[#f43f5e] to-[#fbbf24] text-white shadow-[0_0_12px_rgba(255,77,77,0.9)] animate-pulse'
              : 'bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-[0_0_8px_rgba(6,182,212,0.7)]'
          }`}
          title={isRewardReady ? `${unclaimedCount} наград готово!` : 'Новое задание!'}
        >
          {/* Animated glow aura ring */}
          <span className="absolute inset-0 rounded-full animate-ping opacity-60 bg-inherit" />

          <div className="relative z-10 flex items-center gap-0.5">
            {isRewardReady ? (
              <Gift size={size === 'sm' ? 8 : 10} className="text-yellow-200 shrink-0" />
            ) : (
              <Sparkles size={size === 'sm' ? 8 : 10} className="text-cyan-200 shrink-0" />
            )}
            <span className="leading-none">{unclaimedCount > 0 ? unclaimedCount : '!'}</span>
          </div>
        </motion.div>
      )}

      {/* Hover preview popover for desktop */}
      <AnimatePresence>
        {showTooltip && badgeCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-64 bg-[#1a1228] border border-[#ff4d4d]/40 rounded-2xl p-3 shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-[100] pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/10">
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded-lg bg-[#ff4d4d]/20 text-[#ff4d4d]">
                  <Gift size={13} />
                </div>
                <span className="text-xs font-bold text-white">
                  {lang === 'ru' ? 'Награды и Задания' : 'Rewards & Quests'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-black text-cyan-400">
                <span>{points}</span>
                <span className="text-[10px]">✦</span>
              </div>
            </div>

            <p className="text-[11px] text-gray-300 mb-2 leading-tight">
              {isRewardReady
                ? (lang === 'ru' ? `Доступно ${unclaimedCount} готовых наград!` : `${unclaimedCount} rewards ready to collect!`)
                : (lang === 'ru' ? 'Новое космическое испытание доступно!' : 'New cosmic challenge unlocked!')}
            </p>

            <div className="flex items-center gap-2">
              {unclaimedCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    claimAll();
                    setShowTooltip(false);
                  }}
                  className="flex-1 py-1.5 px-2 bg-gradient-to-r from-[#ff4d4d] to-[#ff2a5f] text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Sparkles size={11} />
                  <span>{lang === 'ru' ? 'Забрать всё' : 'Claim All'}</span>
                </button>
              )}

              {onOpenChallenges && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenChallenges();
                    setShowTooltip(false);
                  }}
                  className="py-1.5 px-2 bg-[#2a1b3d] text-gray-200 hover:text-white rounded-xl text-[10px] font-bold border border-white/10 hover:border-[#ff4d4d]/40 transition-all flex items-center gap-0.5 cursor-pointer"
                >
                  <span>{lang === 'ru' ? 'К заданиям' : 'Quests'}</span>
                  <ChevronRight size={12} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
