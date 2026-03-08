import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { Star, Search, ArrowLeft } from 'lucide-react';
import { blogPostsData } from '../../data/content';
import { Language, translations } from '../../data/translations';
import { usePerfLogger } from '../../utils/logger';
import { CommentsSection } from './CommentsSection';
import { BlogCard } from './BlogCard';

interface BlogSectionProps {
  lang: Language;
  blogCategory: string;
  setBlogCategory: (cat: string) => void;
  blogSearch: string;
  setBlogSearch: (search: string) => void;
  favorites: string[];
  toggleFavorite: (id: string, e: React.MouseEvent) => void;
}

export const BlogSection: React.FC<BlogSectionProps> = ({
  lang,
  blogCategory,
  setBlogCategory,
  blogSearch,
  setBlogSearch,
  favorites,
  toggleFavorite
}) => {
  const t = translations[lang];
  const { trackRender } = usePerfLogger('BlogSection');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isFiltering, setIsFiltering] = useState(true);
  trackRender();

  useEffect(() => {
    setIsFiltering(true);
    const timer = setTimeout(() => setIsFiltering(false), 500);
    return () => clearTimeout(timer);
  }, [blogCategory, blogSearch]);

  const filteredBlog = useMemo(() => {
    return blogPostsData.filter(post => {
      const matchesCat = blogCategory === 'all' || 
                         (blogCategory === 'favorites' ? favorites.includes(post.id) : post.category === blogCategory);
      const search = blogSearch.toLowerCase();
      const matchesSearch = (post.title[lang] || post.title['en']).toLowerCase().includes(search) || 
                            (post.summary[lang] || post.summary['en']).toLowerCase().includes(search);
      return matchesCat && matchesSearch;
    });
  }, [blogCategory, blogSearch, lang, favorites]);

  const selectedPost = useMemo(() => {
    return selectedPostId ? blogPostsData.find(p => p.id === selectedPostId) : null;
  }, [selectedPostId]);

  const handlePostClick = useCallback((id: string) => {
    setSelectedPostId(id);
  }, []);

  const handleToggleFavorite = useCallback((id: string, e: React.MouseEvent) => {
    toggleFavorite(id, e);
  }, [toggleFavorite]);

  if (selectedPost) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="bg-[#3E3160]/90 backdrop-blur-sm rounded-2xl p-4 sm:p-8 shadow-xl border border-[#5C4B8B]"
      >
        <button 
          onClick={() => setSelectedPostId(null)}
          className="flex items-center gap-2 text-[#C3A6E6] hover:text-white transition-colors mb-6 font-bold"
        >
          <ArrowLeft size={20} />
          {t.navBlog}
        </button>
        
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white pr-4 sm:pr-8">
            {selectedPost.title[lang] || selectedPost.title['en']}
          </h2>
          <button 
            onClick={(e) => toggleFavorite(selectedPost.id, e)}
            className={`p-2 sm:p-3 rounded-full transition-colors shrink-0 ${favorites.includes(selectedPost.id) ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10'}`}
          >
            <Star size={24} className="w-5 h-5 sm:w-6 sm:h-6" fill={favorites.includes(selectedPost.id) ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="prose prose-invert prose-p:text-gray-300 prose-headings:text-white prose-a:text-[#C3A6E6] max-w-none mb-8 text-sm sm:text-base"
          dangerouslySetInnerHTML={{ __html: selectedPost.content[lang] || selectedPost.content['en'] }}
        />

        <CommentsSection targetId={selectedPost.id} lang={lang} />
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-[#3E3160]/90 backdrop-blur-sm rounded-2xl p-4 sm:p-8 shadow-xl border border-[#5C4B8B]"
    >
      <h2 className="text-2xl sm:text-3xl font-bold text-[#C3A6E6] mb-6 sm:mb-8">{t.navBlog}</h2>
      
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#C3A6E6]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </div>
          <select 
            value={blogCategory}
            onChange={(e) => setBlogCategory(e.target.value)}
            className="appearance-none bg-[#3E3160] border border-[#5C4B8B] rounded-xl pl-12 pr-4 py-3 text-gray-200 focus:outline-none focus:border-[#C3A6E6] cursor-pointer w-full sm:w-auto hover:border-[#C3A6E6] transition-colors"
          >
            <option value="all">{t.filterAll}</option>
            <option value="updates">{t.filterUpdates}</option>
            <option value="personal">{t.filterPersonal}</option>
            <option value="favorites">{t.filterFavorites}</option>
          </select>
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder={t.searchPlaceholder}
            value={blogSearch}
            onChange={(e) => setBlogSearch(e.target.value)}
            className="w-full bg-[#3E3160] border border-[#5C4B8B] rounded-xl pl-12 pr-4 py-3 text-gray-200 focus:outline-none focus:border-[#C3A6E6]"
          />
        </div>
      </div>

      {isFiltering ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-[#2F244F] border border-[#5C4B8B] rounded-2xl p-6 h-[200px] animate-pulse">
              <div className="flex justify-between items-start mb-4">
                <div className="w-2/3 h-6 bg-[#3E3160] rounded"></div>
                <div className="w-8 h-8 bg-[#3E3160] rounded-full"></div>
              </div>
              <div className="w-1/4 h-4 bg-[#3E3160] rounded mb-4"></div>
              <div className="w-full h-16 bg-[#3E3160] rounded"></div>
            </div>
          ))}
        </div>
      ) : filteredBlog.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-[#3E3160]/50 rounded-2xl border border-dashed border-[#5C4B8B]">
          {t.noResults}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBlog.map((post, index) => (
            <BlogCard
              key={post.id}
              post={post}
              index={index}
              lang={lang}
              isFavorite={favorites.includes(post.id)}
              onClick={() => handlePostClick(post.id)}
              onToggleFavorite={(e) => handleToggleFavorite(post.id, e)}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};
