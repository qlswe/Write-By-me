import React from 'react';
import { decryptImage } from '../../utils/encryption';
import { Video, Image as ImageIcon, ShieldAlert, ShieldCheck, Download } from 'lucide-react';

interface MediaViewerProps {
  url?: string;
  className?: string;
  maxHeight?: string;
  isProtected?: boolean;
  title?: string;
}

export const resolveMediaUrl = (rawUrl: string): string => {
  if (!rawUrl) return '';
  let url = rawUrl.startsWith('enc:') ? decryptImage(rawUrl) : rawUrl;
  
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
  if (url.startsWith('data:video')) return true;
  if (/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url)) return true;
  if (/(youtube\.com|youtu\.be|vimeo\.com|vk\.com\/video|ipfs\.io\/ipfs|127\.0\.0\.1:8080\/ipfs|localhost:8080\/ipfs)/i.test(url)) return true;
  if (url.includes('/ipfs/') || url.startsWith('ipfs://')) return true;
  return false;
};

export const getYouTubeEmbedUrl = (rawUrl: string): string | null => {
  if (!rawUrl) return null;
  const url = resolveMediaUrl(rawUrl);
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=0&rel=0` : null;
};

export const MediaViewer: React.FC<MediaViewerProps> = ({
  url,
  className = "",
  maxHeight = "max-h-[500px]",
  isProtected = false,
  title = "attachment"
}) => {
  if (!url) return null;

  const resolved = resolveMediaUrl(url);
  const ytEmbed = getYouTubeEmbedUrl(resolved);
  const isVideo = isVideoMedia(url);

  if (ytEmbed) {
    return (
      <div className={`relative w-full aspect-video rounded-2xl overflow-hidden border border-[#3d2b4f]/40 shadow-2xl bg-black ${className}`}>
        <iframe
          src={ytEmbed}
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
      <div className={`relative w-full rounded-2xl overflow-hidden border border-[#3d2b4f]/40 shadow-2xl bg-black/90 p-1 ${className}`}>
        <video
          src={resolved}
          controls
          playsInline
          preload="metadata"
          className={`w-full ${maxHeight} object-contain rounded-xl mx-auto`}
        />
        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-red-500/30 text-[10px] font-black uppercase tracking-widest text-[#ff4d4d] flex items-center gap-1">
          <Video size={12} />
          <span>{url.includes('ipfs') ? 'IPFS Видео' : 'Видео'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-[#3d2b4f]/40 shadow-2xl bg-black/40 flex items-center justify-center ${className}`}>
      <img
        src={resolved}
        alt={title}
        loading="lazy"
        className={`w-full ${maxHeight} object-contain rounded-xl mx-auto ${isProtected ? 'select-none pointer-events-none' : ''}`}
        onContextMenu={isProtected ? (e) => e.preventDefault() : undefined}
        onDragStart={isProtected ? (e) => e.preventDefault() : undefined}
      />
      {isProtected && (
        <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#ff4d4d]/30 text-[10px] font-black uppercase tracking-widest text-[#ff4d4d] flex items-center gap-1.5 select-none pointer-events-none">
          <ShieldAlert size={12} className="text-[#ff4d4d]" />
          <span>Защищенный просмотр</span>
        </div>
      )}
    </div>
  );
};
