import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, LogIn, LogOut, User as UserIcon, Bookmark, Trash2, Zap, ZapOff, Globe, Mail } from 'lucide-react';
import { Language, translations } from '../../data/translations';
import { useAuth } from '../../hooks/useAuth';
import { usePerfLogger } from '../../utils/logger';
import { ConfirmModal } from '../ui/ConfirmModal';
import { ProfileModal } from '../ui/ProfileModal';

interface HeaderProps {
  lang: Language;
  setLang: (lang: Language) => void;
  section: string;
  setSection: (section: any) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  navItems: readonly { id: string; label: string; icon: any }[];
  favorites: string[];
  clearFavorites: () => void;
  lowPerfMode?: boolean;
  toggleLowPerfMode?: () => void;
  role?: 'admin' | 'moderator' | 'user' | 'beta-tester';
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  setLang,
  section,
  setSection,
  mobileMenuOpen,
  setMobileMenuOpen,
  navItems,
  favorites,
  clearFavorites,
  lowPerfMode,
  toggleLowPerfMode,
  role
}) => {
  const t = translations[lang];
  const { user, loginWithGoogle, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const { trackRender } = usePerfLogger('Header');
  trackRender();

  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (navRef.current) {
      const activeItem = navRef.current.querySelector(`[data-active="true"]`);
      if (activeItem) {
        activeItem.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [section]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#2F244F] border-b border-[#3E3160] shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter shrink-0 flex items-center gap-2">
            <Zap className="text-[#C3A6E6] fill-[#C3A6E6]" size={24} />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              {t.siteName}
            </span>
          </h1>
          
          {/* Desktop Nav */}
          <nav 
            ref={navRef}
            className="hidden lg:flex items-center gap-1 bg-[#3E3160] p-1 rounded-2xl border border-[#5C4B8B]/30 overflow-x-auto no-scrollbar scroll-smooth"
          >
            {navItems.map(item => (
              <button
                key={item.id}
                data-active={section === item.id}
                onClick={() => setSection(item.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  section === item.id 
                    ? 'text-[#2F244F] bg-[#C3A6E6] shadow-[0_0_20px_rgba(195,166,230,0.3)]' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#3E3160]/50'
                }`}
              >
                <item.icon size={16} className="shrink-0" />
                <span className="hidden xl:inline">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            {/* Custom Language Selector */}
            <div className="relative">
              <button 
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-2 bg-[#3E3160]/60 border border-[#5C4B8B]/50 hover:border-[#C3A6E6] text-gray-200 px-3 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest group"
              >
                <Globe size={14} className="text-[#C3A6E6] group-hover:rotate-12 transition-transform" />
                {lang}
              </button>
              
              <AnimatePresence>
                {langOpen && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-3 w-40 bg-[#2F244F] border border-[#3E3160] rounded-2xl shadow-2xl overflow-hidden z-50 p-1.5"
                  >
                    {(['ru', 'en', 'by', 'de', 'fr', 'zh'] as Language[]).map(l => {
                      const langNames: Record<Language, string> = {
                        ru: 'Русский',
                        en: 'English',
                        by: 'Беларуская',
                        de: 'Deutsch',
                        fr: 'Français',
                        zh: '中文'
                      };
                      return (
                      <button
                        key={l}
                        onClick={() => { setLang(l); setLangOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          lang === l 
                            ? 'bg-[#C3A6E6] text-[#2F244F] shadow-lg shadow-[#C3A6E6]/20' 
                            : 'text-gray-400 hover:bg-[#3E3160] hover:text-white'
                        }`}
                      >
                        {langNames[l]}
                      </button>
                    )})}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {toggleLowPerfMode && (
              <button 
                onClick={toggleLowPerfMode}
                className={`hidden lg:flex items-center justify-center p-1.5 rounded-lg border transition-colors ${
                  lowPerfMode 
                    ? 'bg-yellow-400/10 border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/20' 
                    : 'bg-[#2F244F] border-[#5C4B8B] text-gray-300 hover:text-white hover:border-[#C3A6E6]'
                }`}
                title={lowPerfMode ? (t.lowPerfModeOn || "Performance Mode: ON") : (t.lowPerfModeOff || "Performance Mode: OFF")}
              >
                {lowPerfMode ? <ZapOff size={18} /> : <Zap size={18} />}
              </button>
            )}

            <div className="hidden lg:block relative">
              {user ? (
                <div className="relative">
                  <button 
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 bg-[#2F244F] border border-[#5C4B8B] hover:border-[#C3A6E6] text-gray-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    <img src={user.photoURL || ''} alt="Avatar" className="w-5 h-5 rounded-full" />
                    <span className="max-w-[100px] truncate">{user.displayName}</span>
                  </button>
                  
                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-64 bg-[#3E3160] border border-[#5C4B8B] rounded-xl shadow-xl overflow-hidden z-50"
                      >
                        <div className="p-4 border-b border-[#5C4B8B] bg-[#2F244F]">
                          <div className="flex items-center gap-3 mb-2">
                            <img src={user.photoURL || ''} alt="Avatar" className="w-10 h-10 rounded-full border border-[#5C4B8B]" />
                            <div>
                              <div className="font-bold text-white truncate">{user.displayName}</div>
                              <div className="text-xs text-gray-400 truncate">{user.email}</div>
                              {role && role !== 'user' && (
                                <div className={`inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  role === 'admin' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                }`}>
                                  {role}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-start gap-2 text-sm text-gray-300 mb-4">
                            <UserIcon size={16} className="text-[#C3A6E6] shrink-0 mt-0.5" />
                            <div>
                              <div className="font-bold text-white mb-1">{t.headerProfileInfo || "Profile Information"}</div>
                              <p className="text-xs text-gray-400 leading-relaxed">
                                {t.profileDesc || "Your language preferences and favorite articles are stored here. They sync across your devices."}
                              </p>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => { setProfileModalOpen(true); setProfileOpen(false); }}
                            className="w-full flex items-center justify-center gap-2 bg-[#2F244F] hover:bg-[#5C4B8B] text-white border border-[#5C4B8B] hover:border-[#C3A6E6] px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-2"
                          >
                            <UserIcon size={16} />
                            {t.headerProfileSettings}
                          </button>

                          <button 
                            onClick={() => { setLogoutConfirmOpen(true); setProfileOpen(false); }}
                            className="w-full flex items-center justify-center gap-2 bg-[#2F244F] hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-[#5C4B8B] hover:border-red-500/50 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            <LogOut size={16} />
                            {t.logout || "Logout"}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={loginWithGoogle}
                    className="group relative flex items-center gap-2 bg-white hover:bg-gray-100 text-[#2F244F] px-4 py-1.5 rounded-lg text-sm font-black transition-all shadow-lg hover:shadow-white/10 active:scale-95"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="hidden sm:inline">{t.login || "Login"}</span>
                  </button>
                </div>
              )}
            </div>

            <button 
              className="lg:hidden p-2 text-gray-300 hover:text-[#C3A6E6]"
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
            className="md:hidden fixed inset-0 z-40 bg-[#2F244F] pt-20 px-4 flex flex-col overflow-y-auto pb-6"
          >
            <div className="flex flex-col gap-4 flex-1 shrink-0">
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
            
            <div className="p-6 border-t border-[#5C4B8B] mt-auto shrink-0 flex flex-col gap-4">
              {toggleLowPerfMode && (
                <button 
                  onClick={toggleLowPerfMode}
                  className={`w-full flex items-center justify-center gap-2 bg-[#2F244F] border border-[#5C4B8B] px-4 py-3 rounded-xl font-bold transition-colors ${
                    lowPerfMode 
                      ? 'text-yellow-400 hover:bg-yellow-400/10' 
                      : 'text-gray-300 hover:bg-[#3E3160]'
                  }`}
                >
                  {lowPerfMode ? <ZapOff size={20} /> : <Zap size={20} />}
                  {lowPerfMode ? (t.lowPerfModeOn || "Performance Mode: ON") : (t.lowPerfModeOff || "Performance Mode: OFF")}
                </button>
              )}

              {user ? (
                <>
                  <div className="flex items-center gap-3 bg-[#3E3160] p-3 rounded-xl border border-[#5C4B8B]">
                    <img src={user.photoURL || ''} alt="Avatar" className="w-12 h-12 rounded-full border border-[#5C4B8B]" />
                    <div>
                      <div className="text-white font-bold">{user.displayName}</div>
                      <div className="text-xs text-gray-400">{user.email}</div>
                      {role && role !== 'user' && (
                        <div className={`inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                          role === 'admin' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {role}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-300 bg-[#3E3160]/50 p-3 rounded-xl border border-[#5C4B8B]/50">
                    <div className="font-bold text-[#C3A6E6] mb-1">{t.headerProfileInfo || "Profile Information"}</div>
                    <p className="text-xs opacity-80">{t.profileDesc || "Your language preferences and favorite articles are stored here. They sync across your devices."}</p>
                  </div>
                  
                  <button 
                    onClick={() => { setProfileModalOpen(true); setMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 bg-[#2F244F] hover:bg-[#5C4B8B] text-white border border-[#5C4B8B] px-4 py-3 rounded-xl font-bold transition-colors"
                  >
                    <UserIcon size={20} />
                    {t.headerProfileSettings}
                  </button>

                  <button 
                    onClick={() => { setLogoutConfirmOpen(true); setMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 bg-[#2F244F] hover:bg-red-500/20 text-red-400 border border-[#5C4B8B] px-4 py-3 rounded-xl font-bold transition-colors"
                  >
                    <LogOut size={20} />
                    {t.logout || "Logout"}
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => { loginWithGoogle(); setMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-center gap-3 bg-white text-[#2F244F] px-4 py-4 rounded-xl font-black transition-all active:scale-95 shadow-xl"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {t.loginWithGoogle || "Login with Google"}
                  </button>
                  
                  <button 
                    onClick={() => { /* Open email login */ setMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-center gap-3 bg-[#2F244F] border border-[#5C4B8B] text-white px-4 py-4 rounded-xl font-black transition-all active:scale-95"
                  >
                    <Mail size={24} className="text-[#C3A6E6]" />
                    {t.headerLoginEmail}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <ConfirmModal
        isOpen={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={logout}
        title={t.confirmLogoutTitle || "Log Out"}
        message={t.confirmLogoutMessage || "Are you sure you want to log out?"}
        confirmText={t.logout || "Logout"}
        cancelText={t.cancelBtn || "Cancel"}
        isDestructive={true}
      />
      <ProfileModal 
        isOpen={profileModalOpen} 
        onClose={() => setProfileModalOpen(false)} 
        lang={lang} 
      />
    </>
  );
};
