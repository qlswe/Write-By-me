import React, { useState, useEffect } from 'react';
import { avatarCache } from '../../utils/avatarCache';
import { User } from 'lucide-react';

interface CachedAvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  className?: string;
  customSizeClass?: string;
  fallbackText?: string;
  showOnlineStatus?: boolean;
  isOnline?: boolean;
  style?: React.CSSProperties;
}

export const CachedAvatar: React.FC<CachedAvatarProps> = ({
  src,
  alt = 'Avatar',
  size = 'md',
  className = '',
  customSizeClass,
  fallbackText,
  showOnlineStatus = false,
  isOnline = false,
  style
}) => {
  const [cachedUrl, setCachedUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setHasError(false);

    if (!src) {
      setIsLoading(false);
      return;
    }

    avatarCache
      .getAvatarUrl(src)
      .then((url) => {
        if (isMounted) {
          setCachedUrl(url);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCachedUrl(src);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [src]);

  const getSizeClasses = () => {
    if (customSizeClass) return customSizeClass;
    switch (size) {
      case 'xs': return 'w-6 h-6 text-[10px]';
      case 'sm': return 'w-8 h-8 text-xs';
      case 'md': return 'w-10 h-10 text-sm';
      case 'lg': return 'w-12 h-12 text-base';
      case 'xl': return 'w-16 h-16 text-xl';
      default: return 'w-10 h-10 text-sm';
    }
  };

  const getInitials = () => {
    if (fallbackText) {
      return fallbackText.slice(0, 2).toUpperCase();
    }
    if (alt && alt !== 'Avatar') {
      return alt.slice(0, 2).toUpperCase();
    }
    return '';
  };

  const initials = getInitials();

  return (
    <div className={`relative inline-block shrink-0 ${getSizeClasses()} ${className}`} style={style}>
      {isLoading ? (
        <div className="w-full h-full rounded-2xl bg-[#2a1745] animate-pulse border border-[#3d2b4f] flex items-center justify-center text-xs text-gray-500">
          ...
        </div>
      ) : !hasError && (cachedUrl || src) ? (
        <img
          src={cachedUrl || src || ''}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className="w-full h-full object-cover rounded-2xl border border-white/10 shadow-sm"
        />
      ) : initials ? (
        <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-purple-800 to-indigo-600 flex items-center justify-center font-black text-white border border-white/20 uppercase tracking-tight shadow-sm">
          {initials}
        </div>
      ) : (
        <div className="w-full h-full rounded-2xl bg-[#1b112c] flex items-center justify-center text-gray-400 border border-[#3d2b4f]">
          <User className="w-1/2 h-1/2" />
        </div>
      )}

      {showOnlineStatus && (
        <span
          className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#120a1f] ${
            isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-gray-600'
          }`}
        />
      )}
    </div>
  );
};
