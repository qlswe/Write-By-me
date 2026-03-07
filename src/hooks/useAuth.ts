import { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { User, onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut } from 'firebase/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle redirect result for WebViews
    getRedirectResult(auth).catch((error) => {
      console.error("Error getting redirect result", error);
    });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    
    // Check if we are in a mobile environment or WebView
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isWebView = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(navigator.userAgent) || 
                      /Android.*Version\/[0-9].[0-9]/.test(navigator.userAgent) ||
                      navigator.userAgent.includes('wv');

    try {
      if (isMobile || isWebView) {
        // Force redirect for mobile and WebViews to avoid popup blockers and cross-origin issues
        await signInWithRedirect(auth, provider);
      } else {
        // Use popup for desktop browsers
        await signInWithPopup(auth, provider);
      }
    } catch (error: any) {
      console.error("Error logging in", error);
      // Fallback to redirect if popup fails on desktop
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

  return { user, loading, loginWithGoogle, logout };
}
