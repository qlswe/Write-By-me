import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { theoriesData as localTheories, blogPostsData as localBlogPosts, eventsData as localEvents, promoCodesData as localPromoCodes } from '../data/content';
import { handleFirestoreError, OperationType } from '../utils/errorHandlers';
import { vercelFallback } from '../utils/vercelFallback';
import { subscribeToPageVisibility } from '../utils/performanceOptimizer';

export const CONTENT_CACHE_KEY_V3 = 'hsr_content_cache_v3';
export const CONTENT_SCHEMA_VERSION = 3;

export interface ContentStoreState {
  theories: any[];
  blogPosts: any[];
  events: any[];
  promoCodes: any[];
  isLoadingTheories: boolean;
  isLoadingBlog: boolean;
  isLoadingEvents: boolean;
  isLoading: boolean;
  contentVersion: number;
  lastUpdated: number;
}

// Utility: Normalize timestamps into milliseconds for accurate version comparisons
export const parseContentTimestamp = (val: any): number => {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (typeof val.toMillis === 'function') return val.toMillis();
  if (typeof val.toDate === 'function') return val.toDate().getTime();
  if (val instanceof Date) return val.getTime();
  if (typeof val.seconds === 'number') return val.seconds * 1000 + Math.floor((val.nanoseconds || 0) / 1000000);
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

// Utility: Extract or normalize numerical revision version
export const parseContentVersion = (item: any): number => {
  if (!item) return 1;
  const v = item.version ?? item._v ?? item.revision ?? item.v;
  if (typeof v === 'number' && !isNaN(v)) return v;
  if (typeof v === 'string') {
    const parsed = parseInt(v, 10);
    if (!isNaN(parsed)) return parsed;
  }
  return 1;
};

// Helper: Normalize multilingual fields
const normalizeLocalizedField = (field: any, defaultText = ''): Record<string, string> => {
  if (typeof field === 'string') {
    return { ru: field, en: field, by: field, de: field, fr: field, zh: field };
  }
  if (field && typeof field === 'object') {
    return {
      ru: field.ru || field.en || defaultText,
      en: field.en || field.ru || defaultText,
      by: field.by || field.ru || field.en || defaultText,
      de: field.de || field.en || field.ru || defaultText,
      fr: field.fr || field.en || field.ru || defaultText,
      zh: field.zh || field.en || field.ru || defaultText
    };
  }
  return { ru: defaultText, en: defaultText, by: defaultText, de: defaultText, fr: defaultText, zh: defaultText };
};

// Helper: Reconcile and merge items with Item-Level Version & Timestamp Comparison
export const reconcileItemsWithVersioning = (
  existingItems: any[],
  incomingItems: any[],
  staticFallbacks: any[] = []
): { merged: any[]; hasChanges: boolean } => {
  let hasChanges = false;
  const itemMap = new Map<string, any>();

  // 1. Seed with existing cached items
  for (const item of existingItems) {
    if (item && item.id) {
      itemMap.set(item.id, item);
    }
  }

  // 2. Merge incoming items with version checking
  for (const incoming of incomingItems) {
    if (!incoming || !incoming.id) continue;
    const existing = itemMap.get(incoming.id);

    if (!existing) {
      itemMap.set(incoming.id, incoming);
      hasChanges = true;
    } else {
      const existingVer = parseContentVersion(existing);
      const incVer = parseContentVersion(incoming);
      const existingTime = parseContentTimestamp(existing.updatedAt || existing.createdAt);
      const incTime = parseContentTimestamp(incoming.updatedAt || incoming.createdAt);

      // Automated versioning check: Incoming item wins if higher version, newer timestamp, or fresher content
      if (incVer > existingVer || incTime > existingTime || (incTime === existingTime && incVer >= existingVer)) {
        itemMap.set(incoming.id, {
          ...existing,
          ...incoming,
          version: Math.max(incVer, existingVer),
          updatedAt: incoming.updatedAt || existing.updatedAt || new Date().toISOString()
        });
        hasChanges = true;
      }
    }
  }

  // 3. Ensure static default items exist if not present in Firestore/cache
  for (const fallback of staticFallbacks) {
    if (fallback && fallback.id && !itemMap.has(fallback.id)) {
      itemMap.set(fallback.id, fallback);
    }
  }

  return {
    merged: Array.from(itemMap.values()),
    hasChanges
  };
};

// Load initial cached state from localStorage with cache-busting validation
const getInitialCachedState = (): ContentStoreState => {
  let cachedTheories = localTheories;
  let cachedBlog = localBlogPosts;
  let cachedEvents = localEvents;
  let cachedPromos = localPromoCodes;
  let initialVersion = 1;
  let lastUpdateTimestamp = Date.now();

  try {
    const rawV3 = localStorage.getItem(CONTENT_CACHE_KEY_V3);
    if (rawV3) {
      const parsed = JSON.parse(rawV3);
      if (parsed && parsed.schemaVersion === CONTENT_SCHEMA_VERSION) {
        if (Array.isArray(parsed.theories) && parsed.theories.length > 0) cachedTheories = parsed.theories;
        if (Array.isArray(parsed.blog) && parsed.blog.length > 0) cachedBlog = parsed.blog;
        if (Array.isArray(parsed.events) && parsed.events.length > 0) cachedEvents = parsed.events;
        if (Array.isArray(parsed.promos) && parsed.promos.length > 0) cachedPromos = parsed.promos;
        if (typeof parsed.contentVersion === 'number') initialVersion = parsed.contentVersion;
        if (typeof parsed.lastUpdated === 'number') lastUpdateTimestamp = parsed.lastUpdated;
      }
    } else {
      // Legacy cache migration
      const rawV2 = localStorage.getItem('hsr_content_cache_v2');
      if (rawV2) {
        const parsedV2 = JSON.parse(rawV2);
        if (Array.isArray(parsedV2.theories)) cachedTheories = parsedV2.theories;
        if (Array.isArray(parsedV2.blog)) cachedBlog = parsedV2.blog;
        if (Array.isArray(parsedV2.events)) cachedEvents = parsedV2.events;
        if (Array.isArray(parsedV2.promos)) cachedPromos = parsedV2.promos;
        localStorage.removeItem('hsr_content_cache_v2');
      }
    }
  } catch (e) {
    console.warn('[useContent] Failed to parse content cache, using bundled fallbacks:', e);
  }

  return {
    theories: cachedTheories,
    blogPosts: cachedBlog,
    events: cachedEvents,
    promoCodes: cachedPromos,
    isLoadingTheories: false,
    isLoadingBlog: false,
    isLoadingEvents: false,
    isLoading: false,
    contentVersion: initialVersion,
    lastUpdated: lastUpdateTimestamp
  };
};

let sharedState: ContentStoreState = getInitialCachedState();

// Save state to localStorage with metadata
const saveCacheToLocalStorage = () => {
  try {
    const payload = {
      schemaVersion: CONTENT_SCHEMA_VERSION,
      contentVersion: sharedState.contentVersion,
      lastUpdated: sharedState.lastUpdated,
      theories: sharedState.theories.slice(0, 50),
      blog: sharedState.blogPosts.slice(0, 50),
      events: sharedState.events.slice(0, 20),
      promos: sharedState.promoCodes.slice(0, 20)
    };
    localStorage.setItem(CONTENT_CACHE_KEY_V3, JSON.stringify(payload));
  } catch (e) {
    console.warn('[useContent] Could not persist cache to localStorage:', e);
  }
};

type Listener = (state: ContentStoreState) => void;
const listeners = new Set<Listener>();
let isSubscribed = false;

function notifyListeners() {
  listeners.forEach((listener) => listener(sharedState));
}

// Global Single-Doc Fetcher with Cache-Buster for Modals & Direct Lookups
export async function fetchLatestDocument(
  collectionName: 'theories' | 'blogPosts' | 'events' | 'promo_codes',
  docId: string
): Promise<any | null> {
  if (!docId) return null;
  try {
    const docRef = doc(db, collectionName, docId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;

    const data = { id: snap.id, ...snap.data() } as any;
    
    // Normalize fields
    if (collectionName === 'theories' || collectionName === 'blogPosts') {
      data.title = normalizeLocalizedField(data.title);
      data.summary = normalizeLocalizedField(data.summary);
      data.content = normalizeLocalizedField(data.content);
    } else if (collectionName === 'events') {
      data.title = normalizeLocalizedField(data.title);
      data.description = normalizeLocalizedField(data.description);
    }
    data.version = parseContentVersion(data);
    data.updatedAt = data.updatedAt || data.createdAt || new Date().toISOString();

    // Auto-update shared store if incoming doc is newer
    if (collectionName === 'theories') {
      const { merged, hasChanges } = reconcileItemsWithVersioning(sharedState.theories, [data], localTheories);
      if (hasChanges) {
        sharedState = {
          ...sharedState,
          theories: merged,
          contentVersion: sharedState.contentVersion + 1,
          lastUpdated: Date.now()
        };
        saveCacheToLocalStorage();
        notifyListeners();
      }
    } else if (collectionName === 'blogPosts') {
      const { merged, hasChanges } = reconcileItemsWithVersioning(sharedState.blogPosts, [data], localBlogPosts);
      if (hasChanges) {
        sharedState = {
          ...sharedState,
          blogPosts: merged,
          contentVersion: sharedState.contentVersion + 1,
          lastUpdated: Date.now()
        };
        saveCacheToLocalStorage();
        notifyListeners();
      }
    }

    return data;
  } catch (error) {
    console.warn(`[useContent] Direct fetch failed for ${collectionName}/${docId}:`, error);
    return null;
  }
}

// Invalidate or update a specific item across all active views without refresh
export function invalidateContentItem(
  type: 'theory' | 'blog' | 'event' | 'promo',
  updatedItem: any
) {
  if (!updatedItem || !updatedItem.id) return;

  const ver = parseContentVersion(updatedItem);
  const normalizedItem = {
    ...updatedItem,
    version: ver,
    updatedAt: updatedItem.updatedAt || new Date().toISOString()
  };

  if (type === 'theory') {
    normalizedItem.title = normalizeLocalizedField(normalizedItem.title);
    normalizedItem.summary = normalizeLocalizedField(normalizedItem.summary);
    normalizedItem.content = normalizeLocalizedField(normalizedItem.content);
    const { merged } = reconcileItemsWithVersioning(sharedState.theories, [normalizedItem], localTheories);
    sharedState = {
      ...sharedState,
      theories: merged,
      contentVersion: sharedState.contentVersion + 1,
      lastUpdated: Date.now()
    };
  } else if (type === 'blog') {
    normalizedItem.title = normalizeLocalizedField(normalizedItem.title);
    normalizedItem.summary = normalizeLocalizedField(normalizedItem.summary);
    normalizedItem.content = normalizeLocalizedField(normalizedItem.content);
    const { merged } = reconcileItemsWithVersioning(sharedState.blogPosts, [normalizedItem], localBlogPosts);
    sharedState = {
      ...sharedState,
      blogPosts: merged,
      contentVersion: sharedState.contentVersion + 1,
      lastUpdated: Date.now()
    };
  }

  saveCacheToLocalStorage();
  notifyListeners();
}

function initSingletonSubscription() {
  if (isSubscribed) return;
  isSubscribed = true;

  // Listen for local content update dispatch events (from TheoryEditor, BlogEditor, etc.)
  if (typeof window !== 'undefined') {
    window.addEventListener('aha_content_updated', (e: any) => {
      if (e.detail?.id && e.detail?.type) {
        if (e.detail.type === 'theory' || e.detail.type === 'theories') {
          fetchLatestDocument('theories', e.detail.id);
        } else if (e.detail.type === 'blog' || e.detail.type === 'blogPosts') {
          fetchLatestDocument('blogPosts', e.detail.id);
        }
      }
    });

    window.addEventListener('aha_force_cache_bust', () => {
      localStorage.removeItem(CONTENT_CACHE_KEY_V3);
      sharedState.contentVersion += 1;
      sharedState.lastUpdated = Date.now();
      notifyListeners();
    });
  }

  // Safety timer: unlock loading state if Firestore latency exceeds threshold
  setTimeout(() => {
    if (sharedState.isLoadingTheories || sharedState.isLoadingBlog || sharedState.isLoadingEvents || sharedState.isLoading) {
      sharedState = {
        ...sharedState,
        isLoadingTheories: false,
        isLoadingBlog: false,
        isLoadingEvents: false,
        isLoading: false
      };
      notifyListeners();
    }
  }, 600);

  // 1. Subscribe to theories with versioning reconciliation
  const qTheories = query(collection(db, 'theories'), orderBy('createdAt', 'desc'), limit(50));
  onSnapshot(qTheories, (snapshot) => {
    const firestoreTheories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    const mappedFirestoreTheories = firestoreTheories.map((t: any) => ({
      ...t,
      title: normalizeLocalizedField(t.title),
      summary: normalizeLocalizedField(t.summary),
      content: normalizeLocalizedField(t.content),
      version: parseContentVersion(t),
      updatedAt: t.updatedAt || t.createdAt || new Date().toISOString()
    }));

    const { merged, hasChanges } = reconcileItemsWithVersioning(sharedState.theories, mappedFirestoreTheories, localTheories);
    
    sharedState = {
      ...sharedState,
      theories: merged,
      isLoadingTheories: false,
      isLoading: false,
      contentVersion: hasChanges ? sharedState.contentVersion + 1 : sharedState.contentVersion,
      lastUpdated: Date.now()
    };
    saveCacheToLocalStorage();
    notifyListeners();
  }, (error) => {
    sharedState = { ...sharedState, isLoadingTheories: false, isLoading: false };
    notifyListeners();
    handleFirestoreError(error, OperationType.GET, 'theories');
  });

  // 2. Subscribe to blogPosts with versioning reconciliation
  const qBlogPosts = query(collection(db, 'blogPosts'), orderBy('createdAt', 'desc'), limit(50));
  onSnapshot(qBlogPosts, (snapshot) => {
    const firestoreBlogPosts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    const mappedFirestoreBlogPosts = firestoreBlogPosts.map((p: any) => ({
      ...p,
      title: normalizeLocalizedField(p.title),
      summary: normalizeLocalizedField(p.summary),
      content: normalizeLocalizedField(p.content),
      version: parseContentVersion(p),
      updatedAt: p.updatedAt || p.createdAt || new Date().toISOString()
    }));

    const { merged, hasChanges } = reconcileItemsWithVersioning(sharedState.blogPosts, mappedFirestoreBlogPosts, localBlogPosts);
    
    sharedState = {
      ...sharedState,
      blogPosts: merged,
      isLoadingBlog: false,
      isLoading: false,
      contentVersion: hasChanges ? sharedState.contentVersion + 1 : sharedState.contentVersion,
      lastUpdated: Date.now()
    };
    saveCacheToLocalStorage();
    notifyListeners();
  }, (error) => {
    sharedState = { ...sharedState, isLoadingBlog: false, isLoading: false };
    notifyListeners();
    handleFirestoreError(error, OperationType.GET, 'blogPosts');
  });

  // 3. Subscribe to events
  const qEvents = query(collection(db, 'events'), orderBy('createdAt', 'desc'), limit(20));
  onSnapshot(qEvents, (snapshot) => {
    const firestoreEvents = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    const mappedFirestoreEvents = firestoreEvents.map((e: any) => ({
      ...e,
      title: normalizeLocalizedField(e.title),
      description: normalizeLocalizedField(e.description),
      version: parseContentVersion(e),
      updatedAt: e.updatedAt || e.createdAt || new Date().toISOString()
    }));

    const { merged, hasChanges } = reconcileItemsWithVersioning(sharedState.events, mappedFirestoreEvents, localEvents);
    sharedState = {
      ...sharedState,
      events: merged,
      isLoadingEvents: false,
      isLoading: false,
      contentVersion: hasChanges ? sharedState.contentVersion + 1 : sharedState.contentVersion,
      lastUpdated: Date.now()
    };
    saveCacheToLocalStorage();
    notifyListeners();
  }, (error) => {
    sharedState = { ...sharedState, isLoadingEvents: false, isLoading: false };
    notifyListeners();
    handleFirestoreError(error, OperationType.GET, 'events');
  });

  // 4. Subscribe to promo codes
  const qPromoCodes = query(collection(db, 'promo_codes'), orderBy('createdAt', 'desc'), limit(20));
  onSnapshot(qPromoCodes, (snapshot) => {
    const firestorePromoCodes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    const mappedFirestorePromoCodes = firestorePromoCodes.map((p: any) => {
      const reward = typeof p.reward === 'string' ? { ru: p.reward, en: p.reward, by: p.reward, de: p.reward, fr: p.reward, zh: p.reward } : p.reward;
      return {
        ...p,
        rewards: reward || { ru: '', en: '', by: '', de: '', fr: '', zh: '' },
        version: parseContentVersion(p),
        updatedAt: p.updatedAt || p.createdAt || new Date().toISOString()
      };
    });
    const firestorePromoIds = new Set(mappedFirestorePromoCodes.map(p => p.id));
    const filteredLocalPromoCodes = localPromoCodes.filter(p => !firestorePromoIds.has((p as any).id || (p as any).code));
    sharedState = {
      ...sharedState,
      promoCodes: [...mappedFirestorePromoCodes, ...filteredLocalPromoCodes]
    };
    notifyListeners();
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'promo_codes');
  });

  // Fallback Polling (Throttled, only when tab is visible)
  let isPageVisible = typeof document !== 'undefined' ? document.visibilityState === 'visible' : true;
  subscribeToPageVisibility((visible) => {
    isPageVisible = visible;
  });

  const fetchFallback = async () => {
    if (!isPageVisible || !vercelFallback.isAvailable()) return;
    try {
      const fallbackData = await vercelFallback.lrange('theories', 0, 50);
      if (fallbackData && fallbackData.length > 0) {
        const parsed = fallbackData.map((str: any) => typeof str === 'string' ? JSON.parse(str) : str);
        const { merged } = reconcileItemsWithVersioning(sharedState.theories, parsed, localTheories);
        sharedState.theories = merged;
      }
      
      const fallbackBlogData = await vercelFallback.lrange('blogPosts', 0, 50);
      if (fallbackBlogData && fallbackBlogData.length > 0) {
        const parsed = fallbackBlogData.map((str: any) => typeof str === 'string' ? JSON.parse(str) : str);
        const { merged } = reconcileItemsWithVersioning(sharedState.blogPosts, parsed, localBlogPosts);
        sharedState.blogPosts = merged;
      }

      const fallbackChronicleData = await vercelFallback.lrange('events', 0, 50);
      if (fallbackChronicleData && fallbackChronicleData.length > 0) {
        const parsed = fallbackChronicleData.map((str: any) => typeof str === 'string' ? JSON.parse(str) : str);
        const { merged } = reconcileItemsWithVersioning(sharedState.events, parsed, localEvents);
        sharedState.events = merged.sort((a,b) => (b.date || '').localeCompare(a.date || ''));
      }

      const fallbackPromoData = await vercelFallback.lrange('promo_codes', 0, 50);
      if (fallbackPromoData && fallbackPromoData.length > 0) {
        const parsed = fallbackPromoData.map((str: any) => typeof str === 'string' ? JSON.parse(str) : str);
        sharedState.promoCodes = Array.from(new Map([...sharedState.promoCodes, ...parsed].map(t => [t.id, t])).values());
      }
      notifyListeners();
    } catch (e) {}
  };

  fetchFallback();
  setInterval(fetchFallback, 45000);
}

export function useContent() {
  const [content, setContent] = useState<ContentStoreState>(sharedState);

  useEffect(() => {
    initSingletonSubscription();
    listeners.add(setContent);
    return () => {
      listeners.delete(setContent);
    };
  }, []);

  // Check freshness of a specific theory / blog post
  const checkContentFreshness = useCallback((id: string, cachedUpdatedAt?: string | number, cachedVersion?: number) => {
    const existing = sharedState.theories.find(t => t.id === id) || sharedState.blogPosts.find(b => b.id === id);
    if (!existing) return { isFresh: true, latestItem: null, latestVersion: 1 };

    const curVer = parseContentVersion(existing);
    const curTime = parseContentTimestamp(existing.updatedAt || existing.createdAt);
    const testVer = cachedVersion ? Number(cachedVersion) : 1;
    const testTime = cachedUpdatedAt ? parseContentTimestamp(cachedUpdatedAt) : 0;

    const isStale = (curVer > testVer) || (curTime > testTime);
    return {
      isFresh: !isStale,
      latestItem: existing,
      latestVersion: curVer,
      latestUpdatedAt: existing.updatedAt
    };
  }, []);

  // Force cache refresh
  const refreshContent = useCallback(async (forceBustCache = true) => {
    if (forceBustCache) {
      try {
        localStorage.removeItem(CONTENT_CACHE_KEY_V3);
      } catch (e) {}
    }
    sharedState = {
      ...sharedState,
      contentVersion: sharedState.contentVersion + 1,
      lastUpdated: Date.now()
    };
    notifyListeners();
  }, []);

  const getTheoryById = useCallback((id: string) => {
    return sharedState.theories.find(t => t.id === id) || null;
  }, [content.theories]);

  const getBlogPostById = useCallback((id: string) => {
    return sharedState.blogPosts.find(b => b.id === id) || null;
  }, [content.blogPosts]);

  return {
    ...content,
    checkContentFreshness,
    refreshContent,
    getTheoryById,
    getBlogPostById,
    fetchLatestDoc: fetchLatestDocument,
    invalidateItem: invalidateContentItem
  };
}
