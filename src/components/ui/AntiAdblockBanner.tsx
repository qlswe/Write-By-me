import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, X, CheckCircle2 } from 'lucide-react';
import { checkAdBlockerActive } from '../../utils/telemetry';

export const AntiAdblockBanner: React.FC<{ lang?: string }> = ({ lang = 'ru' }) => {
  const [adblockDetected, setAdblockDetected] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem('aha_adblock_banner_dismissed') === 'true';
  });

  useEffect(() => {
    if (dismissed) return;
    let isMounted = true;
    checkAdBlockerActive().then((detected) => {
      if (isMounted && detected) {
        setAdblockDetected(true);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('aha_adblock_banner_dismissed', 'true');
    } catch (e) {}
  };

  if (!adblockDetected || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-6 right-6 z-50 max-w-sm w-[90vw] bg-[#1a1428]/95 border border-amber-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl shrink-0 mt-0.5">
            <ShieldAlert size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider mb-1">
              {lang === 'ru' ? 'Обнаружен блокировщик рекламы' : 'AdBlocker / Shield Detected'}
            </h4>
            <p className="text-[11px] text-gray-300 leading-relaxed">
              {lang === 'ru'
                ? 'Блокировщик рекламы может препятствовать корректному сбору статистики Ahi. Система активировала обход блокировки по защищённому протоколу WebSocket.'
                : 'An ad blocker was detected. Ahi telemetry bypass over protected WebSocket has been activated for reliable analytics gathering.'}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 size={12} /> {lang === 'ru' ? 'Обход блокировок активен' : 'Bypass Shield Active'}
              </span>
              <button
                onClick={handleDismiss}
                className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
              >
                {lang === 'ru' ? 'Понятно' : 'Got it'}
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-white p-1 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
