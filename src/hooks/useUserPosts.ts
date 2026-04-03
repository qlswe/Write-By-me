import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './useAuth';

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
    const q = userId 
      ? query(collection(db, 'user_posts'), where('uid', '==', userId))
      : query(collection(db, 'user_posts'));

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

      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching user posts:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  const createPost = async (text: string) => {
    if (!user || !text.trim()) return;

    try {
      await addDoc(collection(db, 'user_posts'), {
        uid: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL,
        text: text.trim(),
        createdAt: new Date().toISOString() // Using ISO string for simplicity in display, or serverTimestamp()
      });
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
