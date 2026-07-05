import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { User, onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// --- GLOBAL SINGLETON STATE ---
let globalUser: User | null = null;
let globalLoading = true;
let globalIsAdmin = false;
let globalRole: 'admin' | 'moderator' | 'user' | 'beta-tester' = 'user';
let globalIsPremium = false;
let globalPhotoURL: string | null = null;
let authInitialized = false;

// Global cache to maintain stable object reference for user Proxy
let cachedProxiedUser: User | null = null;
let lastGlobalPhotoURL: string | null = null;
let lastGlobalUser: User | null = null;

const getProxiedUser = (): User | null => {
  if (!globalUser) {
    cachedProxiedUser = null;
    lastGlobalUser = null;
    lastGlobalPhotoURL = null;
    return null;
  }
  if (cachedProxiedUser && lastGlobalUser === globalUser && lastGlobalPhotoURL === globalPhotoURL) {
    return cachedProxiedUser;
  }
  
  lastGlobalUser = globalUser;
  lastGlobalPhotoURL = globalPhotoURL;
  
  cachedProxiedUser = new Proxy(globalUser, {
    get(target, prop, receiver) {
      if (prop === 'photoURL') {
        return globalPhotoURL || target.photoURL;
      }
      const val = Reflect.get(target, prop, receiver);
      if (typeof val === 'function') {
        return val.bind(target);
      }
      return val;
    }
  }) as User;
  
  return cachedProxiedUser;
};

const subscribers = new Set<() => void>();

const notifySubscribers = () => {
  subscribers.forEach(fn => fn());
};

const initAuth = () => {
  if (authInitialized) return;
  authInitialized = true;

  getRedirectResult(auth).catch((error) => {
    console.error("Error getting redirect result", error);
  });

  onAuthStateChanged(auth, async (user) => {
    globalUser = user;
    
    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        const fallbackName = user.displayName || user.email?.split('@')[0] || 'User';
        const fallbackPhoto = user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fallbackName)}`;

        if (userDoc.exists()) {
          const userData = userDoc.data();
          globalRole = user.email === 'semegladysev527@gmail.com' ? 'admin' : (userData.role || 'user');
          globalIsPremium = userData.isPremium || false;
          globalIsAdmin = globalRole === 'admin' || user.email === 'semegladysev527@gmail.com';
          globalPhotoURL = userData.photoURL || fallbackPhoto;
          
          // Create or update public profile safely without triggering "role" validation on update if unchanged
          const publicDocRef = doc(db, 'public_profiles', user.uid);
          const publicDoc = await getDoc(publicDocRef);
          if (!publicDoc.exists()) {
            await setDoc(publicDocRef, {
              uid: user.uid,
              displayName: fallbackName,
              photoURL: userData.photoURL || fallbackPhoto,
              role: 'user',
              isPremium: globalIsPremium,
            });
          } else {
            // Only update displayName or photoURL, do not include role to prevent security rules violation
            await setDoc(publicDocRef, {
              displayName: fallbackName,
              photoURL: userData.photoURL || fallbackPhoto,
            }, { merge: true });
          }
        } else {
          // Rule says: allow create: if isOwner(userId) && request.resource.data.get('role', 'user') == 'user';
          // So we must write 'role' as 'user' initially.
          const initialRole = 'user';
          const userData = {
            uid: user.uid,
            displayName: fallbackName,
            email: user.email || '',
            photoURL: fallbackPhoto,
            role: initialRole,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          };
          await setDoc(userDocRef, userData);
          
          await setDoc(doc(db, 'public_profiles', user.uid), {
            uid: user.uid,
            displayName: fallbackName,
            photoURL: fallbackPhoto,
            role: initialRole,
            isPremium: false,
          });
          
          globalRole = user.email === 'semegladysev527@gmail.com' ? 'admin' : initialRole;
          globalIsPremium = false;
          globalIsAdmin = globalRole === 'admin';
          globalPhotoURL = fallbackPhoto;
        }
      } catch (e) {
        console.error("Error fetching user role:", e);
        globalIsAdmin = user.email === 'semegladysev527@gmail.com';
        globalRole = user.email === 'semegladysev527@gmail.com' ? 'admin' : 'user';
        globalIsPremium = false;
        globalPhotoURL = user.photoURL || null;
      }
    } else {
      globalIsAdmin = false;
      globalRole = 'user';
      globalIsPremium = false;
      globalPhotoURL = null;
    }
    
    globalLoading = false;
    notifySubscribers();
  });

  // Last seen tracker - only runs ONCE globally, every 5 minutes
  setInterval(async () => {
    if (!globalUser) return;
    try {
      const now = new Date().toISOString();
      await setDoc(doc(db, 'public_profiles', globalUser.uid), { lastSeen: now }, { merge: true });
      await setDoc(doc(db, 'users', globalUser.uid), { lastSeen: now }, { merge: true });
    } catch (e) {
      console.error("Error updating last seen:", e);
    }
  }, 5 * 60 * 1000);
};

// Start initialization immediately
initAuth();

export function useAuth() {
  const [stamp, setStamp] = useState(0);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setStamp(prev => prev + 1);
    subscribers.add(update);
    return () => {
      subscribers.delete(update);
    };
  }, []);

  const loginWithGoogle = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        return;
      }
      setError(error.message);
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, provider);
        } catch (redirectError: any) {
          setError(redirectError.message);
        }
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const loginWithEmail = async (email: string, password?: string) => {
    setError(null);
    if (!password) {
      setError("Please provide a password.");
      return;
    }
    setIsLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const registerWithEmail = async (email: string, password?: string) => {
    setError(null);
    if (!password) {
      setError("Please provide a password.");
      return;
    }
    setIsLoggingIn(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const proxiedUser = getProxiedUser();

  return { 
    user: proxiedUser, 
    loading: globalLoading, 
    isAdmin: globalIsAdmin, 
    role: globalRole, 
    isPremium: globalIsPremium,
    error, 
    loginWithGoogle, 
    loginWithEmail, 
    registerWithEmail,
    logout, 
    isLoggingIn,
    updateGlobalPhoto: (url: string) => {
      globalPhotoURL = url;
      notifySubscribers();
    }
  };
}
