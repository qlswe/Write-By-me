import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Language, translations } from '../../data/translations';

interface GoogleLoginButtonProps {
  lang: Language;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ 
  lang, 
  onClick, 
  className = '', 
  size = 'md' 
}) => {
  const { loginWithGoogle, isLoggingIn, error } = useAuth();
  const t = translations[lang] as any;

  const handleClick = async () => {
    await loginWithGoogle();
    if (onClick) onClick();
  };

  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  const baseClasses = "inline-flex items-center justify-center max-w-full bg-white text-[#15101e] font-black transition-all shadow-xl hover:bg-white/90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none";
  
  const sizeClasses = {
    sm: "gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm whitespace-nowrap",
    md: "gap-2.5 px-5 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm whitespace-nowrap",
    lg: "gap-3.5 px-7 py-3.5 rounded-2xl text-sm sm:text-base uppercase tracking-widest whitespace-nowrap"
  };

  const iconSizes = {
    sm: "w-4 h-4 shrink-0",
    md: "w-4 h-4 sm:w-5 sm:h-5 shrink-0",
    lg: "w-5 h-5 sm:w-6 sm:h-6 shrink-0"
  };

  return (
    <div className="flex flex-col items-center gap-2 max-w-full">
      <button 
        onClick={handleClick}
        disabled={isLoggingIn}
        className={`${baseClasses} ${sizeClasses[size]} ${className}`}
      >
        <svg className={iconSizes[size]} viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {isLoggingIn ? '...' : (t.loginWithGoogle || "Login with Google")}
      </button>

      {error && (
        <div className="text-[11px] text-red-300 font-medium text-center bg-[#1c132c]/95 border border-[#ff4d4d]/40 px-3.5 py-2.5 rounded-xl max-w-xs shadow-lg">
          {error === 'IFRAME_AUTH_RESTRICTED' || error === 'POPUP_BLOCKED_IFRAME' || isIframe ? (
            <div className="space-y-2">
              <p className="text-gray-200 text-[11px] leading-snug">
                {lang === 'ru'
                  ? 'Встроенное окно превью (iframe) блокирует авторизацию Google из-за политик безопасности браузера.'
                  : 'Embedded preview frame blocks Google sign-in due to browser security policies.'}
              </p>
              <button
                type="button"
                onClick={() => window.open(window.location.href, '_blank')}
                className="w-full py-2 px-3 bg-[#ff4d4d] text-[#15101e] hover:bg-[#ff6666] font-black rounded-lg transition-all shadow-md cursor-pointer block"
              >
                {lang === 'ru' ? '🚀 Открыть в новой вкладке для входа' : '🚀 Open in new tab to sign in'}
              </button>
            </div>
          ) : (
            <span>{error}</span>
          )}
        </div>
      )}

      {isIframe && !error && (
        <button
          type="button"
          onClick={() => window.open(window.location.href, '_blank')}
          className="text-[10px] text-gray-400 hover:text-white underline transition-colors cursor-pointer"
        >
          {lang === 'ru' ? 'Не входит? Откройте в новой вкладке' : 'Login blocked? Open in new tab'}
        </button>
      )}
    </div>
  );
};
