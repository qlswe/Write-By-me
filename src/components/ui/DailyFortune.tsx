import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Ticket, Star } from 'lucide-react';
import { Language, translations } from '../../data/translations';

interface DailyFortuneProps {
  lang: Language;
}

const fortunes = [
  { text: { ru: "Сегодня отличный день для прыжков! Золото уже близко.", en: "Great day for warping! Gold is near.", by: "Выдатны дзень для скачкоў! Золата ўжо блізка.", de: "Ein toller Tag zum Warpen! Gold ist nah.", fr: "Excellente journée pour les sauts ! L'or est proche.", zh: "今天是跃迁的好日子！金光就在眼前。" }, type: 'good' },
  { text: { ru: "Звезды советуют поберечь звездный нефрит.", en: "The stars advise saving your Stellar Jade.", by: "Зоркі раяць паберагчы зорны нефрыт.", de: "Die Sterne raten, deine Stellare Jade zu sparen.", fr: "Les étoiles conseillent d'économiser votre Jade Stellaire.", zh: "群星建议保留星琼。" }, type: 'bad' },
  { text: { ru: "Вас ждет неожиданная встреча на Пенаконии.", en: "An unexpected encounter awaits you in Penacony.", by: "Вас чакае нечаканая сустрэча на Пенаконіі.", de: "Eine unerwartete Begegnung erwartet dich in Penacony.", fr: "Une rencontre inattendue vous attend à Penacony.", zh: "匹诺康尼有一次意外的相遇在等着你。" }, type: 'neutral' },
  { text: { ru: "Пом-Пом приготовила для вас что-то особенное!", en: "Pom-Pom has prepared something special for you!", by: "Пом-Пом падрыхтавала для вас нешта асаблівае!", de: "Pom-Pom hat etwas Besonderes für dich vorbereitet!", fr: "Pom-Pom a préparé quelque chose de spécial pour vous !", zh: "帕姆为你准备了特别的东西！" }, type: 'good' },
  { text: { ru: "Осторожно, Элио предвидит небольшие трудности.", en: "Careful, Elio foresees minor difficulties.", by: "Асцярожна, Эліо прадбачыць невялікія цяжкасці.", de: "Vorsicht, Elio sieht kleinere Schwierigkeiten voraus.", fr: "Attention, Elio prévoit des difficultés mineures.", zh: "小心，艾利欧预见到了小麻烦。" }, type: 'bad' },
  { text: { ru: "Вас обманули. Это не предсказание, а просто текст.", en: "You've been scammed. This is not a fortune, just text.", by: "Вас падманулі. Гэта не прадказанне, а проста тэкст.", de: "Du wurdest betrogen. Das ist keine Vorhersage, nur Text.", fr: "Vous avez été arnaqué. Ce n'est pas une prédiction, juste du texte.", zh: "你被骗了。这不是预言，只是文字。" }, type: 'troll' },
  { text: { ru: "Вы проиграете 50/50. Снова.", en: "You will lose the 50/50. Again.", by: "Вы прайграеце 50/50. Зноў.", de: "Du wirst das 50/50 verlieren. Schon wieder.", fr: "Vous allez perdre le 50/50. Encore.", zh: "你会输掉50/50。又一次。" }, type: 'troll' },
  { text: { ru: "Вам выпадет лега! Но это будет Яньцин.", en: "You'll get a 5-star! But it will be Yanqing.", by: "Вам выпадзе лега! Але гэта будзе Яньцын.", de: "Du bekommst einen 5-Sterne-Charakter! Aber es wird Yanqing sein.", fr: "Vous aurez un 5 étoiles ! Mais ce sera Yanqing.", zh: "你会抽到五星！但会是彦卿。" }, type: 'troll' },
  { text: { ru: "Сегодня вы случайно потратите весь нефрит на стандартный баннер.", en: "Today you will accidentally spend all your jade on the standard banner.", by: "Сёння вы выпадкова выдаткуеце ўвесь нефрыт на стандартны банер.", de: "Heute wirst du versehentlich deine gesamte Jade für das Standard-Banner ausgeben.", fr: "Aujourd'hui, vous dépenserez accidentellement tout votre jade sur la bannière standard.", zh: "今天你会不小心把所有星琼花在常驻池上。" }, type: 'troll' },
  { text: { ru: "Звезды говорят: иди потрогай траву.", en: "The stars say: go touch some grass.", by: "Зоркі кажуць: ідзі пакратай траву.", de: "Die Sterne sagen: Geh nach draußen und fass Gras an.", fr: "Les étoiles disent : va toucher de l'herbe.", zh: "群星说：去摸摸草吧。" }, type: 'troll' }
];

export const DailyFortune: React.FC<DailyFortuneProps> = ({ lang }) => {
  const [fortuneIndex, setFortuneIndex] = useState<number | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);

  const t = translations[lang];

  const revealFortune = () => {
    if (fortuneIndex !== null || isRevealing) return;
    setIsRevealing(true);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * fortunes.length);
      setFortuneIndex(randomIndex);
      setIsRevealing(false);
    }, 1500);
  };

  return (
    <div className="bg-[#15101e] border border-[#3d2b4f] rounded-2xl p-6 relative overflow-hidden group">
      {/* Background decoration */}
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#ff4d4d]/10 rounded-full blur-3xl group-hover:bg-[#ff4d4d]/20 transition-colors duration-700"></div>
      
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="w-12 h-12 bg-[#251c35] rounded-full flex items-center justify-center mb-4 border border-[#3d2b4f] shadow-[0_0_15px_rgba(255,77,77,0.2)]">
          <Ticket className="text-[#ff4d4d]" size={24} />
        </div>
        
        <h3 className="text-lg font-bold text-white mb-2">
          {t.fortuneTitle}
        </h3>
        
        <div className="min-h-[60px] flex items-center justify-center w-full">
          <AnimatePresence mode="wait">
            {fortuneIndex === null && !isRevealing ? (
              <motion.button
                key="btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={revealFortune}
                className="bg-[#ff4d4d] hover:bg-[#ff7a7a] text-[#15101e] px-6 py-2 rounded-full font-bold flex items-center gap-2 transition-colors"
              >
                <Sparkles size={16} />
                {t.fortuneReveal}
              </motion.button>
            ) : isRevealing ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-[#ff4d4d]"
              >
                <Star className="animate-spin" size={20} />
                <span className="animate-pulse tracking-widest text-sm">
                  {t.fortuneReading}
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-white/80 italic"
              >
                "{fortunes[fortuneIndex!].text[lang] || fortunes[fortuneIndex!].text['en']}"
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
