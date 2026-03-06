import React from 'react';
import { motion } from 'motion/react';
import { X, ImagePlus } from 'lucide-react';
import { Language, translations } from '../../data/translations';
import { usePerfLogger } from '../../utils/logger';

interface FeedbackModalProps {
  lang: Language;
  feedbackOpen: boolean;
  setFeedbackOpen: (open: boolean) => void;
  feedbackType: 'bug' | 'suggestion';
  setFeedbackType: (type: 'bug' | 'suggestion') => void;
  feedbackText: string;
  setFeedbackText: (text: string) => void;
  feedbackImage: string | null;
  setFeedbackImage: (image: string | null) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFeedbackSubmit: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  lang,
  feedbackOpen,
  setFeedbackOpen,
  feedbackType,
  setFeedbackType,
  feedbackText,
  setFeedbackText,
  feedbackImage,
  setFeedbackImage,
  handleImageUpload,
  handleFeedbackSubmit
}) => {
  const t = translations[lang];
  const { trackRender } = usePerfLogger('FeedbackModal');
  trackRender();

  if (!feedbackOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setFeedbackOpen(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-[#3E3160] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-[#5C4B8B]"
      >
        <div className="p-6 border-b border-[#5C4B8B] flex justify-between items-center">
          <h3 className="text-xl font-bold text-[#C3A6E6]">{t.feedbackTitle || "Feedback"}</h3>
          <button 
            onClick={() => setFeedbackOpen(false)}
            className="p-2 hover:bg-[#5C4B8B] rounded-full transition-colors text-gray-400"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t.feedbackType || "Type"}</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-gray-200 cursor-pointer">
                <input type="radio" checked={feedbackType === 'bug'} onChange={() => setFeedbackType('bug')} className="accent-[#C3A6E6]" />
                {t.bug || "Bug"}
              </label>
              <label className="flex items-center gap-2 text-gray-200 cursor-pointer">
                <input type="radio" checked={feedbackType === 'suggestion'} onChange={() => setFeedbackType('suggestion')} className="accent-[#C3A6E6]" />
                {t.suggestion || "Suggestion"}
              </label>
            </div>
          </div>
          <div>
            <textarea 
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder={t.feedbackPlaceholder || "Describe..."}
              className="w-full h-32 bg-[#2F244F] border border-[#5C4B8B] rounded-xl p-3 text-gray-200 focus:outline-none focus:border-[#C3A6E6] resize-none"
            />
          </div>
          <div>
            <input 
              type="file" 
              id="feedback-image" 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageUpload}
            />
            <label 
              htmlFor="feedback-image"
              className="flex items-center justify-center gap-2 w-full p-3 border border-dashed border-[#5C4B8B] rounded-xl text-gray-400 hover:text-[#C3A6E6] hover:border-[#C3A6E6] transition-colors cursor-pointer bg-[#2F244F]/50 text-center text-sm"
            >
              <ImagePlus size={20} className="shrink-0" />
              <span className="truncate">{feedbackImage ? (t.imageAttached || "Image attached") : (t.attachImage || "Attach Image")}</span>
            </label>
            {feedbackImage && (
              <div className="mt-2 relative rounded-lg overflow-hidden border border-[#5C4B8B] inline-block">
                <img src={feedbackImage} alt="Attachment preview" className="h-20 object-cover" />
                <button 
                  onClick={() => setFeedbackImage(null)}
                  className="absolute top-1 right-1 bg-black/50 rounded-full p-1 hover:bg-red-500/80 transition-colors"
                >
                  <X size={12} className="text-white" />
                </button>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              {t.imageNote || "Note: Images cannot be sent directly via email client link. Please attach the image manually in your email client."}
            </p>
          </div>
        </div>
        <div className="p-6 border-t border-[#5C4B8B] bg-[#2F244F] flex justify-end gap-3">
          <button 
            onClick={() => setFeedbackOpen(false)}
            className="px-4 py-2 rounded-lg text-gray-300 hover:bg-[#3E3160] transition-colors"
          >
            {t.cancel || "Cancel"}
          </button>
          <button 
            onClick={handleFeedbackSubmit}
            disabled={!feedbackText.trim()}
            className="px-4 py-2 rounded-lg bg-[#C3A6E6] text-[#2F244F] font-bold hover:bg-[#B094EB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t.submit || "Send"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
