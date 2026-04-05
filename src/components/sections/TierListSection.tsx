import React from 'react';
import { motion } from 'motion/react';
import { Language, translations } from '../../data/translations';
import { usePerfLogger } from '../../utils/logger';
import { Swords, Shield, Sparkles, Zap, Heart, Star } from 'lucide-react';

interface TierListSectionProps {
  lang: Language;
  lowPerfMode?: boolean;
}

const CharacterAvatar = React.memo(({ char, lowPerfMode }: { char: string, lowPerfMode?: boolean }) => {
  return (
    <motion.div 
      whileHover={{ scale: 1.1, y: -4, rotate: 2 }}
      whileTap={{ scale: 0.95 }}
      className="group relative flex flex-col items-center"
    >
      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-[#1A1528] border-2 border-[#5C4B8B]/50 overflow-hidden shadow-xl group-hover:border-[#C3A6E6] group-hover:shadow-[#C3A6E6]/20 transition-all duration-300">
        <img 
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(char)}&background=1A1528&color=C3A6E6&bold=true&size=${lowPerfMode ? 64 : 128}`} 
          alt={char}
          className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#2F244F] border border-[#C3A6E6]/30 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all scale-100 sm:scale-75 sm:group-hover:scale-100 z-10 whitespace-nowrap">
        <span className="text-[8px] font-black text-[#C3A6E6] uppercase tracking-widest">
          {char}
        </span>
      </div>
    </motion.div>
  );
});

export const TierListSection: React.FC<TierListSectionProps> = ({ lang, lowPerfMode }) => {
  const t = translations[lang];
  const { trackRender } = usePerfLogger('TierListSection');
  trackRender();

  const tiers = [
    { name: 'S+', color: 'bg-red-500', textColor: 'text-red-100', glow: 'shadow-[0_0_30px_rgba(239,68,68,0.5)]', border: 'border-red-400/50' },
    { name: 'S', color: 'bg-orange-500', textColor: 'text-orange-100', glow: 'shadow-[0_0_25px_rgba(249,115,22,0.4)]', border: 'border-orange-400/50' },
    { name: 'A', color: 'bg-purple-500', textColor: 'text-purple-100', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]', border: 'border-purple-400/50' },
    { name: 'B', color: 'bg-blue-500', textColor: 'text-blue-100', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.2)]', border: 'border-blue-400/50' },
  ];

  const categories = [
    { id: 'dd', label: lang === 'ru' ? 'ДД (Урон)' : 'Damage Dealers', icon: Swords, color: 'text-red-400', bg: 'bg-red-400/5' },
    { id: 'support', label: lang === 'ru' ? 'Поддержка' : 'Amplifiers', icon: Sparkles, color: 'text-yellow-400', bg: 'bg-yellow-400/5' },
    { id: 'sustain', label: lang === 'ru' ? 'Выживание' : 'Sustain', icon: Shield, color: 'text-blue-400', bg: 'bg-blue-400/5' },
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
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {list.map(char => (
          <CharacterAvatar key={char} char={char} lowPerfMode={lowPerfMode} />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-[#2F244F]/40 backdrop-blur-2xl rounded-[3rem] p-6 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.3)] border border-[#5C4B8B]/30">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#C3A6E6]/10 flex items-center justify-center border border-[#C3A6E6]/20">
              <Star className="text-[#C3A6E6]" size={24} />
            </div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">{t.navTierList}</h2>
          </div>
          <p className="text-gray-400 text-sm max-w-2xl leading-relaxed font-medium">
            {lang === 'ru' ? 'Актуальный тир-лист персонажей версии 2.5+. Оценки основаны на эффективности в Чистом Вымысле и Иллюзии Конца.' : 
             'Current character tier list for version 2.5+. Ratings are based on performance in Pure Fiction and Apocalyptic Shadow.'}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-[#1A1528]/50 rounded-2xl border border-[#5C4B8B]/30">
          <Zap size={14} className="text-[#C3A6E6]" />
          <span className="text-[10px] font-black text-[#C3A6E6] uppercase tracking-widest">Version 2.5+</span>
        </div>
      </div>

      <div className="space-y-16">
        {tiers.map(tier => (
          <div key={tier.name} className="relative">
            <div className="flex items-center gap-6 mb-8">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 ${tier.color} ${tier.textColor} ${tier.glow} ${tier.border} rounded-[2rem] flex items-center justify-center text-4xl sm:text-5xl font-black italic transform -skew-x-12 border-4 shadow-2xl relative z-10`}>
                {tier.name}
              </div>
              <div className="flex-1 h-1 bg-gradient-to-r from-[#5C4B8B]/50 via-[#5C4B8B]/20 to-transparent rounded-full" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
              {categories.map(cat => (
                <div key={cat.id} className={`p-6 rounded-[2.5rem] border border-[#5C4B8B]/20 ${cat.bg} backdrop-blur-sm transition-all hover:border-[#C3A6E6]/20`}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`p-2 rounded-xl bg-[#2F244F] border border-[#5C4B8B]/30 ${cat.color}`}>
                      <cat.icon size={18} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.3em] text-white/80">
                      {cat.label}
                    </span>
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
