import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, LogIn, LogOut } from 'lucide-react';
import { Language, translations } from '../../data/translations';
import { useAuth } from '../../hooks/useAuth';

interface MaintenanceScreenProps {
  lang: Language;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({ lang }) => {
  const { user, loginWithGoogle, logout, isLoggingIn } = useAuth();
  const t = translations[lang];

  return (
    <div className="min-h-screen bg-[#0d0b14] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ff4d4d]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#3d2b4f]/10 rounded-full blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#15101e]/80 backdrop-blur-xl border border-[#3d2b4f]/50 rounded-3xl p-8 sm:p-12 max-w-lg w-full text-center shadow-2xl relative z-10"
      >
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-[#ff4d4d]/10 rounded-full">
            <ShieldAlert size={48} className="text-[#ff4d4d]" />
          </div>
        </div>
        
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-4 uppercase tracking-widest">
          {t.maintenanceSiteClosed}
        </h1>
        
        <p className="text-white/80 mb-8 leading-relaxed">
          {t.maintenanceDesc}
        </p>

        {user ? (
          <div className="space-y-4">
            <p className="text-sm text-white/60">
              {t.maintenanceNoAccess.replace('{name}', user.displayName || '')}
            </p>
            <button
              onClick={logout}
              className="w-full bg-red-500/20 text-red-400 border border-red-500/50 px-6 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-red-500/30 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <LogOut size={20} />
              {t.maintenanceLogout}
            </button>
          </div>
        ) : (
          <button
            onClick={loginWithGoogle}
            disabled={isLoggingIn}
            className="w-full bg-white text-[#0d0b14] px-6 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-[#ff4d4d] transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isLoggingIn ? (
              <span className="animate-pulse">...</span>
            ) : (
              <>
                <LogIn size={20} />
                {t.maintenanceLoginGoogle}
              </>
            )}
          </button>
        )}
      </motion.div>
    </div>
  );
};
