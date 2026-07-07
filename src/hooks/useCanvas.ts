import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, deleteField } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './useAuth';

export interface CanvasPixel {
  color: string;
  userId: string;
  updatedAt: number;
}

export function useCanvas(size: number = 24, canvasId: string = 'canvas') {
  const { user } = useAuth();
  const [pixels, setPixels] = useState<Record<string, CanvasPixel>>({});
  const [loading, setLoading] = useState(true);

  const docId = canvasId.replace(/\//g, '_');

  useEffect(() => {
    const docRef = doc(db, 'canvases', docId);
    setLoading(true);
    setPixels({});
    
    // Realtime subscription using onSnapshot
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setPixels(data.pixels || {});
      } else {
        setPixels({});
      }
      setLoading(false);
    }, (err) => {
      console.error("Canvas fetch error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [docId]);

  const drawPixel = async (x: number, y: number, color: string) => {
    if (!user) return;
    if (size > 0 && (x < 0 || x >= size || y < 0 || y >= size)) return;
    
    // Security: Validate color payload format to prevent large string injection
    if (!/^#[0-9A-Fa-f]{6}$/.test(color) && color !== 'eraser') return;

    try {
      const pixelId = `${x},${y}`;
      const docRef = doc(db, 'canvases', docId);
      
      const newPixel: CanvasPixel = {
        color: color.substring(0, 10), // strict cap
        userId: user.uid,
        updatedAt: Date.now()
      };
      
      // Optimistic update
      setPixels(prev => ({ 
        ...prev, 
        [pixelId]: newPixel 
      }));
      
      await setDoc(docRef, {
        pixels: {
          [pixelId]: newPixel
        }
      }, { merge: true });
    } catch (error) {
      console.error("Error drawing pixel:", error);
    }
  };

  const erasePixel = async (x: number, y: number) => {
    if (!user) return;
    try {
      const pixelId = `${x},${y}`;
      const docRef = doc(db, 'canvases', docId);
      
      setPixels(prev => {
        const next = { ...prev };
        delete next[pixelId];
        return next;
      });
      
      await updateDoc(docRef, {
        [`pixels.${pixelId}`]: deleteField()
      });
    } catch (error) {
      console.error("Error erasing pixel:", error);
    }
  };

  const drawPixelsBatch = async (updates: Record<string, string | null>) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'canvases', docId);
      const firestorePixelsPayload: Record<string, any> = {};
      const firestoreDeletes: Record<string, any> = {};
      let hasDeletes = false;
      let hasDraws = false;

      Object.entries(updates).forEach(([pixelId, color]) => {
        if (color === null || color === 'eraser') {
          firestoreDeletes[`pixels.${pixelId}`] = deleteField();
          hasDeletes = true;
        } else {
          if (!/^#[0-9A-Fa-f]{6}$/.test(color)) return;
          const newPixel: CanvasPixel = {
            color: color.substring(0, 10),
            userId: user.uid,
            updatedAt: Date.now()
          };
          firestorePixelsPayload[pixelId] = newPixel;
          hasDraws = true;
        }
      });

      // Optimistic update of state
      setPixels(prev => {
        const next = { ...prev };
        Object.entries(updates).forEach(([pixelId, color]) => {
          if (color === null || color === 'eraser') {
            delete next[pixelId];
          } else {
            if (!/^#[0-9A-Fa-f]{6}$/.test(color)) return;
            next[pixelId] = {
              color: color.substring(0, 10),
              userId: user.uid,
              updatedAt: Date.now()
            };
          }
        });
        return next;
      });

      // Write to Firestore in batch
      if (hasDraws) {
        await setDoc(docRef, { pixels: firestorePixelsPayload }, { merge: true });
      }
      if (hasDeletes) {
        await updateDoc(docRef, firestoreDeletes);
      }
    } catch (error) {
      console.error("Error batch updating pixels:", error);
    }
  };

  const clearCanvas = async () => {
    if (!user) return;
    try {
      const docRef = doc(db, 'canvases', docId);
      await setDoc(docRef, { pixels: {} });
      setPixels({});
    } catch (error) {
      console.error('Error clearing canvas:', error);
    }
  };

  return { pixels, loading, drawPixel, erasePixel, drawPixelsBatch, clearCanvas, size };
}
