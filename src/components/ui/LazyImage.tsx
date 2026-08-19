import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, AlertCircle } from 'lucide-react';
import { resolveMediaUrl } from './MediaViewer';

export interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: string;
  blurDataUrl?: string;
  onClick?: (e: React.MouseEvent<HTMLImageElement>) => void;
  showZoomCursor?: boolean;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt = '',
  className = '',
  containerClassName = '',
  aspectRatio,
  blurDataUrl,
  onClick,
  showZoomCursor = false,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [proxiedSrc, setProxiedSrc] = useState<string | null>(null);
  
  const baseResolved = src ? resolveMediaUrl(src) : '';
  const currentSrc = proxiedSrc || baseResolved;

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    setProxiedSrc(null);
  }, [src]);

  const handleImageError = () => {
    if (!proxiedSrc && baseResolved && baseResolved.startsWith('http') && !baseResolved.includes('/api/media-proxy') && !baseResolved.startsWith('blob:') && !baseResolved.startsWith('data:')) {
      setProxiedSrc(`/api/media-proxy?url=${encodeURIComponent(baseResolved)}`);
    } else {
      setHasError(true);
    }
  };

  if (!currentSrc || hasError) {
    return (
      <div 
        className={`relative overflow-hidden bg-[#15101e] border border-[#3d2b4f]/40 flex flex-col items-center justify-center p-6 text-white/30 text-xs text-center rounded-2xl ${containerClassName}`}
        style={aspectRatio ? { aspectRatio } : undefined}
      >
        <AlertCircle size={24} className="mb-2 text-[#ff4d4d]/60 animate-pulse" />
        <span>{alt || 'Image unavailable'}</span>
      </div>
    );
  }

  return (
    <div 
      className={`relative overflow-hidden bg-[#15101e] ${containerClassName}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Blurry Shimmer Placeholder Layer */}
      <div 
        className={`absolute inset-0 z-0 bg-gradient-to-tr from-[#1b1227] via-[#251c35] to-[#15101e] transition-opacity duration-700 pointer-events-none ${
          isLoaded ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {blurDataUrl ? (
          <img 
            src={blurDataUrl} 
            alt="" 
            aria-hidden="true"
            className="w-full h-full object-cover filter blur-xl scale-110 opacity-70"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
            <ImageIcon size={28} className="text-white/10" />
          </div>
        )}
      </div>

      {/* Main Image with Progressive Blurry Fade-In Transition */}
      <img
        src={currentSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={handleImageError}
        onClick={onClick}
        className={`relative z-10 w-full h-full object-cover transition-all duration-700 ease-out will-change-[filter,opacity,transform] ${
          isLoaded 
            ? 'opacity-100 blur-0 scale-100' 
            : 'opacity-0 blur-md scale-[1.03]'
        } ${showZoomCursor ? 'cursor-zoom-in' : ''} ${className}`}
        {...props}
      />
    </div>
  );
};
