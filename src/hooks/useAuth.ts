import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { User, onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Handle redirect result for WebViews
    getRedirectResult(auth).catch((error) => {
      console.error("Error getting redirect result", error);
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        if (user.email === 'semegladysev527@gmail.com' && user.emailVerified) {
          setIsAdmin(true);
        } else {
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists() && userDoc.data().role === 'admin') {
              setIsAdmin(true);
            } else {
              setIsAdmin(false);
            }
          } catch (e) {
            setIsAdmin(false);
          }
        }
      } else {
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    
    try {
      // Use popup as the primary method as requested ("normal methods")
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Error logging in", error);
      // Fallback to redirect if popup fails (e.g. blocked)
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, provider);
        } catch (redirectError) {
          console.error("Error logging in with redirect fallback", redirectError);
        }
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error logging out", error);
    }
  };

  return { user, loading, isAdmin, loginWithGoogle, logout };
}
