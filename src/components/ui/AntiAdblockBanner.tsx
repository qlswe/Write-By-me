import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, CheckCircle2, RefreshCw, Lock, AlertTriangle, ShieldX } from 'lucide-react';
import { checkAdBlockerActive } from '../../utils/telemetry';

export const AntiAdblockBanner: React.FC<{ lang?: string }> = ({ lang = 'ru' }) => {
  const [adblockDetected, setAdblockDetected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  useEffect(() => {
    let isMounted = true;
    checkAdBlockerActive().then((detected) => {
      if (isMounted) {
        setAdblockDetected(detected);
      }
    });

    // Periodically re-verify every 10 seconds in background
    const interval = setInterval(() => {
      checkAdBlockerActive().then((detected) => {
        if (isMounted) {
          setAdblockDetected(detected);
        }
      });
    }, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

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

  if (!adblockDetected) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="fixed inset-0 z-[99999] bg-[#090510]/98 backdrop-blur-2xl flex items-center justify-center p-4 overflow-y-auto select-none"
      >
        <div className="max-w-md w-full bg-[#150f22] border-2 border-[#ff4d4d]/60 rounded-3xl p-6 sm:p-8 shadow-[0_0_80px_rgba(255,77,77,0.3)] text-center relative overflow-hidden">
          {/* Ambient Glow Effects */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#ff4d4d]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Icon Header */}
          <div className="relative z-10 flex justify-center mb-5">
            <div className={`p-4 rounded-2xl border-2 ${
              successMessage 
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' 
                : 'bg-[#ff4d4d]/10 border-[#ff4d4d] text-[#ff4d4d] shadow-[0_0_30px_rgba(255,77,77,0.4)] animate-pulse'
            }`}>
              {successMessage ? <CheckCircle2 size={48} /> : <ShieldX size={48} />}
            </div>
          </div>

          {/* Title */}
          <h2 className="relative z-10 text-xl sm:text-2xl font-black text-white uppercase tracking-tight mb-2">
            {successMessage ? (
              <span className="text-emerald-400">
                {lang === 'ru' ? 'Доступ Разблокирован!' : 'Access Granted!'}
              </span>
            ) : (
              <span className="text-white flex items-center justify-center gap-2">
                <Lock size={20} className="text-[#ff4d4d]" />
                {lang === 'ru' ? 'Доступ К Сайту Заблокирован' : 'Website Access Blocked'}
              </span>
            )}
          </h2>

          <p className="relative z-10 text-xs sm:text-sm text-gray-300 mb-6 leading-relaxed">
            {successMessage ? (
              lang === 'ru'
                ? 'Защитник отключён. Приятного использования сервиса!'
                : 'AdBlock disabled. Enjoy using the platform!'
            ) : (
              lang === 'ru'
                ? 'Мы обнаружили включенный AdGuard, uBlock, Brave Shield или другой блокировщик. Для полноценной работы онлайн-чата и интерактивных сервисов необходимо отключить блокировщик для нашего сайта.'
                : 'AdGuard, uBlock, Brave Shield or another active content blocker was detected. Please pause or disable your ad blocker for this site to continue.'
            )}
          </p>

          {/* Instructions Box */}
          {!successMessage && (
            <div className="relative z-10 bg-[#0c0814] border border-[#3d2b4f] rounded-2xl p-4 text-left mb-6 space-y-2">
              <div className="text-[10px] font-black uppercase text-[#ff4d4d] tracking-widest flex items-center gap-1.5 mb-2">
                <AlertTriangle size={12} />
                {lang === 'ru' ? 'Как разблокировать сайт:' : 'How to unblock:'}
              </div>
              <ol className="text-[11px] text-gray-300 space-y-1.5 list-decimal list-inside font-medium leading-tight">
                <li>{lang === 'ru' ? 'Нажмите на иконку AdGuard / uBlock / Shield в браузере' : 'Click the AdGuard / uBlock / Shield icon in browser'}</li>
                <li>{lang === 'ru' ? 'Выберите «Приостановить на этом сайте» или отключите защиту' : 'Select "Pause on this site" or turn off protection'}</li>
                <li>{lang === 'ru' ? 'Нажмите кнопку «Проверить заново» ниже' : 'Click "Re-check Access" below'}</li>
              </ol>
            </div>
          )}

          {/* Action Button */}
          {!successMessage && (
            <button
              type="button"
              onClick={handleRecheck}
              disabled={isChecking}
              className="relative z-10 w-full py-3.5 bg-gradient-to-r from-[#ff4d4d] to-[#ff2b2b] hover:from-white hover:to-white text-[#150f22] font-black text-sm uppercase tracking-wider rounded-2xl shadow-[0_0_25px_rgba(255,77,77,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <RefreshCw size={18} className={isChecking ? 'animate-spin' : ''} />
              <span>
                {isChecking
                  ? (lang === 'ru' ? 'Проверка...' : 'Checking...')
                  : (lang === 'ru' ? 'Проверить заново' : 'Re-check Access')}
              </span>
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

