import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, X, CheckCircle2, RefreshCw } from 'lucide-react';
import { checkAdBlockerActive } from '../../utils/telemetry';

export const AntiAdblockBanner: React.FC<{ lang?: string }> = ({ lang = 'ru' }) => {
  const [adblockDetected, setAdblockDetected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem('aha_adblock_banner_dismissed') === 'true';
  });

  useEffect(() => {
    if (dismissed) return;
    let isMounted = true;
    checkAdBlockerActive().then((detected) => {
      if (isMounted) {
        setAdblockDetected(detected);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [dismissed]);

  const handleRecheck = async () => {
    setIsChecking(true);
    const isStillActive = await checkAdBlockerActive(true);
    setIsChecking(false);

    if (!isStillActive) {
      setSuccessMessage(true);
      setTimeout(() => {
        setAdblockDetected(false);
        setSuccessMessage(false);
      }, 2000);
    } else {
      setAdblockDetected(true);
    }
  };

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
        className={`fixed bottom-6 right-6 z-50 max-w-sm w-[90vw] ${
          successMessage
            ? 'bg-[#10281d]/95 border-emerald-500/50'
            : 'bg-[#1a1428]/95 border-amber-500/40'
        } border rounded-2xl p-4 shadow-2xl backdrop-blur-md transition-colors duration-300`}
      >
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${successMessage ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
            {successMessage ? <CheckCircle2 size={20} /> : <ShieldAlert size={20} />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={`text-xs font-black uppercase tracking-wider mb-1 ${successMessage ? 'text-emerald-300' : 'text-amber-300'}`}>
              {successMessage
                ? (lang === 'ru' ? 'Блокировщик отключён!' : 'AdBlocker Disabled!')
                : (lang === 'ru' ? 'Обнаружен блокировщик рекламы' : 'AdBlocker / Shield Detected')}
            </h4>
            <p className="text-[11px] text-gray-300 leading-relaxed">
              {successMessage
                ? (lang === 'ru' ? 'Спасибо! Теперь телеметрия и обновления работы сервиса функционируют штатно.' : 'Thank you! Telemetry and real-time updates are running normally.')
                : (lang === 'ru'
                    ? 'Блокировщик может блокировать запросы к телеметрии и веб-сокетам. Если вы его отключили, нажмите «Проверить заново».'
                    : 'An ad blocker may intercept real-time analytics. If you disabled it, click "Re-check".')}
            </p>
            {!successMessage && (
              <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleRecheck}
                  disabled={isChecking}
                  className="px-2.5 py-1 bg-[#281e3d] hover:bg-[#382b54] text-gray-200 hover:text-white text-[10px] font-bold rounded-lg border border-[#3d2b4f] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={11} className={isChecking ? 'animate-spin text-amber-400' : 'text-amber-400'} />
                  <span>{isChecking ? (lang === 'ru' ? 'Проверка...' : 'Checking...') : (lang === 'ru' ? 'Проверить снова' : 'Re-check')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                >
                  {lang === 'ru' ? 'Понятно' : 'Got it'}
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
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
