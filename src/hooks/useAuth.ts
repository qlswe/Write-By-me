import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { User, onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// --- GLOBAL SINGLETON STATE ---
let globalUser: User | null = null;
let globalLoading = true;
let globalIsAdmin = false;
let globalRole: 'admin' | 'moderator' | 'user' | 'beta-tester' = 'user';
let authInitialized = false;

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
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          globalRole = userData.role || 'user';
          globalIsAdmin = globalRole === 'admin' || (user.email === 'semegladysev527@gmail.com' && user.emailVerified);
          
          await setDoc(doc(db, 'public_profiles', user.uid), {
            uid: user.uid,
            displayName: user.displayName,
            photoURL: userData.photoURL || user.photoURL,
            role: userData.role || 'user',
          }, { merge: true });
        } else {
          const initialRole = (user.email === 'semegladysev527@gmail.com' && user.emailVerified) ? 'admin' : 'user';
          const userData = {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            role: initialRole,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          };
          await setDoc(userDocRef, userData);
          
          await setDoc(doc(db, 'public_profiles', user.uid), {
            uid: user.uid,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: initialRole,
          });
          
          globalRole = initialRole;
          globalIsAdmin = initialRole === 'admin';
        }
      } catch (e) {
        console.error("Error fetching user role:", e);
        globalIsAdmin = user.email === 'semegladysev527@gmail.com' && user.emailVerified;
        globalRole = 'user';
      }
    } else {
      globalIsAdmin = false;
      globalRole = 'user';
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

  const loginWithEmail = async (email: string) => {
    setError(null);
    console.log("Email login requested for:", email);
  };

  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
    } catch (error: any) {
      setError(error.message);
    }
  };

  return { 
    user: globalUser, 
    loading: globalLoading, 
    isAdmin: globalIsAdmin, 
    role: globalRole, 
    error, 
    loginWithGoogle, 
    loginWithEmail, 
    logout, 
    isLoggingIn 
  };
}
