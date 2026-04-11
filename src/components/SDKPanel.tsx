import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Terminal, X, Settings, Cpu, ChevronRight, MessageSquare, Maximize2, Minimize2, Lock, Trash2 } from 'lucide-react';
import { sdk } from '../sdk';
import { Language } from '../data/translations';
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
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'sdk'>('chat');
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Terminal/Chat state
  const [history, setHistory] = useState<{ type: 'cmd' | 'res' | 'info', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [localTime, setLocalTime] = useState(new Date().toLocaleTimeString());
  const { user, loginWithGoogle } = useAuth();

  const initialHistory = [
    { type: 'info' as const, text: lang === 'ru' ? 'Радиостанция Ахи ИИ v2.0' : 'Aha Radio Station AI v2.0' },
    { type: 'info' as const, text: lang === 'ru' ? 'Спросите меня о лоре HSR или используйте команды SDK (начните с /).' : 'Ask me about HSR lore or use SDK commands (start with /).' }
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
  }, [history]);

  useEffect(() => {
    if (isOpen && activeTab === 'chat' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, activeTab]);

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
        // Execute as normal command
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
      {/* Floating Button */}
      <AnimatePresence>
        {(!mobileMenuOpen || isOpen) && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(!isOpen)}
            className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl border transition-all duration-500 ${
              isOpen ? 'bg-[#C3A6E6] text-[#2F244F] border-white scale-110' : 
              productionMode ? 'bg-[#C3A6E6] text-[#2F244F] border-white' : 
              'bg-[#2F244F] text-[#C3A6E6] border-[#5C4B8B]'
            }`}
            title={lang === 'ru' ? 'Панель Министерства' : 'Ministry Panel'}
          >
            <Sparkles size={24} className={productionMode && !isOpen ? 'animate-pulse' : ''} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expandable Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed z-40 bg-[#1a142e] border border-[#5C4B8B]/50 shadow-2xl rounded-2xl flex flex-col overflow-hidden ${
              isExpanded 
                ? 'inset-4 md:inset-10' 
                : 'bottom-24 right-6 w-[90vw] md:w-[450px] h-[60vh] max-h-[600px]'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#2F244F]/80 border-b border-[#5C4B8B]/30">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#C3A6E6]" />
                <span className="font-black text-sm tracking-widest text-[#C3A6E6] uppercase">
                  {lang === 'ru' ? 'Радиостанция Ахи' : 'Aha Radio Station'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400"
                >
                  {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors text-gray-400"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#5C4B8B]/30">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
                  activeTab === 'chat' ? 'bg-[#C3A6E6]/10 text-[#C3A6E6] border-b-2 border-[#C3A6E6]' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                <MessageSquare size={14} />
                {lang === 'ru' ? 'ИИ Ассистент' : 'AI Assistant'}
              </button>
              <button
                onClick={() => setActiveTab('sdk')}
                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
                  activeTab === 'sdk' ? 'bg-[#C3A6E6]/10 text-[#C3A6E6] border-b-2 border-[#C3A6E6]' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                <Settings size={14} />
                {lang === 'ru' ? 'SDK Настройки' : 'SDK Settings'}
              </button>
              {activeTab === 'chat' && user && (
                <button
                  onClick={clearHistory}
                  className="px-4 py-2.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors border-b-2 border-transparent"
                  title={lang === 'ru' ? 'Очистить историю' : 'Clear history'}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative">
              {activeTab === 'chat' ? (
                !user ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4">
                    <div className="w-16 h-16 bg-[#C3A6E6]/10 rounded-full flex items-center justify-center border border-[#C3A6E6]/20">
                      <Lock className="w-8 h-8 text-[#C3A6E6]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-2">
                        {lang === 'ru' ? 'Требуется авторизация' : 'Authorization Required'}
                      </h3>
                      <p className="text-sm text-gray-400 mb-6">
                        {lang === 'ru' ? 'Использование ИИ доступно только после авторизации через Google.' : 'AI usage is only available after logging in with Google.'}
                      </p>
                    </div>
                    <button
                      onClick={loginWithGoogle}
                      className="bg-white text-[#2F244F] px-6 py-3 rounded-xl font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors"
                    >
                      {lang === 'ru' ? 'Войти через Google' : 'Login with Google'}
                    </button>
                  </div>
                ) : (
                <div className="absolute inset-0 flex flex-col">
                  <div 
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[#5C4B8B] scrollbar-track-transparent"
                  >
                    {history.map((item, i) => (
                      <div key={i} className={`flex flex-col ${item.type === 'cmd' ? 'items-end' : 'items-start'}`}>
                        {item.type === 'cmd' && (
                          <div className="bg-[#C3A6E6] text-[#2F244F] px-4 py-2 rounded-2xl rounded-tr-sm max-w-[85%] text-sm">
                            {item.text}
                          </div>
                        )}
                        {item.type === 'res' && (
                          <div className="bg-[#2F244F]/80 border border-[#5C4B8B]/50 text-gray-200 px-4 py-3 rounded-2xl rounded-tl-sm max-w-[90%] text-sm whitespace-pre-wrap">
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
                        <div className="bg-[#2F244F]/80 border border-[#5C4B8B]/50 text-[#C3A6E6] px-4 py-3 rounded-2xl rounded-tl-sm text-sm flex items-center gap-2">
                          <Sparkles size={14} className="animate-pulse" />
                          {lang === 'ru' ? 'Думает...' : 'Thinking...'}
                        </div>
                      </div>
                    )}
                  </div>
                  <form onSubmit={handleExecute} className="p-3 border-t border-[#5C4B8B]/30 bg-black/20">
                    <div className="flex items-center gap-2 bg-[#2F244F]/50 border border-[#5C4B8B]/50 rounded-xl p-1 focus-within:border-[#C3A6E6]/50 transition-colors">
                      <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={lang === 'ru' ? 'Спросите ИИ (или /команда)...' : 'Ask AI (or /command)...'}
                        className="flex-1 min-w-0 bg-transparent border-none outline-none px-3 py-2 text-sm text-white placeholder-gray-500"
                      />
                      <button 
                        type="submit"
                        disabled={!input.trim() || isProcessing}
                        className="shrink-0 p-2 bg-[#C3A6E6] text-[#2F244F] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </form>
                </div>
                )
              ) : (
                <div className="absolute inset-0 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-[#5C4B8B] scrollbar-track-transparent">
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">
                      {lang === 'ru' ? 'Производительность' : 'Performance'}
                    </h3>
                    
                    <div className="flex items-center justify-between p-4 bg-[#2F244F]/40 rounded-xl border border-[#5C4B8B]/30">
                      <div>
                        <div className="font-bold text-white text-sm mb-1">
                          {lang === 'ru' ? 'Продакшн Режим' : 'Production Mode'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {lang === 'ru' ? 'Высокое качество графики и эффектов' : 'High fidelity graphics and effects'}
                        </div>
                      </div>
                      <button 
                        onClick={toggleProductionMode}
                        className={`w-12 h-6 rounded-full transition-colors relative ${productionMode ? 'bg-[#C3A6E6]' : 'bg-gray-600'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${productionMode ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[#2F244F]/40 rounded-xl border border-[#5C4B8B]/30">
                      <div>
                        <div className="font-bold text-white text-sm mb-1">
                          {lang === 'ru' ? 'Режим низкой производительности' : 'Low Performance Mode'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {lang === 'ru' ? 'Отключает тяжелые анимации' : 'Disables heavy animations'}
                        </div>
                      </div>
                      <button 
                        onClick={toggleLowPerfMode}
                        className={`w-12 h-6 rounded-full transition-colors relative ${lowPerfMode ? 'bg-[#C3A6E6]' : 'bg-gray-600'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${lowPerfMode ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[#2F244F]/40 rounded-xl border border-[#5C4B8B]/30">
                      <div>
                        <div className="font-bold text-white text-sm mb-1">
                          {lang === 'ru' ? 'Виджет нагрузки' : 'Load Widget'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {lang === 'ru' ? 'Показывать виджет производительности' : 'Show performance widget'}
                        </div>
                      </div>
                      <button 
                        onClick={toggleLoadWidget}
                        className={`w-12 h-6 rounded-full transition-colors relative ${showLoadWidget ? 'bg-[#C3A6E6]' : 'bg-gray-600'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${showLoadWidget ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">
                      {lang === 'ru' ? 'Система' : 'System'}
                    </h3>
                    
                    <div className="p-4 bg-black/30 rounded-xl border border-[#5C4B8B]/30 font-mono text-xs text-gray-300 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">SDK Version:</span>
                        <span className="text-[#C3A6E6]">v2.0.0-hsr</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Environment:</span>
                        <span className="text-green-400">{process.env.NODE_ENV}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">AI Engine:</span>
                        <span className="text-yellow-400">Pollinations API</span>
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
