import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { theoriesData as localTheories, blogPostsData as localBlogPosts, eventsData as localEvents, promoCodesData as localPromoCodes } from '../data/content';
import { handleFirestoreError, OperationType } from '../utils/errorHandlers';
import { vercelFallback } from '../utils/vercelFallback';
import { subscribeToPageVisibility } from '../utils/performanceOptimizer';

// Shared singleton state to prevent duplicate Firestore subscriptions across components
interface ContentStoreState {
  theories: any[];
  blogPosts: any[];
  events: any[];
  promoCodes: any[];
  isLoadingTheories: boolean;
  isLoadingBlog: boolean;
  isLoadingEvents: boolean;
  isLoading: boolean;
}

// Load initial cached state from localStorage for zero-latency instant rendering
const getInitialCachedState = (): ContentStoreState => {
  let cachedTheories = localTheories;
  let cachedBlog = localBlogPosts;
  let cachedEvents = localEvents;
  let cachedPromos = localPromoCodes;

  try {
    const raw = localStorage.getItem('hsr_content_cache_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.theories) && parsed.theories.length > 0) cachedTheories = parsed.theories;
      if (Array.isArray(parsed.blog) && parsed.blog.length > 0) cachedBlog = parsed.blog;
      if (Array.isArray(parsed.events) && parsed.events.length > 0) cachedEvents = parsed.events;
      if (Array.isArray(parsed.promos) && parsed.promos.length > 0) cachedPromos = parsed.promos;
    }
  } catch (e) {
    console.warn('Failed to parse cached content:', e);
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
  };
};

let sharedState: ContentStoreState = getInitialCachedState();

const saveCacheToLocalStorage = () => {
  try {
    localStorage.setItem('hsr_content_cache_v2', JSON.stringify({
      theories: sharedState.theories.slice(0, 50),
      blog: sharedState.blogPosts.slice(0, 50),
      events: sharedState.events.slice(0, 20),
      promos: sharedState.promoCodes.slice(0, 20)
    }));
  } catch (e) {}
};

type Listener = (state: ContentStoreState) => void;
const listeners = new Set<Listener>();
let isSubscribed = false;

function notifyListeners() {
  listeners.forEach((listener) => listener(sharedState));
}

function initSingletonSubscription() {
  if (isSubscribed) return;
  isSubscribed = true;

  // Safety timer: If Firestore takes >600ms, unlock loading state so available cached/local content renders instantly
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

  // 1. Subscribe to theories (limited to 50 items)
  const qTheories = query(collection(db, 'theories'), orderBy('createdAt', 'desc'), limit(50));
  const unsubscribeTheories = onSnapshot(qTheories, (snapshot) => {
    const firestoreTheories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    const mappedFirestoreTheories = firestoreTheories.map((t: any) => {
      const title = typeof t.title === 'string' ? { ru: t.title, en: t.title, by: t.title, de: t.title, fr: t.title, zh: t.title } : t.title;
      const summary = typeof t.summary === 'string' ? { ru: t.summary, en: t.summary, by: t.summary, de: t.summary, fr: t.summary, zh: t.summary } : t.summary;
      const content = typeof t.content === 'string' ? { ru: t.content, en: t.content, by: t.content, de: t.content, fr: t.content, zh: t.content } : t.content;
      return {
        ...t,
        title: title || { ru: '', en: '', by: '', de: '', fr: '', zh: '' },
        summary: summary || { ru: '', en: '', by: '', de: '', fr: '', zh: '' },
        content: content || { ru: '', en: '', by: '', de: '', fr: '', zh: '' }
      };
    });
    const firestoreIds = new Set(mappedFirestoreTheories.map(t => t.id));
    const filteredLocalTheories = localTheories.filter(t => !firestoreIds.has(t.id));
    const newTheories = [...mappedFirestoreTheories, ...filteredLocalTheories];
    sharedState = {
      ...sharedState,
      theories: newTheories,
      isLoadingTheories: false,
      isLoading: false
    };
    saveCacheToLocalStorage();
    notifyListeners();
  }, (error) => {
    sharedState = { ...sharedState, isLoadingTheories: false, isLoading: false };
    notifyListeners();
    handleFirestoreError(error, OperationType.GET, 'theories');
  });

  // 2. Subscribe to blogPosts (limited to 50 items)
  const qBlogPosts = query(collection(db, 'blogPosts'), orderBy('createdAt', 'desc'), limit(50));
  const unsubscribeBlogPosts = onSnapshot(qBlogPosts, (snapshot) => {
    const firestoreBlogPosts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    const mappedFirestoreBlogPosts = firestoreBlogPosts.map((p: any) => {
      const title = typeof p.title === 'string' ? { ru: p.title, en: p.title, by: p.title, de: p.title, fr: p.title, zh: p.title } : p.title;
      const summary = typeof p.summary === 'string' ? { ru: p.summary, en: p.summary, by: p.summary, de: p.summary, fr: p.summary, zh: p.summary } : p.summary;
      const content = typeof p.content === 'string' ? { ru: p.content, en: p.content, by: p.content, de: p.content, fr: p.content, zh: p.content } : p.content;
      return {
        ...p,
        title: title || { ru: '', en: '', by: '', de: '', fr: '', zh: '' },
        summary: summary || { ru: '', en: '', by: '', de: '', fr: '', zh: '' },
        content: content || { ru: '', en: '', by: '', de: '', fr: '', zh: '' }
      };
    });
    const firestorePostIds = new Set(mappedFirestoreBlogPosts.map(p => p.id));
    const filteredLocalBlogPosts = localBlogPosts.filter(p => !firestorePostIds.has(p.id));
    sharedState = {
      ...sharedState,
      blogPosts: [...mappedFirestoreBlogPosts, ...filteredLocalBlogPosts],
      isLoadingBlog: false,
      isLoading: false
    };
    saveCacheToLocalStorage();
    notifyListeners();
  }, (error) => {
    sharedState = { ...sharedState, isLoadingBlog: false, isLoading: false };
    notifyListeners();
    handleFirestoreError(error, OperationType.GET, 'blogPosts');
  });

  // 3. Subscribe to events (limited to 20 items)
  const qEvents = query(collection(db, 'events'), orderBy('createdAt', 'desc'), limit(20));
  const unsubscribeEvents = onSnapshot(qEvents, (snapshot) => {
    const firestoreEvents = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    const mappedFirestoreEvents = firestoreEvents.map((e: any) => {
      const title = typeof e.title === 'string' ? { ru: e.title, en: e.title, by: e.title, de: e.title, fr: e.title, zh: e.title } : e.title;
      const description = typeof e.description === 'string' ? { ru: e.description, en: e.description, by: e.description, de: e.description, fr: e.description, zh: e.description } : e.description;
      return {
        ...e,
        title: title || { ru: '', en: '', by: '', de: '', fr: '', zh: '' },
        description: description || { ru: '', en: '', by: '', de: '', fr: '', zh: '' }
      };
    });
    const firestoreEventIds = new Set(mappedFirestoreEvents.map(e => e.id));
    const filteredLocalEvents = localEvents.filter(e => !firestoreEventIds.has(e.id));
    sharedState = {
      ...sharedState,
      events: [...mappedFirestoreEvents, ...filteredLocalEvents],
      isLoadingEvents: false,
      isLoading: false
    };
    saveCacheToLocalStorage();
    notifyListeners();
  }, (error) => {
    sharedState = { ...sharedState, isLoadingEvents: false, isLoading: false };
    notifyListeners();
    handleFirestoreError(error, OperationType.GET, 'events');
  });

  // 4. Subscribe to promo codes (limited to 20 items)
  const qPromoCodes = query(collection(db, 'promo_codes'), orderBy('createdAt', 'desc'), limit(20));
  const unsubscribePromoCodes = onSnapshot(qPromoCodes, (snapshot) => {
    const firestorePromoCodes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    const mappedFirestorePromoCodes = firestorePromoCodes.map((p: any) => {
      const reward = typeof p.reward === 'string' ? { ru: p.reward, en: p.reward, by: p.reward, de: p.reward, fr: p.reward, zh: p.reward } : p.reward;
      return {
        ...p,
        rewards: reward || { ru: '', en: '', by: '', de: '', fr: '', zh: '' }
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

  // Throttled fallback polling (only when page is visible, every 45s instead of 10s)
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
        sharedState.theories = Array.from(new Map([...sharedState.theories, ...parsed].map(t => [t.id, t])).values());
      }
      
      const fallbackBlogData = await vercelFallback.lrange('blogPosts', 0, 50);
      if (fallbackBlogData && fallbackBlogData.length > 0) {
        const parsed = fallbackBlogData.map((str: any) => typeof str === 'string' ? JSON.parse(str) : str);
        sharedState.blogPosts = Array.from(new Map([...sharedState.blogPosts, ...parsed].map(t => [t.id, t])).values());
      }

      const fallbackChronicleData = await vercelFallback.lrange('events', 0, 50);
      if (fallbackChronicleData && fallbackChronicleData.length > 0) {
        const parsed = fallbackChronicleData.map((str: any) => typeof str === 'string' ? JSON.parse(str) : str);
        sharedState.events = Array.from(new Map([...sharedState.events, ...parsed].map(t => [t.id, t])).values()).sort((a,b) => (b.date || '').localeCompare(a.date || ''));
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
  setInterval(fetchFallback, 45000); // Throttled from 10s to 45s for memory & CPU efficiency
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

  return content;
}

