import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Copy, Check, Quote, FileText, List, Eye, Clock, Hash, Share2, Sparkles, CheckCircle2 } from 'lucide-react';
import { Language } from '../../data/translations';
import { extractPlainText } from './MarkdownRenderer';

interface ArticleToolsProps {
  title: string;
  htmlContent: string;
  category?: string;
  createdAt?: string | number | Date;
  articleId: string;
  lang: Language;
  authorName?: string;
}

export const ArticleReadingMeta: React.FC<{ htmlContent: string; lang: Language }> = ({ htmlContent, lang }) => {
  const stats = useMemo(() => {
    // Extract clean plain text from either Markdown or HTML
    const text = extractPlainText(htmlContent);
    const charCount = text.length;
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    // Average reading speed: 180 words per minute for RU/EN
    const readingMinutes = Math.max(1, Math.ceil(wordCount / 180));

    return { charCount, wordCount, readingMinutes };
  }, [htmlContent]);

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-white/50 bg-[#1f172b]/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-[#3d2b4f]/60 print:hidden">
      <div className="flex items-center gap-1.5 font-semibold text-[#ff4d4d]">
        <Clock size={14} />
        <span>~{stats.readingMinutes} {lang === 'ru' ? 'мин чтения' : 'min read'}</span>
      </div>
      <span className="text-white/20">•</span>
      <div className="flex items-center gap-1.5">
        <BookOpen size={14} className="text-purple-400" />
        <span>{stats.wordCount.toLocaleString()} {lang === 'ru' ? 'слов' : 'words'}</span>
      </div>
      <span className="text-white/20">•</span>
      <div className="flex items-center gap-1.5">
        <Hash size={14} className="text-cyan-400" />
        <span>{stats.charCount.toLocaleString()} {lang === 'ru' ? 'символов' : 'chars'}</span>
      </div>
    </div>
  );
};

export const ArticleCitationModal: React.FC<ArticleToolsProps & { isOpen: boolean; onClose: () => void }> = ({
  title,
  htmlContent,
  category = 'General',
  createdAt,
  articleId,
  lang,
  authorName,
  isOpen,
  onClose,
}) => {
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'gost' | 'apa' | 'bibtex' | 'mla'>('gost');

  if (!isOpen) return null;

  const currentYear = new Date(createdAt || Date.now()).getFullYear();
  const pubDate = new Date(createdAt || Date.now()).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://aha-platform.app';
  const author = authorName || (lang === 'ru' ? 'Исследовательский отдел AHA' : 'AHA Research Department');

  const citations = {
    gost: `${author}. ${title} // Официальный архив «Министерство Ахахи» [Электронный ресурс]. — ${currentYear}. — URL: ${currentUrl} (дата обращения: ${new Date().toLocaleDateString('ru-RU')}).`,
    apa: `${author}. (${currentYear}). ${title}. Ministry of AHA Platform. ${currentUrl}`,
    bibtex: `@article{aha_${articleId.replace(/[^a-zA-Z0-0]/g, '_')}_${currentYear},\n  author = {${author}},\n  title = {${title}},\n  journal = {Ministry of AHA Platform Archives},\n  year = {${currentYear}},\n  url = {${currentUrl}},\n  note = {Accessed: ${new Date().toISOString().slice(0, 10)}}\n}`,
    mla: `"${title}." AHA Platform, ${pubDate}, ${currentUrl}. Accessed ${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}.`,
  };

  const copyCitation = (formatKey: keyof typeof citations) => {
    const textToCopy = citations[formatKey];
    navigator.clipboard.writeText(textToCopy);
    setCopiedFormat(formatKey);
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn print:hidden">
      <div className="bg-[#1f172b] border border-[#3d2b4f] rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#3d2b4f] pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#ff4d4d]/20 text-[#ff4d4d]">
              <Quote size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">
                {lang === 'ru' ? 'Академическое цитирование' : 'Academic Citation Generator'}
              </h3>
              <p className="text-xs text-white/50">
                {lang === 'ru' ? 'Выберите формат для научных работ и публикаций' : 'Select standard reference format for research'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Format Selector Tabs */}
        <div className="flex gap-2 p-1 bg-[#15101e] rounded-2xl border border-[#3d2b4f] mb-6 overflow-x-auto">
          {[
            { id: 'gost', name: 'ГОСТ Р 7.0.5' },
            { id: 'apa', name: 'APA 7th' },
            { id: 'bibtex', name: 'BibTeX' },
            { id: 'mla', name: 'MLA 9th' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg shadow-[#ff4d4d]/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Citation Display Card */}
        <div className="bg-[#15101e] border border-[#3d2b4f] rounded-2xl p-4 sm:p-5 mb-6 relative group">
          <pre className="text-xs sm:text-sm text-cyan-200 font-mono whitespace-pre-wrap break-all leading-relaxed">
            {citations[activeTab]}
          </pre>
          
          <button
            onClick={() => copyCitation(activeTab)}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#ff4d4d]/10 hover:bg-[#ff4d4d] text-[#ff4d4d] hover:text-[#15101e] border border-[#ff4d4d]/30 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            {copiedFormat === activeTab ? (
              <>
                <CheckCircle2 size={16} className="text-green-400 group-hover:text-[#15101e]" />
                <span>{lang === 'ru' ? 'Скопировано в буфер обмена!' : 'Copied to Clipboard!'}</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>{lang === 'ru' ? 'Скопировать цитату' : 'Copy Reference Citation'}</span>
              </>
            )}
          </button>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 font-bold text-xs cursor-pointer transition-all"
          >
            {lang === 'ru' ? 'Закрыть' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ArticleTableOfContents: React.FC<{ htmlContent: string; lang: Language }> = ({ htmlContent, lang }) => {
  const headings = useMemo(() => {
    if (!htmlContent) return [];
    
    const items: { level: number; text: string; id: string }[] = [];

    // 1. Extract HTML headers <h1-3>
    const htmlRegex = /<h([1-3])\b[^>]*>(.*?)<\/h\1>/gi;
    let match;
    while ((match = htmlRegex.exec(htmlContent)) !== null) {
      const level = parseInt(match[1], 10);
      const rawText = match[2].replace(/<[^>]*>/g, '').trim();
      if (rawText) {
        const id = 'heading-' + rawText.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, '-').replace(/^-|-$/g, '');
        items.push({ level, text: rawText, id });
      }
    }

    // 2. If no HTML headers found, extract Markdown headers (#, ##, ###)
    if (items.length === 0) {
      const mdRegex = /^(#{1,3})\s+(.+)$/gm;
      let mdMatch;
      while ((mdMatch = mdRegex.exec(htmlContent)) !== null) {
        const level = mdMatch[1].length;
        const rawText = mdMatch[2].replace(/[*_~`]/g, '').trim();
        if (rawText) {
          const id = 'heading-' + rawText.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, '-').replace(/^-|-$/g, '');
          items.push({ level, text: rawText, id });
        }
      }
    }

    return items;
  }, [htmlContent]);

  if (headings.length < 2) return null;

  return (
    <div className="bg-[#15101e]/90 border border-[#3d2b4f] rounded-2xl p-4 sm:p-5 my-6 print:hidden">
      <div className="flex items-center gap-2 mb-3 text-xs font-black uppercase tracking-widest text-[#ff4d4d]">
        <List size={16} />
        <span>{lang === 'ru' ? 'Содержание статьи' : 'Table of Contents'}</span>
      </div>
      <nav className="space-y-1.5">
        {headings.map((h, i) => (
          <a
            key={i}
            href={`#${h.id}`}
            onClick={(e) => {
              e.preventDefault();
              // Scroll to heading by ID or matching text
              const elById = document.getElementById(h.id);
              if (elById) {
                elById.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
              }
              const el = Array.from(document.querySelectorAll('h1, h2, h3')).find(
                node => node.textContent?.trim() === h.text
              );
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }}
            className={`block text-xs transition-colors hover:text-[#ff4d4d] text-white/70 ${
              h.level === 1 ? 'font-bold text-white' : h.level === 2 ? 'pl-3' : 'pl-6 text-white/50'
            }`}
          >
            {h.level === 1 ? '• ' : h.level === 2 ? '› ' : '» '} {h.text}
          </a>
        ))}
      </nav>
    </div>
  );
};

