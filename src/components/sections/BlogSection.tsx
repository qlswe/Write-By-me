import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Star, Search, ArrowLeft, Edit, Save, X } from 'lucide-react';
import { blogPostsData, BlogPost } from '../../data/content';
import { Language, translations } from '../../data/translations';
import { usePerfLogger } from '../../utils/logger';
import { CommentsSection } from './CommentsSection';
import { BlogCard } from './BlogCard';
import { db } from '../../firebase';
import { collection, doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';

interface BlogSectionProps {
  lang: Language;
  blogCategory: string;
  setBlogCategory: (cat: string) => void;
  blogSearch: string;
  setBlogSearch: (search: string) => void;
  favorites: string[];
  toggleFavorite: (id: string, e: React.MouseEvent) => void;
  lowPerfMode?: boolean;
}

export const BlogSection: React.FC<BlogSectionProps> = ({
  lang,
  blogCategory,
  setBlogCategory,
  blogSearch,
  setBlogSearch,
  favorites,
  toggleFavorite,
  lowPerfMode
}) => {
  const t = translations[lang];
  const { trackRender } = usePerfLogger('BlogSection');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [firestorePosts, setFirestorePosts] = useState<Record<string, BlogPost>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<BlogPost | null>(null);
  const { user } = useAuth();
  trackRender();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'blogPosts'), (snapshot) => {
      const posts: Record<string, BlogPost> = {};
      snapshot.forEach((doc) => {
        posts[doc.id] = { id: doc.id, ...doc.data() } as BlogPost;
      });
      setFirestorePosts(posts);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'blogPosts');
    });
    return () => unsubscribe();
  }, []);

  const allPosts = useMemo(() => {
    const merged = [...blogPostsData];
    Object.values(firestorePosts).forEach(fp => {
      const index = merged.findIndex(p => p.id === fp.id);
      if (index !== -1) {
        merged[index] = fp;
      } else {
        merged.push(fp);
      }
    });
    return merged;
  }, [firestorePosts]);

  const filteredBlog = useMemo(() => {
    return allPosts.filter(post => {
      const matchesCat = blogCategory === 'all' || 
                         (blogCategory === 'favorites' ? favorites.includes(post.id) : post.category === blogCategory);
      const search = blogSearch.toLowerCase();
      const matchesSearch = (post.title[lang] || post.title['en']).toLowerCase().includes(search) || 
                            (post.summary[lang] || post.summary['en']).toLowerCase().includes(search);
      return matchesCat && matchesSearch;
    });
  }, [allPosts, blogCategory, blogSearch, lang, favorites]);

  const selectedPost = useMemo(() => {
    return selectedPostId ? allPosts.find(p => p.id === selectedPostId) : null;
  }, [selectedPostId, allPosts]);

  const handleEditClick = useCallback((post: BlogPost) => {
    setEditForm(post);
    setIsEditing(true);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editForm || !user) return;
    try {
      await setDoc(doc(db, 'blogPosts', editForm.id), {
        ...editForm,
        updatedAt: new Date().toISOString()
      });
      setIsEditing(false);
      setEditForm(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `blogPosts/${editForm.id}`);
    }
  }, [editForm, user]);

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
          <div className="flex gap-2">
            {user && !isEditing && (
              <button 
                onClick={() => handleEditClick(selectedPost)}
                className="p-2 sm:p-3 rounded-full transition-colors shrink-0 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10"
                title="Edit Post"
              >
                <Edit size={24} className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}
            <button 
              onClick={(e) => toggleFavorite(selectedPost.id, e)}
              className={`p-2 sm:p-3 rounded-full transition-colors shrink-0 ${favorites.includes(selectedPost.id) ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10'}`}
            >
              <Star size={24} className="w-5 h-5 sm:w-6 sm:h-6" fill={favorites.includes(selectedPost.id) ? "currentColor" : "none"} />
            </button>
          </div>
        </div>

        {isEditing && editForm ? (
          <div className="mb-8 bg-[#2A2045] p-6 rounded-xl border border-[#5C4B8B]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Edit Post ({lang.toUpperCase()})</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={20} />
                </button>
                <button 
                  onClick={handleSaveEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  <Save size={18} />
                  Save
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                <input 
                  type="text"
                  value={editForm.title[lang] || ''}
                  onChange={(e) => setEditForm({...editForm, title: {...editForm.title, [lang]: e.target.value}})}
                  className="w-full bg-[#1A142A] border border-[#5C4B8B] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#C3A6E6]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Summary</label>
                <textarea 
                  value={editForm.summary[lang] || ''}
                  onChange={(e) => setEditForm({...editForm, summary: {...editForm.summary, [lang]: e.target.value}})}
                  className="w-full bg-[#1A142A] border border-[#5C4B8B] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#C3A6E6] min-h-[80px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Content (HTML)</label>
                <textarea 
                  value={editForm.content[lang] || ''}
                  onChange={(e) => setEditForm({...editForm, content: {...editForm.content, [lang]: e.target.value}})}
                  className="w-full bg-[#1A142A] border border-[#5C4B8B] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#C3A6E6] min-h-[200px] font-mono text-sm"
                />
              </div>
            </div>
          </div>
        ) : (
          <div 
            ref={contentRef}
            className="prose prose-invert prose-p:text-gray-300 prose-headings:text-white prose-a:text-[#C3A6E6] max-w-none mb-8 text-sm sm:text-base"
            dangerouslySetInnerHTML={{ __html: selectedPost.content[lang] || selectedPost.content['en'] }}
          />
        )}

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
              onEdit={(e) => {
                e.stopPropagation();
                handlePostClick(post.id);
                handleEditClick(post);
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};
