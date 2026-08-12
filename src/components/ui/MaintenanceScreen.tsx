import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, LogOut, Mail, MessageSquare, AlertOctagon, Lock } from 'lucide-react';
import { Language, translations } from '../../data/translations';
import { useAuth } from '../../hooks/useAuth';
import { GoogleLoginButton } from './GoogleLoginButton';

interface MaintenanceScreenProps {
  lang: Language;
  customReason?: string;
  updatedAt?: number;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({ 
  lang, 
  customReason,
  updatedAt
}) => {
  const { user, logout } = useAuth();
  const t = translations[lang] || translations.ru;

  const isRu = lang === 'ru';

  return (
    <div className="min-h-screen bg-[#0d0b14] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ff4d4d]/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#3d2b4f]/25 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-900/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="bg-[#15101e]/90 backdrop-blur-2xl border border-red-500/30 rounded-3xl p-6 sm:p-10 max-w-xl w-full text-center shadow-[0_0_50px_rgba(255,77,77,0.15)] relative z-10"
      >
        {/* Top Lock Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono font-bold uppercase tracking-widest mb-6">
          <Lock size={13} className="animate-pulse" />
          <span>{isRu ? 'AHA-PROTOCOL: ДОСТУП ОГРАНИЧЕН' : 'AHA-PROTOCOL: SITE LOCKED'}</span>
        </div>

        <div className="flex justify-center mb-6">
          <div className="p-5 bg-gradient-to-tr from-red-600/20 to-red-500/10 rounded-3xl border border-red-500/30 shadow-inner relative group">
            <ShieldAlert size={56} className="text-[#ff4d4d] drop-shadow-[0_0_15px_rgba(255,77,77,0.5)]" />
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full animate-ping" />
          </div>
        </div>
        
        <h1 className="text-2xl sm:text-4xl font-black text-white mb-3 uppercase tracking-wider font-sans leading-tight">
          {t.maintenanceSiteClosed || (isRu ? 'Сайт временно закрыт' : 'Site Temporarily Closed')}
        </h1>

        {/* Custom Reason Announcement Box */}
        {customReason && customReason.trim().length > 0 ? (
          <div className="my-6 text-left bg-[#1a1226] border-l-4 border-[#ff4d4d] border-y border-r border-[#3d2b4f]/80 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden group">
            <div className="flex items-center gap-2 text-[#ff4d4d] text-xs font-bold uppercase tracking-wider mb-2 font-mono">
              <MessageSquare size={14} />
              <span>{isRu ? 'Причина закрытия от администрации:' : 'Official Closure Reason:'}</span>
            </div>
            <p className="text-white sm:text-lg font-medium leading-relaxed font-sans whitespace-pre-wrap break-words">
              "{customReason.trim()}"
            </p>
            {updatedAt && (
              <div className="mt-3 pt-2 border-t border-[#3d2b4f]/40 text-[11px] text-gray-500 font-mono text-right">
                {isRu ? 'Обновлено: ' : 'Updated: '}{new Date(updatedAt).toLocaleString(isRu ? 'ru-RU' : 'en-US')}
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-300 mb-8 leading-relaxed text-sm sm:text-base font-sans">
            {t.maintenanceDesc || (isRu ? 'На сайте проводятся технические работы. Приносим извинения за неудобства.' : 'The site is currently undergoing scheduled maintenance.')}
          </p>
        )}

        {user ? (
          <div className="space-y-4 pt-2">
            <div className="p-3.5 bg-[#0d0b14] border border-[#3d2b4f] rounded-2xl text-xs text-gray-400">
              {isRu ? 'Вы вошли как:' : 'Logged in as:'}{' '}
              <span className="text-white font-bold">{user.displayName || user.email}</span>
              <div className="text-red-400 text-[11px] mt-1 font-mono">
                {isRu ? 'У вашего аккаунта нет прав администратора для обхода блокировки.' : 'Account does not have admin permissions to bypass lock.'}
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut size={16} />
              {t.maintenanceLogout || (isRu ? 'Выйти из аккаунта' : 'Log Out')}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 w-full max-w-sm mx-auto pt-2">
            <p className="text-xs text-gray-400 mb-1">
              {isRu ? 'Вход для администраторов и персонала:' : 'Staff & Administrator Access:'}
            </p>
            <GoogleLoginButton lang={lang} className="w-full" />
            <button
              onClick={() => window.dispatchEvent(new Event('openEmailLogin'))}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#3d2b4f]/40 border border-[#3d2b4f] text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#ff4d4d] hover:text-[#15101e] hover:border-[#ff4d4d] transition-all active:scale-95 shadow-xl cursor-pointer"
            >
              <Mail size={14} />
              {isRu ? 'Войти через почту / Email' : 'Login via Email'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
