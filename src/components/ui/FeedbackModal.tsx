import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ImagePlus, Bug, Lightbulb } from 'lucide-react';
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
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setFeedbackOpen(false)}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-[#251c35] w-full max-w-md rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col border border-[#3d2b4f]"
        >
          <div className="p-6 border-b border-[#3d2b4f] bg-[#15101e] flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#ff4d4d]/10 rounded-xl">
                <Bug size={24} className="text-[#ff4d4d]" />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">{t.feedbackTitle || "Feedback"}</h3>
            </div>
            <button 
              onClick={() => setFeedbackOpen(false)}
              className="p-2 hover:bg-[#3d2b4f] rounded-xl transition-colors text-white/60 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6 flex flex-col gap-6">
            <div>
              <label className="block text-xs font-bold tracking-widest uppercase text-white/40 mb-3">{t.feedbackType || "Type"}</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFeedbackType('bug')}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all flex-1 ${
                    feedbackType === 'bug' 
                      ? 'bg-[#ff4d4d]/10 border-[#ff4d4d] text-white shadow-[0_0_15px_rgba(255,77,77,0.15)]' 
                      : 'bg-[#15101e] border-[#3d2b4f] text-white/50 hover:border-[#ff4d4d]/50 hover:text-white'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${feedbackType === 'bug' ? 'border-[#ff4d4d]' : 'border-white/30'}`}>
                    {feedbackType === 'bug' && <span className="w-2 h-2 rounded-full bg-[#ff4d4d]" />}
                  </div>
                  <span className="text-sm font-bold flex items-center gap-2">
                    <Bug size={14} className={feedbackType === 'bug' ? 'text-[#ff4d4d]' : 'text-white/40'} />
                    {t.bug || "Bug"}
                  </span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFeedbackType('suggestion')}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all flex-1 ${
                    feedbackType === 'suggestion' 
                      ? 'bg-[#8b5cf6]/10 border-[#8b5cf6] text-white shadow-[0_0_15px_rgba(139,92,246,0.15)]' 
                      : 'bg-[#15101e] border-[#3d2b4f] text-white/50 hover:border-[#8b5cf6]/50 hover:text-white'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${feedbackType === 'suggestion' ? 'border-[#8b5cf6]' : 'border-white/30'}`}>
                    {feedbackType === 'suggestion' && <span className="w-2 h-2 rounded-full bg-[#8b5cf6]" />}
                  </div>
                  <span className="text-sm font-bold flex items-center gap-2">
                    <Lightbulb size={14} className={feedbackType === 'suggestion' ? 'text-[#8b5cf6]' : 'text-white/40'} />
                    {t.suggestion || "Suggestion"}
                  </span>
                </button>
              </div>
            </div>
            
            <div>
              <textarea 
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder={t.feedbackPlaceholder || "Describe..."}
                className={`w-full h-32 bg-[#15101e] border rounded-2xl p-4 text-white/90 text-sm focus:outline-none transition-colors resize-none ${
                  feedbackType === 'bug' ? 'border-[#3d2b4f] focus:border-[#ff4d4d]' : 'border-[#3d2b4f] focus:border-[#8b5cf6]'
                }`}
              />
            </div>
            
            {/* Custom File Upload Input */}
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
                className={`flex items-center justify-center gap-2 w-full p-4 border border-dashed rounded-xl text-white/60 transition-all cursor-pointer font-bold text-sm bg-[#15101e]/80 ${
                  feedbackImage 
                    ? (feedbackType === 'bug' ? 'border-[#ff4d4d]/50 text-[#ff4d4d] bg-[#ff4d4d]/5' : 'border-[#8b5cf6]/50 text-[#8b5cf6] bg-[#8b5cf6]/5')
                    : 'border-[#3d2b4f] hover:text-white hover:border-gray-400'
                }`}
              >
                <ImagePlus size={18} className="shrink-0" />
                <span className="truncate uppercase tracking-wide text-xs">
                  {feedbackImage ? (t.imageAttached || "Image attached") : (t.attachImage || "Attach Screenshot/Image")}
                </span>
              </label>
              
              {feedbackImage && (
                <div className="mt-3 relative rounded-xl overflow-hidden border border-[#3d2b4f] inline-block shadow-lg">
                  <img src={feedbackImage} alt="Attachment preview" className="h-24 w-auto object-cover" />
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      setFeedbackImage(null);
                    }}
                    className="absolute top-1 right-1 bg-black/60 rounded-lg p-1 hover:bg-red-500 transition-colors backdrop-blur-sm"
                  >
                    <X size={14} className="text-white" />
                  </button>
                </div>
              )}
              
              <div className="mt-4 p-3 bg-[#15101e] rounded-xl border border-[#3d2b4f] flex gap-2">
                <Bug size={14} className="text-gray-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                  {t.imageNote || "Note: Images cannot be sent directly via email client link automatically. Please manually attach your screenshot after the email client opens."}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-[#3d2b4f] bg-[#15101e] flex gap-3">
            <button 
              onClick={() => setFeedbackOpen(false)}
              className="flex-1 py-3 rounded-xl text-xs font-bold text-white/50 uppercase tracking-widest hover:bg-[#251c35] hover:text-white transition-colors"
            >
              {t.cancel || "Cancel"}
            </button>
            <button 
              onClick={handleFeedbackSubmit}
              disabled={!feedbackText.trim()}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                feedbackType === 'bug'
                  ? 'bg-[#ff4d4d] text-[#15101e] hover:bg-white'
                  : 'bg-[#8b5cf6] text-white hover:bg-white hover:text-[#15101e]'
              }`}
            >
              {t.submit || "Send Report"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
