import React from 'react';
import { motion } from 'motion/react';
import { Star, Share2, Check, Edit, Trash2, ArrowRight, Clock } from 'lucide-react';
import { Language, translations } from '../../data/translations';
import { useAuth } from '../../hooks/useAuth';
import { calculateReadTime } from '../../utils/time';


interface TheoryCardProps {
  theory: any;
  index: number;
  lang: Language;
  isFavorite: boolean;
  onClick: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
}

export const TheoryCard: React.FC<TheoryCardProps> = React.memo(({
  theory,
  index,
  lang,
  isFavorite,
  onClick,
  onToggleFavorite,
  onEdit,
  onDelete
}) => {
  const t = translations[lang];
  const [copied, setCopied] = React.useState(false);
  const { user, isAdmin } = useAuth();
  const readTime = calculateReadTime(theory.content, theory.summary, lang);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}?theory=${theory.id}`;
    if (navigator.share) {
      navigator.share({
        title: theory.title[lang] || theory.title['en'],
        text: theory.summary[lang] || theory.summary['en'],
        url: url,
      }).catch((err) => {
        if (err.name !== 'AbortError') {
          copyToClipboard(url);
        }
      });
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ 
        duration: 0.45, 
        delay: Math.min(index * 0.05, 0.5), 
        ease: [0.22, 1, 0.36, 1] 
      }}
      onClick={onClick}
      className="group relative bg-[#15101e]/60 hover:bg-[#251c35] p-6 sm:p-8 rounded-3xl border border-[#3d2b4f]/40 hover:border-[#ff4d4d]/50 hover:shadow-[0_12px_40px_rgba(255,77,77,0.15)] transition-all cursor-pointer overflow-hidden"
    >
      {/* Decorative background element */}
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#ff4d4d]/5 rounded-full blur-2xl group-hover:bg-[#ff4d4d]/10 transition-all" />
      
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <div className="px-3.5 py-1.5 rounded-full bg-[#ff4d4d]/10 text-[#ff4d4d] text-[10px] font-black uppercase tracking-widest border border-[#ff4d4d]/20 whitespace-nowrap">
            {t[`filter${theory.category.charAt(0).toUpperCase() + theory.category.slice(1)}` as keyof typeof t] || theory.category}
          </div>
          <div className="px-3 py-1.5 rounded-full bg-[#251c35] text-white/70 text-[10px] font-bold tracking-wider border border-[#3d2b4f]/60 flex items-center gap-1.5 shadow-sm whitespace-nowrap">
            <Clock size={11} className="text-[#ff4d4d]" />
            <span>{readTime} {t.minRead || (lang === 'ru' ? 'мин чтения' : 'min read')}</span>
          </div>
        </div>

        {/* Dedicated favorite Star button in header - always single and clean */}
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(e); }}
          className={`p-2.5 rounded-2xl shrink-0 transition-all border ${
            isFavorite 
              ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30 shadow-[0_0_12px_rgba(250,204,21,0.2)]' 
              : 'text-white/40 hover:text-yellow-400 hover:border-yellow-400/30 hover:bg-yellow-400/10 border-[#3d2b4f]/40 bg-[#15101e]'
          }`}
          title={t.favoriteBtn}
        >
          <Star size={16} fill={isFavorite ? "currentColor" : "none"} />
        </button>
      </div>

      <h3 className="text-xl sm:text-2xl font-black text-white mb-3 leading-tight tracking-tight group-hover:text-[#ff4d4d] transition-colors uppercase">
        {theory.title[lang] || theory.title['en']}
      </h3>
      
      <div className="relative mb-6 group-hover:text-white/80 transition-colors">
        <p className="text-white/40 text-xs sm:text-sm line-clamp-3 font-medium leading-relaxed">
          {theory.summary[lang] || theory.summary['en']}
        </p>
      </div>

      {/* Card Footer with Read More + Action Icons */}
      <div className="flex items-center justify-between gap-3 mt-auto pt-4 border-t border-[#3d2b4f]/30">
        <button 
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          className="flex items-center gap-2 text-[#15101e] bg-[#ff4d4d] hover:bg-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-white/20 active:scale-95"
        >
          {t.readArchive || "Read More"} <ArrowRight size={14} />
        </button>

        <div className="flex items-center gap-1.5">
          {isAdmin && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit?.(e); }}
                className="p-2 rounded-xl bg-[#251c35] text-white/50 hover:text-blue-400 hover:bg-blue-400/10 transition-all border border-[#3d2b4f]/50 hover:border-blue-400/30"
                title={t.editBtn}
              >
                <Edit size={15} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete?.(e); }}
                className="p-2 rounded-xl bg-[#251c35] text-white/50 hover:text-red-400 hover:bg-red-400/10 transition-all border border-[#3d2b4f]/50 hover:border-red-400/30"
                title={t.deleteBtn}
              >
                <Trash2 size={15} />
              </button>
            </>
          )}
          <button 
            onClick={handleShare}
            className={`p-2 rounded-xl bg-[#251c35] transition-all border border-[#3d2b4f]/50 ${copied ? 'text-green-400 bg-green-400/10 border-green-400/30' : 'text-white/50 hover:text-[#ff4d4d] hover:border-[#ff4d4d]/30 hover:bg-[#ff4d4d]/10'}`}
            title={t.shareBtn}
          >
            {copied ? <Check size={15} /> : <Share2 size={15} />}
          </button>
        </div>
      </div>
    </motion.div>
  );
});
