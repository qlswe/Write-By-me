import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ChevronRight, Lock, Trash2, Plus, MessageSquare, Settings, X, Bot, User, Mail, Pencil, Copy, RotateCcw } from 'lucide-react';
import { sdk } from '../../sdk';
import { Language, translations } from '../../data/translations';
import { useAuth } from '../../hooks/useAuth';
import { GoogleLoginButton } from '../ui/GoogleLoginButton';
import { useAiChats } from '../../hooks/useAiChats';
import { useLimits } from '../../hooks/useLimits';
import { AdsBlock } from '../ui/AdsBlock';

const quickSuggestions = {
  ru: [
    { label: 'Космический анекдот 🌌', prompt: 'Расскажи безумный и веселый космический анекдот!' },
    { label: 'Теория заговора HSR 🔮', prompt: 'Придумай самую абсурдную и угарную фанатскую теорию заговора по игре Honkai: Star Rail!' },
    { label: 'Билд на персонажа HSR 🎮', prompt: 'Помоги составить крутой, безумный или эффективный билд для любого персонажа на твой выбор!' },
    { label: 'Ода богу Радости Ахе 🎉', prompt: 'Напиши вдохновляющую, веселую и хаотичную оду или стих Эону Радости Ахе!' }
  ],
  en: [
    { label: 'Cosmic Joke 🌌', prompt: 'Tell me a wild and funny cosmic joke!' },
    { label: 'HSR Conspiracy Theory 🔮', prompt: 'Invent the most absurd and hilarious fan conspiracy theory about Honkai: Star Rail!' },
    { label: 'Character Build HSR 🎮', prompt: 'Help me design a fun, crazy, or high-performance build for any character of your choice!' },
    { label: 'Ode to Aha the Elation 🎉', prompt: 'Write an inspiring, funny, and chaotic poem or ode to Aha, the Aeon of Elation!' }
  ]
};

const quickPrompts = {
  ru: [
    { label: 'Объясни последнее событие 🌌', prompt: 'Объясни, что произошло в последнем крупном обновлении Honkai: Star Rail?' },
    { label: 'Предложи теорию 🔮', prompt: 'Придумай и предложи безумную фанатскую теорию об истинных мотивах Эона Радости Ахи.' },
    { label: 'Лучший билд на Ахерона ⚡', prompt: 'Порекомендуй лучший и самый фановый билд для Ахерон в HSR.' },
    { label: 'Анекдот про Пом-Пом 🚂', prompt: 'Расскажи угарный и добрый анекдот про Пом-Пом и Первопроходца.' },
    { label: 'Кто такие Недотёпы в масках? 🎭', prompt: 'Расскажи, кто такие Недотёпы в масках и почему они служат Ахе?' },
    { label: 'Космический совет дня 💫', prompt: 'Дай мне безумное космическое предсказание или совет дня от имени Ахи!' }
  ],
  en: [
    { label: 'Explain last event 🌌', prompt: 'Can you explain what happened in the latest major update of Honkai: Star Rail?' },
    { label: 'Suggest a theory 🔮', prompt: 'Propose a wild and funny fan theory about the true motives of Aha the Elation.' },
    { label: 'Best Acheron build ⚡', prompt: 'Recommend the best and most fun build for Acheron in HSR.' },
    { label: 'Pom-Pom joke 🚂', prompt: 'Tell a hilarious and wholesome joke about Pom-Pom and the Trailblazer.' },
    { label: 'Who are Masked Fools? 🎭', prompt: 'Tell me who the Masked Fools are and why they follow Aha.' },
    { label: 'Cosmic advice of the day 💫', prompt: 'Give me a chaotic cosmic prediction or advice of the day from Aha!' }
  ]
};

export const AhiAiSection: React.FC<{ 
  lang: Language;
  currentSection?: string;
  previousSection?: string;
}> = ({ lang, currentSection = 'ai', previousSection = 'home' }) => {
  const { user } = useAuth();
  const t = translations[lang];
  const { chats, activeChatId, setActiveChatId, activeChat, createChat, deleteChat, updateChat, addMessage } = useAiChats();
  const { checkLimit, incrementUsage, hasUnlimitedAccess } = useLimits();
  
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [systemPromptInput, setSystemPromptInput] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
      if (checkLimit('chats_daily')) {
        createChat('', lang === 'ru' ? 'Новый чат' : 'New Chat');
        incrementUsage('chats_daily');
      }
    }
  }, [user, chats.length, activeChatId, createChat, lang, checkLimit, incrementUsage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeChat?.messages.length, isProcessing]);

  const handleCreateChat = () => {
    if (!checkLimit('chats_daily')) {
      alert(lang === 'ru' ? 'Лимит создания чатов на сегодня исчерпан. Ожидайте завтра или приобретите Aha Premium.' : 'Daily chat creation limit reached. Wait until tomorrow or get Aha Premium.');
      return;
    }
    createChat('', lang === 'ru' ? 'Новый чат' : 'New Chat');
    incrementUsage('chats_daily');
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isProcessing || !activeChatId) return;

    const cmd = text.trim();

    if (!hasUnlimitedAccess && cmd.length > 250) {
      alert(lang === 'ru' ? 'Ваше сообщение превышает лимит в 250 символов. Купите Aha Premium для снятия ограничений.' : 'Your message exceeds the 250-character limit. Get Aha Premium to remove this limit.');
      return;
    }

    if (cmd.startsWith('/') && !checkLimit('terminal_daily')) {
      alert(lang === 'ru' ? 'Лимит терминальных команд на сегодня исчерпан.' : 'Daily terminal commands limit reached.');
      return;
    }

    // Capture the messages array before sending to avoid stale closure references
    const currentMessages = activeChat ? [...activeChat.messages] : [];

    addMessage(activeChatId, { role: 'user', content: cmd });
    setIsProcessing(true);

    try {
      if (cmd.startsWith('/')) {
        // execute terminal command
        incrementUsage('terminal_daily');
        const response = await sdk.terminal.execute(cmd.substring(1), lang);
        if (response === 'CLEAR_TERMINAL') {
          updateChat(activeChatId, { messages: [] });
        } else {
          addMessage(activeChatId, { role: 'info', content: response });
        }
      } else {
        // Ai execution
        const historyForGenAi = currentMessages
          .filter(m => m.role === 'user' || m.role === 'assistant')
          .map(m => ({ role: m.role, content: m.content }));
        
        const tAny = t as any;
        const sectionInfoMap: Record<string, { title: string; description: string }> = {
          home: {
            title: tAny.navHome || tAny.homeTitle || 'Главная / Home',
            description: tAny.homeDesc || 'Добро пожаловать на Радиостанцию Ахи! Это ваш персональный ресурс для глубокого погружения во вселенную Honkai: Star Rail.'
          },
          forum: {
            title: tAny.navForum || tAny.forumTitle || 'Активности и Посты / Activities & Posts',
            description: 'Форум Ахи, обсуждение активностей, постов, событий и игровых новостей.'
          },
          canvas: {
            title: tAny.navCanvas || tAny.canvasTitle || 'Аха Холст / Aha Canvas',
            description: tAny.canvasDesc || 'Совместный холст в реальном времени. Любые изменения видны всем мгновенно!'
          },
          radio: {
            title: tAny.navRadio || tAny.radioTitle || 'Радио Ахи / Aha Radio',
            description: 'Радиостанция Ахи, трансляция безумных шуток от ИИ и стендапов.'
          },
          theories: {
            title: tAny.navTheories || 'Всячина / Stuff',
            description: tAny.theoriesSubTitle || 'Архив Радиостанции Ахи, теории заговора и фанатские гипотезы Honkai: Star Rail.'
          },
          blog: {
            title: tAny.navBlog || 'Блог / Blog',
            description: tAny.blogSubTitle || 'Официальные хроники, патчноуты и личные заметки администрации.'
          },
          chronicle: {
            title: tAny.navChronicle || 'Хроника событий / Event Chronicle',
            description: tAny.chronicleDesc || 'Расписание активностей, событий, баннеров и игрового календаря Honkai: Star Rail.'
          },
          promo: {
            title: tAny.navPromo || 'Промокоды / Promo Codes',
            description: tAny.promoCodesSubtitle || 'Актуальные промокоды Honkai: Star Rail для получения бесплатных наград.'
          },
          chats: {
            title: tAny.navChats || 'Сообщения / Messages',
            description: 'Раздел личных сообщений и чатов с другими пользователями.'
          },
          users: {
            title: tAny.navUsers || 'Пользователи / Users',
            description: 'Список зарегистрированных путешественников, управление ролями участников.'
          },
          sdk: {
            title: 'SDK Настройки / SDK Settings',
            description: tAny.sdkSettingsDesc || 'Параметры окружения, режим производительности, системные виджеты и отладка.'
          },
          ai: {
            title: tAny.sdkTitle || 'Aha AI',
            description: tAny.sdkDesc || 'Интерактивный ИИ-ассистент, знающий всё о лоре Honkai: Star Rail и командах SDK.'
          },
          telemetry: {
            title: 'Telemetry',
            description: 'Системные логи, графики активности пользователей, метрики производительности и мониторинг ошибок.'
          }
        };

        const activeSectionInfo = sectionInfoMap[currentSection] || sectionInfoMap['ai'];
        const prevSectionInfo = sectionInfoMap[previousSection] || sectionInfoMap['home'];

        const contextPayload = `[SYSTEM_CONTEXT_PAYLOAD]
Current Page Title: "${activeSectionInfo.title}"
Section Description: "${activeSectionInfo.description}"

User came from section: "${prevSectionInfo.title}"
Previous Section description: "${prevSectionInfo.description}"

Overall App Map for context:
${Object.entries(sectionInfoMap).map(([id, info]) => `- ${id}: "${info.title}" (${info.description})`).join('\n')}
[END_SYSTEM_CONTEXT_PAYLOAD]`;

        const systemPromptWithContext = `${activeChat!.systemPrompt || ''}\n\n${contextPayload}`;

        const response = await sdk.genai.generate(cmd, lang, systemPromptWithContext, historyForGenAi);
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

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing || !activeChatId) return;
    const toSend = input;
    setInput('');
    await sendMessage(toSend);
  };

  const handleSuggestionClick = async (promptText: string) => {
    await sendMessage(promptText);
  };

  const handleRenameChat = (id: string, currentTitle: string) => {
    const newTitle = prompt(
      lang === 'ru' ? 'Введите новое название чата (макс. 24 символа):' : 'Enter new chat title (max 24 characters):',
      currentTitle
    );
    if (!newTitle) return;
    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle) return;

    if (trimmedTitle.length > 24) {
      alert(
        lang === 'ru' 
          ? 'Название слишком длинное! Пожалуйста, укажите название не более 24 символов.' 
          : 'Title is too long! Please specify a title with at most 24 characters.'
      );
      return;
    }

    updateChat(id, { title: trimmedTitle });
  };

  const handleClearHistory = () => {
    if (!activeChatId) return;
    if (window.confirm(lang === 'ru' ? 'Вы уверены, что хотите очистить всю историю сообщений в этом чате?' : 'Are you sure you want to clear all message history in this chat?')) {
      updateChat(activeChatId, { messages: [] });
    }
  };

  const handleExportChat = () => {
    if (!activeChat) return;
    const chatText = activeChat.messages
      .map(m => {
        const roleLabel = m.role === 'user' ? 'User' : m.role === 'assistant' ? 'Aha AI' : 'Info';
        return `[${roleLabel}] ${m.content}`;
      })
      .join('\n\n');
    navigator.clipboard.writeText(chatText).then(() => {
      alert(lang === 'ru' ? 'История чата скопирована в буфер обмена! 🚀' : 'Chat history copied to clipboard! 🚀');
    }).catch(err => {
      console.error('Failed to copy chat:', err);
    });
  };

  const handleSaveSettings = () => {
    if (activeChatId) {
      updateChat(activeChatId, { systemPrompt: systemPromptInput });
    }
    setIsSettingsOpen(false);
  };

  if (!user) {
    return (
      <div className="bg-[#15101e]/60 border border-[#3d2b4f]/20 rounded-[2.5rem] p-8 sm:p-12 text-center max-w-2xl mx-auto my-12 backdrop-blur-md">
        <Lock className="mx-auto text-[#ff4d4d]/60 mb-5" size={44} />
        <h4 className="text-xl font-black text-white uppercase tracking-wider mb-2">
          {lang === 'ru' ? 'Авторизация' : 'Authorization'}
        </h4>
        <p className="text-white/60 mb-8 font-black uppercase tracking-widest text-xs max-w-md mx-auto">
          {t.sdkAuthRequiredMsg || (t as any).sdkAuthRequired || (lang === 'ru' ? 'Для доступа к Aha AI необходимо войти в аккаунт.' : 'Access to Aha AI requires signing in.')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <GoogleLoginButton lang={lang} />
          <button
            onClick={() => window.dispatchEvent(new Event('openEmailLogin'))}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#3d2b4f]/40 border border-[#3d2b4f] text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-[#ff4d4d] hover:text-[#15101e] hover:border-[#ff4d4d] transition-all active:scale-95 shadow-xl"
          >
            <Mail size={16} />
            {lang === 'ru' ? 'Зарегистрироваться через почту' : 'Register via email'}
          </button>
        </div>
      </div>
    );
  }

  const currentSuggestions = quickSuggestions[lang] || quickSuggestions['ru'];

  return (
    <div className="flex flex-col gap-4">
      <AdsBlock lang={lang} />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#251c35] rounded-3xl border border-[#3d2b4f] shadow-2xl flex overflow-hidden min-h-[600px] h-[calc(100vh-12rem)] w-full relative"
      >
      {/* Sidebar */}
      <div className="w-64 bg-[#15101e] border-r border-[#3d2b4f] flex flex-col hidden sm:flex shrink-0">
        <div className="p-4">
          <button
            onClick={handleCreateChat}
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
              <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1">
                <MessageSquare size={16} className="shrink-0 text-[#ff4d4d]" />
                <span className="truncate text-sm font-medium">{chat.title}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRenameChat(chat.id, chat.title);
                  }}
                  title={lang === 'ru' ? 'Переименовать' : 'Rename'}
                  className={`p-1 rounded hover:bg-gray-500/20 hover:text-white transition-colors ${activeChatId === chat.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                >
                  <Pencil size={12} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(chat.id);
                  }}
                  title={lang === 'ru' ? 'Удалить' : 'Delete'}
                  className={`p-1 rounded hover:bg-red-500/20 hover:text-red-400 transition-colors ${activeChatId === chat.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#3d2b4f]/50 bg-[#15101e]/50 shrink-0 min-w-0">
          <div className="flex items-center gap-3 min-w-0 mr-4">
            <Sparkles className="text-[#ff4d4d] shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold text-white truncate">
              {activeChat ? activeChat.title : ((t as any).sdkAhaRadio || t.siteName) + ' AI'}
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {activeChat && activeChat.messages.length > 0 && (
              <>
                <button
                  onClick={handleExportChat}
                  title={lang === 'ru' ? 'Скопировать чат' : 'Copy chat log'}
                  className="p-2 hover:bg-[#ff4d4d]/20 hover:text-[#ff4d4d] text-gray-400 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-medium"
                >
                  <Copy size={16} />
                  <span className="hidden md:inline">{lang === 'ru' ? 'Копировать' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleClearHistory}
                  title={lang === 'ru' ? 'Очистить историю' : 'Clear history'}
                  className="p-2 hover:bg-red-500/20 hover:text-red-400 text-gray-400 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-medium"
                >
                  <RotateCcw size={16} />
                  <span className="hidden md:inline">{lang === 'ru' ? 'Очистить' : 'Clear'}</span>
                </button>
              </>
            )}
            <button
              onClick={() => setIsSettingsOpen(true)}
              disabled={!activeChat}
              className="p-2 hover:bg-[#ff4d4d]/20 hover:text-[#ff4d4d] text-gray-400 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
            >
              <Settings size={18} />
              <span className="hidden sm:inline">{lang === 'ru' ? 'Промпт' : 'Prompt'}</span>
            </button>
            <button
              className="sm:hidden p-2 hover:bg-white/10 text-gray-400 rounded-lg transition-colors flex items-center justify-center relative"
              onClick={() => setIsMobileSidebarOpen(true)}
              title={lang === 'ru' ? 'Выбрать чат' : 'Select chat'}
            >
              <MessageSquare size={18} />
              {chats.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#ff4d4d] rounded-full animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-[#3d2b4f] scrollbar-track-transparent bg-[#15101e]/30"
        >
          {activeChat?.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 p-4 max-w-xl mx-auto">
              <Bot size={56} className="text-[#ff4d4d] animate-bounce" />
              <div>
                <p className="font-black text-white text-lg mb-1 uppercase tracking-wider">
                  {lang === 'ru' ? 'Безумный ИИ Ахи к твоим услугам! 🎉' : "Aha's Chaotic AI at your service! 🎉"}
                </p>
                <p className="text-gray-400 text-sm font-medium">
                  {lang === 'ru' ? 'Твои чаты автоматически сохраняются в облаке твоего аккаунта.' : 'Your chat sessions are fully stored in your cloud account.'}
                </p>
              </div>

              {/* Suggestions Grid */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {currentSuggestions.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(item.prompt)}
                    className="p-4 bg-[#15101e]/80 border border-[#3d2b4f] hover:border-[#ff4d4d] rounded-2xl text-left text-xs sm:text-sm text-gray-300 hover:text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-[0_0_15px_rgba(255,77,77,0.1)]"
                  >
                    <p className="font-bold mb-1 text-[#ff4d4d]">{item.label}</p>
                    <p className="text-gray-500 font-medium truncate">{item.prompt}</p>
                  </button>
                ))}
              </div>
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

        {/* Quick Prompts Grid */}
        {activeChat && (
          <div className="px-4 py-2.5 border-t border-[#3d2b4f]/30 bg-[#15101e]/40 shrink-0">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles size={12} className="text-[#ff4d4d]" />
              <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">
                {lang === 'ru' ? 'Быстрые запросы' : 'Quick Prompts'}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-[72px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#3d2b4f] scrollbar-track-transparent">
              {(quickPrompts[lang] || quickPrompts['ru']).map((promptItem, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleSuggestionClick(promptItem.prompt)}
                  className="px-3 py-1 bg-[#251c35]/50 hover:bg-[#ff4d4d]/10 border border-[#3d2b4f] hover:border-[#ff4d4d] text-[#ff4d4d]/90 hover:text-white rounded-xl text-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {promptItem.label}
                </button>
              ))}
            </div>
          </div>
        )}

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
            {!hasUnlimitedAccess && (
              <div className={`text-xs px-2 shrink-0 ${input.length > 250 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                {input.length}/250
              </div>
            )}
            <button 
              type="submit"
              disabled={!input.trim() || isProcessing || !activeChat || (!hasUnlimitedAccess && input.length > 250)}
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
                      placeholder={lang === 'ru' ? 'Введите инструкции, как должен вести себя ИИ в этом чате...' : 'Введите инструкции для ИИ...'}
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

        {/* Mobile Sidebar Overlay Drawer */}
        <AnimatePresence>
          {isMobileSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="absolute inset-0 z-50 bg-black/75 backdrop-blur-sm sm:hidden"
            >
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                onClick={(e) => e.stopPropagation()}
                className="w-72 h-full bg-[#15101e] border-r border-[#3d2b4f] flex flex-col p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare className="text-[#ff4d4d]" size={18} />
                    {lang === 'ru' ? 'Мои чаты' : 'My Chats'}
                  </h3>
                  <button
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="p-1.5 hover:bg-white/5 text-gray-400 hover:text-white rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <button
                  onClick={() => {
                    handleCreateChat();
                    setIsMobileSidebarOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-[#ff4d4d] hover:bg-white text-[#15101e] transition-colors py-3 px-4 rounded-xl font-bold text-sm shadow-[0_0_15px_rgba(255,77,77,0.2)]"
                >
                  <Plus size={18} />
                  {lang === 'ru' ? 'Новый чат' : 'New Chat'}
                </button>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-[#3d2b4f]">
                  {chats.map(chat => (
                    <div 
                      key={chat.id}
                      onClick={() => {
                        setActiveChatId(chat.id);
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                        activeChatId === chat.id 
                          ? 'bg-[#3d2b4f] text-white shadow-md' 
                          : 'text-gray-400 hover:bg-[#3d2b4f]/50 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1">
                        <MessageSquare size={16} className="shrink-0 text-[#ff4d4d]" />
                        <span className="truncate text-sm font-medium">{chat.title}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRenameChat(chat.id, chat.title);
                          }}
                          title={lang === 'ru' ? 'Переименовать' : 'Rename'}
                          className="p-1 rounded hover:bg-gray-500/20 hover:text-white transition-colors"
                        >
                          <Pencil size={12} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChat(chat.id);
                          }}
                          title={lang === 'ru' ? 'Удалить' : 'Delete'}
                          className="p-1 rounded hover:bg-red-500/20 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
    </div>
  );
};
