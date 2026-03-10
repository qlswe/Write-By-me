import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Star, Search, ArrowLeft } from 'lucide-react';
import { theoriesData } from '../../data/content';
import { Language, translations } from '../../data/translations';
import { usePerfLogger } from '../../utils/logger';
import { CommentsSection } from './CommentsSection';
import { TheoryCard } from './TheoryCard';

interface TheoriesSectionProps {
  lang: Language;
  theoryCategory: string;
  setTheoryCategory: (cat: string) => void;
  theorySearch: string;
  setTheorySearch: (search: string) => void;
  favorites: string[];
  toggleFavorite: (id: string, e: React.MouseEvent) => void;
  lowPerfMode?: boolean;
}

export const TheoriesSection: React.FC<TheoriesSectionProps> = ({
  lang,
  theoryCategory,
  setTheoryCategory,
  theorySearch,
  setTheorySearch,
  favorites,
  toggleFavorite,
  lowPerfMode
}) => {
  const t = translations[lang];
  const { trackRender } = usePerfLogger('TheoriesSection');
  const [selectedTheoryId, setSelectedTheoryId] = useState<string | null>(null);
  trackRender();

  const filteredTheories = useMemo(() => {
    return theoriesData.filter(theory => {
      const matchesCat = theoryCategory === 'all' || 
                         (theoryCategory === 'favorites' ? favorites.includes(theory.id) : theory.category === theoryCategory);
      const search = theorySearch.toLowerCase();
      const matchesSearch = (theory.title[lang] || theory.title['en']).toLowerCase().includes(search) || 
                            (theory.summary[lang] || theory.summary['en']).toLowerCase().includes(search);
      return matchesCat && matchesSearch;
    });
  }, [theoryCategory, theorySearch, lang, favorites]);

  const selectedTheory = useMemo(() => {
    return selectedTheoryId ? theoriesData.find(t => t.id === selectedTheoryId) : null;
  }, [selectedTheoryId]);

  const handleTheoryClick = useCallback((id: string) => {
    setSelectedTheoryId(id);
  }, []);

  const handleToggleFavorite = useCallback((id: string, e: React.MouseEvent) => {
    toggleFavorite(id, e);
  }, [toggleFavorite]);

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      const images = contentRef.current.querySelectorAll('img');
      images.forEach(img => {
        if (!img.hasAttribute('loading')) {
          img.setAttribute('loading', 'lazy');
        }
      });
    }
  }, [selectedTheoryId, lang]);

  if (selectedTheory) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="bg-[#3E3160]/90 backdrop-blur-sm rounded-2xl p-4 sm:p-8 shadow-xl border border-[#5C4B8B]"
      >
        <button 
          onClick={() => setSelectedTheoryId(null)}
          className="flex items-center gap-2 text-[#C3A6E6] hover:text-white transition-colors mb-6 font-bold"
        >
          <ArrowLeft size={20} />
          {t.navTheories}
        </button>
        
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white pr-4 sm:pr-8">
            {selectedTheory.title[lang] || selectedTheory.title['en']}
          </h2>
          <button 
            onClick={(e) => toggleFavorite(selectedTheory.id, e)}
            className={`p-2 sm:p-3 rounded-full transition-colors shrink-0 ${favorites.includes(selectedTheory.id) ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10'}`}
          >
            <Star size={24} className="w-5 h-5 sm:w-6 sm:h-6" fill={favorites.includes(selectedTheory.id) ? "currentColor" : "none"} />
          </button>
        </div>

        <div 
          ref={contentRef}
          className="prose prose-invert prose-p:text-gray-300 prose-headings:text-white prose-a:text-[#C3A6E6] max-w-none mb-8 text-sm sm:text-base"
          dangerouslySetInnerHTML={{ __html: selectedTheory.content[lang] || selectedTheory.content['en'] }}
        />

        <CommentsSection targetId={selectedTheory.id} lang={lang} lowPerfMode={lowPerfMode} />
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-[#3E3160]/90 backdrop-blur-sm rounded-2xl p-4 sm:p-8 shadow-xl border border-[#5C4B8B]"
    >
      <h2 className="text-2xl sm:text-3xl font-bold text-[#C3A6E6] mb-6 sm:mb-8">{t.navTheories}</h2>
      
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#C3A6E6]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </div>
          <select 
            value={theoryCategory}
            onChange={(e) => setTheoryCategory(e.target.value)}
            className="appearance-none bg-[#3E3160] border border-[#5C4B8B] rounded-xl pl-12 pr-4 py-3 text-gray-200 focus:outline-none focus:border-[#C3A6E6] cursor-pointer w-full sm:w-auto hover:border-[#C3A6E6] transition-colors"
          >
            <option value="all">{t.filterAll}</option>
            <option value="lore">{t.filterLore}</option>
            <option value="characters">{t.filterCharacters}</option>
            <option value="gameplay">{t.filterGameplay}</option>
            <option value="favorites">{t.filterFavorites}</option>
          </select>
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder={t.searchPlaceholder}
            value={theorySearch}
            onChange={(e) => setTheorySearch(e.target.value)}
            className="w-full bg-[#3E3160] border border-[#5C4B8B] rounded-xl pl-12 pr-4 py-3 text-gray-200 focus:outline-none focus:border-[#C3A6E6]"
          />
        </div>
      </div>

      {filteredTheories.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-[#3E3160]/50 rounded-2xl border border-dashed border-[#5C4B8B]">
          {t.noResults}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTheories.map((theory, index) => (
            <TheoryCard
              key={theory.id}
              theory={theory}
              index={index}
              lang={lang}
              isFavorite={favorites.includes(theory.id)}
              onClick={() => handleTheoryClick(theory.id)}
              onToggleFavorite={(e) => handleToggleFavorite(theory.id, e)}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};
