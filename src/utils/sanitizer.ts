import DOMPurify from 'dompurify';
import { safeStorage } from './securityStorage';

let globalThreatsBlocked = parseInt(safeStorage.getItem('aha_threats_blocked') || '0', 10);

export const getThreatsBlockedCount = () => globalThreatsBlocked;

// Allowed embed domains for iframes (YouTube, VK, Rutube, Vimeo)
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
 * Core content sanitizer that prevents XSS while supporting allowed rich formatting & tags
 */
export const sanitizeContent = (dirty: string): string => {
  if (!dirty) return '';
  const isStrict = safeStorage.getItem('aha_strict_mode') === 'true';
  const isCensored = safeStorage.getItem('aha_censor_mode') === 'true';
  
  // Basic bad word filter
  let text = dirty;
  if (isCensored) {
    const badWords = ['fuck', 'shit', 'bitch', 'asshole', 'dick', 'cunt'];
    const rx = new RegExp(`\\b(${badWords.join('|')})\\b`, 'gi');
    text = text.replace(rx, '***');
  }

  // In strict mode, strip out images, links, and code blocks
  const allowedTags = isStrict 
    ? ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'span', 'div'] 
    : ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'img', 'video', 'source', 'iframe', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'del', 's', 'mark'];

  // Add hooks for safe iframe validation and secure anchor attributes
  DOMPurify.removeHook('uponSanitizeElement');
  DOMPurify.addHook('uponSanitizeElement', (node, data) => {
    const el = node as Element;
    if (data.tagName === 'iframe') {
      const src = el.getAttribute?.('src') || '';
      try {
        const url = new URL(src, window.location.origin);
        if (!ALLOWED_IFRAME_HOSTS.some(host => url.hostname === host || url.hostname.endsWith('.' + host))) {
          el.parentNode?.removeChild(el);
        }
      } catch {
        el.parentNode?.removeChild(el);
      }
    }
    if (data.tagName === 'a') {
      el.setAttribute?.('rel', 'noopener noreferrer');
      el.setAttribute?.('target', '_blank');
      const href = el.getAttribute?.('href') || '';
      if (href.toLowerCase().startsWith('javascript:') || href.toLowerCase().startsWith('data:text')) {
        el.removeAttribute?.('href');
      }
    }
  });

  const clean = DOMPurify.sanitize(text, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class', 'className', 'controls', 'autoplay', 'loop', 'muted', 'poster', 'type', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'style', 'id', 'title'],
  });

  // Count removed items
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
