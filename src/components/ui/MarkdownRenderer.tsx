import React, { useState, useEffect, useRef, useMemo, createContext, useContext, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Copy, Check, ExternalLink, X, Maximize2, Hash, SlidersHorizontal, ChevronLeft, ChevronRight, WrapText } from 'lucide-react';
import { sanitizeContent } from '../../utils/sanitizer';
import { KuruVideoPlayer } from './KuruVideoPlayer';
import { LazyImage } from './LazyImage';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  allowHtml?: boolean;
}

const PreContext = createContext<boolean>(false);

/**
 * Utility to extract clean plain text from Markdown or HTML content
 */
export const extractPlainText = (raw: string): string => {
  if (!raw) return '';
  return raw
    // Remove markdown code blocks
    .replace(/```[\s\S]*?```/g, ' ')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove images
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    // Remove headers (# Heading)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove blockquotes (> Quote)
    .replace(/^\s*>\s+/gm, '')
    // Remove bold/italic markers
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Remove strikethrough
    .replace(/~~(.*?)~~/g, '$1')
    // Remove HTML tags
    .replace(/<[^>]*>/g, ' ')
    // Collapse multiple whitespaces
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Code Block subcomponent for block-level code with syntax styling, copy functionality,
 * and mobile-friendly horizontal scroll slider bar
 */
const CodeBlockWrapper: React.FC<{
  children?: React.ReactNode;
  [key: string]: any;
}> = ({ children, ...props }) => {
  const [copied, setCopied] = useState(false);
  const [canScroll, setCanScroll] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);
  const [isWordWrap, setIsWordWrap] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  let language = '';
  let textContent = '';

  const extractCodeInfo = (node: any) => {
    if (!node) return;
    if (React.isValidElement(node)) {
      const p = node.props as any;
      if (p?.className) {
        const match = /language-(\w+)/.exec(p.className);
        if (match) language = match[1];
      }
      if (p?.children) {
        extractCodeInfo(p.children);
      }
    } else if (Array.isArray(node)) {
      node.forEach(extractCodeInfo);
    } else if (typeof node === 'string') {
      textContent += node;
    } else if (typeof node === 'number') {
      textContent += String(node);
    }
  };

  extractCodeInfo(children);

  const cleanText = textContent.replace(/\n$/, '');

  const checkScrollability = useCallback(() => {
    const el = preRef.current;
    if (!el) return;
    const scrollable = el.scrollWidth > el.clientWidth + 4;
    setCanScroll(scrollable);
    if (scrollable) {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll > 0) {
        setScrollPercent(Math.min(100, Math.max(0, (el.scrollLeft / maxScroll) * 100)));
      }
    } else {
      setScrollPercent(0);
    }
  }, []);

  useEffect(() => {
    checkScrollability();

    const el = preRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      checkScrollability();
    });
    ro.observe(el);

    return () => ro.disconnect();
  }, [children, isWordWrap, checkScrollability]);

  const handlePreScroll = () => {
    const el = preRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll > 0) {
      setScrollPercent(Math.min(100, Math.max(0, (el.scrollLeft / maxScroll) * 100)));
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setScrollPercent(val);
    const el = preRef.current;
    if (el) {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll > 0) {
        el.scrollLeft = (val / 100) * maxScroll;
      }
    }
  };

  const handleScrollStep = (dir: 'left' | 'right') => {
    const el = preRef.current;
    if (!el) return;
    const step = Math.max(120, Math.round(el.clientWidth * 0.45));
    el.scrollBy({ left: dir === 'left' ? -step : step, behavior: 'smooth' });
  };

  const handleCopy = () => {
    if (cleanText) {
      navigator.clipboard.writeText(cleanText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative my-5 rounded-2xl overflow-hidden bg-[#120c1b] border border-[#3d2b4f] shadow-2xl group not-prose">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-[#1b1227] border-b border-[#3d2b4f]/60 select-none">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          {language && (
            <span className="ml-2 text-[10px] font-mono font-bold uppercase tracking-wider text-white/60">
              {language}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {/* Toggle word wrap */}
          <button
            type="button"
            onClick={() => setIsWordWrap(prev => !prev)}
            className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border transition-all cursor-pointer ${
              isWordWrap 
                ? 'bg-[#ff4d4d]/20 text-[#ff4d4d] border-[#ff4d4d]/40 shadow-sm' 
                : 'bg-[#3d2b4f]/40 hover:bg-[#3d2b4f]/70 text-white/70 border-transparent'
            }`}
            title={isWordWrap ? "Выключить перенос строк" : "Включить перенос строк"}
          >
            <WrapText size={12} className="shrink-0" />
            <span className="hidden sm:inline">{isWordWrap ? "Wrap on" : "Wrap"}</span>
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-[#3d2b4f]/40 hover:bg-[#ff4d4d] text-white/80 hover:text-[#15101e] transition-all cursor-pointer"
            title="Скопировать код"
          >
            {copied ? (
              <>
                <Check size={12} className="text-green-400 group-hover:text-[#15101e]" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Body */}
      <PreContext.Provider value={true}>
        <pre 
          ref={preRef}
          onScroll={handlePreScroll}
          className={`p-4 sm:p-5 text-xs sm:text-sm font-mono leading-relaxed text-cyan-200 custom-scrollbar-code m-0 bg-transparent border-0 select-text ${
            isWordWrap ? 'whitespace-pre-wrap break-words overflow-x-hidden' : 'overflow-x-auto whitespace-pre'
          }`}
        >
          {children}
        </pre>
      </PreContext.Provider>

      {/* Mobile & Desktop Horizontal Code Slider / Controls */}
      {canScroll && !isWordWrap && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-[#170f24] border-t border-[#3d2b4f]/70 select-none text-[11px]">
          {/* Scroll Left Step Button */}
          <button
            type="button"
            onClick={() => handleScrollStep('left')}
            className="p-1.5 rounded-lg bg-[#251838] hover:bg-[#ff4d4d] text-white/80 hover:text-white transition-all active:scale-95 shrink-0 cursor-pointer shadow-sm"
            title="Прокрутить код влево"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Interactive Scroll Slider Bar */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <SlidersHorizontal size={13} className="text-[#ff4d4d] shrink-0" />
            <div className="relative flex-1 flex items-center">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={Math.round(scrollPercent)}
                onChange={handleSliderChange}
                className="w-full h-2.5 bg-[#251838] rounded-full appearance-none cursor-ew-resize accent-[#ff4d4d] border border-[#3d2b4f]/80 focus:outline-none"
                title="Ползунок прокрутки кода"
              />
            </div>
            <span className="text-[10px] font-mono text-gray-400 shrink-0 font-bold w-9 text-right">
              {Math.round(scrollPercent)}%
            </span>
          </div>

          {/* Scroll Right Step Button */}
          <button
            type="button"
            onClick={() => handleScrollStep('right')}
            className="p-1.5 rounded-lg bg-[#251838] hover:bg-[#ff4d4d] text-white/80 hover:text-white transition-all active:scale-95 shrink-0 cursor-pointer shadow-sm"
            title="Прокрутить код вправо"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
  allowHtml = true,
}) => {
  const [fullscreenImg, setFullscreenImg] = useState<string | null>(null);

  // Sanitize content first to prevent XSS payloads while preserving markdown/html
  const sanitizedContent = useMemo(() => {
    if (!content) return '';
    return sanitizeContent(content);
  }, [content]);

  // Generate slug ID for heading
  const generateHeadingId = (text: string) => {
    return 'heading-' + text.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, '-').replace(/^-|-$/g, '');
  };

  const rehypePlugins = useMemo(() => {
    return allowHtml ? [rehypeRaw] : [];
  }, [allowHtml]);

  return (
    <>
      <div className={`markdown-content prose prose-invert max-w-none ${className}`}>
        <Markdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={rehypePlugins}
          components={{
            // Headers with anchor IDs and hover markers
            h1: ({ node, children, ...props }) => {
              const text = String(children);
              const id = generateHeadingId(text);
              return (
                <h1
                  id={id}
                  className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight mt-8 mb-4 flex items-center gap-2 group scroll-mt-24 border-b border-[#3d2b4f]/60 pb-3"
                  {...props}
                >
                  <span>{children}</span>
                  <a href={`#${id}`} className="opacity-0 group-hover:opacity-100 text-[#ff4d4d] transition-opacity">
                    <Hash size={18} />
                  </a>
                </h1>
              );
            },
            h2: ({ node, children, ...props }) => {
              const text = String(children);
              const id = generateHeadingId(text);
              return (
                <h2
                  id={id}
                  className="text-xl sm:text-2xl font-black text-white tracking-tight mt-7 mb-3 flex items-center gap-2 group scroll-mt-24 text-[#ff4d4d]"
                  {...props}
                >
                  <span>{children}</span>
                  <a href={`#${id}`} className="opacity-0 group-hover:opacity-100 text-[#ff4d4d] transition-opacity">
                    <Hash size={16} />
                  </a>
                </h2>
              );
            },
            h3: ({ node, children, ...props }) => {
              const text = String(children);
              const id = generateHeadingId(text);
              return (
                <h3
                  id={id}
                  className="text-lg sm:text-xl font-bold text-white/90 tracking-tight mt-6 mb-2 flex items-center gap-2 group scroll-mt-24"
                  {...props}
                >
                  <span>{children}</span>
                  <a href={`#${id}`} className="opacity-0 group-hover:opacity-100 text-[#ff4d4d] transition-opacity">
                    <Hash size={14} />
                  </a>
                </h3>
              );
            },
            h4: ({ node, children, ...props }) => (
              <h4 className="text-base sm:text-lg font-bold text-white/80 mt-4 mb-2" {...props}>
                {children}
              </h4>
            ),
            h5: ({ node, children, ...props }) => (
              <h5 className="text-sm sm:text-base font-semibold text-white/70 mt-3 mb-1" {...props}>
                {children}
              </h5>
            ),
            h6: ({ node, children, ...props }) => (
              <h6 className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-white/50 mt-3 mb-1" {...props}>
                {children}
              </h6>
            ),

            // Paragraphs and text formatting
            p: ({ node, children, ...props }) => (
              <p className="text-white/80 font-normal text-sm sm:text-base leading-relaxed my-3" {...props}>
                {children}
              </p>
            ),
            strong: ({ node, children, ...props }) => (
              <strong className="font-black text-white tracking-wide" {...props}>
                {children}
              </strong>
            ),
            b: ({ node, children, ...props }) => (
              <strong className="font-black text-white tracking-wide" {...props}>
                {children}
              </strong>
            ),
            em: ({ node, children, ...props }) => (
              <em className="italic text-[#ff9999] font-medium" {...props}>
                {children}
              </em>
            ),
            i: ({ node, children, ...props }) => (
              <em className="italic text-[#ff9999] font-medium" {...props}>
                {children}
              </em>
            ),

            // Blockquotes
            blockquote: ({ node, children, ...props }) => (
              <blockquote
                className="my-5 p-4 sm:p-5 rounded-2xl bg-[#15101e]/80 border-l-4 border-[#ff4d4d] text-white/90 italic font-medium shadow-lg"
                {...props}
              >
                {children}
              </blockquote>
            ),

            // Lists
            ul: ({ node, children, ...props }) => (
              <ul className="list-disc list-inside space-y-2 my-4 text-white/80 pl-2 sm:pl-4" {...props}>
                {children}
              </ul>
            ),
            ol: ({ node, children, ...props }) => (
              <ol className="list-decimal list-inside space-y-2 my-4 text-white/80 pl-2 sm:pl-4 font-medium" {...props}>
                {children}
              </ol>
            ),
            li: ({ node, children, ...props }) => (
              <li className="leading-relaxed marker:text-[#ff4d4d] marker:font-bold" {...props}>
                {children}
              </li>
            ),

            // Preformatted code blocks
            pre: CodeBlockWrapper,

            // Code and syntax (safe inline code with no div/pre inside p)
            code: ({ node, className, children, ...props }: any) => {
              const isInsidePre = useContext(PreContext);
              if (isInsidePre) {
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              }
              return (
                <code
                  className="px-1.5 py-0.5 mx-0.5 rounded-lg bg-[#15101e] text-[#ff7a7a] font-mono text-xs sm:text-sm border border-[#3d2b4f]/60 font-semibold inline"
                  {...props}
                >
                  {children}
                </code>
              );
            },

            // Tables
            table: ({ node, children, ...props }) => (
              <div className="overflow-x-auto my-6 rounded-2xl border border-[#3d2b4f] bg-[#15101e]/60 shadow-xl custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs sm:text-sm" {...props}>
                  {children}
                </table>
              </div>
            ),
            thead: ({ node, children, ...props }) => (
              <thead className="bg-[#251c35] border-b border-[#3d2b4f] text-white font-bold uppercase tracking-wider text-[11px]" {...props}>
                {children}
              </thead>
            ),
            tbody: ({ node, children, ...props }) => (
              <tbody className="divide-y divide-[#3d2b4f]/40" {...props}>
                {children}
              </tbody>
            ),
            tr: ({ node, children, ...props }) => (
              <tr className="hover:bg-[#ff4d4d]/5 transition-colors" {...props}>
                {children}
              </tr>
            ),
            th: ({ node, children, ...props }) => (
              <th className="p-3 sm:p-4 text-[#ff4d4d]" {...props}>
                {children}
              </th>
            ),
            td: ({ node, children, ...props }) => (
              <td className="p-3 sm:p-4 text-white/80 font-normal" {...props}>
                {children}
              </td>
            ),

            // Links
            a: ({ node, href, children, ...props }) => {
              const isExternal = href?.startsWith('http') || href?.startsWith('//');
              return (
                <a
                  href={href}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noopener noreferrer' : undefined}
                  className="inline-flex items-center gap-1 text-[#ff4d4d] hover:text-white font-bold underline decoration-[#ff4d4d]/40 hover:decoration-white transition-all cursor-pointer"
                  {...props}
                >
                  <span>{children}</span>
                  {isExternal && <ExternalLink size={12} className="opacity-70" />}
                </a>
              );
            },

            // Images with zoom lightbox modal and blurry progressive loading
            img: ({ node, src, alt, ...props }) => {
              if (!src) return null;
              return (
                <span className="block my-6 group/img relative rounded-2xl overflow-hidden border border-[#3d2b4f] bg-[#15101e]/60">
                  <LazyImage
                    src={src}
                    alt={alt || 'Image'}
                    onClick={() => setFullscreenImg(src)}
                    showZoomCursor={true}
                    className="w-full max-h-[550px] object-cover rounded-2xl group-hover/img:scale-[1.01] transition-transform duration-300"
                    containerClassName="w-full"
                    {...props}
                  />
                  <button
                    type="button"
                    onClick={() => setFullscreenImg(src)}
                    className="absolute bottom-3 right-3 z-20 p-2 bg-black/60 hover:bg-[#ff4d4d] text-white hover:text-[#15101e] rounded-xl backdrop-blur-md opacity-0 group-hover/img:opacity-100 transition-all cursor-pointer shadow-lg"
                    title="Zoom image"
                  >
                    <Maximize2 size={16} />
                  </button>
                  {alt && (
                    <span className="block text-center text-xs text-white/50 py-2 italic">
                      {alt}
                    </span>
                  )}
                </span>
              );
            },

            // Videos
            video: ({ node, src, ...props }: any) => {
              if (src) {
                return (
                  <span className="block my-6">
                    <KuruVideoPlayer src={src} isCompact={false} />
                  </span>
                );
              }
              return <video controls className="w-full rounded-2xl my-6 bg-black" {...props} />;
            },

            // Dividers
            hr: ({ node, ...props }) => (
              <hr className="my-8 border-t border-[#3d2b4f]/60" {...props} />
            ),
          }}
        >
          {sanitizedContent}
        </Markdown>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {typeof document !== 'undefined' && document.body && createPortal(
        <AnimatePresence>
          {fullscreenImg && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/95 p-4"
              onClick={() => setFullscreenImg(null)}
            >
              <button
                onClick={() => setFullscreenImg(null)}
                className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-[#ff4d4d] text-white hover:text-[#15101e] rounded-full transition-all cursor-pointer z-[100000]"
                title="Close"
              >
                <X size={24} />
              </button>
              <motion.img
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                src={fullscreenImg}
                className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-[#3d2b4f]"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};
