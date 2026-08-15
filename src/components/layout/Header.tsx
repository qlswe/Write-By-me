import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, LogIn, LogOut, User as UserIcon, Bookmark, Trash2, Zap, ZapOff, Globe, Mail, Settings, Sparkles, RotateCw, Terminal, Smartphone, UserPlus, Bell } from 'lucide-react';
import { Language, translations } from '../../data/translations';
import { useAuth } from '../../hooks/useAuth';
import { usePerfLogger } from '../../utils/logger';
import { ConfirmModal } from '../ui/ConfirmModal';
import { ProfileModal } from '../ui/ProfileModal';
import { GoogleLoginButton } from '../ui/GoogleLoginButton';
import { EmailLoginModal } from '../ui/EmailLoginModal';
import { PwaInstallModal } from '../ui/PwaInstallModal';
import { TelegramButton } from '../ui/TelegramButton';
import { IPv6Modal } from '../ui/IPv6Modal';
import { AhaProtocolModal } from '../ui/AhaProtocolModal';
import { AhaEmbeddedBrowserModal } from '../ui/AhaEmbeddedBrowserModal';
import { NotificationDrawer } from '../notifications/NotificationDrawer';
import { useNotifications } from '../../hooks/useNotifications';
import { usePWA } from '../../hooks/usePWA';
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
  const { canInstall, isInstalled, installPWA } = usePWA();
  const [profileOpen, setProfileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [emailLoginModalOpen, setEmailLoginModalOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [pwaModalOpen, setPwaModalOpen] = useState(false);
  const [ipv6ModalOpen, setIpv6ModalOpen] = useState(false);
  const [ahaProtocolModalOpen, setAhaProtocolModalOpen] = useState(false);
  const [embeddedBrowserOpen, setEmbeddedBrowserOpen] = useState(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);

  const {
    notifications,
    unreadCount: notifUnreadCount,
    loading: notifLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll: clearAllNotifications
  } = useNotifications();

  const handleNavigateToPost = (postId: string, targetSection = 'forum') => {
    setSection(targetSection);
    setTimeout(() => {
      const el = document.getElementById(`post-${postId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      window.dispatchEvent(new CustomEvent('aha_highlight_post', { detail: { postId } }));
    }, 350);
  };
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
    const handleOpenBrowser = () => {
      setEmbeddedBrowserOpen(true);
    };
    window.addEventListener('openEmailLogin', handleOpenEmailLogin);
    window.addEventListener('openAhaBrowser', handleOpenBrowser);
    return () => {
      window.removeEventListener('openEmailLogin', handleOpenEmailLogin);
      window.removeEventListener('openAhaBrowser', handleOpenBrowser);
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#15101e] border-b border-[#251c35] shadow-2xl w-full max-w-full">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2 box-border">
          <h1 
            onClick={() => setSection('home')}
            className="text-base sm:text-xl md:text-2xl font-black text-white tracking-tighter shrink flex items-center gap-1.5 sm:gap-2 cursor-pointer select-none group min-w-0"
          >
            <motion.div
              whileHover={{ rotate: 180, scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="shrink-0"
            >
              <Zap className="text-[#ff4d4d] fill-[#ff4d4d] transition-all group-hover:drop-shadow-[0_0_12px_rgba(255,77,77,0.8)]" size={22} />
            </motion.div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400 truncate">
              {t.siteName}
            </span>
          </h1>
          
          {/* Desktop & Tablet Nav */}
          <nav 
            ref={navRef}
            className="hidden md:flex items-center gap-1 bg-[#251c35] p-1 rounded-2xl border border-[#3d2b4f]/30 overflow-x-auto no-scrollbar scroll-smooth"
          >
            {navItems.map(item => {
              const isActive = section === item.id;
              return (
                <motion.button
                  key={item.id}
                  data-active={isActive}
                  onClick={() => {
                    setSection(item.id);
                    if (item.id === 'browser') {
                      setEmbeddedBrowserOpen(true);
                    }
                  }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black tracking-wide transition-colors whitespace-nowrap cursor-pointer ${
                    isActive ? 'text-[#15101e]' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavTab"
                      className="absolute inset-0 bg-[#ff4d4d] rounded-xl shadow-[0_0_20px_rgba(255,77,77,0.4)]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <div className="relative z-10 flex items-center gap-1.5">
                    <item.icon size={15} className="shrink-0" />
                    <span>{item.label}</span>
                    {item.id === 'chats' && unreadCount > 0 && (
                      <motion.span 
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none transition-colors ${
                          isActive 
                            ? 'bg-[#15101e] text-[#ff4d4d]' 
                            : 'bg-[#ff4d4d] text-white shadow-[0_0_8px_rgba(255,77,77,0.4)]'
                        }`}
                      >
                        {unreadCount}
                      </motion.span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 ml-auto">
            {/* Custom Language Selector */}
            <div className="relative shrink-0">
              <button 
                type="button"
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 bg-[#251c35]/60 border border-[#3d2b4f]/50 hover:border-[#ff4d4d] text-gray-200 px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition-all uppercase tracking-wider group cursor-pointer shrink-0"
              >
                <Globe size={14} className="text-[#ff4d4d] transition-transform shrink-0" />
                <span>{lang}</span>
              </button>
              
              <AnimatePresence>
                {langOpen && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 top-full mt-2 w-44 max-w-[calc(100vw-1.5rem)] bg-[#15101e] border border-[#3d2b4f] rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] overflow-hidden z-[999] p-1.5"
                  >
                    {(['ru', 'en', 'by', 'de', 'fr', 'zh'] as Language[]).map(l => {
                      const langNames: Record<Language, string> = {
                        ru: 'Русский 🇷🇺',
                        en: 'English 🇬🇧',
                        by: 'Беларуская 🇧🇾',
                        de: 'Deutsch 🇩🇪',
                        fr: 'Français 🇫🇷',
                        zh: '中文 🇨🇳'
                      };
                      return (
                      <button
                        key={l}
                        type="button"
                        onClick={() => { setLang(l); setLangOpen(false); }}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer flex items-center justify-between ${
                          lang === l 
                            ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg shadow-[#ff4d4d]/20' 
                            : 'text-gray-300 hover:bg-[#251c35] hover:text-white'
                        }`}
                      >
                        <span>{langNames[l]}</span>
                        {lang === l && <span className="text-[10px] font-black uppercase">✓</span>}
                      </button>
                    )})}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* IPv6 Popularization & Protocol Badge */}
            <button
              onClick={() => setIpv6ModalOpen(true)}
              className="hidden md:flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-400 transition-all duration-300 active:scale-95 shadow-md shadow-emerald-500/10 cursor-pointer"
              title={lang === 'ru' ? "IPv6 Центр Популяризации (Dual-Stack ::)" : "IPv6 Protocol Promotion Center"}
            >
              <Globe size={14} className="text-emerald-400 animate-pulse" />
              <span className="text-[10px] sm:text-[11px] font-black tracking-wide">IPv6</span>
            </button>

            {/* AHA Protocol v6 Hyper-Acceleration Badge */}
            <button
              onClick={() => setAhaProtocolModalOpen(true)}
              className="hidden md:flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border bg-[#ff4d4d]/10 border-[#ff4d4d]/30 text-[#ff4d4d] hover:bg-[#ff4d4d]/20 hover:border-[#ff4d4d] transition-all duration-300 active:scale-95 shadow-md shadow-[#ff4d4d]/10 cursor-pointer"
              title={lang === 'ru' ? "AHA Protocol v6 (Adaptive IPv6 Hyper-Acceleration)" : "AHA Protocol v6 Hyper-Acceleration"}
            >
              <Zap size={14} className="text-[#ff4d4d] animate-pulse" />
              <span className="text-[10px] sm:text-[11px] font-black tracking-wide">AHA-v6</span>
            </button>

            <button 
              onClick={() => sdk.reloadApp()}
              className="hidden md:flex items-center justify-center p-2 rounded-xl border bg-[#15101e] border-[#3d2b4f]/60 text-gray-300 hover:text-[#ff4d4d] hover:border-[#ff4d4d] transition-all duration-300 active:scale-95 shadow-md shadow-[#ff4d4d]/5"
              title={lang === 'ru' ? "Обновить сайт вручную (очистить кэш)" : "Force reload & clear cache"}
            >
              <RotateCw size={14} className="text-[#ff4d4d]" />
            </button>

            {onToggleConsole && (
              <button 
                onClick={onToggleConsole}
                className={`hidden md:flex items-center justify-center p-2 rounded-xl border transition-all duration-300 active:scale-95 shadow-md ${
                  isConsoleOpen
                    ? 'bg-[#ff4d4d] border-white/30 text-white shadow-[0_0_12px_rgba(255,77,77,0.5)]'
                    : 'bg-[#15101e] border-[#3d2b4f]/60 text-gray-300 hover:text-[#ff4d4d] hover:border-[#ff4d4d]'
                }`}
                title={lang === 'ru' ? "Консоль сайта (Логи)" : "Site Console"}
              >
                <Terminal size={14} className={isConsoleOpen ? 'text-white' : 'text-[#ff4d4d]'} />
              </button>
            )}

            {/* Notification Shade Bell Button (Desktop) */}
            <button
              onClick={() => setNotificationDrawerOpen(true)}
              className={`relative flex items-center justify-center p-2 rounded-xl border transition-all duration-300 active:scale-95 shadow-md cursor-pointer ${
                notifUnreadCount > 0
                  ? 'bg-[#ff4d4d]/10 border-[#ff4d4d]/50 text-[#ff4d4d] hover:bg-[#ff4d4d]/20 shadow-[0_0_12px_rgba(255,77,77,0.2)]'
                  : 'bg-[#15101e] border-[#3d2b4f]/60 text-gray-300 hover:text-[#ff4d4d] hover:border-[#ff4d4d]'
              }`}
              title={lang === 'ru' ? "Шторка уведомлений (Активность постов)" : "Notification Shade (Post Activity)"}
            >
              <Bell size={16} className={notifUnreadCount > 0 ? "text-[#ff4d4d] animate-bounce" : ""} />
              {notifUnreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-black bg-[#ff4d4d] text-white shadow-[0_0_8px_rgba(255,77,77,0.8)] animate-pulse">
                  {notifUnreadCount > 99 ? '99+' : notifUnreadCount}
                </span>
              )}
            </button>

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
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-[#3d2b4f]/50 border border-[#3d2b4f] text-white rounded-xl font-black uppercase tracking-widest text-[11px] hover:bg-[#ff4d4d] hover:text-[#15101e] hover:border-[#ff4d4d] transition-all active:scale-95 cursor-pointer shadow-md h-[40px]"
                    title={t.headerLoginEmail}
                  >
                    <UserPlus size={14} className="text-[#ff4d4d] group-hover:text-[#15101e]" />
                    <span>{lang === 'ru' ? 'Вход / Регистрация' : 'Sign In / Register'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Notification Shade Bell Button */}
            <button
              onClick={() => setNotificationDrawerOpen(true)}
              className={`md:hidden relative p-2 rounded-xl border transition-all duration-300 active:scale-95 cursor-pointer shrink-0 ${
                notifUnreadCount > 0
                  ? 'bg-[#ff4d4d]/10 border-[#ff4d4d]/50 text-[#ff4d4d]'
                  : 'bg-[#15101e] border-[#3d2b4f]/60 text-gray-300 hover:text-[#ff4d4d]'
              }`}
              title={lang === 'ru' ? "Шторка уведомлений" : "Notifications"}
            >
              <Bell size={20} className={notifUnreadCount > 0 ? "text-[#ff4d4d] animate-bounce" : ""} />
              {notifUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1 min-w-[16px] h-[16px] flex items-center justify-center rounded-full text-[9px] font-black bg-[#ff4d4d] text-white shadow-[0_0_6px_rgba(255,77,77,0.8)] animate-pulse">
                  {notifUnreadCount > 99 ? '99+' : notifUnreadCount}
                </span>
              )}
            </button>

            <button 
              className="md:hidden p-2 text-gray-300 hover:text-[#ff4d4d] shrink-0"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>

      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed top-[56px] sm:top-16 inset-x-0 bottom-0 z-[200] bg-[#15101e] backdrop-blur-xl px-4 py-5 flex flex-col overflow-y-auto overflow-x-hidden w-full max-w-full box-border border-t border-[#3d2b4f]/60 shadow-2xl"
          >
            <div className="flex flex-col gap-4 flex-1 shrink-0">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSection(item.id);
                    if (item.id === 'browser') {
                      setEmbeddedBrowserOpen(true);
                    }
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
            
            <div className="p-4 sm:p-6 border-t border-[#3d2b4f] mt-auto shrink-0 flex flex-col gap-4">
              {/* Mobile Language Selector */}
              <div className="flex flex-col gap-2 p-3 bg-[#15101e] border border-[#3d2b4f] rounded-2xl">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                  <Globe size={14} className="text-[#ff4d4d]" />
                  <span>{lang === 'ru' ? 'Язык интерфейса / Language' : 'Interface Language'}</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['ru', 'en', 'by', 'de', 'fr', 'zh'] as Language[]).map(l => (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      className={`px-2.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer border ${
                        lang === l
                          ? 'bg-[#ff4d4d] text-[#15101e] border-[#ff4d4d] shadow-md shadow-[#ff4d4d]/30'
                          : 'bg-[#251c35]/60 text-gray-300 border-[#3d2b4f]/40 hover:bg-[#3d2b4f] hover:text-white'
                      }`}
                    >
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions Grid for Mobile */}
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => { setIpv6ModalOpen(true); setMobileMenuOpen(false); }}
                  className="flex items-center justify-center gap-2 bg-[#15101e] border border-emerald-500/40 text-emerald-300 p-3 rounded-xl text-xs font-bold hover:bg-emerald-500/20 transition-all cursor-pointer"
                >
                  <Globe size={16} className="text-emerald-400 animate-pulse" />
                  <span>IPv6 Центр</span>
                </button>

                <button 
                  onClick={() => { setAhaProtocolModalOpen(true); setMobileMenuOpen(false); }}
                  className="flex items-center justify-center gap-2 bg-[#15101e] border border-[#ff4d4d]/40 text-[#ff4d4d] p-3 rounded-xl text-xs font-bold hover:bg-[#ff4d4d]/20 transition-all cursor-pointer"
                >
                  <Zap size={16} className="text-[#ff4d4d] animate-pulse" />
                  <span>AHA-v6</span>
                </button>

                <button 
                  onClick={() => { setEmbeddedBrowserOpen(true); setMobileMenuOpen(false); }}
                  className="flex items-center justify-center gap-2 bg-[#15101e] border border-purple-500/40 text-purple-300 p-3 rounded-xl text-xs font-bold hover:bg-purple-500/20 transition-all cursor-pointer"
                >
                  <Globe size={16} className="text-purple-400 animate-pulse" />
                  <span>{lang === 'ru' ? 'Браузер' : 'Browser'}</span>
                </button>

                <button 
                  onClick={() => { setPwaModalOpen(true); setMobileMenuOpen(false); }}
                  className="flex items-center justify-center gap-2 bg-[#15101e] border border-cyan-500/40 text-cyan-300 p-3 rounded-xl text-xs font-bold hover:bg-cyan-500/20 transition-all cursor-pointer"
                >
                  <Smartphone size={16} className="text-cyan-400 animate-pulse" />
                  <span>{lang === 'ru' ? 'EXE, APK & App' : 'EXE, APK & App'}</span>
                </button>

                {onToggleConsole && (
                  <button 
                    onClick={() => { onToggleConsole(); setMobileMenuOpen(false); }}
                    className="flex items-center justify-center gap-2 bg-[#15101e] border border-[#3d2b4f] text-gray-200 p-3 rounded-xl text-xs font-bold hover:text-[#ff4d4d] hover:border-[#ff4d4d] transition-all cursor-pointer"
                  >
                    <Terminal size={16} className="text-[#ff4d4d]" />
                    <span>{lang === 'ru' ? 'Консоль' : 'Console'}</span>
                  </button>
                )}

                <button 
                  onClick={() => { sdk.reloadApp(); setMobileMenuOpen(false); }}
                  className="flex items-center justify-center gap-2 bg-[#15101e] border border-[#3d2b4f] text-gray-200 p-3 rounded-xl text-xs font-bold hover:text-[#ff4d4d] hover:border-[#ff4d4d] transition-all cursor-pointer"
                >
                  <RotateCw size={16} className="text-[#ff4d4d]" />
                  <span>{lang === 'ru' ? 'Обновить' : 'Reload'}</span>
                </button>
              </div>

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
                    className="w-full flex items-center justify-center gap-3 bg-[#15101e] border border-[#3d2b4f] text-white px-4 py-4 rounded-xl font-black transition-all active:scale-95 mb-4 hover:border-[#ff4d4d] cursor-pointer"
                  >
                    <UserPlus size={22} className="text-[#ff4d4d]" />
                    <span>{lang === 'ru' ? 'Регистрация и Вход по Почте' : 'Sign Up / Sign In (Email)'}</span>
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
      <PwaInstallModal
        isOpen={pwaModalOpen}
        onClose={() => setPwaModalOpen(false)}
        lang={lang}
      />
      <IPv6Modal
        isOpen={ipv6ModalOpen}
        onClose={() => setIpv6ModalOpen(false)}
        lang={lang}
      />
      <AhaProtocolModal
        isOpen={ahaProtocolModalOpen}
        onClose={() => setAhaProtocolModalOpen(false)}
        lang={lang}
      />
      <AhaEmbeddedBrowserModal
        isOpen={embeddedBrowserOpen}
        onClose={() => setEmbeddedBrowserOpen(false)}
        lang={lang}
      />
      <NotificationDrawer
        isOpen={notificationDrawerOpen}
        onClose={() => setNotificationDrawerOpen(false)}
        notifications={notifications}
        unreadCount={notifUnreadCount}
        loading={notifLoading}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onDeleteNotification={deleteNotification}
        onClearAll={clearAllNotifications}
        lang={lang}
        onNavigateToPost={handleNavigateToPost}
      />
    </>
  );
};
