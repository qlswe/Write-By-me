import React from 'react';
import { Language, translations } from '../../data/translations';
import { usePerfLogger } from '../../utils/logger';

interface TierListSectionProps {
  lang: Language;
}

export const TierListSection: React.FC<TierListSectionProps> = ({ lang }) => {
  const t = translations[lang];
  const { trackRender } = usePerfLogger('TierListSection');
  trackRender();

  return (
    <div className="bg-[#3E3160]/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-[#5C4B8B]">
      <h2 className="text-3xl font-bold text-[#C3A6E6] mb-6">{t.navTierList}</h2>
      <p className="text-gray-300 mb-8">
        {lang === 'ru' ? 'Актуальный тир-лист персонажей для версии 4.0. Оценки основаны на эффективности в Чистом Вымысле, Зале Забвения и Иллюзии Конца.' : 
         lang === 'en' ? 'Current character tier list for version 4.0. Ratings are based on performance in Pure Fiction, Memory of Chaos, and Apocalyptic Shadow.' :
         lang === 'by' ? 'Актуальны тыр-ліст персанажаў для версіі 4.0. Ацэнкі заснаваныя на эфектыўнасці ў Чыстым Вымысле, Зале Забыцця і Ілюзіі Канцы.' :
         lang === 'jp' ? 'バージョン4.0の最新キャラクターティアリスト。評価は虚構叙事、忘却の庭、末日の幻影でのパフォーマンスに基づいています。' :
         lang === 'de' ? 'Aktuelle Charakter-Tier-Liste für Version 4.0. Die Bewertungen basieren auf der Leistung in Pure Fiction, Memory of Chaos und Apocalyptic Shadow.' :
         lang === 'fr' ? 'Tier list actuelle des personnages pour la version 4.0. Les évaluations sont basées sur les performances dans Pure Fiction, Memory of Chaos et Apocalyptic Shadow.' :
         '4.0版本最新角色节奏榜。评分基于虚构叙事、忘却之庭和末日幻影中的表现。'}
      </p>
      
      <div className="space-y-12">
        {/* DD (Damage Dealers) */}
        <div>
          <h3 className="text-2xl font-bold text-white mb-6 border-b border-[#5C4B8B] pb-2">
            {lang === 'ru' ? 'ДД (Урон)' : 'DD (Damage)'}
          </h3>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-24 h-24 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-3xl font-bold text-red-400">S+</span>
              </div>
              <div className="flex-1 bg-[#2F244F]/50 rounded-xl p-4 flex flex-wrap gap-3 items-center border border-[#5C4B8B]/50">
                {['Ахерон', 'Светлячок', 'Фэйсяо', 'Юньли', 'Бутхилл'].map(char => (
                  <span key={char} className="px-3 py-1.5 bg-[#3E3160] border border-[#5C4B8B] rounded-lg text-sm font-medium text-white shadow-sm">{char}</span>
                ))}
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-24 h-24 bg-orange-500/20 border border-orange-500/50 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-3xl font-bold text-orange-400">S</span>
              </div>
              <div className="flex-1 bg-[#2F244F]/50 rounded-xl p-4 flex flex-wrap gap-3 items-center border border-[#5C4B8B]/50">
                {['Цзинлю', 'Дань Хэн: ПЛ', 'Кафка', 'Черный Лебедь', 'Рацио', 'Зеле', 'Цзин Юань', 'Аргенти', 'Блэйд', 'Клара'].map(char => (
                  <span key={char} className="px-3 py-1.5 bg-[#3E3160] border border-[#5C4B8B] rounded-lg text-sm font-medium text-white shadow-sm">{char}</span>
                ))}
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-24 h-24 bg-yellow-500/20 border border-yellow-500/50 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-3xl font-bold text-yellow-400">A</span>
              </div>
              <div className="flex-1 bg-[#2F244F]/50 rounded-xl p-4 flex flex-wrap gap-3 items-center border border-[#5C4B8B]/50">
                {['Топаз', 'Химеко', 'Герта', 'Сюэи', 'Миша', 'Цинцюэ'].map(char => (
                  <span key={char} className="px-3 py-1.5 bg-[#3E3160] border border-[#5C4B8B] rounded-lg text-sm font-medium text-white shadow-sm">{char}</span>
                ))}
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-24 h-24 bg-blue-500/20 border border-blue-500/50 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-3xl font-bold text-blue-400">B</span>
              </div>
              <div className="flex-1 bg-[#2F244F]/50 rounded-xl p-4 flex flex-wrap gap-3 items-center border border-[#5C4B8B]/50">
                {['Яньцин', 'Сушан', 'Дань Хэн', 'Хук', 'Арлан', 'Физ. Первопроходец'].map(char => (
                  <span key={char} className="px-3 py-1.5 bg-[#3E3160] border border-[#5C4B8B] rounded-lg text-sm font-medium text-white shadow-sm">{char}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Amplifiers */}
        <div>
          <h3 className="text-2xl font-bold text-white mb-6 border-b border-[#5C4B8B] pb-2">
            {lang === 'ru' ? 'Амплификаторы (Поддержка)' : 'Amplifiers (Support)'}
          </h3>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-24 h-24 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-3xl font-bold text-red-400">S+</span>
              </div>
              <div className="flex-1 bg-[#2F244F]/50 rounded-xl p-4 flex flex-wrap gap-3 items-center border border-[#5C4B8B]/50">
                {['Жуань Мэй', 'Искорка', 'Зарянка', 'Цзяоцю', 'Серебряный Волк', 'Тинъюнь'].map(char => (
                  <span key={char} className="px-3 py-1.5 bg-[#3E3160] border border-[#5C4B8B] rounded-lg text-sm font-medium text-white shadow-sm">{char}</span>
                ))}
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-24 h-24 bg-orange-500/20 border border-orange-500/50 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-3xl font-bold text-orange-400">S</span>
              </div>
              <div className="flex-1 bg-[#2F244F]/50 rounded-xl p-4 flex flex-wrap gap-3 items-center border border-[#5C4B8B]/50">
                {['Броня', 'Пела', 'Гуйнайфэнь', 'Аста', 'Ханья', 'Юйкун'].map(char => (
                  <span key={char} className="px-3 py-1.5 bg-[#3E3160] border border-[#5C4B8B] rounded-lg text-sm font-medium text-white shadow-sm">{char}</span>
                ))}
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-24 h-24 bg-yellow-500/20 border border-yellow-500/50 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-3xl font-bold text-yellow-400">A</span>
              </div>
              <div className="flex-1 bg-[#2F244F]/50 rounded-xl p-4 flex flex-wrap gap-3 items-center border border-[#5C4B8B]/50">
                {['Сампо', 'Лука'].map(char => (
                  <span key={char} className="px-3 py-1.5 bg-[#3E3160] border border-[#5C4B8B] rounded-lg text-sm font-medium text-white shadow-sm">{char}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sustain */}
        <div>
          <h3 className="text-2xl font-bold text-white mb-6 border-b border-[#5C4B8B] pb-2">
            {lang === 'ru' ? 'Сустейн (Выживаемость)' : 'Sustain (Survival)'}
          </h3>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-24 h-24 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-3xl font-bold text-red-400">S+</span>
              </div>
              <div className="flex-1 bg-[#2F244F]/50 rounded-xl p-4 flex flex-wrap gap-3 items-center border border-[#5C4B8B]/50">
                {['Авантюрин', 'Хохо', 'Фу Сюань', 'Линша', 'Галлахер'].map(char => (
                  <span key={char} className="px-3 py-1.5 bg-[#3E3160] border border-[#5C4B8B] rounded-lg text-sm font-medium text-white shadow-sm">{char}</span>
                ))}
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-24 h-24 bg-orange-500/20 border border-orange-500/50 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-3xl font-bold text-orange-400">S</span>
              </div>
              <div className="flex-1 bg-[#2F244F]/50 rounded-xl p-4 flex flex-wrap gap-3 items-center border border-[#5C4B8B]/50">
                {['Лоча', 'Гепард', 'Байлу'].map(char => (
                  <span key={char} className="px-3 py-1.5 bg-[#3E3160] border border-[#5C4B8B] rounded-lg text-sm font-medium text-white shadow-sm">{char}</span>
                ))}
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-24 h-24 bg-yellow-500/20 border border-yellow-500/50 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-3xl font-bold text-yellow-400">A</span>
              </div>
              <div className="flex-1 bg-[#2F244F]/50 rounded-xl p-4 flex flex-wrap gap-3 items-center border border-[#5C4B8B]/50">
                {['Рысь', 'Март 7', 'Наташа', 'Огненный Первопроходец'].map(char => (
                  <span key={char} className="px-3 py-1.5 bg-[#3E3160] border border-[#5C4B8B] rounded-lg text-sm font-medium text-white shadow-sm">{char}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
