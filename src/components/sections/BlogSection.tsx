import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Star, Search, ArrowLeft, Plus, Edit } from 'lucide-react';
import { blogPostsData } from '../../data/content';
import { Language, translations } from '../../data/translations';
import { usePerfLogger } from '../../utils/logger';
import { CommentsSection } from './CommentsSection';
import { BlogCard } from './BlogCard';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { useAuth } from '../../hooks/useAuth';

interface BlogSectionProps {
  lang: Language;
  blogCategory: string;
  setBlogCategory: (cat: string) => void;
  blogSearch: string;
  setBlogSearch: (search: string) => void;
  favorites: string[];
  toggleFavorite: (id: string, e: React.MouseEvent) => void;
  lowPerfMode?: boolean;
  blogPosts?: any[];
  onEdit?: (post: any) => void;
  onCreate?: () => void;
}

export const BlogSection: React.FC<BlogSectionProps> = ({
  lang,
  blogCategory,
  setBlogCategory,
  blogSearch,
  setBlogSearch,
  favorites,
  toggleFavorite,
  lowPerfMode,
  blogPosts = blogPostsData,
  onEdit,
  onCreate
}) => {
  const t = translations[lang];
  const { trackRender } = usePerfLogger('BlogSection');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.email === 'semegladysev527@gmail.com';
  trackRender();

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deleteDoc(doc(db, 'blogPosts', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `blogPosts/${id}`);
      }
    }
  };

  const filteredBlog = useMemo(() => {
    return blogPosts.filter(post => {
      const matchesCat = blogCategory === 'all' || 
                         (blogCategory === 'favorites' ? favorites.includes(post.id) : post.category === blogCategory);
      const search = blogSearch.toLowerCase();
      const matchesSearch = (post.title[lang] || post.title['en']).toLowerCase().includes(search) || 
                            (post.summary[lang] || post.summary['en']).toLowerCase().includes(search);
      return matchesCat && matchesSearch;
    });
  }, [blogCategory, blogSearch, lang, favorites, blogPosts]);

  const selectedPost = useMemo(() => {
    return selectedPostId ? blogPosts.find(p => p.id === selectedPostId) : null;
  }, [selectedPostId, blogPosts]);

  const handlePostClick = useCallback((id: string) => {
    setSelectedPostId(id);
  }, []);

  const handleToggleFavorite = useCallback((id: string, e: React.MouseEvent) => {
    toggleFavorite(id, e);
  }, [toggleFavorite]);

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      const images = contentRef.current.querySelectorAll('img');
      images.forEach(img => {
        if (!img.hasAttribute('loading')) {
          img.setAttribute('loading', 'lazy');
        }
      });
    }
  }, [selectedPostId, lang]);

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
          <div className="flex gap-2 shrink-0">
            {isAdmin && (
              <button 
                onClick={() => onEdit?.(selectedPost)}
                className="p-2 sm:p-3 rounded-full transition-colors text-gray-400 hover:text-blue-400 hover:bg-blue-400/10"
                title={t.editBtn}
              >
                <Edit size={24} className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}
            <button 
              onClick={(e) => toggleFavorite(selectedPost.id, e)}
              className={`p-2 sm:p-3 rounded-full transition-colors ${favorites.includes(selectedPost.id) ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10'}`}
            >
              <Star size={24} className="w-5 h-5 sm:w-6 sm:h-6" fill={favorites.includes(selectedPost.id) ? "currentColor" : "none"} />
            </button>
          </div>
        </div>

        <div 
          ref={contentRef}
          className="prose prose-invert prose-p:text-gray-300 prose-headings:text-white prose-a:text-[#C3A6E6] max-w-none mb-8 text-sm sm:text-base"
          dangerouslySetInnerHTML={{ __html: selectedPost.content[lang] || selectedPost.content['en'] }}
        />

        <CommentsSection targetId={selectedPost.id} lang={lang} lowPerfMode={lowPerfMode} />
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
      <div className="flex justify-between items-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#C3A6E6]">{t.navBlog}</h2>
        {isAdmin && (
          <button 
            onClick={onCreate}
            className="flex items-center gap-2 bg-[#C3A6E6] text-[#2F244F] px-4 py-2 rounded-xl font-bold hover:bg-white transition-colors"
          >
            <Plus size={20} />
            {t.createBlog}
          </button>
        )}
      </div>
      
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

      {filteredBlog.length === 0 ? (
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
              onEdit={(e) => { e.stopPropagation(); onEdit?.(post); }}
              onDelete={(e) => { e.stopPropagation(); handleDelete(post.id); }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};
