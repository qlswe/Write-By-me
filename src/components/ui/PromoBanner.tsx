import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X } from 'lucide-react';
import { Language, translations } from '../../data/translations';
import { usePerfLogger } from '../../utils/logger';

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

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="relative bg-[#3E3160] border border-[#5C4B8B] border-l-4 border-l-[#C3A6E6] rounded-xl p-5 mb-8 flex flex-col sm:flex-row items-center gap-4 shadow-lg"
        >
          <button 
            onClick={onClose}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
          <div className="text-[#C3A6E6] shrink-0">
            <Download size={32} />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-lg font-bold text-white mb-1">
              {t.bannerTitle || "Установите приложение"}
            </h3>
            <p className="text-sm text-gray-300">
              {t.bannerDesc || "Доступно как Web-App (через меню браузера) и как отдельное Android-приложение."}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => setModalContent({ id: 'promo-install', title: t.installGuideTitle || "Как установить Web-App", content: t.installGuideContent || "<p>1. Откройте меню браузера.</p><p>2. Выберите «Добавить на главный экран».</p>" })}
              className="bg-[#2F244F] border border-[#5C4B8B] hover:border-[#C3A6E6] text-gray-200 px-4 py-2.5 rounded-lg font-bold whitespace-nowrap transition-colors"
            >
              {t.bannerBtnWeb || "Как установить Web-App"}
            </button>
            <a 
              href="https://wbm-static.my1.ru/app-debug-inst.apk" 
              className="bg-[#C3A6E6] hover:bg-[#B094EB] text-[#2F244F] px-6 py-2.5 rounded-lg font-bold whitespace-nowrap transition-colors text-center"
            >
              {t.bannerBtnAndroid || "Скачать Android APK"}
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
