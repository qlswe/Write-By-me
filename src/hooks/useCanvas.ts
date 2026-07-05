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

  return { pixels, loading, drawPixel, erasePixel, clearCanvas, size };
}
