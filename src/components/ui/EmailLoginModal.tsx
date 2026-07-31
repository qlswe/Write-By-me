import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, LogIn, UserPlus, User, Sparkles, Palette, MessageSquare, RefreshCw } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Language, translations } from '../../data/translations';
import { getHumanFriendlyError } from '../../utils/authErrors';

interface EmailLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

const AVATAR_SEEDS = ['Cyber-AHI', 'Neon-Bot', 'Kuru-Fan', 'Radio-DJ', 'Tokyo-Drift', 'Synth-Wave', 'Pixel-Cat', 'Vibe-Lord'];
const TAG_COLORS = [
  { name: 'Red', color: '#ff4d4d' },
  { name: 'Purple', color: '#a855f7' },
  { name: 'Blue', color: '#3b82f6' },
  { name: 'Green', color: '#22c55e' },
  { name: 'Gold', color: '#eab308' },
  { name: 'Pink', color: '#ec4899' },
  { name: 'Cyan', color: '#06b6d4' }
];

export const EmailLoginModal: React.FC<EmailLoginModalProps> = ({ isOpen, onClose, lang }) => {
  const t = translations[lang] as any;
  const { loginWithEmail, registerWithEmail, isLoggingIn, sendPasswordReset } = useAuth();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarSeed, setAvatarSeed] = useState('Cyber-AHI');
  const [tagColor, setTagColor] = useState('#ff4d4d');
  const [statusMessage, setStatusMessage] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const photoURL = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(avatarSeed)}`;

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
        await registerWithEmail(email, password, {
          displayName: displayName.trim() || email.split('@')[0],
          photoURL,
          tagColor,
          statusMessage: statusMessage.trim() || (lang === 'ru' ? 'Слушаю AHI Radio 📻' : 'Listening to AHI Radio 📻'),
          bio: bio.trim()
        });
      } else {
        await loginWithEmail(email, password);
      }
      onClose();
      // Reset state on close
      setEmail('');
      setPassword('');
      setDisplayName('');
      setBio('');
      setStatusMessage('');
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

  const randomizeAvatar = () => {
    const randomSeed = `AHI-${Math.floor(Math.random() * 99999)}`;
    setAvatarSeed(randomSeed);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#15101e] border border-[#3d2b4f] w-full max-w-lg rounded-2xl shadow-2xl relative z-10 max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-[#3d2b4f] flex justify-between items-center bg-[#251c35] shrink-0">
            <h2 className="text-xl font-black uppercase tracking-widest text-[#ff4d4d] flex items-center gap-2">
              {isRegistering ? <UserPlus size={24} /> : <Mail size={24} />}
              {isResetting 
                ? (lang === 'ru' ? 'Сброс пароля' : "Reset Password") 
                : isRegistering 
                  ? (lang === 'ru' ? 'РЕГИСТРАЦИЯ И КАСТОМИЗАЦИЯ' : 'SIGN UP & CUSTOMIZE') 
                  : (t.headerLoginEmail || "Login with Email")
              }
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#3d2b4f] rounded-lg transition-colors text-gray-400 hover:text-white cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl text-sm font-semibold">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-3 rounded-xl text-sm font-semibold">
                {successMessage}
              </div>
            )}
            
            {/* EMAIL & PASSWORD FIELDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Email <span className="text-red-400">*</span>
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
                    className="w-full bg-[#0d0b14] border border-[#3d2b4f] rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-[#ff4d4d] transition-colors"
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>

              {!isResetting && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      {t.password || "Password"} <span className="text-red-400">*</span>
                    </label>
                    {!isRegistering && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsResetting(true);
                          setError(null);
                          setSuccessMessage(null);
                        }}
                        className="text-[11px] font-bold text-[#ff4d4d] hover:text-white transition-colors uppercase tracking-widest cursor-pointer"
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
                      className="w-full bg-[#0d0b14] border border-[#3d2b4f] rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-[#ff4d4d] transition-colors"
                      placeholder="••••••••"
                      required={!isResetting}
                      minLength={6}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* FULL CUSTOMIZATION WHEN REGISTERING */}
            {isRegistering && (
              <div className="space-y-4 pt-3 border-t border-[#3d2b4f]/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                    <Sparkles size={16} className="text-[#ff4d4d]" />
                    {lang === 'ru' ? 'Кастомизация профиля' : 'Profile Customization'}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {lang === 'ru' ? 'Можно изменить позже' : 'Can be changed anytime'}
                  </span>
                </div>

                {/* Avatar Preview & Seed Selection */}
                <div className="flex items-center gap-4 bg-[#0d0b14] p-3 rounded-xl border border-[#3d2b4f]">
                  <img
                    src={photoURL}
                    alt="Avatar preview"
                    className="w-14 h-14 rounded-full bg-[#1c132c] border-2 shrink-0 object-cover"
                    style={{ borderColor: tagColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-gray-300 uppercase">
                        {lang === 'ru' ? 'Аватар (Кибер-Стиль)' : 'Avatar (Cyber Style)'}
                      </label>
                      <button
                        type="button"
                        onClick={randomizeAvatar}
                        className="text-[11px] font-bold text-[#ff4d4d] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <RefreshCw size={13} /> {lang === 'ru' ? 'Случайный' : 'Random'}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {AVATAR_SEEDS.map((seed) => (
                        <button
                          key={seed}
                          type="button"
                          onClick={() => setAvatarSeed(seed)}
                          className={`text-[10px] px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${
                            avatarSeed === seed
                              ? 'bg-[#ff4d4d] text-[#15101e] shadow-md scale-105'
                              : 'bg-[#251c35] text-gray-300 hover:text-white'
                          }`}
                        >
                          {seed}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Display Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <User size={15} /> {lang === 'ru' ? 'Никнейм (Имя на сайте)' : 'Display Name'}
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={isLoggingIn}
                    maxLength={30}
                    className="w-full bg-[#0d0b14] border border-[#3d2b4f] rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-[#ff4d4d] transition-colors"
                    placeholder={lang === 'ru' ? 'Например: CyberDJ_99' : 'e.g., CyberDJ_99'}
                  />
                </div>

                {/* Tag Color Swatches */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Palette size={15} /> {lang === 'ru' ? 'Цвет тега и обводки' : 'Tag & Accent Color'}
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {TAG_COLORS.map((item) => (
                      <button
                        key={item.color}
                        type="button"
                        onClick={() => setTagColor(item.color)}
                        className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                          tagColor === item.color ? 'scale-125 border-white shadow-lg' : 'border-transparent opacity-75 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: item.color }}
                        title={item.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Status Message */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <MessageSquare size={15} /> {lang === 'ru' ? 'Статус (надпись в профиле)' : 'Status Message'}
                  </label>
                  <input
                    type="text"
                    value={statusMessage}
                    onChange={(e) => setStatusMessage(e.target.value)}
                    disabled={isLoggingIn}
                    maxLength={50}
                    className="w-full bg-[#0d0b14] border border-[#3d2b4f] rounded-xl py-2 px-4 text-white text-sm focus:outline-none focus:border-[#ff4d4d] transition-colors"
                    placeholder={lang === 'ru' ? 'Слушаю AHI Radio 📻' : 'Listening to AHI Radio 📻'}
                  />
                </div>

                {/* Bio */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {lang === 'ru' ? 'О себе (Био)' : 'About Me (Bio)'}
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    disabled={isLoggingIn}
                    rows={2}
                    maxLength={150}
                    className="w-full bg-[#0d0b14] border border-[#3d2b4f] rounded-xl py-2 px-4 text-white text-sm focus:outline-none focus:border-[#ff4d4d] transition-colors resize-none"
                    placeholder={lang === 'ru' ? 'Расскажите немного о себе или своих интересах...' : 'Tell something about yourself...'}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-[#ff4d4d] text-[#15101e] font-black tracking-widest uppercase py-3.5 rounded-xl hover:bg-white hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 mt-4 shadow-lg disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {isLoggingIn ? "..." : isResetting ? (
                lang === 'ru' ? 'Сбросить пароль' : 'Send Reset Link'
              ) : isRegistering ? (
                <><UserPlus size={18} /> {lang === 'ru' ? 'Создать аккаунт и профиль' : 'Create Account & Profile'}</>
              ) : (
                <><LogIn size={18} /> {t.loginAction || "Sign In"}</>
              )}
            </button>
            
            <div className="pt-3 text-center flex flex-col gap-2">
              <button
                type="button"
                onClick={toggleMode}
                className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
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
                  className="text-sm text-[#ff4d4d] hover:text-white transition-colors font-semibold cursor-pointer"
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

