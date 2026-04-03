import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Save } from 'lucide-react';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { translations, Language } from '../../data/translations';

interface TheoryEditorProps {
  theory?: any;
  onClose: () => void;
  lang: Language;
}

const LANGUAGES = ['ru', 'en', 'by', 'jp', 'de', 'fr', 'zh'];

export const TheoryEditor: React.FC<TheoryEditorProps> = ({ theory, onClose, lang }) => {
  const { user } = useAuth();
  const t = translations[lang];
  const [currentLang, setCurrentLang] = useState(lang);
  const [category, setCategory] = useState(theory?.category || 'lore');
  
  const [title, setTitle] = useState<Record<string, string>>(
    typeof theory?.title === 'object' ? theory.title : LANGUAGES.reduce((acc, l) => ({ ...acc, [l]: theory?.title || '' }), {})
  );
  const [summary, setSummary] = useState<Record<string, string>>(
    typeof theory?.summary === 'object' ? theory.summary : LANGUAGES.reduce((acc, l) => ({ ...acc, [l]: theory?.summary || '' }), {})
  );
  const [content, setContent] = useState<Record<string, string>>(
    typeof theory?.content === 'object' ? theory.content : LANGUAGES.reduce((acc, l) => ({ ...acc, [l]: theory?.content || '' }), {})
  );
  
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!title[currentLang] || !summary[currentLang] || !content[currentLang]) {
      alert(`${t.fillAllFields}${currentLang}`);
      return;
    }

    setIsSaving(true);
    try {
      const theoryData = {
        category,
        title,
        summary,
        content,
        authorUid: user?.uid,
        updatedAt: new Date().toISOString()
      };

      if (theory?.id) {
        await setDoc(doc(db, 'theories', theory.id), {
          ...theoryData,
          createdAt: theory.createdAt || new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'theories'), {
          ...theoryData,
          createdAt: new Date().toISOString()
        });
      }
      onClose();
    } catch (error) {
      handleFirestoreError(error, theory?.id ? OperationType.UPDATE : OperationType.CREATE, 'theories');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-[#1a142e]/90 rounded-3xl w-full max-w-4xl max-h-[95vh] overflow-hidden border border-[#C3A6E6]/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col backdrop-blur-xl"
      >
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-[#C3A6E6]/10 bg-[#2F244F]/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#C3A6E6]/10 rounded-xl">
              <Save size={20} className="text-[#C3A6E6]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">{theory ? t.editTheory : t.createTheory}</h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <select 
              value={currentLang}
              onChange={(e) => setCurrentLang(e.target.value as Language)}
              className="bg-[#1A1528] border border-[#5C4B8B]/50 rounded-xl px-3 py-1.5 text-white text-xs sm:text-sm focus:outline-none focus:border-[#C3A6E6] transition-all"
            >
              {LANGUAGES.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
            </select>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-[#C3A6E6] uppercase tracking-widest ml-1">{t.categoryLabel}</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#1A1528]/50 border border-[#5C4B8B]/50 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-[#C3A6E6] focus:bg-[#1A1528] transition-all"
              >
                <option value="lore">{t.filterLore}</option>
                <option value="characters">{t.filterCharacters}</option>
                <option value="gameplay">{t.filterGameplay}</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-[#C3A6E6] uppercase tracking-widest ml-1">{t.titleLabel} ({currentLang.toUpperCase()})</label>
              <input 
                type="text"
                value={title[currentLang] || ''}
                onChange={(e) => setTitle(prev => ({ ...prev, [currentLang]: e.target.value }))}
                className="w-full bg-[#1A1528]/50 border border-[#5C4B8B]/50 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-[#C3A6E6] focus:bg-[#1A1528] transition-all"
                placeholder={t.placeholderTitle}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-[#C3A6E6] uppercase tracking-widest ml-1">{t.summaryLabel} ({currentLang.toUpperCase()})</label>
            <textarea 
              value={summary[currentLang] || ''}
              onChange={(e) => setSummary(prev => ({ ...prev, [currentLang]: e.target.value }))}
              className="w-full bg-[#1A1528]/50 border border-[#5C4B8B]/50 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-[#C3A6E6] focus:bg-[#1A1528] transition-all min-h-[80px] resize-none"
              placeholder={t.placeholderSummary}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-[#C3A6E6] uppercase tracking-widest ml-1">{t.contentLabel} ({currentLang.toUpperCase()})</label>
            <div className="relative group">
              <textarea 
                value={content[currentLang] || ''}
                onChange={(e) => setContent(prev => ({ ...prev, [currentLang]: e.target.value }))}
                className="w-full bg-[#1A1528]/50 border border-[#5C4B8B]/50 rounded-2xl px-4 py-4 text-white focus:outline-none focus:border-[#C3A6E6] focus:bg-[#1A1528] transition-all min-h-[350px] font-mono text-sm leading-relaxed"
                placeholder={t.placeholderContent}
              />
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span className="text-[10px] text-[#C3A6E6]/50 font-mono">HTML ALLOWED</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-[#C3A6E6]/10 bg-[#2F244F]/50 flex justify-end items-center gap-4">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            {t.cancel}
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-3 bg-[#C3A6E6] text-[#2F244F] px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-lg shadow-[#C3A6E6]/20"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-[#2F244F]/30 border-t-[#2F244F] rounded-full animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {isSaving ? t.saving : t.saveBtn}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
