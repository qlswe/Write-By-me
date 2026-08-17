import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, BookOpen, FileText, Calendar, Sparkles } from 'lucide-react';
import { Language } from '../../data/translations';

interface QuickActionsMenuProps {
  lang: Language;
  onCreateTheory: () => void;
  onCreateBlog: () => void;
}

export const QuickActionsMenu: React.FC<QuickActionsMenuProps> = ({
  lang,
  onCreateTheory,
  onCreateBlog
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const actions = [
    {
      id: 'theory',
      titleRu: 'Создать теорию',
      titleEn: 'Create Theory',
      descRu: 'Гипотеза или сюжетный лор',
      descEn: 'Lore or story hypothesis',
      icon: BookOpen,
      color: '#ff4d4d',
      action: onCreateTheory
    },
    {
      id: 'blog',
      titleRu: 'Написать статью',
      titleEn: 'New Blog Post',
      descRu: 'Новость, патчноут или гайд',
      descEn: 'News, patch note or guide',
      icon: FileText,
      color: '#00f0ff',
      action: onCreateBlog
    }
  ];

  return (
    <div ref={containerRef} className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-40 flex flex-col items-end">
      {/* Expanded Quick Actions Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            className="mb-3 p-3 bg-[#15101e]/95 backdrop-blur-xl border border-[#3d2b4f] rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.6)] w-64 sm:w-72 overflow-hidden"
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#3d2b4f]/60 px-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Sparkles size={13} className="text-[#ff4d4d]" />
                {lang === 'ru' ? 'Быстрые действия' : 'Quick Actions'}
              </span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-[#ff4d4d]/10 text-[#ff4d4d] border border-[#ff4d4d]/30 rounded">
                FAST
              </span>
            </div>

            <div className="space-y-1.5">
              {actions.map((act) => {
                const Icon = act.icon;
                return (
                  <motion.button
                    key={act.id}
                    whileHover={{ scale: 1.02, x: 2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setIsOpen(false);
                      act.action();
                    }}
                    className="w-full p-2.5 rounded-xl bg-[#1d1728]/80 hover:bg-[#281f37] border border-[#3d2b4f]/40 hover:border-gray-600/50 transition-all flex items-center gap-3 text-left group cursor-pointer"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 transition-all group-hover:scale-110"
                      style={{
                        backgroundColor: `${act.color}15`,
                        borderColor: `${act.color}40`,
                        color: act.color
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-gray-100 group-hover:text-white transition-colors truncate">
                        {lang === 'ru' ? act.titleRu : act.titleEn}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate">
                        {lang === 'ru' ? act.descRu : act.descEn}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Trigger FAB Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative group flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-[#ff4d4d] to-[#ff2b55] hover:from-[#ff6666] hover:to-[#ff3d63] text-[#15101e] font-black text-xs uppercase tracking-wider rounded-2xl shadow-[0_8px_25px_rgba(255,77,77,0.4)] transition-all cursor-pointer active:scale-95 border border-white/20"
      >
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>

        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? <X size={18} className="text-[#15101e]" /> : <Plus size={18} className="text-[#15101e]" />}
        </motion.div>

        <span className="font-extrabold tracking-wide hidden sm:inline">
          {lang === 'ru' ? 'Быстрые действия' : 'Quick Actions'}
        </span>
      </motion.button>
    </div>
  );
};
