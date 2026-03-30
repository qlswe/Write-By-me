import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Bug, Send, X, CheckCircle2 } from 'lucide-react';
import { sdk } from '../index';
import { Language, translations } from '../../data/translations';

interface SDKReportUIProps {
  lang: Language;
}

export const SDKReportUI: React.FC<SDKReportUIProps> = ({ lang }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<'bug' | 'feedback'>('feedback');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const t = translations[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;

    setIsSending(true);
    const success = await sdk.reporting.sendReport(type, { message });
    setIsSending(false);

    if (success) {
      setIsSuccess(true);
      setMessage('');
      setTimeout(() => {
        setIsSuccess(false);
        setIsOpen(false);
      }, 2000);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-[#C3A6E6] text-[#2F244F] rounded-full shadow-2xl border-2 border-white/20 hover:bg-white transition-colors"
      >
        <MessageSquare size={20} />
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-[#3E3160] rounded-3xl border border-[#5C4B8B] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-[#5C4B8B]/30 flex items-center justify-between bg-[#2F244F]/50">
                <h3 className="text-xl font-bold text-[#C3A6E6] flex items-center gap-2">
                  <MessageSquare size={20} />
                  {t.feedbackTitle}
                </h3>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setType('feedback')}
                    className={`flex-1 p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                      type === 'feedback' 
                        ? 'bg-[#C3A6E6]/20 border-[#C3A6E6] text-[#C3A6E6]' 
                        : 'bg-[#2F244F]/50 border-[#5C4B8B]/30 text-gray-400 hover:border-[#C3A6E6]/30'
                    }`}
                  >
                    <MessageSquare size={24} />
                    <span className="text-xs font-bold uppercase tracking-wider">{t.suggestion}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('bug')}
                    className={`flex-1 p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                      type === 'bug' 
                        ? 'bg-red-500/20 border-red-500 text-red-400' 
                        : 'bg-[#2F244F]/50 border-[#5C4B8B]/30 text-gray-400 hover:border-red-500/30'
                    }`}
                  >
                    <Bug size={24} />
                    <span className="text-xs font-bold uppercase tracking-wider">{t.bug}</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                    {t.feedbackPlaceholder}
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full h-32 bg-[#2F244F]/50 border border-[#5C4B8B]/30 rounded-2xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#C3A6E6]/50 transition-colors resize-none"
                    placeholder="..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSending || !message.trim() || isSuccess}
                  className={`w-full py-4 rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                    isSuccess 
                      ? 'bg-green-500 text-white' 
                      : 'bg-[#C3A6E6] text-[#2F244F] hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {isSuccess ? (
                    <>
                      <CheckCircle2 size={20} />
                      {t.feedbackSuccess}
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      {isSending ? t.saving : t.submit}
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
