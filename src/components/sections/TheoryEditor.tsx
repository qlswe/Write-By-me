import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Save } from 'lucide-react';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';

interface TheoryEditorProps {
  theory?: any;
  onClose: () => void;
}

export const TheoryEditor: React.FC<TheoryEditorProps> = ({ theory, onClose }) => {
  const { user } = useAuth();
  const [category, setCategory] = useState(theory?.category || 'lore');
  const [title, setTitle] = useState(theory?.title?.en || '');
  const [summary, setSummary] = useState(theory?.summary?.en || '');
  const [content, setContent] = useState(theory?.content?.en || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!title || !summary || !content) {
      alert('Please fill in all fields');
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
          createdAt: theory.createdAt
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#2F244F] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-[#5C4B8B] shadow-2xl"
      >
        <div className="sticky top-0 bg-[#2F244F] z-10 flex justify-between items-center p-6 border-b border-[#5C4B8B]">
          <h2 className="text-2xl font-bold text-white">{theory ? 'Edit Theory' : 'Create Theory'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#1A1528] border border-[#5C4B8B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C3A6E6]"
            >
              <option value="lore">Lore</option>
              <option value="characters">Characters</option>
              <option value="gameplay">Gameplay</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#1A1528] border border-[#5C4B8B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C3A6E6]"
              placeholder="Theory title..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Summary</label>
            <textarea 
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full bg-[#1A1528] border border-[#5C4B8B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C3A6E6] min-h-[100px]"
              placeholder="Brief summary..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Content (HTML allowed)</label>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-[#1A1528] border border-[#5C4B8B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C3A6E6] min-h-[300px] font-mono text-sm"
              placeholder="<p>Full theory content...</p>"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-[#2F244F] z-10 flex justify-end gap-4 p-6 border-t border-[#5C4B8B]">
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
      </motion.div>
    </div>
  );
};
