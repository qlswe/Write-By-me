import React from 'react';
import { motion } from 'motion/react';
import { Star, Edit } from 'lucide-react';
import { Language, translations } from '../../data/translations';
import { useAuth } from '../../hooks/useAuth';

interface BlogCardProps {
  post: any;
  index: number;
  lang: Language;
  isFavorite: boolean;
  onClick: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onEdit?: (e: React.MouseEvent) => void;
}

export const BlogCard: React.FC<BlogCardProps> = React.memo(({
  post,
  index,
  lang,
  isFavorite,
  onClick,
  onToggleFavorite,
  onEdit
}) => {
  const t = translations[lang];
  const { user } = useAuth();
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={onClick}
      className="bg-[#3E3160] p-6 rounded-2xl shadow-lg border border-[#5C4B8B] cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all group relative"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="text-xs font-bold uppercase tracking-wider text-[#C3A6E6] bg-[#C3A6E6]/10 inline-block px-3 py-1 rounded-full">
          {t[`filter${post.category.charAt(0).toUpperCase() + post.category.slice(1)}` as keyof typeof t] || post.category}
        </div>
        <div className="flex gap-1">
          {user && onEdit && (
            <button 
              onClick={onEdit}
              className="p-2 rounded-full transition-colors text-gray-400 hover:text-blue-400 hover:bg-blue-400/10"
              title="Edit Post"
            >
              <Edit size={20} />
            </button>
          )}
          <button 
            onClick={onToggleFavorite}
            className={`p-2 rounded-full transition-colors ${isFavorite ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10'}`}
          >
            <Star size={20} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#C3A6E6] transition-colors pr-8">
        {post.title[lang] || post.title['en']}
      </h3>
      <p className="text-gray-300 line-clamp-3">
        {post.summary[lang] || post.summary['en']}
      </p>
    </motion.div>
  );
});
