import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, Globe, LayoutDashboard, Ticket, RefreshCw, ListOrdered } from 'lucide-react';
import { Starfield } from './components/Starfield';
import { Language, translations } from './data/translations';
import { useAuth } from './hooks/useAuth';
import { useUserData } from './hooks/useUserData';
import { usePerfLogger } from './utils/logger';

// Components
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { PromoBanner } from './components/ui/PromoBanner';
import { ContentModal } from './components/ui/ContentModal';
import { FeedbackModal } from './components/ui/FeedbackModal';
import { TheoriesSection } from './components/sections/TheoriesSection';
import { BlogSection } from './components/sections/BlogSection';
import { ChronicleSection } from './components/sections/ChronicleSection';
import { TierListSection } from './components/sections/TierListSection';
import { PromoSection } from './components/sections/PromoSection';

type Section = 'home' | 'theories' | 'blog' | 'chronicle' | 'promo' | 'tierlist';

export default function App() {
  const { trackRender } = usePerfLogger('App');
  trackRender();

  const { user, loading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [section, setSection] = useState<Section>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{title: string, content: string} | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  // User Data (Syncs with Firebase)
  const { favorites, toggleFavorite, lang, updateLang, isDataLoaded } = useUserData('ru');

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

  const t = translations[lang as Language];

  useEffect(() => {
    document.documentElement.classList.add('dark');
    
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (!isStandalone) {
      setShowBanner(true);
    }

    // Hide loader after auth and data are loaded, or after a timeout
    const loaderTimer = setTimeout(() => setIsLoading(false), 2000);
    if (!authLoading && isDataLoaded) {
      setIsLoading(false);
      clearTimeout(loaderTimer);
    }
    
    return () => clearTimeout(loaderTimer);
  }, [authLoading, isDataLoaded]);

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

  const handleFeedbackSubmit = () => {
    if (!feedbackText.trim()) return;
    
    const subject = encodeURIComponent(`[${feedbackType.toUpperCase()}] HSR Database Feedback`);
    const body = encodeURIComponent(`${feedbackText}\n\n---\nApp Version: BETA-V03\nLanguage: ${lang}\nUser: ${user ? user.uid : 'Anonymous'}`);
    
    const mailtoLink = `mailto:semegladysev527@gmail.com?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;
    
    const existing = JSON.parse(localStorage.getItem('hsr_feedback') || '[]');
    existing.push({
      id: Date.now(),
      type: feedbackType,
      text: feedbackText,
      hasImage: !!feedbackImage,
      date: new Date().toISOString()
    });
    localStorage.setItem('hsr_feedback', JSON.stringify(existing));
    
    setFeedbackOpen(false);
    setFeedbackText('');
    setFeedbackImage(null);
    setToast(t.feedbackSuccess || "Thank you!");
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

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden font-sans text-[#E0E0E0]">
      <LoadingScreen isLoading={isLoading} />
      <Starfield />
      
      <Header 
        lang={lang as Language} 
        setLang={updateLang} 
        section={section} 
        setSection={setSection} 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen} 
        navItems={navItems} 
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 relative z-10">
        <PromoBanner showBanner={showBanner} lang={lang as Language} setModalContent={setModalContent} />

        <AnimatePresence mode="wait">
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {section === 'home' && (
              <div className="bg-[#3E3160]/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-[#5C4B8B]">
                <h2 className="text-3xl font-bold text-[#C3A6E6] mb-4">{t.homeTitle}</h2>
                <p className="text-lg text-gray-300 mb-6" dangerouslySetInnerHTML={{ __html: t.homeDesc }} />
                <div className="text-sm text-gray-400 italic">{t.lastUpdate}</div>
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
                setModalContent={setModalContent}
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
                setModalContent={setModalContent}
              />
            )}

            {section === 'chronicle' && <ChronicleSection lang={lang as Language} />}
            {section === 'tierlist' && <TierListSection lang={lang as Language} />}
            {section === 'promo' && <PromoSection lang={lang as Language} handleCopy={handleCopy} />}
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

      <ContentModal modalContent={modalContent} setModalContent={setModalContent} />

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-8 left-1/2 z-50 bg-[#C3A6E6] text-[#2F244F] px-6 py-3 rounded-full font-bold shadow-lg border border-[#B094EB]"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
