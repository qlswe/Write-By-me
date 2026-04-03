import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { User, onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [role, setRole] = useState<'admin' | 'moderator' | 'user'>('user');

  useEffect(() => {
    // Handle redirect result for WebViews
    getRedirectResult(auth).catch((error) => {
      console.error("Error getting redirect result", error);
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setRole(userData.role || 'user');
            setIsAdmin(userData.role === 'admin' || (user.email === 'semegladysev527@gmail.com' && user.emailVerified));
            
            // Sync public profile
            await setDoc(doc(db, 'public_profiles', user.uid), {
              uid: user.uid,
              displayName: user.displayName,
              photoURL: user.photoURL,
              role: userData.role || 'user'
            }, { merge: true });
          } else {
            // First time login - create user document
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
            
            // Create public profile
            await setDoc(doc(db, 'public_profiles', user.uid), {
              uid: user.uid,
              displayName: user.displayName,
              photoURL: user.photoURL,
              role: initialRole
            });
            
            setRole(initialRole);
            setIsAdmin(initialRole === 'admin');
          }
        } catch (e) {
          console.error("Error fetching user role:", e);
          setIsAdmin(user.email === 'semegladysev527@gmail.com' && user.emailVerified);
          setRole('user');
        }
      } else {
        setIsAdmin(false);
        setRole('user');
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const [error, setError] = useState<string | null>(null);

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
        // User closed the popup, not a real error we need to log as an error
        console.warn("Login popup closed by user");
        return;
      }
      
      setError(error.message);
      console.error("Error logging in", error);
      
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, provider);
        } catch (redirectError: any) {
          setError(redirectError.message);
          console.error("Error logging in with redirect fallback", redirectError);
        }
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const loginWithEmail = async (email: string) => {
    setError(null);
    // This is a placeholder for email link or password login
    console.log("Email login requested for:", email);
  };

  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
    } catch (error: any) {
      setError(error.message);
      console.error("Error logging out", error);
    }
  };

  return { user, loading, isAdmin, role, error, loginWithGoogle, loginWithEmail, logout };
}
