import React from 'react';
import { motion } from 'motion/react';
import { Star, Edit, Trash2, ArrowRight, Calendar } from 'lucide-react';
import { Language, translations } from '../../data/translations';
import { useAuth } from '../../hooks/useAuth';
import { sdk } from '../../sdk';

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
  const { user } = useAuth();
  const isAdmin = user?.email === 'semegladysev527@gmail.com';
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, delay: index * 0.05, type: "spring", damping: 20 }}
      onClick={onClick}
      className="group relative bg-[#2F244F]/40 hover:bg-[#3E3160]/60 p-6 sm:p-8 rounded-[2rem] border border-[#5C4B8B]/40 hover:border-[#C3A6E6]/40 transition-all cursor-pointer overflow-hidden hsr-card-hover"
    >
      {/* Decorative background element */}
      <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#C3A6E6]/5 rounded-full blur-2xl group-hover:bg-[#C3A6E6]/10 transition-all" />
      
      <div className="flex justify-between items-start mb-6">
        <div className="flex flex-col gap-2">
          <div className="px-4 py-1.5 rounded-full bg-[#C3A6E6]/10 text-[#C3A6E6] text-[10px] font-black uppercase tracking-[0.2em] border border-[#C3A6E6]/20 self-start">
            {t[`filter${post.category.charAt(0).toUpperCase() + post.category.slice(1)}` as keyof typeof t] || post.category}
          </div>
          <div className="flex items-center gap-2 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
            <Calendar size={10} />
            {sdk.data.formatDate(post.createdAt, lang)}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 justify-end">
          {isAdmin && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit?.(e); }}
                className="p-2.5 rounded-xl bg-[#2F244F]/80 text-gray-400 hover:text-blue-400 hover:bg-blue-400/20 transition-all border border-transparent hover:border-blue-400/30"
                title="Edit Post"
              >
                <Edit size={16} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete?.(e); }}
                className="p-2.5 rounded-xl bg-[#2F244F]/80 text-gray-400 hover:text-red-400 hover:bg-red-400/20 transition-all border border-transparent hover:border-red-400/30"
                title="Delete Post"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(e); }}
            className={`p-2.5 rounded-xl bg-[#2F244F]/80 transition-all border border-transparent ${isFavorite ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/20' : 'text-gray-400 hover:text-yellow-400 hover:border-yellow-400/30 hover:bg-yellow-400/10'}`}
          >
            <Star size={16} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      <h3 className="text-2xl sm:text-3xl font-black text-white mb-4 leading-tight tracking-tighter group-hover:text-[#C3A6E6] transition-colors">
        {post.title[lang] || post.title['en']}
      </h3>
      
      <p className="text-gray-400 text-sm sm:text-base line-clamp-3 mb-6 font-medium leading-relaxed group-hover:text-gray-300 transition-colors">
        {post.summary[lang] || post.summary['en']}
      </p>

      <div className="flex items-center gap-2 text-[#C3A6E6] text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
        {t.readArticle} <ArrowRight size={14} />
      </div>
    </motion.div>
  );
});
