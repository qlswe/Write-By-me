import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { theoriesData as localTheories, blogPostsData as localBlogPosts, eventsData as localEvents } from '../data/content';
import { handleFirestoreError, OperationType } from '../utils/errorHandlers';

export function useContent() {
  const [theories, setTheories] = useState<any[]>(localTheories);
  const [blogPosts, setBlogPosts] = useState<any[]>(localBlogPosts);
  const [events, setEvents] = useState<any[]>(localEvents);

  useEffect(() => {
    const qTheories = query(collection(db, 'theories'), orderBy('createdAt', 'desc'));
    const unsubscribeTheories = onSnapshot(qTheories, (snapshot) => {
      const firestoreTheories = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Merge local and firestore theories
      // Firestore theories don't have LocalizedString, they just have a string.
      // We will map them to look like local theories for the UI.
      const mappedFirestoreTheories = firestoreTheories.map((t: any) => {
        const title = typeof t.title === 'string' ? { ru: t.title, en: t.title, by: t.title, jp: t.title, de: t.title, fr: t.title, zh: t.title } : t.title;
        const summary = typeof t.summary === 'string' ? { ru: t.summary, en: t.summary, by: t.summary, jp: t.summary, de: t.summary, fr: t.summary, zh: t.summary } : t.summary;
        const content = typeof t.content === 'string' ? { ru: t.content, en: t.content, by: t.content, jp: t.content, de: t.content, fr: t.content, zh: t.content } : t.content;
        return {
          ...t,
          title: title || { ru: '', en: '', by: '', jp: '', de: '', fr: '', zh: '' },
          summary: summary || { ru: '', en: '', by: '', jp: '', de: '', fr: '', zh: '' },
          content: content || { ru: '', en: '', by: '', jp: '', de: '', fr: '', zh: '' }
        };
      });
      
      const firestoreIds = new Set(mappedFirestoreTheories.map(t => t.id));
      const filteredLocalTheories = localTheories.filter(t => !firestoreIds.has(t.id));
      setTheories([...mappedFirestoreTheories, ...filteredLocalTheories]);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'theories');
    });

    const qBlogPosts = query(collection(db, 'blogPosts'), orderBy('createdAt', 'desc'));
    const unsubscribeBlogPosts = onSnapshot(qBlogPosts, (snapshot) => {
      const firestoreBlogPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      const mappedFirestoreBlogPosts = firestoreBlogPosts.map((p: any) => {
        const title = typeof p.title === 'string' ? { ru: p.title, en: p.title, by: p.title, jp: p.title, de: p.title, fr: p.title, zh: p.title } : p.title;
        const summary = typeof p.summary === 'string' ? { ru: p.summary, en: p.summary, by: p.summary, jp: p.summary, de: p.summary, fr: p.summary, zh: p.summary } : p.summary;
        const content = typeof p.content === 'string' ? { ru: p.content, en: p.content, by: p.content, jp: p.content, de: p.content, fr: p.content, zh: p.content } : p.content;
        return {
          ...p,
          title: title || { ru: '', en: '', by: '', jp: '', de: '', fr: '', zh: '' },
          summary: summary || { ru: '', en: '', by: '', jp: '', de: '', fr: '', zh: '' },
          content: content || { ru: '', en: '', by: '', jp: '', de: '', fr: '', zh: '' }
        };
      });
      const firestorePostIds = new Set(mappedFirestoreBlogPosts.map(p => p.id));
      const filteredLocalBlogPosts = localBlogPosts.filter(p => !firestorePostIds.has(p.id));
      setBlogPosts([...mappedFirestoreBlogPosts, ...filteredLocalBlogPosts]);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'blogPosts');
    });

    const qEvents = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
    const unsubscribeEvents = onSnapshot(qEvents, (snapshot) => {
      const firestoreEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      const mappedFirestoreEvents = firestoreEvents.map((e: any) => {
        const title = typeof e.title === 'string' ? { ru: e.title, en: e.title, by: e.title, jp: e.title, de: e.title, fr: e.title, zh: e.title } : e.title;
        const description = typeof e.description === 'string' ? { ru: e.description, en: e.description, by: e.description, jp: e.description, de: e.description, fr: e.description, zh: e.description } : e.description;
        return {
          ...e,
          title: title || { ru: '', en: '', by: '', jp: '', de: '', fr: '', zh: '' },
          description: description || { ru: '', en: '', by: '', jp: '', de: '', fr: '', zh: '' }
        };
      });
      const firestoreEventIds = new Set(mappedFirestoreEvents.map(e => e.id));
      const filteredLocalEvents = localEvents.filter(e => !firestoreEventIds.has(e.id));
      setEvents([...mappedFirestoreEvents, ...filteredLocalEvents]);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'events');
    });

    return () => {
      unsubscribeTheories();
      unsubscribeBlogPosts();
      unsubscribeEvents();
    };
  }, []);

  return { theories, blogPosts, events };
}
