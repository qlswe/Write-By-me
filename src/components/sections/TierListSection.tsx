import React from 'react';
import { motion } from 'motion/react';
import { Language, translations } from '../../data/translations';
import { usePerfLogger } from '../../utils/logger';
import { Swords, Shield, Sparkles, Zap, Heart, Star } from 'lucide-react';

interface TierListSectionProps {
  lang: Language;
  lowPerfMode?: boolean;
}

export const TierListSection: React.FC<TierListSectionProps> = ({ lang, lowPerfMode }) => {
  const t = translations[lang];
  const { trackRender } = usePerfLogger('TierListSection');
  trackRender();

  const tiers = [
    { name: 'S+', color: 'bg-red-500', textColor: 'text-red-100', glow: 'shadow-[0_0_20px_rgba(239,68,68,0.4)]' },
    { name: 'S', color: 'bg-orange-500', textColor: 'text-orange-100', glow: 'shadow-[0_0_15px_rgba(249,115,22,0.3)]' },
    { name: 'A', color: 'bg-purple-500', textColor: 'text-purple-100', glow: 'shadow-[0_0_10px_rgba(168,85,247,0.2)]' },
    { name: 'B', color: 'bg-blue-500', textColor: 'text-blue-100', glow: 'shadow-[0_0_5px_rgba(59,130,246,0.1)]' },
  ];

  const categories = [
    { id: 'dd', label: lang === 'ru' ? 'ДД (Урон)' : 'Damage Dealers', icon: Swords, color: 'text-red-400' },
    { id: 'support', label: lang === 'ru' ? 'Поддержка' : 'Amplifiers', icon: Sparkles, color: 'text-yellow-400' },
    { id: 'sustain', label: lang === 'ru' ? 'Выживание' : 'Sustain', icon: Shield, color: 'text-blue-400' },
  ];

  const characters: Record<string, Record<string, string[]>> = {
    'S+': {
      'dd': [t.characters.acheron, t.characters.firefly, t.characters.feixiao, t.characters.yunli, t.characters.boothill, t.characters.rappa],
      'support': [t.characters.ruanmei, t.characters.sparkle, t.characters.robin, t.characters.jiaoqiu, t.characters.silverwolf, t.characters.tingyun],
      'sustain': [t.characters.aventurine, t.characters.huohuo, t.characters.fuxuan, t.characters.lingsha, t.characters.gallagher],
    },
    'S': {
      'dd': [t.characters.jingliu, t.characters.danhengIL, t.characters.kafka, t.characters.blackSwan, t.characters.ratio, t.characters.seele, t.characters.jingyuan, t.characters.argenti, t.characters.blade, t.characters.clara, t.characters.jade, t.characters.moze, t.characters.marchHunt],
      'support': [t.characters.bronya, t.characters.pela, t.characters.guinaifen, t.characters.asta, t.characters.hanya, t.characters.yukong],
      'sustain': [t.characters.luocha, t.characters.gepard, t.characters.bailu],
    },
    'A': {
      'dd': [t.characters.topaz, t.characters.himeko, t.characters.herta, t.characters.xueyi, t.characters.misha, t.characters.qingque],
      'support': [t.characters.sampo, t.characters.luka],
      'sustain': [t.characters.lynx, t.characters.march7, t.characters.natasha, t.characters.fireTB],
    },
    'B': {
      'dd': [t.characters.yanqing, t.characters.sushang, t.characters.danheng, t.characters.hook, t.characters.arlan, t.characters.physTB],
      'support': [t.characters.harmonyTB],
      'sustain': [t.characters.marchPres],
    },
  };

  const renderCharList = (tier: string, catId: string) => {
    const list = characters[tier]?.[catId] || [];
    return (
      <div className="flex flex-wrap gap-3">
        {list.map(char => (
          <motion.div 
            key={char}
            whileHover={{ scale: 1.05, y: -2 }}
            className="group relative flex flex-col items-center"
          >
            <div className="w-14 h-14 rounded-xl bg-[#2F244F] border border-[#5C4B8B] overflow-hidden shadow-md group-hover:border-[#C3A6E6] transition-all duration-300">
              <img 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(char)}&background=2F244F&color=C3A6E6&bold=true&size=${lowPerfMode ? 64 : 128}`} 
                alt={char}
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="mt-1.5 text-[10px] font-medium text-gray-400 group-hover:text-[#C3A6E6] transition-colors text-center max-w-[60px] truncate">
              {char}
            </span>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-[#3E3160]/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-[#5C4B8B]">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[#C3A6E6] mb-2">{t.navTierList}</h2>
        <p className="text-gray-400 text-sm">
          {lang === 'ru' ? 'Актуальный тир-лист персонажей версии 2.5+. Оценки основаны на эффективности в Чистом Вымысле и Иллюзии Конца.' : 
           'Current character tier list for version 2.5+. Ratings are based on performance in Pure Fiction and Apocalyptic Shadow.'}
        </p>
      </div>

      <div className="space-y-12">
        {tiers.map(tier => (
          <div key={tier.name} className="relative">
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-14 h-14 ${tier.color} ${tier.textColor} ${tier.glow} rounded-2xl flex items-center justify-center text-3xl font-black italic transform -skew-x-12 border-2 border-white/20 shadow-lg`}>
                {tier.name}
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-[#5C4B8B] via-[#5C4B8B]/50 to-transparent" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 ml-2 lg:ml-6">
              {categories.map(cat => (
                <div key={cat.id} className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-500 border-l-2 border-[#C3A6E6]/30 pl-3">
                    <cat.icon size={16} className={cat.color} />
                    {cat.label}
                  </div>
                  {renderCharList(tier.name, cat.id)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 p-6 bg-[#2F244F]/50 rounded-2xl border border-[#5C4B8B]/30 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-[#C3A6E6]/10 flex items-center justify-center shrink-0">
          <Sparkles size={20} className="text-[#C3A6E6]" />
        </div>
        <div className="text-xs text-gray-400 leading-relaxed italic">
          {lang === 'ru' 
            ? 'Министерство Ахахи напоминает: любой персонаж может быть сильным при правильной сборке и команде. Данный тир-лист является лишь рекомендацией для прохождения сложного контента.' 
            : 'Ministry of Ahahi reminds: any character can be strong with the right build and team. This tier list is only a recommendation for clearing endgame content.'}
        </div>
      </div>
    </div>
  );
};
