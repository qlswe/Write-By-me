import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, X, CheckCircle2, RefreshCw } from 'lucide-react';
import { checkAdBlockerActive } from '../../utils/telemetry';

export const AntiAdblockBanner: React.FC<{ lang?: string }> = ({ lang = 'ru' }) => {
  const [adblockDetected, setAdblockDetected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('aha_adblock_banner_dismissed') === 'true';
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    if (dismissed) return;
    let isMounted = true;

    checkAdBlockerActive().then((detected) => {
      if (isMounted) {
        setAdblockDetected(detected);
      }
    });

    const interval = setInterval(() => {
      checkAdBlockerActive().then((detected) => {
        if (isMounted && !dismissed) {
          setAdblockDetected(detected);
        }
      });
    }, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
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
      }, 1500);
    } else {
      setAdblockDetected(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setAdblockDetected(false);
    try {
      sessionStorage.setItem('aha_adblock_banner_dismissed', 'true');
    } catch (e) {}
  };

  if (!adblockDetected || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[90] max-w-sm w-[92vw] ${
          successMessage
            ? 'bg-[#10281d]/95 border-emerald-500/50'
            : 'bg-[#1a1428]/95 border-amber-500/50'
        } border rounded-2xl p-4 shadow-2xl backdrop-blur-md transition-colors duration-300 pointer-events-auto`}
      >
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${successMessage ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
            {successMessage ? <CheckCircle2 size={20} /> : <ShieldAlert size={20} />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={`text-xs font-black uppercase tracking-wider mb-1 ${successMessage ? 'text-emerald-300' : 'text-amber-300'}`}>
              {successMessage
                ? (lang === 'ru' ? 'Блокировщик отключён!' : 'AdBlocker Disabled!')
                : (lang === 'ru' ? 'Обнаружен блокировщик рекламы' : 'AdBlocker Detected')}
            </h4>
            <p className="text-[11px] text-gray-300 leading-relaxed">
              {successMessage
                ? (lang === 'ru' ? 'Спасибо! Телеметрия и аналитика работают штатно.' : 'Thank you! Analytics are working properly.')
                : (lang === 'ru'
                    ? 'Ваш блокировщик может ограничивать работу онлайна и статистики. Вы можете отключить его или просто закрыть это уведомление.'
                    : 'Your blocker may intercept real-time analytics. You can disable it or close this notice.')}
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
                  <span>{isChecking ? (lang === 'ru' ? 'Проверка...' : 'Checking...') : (lang === 'ru' ? 'Проверить заново' : 'Re-check')}</span>
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
            className="text-gray-400 hover:text-white p-1 transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
