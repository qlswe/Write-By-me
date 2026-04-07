import React, { useState, useEffect, Suspense, lazy, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, Globe, LayoutDashboard, Ticket, RefreshCw, ListOrdered, Sparkles, User, MessageSquare } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import { logger, usePerfLogger } from './utils/logger';
import { handleFirestoreError, OperationType } from './utils/errorHandlers';
import { Starfield } from './components/Starfield';
import { Language, translations } from './data/translations';
import { useAuth } from './hooks/useAuth';
import { useUserData } from './hooks/useUserData';
import { useContent } from './hooks/useContent';
import { useChat, Chat } from './hooks/useChat';
import { useTranslation } from 'react-i18next';
import { sdk } from './sdk';

// Components
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { PromoBanner } from './components/ui/PromoBanner';
import { ProfileModal } from './components/ui/ProfileModal';
import { ContentModal } from './components/ui/ContentModal';
import { FeedbackModal } from './components/ui/FeedbackModal';
import { PerformanceWidget } from './components/ui/PerformanceWidget';
import { TheoryEditor } from './components/sections/TheoryEditor';
import { BlogEditor } from './components/sections/BlogEditor';
import { EventEditor } from './components/sections/EventEditor';
import { PromoEditor } from './components/sections/PromoEditor';
import { SDKPanel } from './components/SDKPanel';
import { ChatWindow } from './components/chat/ChatWindow';
import { UserData } from './hooks/useUsers';

// Lazy load sections for better performance
const TheoriesSection = lazy(() => import('./components/sections/TheoriesSection').then(m => ({ default: m.TheoriesSection })));
const BlogSection = lazy(() => import('./components/sections/BlogSection').then(m => ({ default: m.BlogSection })));
const ChronicleSection = lazy(() => import('./components/sections/ChronicleSection').then(m => ({ default: m.ChronicleSection })));
const PromoSection = lazy(() => import('./components/sections/PromoSection').then(m => ({ default: m.PromoSection })));
const UsersList = lazy(() => import('./components/admin/UsersList').then(m => ({ default: m.UsersList })));
const ChatsList = lazy(() => import('./components/chat/ChatsList').then(m => ({ default: m.ChatsList })));

type Section = 'home' | 'theories' | 'blog' | 'chronicle' | 'promo' | 'users' | 'chats';

let hasPrintedStopWarning = false;

export default function App() {
  const { trackRender } = usePerfLogger('App');
  trackRender();

  const { user, loading: authLoading, error: authError } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [section, setSection] = useState<Section>('home');
  
  useEffect(() => {
    if (authError) {
      setToast(authError);
    }
  }, [authError]);

  useEffect(() => {
    sdk.logging.action('Section Change', { section });
  }, [section]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{id?: string, title: string, content: string} | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  // User Data (Syncs with Firebase)
  const { favorites, toggleFavorite, clearFavorites, lang, updateLang, lowPerfMode, toggleLowPerfMode, isDataLoaded, role } = useUserData('ru');
  const { theories, blogPosts, events, promoCodes } = useContent();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang, i18n]);

  // Production Mode (High Fidelity)
  const [productionMode, setProductionMode] = useState(() => localStorage.getItem('productionMode') === 'true');

  const toggleProductionMode = () => {
    const newVal = !productionMode;
    setProductionMode(newVal);
    localStorage.setItem('productionMode', String(newVal));
    setToast(newVal ? t.sdkModeProduction : t.sdkModeMain);
    sdk.logging.action('Toggle Production Mode', { enabled: newVal });
  };

  // Feedback state
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'bug' | 'suggestion'>('bug');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackImage, setFeedbackImage] = useState<string | null>(null);

  // Filters
  const [theoryCategory, setTheoryCategory] = useState('all');
  const [theorySearch, setTheorySearch] = useState('');
  const [blogCategory, setBlogCategory] = useState('all');
  const [blogSearch, setBlogSearch] = useState('');

  // Editor state
  const [editingTheory, setEditingTheory] = useState<any | null>(null);
  const [isCreatingTheory, setIsCreatingTheory] = useState(false);
  const [editingBlog, setEditingBlog] = useState<any | null>(null);
  const [isCreatingBlog, setIsCreatingBlog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [editingPromo, setEditingPromo] = useState<any | null>(null);

  // Profile state
  const [profileOpen, setProfileOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<UserData | null>(null);

  // Chat state
  const [activeChat, setActiveChat] = useState<{ uid: string, displayName: string, photoURL?: string } | null>(null);

  // Chat notifications
  const { chats } = useChat();
  const notifiedChats = useRef<Record<string, number>>({});
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Request notification permission on load
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    let count = 0;
    
    chats.forEach(chat => {
      const lastMessageAt = chat.lastMessageAt?.toMillis?.() || 0;
      const lastReadAt = chat.lastReadAt?.[user.uid]?.toMillis?.() || 0;
      
      if (lastMessageAt > lastReadAt) {
        count++;
      }

      const lastNotified = notifiedChats.current[chat.id] || 0;
      
      // If there's a new message and we're not currently chatting with this user
      if (lastMessageAt > lastNotified && lastMessageAt > lastReadAt) {
        const otherUserId = chat.participants.find(id => id !== user.uid);
        if (activeChat?.uid !== otherUserId) {
          const title = lang === 'ru' ? 'Новое сообщение!' : 'New message!';
          setToast(title);
          
          // OS Notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
              body: lang === 'ru' ? 'У вас новое непрочитанное сообщение.' : 'You have a new unread message.',
              icon: '/favicon.ico'
            });
          }

          // Optional: play a sound here
          try {
            const audio = new Audio('/notification.mp3');
            audio.play().catch(() => {});
          } catch (e) {}
        }
        notifiedChats.current[chat.id] = lastMessageAt;
      }
    });

    setUnreadCount(count);
  }, [chats, user, activeChat, lang]);

  const t = translations[lang as Language];

  useEffect(() => {
    document.documentElement.classList.add('dark');
    
    // Console Warning
    if (!hasPrintedStopWarning) {
      console.log(
        "%cОСТАНОВИТЕСЬ! %cНе используйте консоль не по назначению. Незнание может привести к непредсказуемым последствиям.",
        "color: red; font-size: 40px; font-weight: bold; text-shadow: 2px 2px black;",
        "color: white; font-size: 20px; font-weight: bold;"
      );
      hasPrintedStopWarning = true;
    }

    if (lowPerfMode) {
      document.body.classList.add('low-perf-mode');
    } else {
      document.body.classList.remove('low-perf-mode');
    }

    if (productionMode) {
      document.body.classList.add('production-mode');
    } else {
      document.body.classList.remove('production-mode');
    }

    const handleOpenChatEvent = (e: any) => {
      setActiveChat(e.detail);
    };

    const handleOpenProfileEvent = (e: any) => {
      setViewingUser(e.detail);
      setProfileOpen(true);
    };

    window.addEventListener('openChat', handleOpenChatEvent);
    window.addEventListener('openProfile', handleOpenProfileEvent);
    
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    const isDismissed = localStorage.getItem('hideInstallBanner') === 'true';
    if (!isStandalone && !isDismissed) {
      setShowBanner(true);
    }

    // Hide loader after auth and data are loaded, or after a timeout
    const loaderTimer = setTimeout(() => setIsLoading(false), 2500);
    if (!authLoading && isDataLoaded) {
      setIsLoading(false);
      clearTimeout(loaderTimer);
    }
    
    return () => {
      clearTimeout(loaderTimer);
      window.removeEventListener('openChat', handleOpenChatEvent);
      window.removeEventListener('openProfile', handleOpenProfileEvent);
    };
  }, [authLoading, isDataLoaded, lowPerfMode, productionMode]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const navItems = [
    { id: 'home', label: t.navHome, icon: LayoutDashboard },
    { id: 'theories', label: t.navTheories, icon: Book },
    { id: 'blog', label: t.navBlog, icon: Globe },
    { id: 'chronicle', label: t.navChronicle, icon: RefreshCw },
    { id: 'promo', label: t.navPromo, icon: Ticket },
    { id: 'chats' as const, label: t.navChats, icon: MessageSquare },
    { id: 'users' as const, label: t.navUsers, icon: User },
  ] as const;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setToast(t.copySuccess);
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim()) return;
    
    try {
      const logsString = logger.getLogsString();
      
      const subject = encodeURIComponent(`Feedback (${feedbackType})`);
      const body = encodeURIComponent(
        `Type: ${feedbackType}\n\n` +
        `Message:\n${feedbackText}\n\n` +
        `[Please attach the downloaded crashlog.txt file to this email if applicable]`
      );
      
      // Download logs as a file
      const blob = new Blob([logsString], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'crashlog.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      window.location.href = `mailto:semegladysev527@gmail.com?subject=${subject}&body=${body}`;

      setFeedbackOpen(false);
      setFeedbackText('');
      setFeedbackImage(null);
      setToast(t.feedbackSuccess || "Opening email client...");
    } catch (error) {
      console.error(error);
      setToast("Error submitting feedback. Please try again.");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setToast("Image too large (max 5MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFeedbackImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCloseBanner = () => {
    setShowBanner(false);
    localStorage.setItem('hideInstallBanner', 'true');
  };

  return (
    <div className={`min-h-screen flex flex-col relative overflow-x-hidden font-sans text-[#E0E0E0] ${productionMode ? 'production-visuals' : ''}`}>
      <LoadingScreen isLoading={isLoading} lang={lang as Language} lowPerfMode={lowPerfMode} />
      <SDKPanel 
        lang={lang as Language} 
        productionMode={productionMode}
        toggleProductionMode={toggleProductionMode}
        lowPerfMode={lowPerfMode}
        toggleLowPerfMode={toggleLowPerfMode}
      />
      <Starfield lowPerfMode={lowPerfMode || !productionMode} />
      <PerformanceWidget />
      
      <Header 
        lang={lang as Language} 
        setLang={updateLang} 
        section={section} 
        setSection={setSection} 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen} 
        navItems={navItems} 
        favorites={favorites}
        clearFavorites={clearFavorites}
        lowPerfMode={lowPerfMode}
        toggleLowPerfMode={toggleLowPerfMode}
        role={role}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 relative z-10">
        <PromoBanner showBanner={showBanner} lang={lang as Language} setModalContent={setModalContent} onClose={handleCloseBanner} />

        <AnimatePresence mode="wait">
          <motion.div
            key={section}
            initial={lowPerfMode ? { opacity: 1, y: 0 } : { opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={lowPerfMode ? { opacity: 1, y: 0 } : { opacity: 0, y: -20, scale: 0.98 }}
            transition={lowPerfMode ? { duration: 0 } : { duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            <Suspense fallback={<div className="flex justify-center p-12"><div className="w-10 h-10 border-4 border-[#C3A6E6] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(195,166,230,0.3)]"></div></div>}>
              {section === 'home' && (
                <div className="bg-[#3E3160]/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-[#5C4B8B]">
                  <h2 className="text-3xl font-bold text-[#C3A6E6] mb-4">{t.homeTitle}</h2>
                  <p className="text-gray-300 mb-6 leading-relaxed" dangerouslySetInnerHTML={{ __html: t.homeDesc }} />
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-8">
                    <RefreshCw size={14} />
                    {t.lastUpdate}
                  </div>

                  {/* SDK Info Section */}
                  <div className="mt-12 p-6 rounded-xl bg-black/20 border border-[#C3A6E6]/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-[#C3A6E6]/10 text-[#C3A6E6]">
                        <Sparkles size={20} />
                      </div>
                      <h3 className="text-xl font-bold text-[#C3A6E6]">{sdk.help.getUsage(lang as Language).title}</h3>
                    </div>
                    <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                      {sdk.help.getUsage(lang as Language).description}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-[#C3A6E6] uppercase tracking-widest">{lang === 'ru' ? 'Возможности' : 'Features'}</h4>
                        <ul className="text-xs text-gray-500 space-y-1 list-disc pl-4">
                          {sdk.help.getUsage(lang as Language).useCases.slice(0, 4).map((useCase, i) => (
                            <li key={i}>{useCase.split(':')[0]}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-[#C3A6E6] uppercase tracking-widest">{lang === 'ru' ? 'Как начать?' : 'How to start?'}</h4>
                        <p className="text-[10px] font-mono text-gray-500">
                          {sdk.help.getUsage(lang as Language).gettingStarted}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {section === 'theories' && (
                <TheoriesSection 
                  lang={lang as Language}
                  theoryCategory={theoryCategory}
                  setTheoryCategory={setTheoryCategory}
                  theorySearch={theorySearch}
                  setTheorySearch={setTheorySearch}
                  favorites={favorites}
                  toggleFavorite={toggleFavorite}
                  lowPerfMode={lowPerfMode}
                  theories={theories}
                  onEdit={setEditingTheory}
                  onCreate={() => setIsCreatingTheory(true)}
                  onOpenChat={(uid, name) => setActiveChat({ uid, displayName: name })}
                  role={role}
                />
              )}

              {section === 'blog' && (
                <BlogSection 
                  lang={lang as Language}
                  blogCategory={blogCategory}
                  setBlogCategory={setBlogCategory}
                  blogSearch={blogSearch}
                  setBlogSearch={setBlogSearch}
                  favorites={favorites}
                  toggleFavorite={toggleFavorite}
                  lowPerfMode={lowPerfMode}
                  blogPosts={blogPosts}
                  onEdit={setEditingBlog}
                  onCreate={() => setIsCreatingBlog(true)}
                  onOpenChat={(uid, name) => setActiveChat({ uid, displayName: name })}
                  role={role}
                />
              )}

              {section === 'chronicle' && (
                <ChronicleSection 
                  lang={lang as Language} 
                  lowPerfMode={lowPerfMode} 
                  events={events}
                  onEdit={setEditingEvent}
                  onCreate={() => setIsCreatingEvent(true)}
                  role={role}
                />
              )}
              {section === 'promo' && (
                <PromoSection 
                  lang={lang as Language} 
                  handleCopy={handleCopy} 
                  promoCodes={promoCodes} 
                  role={role} 
                  onOpenEditor={() => setEditingPromo({})}
                  onEdit={setEditingPromo}
                />
              )}
              {section === 'users' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#C3A6E6] mb-6">{t.navUsers}</h2>
                  <UsersList 
                    lang={lang as Language} 
                    onOpenChat={(uid, name) => setActiveChat({ uid, displayName: name })} 
                    onViewProfile={(user) => {
                      setViewingUser(user);
                      setProfileOpen(true);
                    }}
                  />
                </div>
              )}
              {section === 'chats' && (
                <div className="max-w-2xl mx-auto">
                  <h2 className="text-3xl font-black text-[#C3A6E6] uppercase tracking-widest mb-8 flex items-center gap-3">
                    <MessageSquare size={32} />
                    {t.navChats}
                  </h2>
                  <div className="bg-[#3E3160]/90 backdrop-blur-sm rounded-3xl p-6 border border-[#5C4B8B] shadow-2xl">
                    <ChatsList lang={lang as Language} onSelectChat={(id, name) => setActiveChat({ uid: id, displayName: name })} />
                  </div>
                </div>
              )}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer lang={lang as Language} setFeedbackOpen={setFeedbackOpen} />

      <FeedbackModal 
        lang={lang as Language}
        feedbackOpen={feedbackOpen}
        setFeedbackOpen={setFeedbackOpen}
        feedbackType={feedbackType}
        setFeedbackType={setFeedbackType}
        feedbackText={feedbackText}
        setFeedbackText={setFeedbackText}
        feedbackImage={feedbackImage}
        setFeedbackImage={setFeedbackImage}
        handleImageUpload={handleImageUpload}
        handleFeedbackSubmit={handleFeedbackSubmit}
      />

      <ContentModal modalContent={modalContent} setModalContent={setModalContent} lang={lang as Language} />
      
      <ProfileModal
        isOpen={profileOpen}
        onClose={() => {
          setProfileOpen(false);
          setViewingUser(null);
        }}
        lang={lang as Language}
        viewUser={viewingUser}
      />
      
      {/* Active Chat Window */}
      <AnimatePresence>
        {activeChat && (
          <ChatWindow
            recipientId={activeChat.uid}
            recipientName={activeChat.displayName}
            recipientPhoto={activeChat.photoURL}
            lang={lang as Language}
            onClose={() => setActiveChat(null)}
          />
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-8 left-1/2 z-50 bg-[#C3A6E6] text-[#2F244F] px-8 py-4 rounded-2xl font-black shadow-2xl border-2 border-white/20 uppercase tracking-widest text-sm"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(isCreatingTheory || editingTheory) && (
          <TheoryEditor 
            theory={editingTheory} 
            onClose={() => {
              setIsCreatingTheory(false);
              setEditingTheory(null);
            }} 
            lang={lang as Language}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(isCreatingBlog || editingBlog) && (
          <BlogEditor 
            post={editingBlog} 
            onClose={() => {
              setIsCreatingBlog(false);
              setEditingBlog(null);
            }} 
            lang={lang as Language}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {(isCreatingEvent || editingEvent) && (
          <EventEditor 
            event={editingEvent} 
            onClose={() => {
              setIsCreatingEvent(false);
              setEditingEvent(null);
            }} 
            lang={lang as Language}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {editingPromo && (
          <PromoEditor 
            lang={lang as Language} 
            role={role} 
            initialPromo={editingPromo.id ? editingPromo : null}
            onClose={() => setEditingPromo(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
