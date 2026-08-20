import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Gift, Trophy, Zap, CheckCircle2 } from 'lucide-react';
import { useGamification } from '../../hooks/useGamification';
import { Language } from '../../data/translations';

interface FloatingPointsOverlayProps {
  lang?: Language;
  onNavigateToWarp?: () => void;
}

export const FloatingPointsOverlay: React.FC<FloatingPointsOverlayProps> = ({
  lang = 'ru',
  onNavigateToWarp
}) => {
  const { activeAlert, clearNewUnlockBadges } = useGamification();

  if (!activeAlert) return null;

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-[999] pointer-events-none flex flex-col gap-2 max-w-sm w-full">
      <AnimatePresence>
        <motion.div
          key={activeAlert.id}
          initial={{ opacity: 0, x: 50, scale: 0.85 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 30, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="pointer-events-auto bg-[#170e24]/95 border border-[#ff4d4d]/50 p-3.5 rounded-2xl shadow-[0_10px_35px_rgba(255,77,77,0.3)] backdrop-blur-xl flex items-center justify-between gap-3 text-white overflow-hidden relative group cursor-pointer"
          onClick={() => {
            if (onNavigateToWarp) {
              onNavigateToWarp();
            }
          }}
        >
          {/* Neon light stripe */}
          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-[#ff4d4d] via-yellow-400 to-[#9333ea]" />

          <div className="flex items-center gap-3 pl-1">
            <div className={`p-2.5 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
              activeAlert.type === 'challenge_unlocked'
                ? 'bg-gradient-to-tr from-[#ff4d4d] to-[#ec4899] text-white shadow-[0_0_15px_rgba(255,77,77,0.6)]'
                : 'bg-gradient-to-tr from-yellow-500 to-amber-600 text-white shadow-[0_0_15px_rgba(245,158,11,0.6)]'
            }`}>
              {activeAlert.type === 'challenge_unlocked' ? (
                <Trophy size={18} className="animate-bounce" />
              ) : (
                <Sparkles size={18} className="animate-spin" />
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <div className="text-xs font-black tracking-tight text-white flex items-center gap-1.5 truncate">
                <span>{activeAlert.title}</span>
                {activeAlert.reward && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-[#ff4d4d]/30 text-yellow-300 font-extrabold rounded-md border border-[#ff4d4d]/40">
                    +{activeAlert.reward} ✦
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-300 truncate font-medium mt-0.5">
                {activeAlert.subtitle}
              </p>
            </div>
          </div>

          <div className="text-[10px] text-[#ff4d4d] font-black uppercase tracking-wider shrink-0 opacity-80 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
            <span>{lang === 'ru' ? 'Открыть' : 'View'}</span>
            <span>→</span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
