import React from 'react';
import { motion } from 'motion/react';
import { Star, Share2, Check, Edit, Trash2, ArrowRight } from 'lucide-react';
import { Language, translations } from '../../data/translations';
import { useAuth } from '../../hooks/useAuth';
import { ReactionsBar } from '../ui/ReactionsBar';

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
      className="group relative bg-[#2F244F]/50 hover:bg-[#3E3160] p-6 sm:p-8 rounded-3xl border border-[#5C4B8B]/30 hover:border-[#C3A6E6]/30 transition-all cursor-pointer hsr-card-hover overflow-hidden"
    >
      {/* Decorative background element */}
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#C3A6E6]/5 rounded-full blur-2xl group-hover:bg-[#C3A6E6]/10 transition-all" />
      
      <div className="flex justify-between items-start mb-6">
        <div className="px-4 py-1.5 rounded-full bg-[#C3A6E6]/10 text-[#C3A6E6] text-[10px] font-black uppercase tracking-widest border border-[#C3A6E6]/20">
          {t[`filter${theory.category.charAt(0).toUpperCase() + theory.category.slice(1)}` as keyof typeof t] || theory.category}
        </div>
        <div className="flex flex-wrap gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 justify-end">
          {isAdmin && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit?.(e); }}
                className="p-2.5 rounded-xl bg-[#5C4B8B]/30 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 transition-all border border-transparent hover:border-blue-400/30"
                title="Edit"
              >
                <Edit size={18} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete?.(e); }}
                className="p-2.5 rounded-xl bg-[#5C4B8B]/30 text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all border border-transparent hover:border-red-400/30"
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
          <button 
            onClick={handleShare}
            className={`p-2.5 rounded-xl bg-[#5C4B8B]/30 transition-all border border-transparent ${copied ? 'text-green-400 bg-green-400/10 border-green-400/30' : 'text-gray-400 hover:text-[#C3A6E6] hover:border-[#C3A6E6]/30 hover:bg-[#C3A6E6]/10'}`}
            title="Share"
          >
            {copied ? <Check size={18} /> : <Share2 size={18} />}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(e); }}
            className={`p-2.5 rounded-xl bg-[#5C4B8B]/30 transition-all border border-transparent ${isFavorite ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' : 'text-gray-400 hover:text-yellow-400 hover:border-yellow-400/30 hover:bg-yellow-400/10'}`}
          >
            <Star size={18} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      <h3 className="text-xl sm:text-2xl font-black text-white mb-3 leading-tight tracking-tight group-hover:text-[#C3A6E6] transition-colors uppercase">
        {theory.title[lang] || theory.title['en']}
      </h3>
      
      <p className="text-gray-400 text-xs sm:text-sm line-clamp-2 mb-6 font-medium leading-relaxed group-hover:text-gray-300 transition-colors">
        {theory.summary[lang] || theory.summary['en']}
      </p>

      <div className="flex flex-col gap-4 mt-auto">
        <div className="flex items-center justify-between">
          <ReactionsBar targetId={theory.id} />
          
          <div className="flex items-center gap-2 text-[#C3A6E6] text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
            {t.readArchive} <ArrowRight size={12} />
          </div>
        </div>
      </div>
    </motion.div>
  );
});
