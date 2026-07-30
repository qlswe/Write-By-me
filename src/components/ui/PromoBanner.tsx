import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Smartphone, CheckCircle2 } from 'lucide-react';
import { Language, translations } from '../../data/translations';
import { usePerfLogger } from '../../utils/logger';
import { usePWA } from '../../hooks/usePWA';
import { PwaInstallModal } from './PwaInstallModal';

interface PromoBannerProps {
  showBanner: boolean;
  lang: Language;
  setModalContent: (content: { id?: string; title: string; content: string }) => void;
  onClose: () => void;
}

export const PromoBanner: React.FC<PromoBannerProps> = ({ showBanner, lang, setModalContent, onClose }) => {
  const t = translations[lang];
  const { trackRender } = usePerfLogger('PromoBanner');
  trackRender();

  const { canInstall, isInstalled, installPWA } = usePWA();
  const [pwaModalOpen, setPwaModalOpen] = useState(false);

  const handleQuickInstall = async () => {
    if (canInstall) {
      await installPWA();
    } else {
      setPwaModalOpen(true);
    }
  };

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative bg-[#251c35] border border-[#3d2b4f] border-l-4 border-l-[#ff4d4d] rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-center gap-4 shadow-2xl"
          >
            <button 
              onClick={onClose}
              className="absolute top-2 right-2 p-1 text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 text-[#ff4d4d] flex items-center justify-center shrink-0">
              <Smartphone size={28} />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h3 className="text-lg font-black text-white">
                  {lang === 'ru' ? 'Установите Web-App' : 'Install Web-App'}
                </h3>
                {isInstalled ? (
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    {lang === 'ru' ? 'Установлено' : 'Installed'}
                  </span>
                ) : (
                  <span className="bg-[#ff4d4d]/20 text-[#ff4d4d] border border-[#ff4d4d]/30 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    PWA Ready
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                {lang === 'ru'
                  ? 'Запустите приложение прямо с главного экрана. Полная офлайн-поддержка, мгновенная загрузка и удобство.'
                  : 'Launch directly from your home screen with full offline support and instant loading.'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
              <button 
                onClick={handleQuickInstall}
                className="bg-[#ff4d4d] hover:bg-[#ff6666] text-[#15101e] px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider whitespace-nowrap transition-all shadow-lg shadow-[#ff4d4d]/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Download size={16} />
                {canInstall 
                  ? (lang === 'ru' ? 'Установить в 1 клик' : '1-Click Install')
                  : (lang === 'ru' ? 'Установка Web-App' : 'Install Guide')}
              </button>
              <button
                onClick={() => setPwaModalOpen(true)}
                className="bg-[#15101e] border border-[#3d2b4f] hover:border-[#ff4d4d] text-gray-200 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-colors flex items-center justify-center cursor-pointer"
              >
                {lang === 'ru' ? 'Подробнее' : 'Details'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PwaInstallModal 
        isOpen={pwaModalOpen} 
        onClose={() => setPwaModalOpen(false)} 
        lang={lang} 
      />
    </>
  );
};

