import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Languages } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Language, translations } from '../../data/translations';

interface AdminTheoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  theoryToEdit?: any; // If provided, we are editing
}

export const AdminTheoryModal: React.FC<AdminTheoryModalProps> = ({ isOpen, onClose, lang, theoryToEdit }) => {
  const t = translations[lang];
  
  const [titleRu, setTitleRu] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [summaryRu, setSummaryRu] = useState('');
  const [summaryEn, setSummaryEn] = useState('');
  const [contentRu, setContentRu] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [category, setCategory] = useState('lore');
  const [author, setAuthor] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (theoryToEdit) {
      setTitleRu(theoryToEdit.title?.ru || '');
      setTitleEn(theoryToEdit.title?.en || '');
      setSummaryRu(theoryToEdit.summary?.ru || '');
      setSummaryEn(theoryToEdit.summary?.en || '');
      setContentRu(theoryToEdit.content?.ru || '');
      setContentEn(theoryToEdit.content?.en || '');
      setCategory(theoryToEdit.category || 'lore');
      setAuthor(theoryToEdit.author || '');
    } else {
      setTitleRu('');
      setTitleEn('');
      setSummaryRu('');
      setSummaryEn('');
      setContentRu('');
      setContentEn('');
      setCategory('lore');
      setAuthor('');
    }
  }, [theoryToEdit, isOpen]);

  const handleTranslate = async () => {
    if (!titleRu && !summaryRu && !contentRu) return;
    
    setIsTranslating(true);
    try {
      const { translatePostFields } = await import('../../services/translationService');
      const result = await translatePostFields(titleRu, summaryRu, contentRu, ['en']);
      
      if (result.title?.en) setTitleEn(result.title.en);
      if (result.summary?.en) setSummaryEn(result.summary.en);
      if (result.content?.en) setContentEn(result.content.en);
      
    } catch (error) {
      console.error("Translation error:", error);
      alert("Failed to translate text.");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSave = async () => {
    if (!titleRu || !contentRu) return;
    
    setIsSaving(true);
    try {
      const theoryId = theoryToEdit?.id || `theory_${Date.now()}`;
      const theoryData = {
        id: theoryId,
        title: { ru: titleRu, en: titleEn || titleRu },
        summary: { ru: summaryRu, en: summaryEn || summaryRu },
        content: { ru: contentRu, en: contentEn || contentRu },
        category,
        author: author || 'Admin',
        createdAt: theoryToEdit?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'theories', theoryId), theoryData);
      onClose();
    } catch (error) {
      console.error("Error saving theory:", error);
      alert("Failed to save theory");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#15101e] border border-[#3d2b4f] rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-[#3d2b4f] bg-[#251c35] shrink-0">
            <h3 className="text-xl font-bold text-white">
              {theoryToEdit ? 'Редактировать запись' : 'Создать запись'}
            </h3>
            <button onClick={onClose} className="p-2 text-white/60 hover:text-white rounded-full hover:bg-[#3d2b4f] transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-6">
            <div className="flex justify-end mb-2">
              <button
                onClick={handleTranslate}
                disabled={isTranslating || (!titleRu && !summaryRu && !contentRu)}
                className="flex items-center gap-2 bg-[#3d2b4f] text-white px-3 py-1.5 rounded-lg text-sm hover:bg-[#ff4d4d] hover:text-[#1A1230] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Languages size={16} />
                {isTranslating ? 'Перевод...' : 'Перевести на English (AI)'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-[#ff4d4d] font-bold border-b border-[#3d2b4f] pb-2">Russian (RU)</h4>
                
                <div>
                  <label className="block text-sm text-white/60 mb-1">Заголовок</label>
                  <input 
                    type="text" 
                    value={titleRu} 
                    onChange={e => setTitleRu(e.target.value)}
                    className="w-full bg-[#1A1230] border border-[#3d2b4f] rounded-lg p-2 text-white focus:outline-none focus:border-[#ff4d4d]"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-white/60 mb-1">Краткое описание</label>
                  <textarea 
                    value={summaryRu} 
                    onChange={e => setSummaryRu(e.target.value)}
                    className="w-full bg-[#1A1230] border border-[#3d2b4f] rounded-lg p-2 text-white focus:outline-none focus:border-[#ff4d4d] h-24 resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-white/60 mb-1">Контент (HTML поддерживается)</label>
                  <textarea 
                    value={contentRu} 
                    onChange={e => setContentRu(e.target.value)}
                    className="w-full bg-[#1A1230] border border-[#3d2b4f] rounded-lg p-2 text-white focus:outline-none focus:border-[#ff4d4d] h-64 font-mono text-sm"
                    placeholder="<p>Текст...</p>"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[#ff4d4d] font-bold border-b border-[#3d2b4f] pb-2">English (EN)</h4>
                
                <div>
                  <label className="block text-sm text-white/60 mb-1">Title</label>
                  <input 
                    type="text" 
                    value={titleEn} 
                    onChange={e => setTitleEn(e.target.value)}
                    className="w-full bg-[#1A1230] border border-[#3d2b4f] rounded-lg p-2 text-white focus:outline-none focus:border-[#ff4d4d]"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-white/60 mb-1">Summary</label>
                  <textarea 
                    value={summaryEn} 
                    onChange={e => setSummaryEn(e.target.value)}
                    className="w-full bg-[#1A1230] border border-[#3d2b4f] rounded-lg p-2 text-white focus:outline-none focus:border-[#ff4d4d] h-24 resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-white/60 mb-1">Content (HTML supported)</label>
                  <textarea 
                    value={contentEn} 
                    onChange={e => setContentEn(e.target.value)}
                    className="w-full bg-[#1A1230] border border-[#3d2b4f] rounded-lg p-2 text-white focus:outline-none focus:border-[#ff4d4d] h-64 font-mono text-sm"
                    placeholder="<p>Text...</p>"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#3d2b4f]">
              <div>
                <label className="block text-sm text-white/60 mb-1">Категория</label>
                <select 
                  value={category} 
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-[#1A1230] border border-[#3d2b4f] rounded-lg p-2 text-white focus:outline-none focus:border-[#ff4d4d]"
                >
                  <option value="lore">Lore</option>
                  <option value="characters">Characters</option>
                  <option value="world">World</option>
                  <option value="mechanics">Mechanics</option>
                  <option value="updates">Updates</option>
                  <option value="personal">Personal</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-white/60 mb-1">Автор</label>
                <input 
                  type="text" 
                  value={author} 
                  onChange={e => setAuthor(e.target.value)}
                  className="w-full bg-[#1A1230] border border-[#3d2b4f] rounded-lg p-2 text-white focus:outline-none focus:border-[#ff4d4d]"
                  placeholder="Имя автора"
                />
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-[#3d2b4f] bg-[#251c35] shrink-0 flex justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-white/80 hover:text-white hover:bg-[#3d2b4f] transition-colors"
            >
              Отмена
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving || !titleRu || !contentRu}
              className="px-4 py-2 rounded-lg bg-[#ff4d4d] text-[#1A1230] font-bold hover:bg-white transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
