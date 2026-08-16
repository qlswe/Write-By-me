import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, FileText, Ticket, ChevronRight, Sparkles } from 'lucide-react';
import { Language, translations } from '../../data/translations';
import { useContent } from '../../hooks/useContent';

interface HomeStatsWidgetProps {
  lang: Language;
  onNavigate: (section: string) => void;
}

export const HomeStatsWidget: React.FC<HomeStatsWidgetProps> = ({ lang, onNavigate }) => {
  const { theories, blogPosts, promoCodes } = useContent();

  const publishedTheoriesCount = (theories || []).filter((item: any) => item.published !== false).length;
  const publishedBlogCount = (blogPosts || []).filter((item: any) => item.published !== false).length;
  const activePromoCount = (promoCodes || []).length;

  const titles = {
    ru: { header: 'Статистика Контента Сообщества', live: 'LIVE ДАННЫЕ' },
    en: { header: 'Community Content Stats', live: 'LIVE DATA' },
    by: { header: 'Статыстыка Кантэнту Супольнасці', live: 'LIVE ДАНЫЯ' },
    de: { header: 'Community-Inhaltsstatistiken', live: 'LIVE-DATEN' },
    fr: { header: 'Statistiques du contenu de la communauté', live: 'DONNÉES EN DIRECT' },
    zh: { header: '社区内容统计', live: '实时数据' }
  };

  const uiText = titles[lang] || titles.en;

  const stats = [
    {
      id: 'theories',
      section: 'theories',
      count: publishedTheoriesCount,
      title: {
        ru: 'Опубликовано теорий',
        en: 'Published Theories',
        by: 'Апублікавана тэорый',
        de: 'Veröffentlichte Theorien',
        fr: 'Théories publiées',
        zh: '已发布理论'
      },
      desc: {
        ru: 'Гипотезы и сюжетный лор',
        en: 'Hypotheses & story lore',
        by: 'Гіпотэзы і сюжэтны лор',
        de: 'Hypothesen & Story-Lore',
        fr: 'Hypothèses et lore de l\'histoire',
        zh: '假设与故事背景'
      },
      icon: BookOpen,
      color: '#ff4d4d',
      bgGlow: 'from-[#ff4d4d]/20 to-transparent',
      borderColor: 'hover:border-[#ff4d4d]/60',
      badge: {
        ru: 'Теории',
        en: 'Lore',
        by: 'Тэорыі',
        de: 'Theorien',
        fr: 'Théories',
        zh: '设定'
      }
    },
    {
      id: 'blog',
      section: 'blog',
      count: publishedBlogCount,
      title: {
        ru: 'Статей и Блогов',
        en: 'Blog Posts & Articles',
        by: 'Артыкулаў і Блогаў',
        de: 'Blogbeiträge & Artikel',
        fr: 'Articles de blog',
        zh: '博客文章'
      },
      desc: {
        ru: 'Аналитика и патчноуты',
        en: 'Analytics & patch notes',
        by: 'Аналітыка і патчноўты',
        de: 'Analysen & Patchnotizen',
        fr: 'Analyses et notes de patch',
        zh: '分析与更新说明'
      },
      icon: FileText,
      color: '#00f0ff',
      bgGlow: 'from-[#00f0ff]/20 to-transparent',
      borderColor: 'hover:border-[#00f0ff]/60',
      badge: {
        ru: 'Блоги',
        en: 'Articles',
        by: 'Блогі',
        de: 'Blogs',
        fr: 'Blogs',
        zh: '文章'
      }
    },
    {
      id: 'promo',
      section: 'promo',
      count: activePromoCount,
      title: {
        ru: 'Активных промокодов',
        en: 'Active Promo Codes',
        by: 'Актыўных промакодаў',
        de: 'Aktive Gutscheincodes',
        fr: 'Codes promo actifs',
        zh: '有效兑换码'
      },
      desc: {
        ru: 'Нефрит и кредиты',
        en: 'Jade & credits rewards',
        by: 'Нэфрыт і крэдыты',
        de: 'Jade & Credits Belohnungen',
        fr: 'Jade stellaire et crédits',
        zh: '星琼与信用点奖励'
      },
      icon: Ticket,
      color: '#a855f7',
      bgGlow: 'from-purple-500/20 to-transparent',
      borderColor: 'hover:border-purple-500/60',
      badge: {
        ru: 'Промокоды',
        en: 'Promo Codes',
        by: 'Промакоды',
        de: 'Promocodes',
        fr: 'Codes promo',
        zh: '兑换码'
      }
    }
  ];

  return (
    <div className="mb-8 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
          <Sparkles size={14} className="text-[#ff4d4d]" />
          {uiText.header}
        </h3>
        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
          {uiText.live}
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
                    {stat.badge[lang] || stat.badge.en}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                    {stat.count}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-gray-200 mt-1">
                  {stat.title[lang] || stat.title.en}
                </h4>
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-gray-400 group-hover:text-white transition-colors border-t border-[#3d2b4f]/40 mt-3">
                <span className="truncate">{stat.desc[lang] || stat.desc.en}</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform shrink-0" style={{ color: stat.color }} />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
