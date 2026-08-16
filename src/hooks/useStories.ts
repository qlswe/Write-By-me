import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  deleteDoc, 
  limit,
  arrayUnion,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './useAuth';
import { vercelFallback } from '../utils/vercelFallback';
import { sanitizePayloadForFirestore } from '../utils/mediaUploader';
import { safeStorage } from '../utils/securityStorage';

export interface UserStory {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  type: 'text' | 'image';
  text: string;
  mediaUrl?: string;
  gradient?: string;
  createdAt: any;
  expiresAt?: any;
  views?: string[];
  likes?: string[];
}

export const STORY_GRADIENTS = [
  { id: 'masked_fools', name: 'Маска Радости 🎭', class: 'from-[#ff2d55] via-[#8e24aa] to-[#240046]' },
  { id: 'galaxy_express', name: 'Звёздный Экспресс 🚂', class: 'from-[#3b82f6] via-[#6366f1] to-[#1e1035]' },
  { id: 'hunt_fire', name: 'Пламя Охоты 🔥', class: 'from-[#ff6b00] via-[#dc2626] to-[#450a0a]' },
  { id: 'cyber_neon', name: 'Космический Неон 🪐', class: 'from-[#06b6d4] via-[#8b5cf6] to-[#180929]' },
  { id: 'jade_emerald', name: 'Звёздный Нефрит 💎', class: 'from-[#10b981] via-[#059669] to-[#022c22]' },
  { id: 'stellar_gold', name: 'Эон Золота 👑', class: 'from-[#f59e0b] via-[#d97706] to-[#3b1200]' }
];

export function useStories() {
  const { user } = useAuth();
  const [stories, setStories] = useState<UserStory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'user_stories'),
      limit(50)
    );

    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      clearTimeout(safetyTimer);
      const nowMs = Date.now();
      const rawStories = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as UserStory));

      // Deduplicate by unique id and filter out stories older than 48h
      const uniqueMap = new Map<string, UserStory>();
      rawStories.forEach(s => {
        if (!s.id) return;
        let createdMs = nowMs;
        if (s.createdAt) {
          if (typeof s.createdAt.toMillis === 'function') createdMs = s.createdAt.toMillis();
          else if (typeof s.createdAt === 'number') createdMs = s.createdAt;
          else if (typeof s.createdAt === 'string') createdMs = new Date(s.createdAt).getTime();
          else if (s.createdAt.seconds) createdMs = s.createdAt.seconds * 1000;
        }
        if ((nowMs - createdMs) < 86400000 * 2) {
          if (!uniqueMap.has(s.id)) {
            uniqueMap.set(s.id, s);
          }
        }
      });

      const activeStories = Array.from(uniqueMap.values());

      // Sort newest first
      activeStories.sort((a, b) => {
        const getMs = (item: UserStory) => {
          if (!item.createdAt) return 0;
          if (typeof item.createdAt.toMillis === 'function') return item.createdAt.toMillis();
          if (typeof item.createdAt === 'number') return item.createdAt;
          if (typeof item.createdAt === 'string') return new Date(item.createdAt).getTime();
          if (item.createdAt.seconds) return item.createdAt.seconds * 1000;
          return 0;
        };
        return getMs(b) - getMs(a);
      });

      setStories(activeStories);
      setLoading(false);
    }, (err) => {
      console.warn("Error fetching user stories:", err);
      // Try local fallback
      const cached = safeStorage.getItem('aha_cached_stories');
      if (cached) {
        try { setStories(JSON.parse(cached)); } catch(e) {}
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createStory = async ({
    type,
    text,
    mediaUrl,
    gradient
  }: {
    type: 'text' | 'image';
    text: string;
    mediaUrl?: string;
    gradient?: string;
  }) => {
    if (!user) return null;

    try {
      const rawPayload = {
        authorId: user.uid,
        authorName: user.displayName || 'User',
        authorPhoto: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=1c1528&color=fff`,
        type,
        text: text.trim(),
        mediaUrl: mediaUrl || null,
        gradient: gradient || STORY_GRADIENTS[0].class,
        createdAt: new Date().toISOString(),
        views: [user.uid],
        likes: []
      };

      const sanitized = await sanitizePayloadForFirestore(rawPayload);
      const docRef = await addDoc(collection(db, 'user_stories'), sanitized);
      const newStory = { ...sanitized, id: docRef.id } as UserStory;

      setStories(prev => [newStory, ...prev.filter(s => s.id !== newStory.id)]);
      return newStory;
    } catch (err) {
      console.error("Error creating story:", err);
      throw err;
    }
  };

  const markStoryViewed = async (storyId: string) => {
    if (!user) return;
    try {
      const storyRef = doc(db, 'user_stories', storyId);
      await updateDoc(storyRef, {
        views: arrayUnion(user.uid)
      });
      setStories(prev => prev.map(s => {
        if (s.id === storyId && !s.views?.includes(user.uid)) {
          return { ...s, views: [...(s.views || []), user.uid] };
        }
        return s;
      }));
    } catch (e) {
      console.warn("Could not mark story as viewed", e);
    }
  };

  const toggleLikeStory = async (storyId: string) => {
    if (!user) return;
    try {
      const target = stories.find(s => s.id === storyId);
      if (!target) return;

      const isLiked = target.likes?.includes(user.uid);
      const updatedLikes = isLiked 
        ? (target.likes || []).filter(id => id !== user.uid)
        : [...(target.likes || []), user.uid];

      const storyRef = doc(db, 'user_stories', storyId);
      await updateDoc(storyRef, {
        likes: updatedLikes
      });

      setStories(prev => prev.map(s => s.id === storyId ? { ...s, likes: updatedLikes } : s));
    } catch (e) {
      console.warn("Could not toggle story like", e);
    }
  };

  const deleteStory = async (storyId: string) => {
    if (!user) return;
    try {
      const storyRef = doc(db, 'user_stories', storyId);
      await deleteDoc(storyRef);
      setStories(prev => prev.filter(s => s.id !== storyId));
    } catch (err) {
      console.error("Error deleting story:", err);
    }
  };

  return {
    stories,
    loading,
    createStory,
    markStoryViewed,
    toggleLikeStory,
    deleteStory
  };
}
