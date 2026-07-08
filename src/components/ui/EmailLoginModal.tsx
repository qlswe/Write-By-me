import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Language, translations } from '../../data/translations';
import { getHumanFriendlyError } from '../../utils/authErrors';

interface EmailLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const EmailLoginModal: React.FC<EmailLoginModalProps> = ({ isOpen, onClose, lang }) => {
  const t = translations[lang] as any;
  const { loginWithEmail, registerWithEmail, isLoggingIn, sendPasswordReset } = useAuth();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    
    if (isResetting) {
      if (!email) {
        setError(lang === 'ru' ? 'Пожалуйста, введите ваш email.' : "Please enter your email.");
        return;
      }
      try {
        await sendPasswordReset(email);
        setSuccessMessage(lang === 'ru' ? 'Инструкции по восстановлению отправлены на вашу почту!' : "Reset instructions sent to your email!");
        setTimeout(() => {
          setIsResetting(false);
          setSuccessMessage(null);
        }, 5000);
      } catch (err: any) {
        setError(getHumanFriendlyError(err, lang));
      }
      return;
    }

    if (!email || !password) {
      setError(t.errorMissingFields || "Please fill in all fields.");
      return;
    }

    try {
      if (isRegistering) {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
      onClose();
      // Reset state on close
      setEmail('');
      setPassword('');
      setIsRegistering(false);
      setIsResetting(false);
    } catch (err: any) {
      setError(getHumanFriendlyError(err, lang));
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setIsResetting(false);
    setError(null);
    setSuccessMessage(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#15101e] border border-[#3d2b4f] w-full max-w-md rounded-2xl shadow-2xl relative z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-[#3d2b4f] flex justify-between items-center bg-[#251c35]">
            <h2 className="text-xl font-black uppercase tracking-widest text-[#ff4d4d] flex items-center gap-2">
              <Mail size={24} />
              {isResetting 
                ? (lang === 'ru' ? 'Сброс пароля' : "Reset Password") 
                : isRegistering 
                  ? (t.registerTitle || "Sign Up") 
                  : (t.headerLoginEmail || "Login with Email")
              }
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#3d2b4f] rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-xl text-sm font-semibold">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-3 rounded-xl text-sm font-semibold">
                {successMessage}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Email
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoggingIn}
                  className="w-full bg-[#0d0b14] border border-[#3d2b4f] rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#ff4d4d] transition-colors"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            {!isResetting && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {t.password || "Password"}
                  </label>
                  {!isRegistering && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetting(true);
                        setError(null);
                        setSuccessMessage(null);
                      }}
                      className="text-xs font-bold text-[#ff4d4d] hover:text-white transition-colors uppercase tracking-widest"
                    >
                      {lang === 'ru' ? 'Забыли?' : 'Forgot?'}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoggingIn}
                    className="w-full bg-[#0d0b14] border border-[#3d2b4f] rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#ff4d4d] transition-colors"
                    placeholder="••••••••"
                    required={!isResetting}
                    minLength={6}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-[#ff4d4d] text-[#15101e] font-black tracking-widest uppercase py-3 rounded-xl hover:bg-white hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoggingIn ? "..." : isResetting ? (
                lang === 'ru' ? 'Сбросить пароль' : 'Send Reset Link'
              ) : isRegistering ? (
                <><UserPlus size={18} /> {t.registerAction || "Create Account"}</>
              ) : (
                <><LogIn size={18} /> {t.loginAction || "Sign In"}</>
              )}
            </button>
            
            <div className="pt-4 text-center flex flex-col gap-2">
              <button
                type="button"
                onClick={toggleMode}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                {isRegistering 
                  ? (t.alreadyHaveAccount || "Already have an account? Sign in") 
                  : (t.needAccount || "Don't have an account? Sign up")}
              </button>

              {isResetting && (
                <button
                  type="button"
                  onClick={() => {
                    setIsResetting(false);
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="text-sm text-[#ff4d4d] hover:text-white transition-colors font-semibold"
                >
                  {lang === 'ru' ? 'Назад к входу' : 'Back to login'}
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
