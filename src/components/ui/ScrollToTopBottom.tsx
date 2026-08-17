import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Language } from '../../data/translations';

interface ScrollToTopBottomProps {
  lang: Language;
}

export const ScrollToTopBottom: React.FC<ScrollToTopBottomProps> = ({ lang }) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const totalHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      const clientHeight = window.innerHeight || document.documentElement.clientHeight;
      const scrollHeight = totalHeight - clientHeight;
      
      if (scrollHeight > 0) {
        const progress = Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100));
        setScrollProgress(progress);
        setIsAtTop(scrollTop < 80);
        setIsAtBottom(scrollHeight - scrollTop < 80);
      } else {
        setScrollProgress(0);
        setIsAtTop(true);
        setIsAtBottom(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const scrollToBottom = () => {
    const totalHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    window.scrollTo({
      top: totalHeight,
      behavior: 'smooth'
    });
  };

  const labels = {
    top: {
      ru: 'Наверх',
      en: 'Top',
      by: 'Наверх',
      de: 'Nach oben',
      fr: 'Haut',
      zh: '顶部'
    },
    bottom: {
      ru: 'Вниз',
      en: 'Bottom',
      by: 'Уніз',
      de: 'Nach unten',
      fr: 'Bas',
      zh: '底部'
    }
  };

  return (
    <div
      id="home-scroll-nav-group"
      className="fixed bottom-[74px] sm:bottom-[84px] right-4 sm:right-6 z-30 flex flex-col items-center gap-1 p-1 bg-[#15101e]/90 backdrop-blur-md border border-[#3d2b4f] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.6)]"
      role="group"
      aria-label={lang === 'ru' ? 'Навигация по странице' : 'Page Scroll Navigation'}
    >
      {/* Scroll to Top Button */}
      <motion.button
        id="scroll-to-top-btn"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={scrollToTop}
        disabled={isAtTop}
        className={`relative group p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
          isAtTop
            ? 'opacity-35 cursor-not-allowed text-gray-500'
            : 'text-gray-300 hover:text-white bg-[#251c35]/80 hover:bg-[#ff4d4d] hover:text-[#15101e] hover:shadow-[0_0_15px_rgba(255,77,77,0.4)]'
        }`}
        title={labels.top[lang] || labels.top.en}
        aria-label={labels.top[lang] || labels.top.en}
      >
        <ArrowUp size={16} strokeWidth={2.5} />
        
        {/* Tooltip */}
        <span className="pointer-events-none absolute right-full mr-2.5 px-2 py-1 rounded-md bg-[#1c1528] text-white text-[11px] font-bold tracking-wider uppercase border border-[#3d2b4f] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
          {labels.top[lang] || labels.top.en}
        </span>
      </motion.button>

      {/* Subtle Divider / Progress Indicator */}
      <div className="w-4 h-[1px] bg-[#3d2b4f]/60 relative">
        <div 
          className="absolute inset-y-0 left-0 bg-[#ff4d4d] transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Scroll to Bottom Button */}
      <motion.button
        id="scroll-to-bottom-btn"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={scrollToBottom}
        disabled={isAtBottom}
        className={`relative group p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
          isAtBottom
            ? 'opacity-35 cursor-not-allowed text-gray-500'
            : 'text-gray-300 hover:text-white bg-[#251c35]/80 hover:bg-[#ff4d4d] hover:text-[#15101e] hover:shadow-[0_0_15px_rgba(255,77,77,0.4)]'
        }`}
        title={labels.bottom[lang] || labels.bottom.en}
        aria-label={labels.bottom[lang] || labels.bottom.en}
      >
        <ArrowDown size={16} strokeWidth={2.5} />
        
        {/* Tooltip */}
        <span className="pointer-events-none absolute right-full mr-2.5 px-2 py-1 rounded-md bg-[#1c1528] text-white text-[11px] font-bold tracking-wider uppercase border border-[#3d2b4f] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
          {labels.bottom[lang] || labels.bottom.en}
        </span>
      </motion.button>
    </div>
  );
};
