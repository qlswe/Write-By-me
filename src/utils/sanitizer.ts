import DOMPurify from 'dompurify';
import { safeStorage } from './securityStorage';

let globalThreatsBlocked = parseInt(safeStorage.getItem('aha_threats_blocked') || '0', 10);

export const getThreatsBlockedCount = () => globalThreatsBlocked;

// Allowed embed domains for iframes (YouTube, VK, Rutube, Vimeo, Coub)
const ALLOWED_IFRAME_HOSTS = [
  'www.youtube.com',
  'youtube.com',
  'youtu.be',
  'www.youtube-nocookie.com',
  'player.vimeo.com',
  'vk.com',
  'rutube.ru',
  'coub.com'
];

/**
 * Options for stripping dangerous characters
 */
export interface StripDangerousOptions {
  allowNewlines?: boolean;
  maxLength?: number;
  preserveQuotes?: boolean;
}

/**
 * Strips dangerous control characters, zero-width exploits, bidi overrides,
 * null bytes, and script injection tokens from raw user input strings.
 */
export const stripDangerousChars = (input: string, options: StripDangerousOptions = {}): string => {
  if (!input || typeof input !== 'string') return '';

  const {
    allowNewlines = true,
    maxLength,
    preserveQuotes = true
  } = options;

  let sanitized = input;

  // 1. Remove ASCII control characters (0x00-0x08, 0x0B, 0x0C, 0x0E-0x1F, 0x7F)
  // If allowNewlines is true, keep \n (0x0A), \r (0x0D), and \t (0x09)
  if (allowNewlines) {
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  } else {
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, ' ');
  }

  // 2. Remove zero-width spaces, invisible formatters, and bidirectional override exploits
  // \u200B (Zero-width space), \u200C (ZWNJ), \u200D (ZWJ), \uFEFF (BOM)
  // \u202A-\u202E (Bidi Embedding/Overrides), \u2066-\u2069 (Bidi Isolates)
  sanitized = sanitized.replace(/[\u200B-\u200D\uFEFF\u202A-\u202E\u2066-\u2069]/g, '');

  // 3. Strip dangerous inline protocol prefixes when directly provided in raw text
  sanitized = sanitized.replace(/\bjavascript:\s*/gi, '');
  sanitized = sanitized.replace(/\bvbscript:\s*/gi, '');
  sanitized = sanitized.replace(/\bdata:text\/html\s*/gi, '');
  sanitized = sanitized.replace(/\bdata:application\s*/gi, '');

  // 4. Strip dangerous inline event handlers from raw strings (e.g. "onerror=", "onload=", "onclick=")
  sanitized = sanitized.replace(/\bon\w+\s*=\s*(['"][^'"]*['"]|[^\s>]+)/gi, '');

  // 5. If quotes should not be preserved or raw tag injection is detected
  if (!preserveQuotes) {
    sanitized = sanitized.replace(/['"`;]/g, '');
  }

  // 6. Max length clamp
  if (typeof maxLength === 'number' && maxLength > 0) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized.trim();
};

/**
 * Validates whether a URL is safe to open, embed, or navigate to
 */
export const isSafeUrl = (urlStr: string): boolean => {
  if (!urlStr || typeof urlStr !== 'string') return false;
  const trimmed = urlStr.trim().toLowerCase();

  // Block dangerous pseudo-protocols
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('vbscript:') ||
    trimmed.startsWith('data:text') ||
    trimmed.startsWith('data:application') ||
    trimmed.startsWith('data:image/svg+xml') ||
    trimmed.startsWith('file:')
  ) {
    return false;
  }

  // Allow relative URLs
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return true;
  }

  try {
    const parsed = new URL(urlStr, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    const validProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
    if (!validProtocols.includes(parsed.protocol)) {
      return false;
    }

    // SSRF & Cloud Metadata protection on client-side navigation
    const host = parsed.hostname.toLowerCase();
    if (
      host === '169.254.169.254' ||
      host === 'metadata.google.internal' ||
      host === 'instance-data' ||
      host === 'localhost' ||
      host === '127.0.0.1'
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

/**
 * Strips all HTML tags and dangerous characters, leaving clean, safe plain text
 * (Ideal for Feedback messages, Post Titles, User Names, Author fields, and Search inputs)
 */
export const sanitizePlainText = (input: string, maxLength?: number): string => {
  if (!input || typeof input !== 'string') return '';

  // 1. Strip dangerous characters first
  let cleaned = stripDangerousChars(input, { allowNewlines: true, maxLength });

  // 2. Remove all HTML tags completely
  cleaned = cleaned.replace(/<[^>]*>/g, ' ');

  // 3. Remove unbalanced tag openers/closers
  cleaned = cleaned.replace(/[<>]/g, '');

  // 4. Collapse multiple spaces (while preserving intentional single newlines)
  cleaned = cleaned
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (typeof maxLength === 'number' && maxLength > 0) {
    cleaned = cleaned.slice(0, maxLength);
  }

  return cleaned;
};

/**
 * Core content sanitizer that prevents XSS while supporting allowed rich formatting & tags
 */
export const sanitizeContent = (dirty: string): string => {
  if (!dirty || typeof dirty !== 'string') return '';
  const isStrict = safeStorage.getItem('aha_strict_mode') === 'true';
  const isCensored = safeStorage.getItem('aha_censor_mode') === 'true';
  
  // 1. Strip raw control codes and bidi exploits
  let text = stripDangerousChars(dirty, { allowNewlines: true });

  // 2. Basic profanity filter if enabled
  if (isCensored) {
    const badWords = ['fuck', 'shit', 'bitch', 'asshole', 'dick', 'cunt'];
    const rx = new RegExp(`\\b(${badWords.join('|')})\\b`, 'gi');
    text = text.replace(rx, '***');
  }

  // 3. Allowed tag configurations
  const allowedTags = isStrict 
    ? ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'span', 'div'] 
    : ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'img', 'video', 'source', 'iframe', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'del', 's', 'mark'];

  // Add hooks for safe iframe validation and secure anchor attributes
  DOMPurify.removeHook('uponSanitizeElement');
  DOMPurify.addHook('uponSanitizeElement', (node, data) => {
    const el = node as Element;

    // Remove dangerous inline event handlers unconditionally
    if (el.attributes) {
      for (let i = el.attributes.length - 1; i >= 0; i--) {
        const attrName = el.attributes[i].name.toLowerCase();
        if (attrName.startsWith('on') || attrName.startsWith('data-on') || attrName === 'formaction' || attrName === 'action') {
          el.removeAttribute(attrName);
        }
      }
    }

    if (data.tagName === 'iframe') {
      const src = el.getAttribute?.('src') || '';
      try {
        const url = new URL(src, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
        if (!ALLOWED_IFRAME_HOSTS.some(host => url.hostname === host || url.hostname.endsWith('.' + host))) {
          el.parentNode?.removeChild(el);
        } else {
          // Force secure sandboxing on rich embedded iframes
          el.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
          el.setAttribute('loading', 'lazy');
          el.setAttribute('referrerpolicy', 'no-referrer');
        }
      } catch {
        el.parentNode?.removeChild(el);
      }
    }

    if (data.tagName === 'a') {
      el.setAttribute?.('rel', 'noopener noreferrer');
      el.setAttribute?.('target', '_blank');
      const href = el.getAttribute?.('href') || '';
      if (!isSafeUrl(href)) {
        el.removeAttribute?.('href');
      }
    }

    if (data.tagName === 'img' || data.tagName === 'source') {
      const src = el.getAttribute?.('src') || '';
      if (src && !isSafeUrl(src) && !src.startsWith('data:image/')) {
        el.removeAttribute?.('src');
      }
      el.setAttribute('loading', 'lazy');
      el.setAttribute('decoding', 'async');
    }
  });

  const clean = DOMPurify.sanitize(text, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class', 'className', 'controls', 'autoplay', 'loop', 'muted', 'poster', 'type', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'style', 'id', 'title', 'loading', 'decoding', 'sandbox'],
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select', 'meta', 'base', 'link', 'style'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'formaction', 'action'],
    ALLOW_DATA_ATTR: false
  });

  // Count removed items & log security telemetry
  if (DOMPurify.removed && DOMPurify.removed.length > 0) {
    const removals = DOMPurify.removed.length;
    setTimeout(() => {
      globalThreatsBlocked += removals;
      safeStorage.setItem('aha_threats_blocked', globalThreatsBlocked.toString());
      
      try {
        const currentLogs = JSON.parse(safeStorage.getItem('aha_security_logs') || '[]');
        const newLog = `[${new Date().toLocaleTimeString()}] Blocked ${removals} suspicious elements (XSS/Strict)`;
        const newLogs = [newLog, ...currentLogs].slice(0, 20);
        safeStorage.setItem('aha_security_logs', JSON.stringify(newLogs));
      } catch(e) {}

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('aha_threat_blocked'));
      }
    }, 0);
  }

  return clean;
};

/**
 * Alias for rich text sanitization
 */
export const sanitizeRichText = sanitizeContent;

/**
 * General purpose input sanitizer
 */
export const sanitizeInput = (input: any, mode: 'plain' | 'rich' | 'url' = 'plain'): any => {
  if (typeof input !== 'string') return input;
  if (mode === 'url') {
    return isSafeUrl(input) ? input.trim() : '';
  }
  if (mode === 'rich') {
    return sanitizeRichText(input);
  }
  return sanitizePlainText(input);
};

/**
 * Recursively sanitizes every string property of an object or array.
 * Rich keys (like content, body, description) are sanitized via sanitizeRichText,
 * while other fields (title, summary, name, id, category) are sanitized via sanitizePlainText.
 */
export const sanitizeObject = <T>(
  data: T,
  options: { richKeys?: string[]; maxStringLength?: number } = {}
): T => {
  if (!data) return data;

  const { richKeys = ['content', 'body', 'markdown', 'description', 'html', 'rawHtml'] } = options;

  if (typeof data === 'string') {
    return sanitizePlainText(data, options.maxStringLength) as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeObject(item, options)) as unknown as T;
  }

  if (typeof data === 'object' && data !== null) {
    const cleanedObj: any = Object.create(null);
    for (const [key, val] of Object.entries(data)) {
      // Prototype pollution & injection prevention
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      if (typeof val === 'string') {
        const isRich = richKeys.includes(key);
        cleanedObj[key] = isRich 
          ? sanitizeRichText(val) 
          : sanitizePlainText(val, options.maxStringLength);
      } else if (typeof val === 'object' && val !== null) {
        cleanedObj[key] = sanitizeObject(val, options);
      } else {
        cleanedObj[key] = val;
      }
    }
    // Return standard object safely
    return { ...cleanedObj } as T;
  }

  return data;
};

/**
 * Specialized sanitizer for user feedback & bug reports
 */
export const sanitizeFeedback = (feedback: {
  type?: string;
  message?: string;
  feedbackText?: string;
  text?: string;
  image?: string | null;
  [key: string]: any;
}) => {
  const cleanType = sanitizePlainText(feedback.type || 'suggestion', 30);
  const rawMsg = feedback.message || feedback.feedbackText || feedback.text || '';
  const cleanMsg = sanitizePlainText(rawMsg, 5000);
  
  let cleanImage = feedback.image;
  if (cleanImage && typeof cleanImage === 'string') {
    if (!cleanImage.startsWith('data:image/') && !isSafeUrl(cleanImage)) {
      cleanImage = null;
    }
  }

  return {
    ...feedback,
    type: cleanType,
    message: cleanMsg,
    feedbackText: cleanMsg,
    text: cleanMsg,
    image: cleanImage
  };
};

/**
 * Specialized sanitizer for blog entries
 */
export const sanitizeBlogPost = (post: any) => {
  if (!post || typeof post !== 'object') return post;

  const sanitizeLocalizedMap = (val: any, isRich: boolean = false) => {
    if (typeof val === 'string') {
      return isRich ? sanitizeRichText(val) : sanitizePlainText(val);
    }
    if (typeof val === 'object' && val !== null) {
      const res: Record<string, string> = {};
      for (const [lang, text] of Object.entries(val)) {
        res[lang] = typeof text === 'string'
          ? (isRich ? sanitizeRichText(text) : sanitizePlainText(text))
          : '';
      }
      return res;
    }
    return val;
  };

  return {
    ...post,
    title: sanitizeLocalizedMap(post.title, false),
    summary: sanitizeLocalizedMap(post.summary, false),
    content: sanitizeLocalizedMap(post.content, true),
    category: sanitizePlainText(post.category || 'updates', 50),
    author: sanitizePlainText(post.author || 'Aha Ministry', 100),
    mediaUrl: post.mediaUrl && isSafeUrl(post.mediaUrl) ? post.mediaUrl : (post.mediaUrl?.startsWith('data:image/') ? post.mediaUrl : '')
  };
};

/**
 * Specialized sanitizer for comment entries
 */
export const sanitizeComment = (comment: any) => {
  if (!comment || typeof comment !== 'object') return comment;

  return {
    ...comment,
    content: sanitizePlainText(comment.content || '', 2000),
    authorName: sanitizePlainText(comment.authorName || 'Anonymous', 60),
    authorPhoto: comment.authorPhoto && isSafeUrl(comment.authorPhoto) ? comment.authorPhoto : ''
  };
};

/**
 * Universal Pre-Render Guard: guarantees clean, safe text before being injected into the DOM
 */
export const sanitizeBeforeRender = (content: any, mode: 'plain' | 'rich' = 'plain'): string => {
  if (content === null || content === undefined) return '';
  if (typeof content !== 'string') {
    return sanitizePlainText(String(content));
  }
  return mode === 'rich' ? sanitizeRichText(content) : sanitizePlainText(content);
};
