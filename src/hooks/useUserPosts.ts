import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './useAuth';
import { vercelFallback } from '../utils/vercelFallback';

export interface UserPost {
  id: string;
  uid: string;
  authorName: string;
  authorPhoto?: string;
  text: string;
  createdAt: any;
  updatedAt?: any;
}

export function useUserPosts(userId?: string) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setPosts([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'user_posts'), 
      where('uid', '==', userId),
      limit(20) // Critical: prevent Quota exhaustion via mass-reads
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as UserPost));
      
      // Client-side sorting
      postsData.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      setPosts(prev => {
        if (!vercelFallback.isAvailable()) return postsData;
        const mapped = new Map([...prev, ...postsData].map(p => [p.id, p]));
        const sorted = Array.from(mapped.values()).sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });
        return sorted;
      });
      setLoading(false);
    }, (error) => {
      console.error("Error fetching user posts:", error);
      setLoading(false);
    });

    const fetchFallback = async () => {
      if (vercelFallback.isAvailable()) {
        try {
          const fallbackData = await vercelFallback.lrange(`user_posts:${userId}`, 0, 20);
          if (fallbackData && fallbackData.length > 0) {
            const parsed = fallbackData.map((str: any) => typeof str === 'string' ? JSON.parse(str) : str);
            setPosts(prev => {
              const mapped = new Map([...parsed, ...prev].map(p => [p.id, p]));
              const sorted = Array.from(mapped.values()).sort((a, b) => {
                  const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                  const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                  return dateB - dateA;
              });
              return sorted;
            });
          }
        } catch (e) {}
      }
    };
    fetchFallback();
    const fallbackInterval = setInterval(fetchFallback, 10000);

    return () => {
      unsubscribe();
      clearInterval(fallbackInterval);
    };
  }, [userId]);

  const createPost = async (text: string) => {
    if (!user || !text.trim()) return;

    try {
      const postData = {
        uid: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL,
        text: text.trim(),
        createdAt: new Date().toISOString()
      };

      if (vercelFallback.isAvailable()) {
          const payload = { ...postData, id: Date.now().toString() + '_' + user.uid };
          await vercelFallback.lpush(`user_posts:${user.uid}`, JSON.stringify(payload));
          setPosts(prev => [payload as any, ...prev]);
      } else {
          await addDoc(collection(db, 'user_posts'), postData);
      }
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  const updatePost = async (postId: string, text: string) => {
    if (!user || !text.trim()) return;

    try {
      const postRef = doc(db, 'user_posts', postId);
      await updateDoc(postRef, {
        text: text.trim(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating post:", error);
    }
  };

  const deletePost = async (postId: string) => {
    if (!user) return;

    try {
      const postRef = doc(db, 'user_posts', postId);
      await deleteDoc(postRef);
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  return { posts, loading, createPost, updatePost, deletePost };
}
