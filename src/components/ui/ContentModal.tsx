import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { usePerfLogger } from '../../utils/logger';
import { Language } from '../../data/translations';

interface ContentModalProps {
  modalContent: { id?: string; title: string; content: string } | null;
  setModalContent: (content: { id?: string; title: string; content: string } | null) => void;
  lang: Language;
}

export const ContentModal: React.FC<ContentModalProps> = ({ modalContent, setModalContent, lang }) => {
  const { trackRender } = usePerfLogger('ContentModal');
  trackRender();

  if (!modalContent) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setModalContent(null)}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-[#3E3160] w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-[#5C4B8B]"
      >
        <div className="p-6 border-b border-[#5C4B8B] flex justify-between items-center bg-[#2F244F]">
          <h3 className="text-2xl font-bold text-[#C3A6E6] pr-8">{modalContent.title}</h3>
          <button 
            onClick={() => setModalContent(null)}
            className="p-2 hover:bg-[#5C4B8B] rounded-full transition-colors text-gray-400 shrink-0"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div 
            className="prose prose-invert prose-p:text-gray-300 prose-headings:text-white prose-a:text-[#C3A6E6] max-w-none"
            dangerouslySetInnerHTML={{ __html: modalContent.content }}
          />
        </div>
      </motion.div>
    </div>
  );
};
