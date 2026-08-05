import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, FileText, Calendar, ChevronRight, Sparkles } from 'lucide-react';
import { Language, translations } from '../../data/translations';
import { useContent } from '../../hooks/useContent';

interface HomeStatsWidgetProps {
  lang: Language;
  onNavigate: (section: string) => void;
}

export const HomeStatsWidget: React.FC<HomeStatsWidgetProps> = ({ lang, onNavigate }) => {
  const { theories, blogPosts, events } = useContent();

  const publishedTheoriesCount = (theories || []).filter((item: any) => item.published !== false).length;
  const publishedBlogCount = (blogPosts || []).filter((item: any) => item.published !== false).length;
  const activeEventsCount = (events || []).filter((item: any) => item.active !== false).length;

  const stats = [
    {
      id: 'theories',
      section: 'theories',
      count: publishedTheoriesCount,
      titleRu: 'Опубликовано теорий',
      titleEn: 'Published Theories',
      descRu: 'Гипотезы и сюжетный лор',
      descEn: 'Hypotheses & story lore',
      icon: BookOpen,
      color: '#ff4d4d',
      bgGlow: 'from-[#ff4d4d]/20 to-transparent',
      borderColor: 'hover:border-[#ff4d4d]/60',
      badgeRu: 'Теории',
      badgeEn: 'Lore'
    },
    {
      id: 'blog',
      section: 'blog',
      count: publishedBlogCount,
      titleRu: 'Статей и Блогов',
      titleEn: 'Blog Posts & Articles',
      descRu: 'Аналитика и патчноуты',
      descEn: 'Analytics & patch notes',
      icon: FileText,
      color: '#00f0ff',
      bgGlow: 'from-[#00f0ff]/20 to-transparent',
      borderColor: 'hover:border-[#00f0ff]/60',
      badgeRu: 'Блоги',
      badgeEn: 'Articles'
    },
    {
      id: 'events',
      section: 'chronicle',
      count: activeEventsCount,
      titleRu: 'Активных событий',
      titleEn: 'Active Events',
      descRu: 'Хроника и эвенты',
      descEn: 'Chronicle & events',
      icon: Calendar,
      color: '#a855f7',
      bgGlow: 'from-purple-500/20 to-transparent',
      borderColor: 'hover:border-purple-500/60',
      badgeRu: 'Ивенты',
      badgeEn: 'Events'
    }
  ];

  return (
    <div className="mb-8 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
          <Sparkles size={14} className="text-[#ff4d4d]" />
          {lang === 'ru' ? 'Статистика Контента Сообщества' : 'Community Content Stats'}
        </h3>
        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
          {lang === 'ru' ? 'LIVE ДАННЫЕ' : 'LIVE DATA'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.button
              key={stat.id}
              type="button"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate(stat.section)}
              className={`p-4 bg-[#15101e] border border-[#3d2b4f] ${stat.borderColor} rounded-2xl transition-all duration-300 text-left cursor-pointer relative overflow-hidden group shadow-lg flex flex-col justify-between min-h-[120px]`}
            >
              <div className={`absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl ${stat.bgGlow} rounded-bl-full pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity`} />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all"
                    style={{
                      backgroundColor: `${stat.color}15`,
                      borderColor: `${stat.color}40`,
                      color: stat.color
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <span
                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider"
                    style={{
                      backgroundColor: `${stat.color}15`,
                      borderColor: `${stat.color}30`,
                      color: stat.color
                    }}
                  >
                    {lang === 'ru' ? stat.badgeRu : stat.badgeEn}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                    {stat.count}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-gray-200 mt-1">
                  {lang === 'ru' ? stat.titleRu : stat.titleEn}
                </h4>
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-gray-400 group-hover:text-white transition-colors border-t border-[#3d2b4f]/40 mt-3">
                <span className="truncate">{lang === 'ru' ? stat.descRu : stat.descEn}</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform shrink-0" style={{ color: stat.color }} />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
