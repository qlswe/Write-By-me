import React, { useState, useEffect, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, Globe, LayoutDashboard, Ticket, RefreshCw, ListOrdered, Sparkles, User, MessageSquare, Radio, ServerCrash, Edit, Save, X, Settings, Palette, Activity, Calendar, Shield, Target, BarChart2, Smartphone } from 'lucide-react';
import { collection, addDoc, doc, onSnapshot, setDoc, getDoc, enableNetwork } from 'firebase/firestore';
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
import { decrypt } from './utils/encryption';
import { dbQueryCore } from './utils/dbQueryCore';
import { usePWA } from './hooks/usePWA';
import { applyPrimaryAccentColor } from './utils/theme';
import { initPageVisibilityOptimizer } from './utils/performanceOptimizer';
import { applyFontSizeToDocument } from './hooks/useFontSize';

// Components
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { PromoBanner } from './components/ui/PromoBanner';
import { ProfileModal } from './components/ui/ProfileModal';
import { ContentModal } from './components/ui/ContentModal';
import { FeedbackModal } from './components/ui/FeedbackModal';
import { PerformanceWidget } from './components/ui/PerformanceWidget';
import { PwaInstallModal } from './components/ui/PwaInstallModal';
import { TheoryEditor } from './components/sections/TheoryEditor';
import { BlogEditor } from './components/sections/BlogEditor';
import { EventEditor } from './components/sections/EventEditor';
import { PromoEditor } from './components/sections/PromoEditor';
import { ChatWindow } from './components/chat/ChatWindow';
import { UserData } from './hooks/useUsers';

import { HomeStatsWidget } from './components/ui/HomeStatsWidget';
import { QuickActionsMenu } from './components/ui/QuickActionsMenu';
import { MaintenanceScreen } from './components/ui/MaintenanceScreen';
import { AhaSecurityBadge, SafeHtml } from './components/security/AhaSecurity';
import { DisguisePage } from './components/security/DisguisePage';
import { DevConsoleWidget } from './components/ui/DevConsoleWidget';

const getMillis = (val: any): number => {
  if (!val) return 0;
  if (typeof val.toMillis === 'function') return val.toMillis();
  if (typeof val.toDate === 'function') return val.toDate().getTime();
  if (val instanceof Date) return val.getTime();
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return new Date(val).getTime();
  if (typeof val.seconds === 'number') return val.seconds * 1000 + Math.floor((val.nanoseconds || 0) / 1000000);
  return 0;
};

// Direct imports for instant section switching without Suspense lag
import { TheoriesSection } from './components/sections/TheoriesSection';
import { BlogSection } from './components/sections/BlogSection';
import { ChronicleSection } from './components/sections/ChronicleSection';
import { PromoSection } from './components/sections/PromoSection';
import { UsersList } from './components/admin/UsersList';
import { ChatsList } from './components/chat/ChatsList';
import { CyberChatWorkspace } from './components/chat/CyberChatWorkspace';
import { ForumSection } from './components/sections/ForumSection';
import { AhiAiSection } from './components/sections/AhiAiSection';
import { SdkSettingsSection } from './components/sections/SdkSettingsSection';
import { CanvasSection } from './components/sections/CanvasSection';
import { TelemetrySection } from './components/sections/TelemetrySection';

type Section = 'home' | 'theories' | 'blog' | 'chronicle' | 'promo' | 'users' | 'chats' | 'forum' | 'ai' | 'sdk' | 'canvas' | 'telemetry';

let hasPrintedStopWarning = false;

import { Changelog } from './components/ui/Changelog';
import { logUserTelemetry } from './utils/telemetry';

export default function App() {
  const { trackRender } = usePerfLogger('App');
  trackRender();

  const { user, loading: authLoading, error: authError, isBlocked, deviceId } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [section, setSection] = useState<Section>('home');
  const [prevSection, setPrevSection] = useState<Section>('home');
  
  useEffect(() => {
    if (section !== 'ai') {
      setPrevSection(section);
    }
  }, [section]);
  
  useEffect(() => {
    if (authError) {
      setToast(authError);
    }
  }, [authError]);

  useEffect(() => {
    sdk.logging.action('Section Change', { section });
    logUserTelemetry(user?.uid, user?.email, user?.displayName || 'Guest', section);
  }, [section, user]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{id?: string, title: string, content: string} | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  // User Data (Syncs with Firebase)
  const { favorites, toggleFavorite, clearFavorites, lang, updateLang, lowPerfMode, toggleLowPerfMode, isDataLoaded, role } = useUserData('ru');
  const { theories, blogPosts, events, promoCodes, isLoadingTheories, isLoadingBlog, isLoadingEvents } = useContent();
  const { i18n } = useTranslation();
  const { canInstall, isInstalled, installPWA } = usePWA();
  const [homePwaModalOpen, setHomePwaModalOpen] = useState(false);

  useEffect(() => {
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang, i18n]);

  // Restore accessible reading font size on mount
  useEffect(() => {
    const savedFont = localStorage.getItem('aha_reading_font_size');
    if (savedFont) {
      const parsed = parseInt(savedFont, 10);
      if (!isNaN(parsed) && parsed >= 80 && parsed <= 150) {
        applyFontSizeToDocument(parsed);
      }
    }
  }, []);

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

  // Panic / Camouflage Mode
  const [isPanicked, setIsPanicked] = useState(() => localStorage.getItem('aha_panic_mode') === 'true');

  useEffect(() => {
    const checkPanic = () => {
      setIsPanicked(localStorage.getItem('aha_panic_mode') === 'true');
    };
    window.addEventListener('storage', checkPanic);
    window.addEventListener('aha_panic_triggered', checkPanic);
    return () => {
      window.removeEventListener('storage', checkPanic);
      window.removeEventListener('aha_panic_triggered', checkPanic);
    };
  }, []);

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

  // Sync re-validation state
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncNow = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    
    try {
      // 1. Re-enable network connection in Firestore if disabled
      try {
        await enableNetwork(db);
      } catch (e) {
        console.warn('enableNetwork error:', e);
      }

      // 2. Perform test connection probe to Firestore
      const testDocRef = doc(db, 'settings', 'general');
      await getDoc(testDocRef);

      // 3. Update network and offline fallback status
      if (navigator.onLine) {
        setIsOffline(false);
        localStorage.removeItem('aha_quota_fallback');
        setOfflineMode(false);
        
        window.dispatchEvent(new CustomEvent('aha_toast', {
          detail: lang === 'ru' ? 'Подключение к Firestore успешно восстановлено!' : 'Firestore connection successfully restored!'
        }));
      } else {
        window.dispatchEvent(new CustomEvent('aha_toast', {
          detail: lang === 'ru' ? 'Сетевое подключение всё ещё отсутствует.' : 'Network connection is still offline.'
        }));
      }
    } catch (error: any) {
      console.warn('Sync re-validation attempt result:', error);
      if (navigator.onLine) {
        setIsOffline(false);
        window.dispatchEvent(new CustomEvent('aha_toast', {
          detail: lang === 'ru' ? 'Сеть доступна! Попытка повторной синхронизации...' : 'Network is online! Attempting re-sync...'
        }));
      } else {
        window.dispatchEvent(new CustomEvent('aha_toast', {
          detail: lang === 'ru' ? 'Не удалось подключиться к серверу. Проверьте сеть.' : 'Failed to connect to server. Check connection.'
        }));
      }
    } finally {
      setTimeout(() => {
        setIsSyncing(false);
      }, 600);
    }
  };
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
    initPageVisibilityOptimizer();

    // Apply cached accent color immediately before Firestore responds
    try {
      const cachedAccent = localStorage.getItem('aha_primary_accent');
      if (cachedAccent) applyPrimaryAccentColor(cachedAccent);
    } catch (e) {}

    let isMounted = true;
    let reloadTimer: NodeJS.Timeout | null = null;

    const unsub = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (!isMounted) return;
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMaintenanceMode(data.maintenanceMode || false);

        // Apply primary accent color from Firestore
        if (data.primaryAccentColor) {
          applyPrimaryAccentColor(data.primaryAccentColor);
        } else {
          applyPrimaryAccentColor('#ff4d4d');
        }
        
        // Listen for global fallback flag from admin
        if (data.forceKVFallback) {
          if (!localStorage.getItem('aha_quota_fallback')) {
            localStorage.setItem('aha_quota_fallback', Date.now().toString());
            setOfflineMode(true);
            window.dispatchEvent(new Event('aha_quota_fallback_active'));
            if (reloadTimer) clearTimeout(reloadTimer);
            reloadTimer = setTimeout(() => {
              if (isMounted) window.location.reload();
            }, 500); // Reload to clean Firebase listeners
          }
        } else if (data.forceKVFallback === false) {
          const fallbackCreated = localStorage.getItem('aha_quota_fallback');
          if (fallbackCreated) {
             localStorage.removeItem('aha_quota_fallback');
             setOfflineMode(false);
             if (reloadTimer) clearTimeout(reloadTimer);
             reloadTimer = setTimeout(() => {
               if (isMounted) window.location.reload();
             }, 500);
          }
        }

        if (data.massRestartTimestamp) {
          const lastRestart = localStorage.getItem('aha_last_restart');
          if (!lastRestart || parseInt(lastRestart, 10) < data.massRestartTimestamp) {
            localStorage.setItem('aha_last_restart', Date.now().toString());
            if (isMounted) window.location.reload();
          }
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/general');
    });

    return () => {
      isMounted = false;
      unsub();
      if (reloadTimer) clearTimeout(reloadTimer);
    };
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
    let isMounted = true;
    const unsub = onSnapshot(doc(db, 'system_content', 'home_page'), (docSnap) => {
      if (!isMounted) return;
      if (docSnap.exists()) {
        const data = docSnap.data();
        setHomeContent(data.content || {});
        setSdkContent(data.sdk_content || {});
        setChangelogContent(data.changelog_content || {});
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'system_content/home_page');
    });

    const fetchFallback = async () => {
      if (vercelFallback.isAvailable()) {
        try {
          const fallbackData = await vercelFallback.lrange('system_content_home_page', 0, 1);
          if (fallbackData && fallbackData.length > 0 && isMounted) {
            const data = typeof fallbackData[0] === 'string' ? JSON.parse(fallbackData[0]) : fallbackData[0];
            if (data.content) setHomeContent(data.content);
            if (data.sdk_content) setSdkContent(data.sdk_content);
            if (data.changelog_content) setChangelogContent(data.changelog_content);
          }
        } catch (e) {}
      }
    };
    fetchFallback();
    const fallbackInterval = setInterval(fetchFallback, 15000);

    return () => {
      isMounted = false;
      unsub();
      clearInterval(fallbackInterval);
    };
  }, []);

  // Chat state
  const [activeChat, setActiveChat] = useState<{ uid: string, displayName: string, photoURL?: string } | null>(null);

  // Chat notifications
  const { chats } = useChat();
  const notifiedChats = useRef<Record<string, number>>({});
  const notifiedTyping = useRef<Record<string, boolean>>({});
  const notifiedTypingTime = useRef<Record<string, number>>({});
  const notifiedReads = useRef<Record<string, number>>({});
  const [profileNames, setProfileNames] = useState<Record<string, string>>({});
  const fetchingProfiles = useRef<Record<string, boolean>>({});
  const [unreadCount, setUnreadCount] = useState(0);

  const [showLoadWidget, setShowLoadWidget] = useState(() => {
    const saved = localStorage.getItem('showLoadWidget');
    return saved ? JSON.parse(saved) : false;
  });

  const [isConsoleOpen, setIsConsoleOpen] = useState(false);

  const toggleLoadWidget = () => {
    setShowLoadWidget((prev: boolean) => {
      const next = !prev;
      localStorage.setItem('showLoadWidget', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    let isMounted = true;

    if (!user) {
      setUnreadCount(0);
      return () => { isMounted = false; };
    }

    const isAuthorizedForMaintenance = role === 'admin' || role === 'moderator' || role === 'beta-tester';
    if (maintenanceMode && !isAuthorizedForMaintenance) {
      setUnreadCount(0);
      return () => { isMounted = false; };
    }

    let count = 0;
    
    chats.forEach((chat) => {
      const lastMessageAt = getMillis(chat.lastMessageAt);
      const myReadAt = getMillis(chat.lastReadAt?.[user.uid]);
      const otherUserId = chat.participants.find(id => id !== user.uid);
      if (!otherUserId) return;
      
      if (lastMessageAt > myReadAt) {
        count++;
      }

      const lastNotified = notifiedChats.current[chat.id] || 0;
      
      // Fetch profile safely and only once using batched query core
      if (!profileNames[otherUserId] && !fetchingProfiles.current[otherUserId]) {
        fetchingProfiles.current[otherUserId] = true;
        dbQueryCore.getProfileBatched(otherUserId).then(data => {
          if (!isMounted) return;
          if (data) {
            const name = data.displayName || 'User';
            setProfileNames(prev => {
              if (prev[otherUserId] === name) return prev;
              return { ...prev, [otherUserId]: name };
            });
          }
        }).catch(() => {
          if (isMounted) fetchingProfiles.current[otherUserId] = false;
        });
      }

      const senderName = profileNames[otherUserId] || 'User';
      const isNotActiveChat = activeChat?.uid !== otherUserId;

      const getChatNotificationText = (type: 'new_message' | 'typing', sName: string, msgBody?: string) => {
        if (lang === 'ru') {
          if (type === 'new_message') return `${sName}: ${msgBody || 'У вас новое непрочитанное сообщение.'}`;
          if (type === 'typing') return `${sName} печатает...`;
        } else if (lang === 'by') {
          if (type === 'new_message') return `${sName}: ${msgBody || 'У вас новае непрачытанае паведамленне.'}`;
          if (type === 'typing') return `${sName} друкуе...`;
        } else if (lang === 'de') {
          if (type === 'new_message') return `${sName}: ${msgBody || 'Neue Nachricht.'}`;
          if (type === 'typing') return `${sName} schreibt...`;
        } else if (lang === 'fr') {
          if (type === 'new_message') return `${sName}: ${msgBody || 'Nouveau message.'}`;
          if (type === 'typing') return `${sName} écrit...`;
        } else if (lang === 'zh') {
          if (type === 'new_message') return `${sName}: ${msgBody || '您有一条新消息。'}`;
          if (type === 'typing') return `${sName} 正在输入...`;
        } else {
          // English (default)
          if (type === 'new_message') return `${sName}: ${msgBody || 'You have a new unread message.'}`;
          if (type === 'typing') return `${sName} is typing...`;
        }
        return '';
      };

      // 1. New Message (In-app only, no system/push notifications or permission prompts)
      if (lastMessageAt > lastNotified && lastMessageAt > myReadAt) {
        if (isNotActiveChat && isMounted) {
          const decryptedBody = chat.lastMessage ? decrypt(chat.lastMessage, chat.id) : '';
          const bodyText = decryptedBody || (((translations as any)[lang] && (translations as any)[lang].newMessageBody) || (lang === 'ru' ? 'Новое сообщение' : "You have a new unread message."));
          setToast(getChatNotificationText('new_message', senderName, bodyText));
          
          try { const audio = new Audio('/notification.mp3'); audio.play().catch(() => {}); } catch (e) {}
        }
        notifiedChats.current[chat.id] = lastMessageAt;
      }

      // 2. Typing Indicator (Status notification, shown sparingly - NOT ALWAYS)
      const isTyping = !!chat.typing?.[otherUserId];
      const wasTyping = !!notifiedTyping.current[chat.id];
      if (isTyping && !wasTyping && isNotActiveChat) {
        const lastTypingToast = notifiedTypingTime.current[chat.id] || 0;
        const now = Date.now();
        if (now - lastTypingToast > 60000 && isMounted) { // Throttle status notifications to at most once per 60 seconds
          setToast(getChatNotificationText('typing', senderName));
          notifiedTypingTime.current[chat.id] = now;
        }
      }
      notifiedTyping.current[chat.id] = isTyping;

      // 3. Read Receipts (Status Notification - DISABLED AS REQUESTED)
      const theirReadAt = getMillis(chat.lastReadAt?.[otherUserId]);
      const lastNotifiedRead = notifiedReads.current[chat.id] || 0;
      if (theirReadAt > lastNotifiedRead && theirReadAt >= lastMessageAt && lastMessageAt > 0 && isNotActiveChat) {
        // "Не уведомляй о прочитанном сообщении, бесполезно"
        notifiedReads.current[chat.id] = theirReadAt;
      } else if (!notifiedReads.current[chat.id]) {
        notifiedReads.current[chat.id] = theirReadAt; // initial sync
      }
    });

    if (isMounted) setUnreadCount(count);

    return () => {
      isMounted = false;
    };
  }, [chats, user, activeChat, lang, role, maintenanceMode]);

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

    // Hide loader after auth and data are loaded, or after a quick timeout
    const loaderTimer = setTimeout(() => setIsLoading(false), 800);
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
    const handleToast = ((e: CustomEvent) => setToast(e.detail)) as EventListener;
    window.addEventListener('aha_toast', handleToast);
    return () => window.removeEventListener('aha_toast', handleToast);
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (section === 'telemetry' && role !== 'admin') {
      setSection('home');
    }
    if ((section as string) === 'radio' || (section as string) === 'nato') {
      setSection('home');
    }
  }, [section, role]);

  const navItems = [
    { id: 'home', label: t.navHome, icon: LayoutDashboard },
    { id: 'forum' as const, label: t.navForum, icon: Activity },
    { id: 'canvas' as const, label: t.navCanvas || 'Aha Canvas', icon: Palette },
    { id: 'theories', label: t.navTheories, icon: Book },
    { id: 'blog', label: t.navBlog, icon: Globe },
    { id: 'chronicle' as const, label: t.navChronicle || 'Хроника событий', icon: Calendar },
    { id: 'promo' as const, label: t.navPromo || 'Промокоды', icon: Ticket },
    { id: 'chats' as const, label: t.navChats, icon: MessageSquare },
    { id: 'users' as const, label: t.navUsers, icon: User },
    ...(role === 'admin' ? [{ id: 'telemetry' as const, label: lang === 'ru' ? 'Статистика' : 'Telemetry', icon: BarChart2 }] : []),
    { id: 'sdk', label: 'SDK', icon: Settings },
    { id: 'ai', label: 'Aha AI', icon: Sparkles },
  ];

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

      window.location.href = `mailto:support@ministry.aha?subject=${subject}&body=${body}`;

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
      const payload = {
        content: {
          ...homeContent,
          [lang]: editedHomeContent
        }
      };
      
      if (vercelFallback.isAvailable()) {
         await vercelFallback.lpush('system_content_home_page', JSON.stringify({
            content: { ...homeContent, [lang]: editedHomeContent },
            sdk_content: sdkContent,
            changelog_content: changelogContent
         }));
      } else {
        await setDoc(doc(db, 'system_content', 'home_page'), payload, { merge: true });
      }
      setIsEditingHome(false);
      setToast('Saved successfully');
    } catch (e) {
      console.error(e);
      setToast('Error saving changes');
    }
  };

  const handleSaveSdkContent = async () => {
    if (!role || (role !== 'admin' && role !== 'moderator')) return;
    try {
      const payload = {
        sdk_content: {
          ...sdkContent,
          [lang]: editedSdkContent
        }
      };
      
      if (vercelFallback.isAvailable()) {
         await vercelFallback.lpush('system_content_home_page', JSON.stringify({
            content: homeContent,
            sdk_content: { ...sdkContent, [lang]: editedSdkContent },
            changelog_content: changelogContent
         }));
      } else {
        await setDoc(doc(db, 'system_content', 'home_page'), payload, { merge: true });
      }
      setIsEditingSdk(false);
      setToast('Saved successfully');
    } catch (e) {
      console.error(e);
      setToast('Error saving changes');
    }
  };

  const handleSaveChangelogContent = async () => {
    if (!role || (role !== 'admin' && role !== 'moderator')) return;
    try {
      const payload = {
        changelog_content: {
          ...changelogContent,
          [lang]: editedChangelogContent
        }
      };

      if (vercelFallback.isAvailable()) {
         await vercelFallback.lpush('system_content_home_page', JSON.stringify({
            content: homeContent,
            sdk_content: sdkContent,
            changelog_content: { ...changelogContent, [lang]: editedChangelogContent }
         }));
      } else {
        await setDoc(doc(db, 'system_content', 'home_page'), payload, { merge: true });
      }
      setIsEditingChangelog(false);
      setToast('Saved successfully');
    } catch (e) {
      console.error(e);
      setToast('Error saving changes');
    }
  };

  const isAuthorizedForMaintenance = role === 'admin' || role === 'moderator' || role === 'beta-tester';

  if (isBlocked && role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#0d0b14] text-white flex items-center justify-center p-6 relative overflow-hidden font-sans">
        <Starfield lowPerfMode={false} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[#15101e] border border-red-500/40 rounded-3xl p-8 text-center space-y-6 shadow-[0_0_50px_rgba(239,68,68,0.2)] relative z-10"
        >
          <div className="w-16 h-16 bg-red-500/20 border border-red-500/40 text-red-500 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <Shield size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black uppercase tracking-tight text-white">
              {lang === 'ru' ? 'Доступ заблокирован' : 'Access Blocked'}
            </h1>
            <p className="text-xs text-gray-400 leading-relaxed">
              {lang === 'ru'
                ? 'Ваш аккаунт или устройство было заблокировано администратором платформы.'
                : 'Your account or device identifier has been blocked by platform administrators.'}
            </p>
          </div>
          {deviceId && (
            <div className="bg-[#251c35] border border-[#3d2b4f] p-3 rounded-2xl text-left space-y-1">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">
                {lang === 'ru' ? 'ID вашего устройства:' : 'Your Device ID:'}
              </span>
              <code className="text-xs font-mono text-purple-300 break-all block">{deviceId}</code>
            </div>
          )}
          <p className="text-[11px] text-gray-500 italic">
            {lang === 'ru'
              ? 'Если вы считаете, что это ошибка, обратитесь в службу поддержки.'
              : 'If you believe this is an error, please contact support.'}
          </p>
        </motion.div>
      </div>
    );
  }

  if (!isLoading && maintenanceMode && !isAuthorizedForMaintenance) {
    return <MaintenanceScreen lang={lang as Language} />;
  }

  if (isPanicked) {
    return (
      <DisguisePage 
        onDeactivate={() => {
          localStorage.removeItem('aha_panic_mode');
          setIsPanicked(false);
          window.dispatchEvent(new CustomEvent('aha_panic_triggered'));
        }} 
      />
    );
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
        unreadCount={unreadCount}
        onToggleConsole={() => setIsConsoleOpen(prev => !prev)}
        isConsoleOpen={isConsoleOpen}
      />

      {/* Offline Banner */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-yellow-500/20 border-b border-yellow-500/50 text-yellow-500 px-4 py-2 text-center text-xs md:text-sm font-medium flex flex-wrap items-center justify-center gap-3 relative z-20"
          >
            <div className="flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-yellow-400' : 'animate-spin-slow'}`} />
              <span>
                {lang === 'ru' ? 'Нет подключения к интернету. Приложение работает в автономном режиме.' : 'No internet connection. App is running in offline mode.'}
              </span>
            </div>

            <button
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="px-3 py-1 bg-yellow-500 text-[#15101e] font-black text-[11px] uppercase tracking-wider rounded-lg hover:bg-yellow-400 transition-all flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? (lang === 'ru' ? 'Проверка...' : 'Checking...') : (lang === 'ru' ? 'Синхронизировать сейчас' : 'Sync Now')}</span>
            </button>
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
            className={`border-b px-4 py-2.5 text-center text-xs md:text-sm font-bold flex flex-col md:flex-row items-center justify-center gap-3 relative z-20 backdrop-blur-md ${vercelFallback.isConfigured() ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}
          >
            <div className="flex items-center gap-2">
              <ServerCrash className="w-4 h-4 animate-pulse" />
              {lang === 'ru' ? 'Сбой БД: превышен лимит или сервер недоступен.' : 'DB Error: Quota Exceeded or Offline.'}
            </div>
            
            {vercelFallback.isConfigured() ? (
                <span className="text-indigo-400/80 font-medium">
                  {lang === 'ru' ? 'Трафик успешно перенаправлен на Firebase RTDB. Чат и посты защищены от падения.' : 'Traffic successfully routed to RTDB bypass. Chat and posts are protected.'}
                </span>
            ) : (
                <span className="text-red-500/70 font-medium tracking-wide">
                  {lang === 'ru' ? 'Включен локальный режим. Настройте параметры RTDB в Secrets для сетевого обхода лимитов.' : 'Local fallback active. Set RTDB parameters in Secrets to bypass network limits.'}
                </span>
            )}
            
            <div className="flex items-center gap-2 md:ml-auto">
              <button
                onClick={handleSyncNow}
                disabled={isSyncing}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black text-[10px] uppercase tracking-wider rounded-md transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? (lang === 'ru' ? 'Проверка...' : 'Checking...') : (lang === 'ru' ? 'Синхронизировать сейчас' : 'Sync Now')}</span>
              </button>

              <button 
                onClick={() => {
                  localStorage.removeItem('aha_quota_fallback');
                  setOfflineMode(false);
                  window.location.reload();
                }}
                className={`underline text-[10px] uppercase tracking-widest hover:opacity-100 ${vercelFallback.isConfigured() ? 'text-indigo-400/50 hover:text-indigo-400' : 'text-[#ff4d4d]/50 hover:text-[#ff4d4d]'}`}
              >
                Retry
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className={`flex-1 w-full mx-auto px-4 py-8 relative z-10 ${section === 'chats' ? 'max-w-7xl' : 'max-w-5xl'}`}>
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

                  {/* Home Statistics Widget */}
                  <HomeStatsWidget lang={lang as Language} onNavigate={(sec) => setSection(sec as any)} />

                  {/* Web-App Installation Card on Main Screen */}
                  <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-[#15101e] border border-[#ff4d4d]/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 rounded-xl text-[#ff4d4d] flex items-center justify-center shrink-0">
                        <Smartphone size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-black text-white text-base tracking-tight">
                            {lang === 'ru' ? 'Приложение Web-App' : 'Web-App Application'}
                          </h3>
                          {isInstalled ? (
                            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                              {lang === 'ru' ? 'Установлено' : 'Installed'}
                            </span>
                          ) : (
                            <span className="bg-[#ff4d4d]/20 text-[#ff4d4d] border border-[#ff4d4d]/30 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                              PWA
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 leading-snug">
                          {lang === 'ru'
                            ? 'Установите веб-приложение на ваш рабочий стол или главный экран смартфона для быстрого доступа'
                            : 'Install Web-App directly on your home screen or desktop for instant access'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        if (canInstall) {
                          await installPWA();
                        } else {
                          setHomePwaModalOpen(true);
                        }
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 bg-[#ff4d4d] hover:bg-[#ff6666] text-[#15101e] font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#ff4d4d]/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
                    >
                      <Smartphone size={16} />
                      <span>{canInstall ? (lang === 'ru' ? 'Установить Web-App' : 'Install Web-App') : (lang === 'ru' ? 'Инструкция Web-App' : 'Web-App Guide')}</span>
                    </button>
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
                  lowPerfMode={lowPerfMode}
                  events={events}
                  promoCodes={promoCodes}
                  handleCopy={handleCopy}
                  onEditEvent={setEditingEvent}
                  onCreateEvent={() => setIsCreatingEvent(true)}
                />
              )}

              {section === 'canvas' && (
                <CanvasSection lang={lang as Language} />
              )}

              {section === 'ai' && (
                <AhiAiSection 
                  lang={lang as Language} 
                  currentSection={section}
                  previousSection={prevSection}
                />
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
                  loading={isLoadingTheories}
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
                  loading={isLoadingBlog}
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
                  loading={isLoadingEvents}
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
                <CyberChatWorkspace
                  lang={lang as Language}
                  onOpenProfileModal={() => setProfileOpen(true)}
                  activeChatFromApp={activeChat}
                  setActiveChatFromApp={(chat) => setActiveChat(chat)}
                />
              )}
              {section === 'telemetry' && role === 'admin' && (
                <TelemetrySection lang={lang as Language} />
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
      
      {/* Active Chat Window (only when not in full-screen 'chats' section) */}
      <AnimatePresence>
        {activeChat && section !== 'chats' && (
          <ChatWindow
            key={activeChat.uid}
            recipientId={activeChat.uid}
            recipientName={activeChat.displayName}
            recipientPhoto={activeChat.photoURL}
            lang={lang as Language}
            onClose={() => setActiveChat(null)}
            onSelectChat={(id, name, photo) => setActiveChat({ uid: id, displayName: name, photoURL: photo })}
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
            className="fixed bottom-8 left-1/2 z-[999999] bg-[#ff4d4d] text-[#15101e] px-6 py-3.5 rounded-2xl font-black shadow-2xl border-2 border-white/20 uppercase tracking-widest text-xs sm:text-sm max-w-[90vw] sm:max-w-md break-words text-center leading-normal"
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

      {/* Real-time Site Console Widget */}
      <DevConsoleWidget
        isOpen={isConsoleOpen}
        onClose={() => setIsConsoleOpen(false)}
        onToggle={() => setIsConsoleOpen(prev => !prev)}
      />

      <PwaInstallModal 
        isOpen={homePwaModalOpen} 
        onClose={() => setHomePwaModalOpen(false)} 
        lang={lang as Language} 
      />

      {/* Floating Quick Actions Menu on Home Screen */}
      {section === 'home' && (
        <QuickActionsMenu
          lang={lang as Language}
          onCreateTheory={() => {
            setSection('theories');
            setIsCreatingTheory(true);
          }}
          onCreateBlog={() => {
            setSection('blog');
            setIsCreatingBlog(true);
          }}
          onCreateEvent={() => {
            setSection('chronicle');
            setIsCreatingEvent(true);
          }}
        />
      )}
    </div>
  );
}
