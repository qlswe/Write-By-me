import React from 'react';
import { motion } from 'motion/react';
import { Star, Share2, Check, Edit, Trash2, ArrowRight } from 'lucide-react';
import { Language, translations } from '../../data/translations';
import { useAuth } from '../../hooks/useAuth';


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
  const { user } = useAuth();
  const isAdmin = user?.email === 'semegladysev527@gmail.com';

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
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, delay: index * 0.05, type: "spring", damping: 20 }}
      onClick={onClick}
      className="group relative bg-[#15101e]/50 hover:bg-[#251c35] p-6 sm:p-8 rounded-3xl border border-[#3d2b4f]/30 hover:border-[#ff4d4d]/30 transition-all cursor-pointer hsr-card-hover overflow-hidden"
    >
      {/* Decorative background element */}
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#ff4d4d]/5 rounded-full blur-2xl group-hover:bg-[#ff4d4d]/10 transition-all" />
      
      <div className="flex justify-between items-start mb-6">
        <div className="px-4 py-1.5 rounded-full bg-[#ff4d4d]/10 text-[#ff4d4d] text-[10px] font-black uppercase tracking-widest border border-[#ff4d4d]/20">
          {t[`filter${theory.category.charAt(0).toUpperCase() + theory.category.slice(1)}` as keyof typeof t] || theory.category}
        </div>
        <div className="grid grid-cols-2 gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all translate-y-0 sm:translate-y-2 sm:group-hover:translate-y-0 justify-end">
          {isAdmin && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit?.(e); }}
                className="p-2.5 rounded-xl bg-[#3d2b4f]/30 text-white/40 hover:text-blue-400 hover:bg-blue-400/10 transition-all border border-transparent hover:border-blue-400/30"
                title={t.editBtn}
              >
                <Edit size={18} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete?.(e); }}
                className="p-2.5 rounded-xl bg-[#3d2b4f]/30 text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all border border-transparent hover:border-red-400/30"
                title={t.deleteBtn}
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
          <button 
            onClick={handleShare}
            className={`p-2.5 rounded-xl bg-[#3d2b4f]/30 transition-all border border-transparent ${copied ? 'text-green-400 bg-green-400/10 border-green-400/30' : 'text-white/40 hover:text-[#ff4d4d] hover:border-[#ff4d4d]/30 hover:bg-[#ff4d4d]/10'}`}
            title={t.shareBtn}
          >
            {copied ? <Check size={18} /> : <Share2 size={18} />}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(e); }}
            className={`p-2.5 rounded-xl bg-[#3d2b4f]/30 transition-all border border-transparent ${isFavorite ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' : 'text-white/40 hover:text-yellow-400 hover:border-yellow-400/30 hover:bg-yellow-400/10'}`}
            title={t.favoriteBtn}
          >
            <Star size={18} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      <h3 className="text-xl sm:text-2xl font-black text-white mb-3 leading-tight tracking-tight group-hover:text-[#ff4d4d] transition-colors uppercase">
        {theory.title[lang] || theory.title['en']}
      </h3>
      
      <div className="relative mb-6 group-hover:text-white/80 transition-colors">
        <p className="text-white/40 text-xs sm:text-sm line-clamp-3 font-medium leading-relaxed">
          {theory.summary[lang] || theory.summary['en']}
        </p>
      </div>

      <div className="flex flex-col gap-4 mt-auto">
        <div className="flex items-center justify-between">
          <button 
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="flex items-center gap-2 text-[#15101e] bg-[#ff4d4d] hover:bg-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-white/20 active:scale-95"
          >
            {t.readArchive || "Read More"} <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
});
