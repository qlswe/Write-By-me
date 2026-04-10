import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Search, ArrowLeft, Plus, Edit, Newspaper, Sparkles, Clock, User } from 'lucide-react';
import { blogPostsData } from '../../data/content';
import { Language, translations } from '../../data/translations';
import { usePerfLogger } from '../../utils/logger';
import { CommentsSection } from './CommentsSection';
import { BlogCard } from './BlogCard';

import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { useAuth } from '../../hooks/useAuth';
import { TimeAgo } from '../ui/TimeAgo';

import { ConfirmModal } from '../ui/ConfirmModal';

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
  onOpenChat?: (uid: string, name: string) => void;
  role?: 'admin' | 'moderator' | 'user';
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
  onCreate,
  onOpenChat,
  role
}) => {
  const t = translations[lang];
  const { trackRender } = usePerfLogger('BlogSection');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const { user } = useAuth();
  const isAdmin = role === 'admin';
  const isModerator = role === 'admin' || role === 'moderator';
  trackRender();

  const handleDelete = async () => {
    if (!postToDelete) return;
    try {
      await deleteDoc(doc(db, 'blogPosts', postToDelete));
      setPostToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `blogPosts/${postToDelete}`);
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
    if (selectedPostId) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedPostId]);

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

  return (
    <div className="relative min-h-[600px]">
      <AnimatePresence mode="wait">
        {selectedPost ? (
          <motion.div 
            key="blog-detail"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="bg-[#3E3160] rounded-3xl p-6 sm:p-10 shadow-2xl border border-[#5C4B8B] relative overflow-hidden"
          >
            {/* Background Decorative Element */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-[#C3A6E6]/5 rounded-full -translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
            
            <button 
              onClick={() => setSelectedPostId(null)}
              className="group flex items-center gap-3 text-[#C3A6E6] hover:text-white transition-all mb-8 font-black uppercase tracking-tighter"
            >
              <div className="p-2 rounded-full bg-[#5C4B8B]/30 group-hover:bg-[#C3A6E6] group-hover:text-[#2F244F] transition-all">
                <ArrowLeft size={16} />
              </div>
              {t.navBlog}
            </button>
            
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-10">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 rounded-full bg-[#C3A6E6]/20 text-[#C3A6E6] text-xs font-black uppercase tracking-widest border border-[#C3A6E6]/30">
                    {selectedPost.category}
                  </span>
                  <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                    <Clock size={12} />
                    <TimeAgo date={selectedPost.createdAt} lang={lang} />
                  </div>
                </div>
                <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tighter">
                  {selectedPost.title[lang] || selectedPost.title['en']}
                </h2>
              </div>
              
              <div className="flex flex-wrap gap-3 shrink-0 justify-end">
                {isModerator && (
                  <button 
                    onClick={() => onEdit?.(selectedPost)}
                    className="p-4 rounded-2xl bg-[#5C4B8B]/30 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 transition-all border border-transparent hover:border-blue-400/30"
                    title={t.editBtn}
                  >
                    <Edit size={18} />
                  </button>
                )}
                <button 
                  onClick={(e) => toggleFavorite(selectedPost.id, e)}
                  className={`p-4 rounded-2xl bg-[#5C4B8B]/30 transition-all border border-transparent ${favorites.includes(selectedPost.id) ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' : 'text-gray-400 hover:text-yellow-400 hover:border-yellow-400/30 hover:bg-yellow-400/10'}`}
                >
                  <Star size={18} fill={favorites.includes(selectedPost.id) ? "currentColor" : "none"} />
                </button>
              </div>
            </div>

            <div 
              ref={contentRef}
              className="prose prose-invert prose-p:text-gray-300 prose-headings:text-white prose-a:text-[#C3A6E6] max-w-none mb-8 text-base sm:text-lg leading-relaxed"
              dangerouslySetInnerHTML={{ __html: selectedPost.content[lang] || selectedPost.content['en'] }}
            />

            <div className="mb-12">

            </div>

            <div className="pt-10 border-t border-[#5C4B8B]">
              <CommentsSection targetId={selectedPost.id} lang={lang} lowPerfMode={lowPerfMode} role={role} onOpenChat={onOpenChat} />
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="blog-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-[#3E3160] rounded-3xl p-6 sm:p-10 shadow-2xl border border-[#5C4B8B]"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
              <div>
                <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tighter uppercase mb-2 flex items-center gap-4">
                  <Newspaper className="text-[#C3A6E6]" size={32} />
                  {t.navBlog}
                </h2>
                <p className="text-[#C3A6E6]/60 font-medium tracking-wide uppercase text-xs">
                  {t.blogSubTitle}
                </p>
              </div>
              {isModerator && (
                <button 
                  onClick={onCreate}
                  className="flex items-center gap-3 bg-[#C3A6E6] text-[#2F244F] px-6 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#C3A6E6]/20"
                >
                  <Plus size={20} />
                  {t.createBlog}
                </button>
              )}
            </div>
            
            <div className="flex flex-col lg:flex-row gap-6 mb-10">
              <div className="flex gap-2 p-1.5 bg-[#2F244F]/50 rounded-2xl border border-[#5C4B8B] overflow-x-auto no-scrollbar ml-6">
                {['all', 'updates', 'personal', 'favorites'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setBlogCategory(cat)}
                    className={`px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                      blogCategory === cat 
                        ? 'bg-[#C3A6E6] text-[#2F244F] shadow-lg shadow-[#C3A6E6]/20' 
                        : 'text-gray-400 hover:text-white hover:bg-[#5C4B8B]/30'
                    }`}
                  >
                    {cat === 'all' ? t.filterAll : 
                     cat === 'updates' ? t.filterUpdates : 
                     cat === 'personal' ? t.filterPersonal : t.filterFavorites}
                  </button>
                ))}
              </div>
              <div className="relative flex-1">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#C3A6E6]/50" size={22} />
                <input 
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={blogSearch}
                  onChange={(e) => setBlogSearch(e.target.value)}
                  className="w-full bg-[#2F244F]/50 border border-[#5C4B8B] rounded-2xl pl-14 pr-6 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#C3A6E6] focus:ring-4 focus:ring-[#C3A6E6]/10 transition-all"
                />
              </div>
            </div>

            {filteredBlog.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-24 text-gray-400 bg-[#2F244F]/30 rounded-3xl border-2 border-dashed border-[#5C4B8B]/50 flex flex-col items-center gap-4"
              >
                <Sparkles size={48} className="text-[#5C4B8B]" />
                <p className="text-xl font-bold uppercase tracking-widest">{t.noResults}</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                    onDelete={(e) => { e.stopPropagation(); setPostToDelete(post.id); }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!postToDelete}
        onClose={() => setPostToDelete(null)}
        onConfirm={handleDelete}
        title={t.confirmDeletePostTitle || "Delete Post"}
        message={t.confirmDeletePostMessage || "Are you sure you want to delete this post? This action cannot be undone."}
        confirmText={t.delete || "Delete"}
        cancelText={t.cancelBtn || "Cancel"}
        isDestructive={true}
      />
    </div>
  );
};
