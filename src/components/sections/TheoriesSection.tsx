import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Search, ArrowLeft, Share2, Check, Plus, Edit, BookOpen, Sparkles, User, Clock } from 'lucide-react';
import { theoriesData } from '../../data/content';
import { Language, translations } from '../../data/translations';
import { usePerfLogger } from '../../utils/logger';
import { CommentsSection } from './CommentsSection';
import { TheoryCard } from './TheoryCard';
import { ReactionsBar } from '../ui/ReactionsBar';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { useAuth } from '../../hooks/useAuth';
import { sdk } from '../../sdk';

import { ConfirmModal } from '../ui/ConfirmModal';

interface TheoriesSectionProps {
  lang: Language;
  theoryCategory: string;
  setTheoryCategory: (cat: string) => void;
  theorySearch: string;
  setTheorySearch: (search: string) => void;
  favorites: string[];
  toggleFavorite: (id: string, e: React.MouseEvent) => void;
  lowPerfMode?: boolean;
  theories?: any[];
  onEdit?: (theory: any) => void;
  onCreate?: () => void;
  onOpenChat?: (uid: string, name: string) => void;
  role?: 'admin' | 'moderator' | 'user';
}

export const TheoriesSection: React.FC<TheoriesSectionProps> = ({
  lang,
  theoryCategory,
  setTheoryCategory,
  theorySearch,
  setTheorySearch,
  favorites,
  toggleFavorite,
  lowPerfMode,
  theories = theoriesData,
  onEdit,
  onCreate,
  onOpenChat,
  role
}) => {
  const t = translations[lang];
  const { trackRender } = usePerfLogger('TheoriesSection');
  const [selectedTheoryId, setSelectedTheoryId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [theoryToDelete, setTheoryToDelete] = useState<string | null>(null);
  const { user } = useAuth();
  const isAdmin = role === 'admin';
  const isModerator = role === 'admin' || role === 'moderator';
  trackRender();

  const handleDelete = async () => {
    if (!theoryToDelete) return;
    try {
      await deleteDoc(doc(db, 'theories', theoryToDelete));
      setTheoryToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `theories/${theoryToDelete}`);
    }
  };

  const handleShare = useCallback((id: string, title: string, summary: string) => {
    const url = `${window.location.origin}${window.location.pathname}?theory=${id}`;
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

  const filteredTheories = useMemo(() => {
    return theories.filter(theory => {
      const matchesCat = theoryCategory === 'all' || 
                         (theoryCategory === 'favorites' ? favorites.includes(theory.id) : theory.category === theoryCategory);
      const search = theorySearch.toLowerCase();
      const matchesSearch = (theory.title[lang] || theory.title['en']).toLowerCase().includes(search) || 
                             (theory.summary[lang] || theory.summary['en']).toLowerCase().includes(search);
      return matchesCat && matchesSearch;
    });
  }, [theoryCategory, theorySearch, lang, favorites, theories]);

  const selectedTheory = useMemo(() => {
    return selectedTheoryId ? theories.find(t => t.id === selectedTheoryId) : null;
  }, [selectedTheoryId, theories]);

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

  return (
    <div className="relative min-h-[600px]">
      <AnimatePresence mode="wait">
        {selectedTheory ? (
          <motion.div 
            key="theory-detail"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="bg-[#3E3160] rounded-3xl p-6 sm:p-10 shadow-2xl border border-[#5C4B8B] relative overflow-hidden"
          >
            {/* Background Decorative Element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#C3A6E6]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
            
            <button 
              onClick={() => setSelectedTheoryId(null)}
              className="group flex items-center gap-3 text-[#C3A6E6] hover:text-white transition-all mb-8 font-black uppercase tracking-tighter"
            >
              <div className="p-2 rounded-full bg-[#5C4B8B]/30 group-hover:bg-[#C3A6E6] group-hover:text-[#2F244F] transition-all">
                <ArrowLeft size={16} />
              </div>
              {t.navTheories}
            </button>
            
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-10">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 rounded-full bg-[#C3A6E6]/20 text-[#C3A6E6] text-xs font-black uppercase tracking-widest border border-[#C3A6E6]/30">
                    {selectedTheory.category}
                  </span>
                  <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                    <Clock size={12} />
                    {sdk.data.formatDate(selectedTheory.createdAt, lang)}
                  </div>
                </div>
                <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tighter">
                  {selectedTheory.title[lang] || selectedTheory.title['en']}
                </h2>
              </div>
              
              <div className="flex flex-wrap gap-3 shrink-0 justify-end">
                {isModerator && (
                  <button 
                    onClick={() => onEdit?.(selectedTheory)}
                    className="p-4 rounded-2xl bg-[#5C4B8B]/30 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 transition-all border border-transparent hover:border-blue-400/30"
                    title={t.editBtn}
                  >
                    <Edit size={18} />
                  </button>
                )}
                <button 
                  onClick={() => handleShare(
                    selectedTheory.id, 
                    selectedTheory.title[lang] || selectedTheory.title['en'], 
                    selectedTheory.summary[lang] || selectedTheory.summary['en']
                  )}
                  className={`p-4 rounded-2xl bg-[#5C4B8B]/30 transition-all border border-transparent ${copied ? 'text-green-400 border-green-400/30 bg-green-400/10' : 'text-gray-400 hover:text-[#C3A6E6] hover:border-[#C3A6E6]/30 hover:bg-[#C3A6E6]/10'}`}
                  title="Share"
                >
                  {copied ? <Check size={18} /> : <Share2 size={18} />}
                </button>
                <button 
                  onClick={(e) => toggleFavorite(selectedTheory.id, e)}
                  className={`p-4 rounded-2xl bg-[#5C4B8B]/30 transition-all border border-transparent ${favorites.includes(selectedTheory.id) ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' : 'text-gray-400 hover:text-yellow-400 hover:border-yellow-400/30 hover:bg-yellow-400/10'}`}
                >
                  <Star size={18} fill={favorites.includes(selectedTheory.id) ? "currentColor" : "none"} />
                </button>
              </div>
            </div>

            <div 
              ref={contentRef}
              className="prose prose-invert prose-p:text-gray-300 prose-headings:text-white prose-a:text-[#C3A6E6] max-w-none mb-8 text-base sm:text-lg leading-relaxed"
              dangerouslySetInnerHTML={{ __html: selectedTheory.content[lang] || selectedTheory.content['en'] }}
            />

            <div className="mb-12">
              <ReactionsBar targetId={selectedTheory.id} lang={lang} />
            </div>

            <div className="pt-10 border-t border-[#5C4B8B]">
              <CommentsSection targetId={selectedTheory.id} lang={lang} lowPerfMode={lowPerfMode} role={role} onOpenChat={onOpenChat} />
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="theory-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-[#3E3160] rounded-3xl p-6 sm:p-10 shadow-2xl border border-[#5C4B8B]"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
              <div>
                <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tighter uppercase mb-2 flex items-center gap-4">
                  <BookOpen className="text-[#C3A6E6]" size={32} />
                  {t.navTheories}
                </h2>
                <p className="text-[#C3A6E6]/60 font-medium tracking-wide uppercase text-xs">
                  {t.theoriesSubTitle}
                </p>
              </div>
              {isModerator && (
                <button 
                  onClick={onCreate}
                  className="flex items-center gap-3 bg-[#C3A6E6] text-[#2F244F] px-6 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#C3A6E6]/20"
                >
                  <Plus size={20} />
                  {t.createTheory}
                </button>
              )}
            </div>
            
            <div className="flex flex-col lg:flex-row gap-6 mb-10">
              <div className="flex gap-2 p-1.5 bg-[#2F244F]/50 rounded-2xl border border-[#5C4B8B] overflow-x-auto no-scrollbar ml-6">
                {['all', 'lore', 'characters', 'gameplay', 'favorites'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setTheoryCategory(cat)}
                    className={`px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                      theoryCategory === cat 
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
                  value={theorySearch}
                  onChange={(e) => setTheorySearch(e.target.value)}
                  className="w-full bg-[#2F244F]/50 border border-[#5C4B8B] rounded-2xl pl-14 pr-6 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#C3A6E6] focus:ring-4 focus:ring-[#C3A6E6]/10 transition-all"
                />
              </div>
            </div>

            {filteredTheories.length === 0 ? (
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
                {filteredTheories.map((theory, index) => (
                  <TheoryCard
                    key={theory.id}
                    theory={theory}
                    index={index}
                    lang={lang}
                    isFavorite={favorites.includes(theory.id)}
                    onClick={() => handleTheoryClick(theory.id)}
                    onToggleFavorite={(e) => handleToggleFavorite(theory.id, e)}
                    onEdit={(e) => { e.stopPropagation(); onEdit?.(theory); }}
                    onDelete={(e) => { e.stopPropagation(); setTheoryToDelete(theory.id); }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!theoryToDelete}
        onClose={() => setTheoryToDelete(null)}
        onConfirm={handleDelete}
        title={t.confirmDeletePostTitle || "Delete Theory"}
        message={t.confirmDeletePostMessage || "Are you sure you want to delete this theory? This action cannot be undone."}
        confirmText={t.delete || "Delete"}
        cancelText={t.cancelBtn || "Cancel"}
        isDestructive={true}
      />
    </div>
  );
};
