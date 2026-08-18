import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Language } from '../../data/translations';

interface ScrollToTopBottomProps {
  lang: Language;
}

export const ScrollToTopBottom: React.FC<ScrollToTopBottomProps> = ({ lang }) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [hasScrollablePage, setHasScrollablePage] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const totalHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      const clientHeight = window.innerHeight || document.documentElement.clientHeight;
      const scrollHeight = totalHeight - clientHeight;
      
      if (scrollHeight > 10) {
        setHasScrollablePage(true);
        const progress = Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100));
        setScrollProgress(progress);
        setIsAtTop(scrollTop < 60);
        setIsAtBottom(scrollHeight - scrollTop < 60);
      } else {
        setHasScrollablePage(false);
        setScrollProgress(0);
        setIsAtTop(true);
        setIsAtBottom(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    window.addEventListener('aha_section_reflow', handleScroll as EventListener);
    handleScroll();

    // Check after a brief delay for dynamic content mounting
    const timer = setTimeout(handleScroll, 300);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      window.removeEventListener('aha_section_reflow', handleScroll as EventListener);
      clearTimeout(timer);
    };
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
    <>
      {/* Floating Capsule Up/Down Navigation Widget (Image 2) */}
      <div
        id="global-scroll-nav-group"
        className="fixed bottom-[74px] sm:bottom-[84px] right-4 sm:right-6 z-40 flex flex-col items-center p-1 bg-[#1a1426]/95 backdrop-blur-md border border-[#3d2b4f] rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.7)] select-none print:hidden transition-all duration-300"
        role="group"
        aria-label={lang === 'ru' ? 'Навигация по странице' : 'Page Scroll Navigation'}
      >
        {/* Scroll to Top Button */}
        <motion.button
          id="scroll-to-top-btn"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={scrollToTop}
          disabled={isAtTop}
          className={`relative group p-2 sm:p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
            isAtTop
              ? 'opacity-30 cursor-not-allowed text-gray-500'
              : 'text-gray-300 hover:text-white bg-[#251c35]/80 hover:bg-[#ff4d4d] hover:text-[#15101e] hover:shadow-[0_0_15px_rgba(255,77,77,0.4)]'
          }`}
          title={labels.top[lang] || labels.top.en}
          aria-label={labels.top[lang] || labels.top.en}
        >
          <ArrowUp size={16} strokeWidth={2.5} />
          
          {/* Tooltip */}
          <span className="pointer-events-none absolute right-full mr-2.5 px-2.5 py-1 rounded-lg bg-[#1c1528] text-white text-[11px] font-bold tracking-wider uppercase border border-[#3d2b4f] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
            {labels.top[lang] || labels.top.en}
          </span>
        </motion.button>

        {/* Divider / Mini Progress Line */}
        <div className="w-5 h-[1px] bg-[#3d2b4f]/70 my-0.5" />

        {/* Scroll to Bottom Button */}
        <motion.button
          id="scroll-to-bottom-btn"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={scrollToBottom}
          disabled={isAtBottom}
          className={`relative group p-2 sm:p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
            isAtBottom
              ? 'opacity-30 cursor-not-allowed text-gray-500'
              : 'text-gray-300 hover:text-white bg-[#251c35]/80 hover:bg-[#ff4d4d] hover:text-[#15101e] hover:shadow-[0_0_15px_rgba(255,77,77,0.4)]'
          }`}
          title={labels.bottom[lang] || labels.bottom.en}
          aria-label={labels.bottom[lang] || labels.bottom.en}
        >
          <ArrowDown size={16} strokeWidth={2.5} />
          
          {/* Tooltip */}
          <span className="pointer-events-none absolute right-full mr-2.5 px-2.5 py-1 rounded-lg bg-[#1c1528] text-white text-[11px] font-bold tracking-wider uppercase border border-[#3d2b4f] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
            {labels.bottom[lang] || labels.bottom.en}
          </span>
        </motion.button>
      </div>

      {/* Screen-bottom Scroll Reading Progress Bar with Dot (As seen in Image 2) */}
      {hasScrollablePage && scrollProgress > 0 && (
        <div className="fixed bottom-0 left-0 right-0 h-1 bg-[#15101e]/60 z-50 pointer-events-none print:hidden">
          <div
            className="h-full bg-gradient-to-r from-[#ff4d4d]/80 to-[#ff4d4d] relative transition-all duration-100"
            style={{ width: `${scrollProgress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.9),0_0_12px_rgba(255,77,77,0.8)] border border-[#ff4d4d]" />
          </div>
        </div>
      )}
    </>
  );
};
