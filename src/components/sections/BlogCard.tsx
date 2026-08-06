import React from 'react';
import { motion } from 'motion/react';
import { Star, Edit, Trash2, ArrowRight, Calendar, Share2 } from 'lucide-react';
import { Language, translations } from '../../data/translations';
import { useAuth } from '../../hooks/useAuth';
import { TimeAgo } from '../ui/TimeAgo';
import { MediaViewer } from '../ui/MediaViewer';

interface BlogCardProps {
  post: any;
  index: number;
  lang: Language;
  isFavorite: boolean;
  onClick: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
}

export const BlogCard: React.FC<BlogCardProps> = React.memo(({
  post,
  index,
  lang,
  isFavorite,
  onClick,
  onToggleFavorite,
  onEdit,
  onDelete
}) => {
  const t = translations[lang];
  const { user, isAdmin } = useAuth();
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -6, scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.4, delay: index * 0.04, type: "spring", damping: 22, stiffness: 280 }}
      onClick={onClick}
      className="group relative bg-[#15101e]/60 hover:bg-[#251c35] p-6 sm:p-8 rounded-3xl border border-[#3d2b4f]/40 hover:border-[#ff4d4d]/50 hover:shadow-[0_12px_40px_rgba(255,77,77,0.15)] transition-all cursor-pointer overflow-hidden"
    >
      {/* Decorative background element */}
      <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#ff4d4d]/5 rounded-full blur-2xl group-hover:bg-[#ff4d4d]/10 transition-all" />
      
      <div className="flex justify-between items-start mb-6">
        <div className="flex flex-col gap-2">
          <div className="px-4 py-1.5 rounded-full bg-[#ff4d4d]/10 text-[#ff4d4d] text-[10px] font-black uppercase tracking-widest border border-[#ff4d4d]/20 self-start">
            {t[`filter${post.category.charAt(0).toUpperCase() + post.category.slice(1)}` as keyof typeof t] || post.category}
          </div>
          <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-widest">
            <Calendar size={10} />
            <TimeAgo date={post.createdAt} lang={lang} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all translate-y-0 sm:translate-y-2 sm:group-hover:translate-y-0 justify-end">
          {isAdmin && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit?.(e); }}
                className="p-2.5 rounded-xl bg-[#3d2b4f]/30 text-white/40 hover:text-blue-400 hover:bg-blue-400/10 transition-all border border-transparent hover:border-blue-400/30"
                title={t.editBtn}
              >
                <Edit size={16} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete?.(e); }}
                className="p-2.5 rounded-xl bg-[#3d2b4f]/30 text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all border border-transparent hover:border-red-400/30"
                title={t.deleteBtn}
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
          <button 
            className="p-2.5 rounded-xl bg-[#3d2b4f]/30 text-white/40 hover:text-[#ff4d4d] hover:border-[#ff4d4d]/30 hover:bg-[#ff4d4d]/10 transition-all border border-transparent"
            title={t.shareBtn}
            onClick={(e) => {
              e.stopPropagation();
              const url = `${window.location.origin}${window.location.pathname}?post=${post.id}`;
              navigator.clipboard.writeText(url);
            }}
          >
            <Share2 size={16} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(e); }}
            className={`p-2.5 rounded-xl bg-[#3d2b4f]/30 transition-all border border-transparent ${isFavorite ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' : 'text-white/40 hover:text-yellow-400 hover:border-yellow-400/30 hover:bg-yellow-400/10'}`}
            title={t.favoriteBtn}
          >
            <Star size={16} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      <h3 className="text-xl sm:text-2xl font-black text-white mb-3 leading-tight tracking-tight group-hover:text-[#ff4d4d] transition-colors uppercase">
        {post.title[lang] || post.title['en']}
      </h3>
      
      {post.mediaUrl && (
        <div className="mb-4 overflow-hidden rounded-2xl">
          <MediaViewer url={post.mediaUrl} maxHeight="max-h-[220px]" title={post.title[lang] || 'Blog Media'} isCompact={true} />
        </div>
      )}

      <div className="relative mb-6 group-hover:text-white/80 transition-colors">
        <p className="text-white/40 text-xs sm:text-sm line-clamp-3 font-medium leading-relaxed">
          {post.summary[lang] || post.summary['en']}
        </p>
      </div>

      <div className="flex flex-col gap-4 mt-auto">
        <div className="flex items-center justify-between">
          <button 
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="flex items-center gap-2 text-[#15101e] bg-[#ff4d4d] hover:bg-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-white/20 active:scale-95"
          >
            {t.readArticle || "Read More"} <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
});
