import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, LogIn, LogOut, User as UserIcon, Bookmark, Trash2, Zap, ZapOff, Globe, Mail, Settings, Sparkles, RotateCw, Terminal } from 'lucide-react';
import { Language, translations } from '../../data/translations';
import { useAuth } from '../../hooks/useAuth';
import { usePerfLogger } from '../../utils/logger';
import { ConfirmModal } from '../ui/ConfirmModal';
import { ProfileModal } from '../ui/ProfileModal';
import { GoogleLoginButton } from '../ui/GoogleLoginButton';
import { EmailLoginModal } from '../ui/EmailLoginModal';
import { sdk } from '../../sdk';

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
  unreadCount?: number;
  onToggleConsole?: () => void;
  isConsoleOpen?: boolean;
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
  role,
  unreadCount = 0,
  onToggleConsole,
  isConsoleOpen = false
}) => {
  const t = translations[lang];
  const { user, loginWithGoogle, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [emailLoginModalOpen, setEmailLoginModalOpen] = useState(false);
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

  useEffect(() => {
    const handleOpenEmailLogin = () => {
      setEmailLoginModalOpen(true);
    };
    window.addEventListener('openEmailLogin', handleOpenEmailLogin);
    return () => {
      window.removeEventListener('openEmailLogin', handleOpenEmailLogin);
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#15101e] border-b border-[#251c35] shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter shrink-0 flex items-center gap-2">
            <Zap className="text-[#ff4d4d] fill-[#ff4d4d]" size={24} />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              {t.siteName}
            </span>
          </h1>
          
          {/* Desktop Nav */}
          <nav 
            ref={navRef}
            className="hidden lg:flex items-center gap-1 bg-[#251c35] p-1 rounded-2xl border border-[#3d2b4f]/30 overflow-x-auto no-scrollbar scroll-smooth"
          >
            {navItems.map(item => (
              <button
                key={item.id}
                data-active={section === item.id}
                onClick={() => setSection(item.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black tracking-wide transition-all whitespace-nowrap ${
                  section === item.id 
                    ? 'text-[#15101e] bg-[#ff4d4d] shadow-[0_0_20px_rgba(255,77,77,0.3)]' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#251c35]/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <item.icon size={16} className="shrink-0" />
                  <span className="hidden xl:inline">{item.label}</span>
                  {item.id === 'chats' && unreadCount > 0 && (
                    <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none transition-colors ${
                      section === item.id 
                        ? 'bg-[#15101e] text-[#ff4d4d]' 
                        : 'bg-[#ff4d4d] text-white shadow-[0_0_8px_rgba(255,77,77,0.4)]'
                    }`}>
                      {unreadCount}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            {/* Custom Language Selector */}
            <div className="relative">
              <button 
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-2 bg-[#251c35]/60 border border-[#3d2b4f]/50 hover:border-[#ff4d4d] text-gray-200 px-3 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest group"
              >
                <Globe size={14} className="text-[#ff4d4d] transition-transform" />
                {lang}
              </button>
              
              <AnimatePresence>
                {langOpen && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-3 w-40 bg-[#15101e] border border-[#251c35] rounded-2xl shadow-2xl overflow-hidden z-50 p-1.5"
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
                            ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg shadow-[#ff4d4d]/20' 
                            : 'text-gray-400 hover:bg-[#251c35] hover:text-white'
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
                    : 'bg-[#15101e] border-[#3d2b4f] text-gray-300 hover:text-white hover:border-[#ff4d4d]'
                }`}
                title={lowPerfMode ? (t.lowPerfModeOn || "Performance Mode: ON") : (t.lowPerfModeOff || "Performance Mode: OFF")}
              >
                {lowPerfMode ? <ZapOff size={18} /> : <Zap size={18} />}
              </button>
            )}

            <button 
              onClick={() => sdk.reloadApp()}
              className="hidden sm:flex items-center justify-center p-2 rounded-xl border bg-[#15101e] border-[#3d2b4f]/60 text-gray-300 hover:text-[#ff4d4d] hover:border-[#ff4d4d] transition-all duration-300 active:scale-95 shadow-md shadow-[#ff4d4d]/5"
              title={lang === 'ru' ? "Обновить сайт вручную (очистить кэш)" : "Force reload & clear cache"}
            >
              <RotateCw size={14} className="text-[#ff4d4d]" />
            </button>

            {onToggleConsole && (
              <button 
                onClick={onToggleConsole}
                className={`hidden sm:flex items-center justify-center p-2 rounded-xl border transition-all duration-300 active:scale-95 shadow-md ${
                  isConsoleOpen
                    ? 'bg-[#ff4d4d] border-white/30 text-white shadow-[0_0_12px_rgba(255,77,77,0.5)]'
                    : 'bg-[#15101e] border-[#3d2b4f]/60 text-gray-300 hover:text-[#ff4d4d] hover:border-[#ff4d4d]'
                }`}
                title={lang === 'ru' ? "Консоль сайта (Логи)" : "Site Console"}
              >
                <Terminal size={14} className={isConsoleOpen ? 'text-white' : 'text-[#ff4d4d]'} />
              </button>
            )}

            <div className="hidden lg:block relative">
              {user ? (
                <div className="relative">
                  <button 
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 bg-[#15101e] border border-[#3d2b4f] hover:border-[#ff4d4d] text-gray-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    <img src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=1c1528&color=fff`} alt="Avatar" className="w-5 h-5 rounded-xl object-cover" />
                    <span className="max-w-[100px] truncate">{user.displayName}</span>
                  </button>
                  
                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-64 bg-[#251c35] border border-[#3d2b4f] rounded-xl shadow-xl overflow-hidden z-50"
                      >
                        <div className="p-4 border-b border-[#3d2b4f] bg-[#15101e]">
                          <div className="flex items-center gap-3 mb-2">
                            <img src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=1c1528&color=fff`} alt="Avatar" className="w-10 h-10 rounded-xl border border-[#3d2b4f] object-cover" />
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
                            <UserIcon size={16} className="text-[#ff4d4d] shrink-0 mt-0.5" />
                            <div>
                              <div className="font-bold text-white mb-1">{t.headerProfileInfo || "Profile Information"}</div>
                              <p className="text-xs text-gray-400 leading-relaxed">
                                {t.profileDesc || "Your language preferences and favorite articles are stored here. They sync across your devices."}
                              </p>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => { setProfileModalOpen(true); setProfileOpen(false); }}
                            className="w-full flex items-center justify-center gap-2 bg-[#15101e] hover:bg-[#3d2b4f] text-white border border-[#3d2b4f] hover:border-[#ff4d4d] px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-2"
                          >
                            <UserIcon size={16} />
                            {t.headerProfileSettings}
                          </button>

                          <button 
                            onClick={() => { setSection('sdk'); setProfileOpen(false); }}
                            className="w-full flex items-center justify-center gap-2 bg-[#15101e] hover:bg-[#3d2b4f] text-white border border-[#3d2b4f] hover:border-[#ff4d4d] px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-2"
                          >
                            <Settings size={16} />
                            {t.sdkSettings || "Настройки SDK"}
                          </button>

                          <button 
                            onClick={() => { setSection('ai'); setProfileOpen(false); }}
                            className="w-full flex items-center justify-center gap-2 bg-[#15101e] hover:bg-[#3d2b4f] text-[#ff4d4d] border border-[#3d2b4f] hover:border-[#ff4d4d] px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-2"
                          >
                            <Sparkles size={16} />
                            {t.sdkMinistryPanel || "ИИшка / Aha AI"}
                          </button>

                          <button 
                            onClick={() => { setLogoutConfirmOpen(true); setProfileOpen(false); }}
                            className="w-full flex items-center justify-center gap-2 bg-[#15101e] hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-[#3d2b4f] hover:border-red-500/50 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
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
                  <GoogleLoginButton lang={lang} size="sm" onClick={() => setMobileMenuOpen(false)} />
                  <button
                    onClick={() => setEmailLoginModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#3d2b4f]/40 border border-[#3d2b4f] text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-[#ff4d4d] hover:text-[#15101e] hover:border-[#ff4d4d] transition-all active:scale-95 cursor-pointer shadow-md h-[40px]"
                    title={t.headerLoginEmail}
                  >
                    <Mail size={14} />
                    <span className="hidden sm:inline">{lang === 'ru' ? 'Почта' : 'Email'}</span>
                  </button>
                </div>
              )}
            </div>

            <button 
              className="lg:hidden p-2 text-gray-300 hover:text-[#ff4d4d] shrink-0"
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
            className="lg:hidden fixed inset-0 z-40 bg-[#15101e] pt-20 px-4 flex flex-col overflow-y-auto pb-6"
          >
            <div className="flex flex-col gap-4 flex-1 shrink-0">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSection(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-between p-4 rounded-xl text-xl font-semibold w-full ${
                    section === item.id 
                      ? 'bg-[#3d2b4f] text-[#ff4d4d]' 
                      : 'text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <item.icon size={24} />
                    {item.label}
                  </div>
                  {item.id === 'chats' && unreadCount > 0 && (
                    <span className="bg-[#ff4d4d] text-[#15101e] font-black text-xs px-2.5 py-1 rounded-full shadow-[0_0_10px_rgba(255,77,77,0.4)]">
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
            
            <div className="p-6 border-t border-[#3d2b4f] mt-auto shrink-0 flex flex-col gap-4">
              {/* Quick Actions Grid for Mobile */}
              <div className="grid grid-cols-2 gap-2.5 sm:hidden">
                <button 
                  onClick={() => { sdk.reloadApp(); setMobileMenuOpen(false); }}
                  className="flex items-center justify-center gap-2 bg-[#15101e] border border-[#3d2b4f] text-gray-200 p-3 rounded-xl text-xs font-bold hover:text-[#ff4d4d] hover:border-[#ff4d4d] transition-all"
                >
                  <RotateCw size={16} className="text-[#ff4d4d]" />
                  <span>{lang === 'ru' ? 'Обновить' : 'Reload'}</span>
                </button>

                {onToggleConsole && (
                  <button 
                    onClick={() => { onToggleConsole(); setMobileMenuOpen(false); }}
                    className={`flex items-center justify-center gap-2 border p-3 rounded-xl text-xs font-bold transition-all ${
                      isConsoleOpen
                        ? 'bg-[#ff4d4d] border-white/30 text-white shadow-[0_0_10px_rgba(255,77,77,0.4)]'
                        : 'bg-[#15101e] border-[#3d2b4f] text-gray-200 hover:text-[#ff4d4d]'
                    }`}
                  >
                    <Terminal size={16} className={isConsoleOpen ? 'text-white' : 'text-[#ff4d4d]'} />
                    <span>{lang === 'ru' ? 'Консоль' : 'Console'}</span>
                  </button>
                )}
              </div>
              {toggleLowPerfMode && (
                <button 
                  onClick={toggleLowPerfMode}
                  className={`w-full flex items-center justify-center gap-2 bg-[#15101e] border border-[#3d2b4f] px-4 py-3 rounded-xl font-bold transition-colors ${
                    lowPerfMode 
                      ? 'text-yellow-400 hover:bg-yellow-400/10' 
                      : 'text-gray-300 hover:bg-[#251c35]'
                  }`}
                >
                  {lowPerfMode ? <ZapOff size={20} /> : <Zap size={20} />}
                  {lowPerfMode ? (t.lowPerfModeOn || "Performance Mode: ON") : (t.lowPerfModeOff || "Performance Mode: OFF")}
                </button>
              )}

              {user ? (
                <>
                  <div className="flex items-center gap-3 bg-[#251c35] p-3 rounded-xl border border-[#3d2b4f]">
                    <img src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=1c1528&color=fff`} alt="Avatar" className="w-12 h-12 rounded-xl border border-[#3d2b4f] object-cover" />
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
                  <div className="text-sm text-gray-300 bg-[#251c35]/50 p-3 rounded-xl border border-[#3d2b4f]/50">
                    <div className="font-bold text-[#ff4d4d] mb-1">{t.headerProfileInfo || "Profile Information"}</div>
                    <p className="text-xs opacity-80">{t.profileDesc || "Your language preferences and favorite articles are stored here. They sync across your devices."}</p>
                  </div>
                  
                  <button 
                    onClick={() => { setProfileModalOpen(true); setMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 bg-[#15101e] hover:bg-[#3d2b4f] text-white border border-[#3d2b4f] px-4 py-3 rounded-xl font-bold transition-colors"
                  >
                    <UserIcon size={20} />
                    {t.headerProfileSettings}
                  </button>

                  <button 
                    onClick={() => { setLogoutConfirmOpen(true); setMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 bg-[#15101e] hover:bg-red-500/20 text-red-400 border border-[#3d2b4f] px-4 py-3 rounded-xl font-bold transition-colors"
                  >
                    <LogOut size={20} />
                    {t.logout || "Logout"}
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => { setEmailLoginModalOpen(true); setMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-center gap-3 bg-[#15101e] border border-[#3d2b4f] text-white px-4 py-4 rounded-xl font-black transition-all active:scale-95 mb-4 hover:border-[#ff4d4d]"
                  >
                    <Mail size={24} className="text-[#ff4d4d]" />
                    {t.headerLoginEmail}
                  </button>
                  <GoogleLoginButton lang={lang} className="w-full" onClick={() => setMobileMenuOpen(false)} />
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
      <EmailLoginModal
        isOpen={emailLoginModalOpen}
        onClose={() => setEmailLoginModalOpen(false)}
        lang={lang}
      />
    </>
  );
};
