import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Save } from 'lucide-react';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { translations, Language } from '../../data/translations';
import { vercelFallback } from '../../utils/vercelFallback';

interface BlogEditorProps {
  post?: any;
  onClose: () => void;
  lang: Language;
}

const LANGUAGES = ['ru', 'en', 'by', 'de', 'fr', 'zh'];

export const BlogEditor: React.FC<BlogEditorProps> = ({ post, onClose, lang }) => {
  const { user } = useAuth();
  const t = translations[lang];
  const [currentLang, setCurrentLang] = useState(lang);
  const [category, setCategory] = useState(post?.category || 'updates');
  
  const [title, setTitle] = useState<Record<string, string>>(
    typeof post?.title === 'object' ? post.title : LANGUAGES.reduce((acc, l) => ({ ...acc, [l]: post?.title || '' }), {})
  );
  const [summary, setSummary] = useState<Record<string, string>>(
    typeof post?.summary === 'object' ? post.summary : LANGUAGES.reduce((acc, l) => ({ ...acc, [l]: post?.summary || '' }), {})
  );
  const [content, setContent] = useState<Record<string, string>>(
    typeof post?.content === 'object' ? post.content : LANGUAGES.reduce((acc, l) => ({ ...acc, [l]: post?.content || '' }), {})
  );
  
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!title[currentLang] || !summary[currentLang] || !content[currentLang]) {
      alert(`${t.fillAllFields}${currentLang}`);
      return;
    }

    setIsSaving(true);
    try {
      const postData = {
        category,
        title,
        summary,
        content,
        authorUid: user?.uid,
        updatedAt: new Date().toISOString()
      };

      if (vercelFallback.isAvailable()) {
        const uid = post?.id || Date.now().toString() + '_' + user?.uid;
        const payload = {
            ...postData,
            id: uid,
            createdAt: post?.createdAt || new Date().toISOString()
        };
        await vercelFallback.lpush('blogPosts', JSON.stringify(payload));
      } else {
        if (post?.id) {
          await setDoc(doc(db, 'blogPosts', post.id), {
            ...postData,
            createdAt: post.createdAt || new Date().toISOString()
          });
        } else {
          await addDoc(collection(db, 'blogPosts'), {
            ...postData,
            createdAt: new Date().toISOString()
          });
        }
      }
      onClose();
    } catch (error) {
      handleFirestoreError(error, post?.id ? OperationType.UPDATE : OperationType.CREATE, 'blogPosts');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-[#15101e] rounded-[1.5rem] sm:rounded-[3rem] w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden border border-[#3d2b4f]/30 shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col"
      >
        {/* Header */}
        <div className="bg-[#251c35]/50 p-4 sm:p-8 border-b border-[#3d2b4f]/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
          <div className="flex items-center justify-between w-full sm:w-auto gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#ff4d4d]/10 flex items-center justify-center border border-[#ff4d4d]/20">
                <Save className="text-[#ff4d4d] w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tighter italic leading-none">
                  {post ? t.editPost : t.createPost}
                </h2>
                <p className="text-[8px] sm:text-xs text-white/40 font-bold uppercase tracking-widest mt-1">{t.blogProtocol}</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="sm:hidden w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all active:scale-90 shrink-0"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <div className="flex bg-[#1A1528] rounded-lg sm:rounded-xl p-0.5 sm:p-1 border border-[#3d2b4f]/30 overflow-x-auto no-scrollbar flex-1 sm:flex-none">
              {LANGUAGES.map(l => (
                <button
                  key={l}
                  onClick={() => setCurrentLang(l as Language)}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all shrink-0 flex-1 sm:flex-none ${
                    currentLang === l ? 'bg-[#ff4d4d] text-[#15101e]' : 'text-white/40 hover:text-white'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            <button 
              onClick={onClose} 
              className="hidden sm:flex w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 items-center justify-center text-white/60 hover:text-white transition-all active:scale-90 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-4">{t.categoryLabel}</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#1A1528]/50 border border-[#3d2b4f]/30 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-[#ff4d4d] transition-all appearance-none cursor-pointer"
              >
                <option value="updates">{t.filterUpdates}</option>
                <option value="personal">{t.filterPersonal}</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-4">
                {t.titleLabel} <span className="text-[#ff4d4d]">[{currentLang.toUpperCase()}]</span>
              </label>
              <input 
                type="text"
                value={title[currentLang] || ''}
                onChange={(e) => setTitle(prev => ({ ...prev, [currentLang]: e.target.value }))}
                className="w-full bg-[#1A1528]/50 border border-[#3d2b4f]/30 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-[#ff4d4d] transition-all placeholder:text-white/40"
                placeholder={t.placeholderTitle}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-4">
              {t.summaryLabel} <span className="text-[#ff4d4d]">[{currentLang.toUpperCase()}]</span>
            </label>
            <textarea 
              value={summary[currentLang] || ''}
              onChange={(e) => setSummary(prev => ({ ...prev, [currentLang]: e.target.value }))}
              className="w-full bg-[#1A1528]/50 border border-[#3d2b4f]/30 rounded-3xl px-6 py-4 text-white font-medium focus:outline-none focus:border-[#ff4d4d] transition-all min-h-[100px] resize-none placeholder:text-white/40"
              placeholder={t.placeholderSummary}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-4">
              {t.contentLabel} <span className="text-[#ff4d4d]">[{currentLang.toUpperCase()}]</span>
            </label>
            <div className="relative group">
              <textarea 
                value={content[currentLang] || ''}
                onChange={(e) => setContent(prev => ({ ...prev, [currentLang]: e.target.value }))}
                className="w-full bg-[#1A1528]/50 border border-[#3d2b4f]/30 rounded-[2rem] px-6 py-6 text-white font-mono text-sm leading-relaxed focus:outline-none focus:border-[#ff4d4d] transition-all min-h-[350px] placeholder:text-white/40"
                placeholder={t.placeholderContent}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-8 bg-[#251c35]/50 border-t border-[#3d2b4f]/30 flex flex-col sm:flex-row justify-end items-center gap-4 sm:gap-6 shrink-0">
          <button 
            onClick={onClose}
            className="w-full sm:w-auto text-[10px] sm:text-xs font-black text-white/60 hover:text-white uppercase tracking-[0.2em] transition-colors py-2"
          >
            {t.cancel}
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto flex items-center justify-center gap-2 sm:gap-3 bg-[#ff4d4d] text-[#15101e] px-6 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs hover:bg-white hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-[0_0_30px_rgba(255,77,77,0.3)]"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-[#15101e] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={20} />
            )}
            {isSaving ? t.saving : t.saveBtn}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
