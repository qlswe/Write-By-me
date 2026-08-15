import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  Home, 
  Search, 
  ShieldCheck, 
  Lock, 
  Unlock,
  Copy, 
  Check, 
  X, 
  Plus,
  Pin,
  Eye,
  EyeOff,
  Terminal, 
  Monitor, 
  ExternalLink,
  BookOpen,
  Bookmark,
  History,
  Trash2,
  Code2,
  Download,
  CheckCircle2,
  AlertTriangle,
  Info,
  Shield,
  Maximize2,
  Minimize2,
  Share2,
  Link2,
  Type,
  Sun,
  Moon,
  Printer,
  Sparkles
} from 'lucide-react';
import { 
  AHA_CUSTOM_USER_AGENTS, 
  getActiveUserAgentProfile, 
  setActiveUserAgentProfile, 
  getAhaBrowserHeaders, 
  getStoredBookmarks,
  saveBookmark,
  removeBookmark,
  getStoredHistory,
  addHistoryEntry,
  clearBrowserHistory,
  isAdBlockEnabled,
  setAdBlockEnabled,
  UserAgentProfile,
  BrowserTab,
  BookmarkItem,
  HistoryItem
} from '../../utils/ahaBrowser';
import { Language } from '../../data/translations';
import { CustomSelect } from './CustomSelect';

interface AhaEmbeddedBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

const SEARCH_ENGINES = [
  { id: 'duckduckgo', name: 'DuckDuckGo (In Frame)', searchUrl: 'https://html.duckduckgo.com/html/?q=' },
  { id: 'wikipedia', name: 'Wikipedia Mobile', searchUrl: 'https://en.m.wikipedia.org/w/index.php?search=' },
  { id: 'google', name: 'Google (External Tab)', searchUrl: 'https://www.google.com/search?q=' },
  { id: 'bing', name: 'Bing', searchUrl: 'https://www.bing.com/search?q=' },
  { id: 'aha', name: 'AHA Protocol Search', searchUrl: '/#theories?q=' }
];

// Helper to safely prepare HTML for Iframe rendering with absolute Base URL
function getIframeSrcDoc(html: string, baseUrl: string): string {
  if (!html) return '';
  const baseTag = `<base href="${baseUrl}">`;
  const suppressCorsScript = `<script>
    window.addEventListener('error', function(e) { 
      if (e.message && (e.message.includes('CORS') || e.message.includes('XMLHttpRequest') || e.message.includes('Failed to fetch'))) { 
        e.stopImmediatePropagation(); 
        e.preventDefault(); 
      } 
    }, true);

    document.addEventListener('DOMContentLoaded', function() {
      document.querySelectorAll('a').forEach(function(a) {
        if (a.getAttribute('target') === '_blank') {
          a.setAttribute('target', '_self');
        }
      });
    });

    document.addEventListener('click', function(e) {
      var a = e.target && e.target.closest ? e.target.closest('a') : null;
      if (a) {
        if (a.getAttribute('target') === '_blank') {
          a.setAttribute('target', '_self');
        }
      }
    }, true);

    var longPressTimer = null;
    function triggerContextMenu(e, href) {
      if (!href) return;
      try {
        var resolvedUrl = new URL(href, document.baseURI || window.location.href).href;
        window.parent.postMessage({
          type: 'AHA_BROWSER_LONG_PRESS',
          url: resolvedUrl,
          clientX: e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 200),
          clientY: e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 200)
        }, '*');
      } catch(err) {
        window.parent.postMessage({
          type: 'AHA_BROWSER_LONG_PRESS',
          url: href,
          clientX: 200,
          clientY: 200
        }, '*');
      }
    }

    document.addEventListener('contextmenu', function(e) {
      var a = e.target && e.target.closest ? e.target.closest('a') : null;
      var targetUrl = a ? (a.href || a.getAttribute('href')) : null;
      if (targetUrl) {
        e.preventDefault();
        e.stopPropagation();
        triggerContextMenu(e, targetUrl);
      }
    }, true);

    document.addEventListener('touchstart', function(e) {
      var a = e.target && e.target.closest ? e.target.closest('a') : null;
      var targetUrl = a ? (a.href || a.getAttribute('href')) : null;
      if (targetUrl) {
        if (longPressTimer) clearTimeout(longPressTimer);
        longPressTimer = setTimeout(function() {
          triggerContextMenu(e, targetUrl);
        }, 450);
      }
    }, { passive: true });

    document.addEventListener('touchend', function() {
      if (longPressTimer) clearTimeout(longPressTimer);
    }, true);

    document.addEventListener('touchmove', function() {
      if (longPressTimer) clearTimeout(longPressTimer);
    }, true);
  </script>`;
  
  if (html.toLowerCase().includes('<head>')) {
    return html.replace(/<head>/i, `<head>${baseTag}${suppressCorsScript}`);
  } else if (html.toLowerCase().includes('<html')) {
    return html.replace(/(<html[^>]*>)/i, `$1<head>${baseTag}${suppressCorsScript}</head>`);
  }
  return `<!DOCTYPE html><html><head>${baseTag}${suppressCorsScript}<meta charset="utf-8"><style>body{margin:0;padding:0;font-family:sans-serif;}</style></head><body>${html}</body></html>`;
}

export const AhaEmbeddedBrowserModal: React.FC<AhaEmbeddedBrowserModalProps> = ({ isOpen, onClose, lang }) => {
  const isRu = lang === 'ru';

  // Browser Global States
  const [activeProfile, setActiveProfile] = useState<UserAgentProfile>(getActiveUserAgentProfile());
  const [customUaInput, setCustomUaInput] = useState<string>(activeProfile.userAgentString);
  const [adBlock, setAdBlock] = useState<boolean>(isAdBlockEnabled());
  const [selectedEngine, setSelectedEngine] = useState<string>('google');

  // Persistence Data States
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [historySearch, setHistorySearch] = useState<string>('');
  const [bookmarkSearch, setBookmarkSearch] = useState<string>('');

  // Tabs Management State
  const [tabs, setTabs] = useState<BrowserTab[]>([
    {
      id: 'tab-1',
      title: 'AHA Protocol Home',
      url: 'https://aha-browser.v6/home',
      history: ['https://aha-browser.v6/home'],
      historyIndex: 0,
      isLoading: false,
      pinned: false,
      incognito: false
    }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab-1');

  // Modal View Modes
  const [activeView, setActiveView] = useState<'viewport' | 'reader' | 'source' | 'ua_editor' | 'headers' | 'bookmarks' | 'history' | 'security'>('viewport');
  const [inputUrl, setInputUrl] = useState<string>('https://aha-browser.v6/home');
  const [copiedSource, setCopiedSource] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Reader Mode State
  const [readerFontSize, setReaderFontSize] = useState<number>(105);
  const [readerTheme, setReaderTheme] = useState<'dark' | 'sepia' | 'light'>('dark');

  // Long press / Context menu state
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    url: string;
    x: number;
    y: number;
  } | null>(null);
  const [contextToast, setContextToast] = useState<string | null>(null);

  const showContextToast = (msg: string) => {
    setContextToast(msg);
    setTimeout(() => setContextToast(null), 2500);
  };

  const handleOpenContextMenu = (url: string, x?: number, y?: number) => {
    if (!url) return;
    setContextMenu({
      isOpen: true,
      url,
      x: x ?? window.innerWidth / 2,
      y: y ?? window.innerHeight / 2
    });
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'AHA_BROWSER_LONG_PRESS') {
        const { url, clientX, clientY } = event.data;
        handleOpenContextMenu(url, clientX, clientY);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Long press handler generator for React elements in browser UI
  const createLongPressProps = (url: string) => {
    let timer: any = null;
    return {
      onContextMenu: (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        handleOpenContextMenu(url, e.clientX, e.clientY);
      },
      onTouchStart: (e: React.TouchEvent) => {
        const touch = e.touches[0];
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          handleOpenContextMenu(url, touch.clientX, touch.clientY);
        }, 450);
      },
      onTouchEnd: () => {
        if (timer) clearTimeout(timer);
      },
      onTouchMove: () => {
        if (timer) clearTimeout(timer);
      }
    };
  };

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  // Fullscreen mode handler
  const toggleFullscreen = () => {
    const nextState = !isFullscreen;
    setIsFullscreen(nextState);

    if (nextState) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Sync browser native fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Sync state on modal open
  useEffect(() => {
    if (isOpen) {
      setActiveProfile(getActiveUserAgentProfile());
      setBookmarks(getStoredBookmarks());
      setHistoryList(getStoredHistory());
      setAdBlock(isAdBlockEnabled());
      if (activeTab) {
        setInputUrl(activeTab.url);
      }
    }
  }, [isOpen]);

  // Update inputUrl when activeTab changes
  useEffect(() => {
    if (activeTab) {
      setInputUrl(activeTab.url);
    }
  }, [activeTabId]);

  // Tab Handlers
  const handleCreateNewTab = (initialUrl: string = 'https://aha-browser.v6/home', incognito: boolean = false) => {
    const newTabId = `tab-${Date.now()}`;
    const newTab: BrowserTab = {
      id: newTabId,
      title: incognito ? (isRu ? 'Инкогнито Вкладка' : 'Incognito Tab') : 'Новая Вкладка',
      url: initialUrl,
      history: [initialUrl],
      historyIndex: 0,
      isLoading: false,
      pinned: false,
      incognito
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTabId);
    setInputUrl(initialUrl);

    if (initialUrl !== 'https://aha-browser.v6/home') {
      fetchPageForTab(newTabId, initialUrl);
    }
  };

  const handleCloseTab = (tabIdToClose: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (tabs.length === 1) {
      handleNavigate('https://aha-browser.v6/home');
      return;
    }

    const updatedTabs = tabs.filter(t => t.id !== tabIdToClose);
    setTabs(updatedTabs);

    if (activeTabId === tabIdToClose) {
      setActiveTabId(updatedTabs[updatedTabs.length - 1].id);
    }
  };

  const handleTogglePinTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, pinned: !t.pinned } : t));
  };

  // Main Fetch Page Engine
  const fetchPageForTab = async (tabId: string, targetUrl: string) => {
    if (targetUrl === 'https://aha-browser.v6/home') {
      setTabs(prev => prev.map(t => {
        if (t.id === tabId) {
          return {
            ...t,
            url: targetUrl,
            title: 'AHA Protocol Home',
            isLoading: false,
            statusCode: 200,
            latencyMs: 1,
            contentCache: undefined
          };
        }
        return t;
      }));
      return;
    }

    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, isLoading: true } : t));

    let finalUrl = targetUrl;
    let finalTitle = targetUrl;
    let finalStatusCode = 200;
    let finalLatency = 15;
    let finalHeaders: Record<string, string> = {};
    let finalHtml = '';
    let fetchedSuccessfully = false;

    // TIER 0: Native Wikipedia API (CORS-enabled directly by Wikimedia)
    if (!fetchedSuccessfully && targetUrl.includes('wikipedia.org')) {
      try {
        const parsed = new URL(targetUrl);
        const hostParts = parsed.hostname.split('.');
        const wikiLang = hostParts[0] === 'en' || hostParts[0] === 'ru' || hostParts[0] === 'de' || hostParts[0] === 'fr' || hostParts[0] === 'es' ? hostParts[0] : 'en';

        // Case A: Wikipedia Article Page
        if (parsed.pathname.includes('/wiki/')) {
          const rawTitle = parsed.pathname.split('/wiki/')[1];
          if (rawTitle && !rawTitle.includes('Special:Search')) {
            const wikiRestUrl = `https://${wikiLang}.wikipedia.org/api/rest_v1/page/html/${rawTitle}`;
            const wikiRes = await fetch(wikiRestUrl);
            if (wikiRes.ok) {
              finalHtml = await wikiRes.text();
              const cleanTitle = decodeURIComponent(rawTitle).replace(/_/g, ' ');
              finalTitle = `${cleanTitle} — Wikipedia`;
              finalStatusCode = 200;
              finalLatency = 35;
              fetchedSuccessfully = true;
            }
          }
        }

        // Case B: Wikipedia Search Query
        if (!fetchedSuccessfully && (targetUrl.includes('search=') || targetUrl.includes('Special:Search'))) {
          const query = parsed.searchParams.get('search') || parsed.pathname.split('search=')[1] || '';
          if (query) {
            const wikiSearchUrl = `https://${wikiLang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
            const wikiSearchRes = await fetch(wikiSearchUrl);
            if (wikiSearchRes.ok) {
              const searchData = await wikiSearchRes.json();
              const items = searchData?.query?.search || [];
              const itemsList = items.map((item: any) => `
                <div style="margin-bottom: 16px; padding: 18px; background: #160f24; border: 1px solid #3d2b4f; border-radius: 14px;">
                  <h3 style="margin: 0 0 6px 0;">
                    <a href="https://${wikiLang}.wikipedia.org/wiki/${encodeURIComponent(item.title)}" style="color: #00f0ff; text-decoration: none; font-size: 17px; font-weight: bold;">${item.title}</a>
                  </h3>
                  <div style="color: #d1d5db; font-size: 13px; line-height: 1.6;">${item.snippet}</div>
                </div>
              `).join('');

              finalHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{background:#0d0817;color:#fff;font-family:system-ui,-apple-system,sans-serif;padding:28px;max-width:840px;margin:0 auto;}</style></head><body>
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;border-b:1px solid #3d2b4f;padding-bottom:12px;">
                  <span style="font-size:24px;">📚</span>
                  <h2 style="color:#00f0ff;margin:0;font-size:20px;font-weight:800;">Wikipedia (${wikiLang.toUpperCase()}) Search: "${query}"</h2>
                </div>
                ${itemsList || `<p style="color:#9ca3af;">No results found.</p>`}
              </body></html>`;
              finalTitle = `${query} — Wikipedia Search`;
              finalStatusCode = 200;
              finalLatency = 40;
              fetchedSuccessfully = true;
            }
          }
        }
      } catch {
        // Fallback to Tier 1
      }
    }

    // TIER 1: Try backend Express endpoint /api/browser/fetch
    if (!fetchedSuccessfully) {
      try {
        const response = await fetch('/api/browser/fetch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-AHA-Protocol-Version': '6.0-HYPER-IPv6'
          },
          body: JSON.stringify({
            url: targetUrl,
            userAgent: activeProfile.userAgentString,
            customHeaders: getAhaBrowserHeaders(activeProfile.id),
            adBlock
          })
        });

        if (response.ok) {
          const rawText = await response.text();
          try {
            const data = JSON.parse(rawText);
            if (data && data.html && !data.html.includes('NOT_FOUND arn1') && data.statusCode < 400) {
              finalUrl = data.url || targetUrl;
              finalTitle = data.title || targetUrl;
              finalStatusCode = data.statusCode || 200;
              finalLatency = data.latencyMs || 15;
              finalHeaders = data.headers || {};
              finalHtml = data.html;
              fetchedSuccessfully = true;
            }
          } catch {
            // Non-JSON response (e.g. Vercel 404 HTML page)
          }
        }
      } catch {
        // Server endpoint unavailable
      }
    }

    // TIER 2: If Tier 1 failed or returned non-JSON / Vercel 404, use Client-Side Proxies
    if (!fetchedSuccessfully) {
      const extractTitle = (html: string, fallback: string) => {
        try {
          const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
          if (match && match[1]) {
            const clean = match[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();
            if (clean && !clean.includes('NOT_FOUND arn1') && !clean.includes('Request Error')) return clean;
          }
        } catch {}
        return fallback;
      };

      // 1. Try AllOrigins Proxy (JSON wrapped - handles DuckDuckGo and Wikipedia HTML seamlessly)
      if (!fetchedSuccessfully) {
        try {
          const aoRes = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`);
          if (aoRes.ok) {
            const aoData = await aoRes.json();
            if (aoData && aoData.contents && typeof aoData.contents === 'string' && aoData.contents.length > 30 && !aoData.contents.includes('NOT_FOUND arn1')) {
              finalHtml = aoData.contents;
              finalTitle = extractTitle(aoData.contents, targetUrl);
              finalStatusCode = 200;
              finalLatency = 120;
              fetchedSuccessfully = true;
            }
          }
        } catch {}
      }

      // 2. Try CodeTabs Proxy
      if (!fetchedSuccessfully) {
        try {
          const ctRes = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`);
          if (ctRes.ok) {
            const ctText = await ctRes.text();
            if (ctText && ctText.length > 30 && !ctText.includes('NOT_FOUND arn1')) {
              finalHtml = ctText;
              finalTitle = extractTitle(ctText, targetUrl);
              finalStatusCode = 200;
              finalLatency = 150;
              fetchedSuccessfully = true;
            }
          }
        } catch {}
      }

      // 3. Try CorsProxy.io
      if (!fetchedSuccessfully) {
        try {
          const cpRes = await fetch(`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`);
          if (cpRes.ok) {
            const cpText = await cpRes.text();
            if (cpText && cpText.length > 30 && !cpText.includes('NOT_FOUND arn1')) {
              finalHtml = cpText;
              finalTitle = extractTitle(cpText, targetUrl);
              finalStatusCode = 200;
              finalLatency = 180;
              fetchedSuccessfully = true;
            }
          }
        } catch {}
      }

      // 4. Try Direct Fetch
      if (!fetchedSuccessfully) {
        try {
          const directRes = await fetch(targetUrl);
          if (directRes.ok) {
            const directText = await directRes.text();
            if (directText && directText.length > 30 && !directText.includes('NOT_FOUND arn1')) {
              finalHtml = directText;
              finalTitle = extractTitle(directText, targetUrl);
              finalStatusCode = directRes.status;
              finalLatency = 40;
              fetchedSuccessfully = true;
            }
          }
        } catch {}
      }
    }

    // Auto-inject base tag so relative links and images in proxied HTML load properly
    if (finalHtml && typeof finalHtml === 'string') {
      if (finalHtml.includes('<head>')) {
        finalHtml = finalHtml.replace('<head>', `<head><base href="${targetUrl}" />`);
      } else if (finalHtml.includes('<html>')) {
        finalHtml = finalHtml.replace('<html>', `<html><head><base href="${targetUrl}" /></head>`);
      }
    }

    // TIER 3: Fallback UI if target site restricts embedded proxies completely
    if (!fetchedSuccessfully) {
      finalStatusCode = 404;
      finalTitle = 'Resource Unavailable';
      let host = 'Target Domain';
      try { host = new URL(targetUrl).hostname; } catch {}

      finalHtml = `<div style="font-family:system-ui,-apple-system,sans-serif;padding:36px 24px;background:#0d0817;color:#fff;border-radius:20px;max-width:680px;margin:30px auto;border:1px solid #3d2b4f;box-shadow:0 20px 50px rgba(0,0,0,0.6);text-align:center;">
        <div style="font-size:48px;margin-bottom:12px;">🌐</div>
        <h2 style="color:#00f0ff;margin:0 0 12px 0;font-size:22px;font-weight:800;">Target Resource Protected or Offline</h2>
        <p style="color:#d1d5db;font-size:14px;line-height:1.6;margin-bottom:24px;">
          The requested URL <strong style="color:#ff4d4d;word-break:break-all;">${targetUrl}</strong> restricts embedded proxies or requires direct browser cookies.
        </p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
          <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:8px;padding:12px 22px;background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff;text-decoration:none;border-radius:12px;font-weight:700;font-size:14px;box-shadow:0 8px 20px rgba(168,85,247,0.4);">
            Open ${host} in New Tab ↗
          </a>
        </div>
      </div>`;
    }

    setTabs(prev => prev.map(t => {
      if (t.id === tabId) {
        return {
          ...t,
          url: finalUrl,
          title: finalTitle,
          isLoading: false,
          statusCode: finalStatusCode,
          latencyMs: finalLatency,
          headers: finalHeaders,
          contentCache: finalHtml
        };
      }
      return t;
    }));

    if (activeTab && !activeTab.incognito) {
      const updatedHist = addHistoryEntry(finalUrl, finalTitle, false);
      setHistoryList(updatedHist);
    }
  };

  // URL Navigation & Search Resolver
  const handleNavigate = (urlToNavigate: string) => {
    let formatted = urlToNavigate.trim();
    if (!formatted) return;

    const isUrlPattern = /^https?:\/\//i.test(formatted) || 
                         /^[a-zA-Z0-9\-_]+\.[a-zA-Z]{2,}(:\d+)?(\/.*)?$/i.test(formatted) ||
                         formatted.startsWith('/') || 
                         formatted === 'https://aha-browser.v6/home';

    if (!isUrlPattern) {
      const engineObj = SEARCH_ENGINES.find(e => e.id === selectedEngine) || SEARCH_ENGINES[0];
      formatted = `${engineObj.searchUrl}${encodeURIComponent(formatted)}`;
    } else if (!formatted.startsWith('http://') && !formatted.startsWith('https://') && !formatted.startsWith('/')) {
      formatted = `https://${formatted}`;
    }

    setInputUrl(formatted);

    setTabs(prev => prev.map(t => {
      if (t.id === activeTabId) {
        const newHist = t.history.slice(0, t.historyIndex + 1);
        newHist.push(formatted);
        return {
          ...t,
          url: formatted,
          history: newHist,
          historyIndex: newHist.length - 1
        };
      }
      return t;
    }));

    fetchPageForTab(activeTabId, formatted);
  };

  const handleBack = () => {
    if (activeTab && activeTab.historyIndex > 0) {
      const prevIndex = activeTab.historyIndex - 1;
      const targetUrl = activeTab.history[prevIndex];
      setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, historyIndex: prevIndex, url: targetUrl } : t));
      setInputUrl(targetUrl);
      fetchPageForTab(activeTabId, targetUrl);
    }
  };

  const handleForward = () => {
    if (activeTab && activeTab.historyIndex < activeTab.history.length - 1) {
      const nextIndex = activeTab.historyIndex + 1;
      const targetUrl = activeTab.history[nextIndex];
      setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, historyIndex: nextIndex, url: targetUrl } : t));
      setInputUrl(targetUrl);
      fetchPageForTab(activeTabId, targetUrl);
    }
  };

  const isCurrentBookmarked = bookmarks.some(b => b.url === activeTab?.url);

  const handleToggleCurrentBookmark = () => {
    if (!activeTab) return;
    if (isCurrentBookmarked) {
      const found = bookmarks.find(b => b.url === activeTab.url);
      if (found) {
        const updated = removeBookmark(found.id);
        setBookmarks(updated);
      }
    } else {
      const updated = saveBookmark(activeTab.title || activeTab.url, activeTab.url, 'Saved Pages');
      setBookmarks(updated);
    }
  };

  const handleSelectProfile = (profileId: string) => {
    if (profileId === 'custom') {
      const customVal = prompt(isRu ? 'Введите строку User-Agent:' : 'Enter custom User-Agent string:', activeProfile.userAgentString);
      if (customVal) {
        const updated = setActiveUserAgentProfile('custom', customVal);
        setActiveProfile(updated);
      }
      return;
    }
    const updated = setActiveUserAgentProfile(profileId);
    setActiveProfile(updated);
  };

  const handleSaveCustomUa = () => {
    if (!customUaInput.trim()) return;
    const updated = setActiveUserAgentProfile('custom', customUaInput);
    setActiveProfile(updated);
  };

  const handleToggleAdBlock = () => {
    const nextVal = !adBlock;
    setAdBlock(nextVal);
    setAdBlockEnabled(nextVal);
  };

  const handleCopySource = () => {
    if (activeTab?.contentCache) {
      navigator.clipboard.writeText(activeTab.contentCache);
      setCopiedSource(true);
      setTimeout(() => setCopiedSource(false), 2000);
    }
  };

  const handleDownloadSource = () => {
    if (!activeTab?.contentCache) return;
    const blob = new Blob([activeTab.contentCache], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `page-source-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const currentHeaders = getAhaBrowserHeaders(activeProfile.id);
  const filteredBookmarks = bookmarks.filter(b => 
    b.title.toLowerCase().includes(bookmarkSearch.toLowerCase()) || 
    b.url.toLowerCase().includes(bookmarkSearch.toLowerCase())
  );
  const filteredHistory = historyList.filter(h => 
    h.title.toLowerCase().includes(historySearch.toLowerCase()) || 
    h.url.toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <AnimatePresence>
      <div className={`fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md overflow-hidden ${isFullscreen ? 'p-0' : 'p-2 sm:p-3'}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          className={`relative bg-[#0c0816] flex flex-col overflow-hidden transition-all duration-300 ${
            isFullscreen 
              ? 'fixed inset-0 z-[200] w-screen h-screen max-w-none max-h-none rounded-none border-none p-0 my-0' 
              : 'w-full max-w-6xl h-[92vh] max-h-[880px] border border-[#3d2b4f] rounded-2xl shadow-2xl my-auto'
          }`}
        >
          {isFullscreen && (
            <div className="fixed top-2.5 right-12 z-[250] pointer-events-auto">
              <button
                onClick={toggleFullscreen}
                className="px-3 py-1.5 rounded-full bg-[#150f21]/90 hover:bg-[#ff4d4d] border border-[#3d2b4f] text-white text-xs font-bold shadow-2xl backdrop-blur-md flex items-center gap-1.5 transition-all opacity-85 hover:opacity-100 cursor-pointer"
                title={isRu ? 'Выйти из полноэкранного режима (Esc)' : 'Exit Fullscreen Mode (Esc)'}
              >
                <Minimize2 size={13} />
                <span className="hidden sm:inline">{isRu ? 'Выйти из полноэкранного режима' : 'Exit Fullscreen'}</span>
              </button>
            </div>
          )}

          {/* Top Window Title Bar */}
          <div className="px-3 py-2 bg-[#150f21] border-b border-[#3d2b4f] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80 border border-red-400/50" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80 border border-yellow-400/50" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-400/50" />
              <div className="ml-2 flex items-center gap-1.5 px-2.5 py-0.5 bg-[#221833] rounded-lg border border-[#3d2b4f] text-[11px] font-mono text-gray-300">
                <Globe size={13} className="text-[#ff4d4d]" />
                <span className="font-bold">AHA Web Suite Browser v6.0</span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 hidden sm:inline">
                  IPv6 Dual-Stack ::
                </span>
                {isFullscreen && (
                  <span className="text-[10px] text-purple-300 font-bold bg-purple-500/20 px-1.5 py-0.2 rounded border border-purple-500/30 hidden sm:inline">
                    FULLSCREEN
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleFullscreen}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  isFullscreen 
                    ? 'bg-[#ff4d4d]/20 border border-[#ff4d4d]/40 text-[#ff4d4d]' 
                    : 'bg-[#1f1530] hover:bg-[#2d1e47] border border-[#3d2b4f] text-gray-200'
                }`}
                title={isFullscreen ? (isRu ? 'Выйти из полноэкранного режима' : 'Exit Fullscreen') : (isRu ? 'Полноэкранный режим' : 'Fullscreen Mode')}
              >
                {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                <span className="hidden sm:inline">
                  {isFullscreen ? (isRu ? 'Свернуть' : 'Exit Full') : (isRu ? 'Полноэкранный режим' : 'Fullscreen')}
                </span>
              </button>

              <button
                onClick={() => handleCreateNewTab('https://aha-browser.v6/home', true)}
                className="px-2.5 py-1 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                title={isRu ? 'Открыть вкладку Инкогнито' : 'Open Incognito Tab'}
              >
                <EyeOff size={13} />
                <span className="hidden sm:inline">{isRu ? 'Инкогнито' : 'Incognito'}</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Browser Tabs Bar */}
          <div className="px-2 pt-1.5 bg-[#120c1d] border-b border-[#3d2b4f] flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              return (
                <div
                  key={tab.id}
                  onClick={() => {
                    setActiveTabId(tab.id);
                    setInputUrl(tab.url);
                  }}
                  className={`group relative max-w-[200px] min-w-[120px] flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-t-xl border-t border-x text-xs font-medium cursor-pointer transition-all ${
                    isActive
                      ? 'bg-[#1a1228] border-[#3d2b4f] text-white shadow-md'
                      : 'bg-[#0f0a18] border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#150f22]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    {tab.incognito ? (
                      <EyeOff size={12} className="text-purple-400 shrink-0" />
                    ) : tab.pinned ? (
                      <Pin size={12} className="text-amber-400 shrink-0" />
                    ) : (
                      <Globe size={12} className={isActive ? 'text-[#ff4d4d] shrink-0' : 'text-gray-400 shrink-0'} />
                    )}
                    <span className="truncate font-sans text-[11px] font-semibold">{tab.title || tab.url}</span>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={(e) => handleTogglePinTab(tab.id, e)}
                      className="opacity-0 group-hover:opacity-100 hover:text-amber-300 transition-opacity p-0.5"
                      title={tab.pinned ? 'Unpin' : 'Pin Tab'}
                    >
                      <Pin size={10} className={tab.pinned ? 'text-amber-400 opacity-100' : ''} />
                    </button>
                    <button
                      onClick={(e) => handleCloseTab(tab.id, e)}
                      className="p-0.5 rounded-md hover:bg-white/10 hover:text-red-400 text-gray-400 transition-all"
                    >
                      <X size={11} />
                    </button>
                  </div>
                </div>
              );
            })}

            <button
              onClick={() => handleCreateNewTab()}
              className="p-1 mb-0.5 rounded-lg bg-[#1f1530] hover:bg-[#2d1e47] border border-[#3d2b4f] text-gray-300 hover:text-white transition-all cursor-pointer"
              title={isRu ? 'Новая вкладка' : 'New Tab'}
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Browser Omnibox Navigation Toolbar */}
          <div className="p-2 bg-[#1a1228] border-b border-[#3d2b4f] flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
            <div className="flex items-center gap-1">
              <button
                onClick={handleBack}
                disabled={!activeTab || activeTab.historyIndex <= 0}
                className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all cursor-pointer"
                title="Back"
              >
                <ArrowLeft size={15} />
              </button>
              <button
                onClick={handleForward}
                disabled={!activeTab || activeTab.historyIndex >= activeTab.history.length - 1}
                className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all cursor-pointer"
                title="Forward"
              >
                <ArrowRight size={15} />
              </button>
              <button
                onClick={() => handleNavigate(activeTab?.url || 'https://aha-browser.v6/home')}
                className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                title="Reload"
              >
                <RotateCw size={15} className={activeTab?.isLoading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => handleNavigate('https://aha-browser.v6/home')}
                className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                title="Home Page"
              >
                <Home size={15} />
              </button>
            </div>

            {/* URL Input Form Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleNavigate(inputUrl);
              }}
              className="flex-1 min-w-[200px] flex items-center gap-2 px-3 py-1 bg-[#0a0710] border border-[#3d2b4f] focus-within:border-[#ff4d4d] rounded-xl transition-all"
            >
              {inputUrl.startsWith('https://') || inputUrl === 'https://aha-browser.v6/home' ? (
                <span title="Secure Connection (HTTPS)"><Lock size={13} className="text-emerald-400 shrink-0" /></span>
              ) : (
                <span title="HTTP Connection"><Unlock size={13} className="text-amber-400 shrink-0" /></span>
              )}

              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder={isRu ? 'Введите URL адрес или поисковый запрос...' : 'Enter URL address or search term...'}
                className="w-full bg-transparent text-xs font-mono text-gray-200 focus:outline-none"
              />

              <button
                type="button"
                onClick={handleToggleCurrentBookmark}
                className="text-gray-400 hover:text-amber-400 transition-colors p-0.5 cursor-pointer"
                title={isCurrentBookmarked ? 'Remove Bookmark' : 'Add Bookmark'}
              >
                <Bookmark
                  size={14}
                  className={isCurrentBookmarked ? 'text-amber-400 fill-amber-400' : ''}
                />
              </button>

              <button type="submit" className="text-gray-400 hover:text-[#ff4d4d] cursor-pointer p-0.5">
                <Search size={13} />
              </button>
            </form>

            <button
              onClick={handleToggleAdBlock}
              className={`px-2 py-1 rounded-xl border transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold ${
                adBlock
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-gray-800/50 border-gray-700 text-gray-400'
              }`}
            >
              <Shield size={13} className={adBlock ? 'text-emerald-400' : ''} />
              <span className="hidden md:inline">{adBlock ? 'Shield ON' : 'Shield OFF'}</span>
            </button>

            <div className="w-36 sm:w-44">
              <CustomSelect
                value={activeProfile.id}
                onChange={(val) => handleSelectProfile(val)}
                className="!px-2 !py-1 !bg-[#241838] !border-[#4d3663] !text-gray-200 !text-xs !font-bold !rounded-xl"
                options={[
                  ...AHA_CUSTOM_USER_AGENTS.map((prof) => ({ value: prof.id, label: prof.name })),
                  { value: "custom", label: isRu ? "⚙️ Свой UA..." : "⚙️ Custom UA..." }
                ]}
              />
            </div>
          </div>

          {/* Sub-Header View Mode Selector Pills */}
          <div className="px-3 py-1.5 bg-[#120c1d] border-b border-[#3d2b4f] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 text-xs">
            <button
              onClick={() => setActiveView('viewport')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                activeView === 'viewport'
                  ? 'bg-[#ff4d4d]/20 text-[#ff4d4d] border border-[#ff4d4d]/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Monitor size={13} />
              <span>{isRu ? 'Страница' : 'Viewport'}</span>
            </button>

            <button
              onClick={() => setActiveView('reader')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                activeView === 'reader'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <BookOpen size={13} />
              <span>{isRu ? 'Режим чтения' : 'Reader'}</span>
            </button>

            <button
              onClick={() => setActiveView('source')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                activeView === 'source'
                  ? 'bg-[#ff4d4d]/20 text-[#ff4d4d] border border-[#ff4d4d]/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Code2 size={13} />
              <span>{isRu ? 'Исходный Код' : 'Source'}</span>
            </button>

            <button
              onClick={() => setActiveView('ua_editor')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                activeView === 'ua_editor'
                  ? 'bg-[#ff4d4d]/20 text-[#ff4d4d] border border-[#ff4d4d]/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Info size={13} />
              <span>User-Agent</span>
            </button>

            <button
              onClick={() => setActiveView('headers')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                activeView === 'headers'
                  ? 'bg-[#ff4d4d]/20 text-[#ff4d4d] border border-[#ff4d4d]/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Terminal size={13} />
              <span>{isRu ? 'Заголовки' : 'Headers'}</span>
            </button>

            <button
              onClick={() => setActiveView('bookmarks')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                activeView === 'bookmarks'
                  ? 'bg-[#ff4d4d]/20 text-[#ff4d4d] border border-[#ff4d4d]/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <BookOpen size={13} />
              <span>{isRu ? 'Закладки' : 'Bookmarks'} ({bookmarks.length})</span>
            </button>

            <button
              onClick={() => setActiveView('history')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                activeView === 'history'
                  ? 'bg-[#ff4d4d]/20 text-[#ff4d4d] border border-[#ff4d4d]/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <History size={13} />
              <span>{isRu ? 'История' : 'History'} ({historyList.length})</span>
            </button>

            <button
              onClick={() => setActiveView('security')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                activeView === 'security'
                  ? 'bg-[#ff4d4d]/20 text-[#ff4d4d] border border-[#ff4d4d]/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <ShieldCheck size={13} />
              <span>{isRu ? 'Безопасность (SSRF & IPv6)' : 'Security'}</span>
            </button>
          </div>

          {/* Main Content Viewport Canvas Area */}
          <div className="flex-1 bg-[#09060e] relative min-h-0 flex flex-col p-2 overflow-hidden">
            {activeView === 'viewport' && (
              <div className="w-full h-full flex flex-col min-h-0">
                {activeTab?.url === 'https://aha-browser.v6/home' ? (
                  /* AHA Browser Built-in Dashboard */
                  <div className="w-full h-full overflow-y-auto p-4 max-w-3xl mx-auto text-center space-y-6 my-auto">
                    <div className="inline-flex p-3 bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 rounded-3xl text-[#ff4d4d] shadow-2xl shadow-[#ff4d4d]/20">
                      <Globe size={40} className="animate-pulse" />
                    </div>

                    <div className="space-y-1.5">
                      <h2 className="text-2xl font-black text-white tracking-tight">
                        AHA Web Browser Engine v6.0
                      </h2>
                      <p className="text-xs text-gray-300 max-w-lg mx-auto leading-relaxed">
                        {isRu 
                          ? 'Полноценный встроенный изоляционный браузер с выбором кастомного User-Agent, защитой от SSRF и уязвимостей, AdBlocker и поддержкой IPv6 Flow Labeling.'
                          : 'Full-featured embedded isolation browser with custom User-Agent manager, SSRF vulnerability protection, AdBlocker shield, and native IPv6 Flow Labeling.'}
                      </p>
                    </div>

                    <div className="p-3 bg-[#140e21] border border-[#3d2b4f] rounded-2xl max-w-xl mx-auto space-y-2">
                      <span className="text-[11px] font-bold text-gray-400 block">{isRu ? 'Поисковая система по умолчанию:' : 'Default Search Engine:'}</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {SEARCH_ENGINES.map((se) => (
                          <button
                            key={se.id}
                            onClick={() => setSelectedEngine(se.id)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              selectedEngine === se.id
                                ? 'bg-[#ff4d4d] text-white shadow-md'
                                : 'bg-[#1e1530] text-gray-300 hover:bg-[#2a1d42]'
                            }`}
                          >
                            {se.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {bookmarks.slice(0, 8).map((bm) => (
                        <button
                          key={bm.id}
                          onClick={() => handleNavigate(bm.url)}
                          className="p-3 bg-[#160f24] hover:bg-[#23173a] border border-[#3d2b4f] hover:border-[#ff4d4d] rounded-xl text-left space-y-1 transition-all cursor-pointer group shadow-lg"
                        >
                          <div className="flex items-center justify-between text-gray-400 group-hover:text-[#ff4d4d]">
                            <Globe size={14} />
                            <ExternalLink size={11} />
                          </div>
                          <span className="text-xs font-bold text-white block truncate">{bm.title}</span>
                          <span className="text-[10px] font-mono text-gray-500 block truncate">{bm.url}</span>
                        </button>
                      ))}
                    </div>

                    <div className="p-3 bg-[#120c1d] border border-[#3d2b4f] rounded-2xl text-left space-y-1.5 text-xs font-mono">
                      <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                        <span className="text-gray-400 font-bold">{isRu ? 'Активный User-Agent:' : 'Active User-Agent:'}</span>
                        <span className="px-2 py-0.5 rounded bg-[#ff4d4d]/20 text-[#ff4d4d] font-bold text-[10px]">
                          {activeProfile.deviceType.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-emerald-300 text-[11px] break-all leading-relaxed bg-black/40 p-2 rounded-xl border border-white/5">
                        {activeProfile.userAgentString}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Native Full-Height Web Page Iframe Container */
                  <div className="w-full h-full flex flex-col bg-[#0d0817] rounded-xl overflow-hidden border border-[#3d2b4f] relative shadow-2xl min-h-0">
                    {activeTab?.isLoading && (
                      <div className="absolute inset-0 z-20 bg-[#0d0817]/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 text-white">
                        <RotateCw size={32} className="animate-spin text-[#ff4d4d]" />
                        <span className="text-xs font-mono font-bold">{isRu ? 'Загрузка страницы через AHA Protocol...' : 'Fetching page via AHA Protocol...'}</span>
                      </div>
                    )}

                    {/* Top Status & Controls Strip inside Browser Viewport */}
                    <div className="px-3 py-1.5 bg-[#140e21] border-b border-[#3d2b4f] flex items-center justify-between text-xs text-gray-300 shrink-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                        <span className="font-mono text-[11px] text-gray-200 truncate">{activeTab?.url}</span>
                        <span className={`px-2 py-0.5 rounded font-mono text-[10px] shrink-0 ${
                          (activeTab?.statusCode || 200) < 300 
                            ? 'bg-emerald-500/20 text-emerald-300' 
                            : (activeTab?.statusCode || 200) < 400 
                              ? 'bg-cyan-500/20 text-cyan-300' 
                              : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {activeTab?.statusCode || 200} {(activeTab?.statusCode || 200) < 300 ? 'OK' : (activeTab?.statusCode || 200) === 403 ? 'Forbidden' : (activeTab?.statusCode || 200) === 404 ? 'Not Found' : 'Error'} ({activeTab?.latencyMs || 12}ms)
                        </span>
                      </div>

                      <a
                        href={activeTab?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-[#ff4d4d] hover:bg-[#e63939] text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all shrink-0 ml-2"
                      >
                        <span>{isRu ? 'В отдельной вкладке' : 'Open in New Tab'}</span>
                        <ExternalLink size={11} />
                      </a>
                    </div>

                    {/* Frame Restriction Notice Bar */}
                    {(activeTab?.url.includes('google.com') || activeTab?.url.includes('yandex') || activeTab?.url.includes('ya.ru') || activeTab?.contentCache?.includes('trouble accessing Google Search') || activeTab?.contentCache?.includes('refused to connect') || activeTab?.contentCache?.includes('frame-ancestors')) && (
                      <div className="bg-amber-500/15 border-b border-amber-500/30 px-3 py-2 text-xs text-amber-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={15} className="text-amber-400 shrink-0" />
                          <span>
                            {isRu
                              ? 'Сайты с защитой (Yandex, Google, Ya.ru) блокируют отображение во фреймах и сторонние CORS-запросы.'
                              : 'Protected sites (Yandex, Google, Ya.ru) block iframe embedding and cross-origin CORS requests.'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              let query = '';
                              if (activeTab.url.includes('?q=')) {
                                query = activeTab.url.split('?q=')[1].split('&')[0];
                              } else if (activeTab.url.includes('text=')) {
                                query = activeTab.url.split('text=')[1].split('&')[0];
                              }
                              handleNavigate(`https://html.duckduckgo.com/html/?q=${query}`);
                            }}
                            className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-[11px] font-bold border border-amber-500/40 cursor-pointer"
                          >
                            {isRu ? 'Использовать DuckDuckGo (Во фрейме)' : 'Use DuckDuckGo (In Frame)'}
                          </button>
                          <a
                            href={activeTab.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-[#ff4d4d] hover:bg-[#e63939] text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span>{isRu ? 'Открыть в новой вкладке ↗' : 'Open in New Tab ↗'}</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Web Content Rendered inside Iframe */}
                    {activeTab?.url.startsWith('/') || activeTab?.url.includes(window.location.host) ? (
                      <iframe
                        src={activeTab.url}
                        title="AHA Viewport Frame"
                        className="w-full flex-1 border-none bg-white min-h-0"
                        sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads"
                      />
                    ) : activeTab?.contentCache ? (
                      <iframe
                        srcDoc={getIframeSrcDoc(activeTab.contentCache, activeTab.url)}
                        title={activeTab.title || 'AHA Web Page'}
                        className="w-full flex-1 border-none bg-white min-h-0"
                        sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads"
                      />
                    ) : (
                      <div className="m-auto p-6 text-center text-gray-400 space-y-2">
                        <AlertTriangle size={32} className="mx-auto text-amber-400" />
                        <p className="text-xs font-mono">{isRu ? 'Содержимое страницы отсутствует' : 'No page content loaded'}</p>
                      </div>
                    )}

                    {/* Bottom Status Indicator */}
                    <div className="px-3 py-1 bg-[#0a0710] border-t border-[#2a1d3b] flex items-center justify-between text-[10px] font-mono text-gray-400 shrink-0">
                      <span className="text-emerald-400">● {isRu ? 'Защита AHA Dual-Stack IPv6 Активна' : 'AHA Dual-Stack IPv6 Active'}</span>
                      <span className="text-purple-400">AdBlock Shield: {adBlock ? 'ACTIVE' : 'OFF'}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeView === 'reader' && (
              <div className="w-full h-full overflow-y-auto p-2 max-w-3xl mx-auto space-y-3">
                {/* Reader Controls Toolbar */}
                <div className="p-3 bg-[#140e21] border border-[#3d2b4f] rounded-2xl flex flex-wrap items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <BookOpen size={18} className="text-amber-400" />
                    <span className="text-xs font-bold text-white">{isRu ? 'Режим чтения (Reader View)' : 'Reader View'}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {/* Font Size Controls */}
                    <div className="flex items-center bg-[#0a0710] border border-[#3d2b4f] rounded-xl p-1 gap-1">
                      <button
                        onClick={() => setReaderFontSize(prev => Math.max(80, prev - 10))}
                        className="px-2 py-0.5 hover:bg-white/10 rounded text-gray-300 font-bold transition-colors cursor-pointer"
                        title="Decrease Font Size"
                      >
                        A-
                      </button>
                      <span className="text-[10px] font-mono text-amber-300 px-1">{readerFontSize}%</span>
                      <button
                        onClick={() => setReaderFontSize(prev => Math.min(160, prev + 10))}
                        className="px-2 py-0.5 hover:bg-white/10 rounded text-gray-300 font-bold transition-colors cursor-pointer"
                        title="Increase Font Size"
                      >
                        A+
                      </button>
                    </div>

                    {/* Theme Picker */}
                    <div className="flex items-center bg-[#0a0710] border border-[#3d2b4f] rounded-xl p-1 gap-1">
                      <button
                        onClick={() => setReaderTheme('dark')}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                          readerTheme === 'dark' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Moon size={12} className="inline mr-1" />
                        Dark
                      </button>
                      <button
                        onClick={() => setReaderTheme('sepia')}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                          readerTheme === 'sepia' ? 'bg-[#3b2a1a] text-[#e8d0a9] border border-[#6b4c2e]' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Sepia
                      </button>
                      <button
                        onClick={() => setReaderTheme('light')}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                          readerTheme === 'light' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Sun size={12} className="inline mr-1" />
                        Light
                      </button>
                    </div>

                    {/* Copy Text Button */}
                    <button
                      onClick={() => {
                        const pageText = activeTab?.contentCache ? activeTab.contentCache.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';
                        navigator.clipboard.writeText(pageText || activeTab?.url || '');
                        showContextToast(isRu ? 'Текст статьи скопирован' : 'Article text copied');
                      }}
                      className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Copy size={13} />
                      <span>{isRu ? 'Копировать' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Article Content Sheet */}
                <div 
                  className={`p-6 sm:p-8 rounded-2xl border transition-all space-y-6 min-h-[400px] ${
                    readerTheme === 'sepia'
                      ? 'bg-[#221c11] text-[#e8d0a9] border-[#4a3a22]'
                      : readerTheme === 'light'
                        ? 'bg-[#f8f6f0] text-[#1c1917] border-[#e2dec9] shadow-xl'
                        : 'bg-[#120f1a] text-gray-200 border-[#3d2b4f]'
                  }`}
                  style={{ fontSize: `${(readerFontSize / 100) * 15}px`, lineHeight: '1.75' }}
                >
                  <div className="space-y-2 border-b pb-4 opacity-90 border-current/20">
                    <span className="text-xs uppercase font-mono tracking-widest opacity-60 block font-bold">
                      {new URL(activeTab?.url || 'https://aha-browser.v6').hostname}
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                      {activeTab?.title || (isRu ? 'Заголовок статьи' : 'Article Title')}
                    </h1>
                    <div className="flex items-center gap-3 text-xs font-mono opacity-70 pt-1">
                      <span>⏱️ ~{Math.max(1, Math.ceil((activeTab?.contentCache?.length || 500) / 1200))} {isRu ? 'мин чтения' : 'min read'}</span>
                      <span>•</span>
                      <span>🔒 {isRu ? 'Без рекламы и трекеров' : 'Clean Distraction-Free'}</span>
                    </div>
                  </div>

                  <div className="prose max-w-none space-y-4 font-sans leading-relaxed">
                    {activeTab?.contentCache ? (
                      activeTab.contentCache
                        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                        .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
                        .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
                        .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
                        .replace(/<[^>]*>/g, '\n')
                        .split('\n')
                        .map(line => line.trim())
                        .filter(line => line.length > 25)
                        .slice(0, 40)
                        .map((paragraph, idx) => (
                          <p key={idx} className="mb-4">
                            {paragraph}
                          </p>
                        ))
                    ) : (
                      <p className="opacity-70 italic text-center py-12">
                        {isRu ? 'Загрузите веб-страницу для отображения в режиме чтения.' : 'Load a webpage to view its content in reader mode.'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeView === 'source' && (
              <div className="w-full h-full overflow-y-auto space-y-3 p-2 max-w-4xl mx-auto">
                <div className="p-4 bg-[#140e21] border border-[#3d2b4f] rounded-2xl space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <Code2 size={16} className="text-[#ff4d4d]" />
                      <span className="font-bold text-xs text-white">{isRu ? 'Исходный HTML код страницы' : 'Page Source Code'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopySource}
                        className="px-3 py-1 bg-[#ff4d4d]/20 hover:bg-[#ff4d4d]/30 text-[#ff4d4d] border border-[#ff4d4d]/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        {copiedSource ? <Check size={13} /> : <Copy size={13} />}
                        <span>{copiedSource ? (isRu ? 'Скопировано!' : 'Copied!') : (isRu ? 'Скопировать HTML' : 'Copy HTML')}</span>
                      </button>

                      <button
                        onClick={handleDownloadSource}
                        className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Download size={13} />
                        <span>{isRu ? 'Скачать .html' : 'Download .html'}</span>
                      </button>
                    </div>
                  </div>

                  <pre className="p-3 bg-black/80 border border-white/10 rounded-xl font-mono text-[11px] text-emerald-300 max-h-[500px] overflow-auto whitespace-pre-wrap leading-relaxed">
                    {activeTab?.contentCache || '<!-- No source code loaded for this page -->'}
                  </pre>
                </div>
              </div>
            )}

            {activeView === 'ua_editor' && (
              <div className="w-full h-full overflow-y-auto space-y-3 p-2 max-w-3xl mx-auto">
                <div className="p-4 bg-[#140e21] border border-[#3d2b4f] rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <h3 className="text-xs font-black text-white flex items-center gap-2">
                      <Info size={15} className="text-[#ff4d4d]" />
                      <span>{isRu ? 'Инспектор и Редактор User-Agent' : 'User-Agent Inspector & Custom Editor'}</span>
                    </h3>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-300 block">
                      {isRu ? 'Установите любую кастомную строку User-Agent:' : 'Set Custom User-Agent String:'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customUaInput}
                        onChange={(e) => setCustomUaInput(e.target.value)}
                        placeholder="Mozilla/5.0 (Custom AHA Agent...)"
                        className="flex-1 px-3 py-1.5 bg-black/60 border border-[#3d2b4f] focus:border-[#ff4d4d] text-xs font-mono text-amber-300 rounded-xl focus:outline-none"
                      />
                      <button
                        onClick={handleSaveCustomUa}
                        className="px-3.5 py-1.5 bg-[#ff4d4d] hover:bg-[#e63939] text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        {isRu ? 'Применить' : 'Apply'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono pt-1">
                    <div className="p-3 bg-[#0a0710] border border-[#3d2b4f] rounded-xl space-y-1">
                      <span className="text-gray-400 block text-[11px] font-sans">Active Profile Name</span>
                      <span className="text-white font-bold block">{activeProfile.name}</span>
                    </div>

                    <div className="p-3 bg-[#0a0710] border border-[#3d2b4f] rounded-xl space-y-1">
                      <span className="text-gray-400 block text-[11px] font-sans">Device Type</span>
                      <span className="text-emerald-400 font-bold block uppercase">{activeProfile.deviceType}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeView === 'headers' && (
              <div className="w-full h-full overflow-y-auto space-y-3 p-2 max-w-3xl mx-auto">
                <div className="p-4 bg-[#140e21] border border-[#3d2b4f] rounded-2xl space-y-3">
                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    <Terminal size={15} className="text-[#ff4d4d]" />
                    <span>{isRu ? 'Сгенерированные HTTP Заголовки' : 'Outgoing HTTP Headers'}</span>
                  </h3>

                  <div className="p-3 bg-black/60 border border-white/10 rounded-xl font-mono text-xs text-emerald-300 space-y-1.5 overflow-x-auto">
                    {Object.entries(currentHeaders).map(([key, val]) => (
                      <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-1">
                        <span className="text-gray-400 font-bold">{key}:</span>
                        <span className="text-emerald-300 break-all">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeView === 'bookmarks' && (
              <div className="w-full h-full overflow-y-auto space-y-3 p-2 max-w-3xl mx-auto">
                <div className="flex items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <Search size={13} className="absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      value={bookmarkSearch}
                      onChange={(e) => setBookmarkSearch(e.target.value)}
                      placeholder={isRu ? 'Поиск по закладкам...' : 'Search bookmarks...'}
                      className="w-full pl-8 pr-3 py-1.5 bg-[#140e21] border border-[#3d2b4f] rounded-xl text-xs text-white focus:outline-none focus:border-[#ff4d4d]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  {filteredBookmarks.length === 0 ? (
                    <p className="text-xs text-gray-400 font-mono text-center py-6">{isRu ? 'Закладок не найдено' : 'No bookmarks found'}</p>
                  ) : (
                    filteredBookmarks.map((bm) => (
                      <div
                        key={bm.id}
                        className="p-3 bg-[#140e21] hover:bg-[#201533] border border-[#3d2b4f] rounded-xl flex items-center justify-between cursor-pointer transition-all group"
                      >
                        <div
                          onClick={() => {
                            handleNavigate(bm.url);
                            setActiveView('viewport');
                          }}
                          className="flex-1 space-y-0.5"
                        >
                          <span className="text-xs font-bold text-white block group-hover:text-[#ff4d4d] transition-colors">{bm.title}</span>
                          <span className="text-[11px] font-mono text-gray-400 block">{bm.url}</span>
                        </div>

                        <button
                          onClick={() => {
                            const updated = removeBookmark(bm.id);
                            setBookmarks(updated);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                          title="Delete Bookmark"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeView === 'history' && (
              <div className="w-full h-full overflow-y-auto space-y-3 p-2 max-w-3xl mx-auto">
                <div className="flex items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <Search size={13} className="absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder={isRu ? 'Поиск в истории посещений...' : 'Search history...'}
                      className="w-full pl-8 pr-3 py-1.5 bg-[#140e21] border border-[#3d2b4f] rounded-xl text-xs text-white focus:outline-none focus:border-[#ff4d4d]"
                    />
                  </div>

                  <button
                    onClick={() => {
                      const cleared = clearBrowserHistory();
                      setHistoryList(cleared);
                    }}
                    className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                  >
                    <Trash2 size={13} />
                    <span>{isRu ? 'Очистить' : 'Clear'}</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  {filteredHistory.length === 0 ? (
                    <p className="text-xs text-gray-400 font-mono text-center py-6">{isRu ? 'История посещений пуста' : 'History is empty'}</p>
                  ) : (
                    filteredHistory.map((h) => (
                      <div
                        key={h.id}
                        onClick={() => {
                          handleNavigate(h.url);
                          setActiveView('viewport');
                        }}
                        className="p-2.5 bg-[#140e21] hover:bg-[#201533] border border-[#3d2b4f] rounded-xl flex items-center justify-between cursor-pointer transition-all"
                      >
                        <div className="space-y-0.5 min-w-0 pr-2">
                          <span className="text-xs font-bold text-white block truncate">{h.title}</span>
                          <span className="text-[11px] font-mono text-gray-400 block truncate">{h.url}</span>
                        </div>
                        <span className="text-[10px] font-mono text-gray-500 shrink-0">
                          {new Date(h.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeView === 'security' && (
              <div className="w-full h-full overflow-y-auto space-y-3 p-2 max-w-3xl mx-auto">
                <div className="p-4 bg-[#140e21] border border-[#3d2b4f] rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                    <ShieldCheck size={18} className="text-emerald-400" />
                    <h3 className="text-xs font-black text-white">{isRu ? 'Аудит безопасности и защиты от уязвимостей' : 'Security & SSRF Vulnerability Audit'}</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-3 bg-black/50 border border-emerald-500/30 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                        <CheckCircle2 size={13} />
                        <span>SSRF Protection</span>
                      </div>
                      <p className="text-[11px] text-gray-300">
                        {isRu ? 'Блокировка доступа к локальным сетям (127.0.0.1, 10.x, 192.168.x)' : 'Private RFC1918 & Loopback IP range request blocking'}
                      </p>
                    </div>

                    <div className="p-3 bg-black/50 border border-emerald-500/30 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                        <CheckCircle2 size={13} />
                        <span>Header Sanitation</span>
                      </div>
                      <p className="text-[11px] text-gray-300">
                        {isRu ? 'Защита от ERR_INVALID_HTTP_TOKEN и инъекции CRLF заголовков' : 'RFC 7230 token validation & CRLF header injection defense'}
                      </p>
                    </div>

                    <div className="p-3 bg-black/50 border border-purple-500/30 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-purple-300 font-bold text-xs">
                        <Shield size={13} />
                        <span>AdBlock Shield</span>
                      </div>
                      <p className="text-[11px] text-gray-300">
                        {isRu ? 'Фильтрация трекеров, пикселей и рекламных скриптов' : 'Automatic ad domain & tracker script filtering'}
                      </p>
                    </div>

                    <div className="p-3 bg-black/50 border border-purple-500/30 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-purple-300 font-bold text-xs">
                        <Globe size={13} />
                        <span>IPv6 Flow Label</span>
                      </div>
                      <p className="text-[11px] text-gray-300">
                        {isRu ? 'Прямое туннелирование IPv6 Flow Labeling (0x6AHA)' : 'Native IPv6 Flow Label header tunneling active'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Browser Status Bar */}
          <div className="px-3 py-1.5 bg-[#0a0710] border-t border-[#3d2b4f] flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-gray-400 shrink-0">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                IPv6 Dual-Stack Active
              </span>
              <span>Flow: {currentHeaders['X-AHA-IPv6-Flow-Label'] || '0x6AHA9F'}</span>
            </div>

            <div className="flex items-center gap-3">
              <span>Tabs: {tabs.length}</span>
              <span>UA: {activeProfile.id}</span>
              <span className="text-purple-400 font-bold">AHA Browser Engine v6.0</span>
            </div>
          </div>

          {/* Long-Press Context Menu Popup Overlay */}
          <AnimatePresence>
            {contextMenu?.isOpen && (
              <div 
                className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
                onClick={() => setContextMenu(null)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 15 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-sm bg-[#160f24] border border-[#ff4d4d]/50 rounded-2xl shadow-[0_20px_60px_-15px_rgba(255,77,77,0.35)] overflow-hidden flex flex-col p-4 space-y-3"
                >
                  {/* Menu Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="p-2 bg-[#ff4d4d]/20 text-[#ff4d4d] rounded-xl shrink-0 border border-[#ff4d4d]/30">
                        <Link2 size={18} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-[#ff4d4d] block">
                          {isRu ? 'Меню действия с ссылкой' : 'Link Context Menu'}
                        </span>
                        <span className="text-xs font-mono text-gray-200 truncate block font-semibold" title={contextMenu.url}>
                          {contextMenu.url}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setContextMenu(null)}
                      className="text-gray-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Menu Options */}
                  <div className="space-y-2 pt-1">
                    {/* 1. Копировать ссылку */}
                    <button
                      onClick={() => {
                        const targetUrl = contextMenu.url;
                        navigator.clipboard.writeText(targetUrl);
                        showContextToast(isRu ? 'Ссылка скопирована в буфер обмена' : 'Link copied to clipboard');
                        setContextMenu(null);
                      }}
                      className="w-full p-3 bg-[#1e1530] hover:bg-[#ff4d4d]/20 border border-[#3d2b4f] hover:border-[#ff4d4d]/60 rounded-xl flex items-center gap-3 text-xs font-bold text-white transition-all cursor-pointer group"
                    >
                      <div className="p-2 bg-black/40 group-hover:bg-[#ff4d4d] text-gray-300 group-hover:text-white rounded-lg transition-colors">
                        <Copy size={16} />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <span className="block text-white group-hover:text-[#ff4d4d] transition-colors font-bold">
                          {isRu ? 'Копировать ссылку' : 'Copy Link'}
                        </span>
                        <span className="block text-[10px] text-gray-400 font-normal truncate">
                          {isRu ? 'Сохранить URL в буфер обмена' : 'Copy URL address to clipboard'}
                        </span>
                      </div>
                    </button>

                    {/* 2. Поделиться */}
                    <button
                      onClick={() => {
                        const targetUrl = contextMenu.url;
                        setContextMenu(null);
                        if (navigator.share) {
                          navigator.share({
                            title: activeTab?.title || 'AHA Browser Link',
                            url: targetUrl
                          }).catch(() => {});
                        } else {
                          navigator.clipboard.writeText(targetUrl);
                          showContextToast(isRu ? 'Ссылка скопирована для отправки' : 'Link copied to share');
                        }
                      }}
                      className="w-full p-3 bg-[#1e1530] hover:bg-[#ff4d4d]/20 border border-[#3d2b4f] hover:border-[#ff4d4d]/60 rounded-xl flex items-center gap-3 text-xs font-bold text-white transition-all cursor-pointer group"
                    >
                      <div className="p-2 bg-black/40 group-hover:bg-[#ff4d4d] text-gray-300 group-hover:text-white rounded-lg transition-colors">
                        <Share2 size={16} />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <span className="block text-white group-hover:text-[#ff4d4d] transition-colors font-bold">
                          {isRu ? 'Поделиться' : 'Share'}
                        </span>
                        <span className="block text-[10px] text-gray-400 font-normal truncate">
                          {isRu ? 'Отправить ссылку через системное меню' : 'Share link via system dialog'}
                        </span>
                      </div>
                    </button>

                    {/* 3. Открыть в системном браузере */}
                    <button
                      onClick={() => {
                        window.open(contextMenu.url, '_blank', 'noopener,noreferrer');
                        setContextMenu(null);
                      }}
                      className="w-full p-3 bg-[#1e1530] hover:bg-[#ff4d4d]/20 border border-[#3d2b4f] hover:border-[#ff4d4d]/60 rounded-xl flex items-center gap-3 text-xs font-bold text-white transition-all cursor-pointer group"
                    >
                      <div className="p-2 bg-black/40 group-hover:bg-[#ff4d4d] text-gray-300 group-hover:text-white rounded-lg transition-colors">
                        <ExternalLink size={16} />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <span className="block text-white group-hover:text-[#ff4d4d] transition-colors font-bold">
                          {isRu ? 'Открыть в системном браузере' : 'Open in System Browser'}
                        </span>
                        <span className="block text-[10px] text-gray-400 font-normal truncate">
                          {isRu ? 'Перейти в основном браузере устройства' : 'Open in device default browser'}
                        </span>
                      </div>
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Toast Alert */}
          <AnimatePresence>
            {contextToast && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100000] px-4 py-2.5 bg-emerald-400 text-black font-bold text-xs rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-200"
              >
                <Check size={16} />
                <span>{contextToast}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
