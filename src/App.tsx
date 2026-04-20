import React, { useState, useEffect, Suspense, lazy, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, Globe, LayoutDashboard, Ticket, RefreshCw, ListOrdered, Sparkles, User, MessageSquare, Radio, ServerCrash, Edit, Save, X, Settings } from 'lucide-react';
import { collection, addDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { logger, usePerfLogger } from './utils/logger';
import { handleFirestoreError, OperationType } from './utils/errorHandlers';
import { vercelFallback } from './utils/vercelFallback';
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
import { ChatWindow } from './components/chat/ChatWindow';
import { UserData } from './hooks/useUsers';

import { MaintenanceScreen } from './components/ui/MaintenanceScreen';
import { AhaSecurityBadge, SafeHtml } from './components/security/AhaSecurity';

// Lazy load sections for better performance
const TheoriesSection = lazy(() => import('./components/sections/TheoriesSection').then(m => ({ default: m.TheoriesSection })));
const BlogSection = lazy(() => import('./components/sections/BlogSection').then(m => ({ default: m.BlogSection })));
const ChronicleSection = lazy(() => import('./components/sections/ChronicleSection').then(m => ({ default: m.ChronicleSection })));
const PromoSection = lazy(() => import('./components/sections/PromoSection').then(m => ({ default: m.PromoSection })));
const UsersList = lazy(() => import('./components/admin/UsersList').then(m => ({ default: m.UsersList })));
const ChatsList = lazy(() => import('./components/chat/ChatsList').then(m => ({ default: m.ChatsList })));
const AhiRadio = lazy(() => import('./components/sections/AhiRadio').then(m => ({ default: m.AhiRadio })));
const ForumSection = lazy(() => import('./components/sections/ForumSection').then(m => ({ default: m.ForumSection })));
const AhiAiSection = lazy(() => import('./components/sections/AhiAiSection').then(m => ({ default: m.AhiAiSection })));
const SdkSettingsSection = lazy(() => import('./components/sections/SdkSettingsSection').then(m => ({ default: m.SdkSettingsSection })));

type Section = 'home' | 'theories' | 'blog' | 'chronicle' | 'promo' | 'users' | 'chats' | 'radio' | 'forum' | 'ai' | 'sdk';

let hasPrintedStopWarning = false;

import { Changelog } from './components/ui/Changelog';

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
  
  // Offline state
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackImage, setFeedbackImage] = useState<string | null>(null);

  // Filters
  const [theoryCategory, setTheoryCategory] = useState('all');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [offlineMode, setOfflineMode] = useState(() => !!localStorage.getItem('aha_quota_fallback'));

  useEffect(() => {
    const fallbackHandler = () => setOfflineMode(true);
    window.addEventListener('aha_quota_fallback_active', fallbackHandler);
    return () => window.removeEventListener('aha_quota_fallback_active', fallbackHandler);
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        setMaintenanceMode(docSnap.data().maintenanceMode || false);
      }
    });
    return () => unsub();
  }, []);
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

  // Home Page Content
  const [homeContent, setHomeContent] = useState<Record<string, string>>({});
  const [sdkContent, setSdkContent] = useState<Record<string, string>>({});
  const [changelogContent, setChangelogContent] = useState<Record<string, string>>({});
  
  const [isEditingHome, setIsEditingHome] = useState(false);
  const [editedHomeContent, setEditedHomeContent] = useState('');
  
  const [isEditingSdk, setIsEditingSdk] = useState(false);
  const [editedSdkContent, setEditedSdkContent] = useState('');
  
  const [isEditingChangelog, setIsEditingChangelog] = useState(false);
  const [editedChangelogContent, setEditedChangelogContent] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system_content', 'home_page'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setHomeContent(data.content || {});
        setSdkContent(data.sdk_content || {});
        setChangelogContent(data.changelog_content || {});
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'system_content/home_page');
    });
    return () => unsub();
  }, []);

  // Chat state
  const [activeChat, setActiveChat] = useState<{ uid: string, displayName: string, photoURL?: string } | null>(null);

  // Chat notifications
  const { chats } = useChat();
  const notifiedChats = useRef<Record<string, number>>({});
  const [unreadCount, setUnreadCount] = useState(0);

  const [showLoadWidget, setShowLoadWidget] = useState(() => {
    const saved = localStorage.getItem('showLoadWidget');
    return saved ? JSON.parse(saved) : false;
  });

  const toggleLoadWidget = () => {
    setShowLoadWidget((prev: boolean) => {
      const next = !prev;
      localStorage.setItem('showLoadWidget', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const isAuthorizedForMaintenance = role === 'admin' || role === 'moderator' || role === 'beta-tester';
    if (maintenanceMode && !isAuthorizedForMaintenance) {
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
          const title = t.newMessageTitle;
          setToast(title);
          
          // OS Notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
              body: t.newMessageBody,
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
    { id: 'forum' as const, label: t.navForum, icon: MessageSquare },
    { id: 'radio' as const, label: t.navRadio, icon: Radio },
    { id: 'theories', label: t.navTheories, icon: Book },
    { id: 'blog', label: t.navBlog, icon: Globe },
    { id: 'chronicle', label: t.navChronicle, icon: RefreshCw },
    { id: 'promo', label: t.navPromo, icon: Ticket },
    { id: 'chats' as const, label: t.navChats, icon: MessageSquare },
    { id: 'users' as const, label: t.navUsers, icon: User },
    { id: 'sdk', label: 'SDK', icon: Settings },
    { id: 'ai', label: 'Aha AI', icon: Sparkles },
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

  const handleSaveHomeContent = async () => {
    if (!role || (role !== 'admin' && role !== 'moderator')) return;
    try {
      await setDoc(doc(db, 'system_content', 'home_page'), {
        content: {
          ...homeContent,
          [lang]: editedHomeContent
        }
      }, { merge: true });
      setIsEditingHome(false);
      setToast(t.successSaved || 'Saved successfully');
    } catch (e) {
      console.error(e);
      setToast('Error saving changes');
    }
  };

  const handleSaveSdkContent = async () => {
    if (!role || (role !== 'admin' && role !== 'moderator')) return;
    try {
      await setDoc(doc(db, 'system_content', 'home_page'), {
        sdk_content: {
          ...sdkContent,
          [lang]: editedSdkContent
        }
      }, { merge: true });
      setIsEditingSdk(false);
      setToast(t.successSaved || 'Saved successfully');
    } catch (e) {
      console.error(e);
      setToast('Error saving changes');
    }
  };

  const handleSaveChangelogContent = async () => {
    if (!role || (role !== 'admin' && role !== 'moderator')) return;
    try {
      await setDoc(doc(db, 'system_content', 'home_page'), {
        changelog_content: {
          ...changelogContent,
          [lang]: editedChangelogContent
        }
      }, { merge: true });
      setIsEditingChangelog(false);
      setToast(t.successSaved || 'Saved successfully');
    } catch (e) {
      console.error(e);
      setToast('Error saving changes');
    }
  };

  const isAuthorizedForMaintenance = role === 'admin' || role === 'moderator' || role === 'beta-tester';

  if (!isLoading && maintenanceMode && !isAuthorizedForMaintenance) {
    return <MaintenanceScreen lang={lang as Language} />;
  }

  return (
    <div className={`min-h-[100dvh] flex flex-col relative overflow-x-hidden font-sans text-[#E0E0E0] ${productionMode ? 'production-visuals' : ''}`}>
      <LoadingScreen isLoading={isLoading} lang={lang as Language} lowPerfMode={lowPerfMode} />
      <Starfield lowPerfMode={lowPerfMode || !productionMode} />
      {showLoadWidget && <PerformanceWidget />}
      
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

      {/* Offline Banner */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-yellow-500/20 border-b border-yellow-500/50 text-yellow-500 px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2 relative z-20"
          >
            <RefreshCw className="w-4 h-4 animate-spin-slow" />
            {lang === 'ru' ? 'Нет подключения к интернету. Приложение работает в автономном режиме.' : 'No internet connection. App is running in offline mode.'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quota Exceeded / Fallback Mode Banner */}
      <AnimatePresence>
        {offlineMode && !isOffline && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`border-b px-4 py-2.5 text-center text-xs md:text-sm font-bold flex flex-col md:flex-row items-center justify-center gap-2 relative z-20 backdrop-blur-md ${vercelFallback.isConfigured() ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}
          >
            <div className="flex items-center gap-2">
              <ServerCrash className="w-4 h-4 animate-pulse" />
              {lang === 'ru' ? 'Сбой БД: превышен лимит или сервер недоступен.' : 'DB Error: Quota Exceeded or Offline.'}
            </div>
            
            {vercelFallback.isConfigured() ? (
                <span className="text-indigo-400/80 font-medium">
                  {lang === 'ru' ? 'Трафик успешно перенаправлен на Vercel KV. Чат и посты защищены от падения.' : 'Traffic successfully routed to Vercel KV bypass. Chat and posts are protected.'}
                </span>
            ) : (
                <span className="text-red-500/70 font-medium tracking-wide">
                  {lang === 'ru' ? 'Включен локальный режим. Настройте параметры Vercel KV в Secrets для сетевого обхода лимитов.' : 'Local fallback active. Set Vercel KV parameters in Secrets to bypass network limits.'}
                </span>
            )}
            
            <button 
              onClick={() => {
                localStorage.removeItem('aha_quota_fallback');
                setOfflineMode(false);
                window.location.reload();
              }}
              className={`ml-auto underline text-[10px] uppercase tracking-widest hover:opacity-100 ${vercelFallback.isConfigured() ? 'text-indigo-400/50 hover:text-indigo-400' : 'text-[#ff4d4d]/50 hover:text-[#ff4d4d]'}`}
            >
              Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
            <Suspense fallback={<div className="flex justify-center p-12"><div className="w-10 h-10 border-4 border-[#ff4d4d] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(255,77,77,0.3)]"></div></div>}>
              {section === 'home' && (
                <div className="bg-[#251c35] rounded-2xl p-8 shadow-xl border border-[#3d2b4f]">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-3xl font-bold text-[#ff4d4d]">{t.homeTitle}</h2>
                    {role && (role === 'admin' || role === 'moderator') && !isEditingHome && (
                      <button 
                        onClick={() => { setEditedHomeContent(homeContent[lang] || t.homeDesc); setIsEditingHome(true); }}
                        className="p-2 bg-black/20 hover:bg-black/40 rounded-lg text-gray-400 hover:text-white border border-[#3d2b4f] transition-all"
                        title="Edit Page Content"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                  </div>
                  
                  {isEditingHome ? (
                    <div className="mb-6 space-y-4">
                      <textarea
                        value={editedHomeContent}
                        onChange={(e) => setEditedHomeContent(e.target.value)}
                        className="w-full bg-[#15101e] border border-[#3d2b4f] rounded-xl p-4 text-gray-200 min-h-[150px] focus:outline-none focus:border-[#ff4d4d]"
                        placeholder="Page content (HTML allowed)..."
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setIsEditingHome(false)} className="px-4 py-2 hover:bg-[#3d2b4f] rounded-xl text-sm font-medium transition-colors text-white">
                          <X size={16} className="inline mr-1 -mt-0.5" /> {t.cancelBtn || 'Cancel'}
                        </button>
                        <button onClick={handleSaveHomeContent} className="px-4 py-2 bg-[#ff4d4d] hover:bg-[#ff7a7a] text-[#15101e] rounded-xl text-sm font-black tracking-wide transition-colors">
                          <Save size={16} className="inline mr-1 -mt-0.5" /> {t.saveBtn || 'Save'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <SafeHtml html={homeContent[lang] || t.homeDesc} className="text-gray-300 mb-6 leading-relaxed" />
                  )}
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-8">
                    <RefreshCw size={14} />
                    {t.lastUpdate}
                  </div>

                  {/* Changelog Section */}
                  <div className="relative group mt-12">
                    <div className="flex justify-end mb-2 relative z-10 w-full h-0 top-12 right-6">
                      {role && (role === 'admin' || role === 'moderator') && !isEditingChangelog && (
                        <button 
                          onClick={() => { setEditedChangelogContent(changelogContent[lang] || ''); setIsEditingChangelog(true); }}
                          className="opacity-0 group-hover:opacity-100 p-2 bg-[#251c35] hover:bg-[#3d2b4f] rounded-lg text-gray-400 hover:text-white border border-[#ff4d4d]/20 transition-all absolute"
                          title="Edit Changelog"
                        >
                          <Edit size={16} />
                        </button>
                      )}
                    </div>
                    {isEditingChangelog ? (
                      <div className="mt-8 space-y-4">
                        <textarea
                          value={editedChangelogContent}
                          onChange={(e) => setEditedChangelogContent(e.target.value)}
                          className="w-full bg-[#15101e] border border-[#ff4d4d]/30 rounded-xl p-4 text-gray-200 min-h-[250px] focus:outline-none focus:border-[#ff4d4d] font-mono text-sm"
                          placeholder="HTML Changelog Content (Overrides Default)..."
                        />
                        <div className="flex justify-end gap-2 pb-4">
                          <button onClick={() => setIsEditingChangelog(false)} className="px-4 py-2 hover:bg-[#3d2b4f] rounded-xl text-sm font-medium transition-colors text-white">
                            <X size={16} className="inline mr-1 -mt-0.5" /> {t.cancelBtn || 'Cancel'}
                          </button>
                          <button onClick={handleSaveChangelogContent} className="px-4 py-2 bg-[#ff4d4d] hover:bg-[#ff7a7a] text-[#15101e] rounded-xl text-sm font-black tracking-wide transition-colors">
                            <Save size={16} className="inline mr-1 -mt-0.5" /> {t.saveBtn || 'Save'}
                          </button>
                        </div>
                      </div>
                    ) : changelogContent[lang] ? (
                      <div className="mt-8 p-6 rounded-2xl bg-[#15101e]/50 border border-[#3d2b4f]/50 text-gray-300 leading-relaxed">
                        <SafeHtml html={changelogContent[lang]} />
                      </div>
                    ) : (
                      <Changelog lang={lang as Language} />
                    )}
                  </div>
                </div>
              )}

              {section === 'forum' && (
                <ForumSection 
                  lang={lang as Language}
                  onOpenChat={(uid, name) => setActiveChat({ uid, displayName: name })}
                  role={role}
                />
              )}

              {section === 'radio' && (
                <AhiRadio lang={lang as Language} />
              )}

              {section === 'ai' && (
                <AhiAiSection lang={lang as Language} />
              )}

              {section === 'sdk' && (
                <SdkSettingsSection 
                  lang={lang as Language}
                  productionMode={productionMode}
                  toggleProductionMode={toggleProductionMode}
                  lowPerfMode={lowPerfMode}
                  toggleLowPerfMode={toggleLowPerfMode}
                  showLoadWidget={showLoadWidget}
                  toggleLoadWidget={toggleLoadWidget}
                  role={role}
                />
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
                  <h2 className="text-2xl font-bold text-[#ff4d4d] mb-6">{t.navUsers}</h2>
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
                  <h2 className="text-3xl font-black text-[#ff4d4d] uppercase tracking-widest mb-8 flex items-center gap-3">
                    <MessageSquare size={32} />
                    {t.navChats}
                  </h2>
                  <div className="bg-[#251c35] rounded-3xl p-6 border border-[#3d2b4f] shadow-2xl">
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
            className="fixed bottom-8 left-1/2 z-50 bg-[#ff4d4d] text-[#15101e] px-8 py-4 rounded-2xl font-black shadow-2xl border-2 border-white/20 uppercase tracking-widest text-sm"
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

      <AhaSecurityBadge />
    </div>
  );
}
