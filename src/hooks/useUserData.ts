import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from './useAuth';
import { handleFirestoreError, OperationType } from '../utils/errorHandlers';

interface UserData {
  favorites: string[];
  lang: string;
  lowPerfMode?: boolean;
}

export function useUserData(initialLang: string) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [lang, setLang] = useState<string>(initialLang);
  const [lowPerfMode, setLowPerfMode] = useState<boolean>(false);
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

      const localPerf = localStorage.getItem('hsr_low_perf');
      if (localPerf === 'true' && !isDataLoaded) {
        setLowPerfMode(true);
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
        if (data.lowPerfMode !== undefined) {
          setLowPerfMode(data.lowPerfMode);
          localStorage.setItem('hsr_low_perf', String(data.lowPerfMode));
        }
      } else {
        // Create initial document if it doesn't exist
        setDoc(userRef, {
          favorites: favorites,
          lang: lang,
          lowPerfMode: lowPerfMode,
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

  const clearFavorites = useCallback(async () => {
    setFavorites([]);
    localStorage.setItem('hsr_favorites', JSON.stringify([]));

    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { favorites: [] }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
      }
    }
  }, [user]);

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

  const toggleLowPerfMode = useCallback(async () => {
    const newValue = !lowPerfMode;
    setLowPerfMode(newValue);
    localStorage.setItem('hsr_low_perf', String(newValue));

    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { lowPerfMode: newValue }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
      }
    }
  }, [lowPerfMode, user]);

  return { favorites, toggleFavorite, clearFavorites, lang, updateLang, lowPerfMode, toggleLowPerfMode, isDataLoaded };
}
