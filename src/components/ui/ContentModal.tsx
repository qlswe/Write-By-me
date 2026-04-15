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
        className="absolute inset-0 bg-black/80"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-[#251c35] w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-[#3d2b4f]"
      >
        <div className="p-6 border-b border-[#3d2b4f] flex justify-between items-center bg-[#15101e]">
          <h3 className="text-2xl font-bold text-[#ff4d4d] pr-8">{modalContent.title}</h3>
          <button 
            onClick={() => setModalContent(null)}
            className="p-2 hover:bg-[#3d2b4f] rounded-full transition-colors text-white/60 shrink-0"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div 
            className="prose prose-invert prose-p:text-white/80 prose-headings:text-white prose-a:text-[#ff4d4d] max-w-none"
            dangerouslySetInnerHTML={{ __html: modalContent.content }}
          />
        </div>
      </motion.div>
    </div>
  );
};
