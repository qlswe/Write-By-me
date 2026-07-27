import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, setDoc, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './useAuth';

export interface UserData {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  role: 'admin' | 'moderator' | 'user' | 'beta-tester';
  createdAt: string;
  lastLogin: string;
  lastSeen?: string;
  isVerified?: boolean;
  isBot?: boolean;
}

export const JUKY_BOT_USER: UserData = {
  uid: 'bot_juky',
  displayName: 'Juky AI (Жуки 🤖)',
  email: 'juky.bot@ahastation.internal',
  photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=JukyBotAha',
  role: 'admin',
  createdAt: '2026-01-01T00:00:00.000Z',
  lastLogin: new Date().toISOString(),
  isVerified: true,
  isBot: true
};

export function useUsers() {
  const [users, setUsers] = useState<UserData[]>([JUKY_BOT_USER]);
  const [loading, setLoading] = useState(true);
  const { isAdmin, role: currentRole, user } = useAuth();

  useEffect(() => {
    if (!user) {
      setUsers([JUKY_BOT_USER]);
      setLoading(false);
      return;
    }

    // Admins can see full user data (including email)
    // Regular users see public profiles
    const collectionName = isAdmin ? 'users' : 'public_profiles';
    // Limit to 200 users. If the app gets bigger, a proper search API (like Algolia or Typesense) is needed.
    const q = query(collection(db, collectionName), limit(200));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id
      } as UserData));
      
      // Always include Juky Bot if missing
      if (!usersData.some(u => u.uid === JUKY_BOT_USER.uid)) {
        usersData.unshift(JUKY_BOT_USER);
      }
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error(`Error fetching ${collectionName}:`, error);
      setUsers([JUKY_BOT_USER]);
      setLoading(false);
    });

    return unsubscribe;
  }, [isAdmin, user]);

  const updateUserRole = async (uid: string, role: 'admin' | 'moderator' | 'user' | 'beta-tester') => {
    if (!isAdmin) return;
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { role });
      
      const publicRef = doc(db, 'public_profiles', uid);
      await setDoc(publicRef, { role }, { merge: true });
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const updateUserVerification = async (uid: string, isVerified: boolean) => {
    const isModeratorOrAdmin = isAdmin || currentRole === 'moderator';
    if (!isModeratorOrAdmin) return;
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, { isVerified }, { merge: true });
      
      const publicRef = doc(db, 'public_profiles', uid);
      await setDoc(publicRef, { isVerified }, { merge: true });
    } catch (error) {
      console.error('Error updating user verification:', error);
    }
  };

  return { users, loading, updateUserRole, updateUserVerification };
}
