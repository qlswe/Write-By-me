import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { theoriesData as localTheories, blogPostsData as localBlogPosts, eventsData as localEvents, promoCodesData as localPromoCodes } from '../data/content';
import { handleFirestoreError, OperationType } from '../utils/errorHandlers';
import { vercelFallback } from '../utils/vercelFallback';

export function useContent() {
  const [theories, setTheories] = useState<any[]>(localTheories);
  const [blogPosts, setBlogPosts] = useState<any[]>(localBlogPosts);
  const [events, setEvents] = useState<any[]>(localEvents);
  const [promoCodes, setPromoCodes] = useState<any[]>(localPromoCodes);

  useEffect(() => {
    // SECURITY/QUOTA Optimization: Added limits to prevent boundless read spikes 
    // when databases grow large.
    
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
      setTheories([...mappedFirestoreTheories, ...filteredLocalTheories]);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'theories');
    });

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
      setBlogPosts([...mappedFirestoreBlogPosts, ...filteredLocalBlogPosts]);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'blogPosts');
    });

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
      setEvents([...mappedFirestoreEvents, ...filteredLocalEvents]);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'events');
    });

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
      setPromoCodes([...mappedFirestorePromoCodes, ...filteredLocalPromoCodes]);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'promo_codes');
    });

    let fallbackInterval: ReturnType<typeof setInterval>;
    const fetchFallback = async () => {
      if (vercelFallback.isAvailable()) {
        try {
          // Fetch theories
          const fallbackData = await vercelFallback.lrange('theories', 0, 50);
          if (fallbackData && fallbackData.length > 0) {
            const parsed = fallbackData.map((str: any) => typeof str === 'string' ? JSON.parse(str) : str);
            setTheories(prev => {
              const mapped = new Map([...prev, ...parsed].map(t => [t.id, t]));
              return Array.from(mapped.values());
            });
          }
          
          // Fetch blog posts
          const fallbackBlogData = await vercelFallback.lrange('blogPosts', 0, 50);
          if (fallbackBlogData && fallbackBlogData.length > 0) {
            const parsed = fallbackBlogData.map((str: any) => typeof str === 'string' ? JSON.parse(str) : str);
            setBlogPosts(prev => {
              const mapped = new Map([...prev, ...parsed].map(t => [t.id, t]));
              return Array.from(mapped.values());
            });
          }

          // Fetch chronicle
          const fallbackChronicleData = await vercelFallback.lrange('events', 0, 50);
          if (fallbackChronicleData && fallbackChronicleData.length > 0) {
            const parsed = fallbackChronicleData.map((str: any) => typeof str === 'string' ? JSON.parse(str) : str);
            setEvents(prev => {
              const mapped = new Map([...prev, ...parsed].map(t => [t.id, t]));
              return Array.from(mapped.values()).sort((a,b) => (b.date || '').localeCompare(a.date || ''));
            });
          }

          // Fetch promos
          const fallbackPromoData = await vercelFallback.lrange('promo_codes', 0, 50);
          if (fallbackPromoData && fallbackPromoData.length > 0) {
            const parsed = fallbackPromoData.map((str: any) => typeof str === 'string' ? JSON.parse(str) : str);
            setPromoCodes(prev => {
              const mapped = new Map([...prev, ...parsed].map(t => [t.id, t]));
              return Array.from(mapped.values());
            });
          }
        } catch (e) {}
      }
    };
    
    fetchFallback();
    fallbackInterval = setInterval(fetchFallback, 10000); // 10s is fine for content feeds

    return () => {
      unsubscribeTheories();
      unsubscribeBlogPosts();
      unsubscribeEvents();
      unsubscribePromoCodes();
      clearInterval(fallbackInterval);
    };
  }, []);

  return { theories, blogPosts, events, promoCodes };
}
