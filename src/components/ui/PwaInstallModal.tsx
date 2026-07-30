import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Smartphone, Monitor, CheckCircle2, Share, PlusSquare, Globe, Zap, Shield, X, WifiOff } from 'lucide-react';
import { Language } from '../../data/translations';
import { usePWA } from '../../hooks/usePWA';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({ isOpen, onClose, lang }) => {
  const { canInstall, isInstalled, isIOS, installPWA } = usePWA();
  const [installSuccess, setInstallSuccess] = React.useState(false);

  const handleInstallClick = async () => {
    const success = await installPWA();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => {
        onClose();
        setInstallSuccess(false);
      }, 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-[#15101e] border border-[#3d2b4f] rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] relative space-y-6 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Glow background */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#ff4d4d]/10 blur-3xl rounded-full pointer-events-none" />

          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-white p-2 rounded-full hover:bg-[#251c35] transition-colors"
          >
            <X size={20} />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-4 border-b border-[#3d2b4f]/60 pb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ff4d4d] to-[#9333ea] flex items-center justify-center text-white shadow-lg shadow-[#ff4d4d]/20 shrink-0">
              <Smartphone size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white uppercase tracking-wider">
                  {lang === 'ru' ? 'Установка Web-App' : 'Install Web-App'}
                </h2>
                {isInstalled && (
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    {lang === 'ru' ? 'Установлено' : 'Installed'}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {lang === 'ru' 
                  ? 'Быстрый доступ с главного экрана и автономная работа' 
                  : 'Fast home screen access & offline execution'}
              </p>
            </div>
          </div>

          {/* Installed Success View */}
          {installSuccess || isInstalled ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-3">
              <CheckCircle2 size={48} className="text-emerald-400 mx-auto animate-bounce" />
              <h3 className="text-white font-bold text-base">
                {lang === 'ru' ? 'Приложение установлено!' : 'Application Installed!'}
              </h3>
              <p className="text-gray-300 text-xs">
                {lang === 'ru' 
                  ? 'Министерство Ахахи теперь доступно на вашем главном экране в формате автономного Web-App.' 
                  : 'Aha Ministry is now available on your home screen as a standalone Web-App.'}
              </p>
              <button
                onClick={onClose}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-[#15101e] font-black text-xs uppercase tracking-widest rounded-xl transition-colors cursor-pointer"
              >
                {lang === 'ru' ? 'Отлично' : 'Done'}
              </button>
            </div>
          ) : (
            <>
              {/* Feature Highlights */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0b0813] border border-[#3d2b4f]/50 p-3.5 rounded-2xl flex items-start gap-3">
                  <Zap size={20} className="text-[#ff4d4d] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-white font-bold text-xs">{lang === 'ru' ? 'Мгновенный пуск' : 'Instant Launch'}</h4>
                    <p className="text-gray-400 text-[10px] leading-tight mt-0.5">{lang === 'ru' ? 'Без ввода URL адреса' : 'No URL typing needed'}</p>
                  </div>
                </div>

                <div className="bg-[#0b0813] border border-[#3d2b4f]/50 p-3.5 rounded-2xl flex items-start gap-3">
                  <WifiOff size={20} className="text-[#00f0ff] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-white font-bold text-xs">{lang === 'ru' ? 'Офлайн Режим' : 'Offline Access'}</h4>
                    <p className="text-gray-400 text-[10px] leading-tight mt-0.5">{lang === 'ru' ? 'Работает без интернета' : 'Works without internet'}</p>
                  </div>
                </div>
              </div>

              {/* Action area: Direct Install vs Instructions */}
              {canInstall ? (
                <div className="space-y-3">
                  <button
                    onClick={handleInstallClick}
                    className="w-full py-4 bg-gradient-to-r from-[#ff4d4d] to-[#a855f7] hover:from-[#ff6666] hover:to-[#b566ff] text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-[#ff4d4d]/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download size={20} />
                    {lang === 'ru' ? 'Установить в 1 клик' : 'Install in 1 Click'}
                  </button>
                  <p className="text-[10px] text-center text-gray-500">
                    {lang === 'ru' ? 'Стандартный запрос установки браузера Chrome / Edge / Opera' : 'Standard Chrome / Edge / Opera PWA installation prompt'}
                  </p>
                </div>
              ) : isIOS ? (
                /* iOS Safari Guide */
                <div className="bg-[#0b0813] border border-[#3d2b4f]/60 rounded-2xl p-4 space-y-3">
                  <h4 className="text-[#00f0ff] font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                    <Monitor size={16} />
                    {lang === 'ru' ? 'Инструкция для iOS (Safari)' : 'iOS Safari Instructions'}
                  </h4>
                  <ol className="space-y-2 text-xs text-gray-300">
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#ff4d4d]/20 text-[#ff4d4d] font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
                      <span>{lang === 'ru' ? 'Нажмите кнопку ' : 'Tap the '} <strong>{lang === 'ru' ? '«Поделиться»' : '«Share»'}</strong> <Share size={14} className="inline text-[#00f0ff] mx-1" /> {lang === 'ru' ? 'в низу экрана Safari.' : 'in Safari toolbar.'}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#ff4d4d]/20 text-[#ff4d4d] font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
                      <span>{lang === 'ru' ? 'Прокрутите и выберите ' : 'Scroll down and select '} <strong>{lang === 'ru' ? '«На экран «Домой»»' : '«Add to Home Screen»'}</strong> <PlusSquare size={14} className="inline text-emerald-400 mx-1" />.</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#ff4d4d]/20 text-[#ff4d4d] font-bold text-[11px] flex items-center justify-center shrink-0">3</span>
                      <span>{lang === 'ru' ? 'Подтвердите добавление в правом верхнем углу.' : 'Confirm by tapping Add.'}</span>
                    </li>
                  </ol>
                </div>
              ) : (
                /* Desktop / General Browser Guide */
                <div className="bg-[#0b0813] border border-[#3d2b4f]/60 rounded-2xl p-4 space-y-3">
                  <h4 className="text-amber-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                    <Globe size={16} />
                    {lang === 'ru' ? 'Инструкция установки вручную' : 'Manual Installation Guide'}
                  </h4>
                  <ol className="space-y-2 text-xs text-gray-300">
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
                      <span>{lang === 'ru' ? 'Откройте меню браузера (3 точки ⋮).' : 'Open browser menu (3 dots ⋮).'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
                      <span>{lang === 'ru' ? 'Выберите «Установить приложение» или «Добавить на главный экран».' : 'Select «Install app» or «Add to Home Screen».'}</span>
                    </li>
                  </ol>
                </div>
              )}

              {/* Secondary Android APK Alternative */}
              <div className="pt-2 border-t border-[#3d2b4f]/40 flex items-center justify-between gap-4">
                <div className="text-left">
                  <span className="text-white font-bold text-xs block">{lang === 'ru' ? 'Альтернатива: Android APK' : 'Alternative: Android APK'}</span>
                  <span className="text-gray-400 text-[10px]">{lang === 'ru' ? 'Автономный установочный файл' : 'Native standalone build file'}</span>
                </div>
                <a
                  href="https://wbm-static.my1.ru/app-debug-inst.apk"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#251c35] hover:bg-[#3d2b4f] text-gray-200 border border-[#3d2b4f] hover:border-[#ff4d4d] px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Download size={14} className="text-[#ff4d4d]" />
                  <span>APK (5MB)</span>
                </a>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
