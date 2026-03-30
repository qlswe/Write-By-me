import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, Globe, LayoutDashboard, Ticket, RefreshCw, ListOrdered, Sparkles } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import { logger, usePerfLogger } from './utils/logger';
import { handleFirestoreError, OperationType } from './utils/errorHandlers';
import { Starfield } from './components/Starfield';
import { Language, translations } from './data/translations';
import { useAuth } from './hooks/useAuth';
import { useUserData } from './hooks/useUserData';
import { useContent } from './hooks/useContent';
import { sdk } from './sdk';

// Components
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { PromoBanner } from './components/ui/PromoBanner';
import { ContentModal } from './components/ui/ContentModal';
import { FeedbackModal } from './components/ui/FeedbackModal';
import { TheoryEditor } from './components/sections/TheoryEditor';
import { BlogEditor } from './components/sections/BlogEditor';
import { EventEditor } from './components/sections/EventEditor';

// Lazy load sections for better performance
const TheoriesSection = lazy(() => import('./components/sections/TheoriesSection').then(m => ({ default: m.TheoriesSection })));
const BlogSection = lazy(() => import('./components/sections/BlogSection').then(m => ({ default: m.BlogSection })));
const ChronicleSection = lazy(() => import('./components/sections/ChronicleSection').then(m => ({ default: m.ChronicleSection })));
const TierListSection = lazy(() => import('./components/sections/TierListSection').then(m => ({ default: m.TierListSection })));
const PromoSection = lazy(() => import('./components/sections/PromoSection').then(m => ({ default: m.PromoSection })));

type Section = 'home' | 'theories' | 'blog' | 'chronicle' | 'promo' | 'tierlist';

export default function App() {
  const { trackRender } = usePerfLogger('App');
  trackRender();

  const { user, loading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [section, setSection] = useState<Section>('home');
  
  useEffect(() => {
    sdk.logging.action('Section Change', { section });
  }, [section]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{id?: string, title: string, content: string} | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  // User Data (Syncs with Firebase)
  const { favorites, toggleFavorite, clearFavorites, lang, updateLang, lowPerfMode, toggleLowPerfMode, isDataLoaded } = useUserData('ru');
  const { theories, blogPosts, events } = useContent();

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

  const t = translations[lang as Language];

  useEffect(() => {
    document.documentElement.classList.add('dark');
    
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
    
    return () => clearTimeout(loaderTimer);
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
    { id: 'tierlist', label: t.navTierList, icon: ListOrdered },
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
      <LoadingScreen isLoading={isLoading} />
      <Starfield lowPerfMode={lowPerfMode || !productionMode} />
      
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
      />

      {/* Mode Toggle Button (Floating) */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleProductionMode}
        className={`fixed bottom-24 right-6 z-40 p-3 rounded-full shadow-2xl border transition-all duration-500 ${productionMode ? 'bg-[#C3A6E6] text-[#2F244F] border-white' : 'bg-[#2F244F] text-[#C3A6E6] border-[#5C4B8B]'}`}
        title={productionMode ? t.sdkModeMain : t.sdkModeProduction}
      >
        <Sparkles size={24} className={productionMode ? 'animate-pulse' : ''} />
      </motion.button>

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
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <RefreshCw size={14} />
                    {t.lastUpdate}
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
                />
              )}

              {section === 'chronicle' && (
                <ChronicleSection 
                  lang={lang as Language} 
                  lowPerfMode={lowPerfMode} 
                  events={events}
                  onEdit={setEditingEvent}
                  onCreate={() => setIsCreatingEvent(true)}
                />
              )}
              {section === 'tierlist' && <TierListSection lang={lang as Language} lowPerfMode={lowPerfMode} />}
              {section === 'promo' && <PromoSection lang={lang as Language} handleCopy={handleCopy} />}
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
    </div>
  );
}
