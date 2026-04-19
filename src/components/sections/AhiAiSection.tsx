import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ChevronRight, Lock, Trash2 } from 'lucide-react';
import { sdk } from '../../sdk';
import { Language, translations } from '../../data/translations';
import { useAuth } from '../../hooks/useAuth';

export const AhiAiSection: React.FC<{ lang: Language }> = ({ lang }) => {
  const [history, setHistory] = useState<{ type: 'cmd' | 'res' | 'info', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user, loginWithGoogle } = useAuth();
  const t = translations[lang];

  const initialHistory = [
    { type: 'info' as const, text: (t as any).sdkAhaRadioAI || t.sdkTitle },
    { type: 'info' as const, text: (t as any).sdkAskMe || t.sdkDesc }
  ];

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`ai_history_${user.uid}`);
      if (saved) {
        try {
          setHistory(JSON.parse(saved));
        } catch (e) {
          setHistory(initialHistory);
        }
      } else {
        setHistory(initialHistory);
      }
    } else {
      setHistory(initialHistory);
    }
  }, [user, lang]);

  useEffect(() => {
    if (user && history.length > 0) {
      localStorage.setItem(`ai_history_${user.uid}`, JSON.stringify(history));
    }
  }, [history, user]);

  const clearHistory = () => {
    setHistory(initialHistory);
    if (user) {
      localStorage.removeItem(`ai_history_${user.uid}`);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const cmd = input.trim();
    setHistory(prev => [...prev, { type: 'cmd', text: cmd }]);
    setInput('');
    setIsProcessing(true);

    try {
      let response;
      if (cmd.startsWith('/')) {
        sdk.terminal.setMode('normal');
        response = await sdk.terminal.execute(cmd.substring(1), lang);
      } else {
        sdk.terminal.setMode('ai');
        response = await sdk.terminal.execute(cmd, lang);
      }
      
      if (response === 'CLEAR_TERMINAL') {
        setHistory([]);
      } else {
        setHistory(prev => [...prev, { type: 'res', text: response }]);
      }
    } catch (error) {
      setHistory(prev => [...prev, { type: 'res', text: `Ошибка: ${error instanceof Error ? error.message : String(error)}` }]);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center p-12 text-center space-y-6 bg-[#251c35] rounded-2xl border border-[#3d2b4f] shadow-2xl min-h-[50vh]"
      >
        <div className="w-20 h-20 bg-[#ff4d4d]/10 rounded-full flex items-center justify-center border border-[#ff4d4d]/20">
          <Lock className="w-10 h-10 text-[#ff4d4d]" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">
            {t.sdkAuthRequiredMsg || (t as any).sdkAuthRequired}
          </h3>
          <p className="text-gray-400">
            {(t as any).sdkAuthDesc || t.sdkAuthRequiredMsg}
          </p>
        </div>
        <button
          onClick={loginWithGoogle}
          className="bg-white text-[#15101e] px-8 py-4 rounded-xl font-black uppercase tracking-wider hover:bg-white/90 transition-colors shadow-xl hover:shadow-white/20 active:scale-95"
        >
          {t.maintenanceLoginGoogle}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#251c35] rounded-3xl border border-[#3d2b4f] shadow-2xl flex flex-col overflow-hidden h-[calc(100vh-14rem)] min-h-[600px] w-full"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#3d2b4f]/50 bg-[#15101e]/50">
        <div className="flex items-center gap-3">
          <Sparkles className="text-[#ff4d4d]" />
          <h2 className="text-xl font-bold text-white">{(t as any).sdkAhaRadio || t.siteName} AI</h2>
        </div>
        <button
          onClick={clearHistory}
          className="p-2 hover:bg-[#ff4d4d]/20 hover:text-[#ff4d4d] text-gray-400 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <Trash2 size={16} />
          <span className="hidden sm:inline">{t.sdkClearHistory}</span>
        </button>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-[#3d2b4f] scrollbar-track-transparent bg-[#15101e]/30"
      >
        {history.map((item, i) => (
          <div key={i} className={`flex flex-col ${item.type === 'cmd' ? 'items-end' : 'items-start'}`}>
            {item.type === 'cmd' && (
              <div className="bg-[#ff4d4d] text-[#15101e] px-5 py-3 rounded-2xl rounded-tr-sm max-w-[85%] text-sm md:text-base font-medium shadow-lg">
                {item.text}
              </div>
            )}
            {item.type === 'res' && (
              <div className="bg-[#15101e] border border-[#3d2b4f] text-gray-200 px-5 py-4 rounded-2xl rounded-tl-sm max-w-[90%] text-sm md:text-base whitespace-pre-wrap shadow-xl">
                {item.text}
              </div>
            )}
            {item.type === 'info' && (
              <div className="text-blue-400/80 italic text-sm self-center bg-blue-500/10 px-4 py-1.5 rounded-full my-2 border border-blue-500/20">
                {item.text}
              </div>
            )}
          </div>
        ))}
        {isProcessing && (
          <div className="flex items-start">
            <div className="bg-[#15101e] border border-[#3d2b4f] text-[#ff4d4d] px-5 py-4 rounded-2xl rounded-tl-sm flex items-center gap-3 shadow-xl">
              <Sparkles size={18} className="animate-pulse" />
              {t.radioThinking || (t as any).sdkThinking}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleExecute} className="p-4 border-t border-[#3d2b4f]/50 bg-[#15101e]/80">
        <div className="flex items-center gap-3 bg-[#15101e] border-2 border-[#3d2b4f] rounded-xl p-2 focus-within:border-[#ff4d4d] transition-colors shadow-inner">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.sdkAskAi || (t as any).sdkAskAI}
            className="flex-1 min-w-0 bg-transparent border-none outline-none px-3 py-2 text-base text-white placeholder-gray-500"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="shrink-0 p-3 bg-[#ff4d4d] text-[#15101e] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(255,77,77,0.3)] disabled:hover:scale-100 disabled:shadow-none"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </form>
    </motion.div>
  );
};
