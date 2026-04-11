import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, LogIn, LogOut } from 'lucide-react';
import { Language } from '../../data/translations';
import { useAuth } from '../../hooks/useAuth';

interface MaintenanceScreenProps {
  lang: Language;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({ lang }) => {
  const { user, loginWithGoogle, logout, isLoggingIn } = useAuth();

  return (
    <div className="min-h-screen bg-[#1a142e] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#C3A6E6]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#5C4B8B]/10 rounded-full blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#2F244F]/80 backdrop-blur-xl border border-[#5C4B8B]/50 rounded-3xl p-8 sm:p-12 max-w-lg w-full text-center shadow-2xl relative z-10"
      >
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-[#C3A6E6]/10 rounded-full">
            <ShieldAlert size={48} className="text-[#C3A6E6]" />
          </div>
        </div>
        
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-4 uppercase tracking-widest">
          {lang === 'ru' ? 'Сайт закрыт' : 'Site Closed'}
        </h1>
        
        <p className="text-gray-300 mb-8 leading-relaxed">
          {lang === 'ru' 
            ? 'В данный момент на сайте проводятся технические работы или закрытое бета-тестирование. Доступ разрешен только администраторам, модераторам и бета-тестерам.' 
            : 'The site is currently undergoing maintenance or closed beta testing. Access is restricted to administrators, moderators, and beta testers.'}
        </p>

        {user ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              {lang === 'ru' ? `Вы вошли как ${user.displayName}, но у вас нет доступа.` : `You are logged in as ${user.displayName}, but you don't have access.`}
            </p>
            <button
              onClick={logout}
              className="w-full bg-red-500/20 text-red-400 border border-red-500/50 px-6 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-red-500/30 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <LogOut size={20} />
              {lang === 'ru' ? 'Выйти' : 'Logout'}
            </button>
          </div>
        ) : (
          <button
            onClick={loginWithGoogle}
            disabled={isLoggingIn}
            className="w-full bg-white text-[#1a142e] px-6 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-[#C3A6E6] transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isLoggingIn ? (
              <span className="animate-pulse">...</span>
            ) : (
              <>
                <LogIn size={20} />
                {lang === 'ru' ? 'Войти через Google' : 'Login with Google'}
              </>
            )}
          </button>
        )}
      </motion.div>
    </div>
  );
};
