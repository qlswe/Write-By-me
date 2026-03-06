import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from './useAuth';
import { auth } from '../firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface UserData {
  favorites: string[];
  lang: string;
}

export function useUserData(initialLang: string) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [lang, setLang] = useState<string>(initialLang);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Load from local storage initially for fast render
  useEffect(() => {
    try {
      const localFavs = JSON.parse(localStorage.getItem('hsr_favorites') || '[]');
      if (localFavs.length > 0 && !isDataLoaded) {
        setFavorites(localFavs);
      }
      
      const localLang = localStorage.getItem('hsr_lang');
      if (localLang && !isDataLoaded) {
        setLang(localLang);
      }
    } catch (e) {
      console.error("Error loading local data", e);
    }
  }, [isDataLoaded]);

  // Sync with Firestore when user logs in
  useEffect(() => {
    if (!user) {
      setIsDataLoaded(true);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserData;
        if (data.favorites) {
          setFavorites(data.favorites);
          localStorage.setItem('hsr_favorites', JSON.stringify(data.favorites));
        }
        if (data.lang) {
          setLang(data.lang);
          localStorage.setItem('hsr_lang', data.lang);
        }
      } else {
        // Create initial document if it doesn't exist
        setDoc(userRef, {
          favorites: favorites,
          lang: lang,
          createdAt: new Date().toISOString()
        }, { merge: true }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`));
      }
      setIsDataLoaded(true);
    }, (error: any) => {
      // Ignore permission denied errors that happen during logout
      if (error?.code === 'permission-denied' && !auth.currentUser) {
        setIsDataLoaded(true);
        return;
      }
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      setIsDataLoaded(true);
    });

    return () => unsubscribe();
  }, [user]);

  const toggleFavorite = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const newFavorites = favorites.includes(id) 
      ? favorites.filter(favId => favId !== id) 
      : [...favorites, id];
      
    setFavorites(newFavorites);
    localStorage.setItem('hsr_favorites', JSON.stringify(newFavorites));

    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { favorites: newFavorites }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
      }
    }
  }, [favorites, user]);

  const updateLang = useCallback(async (newLang: string) => {
    setLang(newLang);
    localStorage.setItem('hsr_lang', newLang);

    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { lang: newLang }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
      }
    }
  }, [user]);

  return { favorites, toggleFavorite, lang, updateLang, isDataLoaded };
}
