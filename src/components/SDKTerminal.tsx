import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Terminal, X, Maximize2, Minimize2, ChevronRight, Info, Sparkles, Cpu } from 'lucide-react';
import { sdk } from '../sdk';
import { Language } from '../data/translations';

interface SDKTerminalProps {
  lang?: Language;
}

export const SDKTerminal: React.FC<SDKTerminalProps> = ({ lang = 'ru' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAiMode, setIsAiMode] = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [history, setHistory] = useState<{ type: 'cmd' | 'res' | 'info', text: string }[]>([
    { type: 'info', text: lang === 'ru' ? 'Министерство Ахахи SDK v1.4.0-beta (Терминальный Интерфейс)' : 'Ministry of Ahahi SDK v1.4.0-beta (Terminal Interface)' },
    { type: 'info', text: lang === 'ru' ? 'Введите "help" для списка доступных команд.' : 'Type "help" for a list of available commands.' }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const cmd = input.trim();
    setHistory(prev => [...prev, { type: 'cmd', text: cmd }]);
    setInput('');
    setIsProcessing(true);

    try {
      const response = await sdk.terminal.execute(cmd, lang);
      
      // Update local state if mode changed in SDK
      const currentMode = sdk.terminal.getMode();
      setIsAiMode(currentMode === 'ai');
      setIsLocalMode(currentMode === 'local');

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

  const usage = sdk.help.getUsage(lang);

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 p-3 rounded-full bg-[#2F244F] text-[#C3A6E6] border border-[#5C4B8B] shadow-2xl hover:bg-[#3E3160] transition-colors"
        title={lang === 'ru' ? 'Открыть терминал SDK' : 'Open SDK Terminal'}
      >
        <Terminal size={24} />
      </motion.button>

      {/* Terminal Modal */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={`fixed z-50 bg-[#1a142e] border shadow-2xl rounded-xl overflow-hidden flex flex-col transition-all duration-300 ${
            isExpanded 
              ? 'inset-4 md:inset-10' 
              : 'bottom-20 left-6 w-[90vw] md:w-[700px] h-[60vh]'
          } ${
            isAiMode ? 'border-yellow-500/50' : 
            isLocalMode ? 'border-blue-500/50' : 
            'border-[#5C4B8B]'
          }`}
        >
          {/* Header */}
          <div className={`px-4 py-2 flex items-center justify-between border-b transition-colors duration-300 ${
            isAiMode ? 'bg-yellow-500/10 border-yellow-500/30' : 
            isLocalMode ? 'bg-blue-500/10 border-blue-500/30' : 
            'bg-[#2F244F] border-[#5C4B8B]'
          }`}>
            <div className="flex items-center gap-2">
              {isAiMode ? (
                <Sparkles size={16} className="text-yellow-400 animate-pulse" />
              ) : isLocalMode ? (
                <Cpu size={16} className="text-blue-400" />
              ) : (
                <Terminal size={16} className="text-[#C3A6E6]" />
              )}
              <span className={`text-xs font-mono font-bold uppercase tracking-widest ${
                isAiMode ? 'text-yellow-400' : 
                isLocalMode ? 'text-blue-400' : 
                'text-[#C3A6E6]'
              }`}>
                {isAiMode ? (lang === 'ru' ? 'ИИ РЕЖИМ' : 'AI MODE') : 
                 isLocalMode ? (lang === 'ru' ? 'ЛОКАЛЬНЫЙ РЕЖИМ' : 'LOCAL MODE') : 
                 (lang === 'ru' ? 'ТЕРМИНАЛ SDK' : 'SDK TERMINAL')} 
                <span className="text-[10px] opacity-60 ml-1">BETA</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-white/10 rounded transition-colors text-gray-400"
              >
                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-colors text-gray-400"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Main Terminal */}
            <div className="flex-1 flex flex-col bg-black/40 p-4 font-mono text-sm overflow-hidden">
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto space-y-2 mb-4 scrollbar-thin scrollbar-thumb-[#5C4B8B] scrollbar-track-transparent"
              >
                {history.map((item, i) => (
                  <div key={i} className="break-words">
                    {item.type === 'cmd' && (
                      <div className="flex items-start gap-2 text-[#C3A6E6]">
                        <ChevronRight size={14} className="mt-1 flex-shrink-0" />
                        <span className={isAiMode ? "text-yellow-400/80" : ""}>{item.text}</span>
                      </div>
                    )}
                    {item.type === 'res' && (
                      <div className="text-gray-300 pl-6 whitespace-pre-wrap">
                        {item.text}
                      </div>
                    )}
                    {item.type === 'info' && (
                      <div className="text-blue-400/80 italic text-xs">
                        {item.text}
                      </div>
                    )}
                  </div>
                ))}
                {isProcessing && (
                  <div className="text-[#C3A6E6] animate-pulse pl-6">
                    {lang === 'ru' ? 'Обработка...' : 'Processing...'}
                  </div>
                )}
              </div>

              <form onSubmit={handleExecute} className={`flex items-center gap-2 p-2 rounded border transition-colors ${isAiMode ? 'bg-yellow-500/5 border-yellow-500/30' : 'bg-[#2F244F]/50 border-[#5C4B8B]/30'}`}>
                {isAiMode ? <Sparkles size={16} className="text-yellow-400" /> : <ChevronRight size={16} className="text-[#C3A6E6]" />}
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isAiMode ? (lang === 'ru' ? 'Спросите что-нибудь у ИИ...' : 'Ask AI anything...') : (lang === 'ru' ? 'Введите команду...' : 'Enter command...')}
                  className={`flex-1 bg-transparent border-none outline-none placeholder-[#5C4B8B]/50 ${isAiMode ? 'text-yellow-100' : 'text-[#C3A6E6]'}`}
                  autoFocus
                />
              </form>
            </div>

            {/* Info Sidebar (Visible when expanded) */}
            {isExpanded && (
              <div className="w-full md:w-72 bg-[#2F244F]/30 border-l border-[#5C4B8B] p-6 overflow-y-auto">
                <div className="flex items-center gap-2 mb-4 text-[#C3A6E6]">
                  <Info size={18} />
                  <h3 className="font-bold uppercase tracking-wider text-sm">{lang === 'ru' ? 'Информация о SDK' : usage.title}</h3>
                </div>
                <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                  {lang === 'ru' ? 'Комплексный набор инструментов для разработчиков и системных администраторов в экосистеме Ахахи.' : usage.description}
                </p>
                
                <h4 className="text-[10px] font-bold text-[#C3A6E6] uppercase mb-2 tracking-widest">{lang === 'ru' ? 'Сферы применения' : 'Use Cases'}</h4>
                <ul className="space-y-3 mb-6">
                  {(lang === 'ru' ? [
                    "Синхронизация данных: Синхронизация состояния игры между клиентами через Firebase.",
                    "Интеграция ИИ: Использование Gemini AI для динамических диалогов и анализа контента.",
                    "Логирование и Мониторинг: Отслеживание производительности и взаимодействий в реальном времени.",
                    "Безопасность: Валидация ввода и ограничение частоты запросов.",
                    "Доступ к оборудованию: Управление вибрацией, буфером обмена и функциями обмена."
                  ] : usage.useCases).map((useCase, i) => (
                    <li key={i} className="text-[11px] text-gray-300 flex gap-2">
                      <span className="text-[#C3A6E6]">•</span>
                      {useCase}
                    </li>
                  ))}
                </ul>

                <div className="p-3 bg-black/20 rounded border border-[#5C4B8B]/30">
                  <h4 className="text-[10px] font-bold text-[#C3A6E6] uppercase mb-1 tracking-widest">{lang === 'ru' ? 'Быстрый старт' : 'Quick Start'}</h4>
                  <p className="text-[10px] text-gray-400 font-mono">
                    {lang === 'ru' ? 'Импортируйте экземпляр "sdk" из "@sdk" и вызывайте методы модулей, например: sdk.logging.info("Hello").' : usage.gettingStarted}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </>
  );
};
