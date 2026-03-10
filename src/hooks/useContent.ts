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
      const mappedFirestoreTheories = firestoreTheories.map(t => {
        const title = typeof t.title === 'string' ? t.title : (t.title?.en || '');
        const summary = typeof t.summary === 'string' ? t.summary : (t.summary?.en || '');
        const content = typeof t.content === 'string' ? t.content : (t.content?.en || '');
        return {
          ...t,
          title: { ru: title, en: title, by: title, jp: title, de: title, fr: title, zh: title },
          summary: { ru: summary, en: summary, by: summary, jp: summary, de: summary, fr: summary, zh: summary },
          content: { ru: content, en: content, by: content, jp: content, de: content, fr: content, zh: content }
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
      const mappedFirestoreBlogPosts = firestoreBlogPosts.map(p => {
        const title = typeof p.title === 'string' ? p.title : (p.title?.en || '');
        const summary = typeof p.summary === 'string' ? p.summary : (p.summary?.en || '');
        const content = typeof p.content === 'string' ? p.content : (p.content?.en || '');
        return {
          ...p,
          title: { ru: title, en: title, by: title, jp: title, de: title, fr: title, zh: title },
          summary: { ru: summary, en: summary, by: summary, jp: summary, de: summary, fr: summary, zh: summary },
          content: { ru: content, en: content, by: content, jp: content, de: content, fr: content, zh: content }
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
      const mappedFirestoreEvents = firestoreEvents.map(e => {
        const title = typeof e.title === 'string' ? e.title : (e.title?.en || '');
        const description = typeof e.description === 'string' ? e.description : (e.description?.en || '');
        return {
          ...e,
          title: { ru: title, en: title, by: title, jp: title, de: title, fr: title, zh: title },
          description: { ru: description, en: description, by: description, jp: description, de: description, fr: description, zh: description }
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
