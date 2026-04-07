import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from './useAuth';
import { handleFirestoreError, OperationType } from '../utils/errorHandlers';
import { useTranslation } from 'react-i18next';
import { sdk } from '../sdk';
import { toast } from 'sonner';

interface UserData {
  favorites: string[];
  lang: string;
  lowPerfMode?: boolean;
  hsrUid?: string;
  hsrServer?: string;
  trailblazerLevel?: number;
  signature?: string;
  mainCharacter?: string;
  role?: 'admin' | 'moderator' | 'user';
  reputation?: number;
  xp?: number;
  photoURL?: string;
}

export function useUserData(initialLang: string) {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [lang, setLang] = useState<string>(initialLang);
  const [lowPerfMode, setLowPerfMode] = useState<boolean>(false);
  const [hsrUid, setHsrUid] = useState<string>('');
  const [hsrServer, setHsrServer] = useState<string>('Europe');
  const [trailblazerLevel, setTrailblazerLevel] = useState<number>(1);
  const [signature, setSignature] = useState<string>('');
  const [mainCharacter, setMainCharacter] = useState<string>('Stelle');
  const [role, setRole] = useState<'admin' | 'moderator' | 'user'>('user');
  const [reputation, setReputation] = useState<number>(0);
  const [xp, setXp] = useState<number>(0);
  const [photoURL, setPhotoURL] = useState<string>('');
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
      } else if (!isDataLoaded) {
        // Use i18n detected language if no local storage
        setLang(i18n.language.split('-')[0]);
      }

      const localPerf = localStorage.getItem('hsr_low_perf');
      if (localPerf === 'true' && !isDataLoaded) {
        setLowPerfMode(true);
      } else if (localPerf === null && !isDataLoaded) {
        // Auto-detect low-end device if no preference is set
        const isLowEnd = sdk.hardware.isLowEndDevice();
        if (isLowEnd) {
          setLowPerfMode(true);
          localStorage.setItem('hsr_low_perf', 'true');
        }
      }
    } catch (e) {
      console.error("Error loading local data", e);
    }
  }, [isDataLoaded, i18n.language]);

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
        if (data.hsrUid !== undefined) setHsrUid(data.hsrUid);
        if (data.hsrServer !== undefined) setHsrServer(data.hsrServer);
        if (data.trailblazerLevel !== undefined) setTrailblazerLevel(data.trailblazerLevel);
        if (data.signature !== undefined) setSignature(data.signature);
        if (data.mainCharacter !== undefined) setMainCharacter(data.mainCharacter);
        if (data.role !== undefined) setRole(data.role);
        // Hardcoded admin check for the user's email
        if (user.email === 'semegladysev527@gmail.com') {
          setRole('admin');
        }
        if (data.reputation !== undefined) setReputation(data.reputation);
        if (data.xp !== undefined) setXp(data.xp);
        if (data.photoURL !== undefined) setPhotoURL(data.photoURL);
      } else {
        // Create initial document if it doesn't exist
        setDoc(userRef, {
          favorites: favorites,
          lang: lang,
          lowPerfMode: lowPerfMode,
          hsrUid: hsrUid,
          hsrServer: hsrServer,
          trailblazerLevel: trailblazerLevel,
          signature: signature,
          mainCharacter: mainCharacter,
          role: 'user',
          reputation: 0,
          xp: 0,
          photoURL: user.photoURL || '',
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
    
    // SDK Security: Rate limit favorite toggles
    if (!sdk.security.rateLimit('toggle_favorite', 10, 60000)) {
      toast.error("Action too fast. Please wait.");
      return;
    }

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

  const updateProfile = useCallback(async (uid: string, server: string, level: number, sig: string, mainChar: string, newPhotoURL?: string) => {
    setHsrUid(uid);
    setHsrServer(server);
    setTrailblazerLevel(level);
    setSignature(sig);
    setMainCharacter(mainChar);
    if (newPhotoURL) setPhotoURL(newPhotoURL);

    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        const updates: any = { 
          hsrUid: uid,
          hsrServer: server,
          trailblazerLevel: level,
          signature: sig,
          mainCharacter: mainChar
        };
        if (newPhotoURL) updates.photoURL = newPhotoURL;
        await setDoc(userRef, updates, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
      }
    }
  }, [user]);

  return { favorites, toggleFavorite, clearFavorites, lang, updateLang, lowPerfMode, toggleLowPerfMode, hsrUid, hsrServer, trailblazerLevel, signature, mainCharacter, role, reputation, xp, photoURL, updateProfile, isDataLoaded };
}
