import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RefreshCw, Sparkles, Clock, CheckCircle2, Share2, Copy, Check, Eye } from 'lucide-react';
import { usePerfLogger } from '../../utils/logger';
import { Language, translations } from '../../data/translations';
import { SafeHtml } from '../security/AhaSecurity';
import { ModalPortal } from './ModalPortal';
import { useContent, parseContentVersion, parseContentTimestamp } from '../../hooks/useContent';
import { TimeAgo } from './TimeAgo';
import { calculateReadTime } from '../../utils/time';
import { getLocalizedCategory } from '../../utils/categories';

export interface ContentModalPayload {
  id?: string;
  type?: 'theory' | 'blog' | 'event' | 'generic';
  title: string | Record<string, string>;
  content: string | Record<string, string>;
  summary?: string | Record<string, string>;
  category?: string;
  updatedAt?: string | number;
  createdAt?: string | number;
  version?: number;
  author?: string;
  mediaUrl?: string;
}

interface ContentModalProps {
  modalContent: ContentModalPayload | null;
  setModalContent: (content: ContentModalPayload | null) => void;
  lang: Language;
}

export const ContentModal: React.FC<ContentModalProps> = ({ modalContent, setModalContent, lang }) => {
  const { trackRender } = usePerfLogger('ContentModal');
  trackRender();

  const t = translations[lang];
  const { theories, blogPosts, events, fetchLatestDoc, refreshContent } = useContent();

  const [liveContent, setLiveContent] = useState<ContentModalPayload | null>(modalContent);
  const [isCheckingFreshness, setIsCheckingFreshness] = useState(false);
  const [versionUpdatedToast, setVersionUpdatedToast] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync initial modal content on open
  useEffect(() => {
    setLiveContent(modalContent);
    setVersionUpdatedToast(false);
  }, [modalContent]);

  const docId = liveContent?.id;
  const docType = liveContent?.type || 'theory';

  // Extract localized strings safely
  const localizedTitle = useMemo(() => {
    if (!liveContent) return '';
    if (typeof liveContent.title === 'string') return liveContent.title;
    return liveContent.title[lang] || liveContent.title.ru || liveContent.title.en || '';
  }, [liveContent, lang]);

  const localizedContent = useMemo(() => {
    if (!liveContent) return '';
    if (typeof liveContent.content === 'string') return liveContent.content;
    return liveContent.content[lang] || liveContent.content.ru || liveContent.content.en || '';
  }, [liveContent, lang]);

  const localizedSummary = useMemo(() => {
    if (!liveContent || !liveContent.summary) return '';
    if (typeof liveContent.summary === 'string') return liveContent.summary;
    return liveContent.summary[lang] || liveContent.summary.ru || liveContent.summary.en || '';
  }, [liveContent, lang]);

  const currentVersion = useMemo(() => {
    return parseContentVersion(liveContent);
  }, [liveContent]);

  const currentUpdatedAt = useMemo(() => {
    return liveContent?.updatedAt || liveContent?.createdAt || null;
  }, [liveContent]);

  const readTime = useMemo(() => {
    return calculateReadTime(localizedContent, localizedSummary, lang);
  }, [localizedContent, localizedSummary, lang]);

  // 1. Reactive Store Synchronization:
  // If the item in `theories` or `blogPosts` updates while modal is open, auto-update modal content
  useEffect(() => {
    if (!docId) return;

    let storeItem: any = null;
    if (docType === 'theory' || docType === 'generic') {
      storeItem = theories.find(t => t.id === docId);
    }
    if (!storeItem && (docType === 'blog' || docType === 'generic')) {
      storeItem = blogPosts.find(b => b.id === docId);
    }
    if (!storeItem && docType === 'event') {
      storeItem = events.find(e => e.id === docId);
    }

    if (storeItem) {
      const storeVer = parseContentVersion(storeItem);
      const curVer = parseContentVersion(liveContent);
      const storeTime = parseContentTimestamp(storeItem.updatedAt || storeItem.createdAt);
      const curTime = parseContentTimestamp(liveContent?.updatedAt || liveContent?.createdAt);

      if (storeVer > curVer || storeTime > curTime) {
        setLiveContent(prev => ({
          ...prev,
          ...storeItem,
          version: Math.max(storeVer, curVer),
          updatedAt: storeItem.updatedAt || prev?.updatedAt
        }));
        setVersionUpdatedToast(true);
        setTimeout(() => setVersionUpdatedToast(false), 4000);
      }
    }
  }, [theories, blogPosts, events, docId, docType, liveContent]);

  // 2. Automated Server Cache-Busting Verification on Modal Mount
  const performCacheBustCheck = useCallback(async (isManual = false) => {
    if (!docId) return;

    setIsCheckingFreshness(true);
    try {
      let colName: 'theories' | 'blogPosts' | 'events' = 'theories';
      if (docType === 'blog') colName = 'blogPosts';
      else if (docType === 'event') colName = 'events';

      const freshDoc = await fetchLatestDoc(colName, docId);
      if (freshDoc) {
        const freshVer = parseContentVersion(freshDoc);
        const curVer = parseContentVersion(liveContent);
        const freshTime = parseContentTimestamp(freshDoc.updatedAt || freshDoc.createdAt);
        const curTime = parseContentTimestamp(liveContent?.updatedAt || liveContent?.createdAt);

        if (freshVer > curVer || freshTime > curTime || isManual) {
          setLiveContent(prev => ({
            ...prev,
            ...freshDoc,
            version: Math.max(freshVer, curVer),
            updatedAt: freshDoc.updatedAt || prev?.updatedAt
          }));
          setVersionUpdatedToast(true);
          setTimeout(() => setVersionUpdatedToast(false), 4000);
        }
      }
    } catch (e) {
      console.warn('[ContentModal] Cache bust check failed:', e);
    } finally {
      setIsCheckingFreshness(false);
    }
  }, [docId, docType, fetchLatestDoc, liveContent]);

  useEffect(() => {
    if (modalContent?.id) {
      performCacheBustCheck(false);
    }
  }, [modalContent?.id]);

  const handleShare = () => {
    if (!liveContent) return;
    const url = `${window.location.origin}${window.location.pathname}?${docType === 'blog' ? 'post' : 'theory'}=${docId || ''}`;
    if (navigator.share) {
      navigator.share({
        title: localizedTitle,
        text: localizedSummary,
        url: url,
      }).catch(() => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!modalContent || !liveContent) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setModalContent(null)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 26, stiffness: 260 }}
          className="relative bg-[#1a1226] w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col border border-[#3d2b4f]/60 z-10"
        >
          {/* Header */}
          <div className="p-5 sm:p-7 border-b border-[#3d2b4f]/60 flex flex-col gap-3 bg-[#15101e]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0 space-y-2">
                {/* Meta Badges & Versioning Indicators */}
                <div className="flex items-center gap-2 flex-wrap">
                  {liveContent.category && (
                    <span className="px-3 py-1 rounded-full bg-[#ff4d4d]/10 text-[#ff4d4d] text-[10px] font-black uppercase tracking-widest border border-[#ff4d4d]/20">
                      {getLocalizedCategory(liveContent.category, lang)}
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-md bg-purple-500/10 text-purple-300 text-[10px] font-black tracking-wider border border-purple-500/20">
                    v{currentVersion}
                  </span>
                  <div className="flex items-center gap-1.5 text-white/50 text-[11px] font-bold">
                    <Clock size={12} className="text-[#ff4d4d]" />
                    <span>{readTime} {t.minRead || (lang === 'ru' ? 'мин чтения' : 'min read')}</span>
                  </div>
                  {currentUpdatedAt && (
                    <div className="flex items-center gap-1 text-white/40 text-[11px]">
                      <span>•</span>
                      <TimeAgo date={currentUpdatedAt} lang={lang} />
                    </div>
                  )}
                </div>

                <h3 className="text-xl sm:text-3xl font-black text-white leading-tight tracking-tight pr-4">
                  {localizedTitle}
                </h3>
              </div>

              {/* Actions & Close Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Force Cache-Busting Refresh Button */}
                <button 
                  onClick={() => performCacheBustCheck(true)}
                  disabled={isCheckingFreshness}
                  title={lang === 'ru' ? 'Проверить обновления статьи (Сброс кэша)' : 'Check article updates (Bust Cache)'}
                  className="p-2.5 hover:bg-[#251c35] text-white/60 hover:text-white rounded-xl transition-all border border-white/5 hover:border-white/20 active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw size={16} className={isCheckingFreshness ? 'animate-spin text-[#ff4d4d]' : ''} />
                  <span className="hidden sm:inline text-[10px] font-black uppercase tracking-wider">
                    {isCheckingFreshness ? (lang === 'ru' ? 'Проверка...' : 'Checking...') : (lang === 'ru' ? 'Свежая версия' : 'Bust Cache')}
                  </span>
                </button>

                <button 
                  onClick={handleShare}
                  className="p-2.5 hover:bg-[#251c35] text-white/60 hover:text-white rounded-xl transition-all border border-white/5 hover:border-white/20 active:scale-95 cursor-pointer"
                  title="Share"
                >
                  {copied ? <Check size={18} className="text-emerald-400" /> : <Share2 size={18} />}
                </button>

                <button 
                  onClick={() => setModalContent(null)}
                  className="p-2.5 hover:bg-[#ff4d4d]/20 text-white/60 hover:text-[#ff4d4d] rounded-xl transition-colors shrink-0 cursor-pointer"
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Live Auto-Update Cache Notification Pill */}
            <AnimatePresence>
              {versionUpdatedToast && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between gap-2 overflow-hidden"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-emerald-400 animate-spin" />
                    <span>
                      {lang === 'ru' 
                        ? `Контент обновлён до актуальной версии v${currentVersion} без перезагрузки!`
                        : `Content auto-synced to latest version v${currentVersion} without refresh!`}
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-200 font-mono">
                    LIVE SYNC
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Content Body */}
          <div className="p-6 sm:p-8 overflow-y-auto flex-1 custom-scrollbar space-y-6">
            {localizedSummary && (
              <div className="p-4 rounded-2xl bg-[#251c35]/50 border border-[#3d2b4f]/40 text-white/80 font-medium text-sm sm:text-base leading-relaxed italic">
                {localizedSummary}
              </div>
            )}

            <div className="prose prose-invert prose-p:text-white/80 prose-headings:text-white prose-a:text-[#ff4d4d] max-w-none text-sm sm:text-base leading-relaxed">
              <SafeHtml 
                html={localizedContent}
                className="content-modal-body article-mobile-scrollbar"
              />
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="p-4 border-t border-[#3d2b4f]/40 bg-[#15101e] flex flex-wrap items-center justify-between gap-3 text-xs text-white/40">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span>{lang === 'ru' ? 'Проверено AHA Versioning Engine' : 'Verified by AHA Versioning Engine'}</span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span>ID: {docId || 'local'}</span>
              <span>•</span>
              <span>REV: {currentVersion}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </ModalPortal>
  );
};
