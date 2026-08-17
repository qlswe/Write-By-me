import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { X, Save, Video, Camera, Link as LinkIcon, Plus, Trash2 } from 'lucide-react';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { translations, Language } from '../../data/translations';
import { vercelFallback } from '../../utils/vercelFallback';
import { generatePrefixedId } from '../../utils/idGenerator';
import { MediaViewer, isVideoMedia, getYouTubeEmbedUrl } from '../ui/MediaViewer';
import { uploadMediaFile, sanitizePayloadForFirestore } from '../../utils/mediaUploader';
import { CustomSelect } from '../ui/CustomSelect';
import { MarkdownEditorToolbar } from '../ui/MarkdownEditorToolbar';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';

interface BlogEditorProps {
  post?: any;
  onClose: () => void;
  lang: Language;
}

const LANGUAGES = ['ru', 'en', 'by', 'de', 'fr', 'zh'];

export const BlogEditor: React.FC<BlogEditorProps> = ({ post, onClose, lang }) => {
  const { user } = useAuth();
  const t = translations[lang];
  const [currentLang, setCurrentLang] = useState(lang);
  const [category, setCategory] = useState(post?.category || 'updates');
  const [mediaUrl, setMediaUrl] = useState<string>(post?.mediaUrl || '');
  const [mediaUrlInput, setMediaUrlInput] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [title, setTitle] = useState<Record<string, string>>(
    typeof post?.title === 'object' ? post.title : LANGUAGES.reduce((acc, l) => ({ ...acc, [l]: post?.title || '' }), {})
  );
  const [summary, setSummary] = useState<Record<string, string>>(
    typeof post?.summary === 'object' ? post.summary : LANGUAGES.reduce((acc, l) => ({ ...acc, [l]: post?.summary || '' }), {})
  );
  const [content, setContent] = useState<Record<string, string>>(
    typeof post?.content === 'object' ? post.content : LANGUAGES.reduce((acc, l) => ({ ...acc, [l]: post?.content || '' }), {})
  );

  // Undo / Redo history stacks per language
  const [historyPast, setHistoryPast] = useState<Record<string, string[]>>({});
  const [historyFuture, setHistoryFuture] = useState<Record<string, string[]>>({});

  const handleContentChange = useCallback((newText: string, recordHistory: boolean = true) => {
    const prevText = content[currentLang] || '';
    if (newText === prevText) return;

    if (recordHistory) {
      setHistoryPast(prev => ({
        ...prev,
        [currentLang]: [...(prev[currentLang] || []), prevText].slice(-50)
      }));
      setHistoryFuture(prev => ({
        ...prev,
        [currentLang]: []
      }));
    }

    setContent(prev => ({
      ...prev,
      [currentLang]: newText
    }));
  }, [content, currentLang]);

  const handleUndo = useCallback(() => {
    const past = historyPast[currentLang] || [];
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    const current = content[currentLang] || '';

    setHistoryPast(prev => ({ ...prev, [currentLang]: newPast }));
    setHistoryFuture(prev => ({ ...prev, [currentLang]: [current, ...(prev[currentLang] || [])] }));
    setContent(prev => ({ ...prev, [currentLang]: previous }));
  }, [historyPast, content, currentLang]);

  const handleRedo = useCallback(() => {
    const future = historyFuture[currentLang] || [];
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);
    const current = content[currentLang] || '';

    setHistoryPast(prev => ({ ...prev, [currentLang]: [...(prev[currentLang] || []), current] }));
    setHistoryFuture(prev => ({ ...prev, [currentLang]: newFuture }));
    setContent(prev => ({ ...prev, [currentLang]: next }));
  }, [historyFuture, content, currentLang]);

  const canUndo = (historyPast[currentLang] || []).length > 0;
  const canRedo = (historyFuture[currentLang] || []).length > 0;
  
  const [isSaving, setIsSaving] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      alert(lang === 'ru' ? 'Размер файла превышает 50 МБ' : 'File size exceeds 50MB');
      return;
    }
    setIsUploading(true);
    try {
      const uploadedUrl = await uploadMediaFile(file);
      setMediaUrl(uploadedUrl);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error uploading file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleApplyUrl = () => {
    if (!mediaUrlInput.trim()) return;
    setMediaUrl(mediaUrlInput.trim());
    setMediaUrlInput('');
    setShowUrlInput(false);
  };

  const handleInsertMediaTagToContent = () => {
    if (!mediaUrl) return;
    const yt = getYouTubeEmbedUrl(mediaUrl);
    let tag = '';
    if (yt) {
      tag = `\n<div className="my-4 aspect-video"><iframe src="${yt}" className="w-full h-full rounded-2xl" allowFullScreen></iframe></div>\n`;
    } else if (isVideoMedia(mediaUrl)) {
      tag = `\n<video src="${mediaUrl}" controls className="w-full max-h-[500px] rounded-2xl my-4 bg-black"></video>\n`;
    } else {
      tag = `\n<img src="${mediaUrl}" alt="Blog Image" className="w-full max-h-[500px] object-cover rounded-2xl my-4" />\n`;
    }

    setContent(prev => ({
      ...prev,
      [currentLang]: (prev[currentLang] || '') + tag
    }));
  };

  const handleSave = async () => {
    if (!title[currentLang] || !summary[currentLang] || !content[currentLang]) {
      alert(`${t.fillAllFields}${currentLang}`);
      return;
    }

    setIsSaving(true);
    try {
      const rawPostData = {
        category,
        title,
        summary,
        content,
        mediaUrl,
        authorUid: user?.uid,
        updatedAt: new Date().toISOString()
      };

      const postData = await sanitizePayloadForFirestore(rawPostData);

      let createdDocId = '';
      if (post?.id) {
        await setDoc(doc(db, 'blogPosts', post.id), {
          ...postData,
          createdAt: post.createdAt || new Date().toISOString()
        });
      } else {
        const newDoc = await addDoc(collection(db, 'blogPosts'), {
          ...postData,
          createdAt: new Date().toISOString()
        });
        createdDocId = newDoc.id;
      }

      if (vercelFallback.isAvailable()) {
        try {
          const uid = post?.id || createdDocId || generatePrefixedId('blog') + '_' + user?.uid;
          const payload = {
            ...postData,
            id: uid,
            createdAt: post?.createdAt || new Date().toISOString()
          };
          await vercelFallback.lpush('blogPosts', JSON.stringify(payload));
        } catch (e) {}
      }
      onClose();
    } catch (error) {
      handleFirestoreError(error, post?.id ? OperationType.UPDATE : OperationType.CREATE, 'blogPosts');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-[#15101e] rounded-[1.5rem] sm:rounded-[3rem] w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden border border-[#3d2b4f]/30 shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col"
      >
        {/* Header */}
        <div className="bg-[#251c35]/50 p-4 sm:p-8 border-b border-[#3d2b4f]/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
          <div className="flex items-center justify-between w-full sm:w-auto gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#ff4d4d]/10 flex items-center justify-center border border-[#ff4d4d]/20">
                <Save className="text-[#ff4d4d] w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tighter italic leading-none">
                  {post ? t.editPost : t.createPost}
                </h2>
                <p className="text-[8px] sm:text-xs text-white/40 font-bold uppercase tracking-widest mt-1">{t.blogProtocol}</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="sm:hidden w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all active:scale-90 shrink-0"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <div className="flex bg-[#1A1528] rounded-lg sm:rounded-xl p-0.5 sm:p-1 border border-[#3d2b4f]/30 overflow-x-auto no-scrollbar flex-1 sm:flex-none">
              {LANGUAGES.map(l => (
                <button
                  key={l}
                  onClick={() => setCurrentLang(l as Language)}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all shrink-0 flex-1 sm:flex-none ${
                    currentLang === l ? 'bg-[#ff4d4d] text-[#15101e]' : 'text-white/40 hover:text-white'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            <button 
              onClick={onClose} 
              className="hidden sm:flex w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 items-center justify-center text-white/60 hover:text-white transition-all active:scale-90 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-4">{t.categoryLabel}</label>
              <CustomSelect 
                value={category}
                onChange={setCategory}
                options={[
                  { value: 'updates', label: t.filterUpdates },
                  { value: 'personal', label: t.filterPersonal }
                ]}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-4">
                {t.titleLabel} <span className="text-[#ff4d4d]">[{currentLang.toUpperCase()}]</span>
              </label>
              <input 
                type="text"
                value={title[currentLang] || ''}
                onChange={(e) => setTitle(prev => ({ ...prev, [currentLang]: e.target.value }))}
                className="w-full bg-[#1A1528]/50 border border-[#3d2b4f]/30 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-[#ff4d4d] transition-all placeholder:text-white/40"
                placeholder={t.placeholderTitle}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-4">
              {t.summaryLabel} <span className="text-[#ff4d4d]">[{currentLang.toUpperCase()}]</span>
            </label>
            <textarea 
              value={summary[currentLang] || ''}
              onChange={(e) => setSummary(prev => ({ ...prev, [currentLang]: e.target.value }))}
              className="w-full bg-[#1A1528]/50 border border-[#3d2b4f]/30 rounded-3xl px-6 py-4 text-white font-medium focus:outline-none focus:border-[#ff4d4d] transition-all min-h-[100px] resize-none placeholder:text-white/40"
              placeholder={t.placeholderSummary}
            />
          </div>

          {/* Media Attachment Section (Photo or Long Video) */}
          <div className="bg-[#1A1528]/80 border border-[#3d2b4f]/40 rounded-3xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Video className="text-[#ff4d4d]" size={16} />
                {lang === 'ru' ? 'Медиа-файлы (Видео / Фото)' : 'Media Attachment (Video / Photo)'}
              </span>
              
              <div className="flex flex-wrap gap-2">
                <input
                  type="file"
                  id="blog-media-file"
                  className="hidden"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <label
                  htmlFor="blog-media-file"
                  className={`bg-[#251c35] border border-[#3d2b4f]/60 hover:border-[#ff4d4d]/50 text-white hover:text-[#ff4d4d] px-4 py-2 rounded-xl text-xs font-black cursor-pointer flex items-center gap-2 transition-all ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <Camera size={14} />
                  {lang === 'ru' ? 'Загрузить видео/фото' : 'Upload Video/Photo'}
                </label>

                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="bg-[#251c35] border border-[#3d2b4f]/60 hover:border-[#ff4d4d]/50 text-white hover:text-[#ff4d4d] px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all"
                >
                  <LinkIcon size={14} />
                  {lang === 'ru' ? 'Ссылка (YouTube/MP4)' : 'Video/Photo URL'}
                </button>

                {mediaUrl && (
                  <button
                    type="button"
                    onClick={handleInsertMediaTagToContent}
                    className="bg-[#ff4d4d]/20 border border-[#ff4d4d]/40 text-[#ff4d4d] hover:bg-[#ff4d4d] hover:text-[#15101e] px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all"
                  >
                    <Plus size={14} />
                    {lang === 'ru' ? 'Вставить в текст' : 'Insert into Text'}
                  </button>
                )}
              </div>
            </div>

            {showUrlInput && (
              <div className="flex gap-2">
                <input
                  type="url"
                  value={mediaUrlInput}
                  onChange={(e) => setMediaUrlInput(e.target.value)}
                  placeholder={lang === 'ru' ? 'Вставьте ссылку на YouTube, MP4 или Фото' : 'Paste YouTube, MP4 or Photo URL'}
                  className="flex-1 bg-[#0d0b14] border border-[#3d2b4f]/60 rounded-xl px-4 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#ff4d4d]"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="bg-[#ff4d4d] text-[#15101e] font-black text-xs px-4 py-2 rounded-xl hover:bg-white transition-all"
                >
                  ОК
                </button>
              </div>
            )}

            {mediaUrl && (
              <div className="relative group max-w-xl mx-auto">
                <MediaViewer url={mediaUrl} maxHeight="max-h-[300px]" />
                <button
                  type="button"
                  onClick={() => setMediaUrl('')}
                  className="absolute top-3 right-3 bg-red-600 text-white rounded-full p-2 shadow-xl hover:bg-red-700 transition-all z-10"
                  title="Удалить медиа"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between ml-4">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                {t.contentLabel} <span className="text-[#ff4d4d]">[{currentLang.toUpperCase()}]</span>
              </label>
              <span className="text-[10px] text-white/40 font-mono">
                {lang === 'ru' ? 'Поддерживается Markdown и HTML' : 'Markdown & HTML supported'}
              </span>
            </div>

            {/* Markdown Toolbar */}
            <MarkdownEditorToolbar
              textareaRef={textareaRef}
              content={content[currentLang] || ''}
              onChange={handleContentChange}
              viewMode={viewMode}
              setViewMode={setViewMode}
              lang={lang}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={canUndo}
              canRedo={canRedo}
            />

            {/* Content Editor / Preview / Split */}
            <div className="relative">
              {viewMode === 'edit' && (
                <textarea 
                  ref={textareaRef}
                  value={content[currentLang] || ''}
                  onChange={(e) => handleContentChange(e.target.value)}
                  className="w-full bg-[#1A1528]/50 border border-[#3d2b4f]/30 rounded-3xl px-6 py-6 text-white font-mono text-sm leading-relaxed focus:outline-none focus:border-[#ff4d4d] transition-all min-h-[350px] placeholder:text-white/40 custom-scrollbar"
                  placeholder={t.placeholderContent || '# Заголовок\n\n**Жирный текст** и *курсив*.\n\n- Пункт 1\n- Пункт 2'}
                />
              )}

              {viewMode === 'preview' && (
                <div className="w-full bg-[#120c1b] border border-[#3d2b4f]/50 rounded-3xl p-6 min-h-[350px] max-h-[500px] overflow-y-auto custom-scrollbar">
                  {content[currentLang] ? (
                    <MarkdownRenderer content={content[currentLang]} />
                  ) : (
                    <p className="text-white/30 text-center py-16 italic text-sm">
                      {lang === 'ru' ? 'Здесь появится оформленный текст...' : 'Formatted preview will appear here...'}
                    </p>
                  )}
                </div>
              )}

              {viewMode === 'split' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <textarea 
                    ref={textareaRef}
                    value={content[currentLang] || ''}
                    onChange={(e) => handleContentChange(e.target.value)}
                    className="w-full bg-[#1A1528]/50 border border-[#3d2b4f]/30 rounded-3xl px-5 py-5 text-white font-mono text-xs sm:text-sm leading-relaxed focus:outline-none focus:border-[#ff4d4d] transition-all min-h-[350px] placeholder:text-white/40 custom-scrollbar"
                    placeholder={t.placeholderContent}
                  />
                  <div className="w-full bg-[#120c1b] border border-[#3d2b4f]/50 rounded-3xl p-5 min-h-[350px] max-h-[500px] overflow-y-auto custom-scrollbar">
                    {content[currentLang] ? (
                      <MarkdownRenderer content={content[currentLang]} />
                    ) : (
                      <p className="text-white/30 text-center py-16 italic text-xs">
                        {lang === 'ru' ? 'Здесь появится оформленный текст...' : 'Formatted preview will appear here...'}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-8 bg-[#251c35]/50 border-t border-[#3d2b4f]/30 flex flex-col sm:flex-row justify-end items-center gap-4 sm:gap-6 shrink-0">
          <button 
            onClick={onClose}
            className="w-full sm:w-auto text-[10px] sm:text-xs font-black text-white/60 hover:text-white uppercase tracking-[0.2em] transition-colors py-2"
          >
            {t.cancel}
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto flex items-center justify-center gap-2 sm:gap-3 bg-[#ff4d4d] text-[#15101e] px-6 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs hover:bg-white hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-[0_0_30px_rgba(255,77,77,0.3)]"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-[#15101e] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={20} />
            )}
            {isSaving ? t.saving : t.saveBtn}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
