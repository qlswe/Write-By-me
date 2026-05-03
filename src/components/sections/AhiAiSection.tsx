import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ChevronRight, Lock, Trash2, Plus, MessageSquare, Settings, X, Bot, User } from 'lucide-react';
import { sdk } from '../../sdk';
import { Language, translations } from '../../data/translations';
import { useAuth } from '../../hooks/useAuth';
import { GoogleLoginButton } from '../ui/GoogleLoginButton';
import { useAiChats } from '../../hooks/useAiChats';

export const AhiAiSection: React.FC<{ lang: Language }> = ({ lang }) => {
  const { user } = useAuth();
  const t = translations[lang];
  const { chats, activeChatId, setActiveChatId, activeChat, createChat, deleteChat, updateChat, addMessage } = useAiChats();
  
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [systemPromptInput, setSystemPromptInput] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeChat) {
      setSystemPromptInput(activeChat.systemPrompt);
    }
  }, [activeChatId, activeChat]);

  // Initial chat creation if no chats exist
  useEffect(() => {
    if (user && chats.length === 0 && !activeChatId) {
      createChat('', lang === 'ru' ? 'Новый чат' : 'New Chat');
    }
  }, [user, chats.length, activeChatId, createChat, lang]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeChat?.messages.length, isProcessing]);

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing || !activeChatId) return;

    const cmd = input.trim();
    addMessage(activeChatId, { role: 'user', content: cmd });
    setInput('');
    setIsProcessing(true);

    try {
      if (cmd.startsWith('/')) {
        // execute terminal command
        const response = await sdk.terminal.execute(cmd.substring(1), lang);
        if (response === 'CLEAR_TERMINAL') {
          updateChat(activeChatId, { messages: [] });
        } else {
          addMessage(activeChatId, { role: 'info', content: response });
        }
      } else {
        // Ai execution
        const historyForGenAi = activeChat!.messages
          .filter(m => m.role === 'user' || m.role === 'assistant')
          .map(m => ({ role: m.role, content: m.content }));
        
        const response = await sdk.genai.generate(cmd, lang, activeChat!.systemPrompt, historyForGenAi);
        addMessage(activeChatId, { role: 'assistant', content: response });
      }
    } catch (error) {
      addMessage(activeChatId, { role: 'info', content: `Ошибка: ${error instanceof Error ? error.message : String(error)}` });
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
    }
  };

  const handleSaveSettings = () => {
    if (activeChatId) {
      updateChat(activeChatId, { systemPrompt: systemPromptInput });
    }
    setIsSettingsOpen(false);
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
        <GoogleLoginButton lang={lang} size="lg" />
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#251c35] rounded-3xl border border-[#3d2b4f] shadow-2xl flex overflow-hidden min-h-[600px] h-[calc(100vh-12rem)] w-full relative"
    >
      {/* Sidebar */}
      <div className="w-64 bg-[#15101e] border-r border-[#3d2b4f] flex flex-col hidden sm:flex shrink-0">
        <div className="p-4">
          <button
            onClick={() => createChat('', lang === 'ru' ? 'Новый чат' : 'New Chat')}
            className="w-full flex items-center gap-2 bg-[#ff4d4d] hover:bg-white text-[#15101e] transition-colors py-3 px-4 rounded-xl font-bold text-sm shadow-[0_0_15px_rgba(255,77,77,0.2)]"
          >
            <Plus size={18} />
            {lang === 'ru' ? 'Новый чат' : 'New Chat'}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-3 space-y-2 scrollbar-thin scrollbar-thumb-[#3d2b4f] scrollbar-track-transparent">
          {chats.map(chat => (
            <div 
              key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
              className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all group ${
                activeChatId === chat.id 
                  ? 'bg-[#3d2b4f] text-white shadow-md' 
                  : 'text-gray-400 hover:bg-[#3d2b4f]/50 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare size={16} className="shrink-0" />
                <span className="truncate text-sm font-medium">{chat.title}</span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(chat.id);
                }}
                className={`p-1.5 rounded-md hover:bg-red-500/20 hover:text-red-400 transition-colors ${activeChatId === chat.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#3d2b4f]/50 bg-[#15101e]/50 shrink-0">
          <div className="flex items-center gap-3">
            <Sparkles className="text-[#ff4d4d]" />
            <h2 className="text-lg sm:text-xl font-bold text-white truncate">
              {activeChat ? activeChat.title : ((t as any).sdkAhaRadio || t.siteName) + ' AI'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              disabled={!activeChat}
              className="p-2 hover:bg-[#ff4d4d]/20 hover:text-[#ff4d4d] text-gray-400 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
            >
              <Settings size={18} />
              <span className="hidden sm:inline">{lang === 'ru' ? 'Промпт' : 'Prompt'}</span>
            </button>
            <button
              className="sm:hidden p-2 hover:bg-white/10 text-gray-400 rounded-lg transition-colors flex items-center justify-center"
              onClick={() => createChat('', lang === 'ru' ? 'Новый чат' : 'New Chat')}
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-[#3d2b4f] scrollbar-track-transparent bg-[#15101e]/30"
        >
          {activeChat?.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-gray-500">
              <Bot size={48} className="text-[#3d2b4f]" />
              <p className="font-medium">
                {(t as any).sdkAhaRadioAI || t.sdkTitle}<br />
                <span className="text-sm font-normal">{(t as any).sdkAskMe || t.sdkDesc}</span>
              </p>
            </div>
          ) : (
            activeChat?.messages.map((item, i) => (
              <div key={i} className={`flex w-full ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {item.role === 'user' && (
                  <div className="bg-[#ff4d4d] text-[#15101e] px-4 py-3 rounded-2xl rounded-tr-sm max-w-[90%] sm:max-w-[75%] shadow-lg">
                    <p className="text-sm md:text-base font-medium break-words whitespace-pre-wrap">{item.content}</p>
                  </div>
                )}
                {item.role === 'assistant' && (
                  <div className="flex items-start gap-3 w-full max-w-[95%] sm:max-w-[85%]">
                    <div className="w-8 h-8 rounded-full bg-[#15101e] border border-[#ff4d4d]/30 flex items-center justify-center shrink-0 mt-1">
                      <Bot size={16} className="text-[#ff4d4d]" />
                    </div>
                    <div className="bg-[#15101e] border border-[#3d2b4f] text-gray-200 px-5 py-4 rounded-2xl rounded-tl-sm text-sm md:text-base break-words whitespace-pre-wrap shadow-xl">
                      {item.content}
                    </div>
                  </div>
                )}
                {item.role === 'system' && (
                  <div className="text-yellow-400/80 italic text-sm self-center bg-yellow-500/10 px-4 py-1.5 rounded-full my-2 border border-yellow-500/20 mx-auto">
                    {item.content}
                  </div>
                )}
                {item.role === 'info' && (
                  <div className="text-blue-400/80 italic text-sm self-center bg-blue-500/10 px-4 py-1.5 rounded-full my-2 border border-blue-500/20 mx-auto whitespace-pre-wrap text-center">
                    {item.content}
                  </div>
                )}
              </div>
            ))
          )}
          {isProcessing && (
            <div className="flex items-start gap-3 w-full max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-[#15101e] border border-[#ff4d4d]/30 flex items-center justify-center shrink-0 mt-1">
                <Bot size={16} className="text-[#ff4d4d] animate-pulse" />
              </div>
              <div className="bg-[#15101e] border border-[#3d2b4f] text-[#ff4d4d] px-5 py-4 rounded-2xl rounded-tl-sm flex items-center gap-3 shadow-xl">
                <Sparkles size={18} className="animate-pulse" />
                {t.radioThinking || (t as any).sdkThinking || "Осмысляю..."}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleExecute} className="p-3 sm:p-4 border-t border-[#3d2b4f]/50 bg-[#15101e]/80 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 bg-[#15101e] border-2 border-[#3d2b4f] rounded-2xl p-1.5 sm:p-2 focus-within:border-[#ff4d4d] transition-colors shadow-inner">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.sdkAskAi || (t as any).sdkAskAI || "Сообщение..."}
              className="flex-1 min-w-0 bg-transparent border-none outline-none px-3 py-2 text-sm sm:text-base text-white placeholder-gray-500"
              disabled={!activeChat}
            />
            <button 
              type="submit"
              disabled={!input.trim() || isProcessing || !activeChat}
              className="shrink-0 p-2.5 sm:p-3 bg-[#ff4d4d] text-[#15101e] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(255,77,77,0.3)] disabled:hover:scale-100 disabled:shadow-none"
            >
              <ChevronRight size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </form>

        {/* Settings Modal */}
        <AnimatePresence>
          {isSettingsOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-[#0d0b14]/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                className="bg-[#251c35] border border-[#3d2b4f] w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl relative"
              >
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
                
                <h3 className="text-2xl font-black text-white mb-6 pr-8">
                  {lang === 'ru' ? 'Настройки чата' : 'Chat Settings'}
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">
                      {lang === 'ru' ? 'Системный Промпт (System Prompt)' : 'System Prompt'}
                    </label>
                    <textarea
                      value={systemPromptInput}
                      onChange={(e) => setSystemPromptInput(e.target.value)}
                      placeholder={lang === 'ru' ? 'Введите инструкции, как должен вести себя ИИ в этом чате...' : 'Enter instructions on how the AI should behave...'}
                      className="w-full bg-[#15101e] border-2 border-[#3d2b4f] rounded-xl p-4 text-gray-200 placeholder-gray-600 focus:border-[#ff4d4d] outline-none min-h-[150px] resize-y"
                    />
                  </div>
                  
                  <button 
                    onClick={handleSaveSettings}
                    className="w-full bg-[#ff4d4d] text-[#15101e] font-black uppercase tracking-widest py-4 rounded-xl hover:bg-white transition-all shadow-[0_0_20px_rgba(255,77,77,0.3)] hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {lang === 'ru' ? 'Сохранить' : 'Save'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

