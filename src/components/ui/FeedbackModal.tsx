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
        className="absolute inset-0 bg-black/80"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-[#251c35] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-[#3d2b4f]"
      >
        <div className="p-6 border-b border-[#3d2b4f] flex justify-between items-center">
          <h3 className="text-xl font-bold text-[#ff4d4d]">{t.feedbackTitle || "Feedback"}</h3>
          <button 
            onClick={() => setFeedbackOpen(false)}
            className="p-2 hover:bg-[#3d2b4f] rounded-full transition-colors text-white/60"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">{t.feedbackType || "Type"}</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-white/90 cursor-pointer">
                <input type="radio" checked={feedbackType === 'bug'} onChange={() => setFeedbackType('bug')} className="accent-[#ff4d4d]" />
                {t.bug || "Bug"}
              </label>
              <label className="flex items-center gap-2 text-white/90 cursor-pointer">
                <input type="radio" checked={feedbackType === 'suggestion'} onChange={() => setFeedbackType('suggestion')} className="accent-[#ff4d4d]" />
                {t.suggestion || "Suggestion"}
              </label>
            </div>
          </div>
          <div>
            <textarea 
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder={t.feedbackPlaceholder || "Describe..."}
              className="w-full h-32 bg-[#15101e] border border-[#3d2b4f] rounded-xl p-3 text-white/90 focus:outline-none focus:border-[#ff4d4d] resize-none"
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
              className="flex items-center justify-center gap-2 w-full p-3 border border-dashed border-[#3d2b4f] rounded-xl text-white/60 hover:text-[#ff4d4d] hover:border-[#ff4d4d] transition-colors cursor-pointer bg-[#15101e]/50 text-center text-sm"
            >
              <ImagePlus size={20} className="shrink-0" />
              <span className="truncate">{feedbackImage ? (t.imageAttached || "Image attached") : (t.attachImage || "Attach Image")}</span>
            </label>
            {feedbackImage && (
              <div className="mt-2 relative rounded-lg overflow-hidden border border-[#3d2b4f] inline-block">
                <img src={feedbackImage} alt="Attachment preview" className="h-20 object-cover" />
                <button 
                  onClick={() => setFeedbackImage(null)}
                  className="absolute top-1 right-1 bg-black/50 rounded-full p-1 hover:bg-red-500/80 transition-colors"
                >
                  <X size={12} className="text-white" />
                </button>
              </div>
            )}
            <p className="text-xs text-white/40 mt-2">
              {t.imageNote || "Note: Images cannot be sent directly via email client link. Please attach the image manually in your email client."}
            </p>
          </div>
        </div>
        <div className="p-6 border-t border-[#3d2b4f] bg-[#15101e] flex justify-end gap-3">
          <button 
            onClick={() => setFeedbackOpen(false)}
            className="px-4 py-2 rounded-lg text-white/80 hover:bg-[#251c35] transition-colors"
          >
            {t.cancel || "Cancel"}
          </button>
          <button 
            onClick={handleFeedbackSubmit}
            disabled={!feedbackText.trim()}
            className="px-4 py-2 rounded-lg bg-[#ff4d4d] text-[#15101e] font-bold hover:bg-[#ff7a7a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t.submit || "Send"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
