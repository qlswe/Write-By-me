import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Search, ArrowLeft, Plus, Edit, Newspaper, Sparkles, Clock, User, FileDown, Printer, Quote } from 'lucide-react';
import { ArticleReadingMeta, ArticleCitationModal, ArticleTableOfContents } from '../ui/ArticleTools';
import { blogPostsData } from '../../data/content';
import { exportContentToPDF } from '../../utils/pdfExport';
import { Language, translations } from '../../data/translations';
import { usePerfLogger } from '../../utils/logger';
import { useDebounce } from '../../utils/performanceOptimizer';
import { CommentsSection } from './CommentsSection';
import { BlogCard } from './BlogCard';

import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { useAuth } from '../../hooks/useAuth';
import { TimeAgo } from '../ui/TimeAgo';

import { ConfirmModal } from '../ui/ConfirmModal';
import { SafeHtml } from '../security/AhaSecurity';
import { MediaViewer } from '../ui/MediaViewer';
import { BlogSkeletonGrid } from '../ui/SkeletonLoaders';
import { getLocalizedCategory } from '../../utils/categories';
import { PullToRefresh } from '../ui/PullToRefresh';
import { useContent } from '../../hooks/useContent';

interface BlogSectionProps {
  lang: Language;
  blogCategory: string;
  setBlogCategory: (cat: string) => void;
  blogSearch: string;
  setBlogSearch: (search: string) => void;
  favorites: string[];
  toggleFavorite: (id: string, e: React.MouseEvent) => void;
  lowPerfMode?: boolean;
  loading?: boolean;
  blogPosts?: any[];
  onEdit?: (post: any) => void;
  onCreate?: () => void;
  onOpenChat?: (uid: string, name: string) => void;
  onRefresh?: () => Promise<any> | void;
  role?: 'admin' | 'moderator' | 'user' | 'beta-tester';
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
  loading = false,
  blogPosts = blogPostsData,
  onEdit,
  onCreate,
  onOpenChat,
  onRefresh,
  role
}) => {
  const t = translations[lang];
  const { trackRender } = usePerfLogger('BlogSection');
  const debouncedBlogSearch = useDebounce(blogSearch, 150);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [showCiteModal, setShowCiteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const { user } = useAuth();
  const { refreshContent } = useContent();
  const isAdmin = role === 'admin';
  const isModerator = role === 'admin' || role === 'moderator';
  trackRender();

  const handleManualRefresh = async () => {
    if (onRefresh) {
      await onRefresh();
    } else {
      await refreshContent(true);
    }
  };

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
      const search = debouncedBlogSearch.toLowerCase();
      const matchesSearch = (post.title[lang] || post.title['en']).toLowerCase().includes(search) || 
                            (post.summary[lang] || post.summary['en']).toLowerCase().includes(search);
      return matchesCat && matchesSearch;
    });
  }, [blogCategory, debouncedBlogSearch, lang, favorites, blogPosts]);

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
            className="bg-[#251c35] rounded-3xl p-6 sm:p-10 shadow-2xl border border-[#3d2b4f] relative overflow-hidden printable-theory-article"
          >
            {/* Print-Only Cover Page with Metadata */}
            <div className="hidden print-cover-page">
              <div className="print-cover-header">
                <div className="print-cover-logo">
                  🏛️ AHA PLATFORM | {lang === 'ru' ? 'МИНИСТЕРСТВО АХАХИ' : 'MINISTRY OF AHA'}
                </div>
                <div className="print-cover-doc-type">
                  {lang === 'ru' ? 'ПУБЛИКАЦИЯ БЛОГА' : 'BLOG PUBLICATION'}
                </div>
              </div>

              <div className="print-cover-body">
                <div className="print-cover-badge">
                  {getLocalizedCategory(selectedPost.category, lang).toUpperCase()}
                </div>
                <h1 className="print-cover-title">
                  {selectedPost.title[lang] || selectedPost.title['en']}
                </h1>
                {(selectedPost.summary?.[lang] || selectedPost.summary?.['en']) && (
                  <div className="print-cover-summary">
                    <strong>{lang === 'ru' ? 'Аннотация:' : 'Abstract:'}</strong>{' '}
                    {selectedPost.summary[lang] || selectedPost.summary['en']}
                  </div>
                )}
              </div>

              <div className="print-cover-footer">
                <div className="print-cover-meta-grid">
                  <div><strong>{lang === 'ru' ? 'Автор / Редакция:' : 'Author / Editorial:'}</strong> AHA Editorial Team</div>
                  <div><strong>{lang === 'ru' ? 'Дата публикации:' : 'Published:'}</strong> {new Date(selectedPost.createdAt || Date.now()).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US')}</div>
                  <div><strong>{lang === 'ru' ? 'Идентификатор:' : 'ID:'}</strong> {selectedPost.id}</div>
                  <div><strong>{lang === 'ru' ? 'Статус:' : 'Status:'}</strong> VERIFIED PUBLICATION</div>
                </div>
                <div className="print-cover-stamp">
                  AHA VERIFIED
                </div>
              </div>
            </div>

            {/* Background Decorative Element */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-[#ff4d4d]/5 rounded-full -translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none print:hidden" />
            
            <button 
              onClick={() => setSelectedPostId(null)}
              className="group flex items-center gap-3 text-[#ff4d4d] hover:text-white transition-all mb-8 font-black uppercase tracking-tighter print:hidden cursor-pointer"
            >
              <div className="p-2 rounded-full bg-[#3d2b4f]/30 group-hover:bg-[#ff4d4d] group-hover:text-[#15101e] transition-all">
                <ArrowLeft size={16} />
              </div>
              {t.navBlog}
            </button>
            
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 rounded-full bg-[#ff4d4d]/20 text-[#ff4d4d] text-xs font-black uppercase tracking-widest border border-[#ff4d4d]/30 category-badge-print">
                    {getLocalizedCategory(selectedPost.category, lang)}
                  </span>
                  {selectedPost.version && (
                    <span className="px-2.5 py-0.5 rounded-md bg-purple-500/10 text-purple-300 text-[10px] font-black tracking-wider border border-purple-500/20 print:hidden">
                      v{selectedPost.version}
                    </span>
                  )}
                  <div className="flex items-center gap-2 text-white/40 text-xs font-medium print:hidden">
                    <Clock size={12} />
                    <TimeAgo date={selectedPost.createdAt} lang={lang} />
                  </div>
                </div>
                <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tighter mb-4">
                  {selectedPost.title[lang] || selectedPost.title['en']}
                </h2>

                {/* Article Statistics & Reading Meta */}
                <ArticleReadingMeta
                  htmlContent={selectedPost.content[lang] || selectedPost.content['en']}
                  lang={lang}
                />
              </div>
              
              <div className="flex flex-wrap gap-3 shrink-0 justify-end print:hidden">
                {isModerator && (
                  <button 
                    onClick={() => onEdit?.(selectedPost)}
                    className="p-4 rounded-2xl bg-[#3d2b4f]/30 text-white/40 hover:text-blue-400 hover:bg-blue-400/10 transition-all border border-transparent hover:border-blue-400/30 cursor-pointer"
                    title={t.editBtn}
                  >
                    <Edit size={18} />
                  </button>
                )}
                <button 
                  onClick={() => setShowCiteModal(true)}
                  className="p-4 rounded-2xl bg-[#3d2b4f]/30 text-white/40 hover:text-purple-400 hover:bg-purple-400/10 hover:border-purple-400/30 transition-all border border-transparent cursor-pointer flex items-center justify-center"
                  title={lang === 'ru' ? 'Академическое цитирование (ГОСТ / APA / BibTeX)' : 'Cite Article (GOST / APA / BibTeX)'}
                >
                  <Quote size={18} />
                </button>
                <button 
                  onClick={() => exportContentToPDF({
                    title: selectedPost.title[lang] || selectedPost.title['en'],
                    category: getLocalizedCategory(selectedPost.category, lang),
                    createdAt: selectedPost.createdAt,
                    summary: selectedPost.summary?.[lang] || selectedPost.summary?.['en'],
                    contentHtml: selectedPost.content[lang] || selectedPost.content['en'],
                    mediaUrl: selectedPost.mediaUrl,
                    sectionName: lang === 'ru' ? 'Блог' : 'Blog',
                    lang
                  })}
                  className="p-4 rounded-2xl bg-[#3d2b4f]/30 text-white/40 hover:text-emerald-400 hover:bg-emerald-400/10 hover:border-emerald-400/30 transition-all border border-transparent cursor-pointer flex items-center justify-center"
                  title={lang === 'ru' ? 'Экспорт в PDF' : 'Export to PDF'}
                >
                  <FileDown size={18} />
                </button>
                <button 
                  onClick={() => window.print()}
                  className="p-4 rounded-2xl bg-[#3d2b4f]/30 text-white/40 hover:text-cyan-400 hover:bg-cyan-400/10 hover:border-cyan-400/30 transition-all border border-transparent cursor-pointer flex items-center justify-center"
                  title={lang === 'ru' ? 'Печать статьи (Printer-friendly layout)' : 'Print Article (Printer-friendly layout)'}
                >
                  <Printer size={18} />
                </button>
                <button 
                  onClick={(e) => toggleFavorite(selectedPost.id, e)}
                  className={`p-4 rounded-2xl bg-[#3d2b4f]/30 transition-all border border-transparent cursor-pointer ${favorites.includes(selectedPost.id) ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' : 'text-white/40 hover:text-yellow-400 hover:border-yellow-400/30 hover:bg-yellow-400/10'}`}
                >
                  <Star size={18} fill={favorites.includes(selectedPost.id) ? "currentColor" : "none"} />
                </button>
              </div>
            </div>

            {selectedPost.mediaUrl && (
              <div className="mb-8">
                <MediaViewer url={selectedPost.mediaUrl} maxHeight="max-h-[550px]" title={selectedPost.title[lang] || 'Blog Media'} isCompact={false} />
              </div>
            )}

            {/* Interactive Table of Contents */}
            <ArticleTableOfContents
              htmlContent={selectedPost.content[lang] || selectedPost.content['en']}
              lang={lang}
            />

            <SafeHtml 
              html={selectedPost.content[lang] || selectedPost.content['en']}
              className="prose prose-invert prose-p:text-white/80 prose-headings:text-white prose-a:text-[#ff4d4d] max-w-none mb-8 text-base sm:text-lg leading-relaxed"
            />

            {/* Print-Only Footer Watermark */}
            <div className="hidden print-footer-watermark">
              <span>AHA Platform Blog Archives — Printed Document</span>
              <span>ID: {selectedPost.id}</span>
            </div>

            <div className="pt-10 border-t border-[#3d2b4f] print:hidden">
              <CommentsSection targetId={selectedPost.id} lang={lang} lowPerfMode={lowPerfMode} role={role} onOpenChat={onOpenChat} />
            </div>

            {/* Academic Citation Modal */}
            <ArticleCitationModal
              isOpen={showCiteModal}
              onClose={() => setShowCiteModal(false)}
              title={selectedPost.title[lang] || selectedPost.title['en']}
              htmlContent={selectedPost.content[lang] || selectedPost.content['en']}
              category={getLocalizedCategory(selectedPost.category, lang)}
              createdAt={selectedPost.createdAt}
              articleId={selectedPost.id}
              lang={lang}
            />
          </motion.div>
        ) : (
          <PullToRefresh
            onRefresh={handleManualRefresh}
            lang={lang}
            id="blog-pull-to-refresh"
          >
            <motion.div 
              key="blog-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-[#251c35] rounded-3xl p-6 sm:p-10 shadow-2xl border border-[#3d2b4f]"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
                <div>
                  <h2 className="text-4xl md:text-5xl lg:text-5xl font-black text-white tracking-tighter uppercase flex items-center gap-4 mb-2">
                    <Newspaper className="text-[#ff4d4d]" size={32} />
                    {t.navBlog}
                  </h2>
                  <p className="text-gray-300 font-medium tracking-wide text-xs">
                    {t.blogSubTitle}
                  </p>
                </div>
                {isModerator && (
                  <button 
                    onClick={onCreate}
                    className="flex items-center gap-3 bg-[#ff4d4d] text-[#15101e] px-6 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#ff4d4d]/20"
                  >
                    <Plus size={20} />
                    {t.createBlog}
                  </button>
                )}
              </div>
              
              <div className="flex flex-col lg:flex-row gap-6 mb-10">
                <div className="flex gap-2 p-1.5 bg-[#15101e]/50 rounded-2xl border border-[#3d2b4f] overflow-x-auto no-scrollbar ml-6">
                  {['all', 'updates', 'personal', 'favorites'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setBlogCategory(cat)}
                      className={`px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                        blogCategory === cat 
                          ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg shadow-[#ff4d4d]/20' 
                          : 'text-white/40 hover:text-white hover:bg-[#3d2b4f]/30'
                      }`}
                    >
                      {cat === 'all' ? t.filterAll : 
                       cat === 'updates' ? t.filterUpdates : 
                       cat === 'personal' ? t.filterPersonal : t.filterFavorites}
                    </button>
                  ))}
                </div>
                <div className="relative flex-1">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#ff4d4d]/50" size={22} />
                  <input 
                    type="text"
                    placeholder={t.searchPlaceholder}
                    value={blogSearch}
                    onChange={(e) => setBlogSearch(e.target.value)}
                    className="w-full bg-[#15101e]/50 border border-[#3d2b4f] rounded-2xl pl-14 pr-6 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-[#ff4d4d] focus:ring-4 focus:ring-[#ff4d4d]/10 transition-all"
                  />
                </div>
              </div>

              {loading ? (
                <BlogSkeletonGrid count={6} />
              ) : filteredBlog.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-24 text-white/40 bg-[#15101e]/30 rounded-3xl border-2 border-dashed border-[#3d2b4f]/50 flex flex-col items-center gap-4"
                >
                  <Sparkles size={48} className="text-[#3d2b4f]" />
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
          </PullToRefresh>
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
