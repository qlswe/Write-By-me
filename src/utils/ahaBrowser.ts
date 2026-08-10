import { sanitizeHttpHeaderValue } from './network';

export interface UserAgentProfile {
  id: string;
  name: string;
  userAgentString: string;
  platform: string;
  vendor: string;
  deviceType: 'mobile' | 'desktop' | 'hyper-v6' | 'bot' | 'custom';
  isAhaNative: boolean;
}

export interface BrowserTab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  history: string[];
  historyIndex: number;
  isLoading: boolean;
  pinned: boolean;
  incognito: boolean;
  contentCache?: string;
  statusCode?: number;
  latencyMs?: number;
  headers?: Record<string, string>;
}

export interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  category: string;
  createdAt: string;
  icon?: string;
}

export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  timestamp: string;
  incognito: boolean;
}

export const AHA_CUSTOM_USER_AGENTS: UserAgentProfile[] = [
  {
    id: 'aha-v6-hyper',
    name: 'AHA Browser v6 (IPv6 Hyper-Acceleration Native)',
    userAgentString: 'AhaBrowser/6.0.4 (AHA-OS 6.0; Dual-Stack IPv6; AHA-Protocol-v6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 AHA-v6-Engine/6.0',
    platform: 'AHA-OS x86_64 IPv6-Native',
    vendor: 'AHA Network Architecture Team',
    deviceType: 'hyper-v6',
    isAhaNative: true
  },
  {
    id: 'aha-mobile-safari',
    name: 'AHA Mobile Browser (iOS 17 Safari / IPv6)',
    userAgentString: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 AhaBrowser/6.0-Mobile (AHA-IPv6-Direct)',
    platform: 'iPhone iOS 17.5',
    vendor: 'Apple Computer, Inc. / AHA-v6',
    deviceType: 'mobile',
    isAhaNative: true
  },
  {
    id: 'aha-android-chrome',
    name: 'AHA Mobile Android (Chrome 128 / IPv6)',
    userAgentString: 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.127 Mobile Safari/537.36 AhaBrowser/6.0-Android',
    platform: 'Android 14 (Linux armv8l)',
    vendor: 'Google LLC / AHA-v6',
    deviceType: 'mobile',
    isAhaNative: true
  },
  {
    id: 'aha-desktop-chrome',
    name: 'AHA Desktop Web Suite (Chrome 128 IPv6)',
    userAgentString: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 AhaBrowser/6.0.4',
    platform: 'Win32 / AHA-v6-Bypass',
    vendor: 'Google Inc. / AHA Protocol',
    deviceType: 'desktop',
    isAhaNative: true
  },
  {
    id: 'aha-firefox-nightly',
    name: 'AHA Firefox Nightly IPv6 Engine',
    userAgentString: 'Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0 AhaBrowser/6.0-Nightly',
    platform: 'Linux x86_64 / Firefox Gecko',
    vendor: 'Mozilla Foundation / AHA Protocol',
    deviceType: 'desktop',
    isAhaNative: true
  },
  {
    id: 'aha-bot-auditor',
    name: 'AHA Network Security Auditor Bot',
    userAgentString: 'AhaNetworkAuditor/6.0 (+https://ai.studio/aha-protocol-v6; Security & IPv6 Route Verification)',
    platform: 'Linux x86_64 Dual-Stack',
    vendor: 'AHA Core Security',
    deviceType: 'bot',
    isAhaNative: true
  }
];

const STORAGE_KEY_SELECTED_UA = 'aha_active_user_agent_id';
const STORAGE_KEY_CUSTOM_UA_STR = 'aha_custom_user_agent_string';
const STORAGE_KEY_BOOKMARKS = 'aha_browser_bookmarks';
const STORAGE_KEY_HISTORY = 'aha_browser_history';
const STORAGE_KEY_ADBLOCK = 'aha_browser_adblock_enabled';

/**
 * Gets the active User-Agent profile configured for the embedded browser and network requests.
 */
export function getActiveUserAgentProfile(): UserAgentProfile {
  const savedId = localStorage.getItem(STORAGE_KEY_SELECTED_UA);
  if (savedId === 'custom') {
    const customStr = localStorage.getItem(STORAGE_KEY_CUSTOM_UA_STR) || 'CustomAhaAgent/1.0 (AHA-OS; IPv6)';
    return {
      id: 'custom',
      name: 'Custom User-Agent (Пользовательский UA)',
      userAgentString: customStr,
      platform: 'Custom Platform',
      vendor: 'User Configured',
      deviceType: 'custom',
      isAhaNative: false
    };
  }
  const found = AHA_CUSTOM_USER_AGENTS.find(u => u.id === savedId);
  return found || AHA_CUSTOM_USER_AGENTS[0];
}

/**
 * Sets the active custom User-Agent profile.
 */
export function setActiveUserAgentProfile(id: string, customUAString?: string): UserAgentProfile {
  if (id === 'custom' && customUAString) {
    localStorage.setItem(STORAGE_KEY_SELECTED_UA, 'custom');
    localStorage.setItem(STORAGE_KEY_CUSTOM_UA_STR, customUAString.trim());
    return getActiveUserAgentProfile();
  }
  const profile = AHA_CUSTOM_USER_AGENTS.find(u => u.id === id) || AHA_CUSTOM_USER_AGENTS[0];
  localStorage.setItem(STORAGE_KEY_SELECTED_UA, profile.id);
  return profile;
}

/**
 * Returns formatted HTTP headers for custom browser requests including custom User-Agent.
 */
export function getAhaBrowserHeaders(customUaId?: string): Record<string, string> {
  const profile = customUaId 
    ? (AHA_CUSTOM_USER_AGENTS.find(u => u.id === customUaId) || getActiveUserAgentProfile())
    : getActiveUserAgentProfile();

  const activeFlow = localStorage.getItem('aha_v6_active_flow_label') || '0x6AHA9F';

  return {
    'User-Agent': sanitizeHttpHeaderValue(profile.userAgentString),
    'X-AHA-User-Agent': sanitizeHttpHeaderValue(profile.userAgentString),
    'X-AHA-Protocol-Version': '6.0-HYPER-IPv6',
    'X-AHA-IPv6-Flow-Label': activeFlow,
    'X-AHA-Embedded-Browser': 'AhaBrowser/6.0.4',
    'X-AHA-AdBlock-Shield': isAdBlockEnabled() ? 'Enabled-Strict' : 'Disabled'
  };
}

/**
 * Bookmarks persistence helpers
 */
export function getStoredBookmarks(): BookmarkItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse bookmarks', e);
  }
  return [
    { id: 'bm-1', title: 'AHA Protocol Home', url: 'https://aha-browser.v6/home', category: 'AHA Core', createdAt: new Date().toISOString() },
    { id: 'bm-2', title: 'IPv6 Network Telemetry', url: '/api/network/protocol', category: 'Infrastructure', createdAt: new Date().toISOString() },
    { id: 'bm-3', title: 'Wikipedia (IPv6)', url: 'https://en.wikipedia.org/wiki/IPv6', category: 'Reference', createdAt: new Date().toISOString() },
    { id: 'bm-4', title: 'Google Dual-Stack', url: 'https://www.google.com', category: 'Search', createdAt: new Date().toISOString() },
    { id: 'bm-5', title: 'GitHub Open Source', url: 'https://github.com', category: 'Developer', createdAt: new Date().toISOString() }
  ];
}

export function saveBookmark(title: string, url: string, category: string = 'General'): BookmarkItem[] {
  const current = getStoredBookmarks();
  const newItem: BookmarkItem = {
    id: `bm-${Date.now()}`,
    title: title || url,
    url,
    category,
    createdAt: new Date().toISOString()
  };
  const updated = [newItem, ...current.filter(b => b.url !== url)];
  localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(updated));
  return updated;
}

export function removeBookmark(id: string): BookmarkItem[] {
  const current = getStoredBookmarks();
  const updated = current.filter(b => b.id !== id);
  localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(updated));
  return updated;
}

/**
 * Browser History persistence helpers
 */
export function getStoredHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse history', e);
  }
  return [];
}

export function addHistoryEntry(url: string, title: string, incognito: boolean = false): HistoryItem[] {
  if (incognito) return getStoredHistory();
  const current = getStoredHistory();
  const newItem: HistoryItem = {
    id: `hist-${Date.now()}`,
    url,
    title: title || url,
    timestamp: new Date().toISOString(),
    incognito: false
  };
  const updated = [newItem, ...current.filter(h => h.url !== url)].slice(0, 100);
  localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
  return updated;
}

export function clearBrowserHistory(): HistoryItem[] {
  localStorage.removeItem(STORAGE_KEY_HISTORY);
  return [];
}

/**
 * AdBlocker Shield toggle
 */
export function isAdBlockEnabled(): boolean {
  return localStorage.getItem(STORAGE_KEY_ADBLOCK) !== 'false';
}

export function setAdBlockEnabled(enabled: boolean): boolean {
  localStorage.setItem(STORAGE_KEY_ADBLOCK, String(enabled));
  return enabled;
}

