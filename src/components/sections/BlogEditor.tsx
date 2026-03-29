import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Save, Languages, Loader2 } from 'lucide-react';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { translateContent } from '../../services/geminiService';

interface BlogEditorProps {
  post?: any;
  onClose: () => void;
}

const LANGUAGES = ['ru', 'en', 'by', 'jp', 'de', 'fr', 'zh'];

export const BlogEditor: React.FC<BlogEditorProps> = ({ post, onClose }) => {
  const { user } = useAuth();
  const [currentLang, setCurrentLang] = useState('ru');
  const [category, setCategory] = useState(post?.category || 'updates');
  
  const [title, setTitle] = useState<Record<string, string>>(
    typeof post?.title === 'object' ? post.title : LANGUAGES.reduce((acc, lang) => ({ ...acc, [lang]: post?.title || '' }), {})
  );
  const [summary, setSummary] = useState<Record<string, string>>(
    typeof post?.summary === 'object' ? post.summary : LANGUAGES.reduce((acc, lang) => ({ ...acc, [lang]: post?.summary || '' }), {})
  );
  const [content, setContent] = useState<Record<string, string>>(
    typeof post?.content === 'object' ? post.content : LANGUAGES.reduce((acc, lang) => ({ ...acc, [lang]: post?.content || '' }), {})
  );
  
  const [isSaving, setIsSaving] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslate = async () => {
    if (!title[currentLang] && !summary[currentLang] && !content[currentLang]) return;
    setIsTranslating(true);
    try {
      const [translatedTitle, translatedSummary, translatedContent] = await Promise.all([
        title[currentLang] ? translateContent(title[currentLang]) : Promise.resolve(title),
        summary[currentLang] ? translateContent(summary[currentLang]) : Promise.resolve(summary),
        content[currentLang] ? translateContent(content[currentLang]) : Promise.resolve(content)
      ]);

      setTitle(prev => ({ ...prev, ...translatedTitle, [currentLang]: prev[currentLang] }));
      setSummary(prev => ({ ...prev, ...translatedSummary, [currentLang]: prev[currentLang] }));
      setContent(prev => ({ ...prev, ...translatedContent, [currentLang]: prev[currentLang] }));
      alert('Translation complete!');
    } catch (error) {
      alert('Translation failed. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSave = async () => {
    if (!title[currentLang] || !summary[currentLang] || !content[currentLang]) {
      alert(`Please fill in all fields for ${currentLang}`);
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

      if (post?.id) {
        await setDoc(doc(db, 'blogPosts', post.id), {
          ...postData,
          createdAt: post.createdAt
        });
      } else {
        await addDoc(collection(db, 'blogPosts'), {
          ...postData,
          createdAt: new Date().toISOString()
        });
      }
      onClose();
    } catch (error) {
      handleFirestoreError(error, post?.id ? OperationType.UPDATE : OperationType.CREATE, 'blogPosts');
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
          <h2 className="text-2xl font-bold text-white">{post ? 'Edit Post' : 'Create Post'}</h2>
          <div className="flex items-center gap-4">
            <select 
              value={currentLang}
              onChange={(e) => setCurrentLang(e.target.value)}
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
            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#1A1528] border border-[#5C4B8B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C3A6E6]"
            >
              <option value="updates">Updates</option>
              <option value="personal">Personal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Title ({currentLang.toUpperCase()})</label>
            <input 
              type="text"
              value={title[currentLang] || ''}
              onChange={(e) => setTitle(prev => ({ ...prev, [currentLang]: e.target.value }))}
              className="w-full bg-[#1A1528] border border-[#5C4B8B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C3A6E6]"
              placeholder="Post title..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Summary ({currentLang.toUpperCase()})</label>
            <textarea 
              value={summary[currentLang] || ''}
              onChange={(e) => setSummary(prev => ({ ...prev, [currentLang]: e.target.value }))}
              className="w-full bg-[#1A1528] border border-[#5C4B8B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C3A6E6] min-h-[100px]"
              placeholder="Brief summary..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Content ({currentLang.toUpperCase()}) (HTML allowed)</label>
            <textarea 
              value={content[currentLang] || ''}
              onChange={(e) => setContent(prev => ({ ...prev, [currentLang]: e.target.value }))}
              className="w-full bg-[#1A1528] border border-[#5C4B8B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C3A6E6] min-h-[300px] font-mono text-sm"
              placeholder="<p>Full post content...</p>"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-[#2F244F] z-10 flex justify-between items-center p-6 border-t border-[#5C4B8B]">
          <button 
            onClick={handleTranslate}
            disabled={isTranslating}
            className="flex items-center gap-2 bg-[#1A1528] text-[#C3A6E6] border border-[#C3A6E6] px-4 py-2 rounded-xl font-bold hover:bg-[#C3A6E6] hover:text-[#2F244F] transition-colors disabled:opacity-50"
          >
            {isTranslating ? <Loader2 size={20} className="animate-spin" /> : <Languages size={20} />}
            {isTranslating ? 'Translating...' : `Auto-Translate from ${currentLang.toUpperCase()}`}
          </button>
          <div className="flex gap-4">
            <button 
              onClick={onClose}
              className="px-6 py-2 rounded-xl font-bold text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 bg-[#C3A6E6] text-[#2F244F] px-6 py-2 rounded-xl font-bold hover:bg-white transition-colors disabled:opacity-50"
            >
              <Save size={20} />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
