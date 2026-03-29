import React from 'react';
import { motion } from 'motion/react';
import { Star, Share2, Check } from 'lucide-react';
import { Language, translations } from '../../data/translations';

interface TheoryCardProps {
  theory: any;
  index: number;
  lang: Language;
  isFavorite: boolean;
  onClick: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

export const TheoryCard: React.FC<TheoryCardProps> = React.memo(({
  theory,
  index,
  lang,
  isFavorite,
  onClick,
  onToggleFavorite
}) => {
  const t = translations[lang];
  const [copied, setCopied] = React.useState(false);

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={onClick}
      className="bg-[#3E3160] p-6 rounded-2xl shadow-lg border border-[#5C4B8B] cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all group relative"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="text-xs font-bold uppercase tracking-wider text-[#C3A6E6] bg-[#C3A6E6]/10 inline-block px-3 py-1 rounded-full">
          {t[`filter${theory.category.charAt(0).toUpperCase() + theory.category.slice(1)}` as keyof typeof t] || theory.category}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleShare}
            className={`p-2 rounded-full transition-colors ${copied ? 'text-green-400 bg-green-400/10' : 'text-gray-400 hover:text-[#C3A6E6] hover:bg-[#C3A6E6]/10'}`}
            title="Share"
          >
            {copied ? <Check size={20} /> : <Share2 size={20} />}
          </button>
          <button 
            onClick={onToggleFavorite}
            className={`p-2 rounded-full transition-colors ${isFavorite ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10'}`}
          >
            <Star size={20} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#C3A6E6] transition-colors pr-8">
        {theory.title[lang] || theory.title['en']}
      </h3>
      <p className="text-gray-300 line-clamp-3">
        {theory.summary[lang] || theory.summary['en']}
      </p>
    </motion.div>
  );
});
