import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Terminal, X, Settings, Cpu, ChevronRight, MessageSquare, Maximize2, Minimize2, Lock, Trash2, ShieldCheck } from 'lucide-react';
import { sdk } from '../sdk';
import { Language, translations } from '../data/translations';
import { useAuth } from '../hooks/useAuth';

interface SDKPanelProps {
  lang: Language;
  productionMode: boolean;
  toggleProductionMode: () => void;
  lowPerfMode: boolean;
  toggleLowPerfMode: () => void;
  showLoadWidget: boolean;
  toggleLoadWidget: () => void;
  mobileMenuOpen: boolean;
}

export const SDKPanel: React.FC<SDKPanelProps> = ({ 
  lang, 
  productionMode, 
  toggleProductionMode,
  lowPerfMode,
  toggleLowPerfMode,
  showLoadWidget,
  toggleLoadWidget,
  mobileMenuOpen
}) => {
  const [activePanel, setActivePanel] = useState<'none' | 'chat' | 'sdk'>('none');
  const [isExpanded, setIsExpanded] = useState(false);
  const [ahaSecurityHidden, setAhaSecurityHidden] = useState(localStorage.getItem('aha_security_hidden') === 'true');
  
  // Terminal/Chat state
  const [history, setHistory] = useState<{ type: 'cmd' | 'res' | 'info', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [localTime, setLocalTime] = useState(new Date().toLocaleTimeString());
  const { user, loginWithGoogle } = useAuth();

  const toggleAhaSecurity = () => {
    const newValue = !ahaSecurityHidden;
    setAhaSecurityHidden(newValue);
    if (newValue) {
      localStorage.setItem('aha_security_hidden', 'true');
    } else {
      localStorage.removeItem('aha_security_hidden');
    }
    window.location.reload();
  };

  const initialHistory = [
    { type: 'info' as const, text: (translations[lang] as any).sdkAhaRadioAI || translations[lang].sdkTitle },
    { type: 'info' as const, text: (translations[lang] as any).sdkAskMe || translations[lang].sdkDesc }
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
    const timer = setInterval(() => {
      setLocalTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, activePanel]);

  useEffect(() => {
    if (activePanel === 'chat' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activePanel]);

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

  return (
    <>
      {/* Floating Buttons */}
      <AnimatePresence>
        {!mobileMenuOpen && (
          <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4">
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setActivePanel(activePanel === 'sdk' ? 'none' : 'sdk')}
              className={`p-4 rounded-full shadow-2xl border transition-all duration-500 ${
                activePanel === 'sdk' ? 'bg-[#ff4d4d] text-[#15101e] border-white scale-110' : 
                'bg-[#15101e] text-gray-400 border-[#3d2b4f] hover:text-white'
              }`}
              title={translations[lang].sdkSettings}
            >
              <Settings size={24} />
            </motion.button>
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setActivePanel(activePanel === 'chat' ? 'none' : 'chat')}
              className={`p-4 rounded-full shadow-2xl border transition-all duration-500 ${
                activePanel === 'chat' ? 'bg-[#ff4d4d] text-[#15101e] border-white scale-110' : 
                productionMode ? 'bg-[#ff4d4d] text-[#15101e] border-white' : 
                'bg-[#15101e] text-[#ff4d4d] border-[#ff4d4d]/50'
              }`}
              title={translations[lang].sdkMinistryPanel}
            >
              <Sparkles size={24} />
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      {/* Expandable Panel */}
      <AnimatePresence>
        {activePanel !== 'none' && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed z-40 bg-[#0d0b14] border border-[#3d2b4f]/50 shadow-2xl rounded-2xl flex flex-col overflow-hidden ${
              isExpanded 
                ? 'inset-4 md:inset-10' 
                : 'bottom-24 right-24 w-[90vw] md:w-[450px] h-[60vh] max-h-[600px]'
            }`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-4 py-3 border-b border-[#3d2b4f]/30 ${activePanel === 'chat' ? 'bg-[#15101e]/80' : 'bg-[#1a1525]/80'}`}>
              <div className="flex items-center gap-2">
                {activePanel === 'chat' ? (
                  <>
                    <Sparkles size={16} className="text-[#ff4d4d]" />
                    <span className="font-black text-sm tracking-widest text-[#ff4d4d] uppercase">
                      {(translations[lang] as any).sdkAhaRadio || translations[lang].siteName}
                    </span>
                  </>
                ) : (
                  <>
                    <Settings size={16} className="text-gray-400" />
                    <span className="font-black text-sm tracking-widest text-gray-300 uppercase">
                      {translations[lang].sdkSettings}
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {activePanel === 'chat' && user && (
                  <button
                    onClick={clearHistory}
                    className="p-1.5 hover:bg-white/10 text-gray-400 hover:text-red-400 rounded-lg transition-colors mr-2"
                    title={translations[lang].sdkClearHistory}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400"
                >
                  {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
                <button 
                  onClick={() => setActivePanel('none')}
                  className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors text-gray-400"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative">
              {activePanel === 'chat' ? (
                !user ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4">
                    <div className="w-16 h-16 bg-[#ff4d4d]/10 rounded-full flex items-center justify-center border border-[#ff4d4d]/20">
                      <Lock className="w-8 h-8 text-[#ff4d4d]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-2">
                        {translations[lang].sdkAuthRequiredMsg || (translations[lang] as any).sdkAuthRequired}
                      </h3>
                      <p className="text-sm text-gray-400 mb-6">
                        {(translations[lang] as any).sdkAuthDesc || translations[lang].sdkAuthRequiredMsg}
                      </p>
                    </div>
                    <button
                      onClick={loginWithGoogle}
                      className="bg-white text-[#15101e] px-6 py-3 rounded-xl font-bold uppercase tracking-wider hover:bg-white/90 transition-colors"
                    >
                      {translations[lang].maintenanceLoginGoogle}
                    </button>
                  </div>
                ) : (
                <div className="absolute inset-0 flex flex-col">
                  <div 
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[#3d2b4f] scrollbar-track-transparent"
                  >
                    {history.map((item, i) => (
                      <div key={i} className={`flex flex-col ${item.type === 'cmd' ? 'items-end' : 'items-start'}`}>
                        {item.type === 'cmd' && (
                          <div className="bg-[#ff4d4d] text-[#15101e] px-4 py-2 rounded-2xl rounded-tr-sm max-w-[85%] text-sm">
                            {item.text}
                          </div>
                        )}
                        {item.type === 'res' && (
                          <div className="bg-[#15101e]/80 border border-[#3d2b4f]/50 text-gray-200 px-4 py-3 rounded-2xl rounded-tl-sm max-w-[90%] text-sm whitespace-pre-wrap">
                            {item.text}
                          </div>
                        )}
                        {item.type === 'info' && (
                          <div className="text-blue-400/80 italic text-xs self-center bg-blue-500/10 px-3 py-1 rounded-full">
                            {item.text}
                          </div>
                        )}
                      </div>
                    ))}
                    {isProcessing && (
                      <div className="flex items-start">
                        <div className="bg-[#15101e]/80 border border-[#3d2b4f]/50 text-[#ff4d4d] px-4 py-3 rounded-2xl rounded-tl-sm text-sm flex items-center gap-2">
                          <Sparkles size={14} className="animate-pulse" />
                          {translations[lang].radioThinking || (translations[lang] as any).sdkThinking}
                        </div>
                      </div>
                    )}
                  </div>
                  <form onSubmit={handleExecute} className="p-3 border-t border-[#3d2b4f]/30 bg-black/20">
                    <div className="flex items-center gap-2 bg-[#15101e]/50 border border-[#3d2b4f]/50 rounded-xl p-1 focus-within:border-[#ff4d4d]/50 transition-colors">
                      <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={translations[lang].sdkAskAi || (translations[lang] as any).sdkAskAI}
                        className="flex-1 min-w-0 bg-transparent border-none outline-none px-3 py-2 text-sm text-white placeholder-gray-500"
                      />
                      <button 
                        type="submit"
                        disabled={!input.trim() || isProcessing}
                        className="shrink-0 p-2 bg-[#ff4d4d] text-[#15101e] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </form>
                </div>
                )
              ) : (
                <div className="absolute inset-0 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-[#3d2b4f] scrollbar-track-transparent">
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">
                      {translations[lang].sdkPerformance}
                    </h3>
                    
                    <button 
                      onClick={toggleProductionMode}
                      className="w-full flex items-center justify-between p-4 bg-[#15101e]/40 hover:bg-[#15101e]/60 rounded-xl border border-[#3d2b4f]/30 transition-colors text-left"
                    >
                      <div>
                        <div className="font-bold text-white text-sm mb-1">
                          {translations[lang].sdkProductionMode}
                        </div>
                        <div className="text-xs text-gray-400">
                          {translations[lang].sdkHighFidelity}
                        </div>
                      </div>
                      <div className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${productionMode ? 'bg-[#ff4d4d]' : 'bg-[#3d2b4f]'}`}>
                        <div className={`absolute top-[2px] left-[2px] w-5 h-5 rounded-full bg-white transition-transform ${productionMode ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                    </button>

                    <button 
                      onClick={toggleLowPerfMode}
                      className="w-full flex items-center justify-between p-4 bg-[#15101e]/40 hover:bg-[#15101e]/60 rounded-xl border border-[#3d2b4f]/30 transition-colors text-left"
                    >
                      <div>
                        <div className="font-bold text-white text-sm mb-1">
                          {translations[lang].sdkLowPerfMode || (translations[lang] as any).sdkLowPerformanceMode}
                        </div>
                        <div className="text-xs text-gray-400">
                          {translations[lang].sdkDisableHeavy || (translations[lang] as any).sdkDisableHeavyAnimations}
                        </div>
                      </div>
                      <div className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${lowPerfMode ? 'bg-[#ff4d4d]' : 'bg-[#3d2b4f]'}`}>
                        <div className={`absolute top-[2px] left-[2px] w-5 h-5 rounded-full bg-white transition-transform ${lowPerfMode ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                    </button>

                    <button 
                      onClick={toggleLoadWidget}
                      className="w-full flex items-center justify-between p-4 bg-[#15101e]/40 hover:bg-[#15101e]/60 rounded-xl border border-[#3d2b4f]/30 transition-colors text-left"
                    >
                      <div>
                        <div className="font-bold text-white text-sm mb-1">
                          {translations[lang].sdkLoadWidget}
                        </div>
                        <div className="text-xs text-gray-400">
                          {translations[lang].sdkShowPerfWidget || (translations[lang] as any).sdkShowPerformanceWidget}
                        </div>
                      </div>
                      <div className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${showLoadWidget ? 'bg-[#ff4d4d]' : 'bg-[#3d2b4f]'}`}>
                        <div className={`absolute top-[2px] left-[2px] w-5 h-5 rounded-full bg-white transition-transform ${showLoadWidget ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                    </button>

                    <button 
                      onClick={toggleAhaSecurity}
                      className="w-full flex items-center justify-between p-4 bg-[#15101e]/40 hover:bg-[#15101e]/60 rounded-xl border border-[#3d2b4f]/30 transition-colors text-left"
                    >
                      <div>
                        <div className="font-bold text-white text-sm mb-1 flex items-center gap-2">
                          <ShieldCheck size={16} className={!ahaSecurityHidden ? 'text-green-500' : 'text-gray-500'} />
                          {(translations[lang] as any).securityWidgetTitle || "Aha Security Widget"}
                        </div>
                        <div className="text-xs text-gray-400">
                          {(translations[lang] as any).securityWidgetDesc || "Show actively blocked threats panel"}
                        </div>
                      </div>
                      <div className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${!ahaSecurityHidden ? 'bg-green-500' : 'bg-[#3d2b4f]'}`}>
                        <div className={`absolute top-[2px] left-[2px] w-5 h-5 rounded-full bg-white transition-transform ${!ahaSecurityHidden ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">
                      {translations[lang].sdkSystem}
                    </h3>
                    
                    <div className="p-4 bg-black/30 rounded-xl border border-[#3d2b4f]/30 font-mono text-xs text-gray-300 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">SDK Version:</span>
                        <span className="text-[#ff4d4d]">v2.0.0-hsr</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Environment:</span>
                        <span className="text-green-400">{process.env.NODE_ENV}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">AI Engine:</span>
                        <span className="text-yellow-400">Custom Neural Engine</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Local Time:</span>
                        <span>{localTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
