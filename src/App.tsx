import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, Globe, LayoutDashboard, Ticket, Menu, X, RefreshCw, Swords, Copy, Download, Search, MessageSquare, Star, ListOrdered } from 'lucide-react';
import { Starfield } from './components/Starfield';
import { Terminal } from './components/Terminal';
import { Language, translations } from './data/translations';
import { theoriesData, blogPostsData, promoCodesData, eventsData } from './data/content';
import { getNextEventDate, getEventProgress, formatCountdown } from './utils/time';

type Section = 'home' | 'theories' | 'blog' | 'chronicle' | 'promo';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [lang, setLang] = useState<Language>('ru');
  const [section, setSection] = useState<Section>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  const [modalContent, setModalContent] = useState<{title: string, content: string} | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  
  const [showBanner, setShowBanner] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  // Feedback state
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'bug' | 'suggestion'>('bug');
  const [feedbackText, setFeedbackText] = useState('');

  // Filters
  const [theoryCategory, setTheoryCategory] = useState('all');
  const [theorySearch, setTheorySearch] = useState('');
  const [blogCategory, setBlogCategory] = useState('all');
  const [blogSearch, setBlogSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('hsr_favorites') || '[]');
    } catch {
      return [];
    }
  });

  const t = translations[lang];

  useEffect(() => {
    localStorage.setItem('hsr_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => prev.includes(id) ? prev.filter(favId => favId !== id) : [...prev, id]);
  };

  useEffect(() => {
    // Force dark mode
    document.documentElement.classList.add('dark');
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobileDevice(isMobile);
    
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (!isStandalone) {
      setShowBanner(true);
    }

    // Hide loader after a short delay
    const loaderTimer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(loaderTimer);
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
    const existing = JSON.parse(localStorage.getItem('hsr_feedback') || '[]');
    existing.push({
      id: Date.now(),
      type: feedbackType,
      text: feedbackText,
      date: new Date().toISOString()
    });
    localStorage.setItem('hsr_feedback', JSON.stringify(existing));
    setFeedbackOpen(false);
    setFeedbackText('');
    setToast(t.feedbackSuccess || "Thank you!");
  };

  const filteredTheories = theoriesData.filter(theory => {
    const matchesCat = theoryCategory === 'all' || 
                       (theoryCategory === 'favorites' ? favorites.includes(theory.id) : theory.category === theoryCategory);
    const search = theorySearch.toLowerCase();
    const matchesSearch = (theory.title[lang] || theory.title['en']).toLowerCase().includes(search) || 
                          (theory.summary[lang] || theory.summary['en']).toLowerCase().includes(search);
    return matchesCat && matchesSearch;
  });

  const filteredBlog = blogPostsData.filter(post => {
    const matchesCat = blogCategory === 'all' || 
                       (blogCategory === 'favorites' ? favorites.includes(post.id) : post.category === blogCategory);
    const search = blogSearch.toLowerCase();
    const matchesSearch = (post.title[lang] || post.title['en']).toLowerCase().includes(search) || 
                          (post.summary[lang] || post.summary['en']).toLowerCase().includes(search);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden font-sans text-[#E0E0E0]">
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="fixed inset-0 z-[9999] bg-[#2F244F] flex flex-col items-center justify-center font-mono overflow-hidden"
          >
            <div className="relative flex flex-col items-center">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="w-32 h-32 rounded-full border-2 border-dashed border-[#5C4B8B] border-t-[#C3A6E6] border-r-[#C3A6E6] mb-8"
              />
              <div className="absolute top-[2rem] w-16 h-16 bg-[#C3A6E6]/20 rounded-full blur-xl animate-pulse" />
              <Globe size={40} className="absolute top-[2.5rem] text-[#C3A6E6]" />
              
              <h2 className="text-2xl font-bold text-[#C3A6E6] tracking-[0.3em] mb-2">STATION_OS</h2>
              <div className="flex items-center gap-2 text-[#9370DB] text-sm tracking-widest">
                <RefreshCw size={14} className="animate-spin" />
                <span>ESTABLISHING CONNECTION...</span>
              </div>
              
              <div className="w-64 h-1 bg-[#3E3160] rounded-full mt-8 overflow-hidden">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.2, ease: "circOut" }}
                  className="h-full bg-[#C3A6E6] shadow-[0_0_10px_#C3A6E6]"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Starfield />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#3E3160]/90 backdrop-blur-md border-b border-[#5C4B8B] shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold text-[#C3A6E6] tracking-tight">
            {t.siteName}
          </h1>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`text-base font-semibold transition-colors relative py-1 ${
                  section === item.id 
                    ? 'text-[#C3A6E6]' 
                    : 'text-gray-300 hover:text-[#C3A6E6]'
                }`}
              >
                {item.label}
                {section === item.id && (
                  <motion.div 
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C3A6E6] rounded-full"
                  />
                )}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="relative">
              <select 
                value={lang} 
                onChange={(e) => setLang(e.target.value as Language)}
                className="appearance-none bg-[#2F244F] border border-[#5C4B8B] rounded-lg pl-3 pr-10 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C3A6E6] text-gray-200 cursor-pointer hover:border-[#C3A6E6] transition-colors"
              >
                <option value="ru">RU</option>
                <option value="en">EN</option>
                <option value="by">BY</option>
                <option value="jp">JP</option>
                <option value="de">DE</option>
                <option value="fr">FR</option>
                <option value="zh">ZH</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#C3A6E6]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>

            <button 
              className="md:hidden p-2 text-gray-300 hover:text-[#C3A6E6]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-0 z-40 bg-[#2F244F] pt-20 px-4"
          >
            <div className="flex flex-col gap-4">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSection(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-4 p-4 rounded-xl text-xl font-semibold ${
                    section === item.id 
                      ? 'bg-[#5C4B8B] text-[#C3A6E6]' 
                      : 'text-gray-300'
                  }`}
                >
                  <item.icon size={24} />
                  {item.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 relative z-10">
        
        {/* Web-App Promo Banner */}
        <AnimatePresence>
          {showBanner && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-[#3E3160] border border-[#5C4B8B] border-l-4 border-l-[#C3A6E6] rounded-xl p-5 mb-8 flex flex-col sm:flex-row items-center gap-4 shadow-lg"
            >
              <div className="text-[#C3A6E6] shrink-0">
                <Download size={32} />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-lg font-bold text-white mb-1">
                  {t.bannerTitle || "Установите приложение"}
                </h3>
                <p className="text-sm text-gray-300">
                  {t.bannerDesc || "Доступно как Web-App (через меню браузера) и как отдельное Android-приложение."}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => setModalContent({ title: t.installGuideTitle || "Как установить Web-App", content: t.installGuideContent || "<p>1. Откройте меню браузера.</p><p>2. Выберите «Добавить на главный экран».</p>" })}
                  className="bg-[#2F244F] border border-[#5C4B8B] hover:border-[#C3A6E6] text-gray-200 px-4 py-2.5 rounded-lg font-bold whitespace-nowrap transition-colors"
                >
                  {t.bannerBtnWeb || "Как установить Web-App"}
                </button>
                <a 
                  href="https://wbm-static.my1.ru/app-debug-inst.apk" 
                  className="bg-[#C3A6E6] hover:bg-[#B094EB] text-[#2F244F] px-6 py-2.5 rounded-lg font-bold whitespace-nowrap transition-colors text-center"
                >
                  {t.bannerBtnAndroid || "Скачать Android APK"}
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
              <div>
                <h2 className="text-3xl font-bold text-[#C3A6E6] mb-8">{t.navTheories}</h2>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <div className="relative">
                    <select 
                      value={theoryCategory}
                      onChange={(e) => setTheoryCategory(e.target.value)}
                      className="appearance-none bg-[#3E3160] border border-[#5C4B8B] rounded-xl pl-4 pr-12 py-3 text-gray-200 focus:outline-none focus:border-[#C3A6E6] cursor-pointer w-full sm:w-auto hover:border-[#C3A6E6] transition-colors"
                    >
                      <option value="all">{t.filterAll}</option>
                      <option value="lore">{t.filterLore}</option>
                      <option value="characters">{t.filterCharacters}</option>
                      <option value="gameplay">{t.filterGameplay}</option>
                      <option value="favorites">{t.filterFavorites}</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#C3A6E6]">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                      type="text"
                      placeholder={t.searchPlaceholder}
                      value={theorySearch}
                      onChange={(e) => setTheorySearch(e.target.value)}
                      className="w-full bg-[#3E3160] border border-[#5C4B8B] rounded-xl pl-12 pr-4 py-3 text-gray-200 focus:outline-none focus:border-[#C3A6E6]"
                    />
                  </div>
                </div>

                {filteredTheories.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 bg-[#3E3160]/50 rounded-2xl border border-dashed border-[#5C4B8B]">
                    {t.noResults}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredTheories.map(theory => (
                      <div 
                        key={theory.id}
                        onClick={() => setModalContent({ title: theory.title[lang] || theory.title['en'], content: theory.content[lang] || theory.content['en'] })}
                        className="bg-[#3E3160]/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-[#5C4B8B] cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all group relative"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-xs font-bold uppercase tracking-wider text-[#C3A6E6] bg-[#C3A6E6]/10 inline-block px-3 py-1 rounded-full">
                            {t[`filter${theory.category.charAt(0).toUpperCase() + theory.category.slice(1)}` as keyof typeof t] || theory.category}
                          </div>
                          <button 
                            onClick={(e) => toggleFavorite(theory.id, e)}
                            className={`p-2 rounded-full transition-colors ${favorites.includes(theory.id) ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10'}`}
                          >
                            <Star size={20} fill={favorites.includes(theory.id) ? "currentColor" : "none"} />
                          </button>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#C3A6E6] transition-colors pr-8">
                          {theory.title[lang] || theory.title['en']}
                        </h3>
                        <p className="text-gray-300 line-clamp-3">
                          {theory.summary[lang] || theory.summary['en']}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {section === 'blog' && (
              <div>
                <h2 className="text-3xl font-bold text-[#C3A6E6] mb-8">{t.navBlog}</h2>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <div className="relative">
                    <select 
                      value={blogCategory}
                      onChange={(e) => setBlogCategory(e.target.value)}
                      className="appearance-none bg-[#3E3160] border border-[#5C4B8B] rounded-xl pl-4 pr-12 py-3 text-gray-200 focus:outline-none focus:border-[#C3A6E6] cursor-pointer w-full sm:w-auto hover:border-[#C3A6E6] transition-colors"
                    >
                      <option value="all">{t.filterAll}</option>
                      <option value="updates">{t.filterUpdates}</option>
                      <option value="personal">{t.filterPersonal}</option>
                      <option value="favorites">{t.filterFavorites}</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#C3A6E6]">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                      type="text"
                      placeholder={t.searchPlaceholder}
                      value={blogSearch}
                      onChange={(e) => setBlogSearch(e.target.value)}
                      className="w-full bg-[#3E3160] border border-[#5C4B8B] rounded-xl pl-12 pr-4 py-3 text-gray-200 focus:outline-none focus:border-[#C3A6E6]"
                    />
                  </div>
                </div>

                {filteredBlog.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 bg-[#3E3160]/50 rounded-2xl border border-dashed border-[#5C4B8B]">
                    {t.noResults}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredBlog.map(post => (
                      <div 
                        key={post.id}
                        onClick={() => setModalContent({ title: post.title[lang] || post.title['en'], content: post.content[lang] || post.content['en'] })}
                        className="bg-[#3E3160]/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-[#5C4B8B] cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all group relative"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-xs font-bold uppercase tracking-wider text-[#C3A6E6] bg-[#C3A6E6]/10 inline-block px-3 py-1 rounded-full">
                            {t[`filter${post.category.charAt(0).toUpperCase() + post.category.slice(1)}` as keyof typeof t] || post.category}
                          </div>
                          <button 
                            onClick={(e) => toggleFavorite(post.id, e)}
                            className={`p-2 rounded-full transition-colors ${favorites.includes(post.id) ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10'}`}
                          >
                            <Star size={20} fill={favorites.includes(post.id) ? "currentColor" : "none"} />
                          </button>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#C3A6E6] transition-colors pr-8">
                          {post.title[lang] || post.title['en']}
                        </h3>
                        <p className="text-gray-300 line-clamp-3">
                          {post.summary[lang] || post.summary['en']}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {section === 'chronicle' && (
              <div>
                <h2 className="text-3xl font-bold text-[#C3A6E6] mb-8">{t.navChronicle}</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {eventsData.map(event => {
                    const { nextDate, progress } = getEventProgress(event);
                    const countdown = formatCountdown(nextDate, t);
                    
                    return (
                      <div key={event.id} className="bg-[#3E3160]/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-[#5C4B8B] relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-[#2F244F]">
                          <motion.div 
                            className="h-full bg-[#C3A6E6] shadow-[0_0_10px_#C3A6E6]"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </div>
                        
                        <div className="flex items-start justify-between mb-6 mt-2">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#2F244F] border border-[#5C4B8B] rounded-xl flex items-center justify-center shadow-inner group-hover:border-[#C3A6E6] transition-colors">
                              {event.icon === 'refresh-cw' ? <RefreshCw size={24} className="text-[#C3A6E6]" /> : 
                               event.icon === 'swords' ? <Swords size={24} className="text-[#C3A6E6]" /> : <Globe size={24} className="text-[#C3A6E6]" />}
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-white">{event.title[lang] || event.title['en']}</h3>
                              <div className="text-xs font-mono text-[#9370DB] uppercase tracking-wider mt-1">
                                {event.type === 'daily' ? '24H CYCLE' : (event.weekOffset !== undefined ? '14D CYCLE' : '7D CYCLE')}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-[#2F244F] rounded-xl p-4 mb-4 border border-[#5C4B8B]/50">
                          <div className="text-sm text-gray-400 mb-1 uppercase tracking-wider font-mono">{t.timeRemaining || "Time Remaining"}</div>
                          <div className="text-2xl font-mono font-bold text-[#C3A6E6] tracking-tight">
                            {countdown}
                          </div>
                        </div>
                        
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {event.description[lang] || event.description['en']}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {section === 'tierlist' && (
              <div>
                <h2 className="text-3xl font-bold text-[#C3A6E6] mb-8">{t.navTierList}</h2>
                <div className="bg-[#3E3160]/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-[#5C4B8B]">
                  <p className="text-gray-300 mb-6">
                    {lang === 'ru' ? 'Актуальный тир-лист персонажей для версии 4.0. Оценки основаны на эффективности в Чистом Вымысле, Зале Забвения и Иллюзии Конца.' : 
                     lang === 'en' ? 'Current character tier list for version 4.0. Ratings are based on performance in Pure Fiction, Memory of Chaos, and Apocalyptic Shadow.' :
                     lang === 'by' ? 'Актуальны тыр-ліст персанажаў для версіі 4.0. Ацэнкі заснаваныя на эфектыўнасці ў Чыстым Вымысле, Зале Забыцця і Ілюзіі Канцы.' :
                     lang === 'jp' ? 'バージョン4.0の最新キャラクターティアリスト。評価は虚構叙事、忘却の庭、末日の幻影でのパフォーマンスに基づいています。' :
                     lang === 'de' ? 'Aktuelle Charakter-Tier-Liste für Version 4.0. Die Bewertungen basieren auf der Leistung in Pure Fiction, Memory of Chaos und Apocalyptic Shadow.' :
                     lang === 'fr' ? 'Tier list actuelle des personnages pour la version 4.0. Les évaluations sont basées sur les performances dans Pure Fiction, Memory of Chaos et Apocalyptic Shadow.' :
                     '4.0版本最新角色节奏榜。评分基于虚构叙事、忘却之庭和末日幻影中的表现。'}
                  </p>
                  
                  <div className="space-y-6">
                    {/* Tier S+ */}
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="w-full md:w-24 h-24 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-3xl font-bold text-red-400">S+</span>
                      </div>
                      <div className="flex-1 bg-[#2F244F]/50 rounded-xl p-4 flex flex-wrap gap-3 items-center border border-[#5C4B8B]/50">
                        {['Спаркси (Искорка)', 'Жуань Мэй', 'Авантюрин', 'Цзинлю', 'Яогуан', 'Ахерон', 'Светлячок'].map(char => (
                          <span key={char} className="px-3 py-1.5 bg-[#3E3160] border border-[#5C4B8B] rounded-lg text-sm font-medium text-white shadow-sm">
                            {char}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Tier S */}
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="w-full md:w-24 h-24 bg-orange-500/20 border border-orange-500/50 rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-3xl font-bold text-orange-400">S</span>
                      </div>
                      <div className="flex-1 bg-[#2F244F]/50 rounded-xl p-4 flex flex-wrap gap-3 items-center border border-[#5C4B8B]/50">
                        {['Кафка', 'Черный Лебедь', 'Зарянка', 'Хохо', 'Фу Сюань', 'Пожиратель Луны', 'Фэйсяо', 'Линша'].map(char => (
                          <span key={char} className="px-3 py-1.5 bg-[#3E3160] border border-[#5C4B8B] rounded-lg text-sm font-medium text-white shadow-sm">
                            {char}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Tier A */}
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="w-full md:w-24 h-24 bg-yellow-500/20 border border-yellow-500/50 rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-3xl font-bold text-yellow-400">A</span>
                      </div>
                      <div className="flex-1 bg-[#2F244F]/50 rounded-xl p-4 flex flex-wrap gap-3 items-center border border-[#5C4B8B]/50">
                        {['Топаз', 'Рацио', 'Броня', 'Тинъюнь', 'Пела', 'Галлахер', 'Лоча', 'Цзин Юань', 'Зеле'].map(char => (
                          <span key={char} className="px-3 py-1.5 bg-[#3E3160] border border-[#5C4B8B] rounded-lg text-sm font-medium text-white shadow-sm">
                            {char}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {section === 'promo' && (
              <div>
                <h2 className="text-3xl font-bold text-[#C3A6E6] mb-8">{t.navPromo}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {promoCodesData.map(promo => (
                    <div key={promo.code} className="bg-[#3E3160]/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border-l-4 border-l-[#C3A6E6] border-y border-r border-[#5C4B8B]">
                      <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#5C4B8B]">
                        <code className="text-2xl font-mono font-bold text-[#C3A6E6]">{promo.code}</code>
                        <button 
                          onClick={() => handleCopy(promo.code)}
                          className="p-2 hover:bg-[#5C4B8B] rounded-lg transition-colors text-gray-400"
                          title={t.copyToClipboard}
                        >
                          <Copy size={20} />
                        </button>
                      </div>
                      <div className="text-gray-300">
                        <span className="font-bold text-white">{t.rewards}</span> {promo.rewards[lang] || promo.rewards['en']}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-[#221A3D]/80 backdrop-blur-md border-t border-[#5C4B8B] mt-auto relative z-10">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <Terminal lang={lang} />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div>
              <h4 className="text-[#C3A6E6] font-bold uppercase tracking-wider text-sm mb-4">{t.systemStatus}</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></span>
                  {t.statusExpress}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></span>
                  {t.statusDb}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#C3A6E6] animate-pulse shadow-[0_0_8px_#C3A6E6]"></span>
                  {t.statusSignal}
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-[#C3A6E6] font-bold uppercase tracking-wider text-sm mb-4">{t.quickLinks}</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                {navItems.map(item => (
                  <li key={item.id}>
                    <button onClick={() => setSection(item.id)} className="hover:text-[#C3A6E6] transition-colors">
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="text-sm text-gray-400">
              <div className="inline-block px-3 py-1 rounded-full bg-[#3E3160] border border-[#5C4B8B] font-mono text-xs mb-4">
                Build: BETA-V03
              </div>
              <p className="italic opacity-80">«The Conductor always keeps things tidy!»</p>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-[#5C4B8B] flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
            <p>&copy; 2026 クルシーP. {t.rights}</p>
            <div className="flex items-center gap-6">
              <button onClick={() => setFeedbackOpen(true)} className="hover:text-[#C3A6E6] transition-colors flex items-center gap-2">
                <MessageSquare size={16} />
                {t.feedback || "Feedback"}
              </button>
              <a href="https://github.com/qlswe" target="_blank" rel="noreferrer" className="hover:text-[#C3A6E6] transition-colors">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Feedback Modal */}
      <AnimatePresence>
        {feedbackOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFeedbackOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-[#3E3160] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-[#5C4B8B]"
            >
              <div className="p-6 border-b border-[#5C4B8B] flex justify-between items-center">
                <h3 className="text-xl font-bold text-[#C3A6E6]">{t.feedbackTitle || "Feedback"}</h3>
                <button 
                  onClick={() => setFeedbackOpen(false)}
                  className="p-2 hover:bg-[#5C4B8B] rounded-full transition-colors text-gray-400"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t.feedbackType || "Type"}</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-gray-200 cursor-pointer">
                      <input type="radio" checked={feedbackType === 'bug'} onChange={() => setFeedbackType('bug')} className="accent-[#C3A6E6]" />
                      {t.bug || "Bug"}
                    </label>
                    <label className="flex items-center gap-2 text-gray-200 cursor-pointer">
                      <input type="radio" checked={feedbackType === 'suggestion'} onChange={() => setFeedbackType('suggestion')} className="accent-[#C3A6E6]" />
                      {t.suggestion || "Suggestion"}
                    </label>
                  </div>
                </div>
                <div>
                  <textarea 
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder={t.feedbackPlaceholder || "Describe..."}
                    className="w-full h-32 bg-[#2F244F] border border-[#5C4B8B] rounded-xl p-3 text-gray-200 focus:outline-none focus:border-[#C3A6E6] resize-none"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-[#5C4B8B] bg-[#2F244F] flex justify-end gap-3">
                <button 
                  onClick={() => setFeedbackOpen(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors font-medium"
                >
                  {t.cancel || "Cancel"}
                </button>
                <button 
                  onClick={handleFeedbackSubmit}
                  disabled={!feedbackText.trim()}
                  className="px-6 py-2 bg-[#C3A6E6] hover:bg-[#B094EB] disabled:opacity-50 disabled:cursor-not-allowed text-[#2F244F] rounded-lg font-bold transition-colors"
                >
                  {t.submit || "Submit"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Content Modal */}
      <AnimatePresence>
        {modalContent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalContent(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-[#3E3160] w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-[#5C4B8B]"
            >
              <div className="p-6 border-b border-[#5C4B8B] flex justify-between items-start gap-4">
                <h3 className="text-2xl font-bold text-[#C3A6E6]">{modalContent.title}</h3>
                <button 
                  onClick={() => setModalContent(null)}
                  className="p-2 hover:bg-[#5C4B8B] rounded-full transition-colors text-gray-400 shrink-0"
                >
                  <X size={24} />
                </button>
              </div>
              <div 
                className="p-6 overflow-y-auto max-w-none text-gray-200 [&>p]:mb-4 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-4 [&>hr]:my-4 [&>hr]:border-[#5C4B8B] [&_code]:bg-[#5C4B8B] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono"
                dangerouslySetInnerHTML={{ __html: modalContent.content }}
              />
              <div className="p-6 border-t border-[#5C4B8B] bg-[#2F244F]">
                <button 
                  onClick={() => handleCopy(`${modalContent.title}\n\n${modalContent.content.replace(/<[^>]*>?/gm, '')}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#C3A6E6] hover:bg-[#B094EB] text-[#2F244F] rounded-lg font-bold transition-colors"
                >
                  <Copy size={18} />
                  {t.copyToClipboard}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-8 left-1/2 z-[200] bg-[#C3A6E6] text-[#2F244F] px-6 py-3 rounded-xl shadow-2xl font-bold"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
