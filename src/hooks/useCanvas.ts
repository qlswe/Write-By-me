import { useState, useEffect } from 'react';
import { ref, onValue, set, get, remove } from 'firebase/database';
import { rtdb } from '../firebase';
import { useAuth } from './useAuth';

export interface CanvasPixel {
  color: string;
  userId: string;
  updatedAt: number;
}

export function useCanvas(size: number = 24) {
  const { user } = useAuth();
  const [pixels, setPixels] = useState<Record<string, CanvasPixel>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const canvasRef = ref(rtdb, 'canvas');
    
    // Initial fetch
    get(canvasRef).then((snapshot) => {
      if (snapshot.exists()) {
        setPixels(snapshot.val());
      }
      setLoading(false);
    }).catch(err => {
      console.error("Canvas fetch error:", err);
      setLoading(false);
    });

    // Realtime subscription
    const unsubscribe = onValue(canvasRef, (snapshot) => {
      if (snapshot.exists()) {
        setPixels(snapshot.val());
      } else {
        setPixels({});
      }
    });

    return () => unsubscribe();
  }, []);

  const drawPixel = async (x: number, y: number, color: string) => {
    if (!user) return;
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    
    // Security: Validate color payload format to prevent large string injection
    if (!/^#[0-9A-Fa-f]{6}$/.test(color) && color !== 'eraser') return;

    try {
      const pixelId = `${x},${y}`;
      const pixelRef = ref(rtdb, `canvas/${pixelId}`);
      
      const newPixel: CanvasPixel = {
        color: color.substring(0, 10), // strict cap
        userId: user.uid,
        updatedAt: Date.now()
      };
      
      // Optimistic update
      setPixels(prev => ({ ...prev, [pixelId]: newPixel }));
      
      await set(pixelRef, newPixel);
    } catch (error) {
      console.error("Error drawing pixel:", error);
    }
  };

  const erasePixel = async (x: number, y: number) => {
    if (!user) return;
    try {
      const pixelId = `${x},${y}`;
      const pixelRef = ref(rtdb, `canvas/${pixelId}`);
      
      setPixels(prev => {
        const next = { ...prev };
        delete next[pixelId];
        return next;
      });
      
      await remove(pixelRef);
    } catch (error) {
      console.error("Error erasing pixel:", error);
    }
  };

  return { pixels, loading, drawPixel, erasePixel, size };
}
