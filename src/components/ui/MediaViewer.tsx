import React from 'react';
import { decryptImage } from '../../utils/encryption';
import { Video, Image as ImageIcon, ShieldAlert, ShieldCheck, Download, Disc, Maximize2 } from 'lucide-react';
import { KuruVideoPlayer } from './KuruVideoPlayer';
import { LazyImage } from './LazyImage';

interface MediaViewerProps {
  url?: string;
  className?: string;
  maxHeight?: string;
  isProtected?: boolean;
  title?: string;
  isCompact?: boolean;
  onOpenFull?: () => void;
  showExpandOverlay?: boolean;
  expandLabel?: string;
}

export const resolveMediaUrl = (rawUrl: string): string => {
  if (!rawUrl) return '';
  let url = (rawUrl.startsWith('enc:') || rawUrl.startsWith('IMG_AES:')) ? decryptImage(rawUrl) : rawUrl;
  
  // Resolve ipfs:// protocol to local IPFS node / public gateway fallback
  if (url.startsWith('ipfs://')) {
    const cid = url.replace('ipfs://', '');
    // Uses public IPFS gateway or user's local IPFS node
    return `https://ipfs.io/ipfs/${cid}`;
  }
  return url;
};

export const isVideoMedia = (rawUrl: string): boolean => {
  if (!rawUrl) return false;
  const url = resolveMediaUrl(rawUrl);
  if (url.startsWith('data:image')) return false;
  if (url.startsWith('data:video')) return true;
  if (/\.(mp4|webm|ogg|mov|m4v|mkv|3gp|avi|flv)(\?.*)?$/i.test(url)) return true;
  if (/(youtube\.com|youtu\.be|vimeo\.com|vk\.com\/video)/i.test(url)) return true;
  if (url.includes('catbox.moe') || url.includes('/uploads/') || url.includes('media_')) {
    if (!/\.(png|jpg|jpeg|webp|gif|svg)(\?.*)?$/i.test(url)) return true;
  }
  return false;
};

export const getEmbedVideoUrl = (rawUrl: string): { type: string; url: string } | null => {
  if (!rawUrl) return null;
  const url = resolveMediaUrl(rawUrl);
  
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (ytMatch) {
    return { type: 'YouTube', url: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0&modestbranding=1` };
  }
  
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/i);
  if (vimeoMatch) {
    return { type: 'Vimeo', url: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
  }

  return null;
};

export const getYouTubeEmbedUrl = (rawUrl: string): string | null => {
  const embed = getEmbedVideoUrl(rawUrl);
  return embed ? embed.url : null;
};

export const MediaViewer: React.FC<MediaViewerProps> = ({
  url,
  className = "",
  maxHeight = "max-h-[500px]",
  isProtected = false,
  title = "attachment",
  isCompact = false,
  onOpenFull,
  showExpandOverlay = false,
  expandLabel = "Нажмите, чтобы открыть полностью"
}) => {
  if (!url) return null;

  const resolved = resolveMediaUrl(url);
  const embedInfo = getEmbedVideoUrl(resolved);
  const isVideo = isVideoMedia(url);

  if (embedInfo) {
    return (
      <div className={`relative w-full aspect-video rounded-2xl overflow-hidden border border-[#3d2b4f]/60 shadow-2xl bg-black ${className}`}>
        {/* Kuru Video Custom Embed Header Badge */}
        <div className="absolute top-3 left-3 pointer-events-none z-20">
          <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-red-500/40 text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-2 shadow-lg">
            <Disc size={15} className="text-red-400 animate-[spin_3s_linear_infinite]" />
            <span className="bg-gradient-to-r from-red-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              Kuru Video • {embedInfo.type}
            </span>
          </div>
        </div>

        <iframe
          src={embedInfo.url}
          title={title}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (isVideo) {
    return (
      <KuruVideoPlayer
        src={resolved}
        className={className}
        maxHeight={maxHeight}
        title={title}
        isCompact={isCompact}
      />
    );
  }

  return (
    <div 
      onClick={onOpenFull}
      className={`relative w-full rounded-2xl overflow-hidden border border-[#3d2b4f]/40 shadow-2xl bg-black/40 flex items-center justify-center group/mediaviewer ${onOpenFull ? 'cursor-pointer' : ''} ${className}`}
    >
      <LazyImage
        src={resolved}
        alt={title}
        className={`w-full ${maxHeight} object-contain rounded-xl mx-auto ${isProtected ? 'select-none pointer-events-none' : ''}`}
        containerClassName="w-full"
        onContextMenu={isProtected ? (e: React.MouseEvent) => e.preventDefault() : undefined}
        onDragStart={isProtected ? (e: React.DragEvent) => e.preventDefault() : undefined}
      />
      
      {/* Centered button overlay - ALWAYS OVER PHOTO */}
      {(onOpenFull || showExpandOverlay) && (
        <div className="absolute inset-0 z-30 bg-black/20 hover:bg-black/35 transition-colors duration-200 flex items-center justify-center p-3 pointer-events-none">
          <div className="bg-[#0c0914]/90 hover:bg-[#0c0914] backdrop-blur-md px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border-2 border-emerald-400 text-white text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-[0_10px_35px_rgba(0,0,0,0.9)] scale-100 group-hover/mediaviewer:scale-105 group-hover/mediaviewer:border-emerald-300 transition-all">
            <Maximize2 size={16} className="text-emerald-400 shrink-0" />
            <span className="tracking-wide">{expandLabel}</span>
          </div>
        </div>
      )}

      {isProtected && (
        <div className="absolute bottom-3 right-3 z-20 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#ff4d4d]/30 text-[10px] font-black uppercase tracking-widest text-[#ff4d4d] flex items-center gap-1.5 select-none pointer-events-none">
          <ShieldAlert size={12} className="text-[#ff4d4d]" />
          <span>Защищенный просмотр</span>
        </div>
      )}
    </div>
  );
};
