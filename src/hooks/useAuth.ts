import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { User, onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

// --- GLOBAL SINGLETON STATE ---
let globalUser: User | null = null;
let globalLoading = true;
let globalIsAdmin = false;
let globalRole: 'admin' | 'moderator' | 'user' | 'beta-tester' = 'user';
let globalIsPremium = false;
let globalIsVerified = false;
let globalPhotoURL: string | null = null;
let authInitialized = false;
let userDocUnsubscribe: (() => void) | null = null;

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
    // Unsubscribe from previous listener to avoid leaks
    if (userDocUnsubscribe) {
      userDocUnsubscribe();
      userDocUnsubscribe = null;
    }

    globalUser = user;
    
    if (user) {
      // Check 30 days session limit
      const sessionStart = localStorage.getItem('auth_session_start_time');
      const now = Date.now();
      if (sessionStart) {
        const elapsed = now - parseInt(sessionStart, 10);
        if (elapsed > 30 * 24 * 60 * 60 * 1000) { // 30 days
          localStorage.removeItem('auth_session_start_time');
          await signOut(auth);
          globalUser = null;
          globalIsAdmin = false;
          globalRole = 'user';
          globalIsPremium = false;
          globalIsVerified = false;
          globalPhotoURL = null;
          globalLoading = false;
          notifySubscribers();
          return;
        }
      } else {
        localStorage.setItem('auth_session_start_time', now.toString());
      }

      try {
        const userDocRef = doc(db, 'users', user.uid);
        
        const fallbackName = user.displayName || user.email?.split('@')[0] || 'User';
        const fallbackPhoto = user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fallbackName)}`;

        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          const initialRole = 'user';
          const initialVerified = user.emailVerified || false;
          const userData = {
            uid: user.uid,
            displayName: fallbackName,
            email: user.email || '',
            photoURL: fallbackPhoto,
            role: initialRole,
            isVerified: initialVerified,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          };
          await setDoc(userDocRef, userData);
          
          await setDoc(doc(db, 'public_profiles', user.uid), {
            uid: user.uid,
            displayName: fallbackName,
            photoURL: fallbackPhoto,
            role: initialRole,
            isVerified: initialVerified,
            isPremium: false,
            createdAt: new Date().toISOString(),
          });

          globalRole = initialRole;
          globalIsPremium = false;
          globalIsAdmin = false;
          globalIsVerified = initialVerified;
          globalPhotoURL = fallbackPhoto;
          globalLoading = false;
          notifySubscribers();
        } else {
          // Warm up synchronous state immediately with the fetched doc
          const userData = userDoc.data();
          globalRole = userData.role || 'user';
          globalIsPremium = userData.isPremium || false;
          globalIsAdmin = globalRole === 'admin';
          globalIsVerified = userData.isVerified || globalRole === 'admin' || globalRole === 'moderator' || globalRole === 'beta-tester' || user.emailVerified || false;
          globalPhotoURL = userData.photoURL || fallbackPhoto;
          globalLoading = false;
          notifySubscribers();
        }

        // Setup real-time listener to instantly reflect any Firestore user data changes (e.g. verification status, roles)
        userDocUnsubscribe = onSnapshot(userDocRef, async (snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.data();
            globalRole = userData.role || 'user';
            globalIsPremium = userData.isPremium || false;
            globalIsAdmin = globalRole === 'admin';
            globalIsVerified = userData.isVerified || globalRole === 'admin' || globalRole === 'moderator' || globalRole === 'beta-tester' || user.emailVerified || false;
            globalPhotoURL = userData.photoURL || fallbackPhoto;

            // Auto-verify if firebase auth says emailVerified but DB is false
            if (user.emailVerified && !userData.isVerified) {
              try {
                await setDoc(userDocRef, { isVerified: true }, { merge: true });
                await setDoc(doc(db, 'public_profiles', user.uid), { isVerified: true }, { merge: true });
              } catch (err) {
                console.error("Error auto-verifying user in snapshot:", err);
              }
            }
          }
          globalLoading = false;
          notifySubscribers();
        }, (err) => {
          console.error("User document subscription error:", err);
          globalLoading = false;
          notifySubscribers();
        });

      } catch (e) {
        console.error("Error fetching user role:", e);
        globalIsAdmin = false;
        globalRole = 'user';
        globalIsPremium = false;
        globalIsVerified = user.emailVerified || false;
        globalPhotoURL = user.photoURL || null;
        globalLoading = false;
        notifySubscribers();
      }
    } else {
      globalIsAdmin = false;
      globalRole = 'user';
      globalIsPremium = false;
      globalIsVerified = false;
      globalPhotoURL = null;
      globalLoading = false;
      notifySubscribers();
    }
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
      localStorage.setItem('auth_session_start_time', Date.now().toString());
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
      localStorage.setItem('auth_session_start_time', Date.now().toString());
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
      localStorage.setItem('auth_session_start_time', Date.now().toString());
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
      localStorage.removeItem('auth_session_start_time');
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
    isVerified: globalIsVerified,
    error, 
    loginWithGoogle, 
    loginWithEmail, 
    registerWithEmail,
    logout, 
    isLoggingIn,
    sendPasswordReset: async (email: string) => {
      setError(null);
      try {
        await sendPasswordResetEmail(auth, email);
      } catch (error: any) {
        setError(error.message);
        throw error;
      }
    },
    sendVerificationEmail: async () => {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
      }
    },
    reloadUser: async () => {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          globalIsVerified = true;
          await setDoc(doc(db, 'users', auth.currentUser.uid), { isVerified: true }, { merge: true });
          await setDoc(doc(db, 'public_profiles', auth.currentUser.uid), { isVerified: true }, { merge: true });
          notifySubscribers();
        }
      }
    },
    updateGlobalPhoto: (url: string) => {
      globalPhotoURL = url;
      notifySubscribers();
    }
  };
}
