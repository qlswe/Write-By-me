import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Save } from 'lucide-react';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { translations, Language } from '../../data/translations';

interface MiscellanyEditorProps {
  item?: any;
  onClose: () => void;
  lang: Language;
}

const LANGUAGES = ['ru', 'en', 'by', 'jp', 'de', 'fr', 'zh'];

export const MiscellanyEditor: React.FC<MiscellanyEditorProps> = ({ item, onClose, lang }) => {
  const { user } = useAuth();
  const t = translations[lang];
  const [currentLang, setCurrentLang] = useState(lang);
  const [category, setCategory] = useState(item?.category || 'lore');
  
  const [title, setTitle] = useState<Record<string, string>>(
    typeof item?.title === 'object' ? item.title : LANGUAGES.reduce((acc, l) => ({ ...acc, [l]: item?.title || '' }), {})
  );
  const [summary, setSummary] = useState<Record<string, string>>(
    typeof item?.summary === 'object' ? item.summary : LANGUAGES.reduce((acc, l) => ({ ...acc, [l]: item?.summary || '' }), {})
  );
  const [content, setContent] = useState<Record<string, string>>(
    typeof item?.content === 'object' ? item.content : LANGUAGES.reduce((acc, l) => ({ ...acc, [l]: item?.content || '' }), {})
  );
  
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!title[currentLang] || !summary[currentLang] || !content[currentLang]) {
      alert(`${t.fillAllFields}${currentLang}`);
      return;
    }

    setIsSaving(true);
    try {
      const itemData = {
        category,
        title,
        summary,
        content,
        authorUid: user?.uid,
        updatedAt: new Date().toISOString()
      };

      if (item?.id) {
        await setDoc(doc(db, 'miscellanies', item.id), {
          ...itemData,
          createdAt: item.createdAt || new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'miscellanies'), {
          ...itemData,
          createdAt: new Date().toISOString()
        });
      }
      onClose();
    } catch (error) {
      handleFirestoreError(error, item?.id ? OperationType.UPDATE : OperationType.CREATE, 'miscellanies');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#2F244F] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-[#5C4B8B] shadow-2xl flex flex-col"
      >
        <div className="sticky top-0 bg-[#2F244F] z-10 flex justify-between items-center p-6 border-b border-[#5C4B8B]">
          <h2 className="text-2xl font-bold text-white">{item ? t.editMiscellany : t.createMiscellany}</h2>
          <div className="flex items-center gap-4">
            <select 
              value={currentLang}
              onChange={(e) => setCurrentLang(e.target.value as Language)}
              className="bg-[#1A1528] border border-[#5C4B8B] rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#C3A6E6]"
            >
              {LANGUAGES.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
            </select>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t.categoryLabel}</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#1A1528] border border-[#5C4B8B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C3A6E6]"
            >
              <option value="lore">{t.filterLore}</option>
              <option value="characters">{t.filterCharacters}</option>
              <option value="gameplay">{t.filterGameplay}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t.titleLabel} ({currentLang.toUpperCase()})</label>
            <input 
              type="text"
              value={title[currentLang] || ''}
              onChange={(e) => setTitle(prev => ({ ...prev, [currentLang]: e.target.value }))}
              className="w-full bg-[#1A1528] border border-[#5C4B8B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C3A6E6]"
              placeholder={t.placeholderTitle}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t.summaryLabel} ({currentLang.toUpperCase()})</label>
            <textarea 
              value={summary[currentLang] || ''}
              onChange={(e) => setSummary(prev => ({ ...prev, [currentLang]: e.target.value }))}
              className="w-full bg-[#1A1528] border border-[#5C4B8B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C3A6E6] min-h-[100px]"
              placeholder={t.placeholderSummary}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t.contentLabel} ({currentLang.toUpperCase()}) (HTML allowed)</label>
            <textarea 
              value={content[currentLang] || ''}
              onChange={(e) => setContent(prev => ({ ...prev, [currentLang]: e.target.value }))}
              className="w-full bg-[#1A1528] border border-[#5C4B8B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C3A6E6] min-h-[300px] font-mono text-sm"
              placeholder={t.placeholderContent}
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-[#2F244F] z-10 flex justify-end items-center p-6 border-t border-[#5C4B8B]">
          <div className="flex gap-4">
            <button 
              onClick={onClose}
              className="px-6 py-2 rounded-xl font-bold text-gray-300 hover:text-white transition-colors"
            >
              {t.cancel}
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 bg-[#C3A6E6] text-[#2F244F] px-6 py-2 rounded-xl font-bold hover:bg-white transition-colors disabled:opacity-50"
            >
              <Save size={20} />
              {isSaving ? t.saving : t.saveBtn}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
