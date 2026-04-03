import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './useAuth';

export interface UserData {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  role: 'admin' | 'moderator' | 'user';
  createdAt: string;
  lastLogin: string;
}

export function useUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin, user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Admins can see full user data (including email)
    // Regular users see public profiles
    const collectionName = isAdmin ? 'users' : 'public_profiles';
    const q = query(collection(db, collectionName));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id
      } as UserData));
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error(`Error fetching ${collectionName}:`, error);
      setLoading(false);
    });

    return unsubscribe;
  }, [isAdmin, user]);

  const updateUserRole = async (uid: string, role: 'admin' | 'moderator' | 'user') => {
    if (!isAdmin) return;
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { role });
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  return { users, loading, updateUserRole };
}
