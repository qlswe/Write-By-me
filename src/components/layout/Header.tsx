import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { Language, translations } from '../../data/translations';
import { useAuth } from '../../hooks/useAuth';
import { usePerfLogger } from '../../utils/logger';

interface HeaderProps {
  lang: Language;
  setLang: (lang: Language) => void;
  section: string;
  setSection: (section: any) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  navItems: readonly { id: string; label: string; icon: any }[];
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  setLang,
  section,
  setSection,
  mobileMenuOpen,
  setMobileMenuOpen,
  navItems
}) => {
  const t = translations[lang];
  const { user, loginWithGoogle, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const { trackRender } = usePerfLogger('Header');
  trackRender();

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#3E3160]/90 backdrop-blur-md border-b border-[#5C4B8B] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <h1 className="text-lg md:text-xl font-bold text-[#C3A6E6] tracking-tight shrink-0">
            {t.siteName}
          </h1>
          
          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#2F244F]/80 backdrop-blur-md p-1.5 rounded-2xl border border-[#5C4B8B]/50 overflow-x-auto no-scrollbar">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                  section === item.id 
                    ? 'text-white bg-[#5C4B8B] shadow-md' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#3E3160]/50'
                }`}
              >
                <item.icon size={16} className="shrink-0" />
                <span className="hidden xl:inline">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#C3A6E6]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
              <select 
                value={lang} 
                onChange={(e) => setLang(e.target.value as Language)}
                className="appearance-none bg-[#2F244F] border border-[#5C4B8B] rounded-lg pl-9 pr-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C3A6E6] text-gray-200 cursor-pointer hover:border-[#C3A6E6] transition-colors"
              >
                <option value="ru">RU</option>
                <option value="en">EN</option>
                <option value="by">BY</option>
                <option value="jp">JP</option>
                <option value="de">DE</option>
                <option value="fr">FR</option>
                <option value="zh">ZH</option>
              </select>
            </div>

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
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-start gap-2 text-sm text-gray-300 mb-4">
                            <UserIcon size={16} className="text-[#C3A6E6] shrink-0 mt-0.5" />
                            <div>
                              <div className="font-bold text-white mb-1">{t.profileInfo || "Profile Information"}</div>
                              <p className="text-xs text-gray-400 leading-relaxed">
                                {t.profileDesc || "Your language preferences and favorite articles are stored here. They sync across your devices."}
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={() => { logout(); setProfileOpen(false); }}
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
                <button 
                  onClick={loginWithGoogle}
                  className="flex items-center gap-2 bg-[#C3A6E6] hover:bg-[#B094EB] text-[#2F244F] px-3 py-1.5 rounded-lg text-sm font-bold transition-colors whitespace-nowrap"
                >
                  <LogIn size={14} />
                  {t.login || "Login"}
                </button>
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
            className="md:hidden fixed inset-0 z-40 bg-[#2F244F] pt-20 px-4 flex flex-col"
          >
            <div className="flex flex-col gap-4 flex-1">
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
            
            <div className="p-6 border-t border-[#5C4B8B] mt-auto">
              {user ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3 bg-[#3E3160] p-3 rounded-xl border border-[#5C4B8B]">
                    <img src={user.photoURL || ''} alt="Avatar" className="w-12 h-12 rounded-full border border-[#5C4B8B]" />
                    <div>
                      <div className="text-white font-bold">{user.displayName}</div>
                      <div className="text-xs text-gray-400">{user.email}</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-300 bg-[#3E3160]/50 p-3 rounded-xl border border-[#5C4B8B]/50">
                    <div className="font-bold text-[#C3A6E6] mb-1">{t.profileInfo || "Profile Information"}</div>
                    <p className="text-xs opacity-80">{t.profileDesc || "Your language preferences and favorite articles are stored here. They sync across your devices."}</p>
                  </div>
                  <button 
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 bg-[#2F244F] hover:bg-red-500/20 text-red-400 border border-[#5C4B8B] px-4 py-3 rounded-xl font-bold transition-colors"
                  >
                    <LogOut size={20} />
                    {t.logout || "Logout"}
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => { loginWithGoogle(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 bg-[#C3A6E6] hover:bg-[#B094EB] text-[#2F244F] px-4 py-3 rounded-xl font-bold transition-colors"
                >
                  <LogIn size={20} />
                  {t.loginWithGoogle || "Login with Google"}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
