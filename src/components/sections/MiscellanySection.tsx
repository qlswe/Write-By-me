import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Search, ArrowLeft, Share2, Check, Plus, Edit, BookOpen, Sparkles, User, Clock } from 'lucide-react';
import { miscellanyData } from '../../data/content';
import { Language, translations } from '../../data/translations';
import { usePerfLogger } from '../../utils/logger';
import { CommentsSection } from './CommentsSection';
import { MiscellanyCard } from './MiscellanyCard';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { useAuth } from '../../hooks/useAuth';
import { sdk } from '../../sdk';

interface MiscellanySectionProps {
  lang: Language;
  miscellanyCategory: string;
  setMiscellanyCategory: (cat: string) => void;
  miscellanySearch: string;
  setMiscellanySearch: (search: string) => void;
  favorites: string[];
  toggleFavorite: (id: string, e: React.MouseEvent) => void;
  lowPerfMode?: boolean;
  miscellanies?: any[];
  onEdit?: (item: any) => void;
  onCreate?: () => void;
  role?: 'admin' | 'moderator' | 'user';
}

export const MiscellanySection: React.FC<MiscellanySectionProps> = ({
  lang,
  miscellanyCategory,
  setMiscellanyCategory,
  miscellanySearch,
  setMiscellanySearch,
  favorites,
  toggleFavorite,
  lowPerfMode,
  miscellanies = miscellanyData,
  onEdit,
  onCreate,
  role
}) => {
  const t = translations[lang];
  const { trackRender } = usePerfLogger('MiscellanySection');
  const [selectedMiscellanyId, setSelectedMiscellanyId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const isAdmin = role === 'admin';
  const isModerator = role === 'admin' || role === 'moderator';
  trackRender();

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteDoc(doc(db, 'miscellanies', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `miscellanies/${id}`);
      }
    }
  };

  const handleShare = useCallback((id: string, title: string, summary: string) => {
    const url = `${window.location.origin}${window.location.pathname}?miscellany=${id}`;
    if (navigator.share) {
      navigator.share({
        title: title,
        text: summary,
        url: url,
      }).catch((err) => {
        if (err.name !== 'AbortError') {
          copyToClipboard(url);
        }
      });
    } else {
      copyToClipboard(url);
    }
  }, []);

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const filteredMiscellanies = useMemo(() => {
    return miscellanies.filter(item => {
      const matchesCat = miscellanyCategory === 'all' || 
                         (miscellanyCategory === 'favorites' ? favorites.includes(item.id) : item.category === miscellanyCategory);
      const search = miscellanySearch.toLowerCase();
      const matchesSearch = (item.title[lang] || item.title['en']).toLowerCase().includes(search) || 
                             (item.summary[lang] || item.summary['en']).toLowerCase().includes(search);
      return matchesCat && matchesSearch;
    });
  }, [miscellanyCategory, miscellanySearch, lang, favorites, miscellanies]);

  const selectedMiscellany = useMemo(() => {
    return selectedMiscellanyId ? miscellanies.find(t => t.id === selectedMiscellanyId) : null;
  }, [selectedMiscellanyId, miscellanies]);

  const handleMiscellanyClick = useCallback((id: string) => {
    setSelectedMiscellanyId(id);
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
  }, [selectedMiscellanyId, lang]);

  return (
    <div className="relative min-h-[600px]">
      <AnimatePresence mode="wait">
        {selectedMiscellany ? (
          <motion.div 
            key="miscellany-detail"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="bg-[#3E3160]/90 backdrop-blur-md rounded-3xl p-6 sm:p-10 shadow-2xl border border-[#5C4B8B] relative overflow-hidden"
          >
            {/* Background Decorative Element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#C3A6E6]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
            
            <button 
              onClick={() => setSelectedMiscellanyId(null)}
              className="group flex items-center gap-3 text-[#C3A6E6] hover:text-white transition-all mb-8 font-black uppercase tracking-tighter"
            >
              <div className="p-2 rounded-full bg-[#5C4B8B]/30 group-hover:bg-[#C3A6E6] group-hover:text-[#2F244F] transition-all">
                <ArrowLeft size={16} />
              </div>
              {t.navMiscellany}
            </button>
            
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-10">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 rounded-full bg-[#C3A6E6]/20 text-[#C3A6E6] text-xs font-black uppercase tracking-widest border border-[#C3A6E6]/30">
                    {selectedMiscellany.category}
                  </span>
                  <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                    <Clock size={12} />
                    {sdk.data.formatDate(selectedMiscellany.createdAt, lang)}
                  </div>
                </div>
                <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tighter">
                  {selectedMiscellany.title[lang] || selectedMiscellany.title['en']}
                </h2>
              </div>
              
              <div className="flex flex-wrap gap-3 shrink-0 justify-end">
                {isModerator && (
                  <button 
                    onClick={() => onEdit?.(selectedMiscellany)}
                    className="p-4 rounded-2xl bg-[#5C4B8B]/30 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 transition-all border border-transparent hover:border-blue-400/30"
                    title={t.editBtn}
                  >
                    <Edit size={18} />
                  </button>
                )}
                <button 
                  onClick={() => handleShare(
                    selectedMiscellany.id, 
                    selectedMiscellany.title[lang] || selectedMiscellany.title['en'], 
                    selectedMiscellany.summary[lang] || selectedMiscellany.summary['en']
                  )}
                  className={`p-4 rounded-2xl bg-[#5C4B8B]/30 transition-all border border-transparent ${copied ? 'text-green-400 border-green-400/30 bg-green-400/10' : 'text-gray-400 hover:text-[#C3A6E6] hover:border-[#C3A6E6]/30 hover:bg-[#C3A6E6]/10'}`}
                  title="Share"
                >
                  {copied ? <Check size={18} /> : <Share2 size={18} />}
                </button>
                <button 
                  onClick={(e) => toggleFavorite(selectedMiscellany.id, e)}
                  className={`p-4 rounded-2xl bg-[#5C4B8B]/30 transition-all border border-transparent ${favorites.includes(selectedMiscellany.id) ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' : 'text-gray-400 hover:text-yellow-400 hover:border-yellow-400/30 hover:bg-yellow-400/10'}`}
                >
                  <Star size={18} fill={favorites.includes(selectedMiscellany.id) ? "currentColor" : "none"} />
                </button>
              </div>
            </div>

            <div 
              ref={contentRef}
              className="prose prose-invert prose-p:text-gray-300 prose-headings:text-white prose-a:text-[#C3A6E6] max-w-none mb-12 text-base sm:text-lg leading-relaxed"
              dangerouslySetInnerHTML={{ __html: selectedMiscellany.content[lang] || selectedMiscellany.content['en'] }}
            />

            <div className="pt-10 border-t border-[#5C4B8B]">
              <CommentsSection targetId={selectedMiscellany.id} lang={lang} lowPerfMode={lowPerfMode} role={role} />
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="miscellany-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-[#3E3160]/90 backdrop-blur-md rounded-3xl p-6 sm:p-10 shadow-2xl border border-[#5C4B8B]"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
              <div>
                <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tighter uppercase mb-2 flex items-center gap-4">
                  <BookOpen className="text-[#C3A6E6]" size={32} />
                  {t.navMiscellany}
                </h2>
                <p className="text-[#C3A6E6]/60 font-medium tracking-wide uppercase text-xs">
                  {t.miscellanySubTitle}
                </p>
              </div>
              {isModerator && (
                <button 
                  onClick={onCreate}
                  className="flex items-center gap-3 bg-[#C3A6E6] text-[#2F244F] px-6 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#C3A6E6]/20"
                >
                  <Plus size={20} />
                  {t.createMiscellany}
                </button>
              )}
            </div>
            
            <div className="flex flex-col lg:flex-row gap-6 mb-10">
              <div className="flex gap-2 p-1.5 bg-[#2F244F]/50 rounded-2xl border border-[#5C4B8B] overflow-x-auto no-scrollbar ml-6">
                {['all', 'lore', 'characters', 'gameplay', 'favorites'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setMiscellanyCategory(cat)}
                    className={`px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                      miscellanyCategory === cat 
                        ? 'bg-[#C3A6E6] text-[#2F244F] shadow-lg shadow-[#C3A6E6]/20' 
                        : 'text-gray-400 hover:text-white hover:bg-[#5C4B8B]/30'
                    }`}
                  >
                    {cat === 'all' ? t.filterAll : 
                     cat === 'lore' ? t.filterLore : 
                     cat === 'characters' ? t.filterCharacters : 
                     cat === 'gameplay' ? t.filterGameplay : t.filterFavorites}
                  </button>
                ))}
              </div>
              <div className="relative flex-1">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#C3A6E6]/50" size={22} />
                <input 
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={miscellanySearch}
                  onChange={(e) => setMiscellanySearch(e.target.value)}
                  className="w-full bg-[#2F244F]/50 border border-[#5C4B8B] rounded-2xl pl-14 pr-6 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#C3A6E6] focus:ring-4 focus:ring-[#C3A6E6]/10 transition-all"
                />
              </div>
            </div>

            {filteredMiscellanies.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-24 text-gray-400 bg-[#2F244F]/30 rounded-3xl border-2 border-dashed border-[#5C4B8B]/50 flex flex-col items-center gap-4"
              >
                <Sparkles size={48} className="text-[#5C4B8B]" />
                <p className="text-xl font-bold uppercase tracking-widest">{t.noResults}</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredMiscellanies.map((item, index) => (
                  <MiscellanyCard
                    key={item.id}
                    item={item}
                    index={index}
                    lang={lang}
                    isFavorite={favorites.includes(item.id)}
                    onClick={() => handleMiscellanyClick(item.id)}
                    onToggleFavorite={(e) => handleToggleFavorite(item.id, e)}
                    onEdit={(e) => { e.stopPropagation(); onEdit?.(item); }}
                    onDelete={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
