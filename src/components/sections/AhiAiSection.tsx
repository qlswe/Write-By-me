import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ChevronRight, Lock, Trash2, Plus, MessageSquare, Settings, X, Bot, User, Mail, Pencil, Copy, RotateCcw, Bookmark, BookmarkCheck, Wifi, WifiOff, Cloud, CloudOff, Database, Mic, MicOff } from 'lucide-react';
import { sdk } from '../../sdk';
import { Language, translations } from '../../data/translations';
import { useAuth } from '../../hooks/useAuth';
import { GoogleLoginButton } from '../ui/GoogleLoginButton';
import { useAiChats } from '../../hooks/useAiChats';
import { useLimits } from '../../hooks/useLimits';
import { AdsBlock } from '../ui/AdsBlock';
import { useAiMemories } from '../../hooks/useAiMemories';

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
  ],
  by: [
    { label: 'Касмічны анекдот 🌌', prompt: 'Раскажы вар\'яцкі і вясёлы касмічны анекдот!' },
    { label: 'Тэорыя змовы HSR 🔮', prompt: 'Прыдумай самую абсурдную і смешную фанацкую тэорыю змовы па гульні Honkai: Star Rail!' },
    { label: 'Былд на персанажа HSR 🎮', prompt: 'Дапамажы скласці круты або эфектыўны былд для любога персанажа!' },
    { label: 'Ода богу Радасці Ахе 🎉', prompt: 'Напішы натхняльную, вясёлую і хаатычную оду або верш Эону Радасці Ахе!' }
  ],
  de: [
    { label: 'Kosmischer Witz 🌌', prompt: 'Erzähle mir einen verrückten und lustigen kosmischen Witz!' },
    { label: 'HSR Verschwörungstheorie 🔮', prompt: 'Erfinde die absurdeste und lustigste Fan-Verschwörungstheorie zu Honkai: Star Rail!' },
    { label: 'Charakter-Build HSR 🎮', prompt: 'Hilf mir, einen tollen oder verrückten Build für einen Charakter deiner Wahl zu erstellen!' },
    { label: 'Ode an Aha die Elation 🎉', prompt: 'Schreibe ein inspirierendes, lustiges und chaotisches Gedicht an Aha, den Äon der Freude!' }
  ],
  fr: [
    { label: 'Blague cosmique 🌌', prompt: 'Raconte-moi une blague cosmique folle et drôle !' },
    { label: 'Théorie du complot HSR 🔮', prompt: 'Invente la théorie du complot la plus absurde et hilarante sur Honkai: Star Rail !' },
    { label: 'Build de personnage HSR 🎮', prompt: 'Aide-moi à concevoir un build amusant ou efficace pour un personnage de ton choix !' },
    { label: 'Ode à Aha le Ravissement 🎉', prompt: 'Écris un poème inspirant, drôle et chaotique à Aha, l\'Éon du Ravissement !' }
  ],
  zh: [
    { label: '宇宙笑话 🌌', prompt: '给我讲一个疯狂又好笑的宇宙笑话！' },
    { label: '崩铁阴谋论 🔮', prompt: '构思一个关于《崩坏：星穹铁道》最荒谬搞笑的粉丝阴谋论！' },
    { label: '崩铁角色配装 🎮', prompt: '帮我为你选择的任意角色设计一套有趣又强力的配装！' },
    { label: '欢愉阿哈赞歌 🎉', prompt: '写一首献给欢愉星神阿哈的具有启发性、搞笑又混乱的诗歌！' }
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
  ],
  by: [
    { label: 'Тлумач апошнюю падзею 🌌', prompt: 'Плумач, што адбылося ў апошнім буйным абнаўленні Honkai: Star Rail?' },
    { label: 'Прапануй тэорыю 🔮', prompt: 'Прапануй фанацкую тэорыю пра сапраўдныя матывы Эона Радасці Ахі.' },
    { label: 'Лепшы былд на Ахерон ⚡', prompt: 'Парадзь лепшы былд для Ахерон у HSR.' },
    { label: 'Анекдот пра Пом-Пом 🚂', prompt: 'Раскажы вясёлы анекдот пра Пом-Пом і Першапраходца.' },
    { label: 'Хто такія Недарэкі ў масках? 🎭', prompt: 'Раскажы, хто такія Недарэкі ў масках і чаму яны служаць Ахе?' },
    { label: 'Касмічная парада дня 💫', prompt: 'Дай мне касмічнае прадказанне або параду дня ад імя Ахі!' }
  ],
  de: [
    { label: 'Erkläre das letzte Event 🌌', prompt: 'Kannst du erklären, was im neuesten Update von Honkai: Star Rail passiert ist?' },
    { label: 'Schlage eine Theorie vor 🔮', prompt: 'Schlage eine verrückte Theorie über die wahren Motive von Aha vor.' },
    { label: 'Bester Acheron-Build ⚡', prompt: 'Empfehle den besten Build für Acheron in HSR.' },
    { label: 'Pom-Pom Witz 🚂', prompt: 'Erzähle einen lustigen Witz über Pom-Pom und den Weltfahrer.' },
    { label: 'Wer sind die Maskierten Narren? 🎭', prompt: 'Erzähle mir, wer die Maskierten Narren sind und warum sie Aha folgen.' },
    { label: 'Kosmischer Rat des Tages 💫', prompt: 'Gib mir eine kosmische Vorhersage oder einen Rat des Tages im Namen von Aha!' }
  ],
  fr: [
    { label: 'Expliquer le dernier événement 🌌', prompt: 'Peux-tu expliquer ce qui s\'est passé dans la dernière mise à jour de Honkai: Star Rail ?' },
    { label: 'Suggérer une théorie 🔮', prompt: 'Propose une théorie folle sur les vrais motifs d\'Aha le Ravissement.' },
    { label: 'Meilleur build Acheron ⚡', prompt: 'Recommande le meilleur build pour Acheron dans HSR.' },
    { label: 'Blague de Pom-Pom 🚂', prompt: 'Raconte une blague hilarante sur Pom-Pom et le Pionnier.' },
    { label: 'Qui sont les Fous Masqués ? 🎭', prompt: 'Dis-moi qui sont les Fous Masqués et pourquoi ils suivent Aha.' },
    { label: 'Conseil cosmique du jour 💫', prompt: 'Donne-moi une prédiction cosmique ou un conseil du jour de la part d\'Aha !' }
  ],
  zh: [
    { label: '解释最近的大事件 🌌', prompt: '能解释一下《崩坏：星穹铁道》最新版本更新中发生了什么吗？' },
    { label: '提出一个猜想 🔮', prompt: '提出一个关于欢愉星神阿哈真正动机的疯狂猜想。' },
    { label: '黄泉最佳配装 ⚡', prompt: '推荐崩铁中黄泉的最佳且最有意思的配装。' },
    { label: '帕姆搞笑段子 🚂', prompt: '讲一个关于帕姆和开拓者的搞笑温馨段子。' },
    { label: '假面愚者是谁？ 🎭', prompt: '告诉我假面愚者是什么人，他们为什么追随阿哈。' },
    { label: '今日宇宙忠告 💫', prompt: '以阿哈的名义给我一个混乱的宇宙预言或今日忠告！' }
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
  const { memories, saveMemory, deleteMemory, updateMemoryTitle, isSyncing, isOffline } = useAiMemories();

  const [activeView, setActiveView] = useState<'chat' | 'memory'>('chat');
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState('');
  
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [systemPromptInput, setSystemPromptInput] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Voice Input (Web Speech API)
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      setSpeechSupported(true);
      const rec = new SpeechRecognitionClass();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = lang === 'ru' ? 'ru-RU' : 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        if (resultText) {
          setInput(prev => prev + (prev ? ' ' : '') + resultText);
        }
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [lang]);

  // Make sure we stop listening if the user switches chats or active view
  useEffect(() => {
    return () => {
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
    };
  }, [activeChatId, activeView, isListening]);

  const toggleVoiceInput = () => {
    if (!speechSupported || !recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

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
            description: tAny.blogSubTitle || 'Официальные новости, патчноуты и личные заметки администрации.'
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
      <div className="bg-[#15101e]/80 border border-[#3d2b4f]/60 rounded-3xl p-6 sm:p-10 text-center max-w-xl mx-auto my-12 backdrop-blur-md shadow-2xl">
        <Lock className="mx-auto text-[#ff4d4d]/70 mb-4" size={40} />
        <h4 className="text-xl font-black text-white uppercase tracking-wider mb-2">
          {lang === 'ru' ? 'Авторизация' : 'Authorization'}
        </h4>
        <p className="text-gray-300 mb-6 font-bold uppercase tracking-wider text-xs max-w-sm mx-auto leading-relaxed">
          {t.sdkAuthRequiredMsg || (t as any).sdkAuthRequired || (lang === 'ru' ? 'Для доступа к Aha AI необходимо войти в аккаунт.' : 'Access to Aha AI requires signing in.')}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center w-full max-w-md mx-auto">
          <GoogleLoginButton lang={lang} className="w-full sm:w-auto" size="md" />
          <button
            onClick={() => window.dispatchEvent(new Event('openEmailLogin'))}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#3d2b4f]/50 border border-[#3d2b4f] text-white rounded-2xl font-black uppercase tracking-wider text-xs hover:bg-[#ff4d4d] hover:text-[#15101e] hover:border-[#ff4d4d] transition-all active:scale-95 shadow-xl cursor-pointer"
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
        {/* Navigation Tabs */}
        <div className="p-4 pb-2 grid grid-cols-2 gap-1 border-b border-[#3d2b4f]/30">
          <button
            onClick={() => {
              setActiveView('chat');
              setIsMobileSidebarOpen(false);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center uppercase tracking-wider ${
              activeView === 'chat' 
                ? 'bg-[#ff4d4d] text-[#15101e] shadow-md' 
                : 'bg-transparent text-gray-400 hover:text-white hover:bg-[#3d2b4f]/30'
            }`}
          >
            {lang === 'ru' ? 'Чаты' : 'Chats'}
          </button>
          <button
            onClick={() => {
              setActiveView('memory');
              setIsMobileSidebarOpen(false);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center uppercase tracking-wider relative flex items-center justify-center gap-1 ${
              activeView === 'memory' 
                ? 'bg-[#ff4d4d] text-[#15101e] shadow-md' 
                : 'bg-transparent text-gray-400 hover:text-white hover:bg-[#3d2b4f]/30'
            }`}
          >
            {lang === 'ru' ? 'Память' : 'Memory'}
            {memories.length > 0 && (
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                activeView === 'memory' ? 'bg-[#15101e] text-[#ff4d4d]' : 'bg-[#ff4d4d] text-[#15101e]'
              }`}>
                {memories.length}
              </span>
            )}
          </button>
        </div>

        {activeView === 'chat' ? (
          <>
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
          </>
        ) : (
          <div className="p-4 text-xs text-gray-400 space-y-3 font-medium">
            <p className="font-bold text-white uppercase text-[10px] tracking-wider mb-2">
              {lang === 'ru' ? 'Хранилище' : 'Storage'}
            </p>
            <div className="p-3 bg-[#251c35] border border-[#3d2b4f] rounded-2xl space-y-2">
              <div className="flex items-center gap-1.5">
                <Database size={14} className="text-[#ff4d4d]" />
                <span className="font-bold text-gray-200">IndexedDB AI Memory</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                {lang === 'ru' 
                  ? 'Сохраненные диалоги доступны офлайн и автоматически синхронизируются при восстановлении сети.' 
                  : 'Saved dialogues are accessible offline and auto-sync when network is restored.'}
              </p>
              <div className="pt-1.5 border-t border-[#3d2b4f]/40 flex items-center gap-1.5 text-[10px] text-[#ff4d4d]">
                <Sparkles size={11} className="animate-pulse" />
                <span>
                  {lang === 'ru'
                    ? 'Автоочистка локального кэша (>7 дн) активна'
                    : 'Auto-cleanup of local cache (>7 days) active'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      {activeView === 'chat' ? (
        <div className="flex-1 flex flex-col relative min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#3d2b4f]/50 bg-[#15101e]/50 shrink-0 min-w-0">
          <div className="flex items-center gap-3 min-w-0 mr-4">
            <Sparkles className="text-[#ff4d4d] shrink-0" />
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-white truncate">
                {activeChat ? activeChat.title : ((t as any).sdkAhaRadio || t.siteName) + ' AI'}
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 w-fit" title="Все запросы к ИИ маршрутизируются через Cloud Run сервер в Европе, гарантируя стабильную работу в РФ без ВПН">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {lang === 'ru' ? 'Работает в РФ без ВПН' : 'RF Cloud Proxy Active'}
              </span>
            </div>
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
              <motion.div
                animate={{ y: [0, -8, 0], rotate: [0, -5, 5, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="p-4 rounded-3xl bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 shadow-[0_0_30px_rgba(255,77,77,0.2)]"
              >
                <Bot size={52} className="text-[#ff4d4d]" />
              </motion.div>
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
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSuggestionClick(item.prompt)}
                    className="p-4 bg-[#15101e]/80 border border-[#3d2b4f] hover:border-[#ff4d4d] rounded-2xl text-left text-xs sm:text-sm text-gray-300 hover:text-white transition-all shadow-md hover:shadow-[0_0_20px_rgba(255,77,77,0.2)] cursor-pointer"
                  >
                    <p className="font-bold mb-1 text-[#ff4d4d]">{item.label}</p>
                    <p className="text-gray-500 font-medium truncate">{item.prompt}</p>
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            activeChat?.messages.map((item, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 15, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 350, damping: 26 }}
                className={`flex w-full ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {item.role === 'user' && (
                  <div className="bg-[#ff4d4d] text-[#15101e] px-4 py-3 rounded-2xl rounded-tr-sm max-w-[90%] sm:max-w-[75%] shadow-lg">
                    <p className="text-sm md:text-base font-medium break-words whitespace-pre-wrap">{item.content}</p>
                  </div>
                )}
                {item.role === 'assistant' && (() => {
                  const precedingMsg = activeChat?.messages[i - 1];
                  const promptText = precedingMsg && precedingMsg.role === 'user' ? precedingMsg.content : '';
                  const alreadySaved = memories.some(m => m.prompt === promptText && m.response === item.content);
                  
                  return (
                    <div className="flex items-start gap-3 w-full max-w-[95%] sm:max-w-[85%] group/msg">
                      <div className="w-8 h-8 rounded-full bg-[#15101e] border border-[#ff4d4d]/30 flex items-center justify-center shrink-0 mt-1">
                        <Bot size={16} className="text-[#ff4d4d]" />
                      </div>
                      <div className="bg-[#15101e] border border-[#3d2b4f] text-gray-200 px-5 py-4 rounded-2xl rounded-tl-sm text-sm md:text-base break-words whitespace-pre-wrap shadow-xl relative flex-1">
                        {item.content}
                        
                        {promptText && (
                          <button
                            type="button"
                            onClick={() => {
                              if (alreadySaved) {
                                const foundMem = memories.find(m => m.prompt === promptText && m.response === item.content);
                                if (foundMem) deleteMemory(foundMem.id);
                              } else {
                                saveMemory(promptText, item.content);
                              }
                            }}
                            className={`absolute right-3 top-3 p-1 rounded hover:bg-[#3d2b4f] transition-all ${
                              alreadySaved 
                                ? 'text-[#ff4d4d] opacity-100' 
                                : 'text-gray-500 hover:text-white opacity-0 group-hover/msg:opacity-100 focus:opacity-100 transition-opacity'
                            }`}
                            title={alreadySaved ? (lang === 'ru' ? 'Удалить из памяти' : 'Remove from memory') : (lang === 'ru' ? 'Сохранить в память' : 'Save to memory')}
                          >
                            {alreadySaved ? <BookmarkCheck size={16} className="fill-current" /> : <Bookmark size={16} />}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
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
              </motion.div>
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
              placeholder={isListening ? (lang === 'ru' ? 'Слушаю... говорите!' : 'Listening... speak now!') : (t.sdkAskAi || (t as any).sdkAskAI || "Сообщение...")}
              className="flex-1 min-w-0 bg-transparent border-none outline-none px-3 py-2 text-sm sm:text-base text-white placeholder-gray-500"
              disabled={!activeChat}
            />
            {!hasUnlimitedAccess && (
              <div className={`text-xs px-2 shrink-0 ${input.length > 250 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                {input.length}/250
              </div>
            )}
            {speechSupported && (
              <button
                type="button"
                onClick={toggleVoiceInput}
                disabled={!activeChat}
                className={`shrink-0 p-2.5 rounded-xl transition-all active:scale-95 flex items-center justify-center ${
                  isListening 
                    ? 'bg-[#ff4d4d] text-[#15101e] animate-pulse shadow-[0_0_15px_rgba(255,77,77,0.5)] border border-[#ff4d4d]' 
                    : 'bg-[#251c35] text-[#ff4d4d] border border-[#3d2b4f] hover:border-[#ff4d4d] hover:bg-[#ff4d4d]/10 hover:text-white'
                }`}
                title={isListening ? (lang === 'ru' ? 'Остановить запись' : 'Stop voice input') : (lang === 'ru' ? 'Голосовой ввод' : 'Voice input')}
              >
                <Mic size={18} className={isListening ? "animate-bounce" : ""} />
              </button>
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
      </div>
      ) : (
        /* AI Memories List Panel */
        <div className="flex-1 flex flex-col relative min-w-0 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#3d2b4f]/50 bg-[#15101e]/50 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <Database className="text-[#ff4d4d]" />
              <h2 className="text-lg sm:text-xl font-black text-white truncate uppercase tracking-wider">
                {lang === 'ru' ? 'Память ИИ' : 'AI Memory'}
              </h2>
            </div>
            
            {/* Sync Badge / Connection status */}
            <div className="flex items-center gap-2 text-xs">
              {isSyncing ? (
                <span className="flex items-center gap-1.5 text-yellow-400 bg-yellow-500/10 px-3 py-1.5 rounded-full border border-yellow-500/20 animate-pulse font-bold">
                  <Sparkles size={12} className="animate-spin" />
                  {lang === 'ru' ? 'Синхронизация...' : 'Syncing...'}
                </span>
              ) : isOffline ? (
                <span className="flex items-center gap-1.5 text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20 font-bold">
                  <WifiOff size={12} />
                  {lang === 'ru' ? 'Офлайн' : 'Offline'}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-green-400 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20 font-bold">
                  <Wifi size={12} className="animate-pulse" />
                  {lang === 'ru' ? 'В сети (Синхронизировано)' : 'Online (Synced)'}
                </span>
              )}
              
              <button
                className="sm:hidden p-2 hover:bg-white/10 text-gray-400 rounded-lg transition-colors flex items-center justify-center relative"
                onClick={() => setIsMobileSidebarOpen(true)}
                title={lang === 'ru' ? 'Выбрать чат' : 'Select chat'}
              >
                <MessageSquare size={18} />
              </button>
            </div>
          </div>

          {/* Memories List */}
          <div className="flex-1 p-4 sm:p-6 space-y-6 bg-[#15101e]/30">
            {memories.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto p-4 py-16">
                <Bookmark size={56} className="text-gray-600" />
                <p className="font-bold text-white text-lg">
                  {lang === 'ru' ? 'Память ИИ пока пуста' : 'AI Memory is empty'}
                </p>
                <p className="text-gray-400 text-sm">
                  {lang === 'ru' 
                    ? 'Сохраняйте важные сообщения ИИ во время общения в чате. Они будут доступны офлайн в любой момент!' 
                    : 'Save important responses during your chat sessions. They will be fully accessible offline!'}
                </p>
                <button
                  onClick={() => setActiveView('chat')}
                  className="px-5 py-2.5 bg-[#ff4d4d] text-[#15101e] rounded-xl font-bold text-sm hover:bg-white transition-all active:scale-95"
                >
                  {lang === 'ru' ? 'Перейти в чат' : 'Go to Chat'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {memories.map((mem) => (
                  <div 
                    key={mem.id}
                    className="bg-[#251c35] border border-[#3d2b4f] hover:border-[#ff4d4d]/50 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 relative group transition-all animate-fadeIn"
                  >
                    {/* Top action row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {editingMemoryId === mem.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editTitleInput}
                              onChange={(e) => setEditTitleInput(e.target.value)}
                              className="bg-[#15101e] border border-[#ff4d4d] rounded px-2 py-1 text-xs text-white outline-none w-full font-bold"
                              maxLength={40}
                              autoFocus
                            />
                            <button
                              onClick={() => {
                                updateMemoryTitle(mem.id, editTitleInput);
                                setEditingMemoryId(null);
                              }}
                              className="px-2 py-1 bg-[#ff4d4d] text-[#15101e] hover:bg-white rounded text-[10px] font-black transition-all"
                            >
                              OK
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 group/title">
                            <h3 className="font-bold text-white text-sm truncate uppercase tracking-wide">
                              {mem.title}
                            </h3>
                            <button
                              onClick={() => {
                                setEditingMemoryId(mem.id);
                                setEditTitleInput(mem.title);
                              }}
                              className="p-1 text-gray-500 hover:text-white transition-colors"
                              title={lang === 'ru' ? 'Редактировать название' : 'Edit title'}
                            >
                              <Pencil size={11} />
                            </button>
                          </div>
                        )}
                        <span className="text-[10px] text-gray-500 font-mono block mt-1">
                          {new Date(mem.createdAt).toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US')}
                        </span>
                      </div>

                      {/* Sync Badge */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {mem.synced ? (
                          <span className="text-green-400 text-[10px] bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20 font-bold flex items-center gap-1" title="Synced to Firebase">
                            <Cloud size={10} />
                            Cloud
                          </span>
                        ) : (
                          <span className="text-yellow-400 text-[10px] bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20 font-bold flex items-center gap-1 animate-pulse" title="Saved locally, pending sync">
                            <CloudOff size={10} />
                            Local
                          </span>
                        )}
                        <button
                          onClick={() => deleteMemory(mem.id)}
                          className="p-1.5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-lg transition-colors"
                          title={lang === 'ru' ? 'Удалить из памяти' : 'Delete memory'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Content view */}
                    <div className="space-y-3 flex-1">
                      <div className="bg-[#15101e]/50 rounded-xl p-3 border border-[#3d2b4f]/30">
                        <span className="text-[10px] font-black uppercase text-[#ff4d4d]/80 tracking-widest block mb-1">
                          {lang === 'ru' ? 'Запрос' : 'Prompt'}
                        </span>
                        <p className="text-xs text-gray-300 line-clamp-2 break-words">
                          {mem.prompt}
                        </p>
                      </div>

                      <div className="bg-[#15101e]/80 rounded-xl p-3 border border-[#3d2b4f]/60 relative">
                        <span className="text-[10px] font-black uppercase text-green-400 tracking-widest block mb-1">
                          {lang === 'ru' ? 'Ответ ИИ' : 'AI Response'}
                        </span>
                        <p className="text-xs text-gray-200 line-clamp-4 break-words font-medium leading-relaxed">
                          {mem.response}
                        </p>
                        
                        {/* Copy memory content */}
                        <button
                          onClick={() => {
                            const fullText = `Prompt: ${mem.prompt}\n\nResponse: ${mem.response}`;
                            navigator.clipboard.writeText(fullText);
                            alert(lang === 'ru' ? 'Содержание памяти скопировано!' : 'Memory content copied!');
                          }}
                          className="absolute right-2 bottom-2 p-1 hover:bg-[#3d2b4f] text-gray-500 hover:text-white rounded transition-colors"
                          title="Copy content"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
                <div className="flex items-center justify-between gap-2">
                  <div className="grid grid-cols-2 gap-1 w-full mr-1 bg-[#15101e] p-1 border border-[#3d2b4f] rounded-xl">
                    <button
                      onClick={() => setActiveView('chat')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-black transition-all text-center uppercase tracking-wider ${
                        activeView === 'chat' 
                          ? 'bg-[#ff4d4d] text-[#15101e]' 
                          : 'bg-transparent text-gray-400 hover:text-white'
                      }`}
                    >
                      {lang === 'ru' ? 'Чаты' : 'Chats'}
                    </button>
                    <button
                      onClick={() => setActiveView('memory')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-black transition-all text-center uppercase tracking-wider relative flex items-center justify-center gap-1 ${
                        activeView === 'memory' 
                          ? 'bg-[#ff4d4d] text-[#15101e]' 
                          : 'bg-transparent text-gray-400 hover:text-white'
                      }`}
                    >
                      {lang === 'ru' ? 'Память' : 'Memory'}
                      {memories.length > 0 && (
                        <span className="bg-[#ff4d4d] text-[#15101e] text-[9px] px-1 rounded-full font-black">
                          {memories.length}
                        </span>
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="p-1.5 hover:bg-white/5 text-gray-400 hover:text-white rounded-lg transition-colors shrink-0"
                  >
                    <X size={20} />
                  </button>
                </div>

                {activeView === 'chat' ? (
                  <>
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
                  </>
                ) : (
                  <div className="p-4 text-xs text-gray-400 space-y-3 font-medium">
                    <p className="font-bold text-white uppercase text-[10px] tracking-wider mb-2">
                      {lang === 'ru' ? 'Хранилище' : 'Storage'}
                    </p>
                    <div className="p-3 bg-[#251c35] border border-[#3d2b4f] rounded-2xl space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Database size={14} className="text-[#ff4d4d]" />
                        <span className="font-bold text-gray-200">IndexedDB AI Memory</span>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-relaxed">
                        {lang === 'ru' 
                          ? 'Сохраненные диалоги доступны офлайн и автоматически синхронизируются при восстановлении сети.' 
                          : 'Saved dialogues are accessible offline and auto-sync when network is restored.'}
                      </p>
                      <div className="pt-1.5 border-t border-[#3d2b4f]/40 flex items-center gap-1.5 text-[10px] text-[#ff4d4d]">
                        <Sparkles size={11} className="animate-pulse" />
                        <span>
                          {lang === 'ru'
                            ? 'Автоочистка локального кэша (>7 дн) активна'
                            : 'Auto-cleanup of local cache (>7 days) active'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
