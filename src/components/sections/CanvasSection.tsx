import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation, useMotionValue, AnimatePresence } from 'framer-motion';
import { Palette, LogIn, Maximize, RefreshCw, Users, Info, Eraser, Move, PenTool, Save, User as UserIcon, Undo2, Redo2, Mail, Lock, ShieldAlert, PaintBucket, Slash, Square, Grid, Download, LayoutGrid, FolderOpen, Trash2, Plus, Bookmark, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useCanvas } from '../../hooks/useCanvas';
import { translations, Language } from '../../data/translations';
import { GoogleLoginButton } from '../ui/GoogleLoginButton';
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp, onSnapshot, query, where, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { encryptImage } from '../../utils/encryption';


const COLORS = [
  '#000000', '#ffffff', '#ff4d4d', '#4dff4d', '#4d4dff', 
  '#ffff4d', '#ff4dff', '#4dffff', '#ff8800', '#8c1aff',
  '#00cc66', '#808080'
];

type CanvasMode = 'global' | 'personal';
type Tool = 'draw' | 'eraser' | 'bucket' | 'line' | 'rect' | 'move';

type StrokeAction = {
  pixelId: string;
  oldColor: string | null;
  newColor: string | null;
};

const TEMPLATES: Record<string, { name: string; nameRu: string; pixels: Record<string, string> }> = {
  heart: {
    name: 'Heart',
    nameRu: 'Сердечко',
    pixels: {
      "3,1": "#ff4d4d", "4,1": "#ff4d4d", "7,1": "#ff4d4d", "8,1": "#ff4d4d",
      "2,2": "#ff4d4d", "3,2": "#ff4d4d", "4,2": "#ff4d4d", "5,2": "#ff4d4d", "6,2": "#ff4d4d", "7,2": "#ff4d4d", "8,2": "#ff4d4d", "9,2": "#ff4d4d",
      "1,3": "#ff4d4d", "2,3": "#ff4d4d", "3,3": "#ff4d4d", "4,3": "#ff4d4d", "5,3": "#ff4d4d", "6,3": "#ff4d4d", "7,3": "#ff4d4d", "8,3": "#ff4d4d", "9,3": "#ff4d4d", "10,3": "#ff4d4d",
      "1,4": "#ff4d4d", "2,4": "#ff4d4d", "3,4": "#ff4d4d", "4,4": "#ff4d4d", "5,4": "#ff4d4d", "6,4": "#ff4d4d", "7,4": "#ff4d4d", "8,4": "#ff4d4d", "9,4": "#ff4d4d", "10,4": "#ff4d4d",
      "2,5": "#ff4d4d", "3,5": "#ff4d4d", "4,5": "#ff4d4d", "5,5": "#ff4d4d", "6,5": "#ff4d4d", "7,5": "#ff4d4d", "8,5": "#ff4d4d", "9,5": "#ff4d4d",
      "3,6": "#ff4d4d", "4,6": "#ff4d4d", "5,6": "#ff4d4d", "6,6": "#ff4d4d", "7,6": "#ff4d4d", "8,6": "#ff4d4d",
      "4,7": "#ff4d4d", "5,7": "#ff4d4d", "6,7": "#ff4d4d", "7,7": "#ff4d4d",
      "5,8": "#ff4d4d", "6,8": "#ff4d4d"
    }
  },
  smiley: {
    name: 'Smiley',
    nameRu: 'Смайлик',
    pixels: {
      "3,1": "#ffff4d", "4,1": "#ffff4d", "5,1": "#ffff4d", "6,1": "#ffff4d", "7,1": "#ffff4d", "8,1": "#ffff4d",
      "2,2": "#ffff4d", "9,2": "#ffff4d", "3,3": "#000000", "8,3": "#000000",
      "1,3": "#ffff4d", "10,3": "#ffff4d", "1,4": "#ffff4d", "10,4": "#ffff4d",
      "1,5": "#ffff4d", "10,5": "#ffff4d", "1,6": "#ffff4d", "10,6": "#ffff4d", "3,7": "#000000", "8,7": "#000000",
      "4,8": "#000000", "5,8": "#000000", "6,8": "#000000", "7,8": "#000000"
    }
  },
  sword: {
    name: 'Sword',
    nameRu: 'Меч',
    pixels: {
      "9,1": "#ffffff", "9,2": "#ffffff", "8,2": "#808080", "10,2": "#808080",
      "8,3": "#ffffff", "9,3": "#ffffff", "10,3": "#ffffff",
      "7,4": "#808080", "8,4": "#ffffff", "9,4": "#ffffff", "10,4": "#ffffff", "11,4": "#808080",
      "6,5": "#808080", "7,5": "#ffffff", "8,5": "#ffffff", "9,5": "#ffffff", "10,5": "#ffffff", "11,5": "#ffffff",
      "5,6": "#808080", "6,6": "#ffffff", "7,6": "#ffffff", "8,6": "#ffffff", "9,6": "#ffffff",
      "4,7": "#808080", "5,7": "#ffffff", "6,7": "#ffffff", "7,7": "#ffffff",
      "3,8": "#808080", "4,8": "#ffffff", "5,8": "#ffffff",
      "2,9": "#8c1aff", "3,9": "#8c1aff", "4,9": "#808080",
      "1,10": "#ff8800", "2,10": "#8c1aff"
    }
  },
  star: {
    name: 'Star',
    nameRu: 'Звезда',
    pixels: {
      "5,1": "#ffff4d", "4,2": "#ffff4d", "5,2": "#ffff4d", "6,2": "#ffff4d",
      "1,3": "#ffff4d", "2,3": "#ffff4d", "3,3": "#ffff4d", "4,3": "#ffff4d", "5,3": "#ffff4d", "6,3": "#ffff4d", "7,3": "#ffff4d", "8,3": "#ffff4d", "9,3": "#ffff4d",
      "2,4": "#ffff4d", "3,4": "#ffff4d", "4,4": "#ffff4d", "5,4": "#ffff4d", "6,4": "#ffff4d", "7,4": "#ffff4d", "8,4": "#ffff4d",
      "3,5": "#ffff4d", "4,5": "#ffff4d", "5,5": "#ffff4d", "6,5": "#ffff4d", "7,5": "#ffff4d",
      "2,6": "#ffff4d", "3,6": "#ffff4d", "4,6": "#ffff4d", "5,6": "#ffff4d", "6,6": "#ffff4d", "7,6": "#ffff4d", "8,6": "#ffff4d",
      "1,7": "#ffff4d", "5,7": "#ffff4d", "9,7": "#ffff4d"
    }
  }
};

export const CanvasSection: React.FC<{ lang: Language }> = ({ lang }) => {
  const { user, loginWithGoogle, isVerified } = useAuth();
  const innerRef = useRef<HTMLDivElement>(null);
  
  const [mode, setMode] = useState<CanvasMode>('personal');
  const [personalSize, setPersonalSize] = useState<number>(32);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [previewPixels, setPreviewPixels] = useState<Record<string, string>>({});
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

  // Use unique ID for personal canvas based on size so layouts are saved independently
  const canvasId = mode === 'global' ? 'canvas' : `canvas_personal/${user?.uid}_${personalSize}`;
  // For global we pass 0 which means infinite in our hook
  const { pixels, loading, drawPixel, erasePixel, drawPixelsBatch, clearCanvas, size } = useCanvas(mode === 'global' ? 0 : personalSize, canvasId); 
  
  const MAX_PIXELS = 100;
  const [pixelsLeft, setPixelsLeft] = useState(() => {
    try {
      const stored = localStorage.getItem('aha_canvas_limit');
      if (stored) {
        const parsed = JSON.parse(stored);
        const currentHourId = Math.floor(Date.now() / 3600000);
        if (parsed.hour === currentHourId) {
          return parsed.left;
        }
      }
    } catch(e) {}
    return MAX_PIXELS;
  });

  useEffect(() => {
    const currentHourId = Math.floor(Date.now() / 3600000);
    localStorage.setItem('aha_canvas_limit', JSON.stringify({
      hour: currentHourId,
      left: pixelsLeft
    }));
  }, [pixelsLeft]);
  
  const [selectedColor, setSelectedColor] = useState<string>(COLORS[2]);
  const [tool, setTool] = useState<Tool>('draw');
  const [scale, setScale] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastDrawn, setLastDrawn] = useState<string | null>(null);

  const [undoStack, setUndoStack] = useState<StrokeAction[][]>([]);
  const [redoStack, setRedoStack] = useState<StrokeAction[][]>([]);
  const currentStrokeRef = useRef<StrokeAction[]>([]);

  useEffect(() => {
    setUndoStack([]);
    setRedoStack([]);
    setPreviewPixels({});
  }, [canvasId]);

  const t = translations[lang] as any;

  // States for publishing canvas to forum threads with custom caption
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishTitle, setPublishTitle] = useState('');
  const [publishCaption, setPublishCaption] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishIsProtected, setPublishIsProtected] = useState<boolean>(true);
  const [protectedViewFeatureEnabled, setProtectedViewFeatureEnabled] = useState<boolean>(true);

  // States for canvas drafts (sketches/черновики)
  const [drafts, setDrafts] = useState<any[]>([]);
  const [draftName, setDraftName] = useState('');
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [selectedDraftForSaves, setSelectedDraftForSaves] = useState<any | null>(null);

  useEffect(() => {
    if (isPublishModalOpen || selectedDraftForSaves !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isPublishModalOpen, selectedDraftForSaves]);

  // Subscribe to user drafts in real-time
  useEffect(() => {
    if (!user) {
      setDrafts([]);
      setLoadingDrafts(false);
      return;
    }
    setLoadingDrafts(true);
    const q = query(
      collection(db, 'canvas_drafts'),
      where('userId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      list.sort((a: any, b: any) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setDrafts(list);
      setLoadingDrafts(false);
    }, (err) => {
      console.error("Drafts subscribe error:", err);
      setLoadingDrafts(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleSaveDraft = async () => {
    if (!user) return;
    if (Object.keys(pixels).length === 0) {
      window.dispatchEvent(new CustomEvent('aha_toast', { detail: lang === 'ru' ? "Нельзя сохранить пустой холст!" : "Cannot save empty canvas!" }));
      return;
    }
    
    setIsSavingDraft(true);
    const nameToUse = draftName.trim() || `${lang === 'ru' ? 'Черновик' : 'Draft'} #${drafts.length + 1}`;
    
    const initialSave = {
      id: 'save_' + Date.now(),
      pixels: pixels,
      size: personalSize,
      createdAt: new Date().toISOString()
    };
    
    try {
      await addDoc(collection(db, 'canvas_drafts'), {
        userId: user.uid,
        name: nameToUse,
        pixels: pixels,
        size: personalSize,
        createdAt: new Date().toISOString(),
        saves: [initialSave]
      });
      setDraftName('');
      window.dispatchEvent(new CustomEvent('aha_toast', { detail: lang === 'ru' ? 'Эскиз успешно сохранен в черновики!' : 'Sketch successfully saved to drafts!' }));
    } catch (e) {
      console.error("Error saving draft:", e);
      window.dispatchEvent(new CustomEvent('aha_toast', { detail: lang === 'ru' ? 'Ошибка сохранения черновика' : 'Error saving draft' }));
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleLoadDraft = async (draft: any) => {
    if (!user) return;
    if (!window.confirm(lang === 'ru' ? `Загрузить черновик "${draft.name}"? Текущий холст будет перезаписан.` : `Load draft "${draft.name}"? Current canvas will be overwritten.`)) {
      return;
    }

    try {
      // First update personal size so canvasId matches
      if (draft.size && draft.size !== personalSize) {
        setPersonalSize(draft.size);
      }
      
      const targetCanvasId = `canvas_personal/${user.uid}_${draft.size || personalSize}`;
      const targetDocId = targetCanvasId.replace(/\//g, '_');
      const docRef = doc(db, 'canvases', targetDocId);
      
      await setDoc(docRef, {
        pixels: draft.pixels || {}
      });
      
      window.dispatchEvent(new CustomEvent('aha_toast', { detail: lang === 'ru' ? 'Черновик успешно загружен!' : 'Draft loaded successfully!' }));
    } catch (e) {
      console.error("Error loading draft:", e);
      window.dispatchEvent(new CustomEvent('aha_toast', { detail: lang === 'ru' ? 'Ошибка загрузки черновика' : 'Error loading draft' }));
    }
  };

  const handleDeleteDraft = async (draftId: string, name: string) => {
    if (!window.confirm(lang === 'ru' ? `Удалить черновик "${name}"?` : `Delete draft "${name}"?`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'canvas_drafts', draftId));
      window.dispatchEvent(new CustomEvent('aha_toast', { detail: lang === 'ru' ? 'Черновик удален' : 'Draft deleted' }));
    } catch (e) {
      console.error("Error deleting draft:", e);
      window.dispatchEvent(new CustomEvent('aha_toast', { detail: lang === 'ru' ? 'Ошибка удаления' : 'Error deleting draft' }));
    }
  };

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        setProtectedViewFeatureEnabled(docSnap.data().protectedViewFeatureEnabled !== false);
      }
    });
    return () => unsub();
  }, []);


  const lastTouchDistRef = useRef<number | null>(null);
  const [lastMoveCoords, setLastMoveCoords] = useState<{ x: number; y: number } | null>(null);

  const getGridCoords = (clientX: number, clientY: number): { x: number; y: number } | null => {
    if (!innerRef.current) return null;
    const rect = innerRef.current.getBoundingClientRect();
    const rawX = clientX - rect.left;
    const rawY = clientY - rect.top;
    
    const cellWidth = isGlobal ? (20 * scale) : (rect.width / size);
    const cellHeight = isGlobal ? (20 * scale) : (rect.height / size);
    
    const x = Math.floor(rawX / cellWidth);
    const y = Math.floor(rawY / cellHeight);
    return { x, y };
  };

  const getLinePixels = (x0: number, y0: number, x1: number, y1: number): [number, number][] => {
    const coords: [number, number][] = [];
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;
    
    while (true) {
      coords.push([x0, y0]);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }
    return coords;
  };

  const getRectPixels = (x0: number, y0: number, x1: number, y1: number): [number, number][] => {
    const coords: [number, number][] = [];
    const minX = Math.min(x0, x1);
    const maxX = Math.max(x0, x1);
    const minY = Math.min(y0, y1);
    const maxY = Math.max(y0, y1);
    
    for (let x = minX; x <= maxX; x++) {
      coords.push([x, minY]);
      coords.push([x, maxY]);
    }
    for (let y = minY + 1; y < maxY; y++) {
      coords.push([minX, y]);
      coords.push([maxX, y]);
    }
    return coords;
  };

  const floodFill = async (startX: number, startY: number, fillHexColor: string) => {
    if (!user) return;
    if (!isVerified) {
      window.dispatchEvent(new CustomEvent('aha_toast', { detail: lang === 'ru' ? "Только верифицированные пользователи могут рисовать!" : "Only verified users can paint!" }));
      return;
    }
    const currentSize = isGlobal ? 500 : size;
    if (startX < 0 || startX >= currentSize || startY < 0 || startY >= currentSize) return;
    
    const targetColor = pixels[`${startX},${startY}`]?.color || null;
    const realFillColor = fillHexColor === 'eraser' ? null : fillHexColor;
    if (targetColor === realFillColor) return;
    
    const maxFlood = 1500; // slightly larger allowance for beautiful fillings
    const queue: [number, number][] = [[startX, startY]];
    const visited = new Set<string>();
    const strokeActions: StrokeAction[] = [];
    const updates: Record<string, string | null> = {};

    const getPixelColorLocal = (key: string): string | null => {
      if (key in updates) {
        return updates[key];
      }
      return pixels[key]?.color || null;
    };
    
    while (queue.length > 0 && strokeActions.length < maxFlood) {
      const [cx, cy] = queue.shift()!;
      const key = `${cx},${cy}`;
      if (visited.has(key)) continue;
      visited.add(key);
      
      const currColor = getPixelColorLocal(key);
      if (currColor === targetColor) {
        strokeActions.push({ pixelId: key, oldColor: pixels[key]?.color || null, newColor: realFillColor });
        updates[key] = realFillColor;
        
        const neighbors = [
          [cx + 1, cy],
          [cx - 1, cy],
          [cx, cy + 1],
          [cx, cy - 1]
        ];
        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < currentSize && ny >= 0 && ny < currentSize) {
            const neighborKey = `${nx},${ny}`;
            if (!visited.has(neighborKey)) {
              queue.push([nx, ny]);
            }
          }
        }
      }
    }
    
    if (strokeActions.length > 0) {
      await drawPixelsBatch(updates);
      setUndoStack(prev => [...prev, strokeActions]);
      setRedoStack([]);
    }
  };

  const handlePointerDown = (clientX: number, clientY: number) => {
    if (tool === 'move' || !user) return;
    if (!isVerified) {
      window.dispatchEvent(new CustomEvent('aha_toast', { detail: lang === 'ru' ? "Только верифицированные пользователи могут рисовать!" : "Only verified users can paint!" }));
      return;
    }
    const coords = getGridCoords(clientX, clientY);
    if (!coords) return;
    const { x, y } = coords;

    setIsDrawing(true);
    setLastDrawn(null);
    setLastMoveCoords({ x, y });

    if (tool === 'bucket') {
      floodFill(x, y, selectedColor);
      setIsDrawing(false);
    } else if (tool === 'line' || tool === 'rect') {
      setStartPoint({ x, y });
      setPreviewPixels({});
    } else {
      currentStrokeRef.current = [];
      paintPixel(x, y);
    }
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDrawing || tool === 'move' || !user) return;
    const coords = getGridCoords(clientX, clientY);
    if (!coords) return;
    const { x, y } = coords;
    setLastMoveCoords({ x, y });

    if (tool === 'line' || tool === 'rect') {
      if (startPoint) {
        const previewMap: Record<string, string> = {};
        const pPixels = tool === 'line' 
          ? getLinePixels(startPoint.x, startPoint.y, x, y)
          : getRectPixels(startPoint.x, startPoint.y, x, y);
        pPixels.forEach(([px, py]) => {
          if (isGlobal || (px >= 0 && px < size && py >= 0 && py < size)) {
            previewMap[`${px},${py}`] = selectedColor === 'eraser' ? '#15101e' : selectedColor;
          }
        });
        setPreviewPixels(previewMap);
      }
    } else if (tool === 'draw' || tool === 'eraser') {
      paintPixel(x, y);
    }
  };

  const handlePointerUp = (clientX?: number, clientY?: number) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setLastDrawn(null);

    const targetX = lastMoveCoords?.x ?? startPoint?.x;
    const targetY = lastMoveCoords?.y ?? startPoint?.y;

    if ((tool === 'line' || tool === 'rect') && startPoint && targetX !== undefined && targetY !== undefined) {
      const pPixels = tool === 'line' 
        ? getLinePixels(startPoint.x, startPoint.y, targetX, targetY)
        : getRectPixels(startPoint.x, startPoint.y, targetX, targetY);

      const strokeActions: StrokeAction[] = [];
      pPixels.forEach(([px, py]) => {
        if (!isGlobal && (px < 0 || px >= size || py < 0 || py >= size)) return;
        const pixelId = `${px},${py}`;
        const existing = pixels[pixelId];
        const oldColor = existing ? existing.color : null;

        if (selectedColor === 'eraser') {
          strokeActions.push({ pixelId, oldColor, newColor: null });
          erasePixel(px, py);
        } else {
          if (existing && existing.color === selectedColor) return;
          strokeActions.push({ pixelId, oldColor, newColor: selectedColor });
          drawPixel(px, py, selectedColor);
        }
      });

      if (strokeActions.length > 0) {
        setUndoStack(prev => [...prev, strokeActions]);
        setRedoStack([]);
      }
    } else {
      if (currentStrokeRef.current.length > 0) {
        const strokeCopy = [...currentStrokeRef.current];
        setUndoStack(prev => [...prev, strokeCopy]);
        setRedoStack([]);
      }
    }

    setStartPoint(null);
    setPreviewPixels({});
    currentStrokeRef.current = [];
  };

  const paintPixel = (x: number, y: number) => {
    if (!user || tool === 'move') return;
    if (!isVerified) return;
    const pixelId = `${x},${y}`;
    if (lastDrawn === pixelId) return;
    
    const existing = pixels[pixelId];
    const oldColor = existing ? existing.color : null;
    
    if (tool === 'eraser' || selectedColor === 'eraser') {
      if (!existing) return; 
      if (!currentStrokeRef.current.find(s => s.pixelId === pixelId)) {
        currentStrokeRef.current.push({ pixelId, oldColor, newColor: null });
      }
      setLastDrawn(pixelId);
      if (mode === 'global') setPixelsLeft(prev => Math.min(MAX_PIXELS, prev + 1));
      erasePixel(x, y);
    } else {
      if (existing && existing.color === selectedColor) return;
      if (mode === 'global' && pixelsLeft <= 0) {
        window.dispatchEvent(new CustomEvent('aha_toast', { detail: "Достигнут часовой лимит пикселей!" }));
        return;
      }
      if (!currentStrokeRef.current.find(s => s.pixelId === pixelId)) {
        currentStrokeRef.current.push({ pixelId, oldColor, newColor: selectedColor });
      }
      setLastDrawn(pixelId);
      if (mode === 'global') setPixelsLeft(prev => prev - 1);
      drawPixel(x, y, selectedColor);
    }
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    const lastAction = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, lastAction]);
    
    const updates: Record<string, string | null> = {};
    lastAction.forEach(action => {
      updates[action.pixelId] = action.oldColor;
    });
    drawPixelsBatch(updates);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const nextAction = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, nextAction]);
    
    const updates: Record<string, string | null> = {};
    nextAction.forEach(action => {
      updates[action.pixelId] = action.newColor;
    });
    drawPixelsBatch(updates);
  };

  const generateCanvasBase64 = (): string | null => {
    const exportSize = 512;
    const canvas = document.createElement('canvas');
    canvas.width = exportSize;
    canvas.height = exportSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Fill background with theme dark base
    ctx.fillStyle = '#15101e';
    ctx.fillRect(0, 0, exportSize, exportSize);

    const resolution = isGlobal ? 50 : size;
    const cellPixelSize = exportSize / resolution;

    if (isGlobal) {
      const keys = Object.keys(pixels);
      if (keys.length === 0) return null;
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      keys.forEach(k => {
        const [x, y] = k.split(',').map(Number);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      });

      const width = (maxX - minX) + 1;
      const height = (maxY - minY) + 1;
      const maxDim = Math.max(width, height, 10);
      const startX = minX - Math.floor((maxDim - width) / 2);
      const startY = minY - Math.floor((maxDim - height) / 2);

      const cellGlobalSize = exportSize / maxDim;
      for (let y = 0; y < maxDim; y++) {
        for (let x = 0; x < maxDim; x++) {
          const p = pixels[`${startX + x},${startY + y}`];
          if (p) {
            ctx.fillStyle = p.color;
            ctx.fillRect(x * cellGlobalSize, y * cellGlobalSize, cellGlobalSize, cellGlobalSize);
          }
        }
      }
    } else {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const p = pixels[`${x},${y}`];
          if (p) {
            ctx.fillStyle = p.color;
            ctx.fillRect(x * cellPixelSize, y * cellPixelSize, cellPixelSize, cellPixelSize);
          }
        }
      }
    }

    return canvas.toDataURL('image/png');
  };

  const handlePublish = () => {
    if (!user) return;
    if (Object.keys(pixels).length === 0) {
      window.dispatchEvent(new CustomEvent('aha_toast', { detail: lang === 'ru' ? "Нельзя выкладывать пустой холст!" : "Cannot publish empty canvas!" }));
      return;
    }
    // Open the publish modal to let user edit title and caption
    setPublishTitle('');
    setPublishCaption('');
    setPublishIsProtected(true);
    setIsPublishModalOpen(true);
  };

  const handleConfirmPublish = async () => {
    if (!user || !publishTitle.trim()) return;
    setIsPublishing(true);
    try {
      // 1. Compile current pixels into a standard Base64 image
      const canvasBase64 = generateCanvasBase64();
      if (!canvasBase64) {
        throw new Error("Could not compile canvas pixels to image");
      }

      // 2. Encrypt the compiled image string for ultra-safe database storage
      const encryptedImage = encryptImage(canvasBase64);

      // 3. Prepare thread data targeting forum_threads (Activities feed!)
      const threadData = {
        title: publishTitle.trim(),
        content: publishCaption.trim() || (lang === 'ru' ? 'Рисунок с холста (пиксели)' : 'Canvas pixel art drawing'),
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorPhoto: user.photoURL || '',
        createdAt: new Date().toISOString(),
        commentCount: 1,
        upvotes: [],
        downvotes: [],
        imageUrl: encryptedImage,
        isProtected: protectedViewFeatureEnabled ? publishIsProtected : false
      };

      // 4. Save thread to Firestore (using vercelFallback bypass if active)
      const { vercelFallback } = await import('../../utils/vercelFallback');
      if (vercelFallback.isAvailable()) {
        const threadId = 'canvas_thread_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        const payload = { ...threadData, id: threadId };
        await vercelFallback.lpush('forum_threads', JSON.stringify(payload));
        
        // Add default bot comment
        await vercelFallback.lpush('forum_comments', JSON.stringify({
          id: 'comment_bot_' + Date.now(),
          threadId: threadId,
          content: lang === 'ru' ? 'Добро пожаловать в обсуждение этого рисунка!' : 'Welcome to the discussion of this pixel art artwork!',
          authorId: 'system-bot',
          authorName: 'Aha Bot',
          authorPhoto: 'https://ui-avatars.com/api/?name=Aha+Bot&background=ff4d4d&color=15101e',
          createdAt: new Date().toISOString(),
          upvotes: [],
          downvotes: [],
          isBot: true
        }));
      } else {
        const threadRef = await addDoc(collection(db, 'forum_threads'), threadData);
        // Add default bot comment
        await addDoc(collection(db, 'forum_comments'), {
          threadId: threadRef.id,
          content: lang === 'ru' ? 'Добро пожаловать в обсуждение этого рисунка!' : 'Welcome to the discussion of this pixel art artwork!',
          authorId: 'system-bot',
          authorName: 'Aha Bot',
          authorPhoto: 'https://ui-avatars.com/api/?name=Aha+Bot&background=ff4d4d&color=15101e',
          createdAt: serverTimestamp(),
          upvotes: [],
          downvotes: [],
          isBot: true
        });
      }

      window.dispatchEvent(new CustomEvent('aha_toast', { detail: lang === 'ru' ? 'Рисунок успешно опубликован в Активность!' : 'Drawing successfully published to Activities!' }));
      setIsPublishModalOpen(false);
      
      // Auto-prompt to clear canvas
      if (window.confirm(lang === 'ru' ? 'Хотите очистить холст после публикации?' : 'Would you like to clear your canvas now that it is published?')) {
        clearCanvas();
      }
    } catch (e) {
      console.error(e);
      window.dispatchEvent(new CustomEvent('aha_toast', { detail: lang === 'ru' ? 'Ошибка публикации' : 'Error publishing artwork' }));
    } finally {
      setIsPublishing(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-[#15101e]/60 border border-[#3d2b4f]/20 rounded-[2.5rem] p-8 sm:p-12 text-center max-w-2xl mx-auto my-12 backdrop-blur-md">
        <Lock className="mx-auto text-[#ff4d4d]/60 mb-5" size={44} />
        <h4 className="text-xl font-black text-white uppercase tracking-wider mb-2">
          {lang === 'ru' ? 'Авторизация' : 'Authorization'}
        </h4>
        <p className="text-white/60 mb-8 font-black uppercase tracking-widest text-xs max-w-md mx-auto">
          {t.canvasLoginPrompt || (lang === 'ru' ? 'Для доступа к Canvas и совместному рисованию необходимо войти в аккаунт.' : 'Log in to draw on the shared canvas.')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <GoogleLoginButton lang={lang} />
          <button
            onClick={() => window.dispatchEvent(new Event('openEmailLogin'))}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#3d2b4f]/40 border border-[#3d2b4f] text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-[#ff4d4d] hover:text-[#15101e] hover:border-[#ff4d4d] transition-all active:scale-95 shadow-xl"
          >
            <Mail size={16} />
            {lang === 'ru' ? 'Зарегистрироваться через почту' : 'Register via email'}
          </button>
        </div>
      </div>
    );
  }

  const isGlobal = mode === 'global';
  const PIXEL_CSS_SIZE = 20;

  const loadTemplate = async (templateKey: string) => {
    if (!window.confirm(lang === 'ru' ? 'Загрузка шаблона очистит текущий холст. Продолжить?' : 'Loading a template will clear your current canvas. Continue?')) return;
    const template = TEMPLATES[templateKey];
    if (!template) return;
    
    try {
      const docRef = doc(db, 'canvases', canvasId.replace(/\//g, '_'));
      const templatePixels: Record<string, any> = {};
      Object.entries(template.pixels).forEach(([key, color]) => {
        templatePixels[key] = {
          color,
          userId: user?.uid || '',
          updatedAt: Date.now()
        };
      });
      await setDoc(docRef, { pixels: templatePixels });
      window.dispatchEvent(new CustomEvent('aha_toast', { detail: lang === 'ru' ? "Шаблон успешно загружен!" : "Template successfully loaded!" }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportPNG = () => {
    const exportSize = 512;
    const canvas = document.createElement('canvas');
    canvas.width = exportSize;
    canvas.height = exportSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill background with theme dark base
    ctx.fillStyle = '#15101e';
    ctx.fillRect(0, 0, exportSize, exportSize);

    const resolution = isGlobal ? 50 : size;
    const cellPixelSize = exportSize / resolution;

    if (isGlobal) {
      // Find bounding box of drawn pixels in global canvas to export neatly
      const keys = Object.keys(pixels);
      if (keys.length === 0) {
        window.dispatchEvent(new CustomEvent('aha_toast', { detail: lang === 'ru' ? "Холст пуст!" : "Canvas is empty!" }));
        return;
      }
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      keys.forEach(k => {
        const [x, y] = k.split(',').map(Number);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      });

      const width = (maxX - minX) + 1;
      const height = (maxY - minY) + 1;
      const maxDim = Math.max(width, height, 10);
      const startX = minX - Math.floor((maxDim - width) / 2);
      const startY = minY - Math.floor((maxDim - height) / 2);

      const cellGlobalSize = exportSize / maxDim;
      for (let y = 0; y < maxDim; y++) {
        for (let x = 0; x < maxDim; x++) {
          const p = pixels[`${startX + x},${startY + y}`];
          if (p) {
            ctx.fillStyle = p.color;
            ctx.fillRect(x * cellGlobalSize, y * cellGlobalSize, cellGlobalSize, cellGlobalSize);
          }
        }
      }
    } else {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const p = pixels[`${x},${y}`];
          if (p) {
            ctx.fillStyle = p.color;
            ctx.fillRect(x * cellPixelSize, y * cellPixelSize, cellPixelSize, cellPixelSize);
          }
        }
      }
    }

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `pixel_art_${mode}_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  const cells = [];
  if (!isGlobal) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const pixelId = `${x},${y}`;
        const pixel = pixels[pixelId];
        const previewColor = previewPixels[pixelId];
        cells.push(
          <div
            key={pixelId}
            style={{ backgroundColor: previewColor || pixel?.color || '#15101e' }}
            className={`w-full h-full select-none touch-none pointer-events-none transition-all duration-100 ${
              showGrid ? 'border-[0.5px] border-[#3d2b4f]/30' : ''
            }`}
          />
        );
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl sm:text-3xl font-black text-[#ff4d4d] uppercase flex items-center gap-3 tracking-widest leading-none">
            <Palette className="w-8 h-8" />
            {lang === 'ru' ? 'Асабісты Холст' : (t.canvasTitle || "Aha Canvas")}
          </h2>
        </div>
      </div>

      <div className="bg-[#15101e] rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl border border-[#3d2b4f] relative overflow-hidden">
        {user && !isVerified && (
          <div className="absolute inset-x-0 top-0 bg-[#ff4d4d]/10 border-b border-[#ff4d4d]/30 text-[#ff4d4d] px-4 py-3 z-30 text-center flex items-center justify-center gap-2 backdrop-blur-md">
            <ShieldAlert size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">
              {lang === 'ru' 
                ? 'Режим просмотра: Требуется верификация аккаунта для рисования' 
                : 'Read-only mode: Account verification required to draw'}
            </span>
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#15101e]/80 backdrop-blur-sm">
             <div className="w-10 h-10 border-4 border-[#ff4d4d] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8 items-start">
          
           <div className="flex-1 w-full max-w-[600px] mx-auto md:mx-0">
             {/* Redesigned interactive toolbar */}
             <div className="mb-4 flex flex-col gap-3 bg-[#251c35] p-3 rounded-2xl border border-[#3d2b4f]">
               <div className="flex flex-wrap items-center justify-between gap-3">
                 <div className="flex flex-wrap items-center gap-1 bg-[#15101e] p-1 rounded-xl border border-[#3d2b4f]/50">
                   <button
                     onClick={() => setTool('draw')}
                     className={`p-2 rounded-lg transition-all shrink-0 ${tool === 'draw' ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg shadow-[#ff4d4d]/20' : 'text-gray-400 hover:text-white hover:bg-[#3d2b4f]/40'}`}
                     title={lang === 'ru' ? 'Карандаш' : 'Pencil'}
                   >
                     <PenTool size={18} />
                   </button>
                   <button
                     onClick={() => setTool('eraser')}
                     className={`p-2 rounded-lg transition-all shrink-0 ${tool === 'eraser' ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg shadow-[#ff4d4d]/20' : 'text-gray-400 hover:text-white hover:bg-[#3d2b4f]/40'}`}
                     title={lang === 'ru' ? 'Ластик' : 'Eraser'}
                   >
                     <Eraser size={18} />
                   </button>
                   <button
                     onClick={() => setTool('bucket')}
                     className={`p-2 rounded-lg transition-all shrink-0 ${tool === 'bucket' ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg shadow-[#ff4d4d]/20' : 'text-gray-400 hover:text-white hover:bg-[#3d2b4f]/40'}`}
                     title={lang === 'ru' ? 'Заливка' : 'Flood Fill'}
                   >
                     <PaintBucket size={18} />
                   </button>
                   <button
                     onClick={() => setTool('line')}
                     className={`p-2 rounded-lg transition-all shrink-0 ${tool === 'line' ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg shadow-[#ff4d4d]/20' : 'text-gray-400 hover:text-white hover:bg-[#3d2b4f]/40'}`}
                     title={lang === 'ru' ? 'Линия' : 'Line Tool'}
                   >
                     <Slash size={18} />
                   </button>
                   <button
                     onClick={() => setTool('rect')}
                     className={`p-2 rounded-lg transition-all shrink-0 ${tool === 'rect' ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg shadow-[#ff4d4d]/20' : 'text-gray-400 hover:text-white hover:bg-[#3d2b4f]/40'}`}
                     title={lang === 'ru' ? 'Прямоугольник' : 'Rectangle Tool'}
                   >
                     <Square size={18} />
                   </button>
                   <button
                     onClick={() => setTool('move')}
                     className={`p-2 rounded-lg transition-all shrink-0 ${tool === 'move' ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg shadow-[#ff4d4d]/20' : 'text-gray-400 hover:text-white hover:bg-[#3d2b4f]/40'}`}
                     title={lang === 'ru' ? 'Перемещение' : 'Move/Pan Tool'}
                   >
                     <Move size={18} />
                   </button>
                 </div>

                 <div className="flex items-center gap-1 bg-[#15101e] p-1 rounded-xl border border-[#3d2b4f]/50">
                   <button
                     onClick={undo}
                     disabled={undoStack.length === 0}
                     className="p-2 rounded-lg transition-all text-gray-400 hover:text-white hover:bg-[#3d2b4f]/40 disabled:opacity-30 disabled:hover:bg-transparent"
                     title="Undo"
                   >
                     <Undo2 size={18} />
                   </button>
                   <button
                     onClick={redo}
                     disabled={redoStack.length === 0}
                     className="p-2 rounded-lg transition-all text-gray-400 hover:text-white hover:bg-[#3d2b4f]/40 disabled:opacity-30 disabled:hover:bg-transparent"
                     title="Redo"
                   >
                     <Redo2 size={18} />
                   </button>
                   <div className="w-px h-5 bg-[#3d2b4f] mx-1" />
                   <button
                     onClick={() => setShowGrid(!showGrid)}
                     className={`p-2 rounded-lg transition-all ${showGrid ? 'text-[#ff4d4d] bg-[#ff4d4d]/10' : 'text-gray-400 hover:text-white hover:bg-[#3d2b4f]/40'}`}
                     title={lang === 'ru' ? 'Сетка' : 'Toggle Grid'}
                   >
                     <Grid size={18} />
                   </button>
                   <button
                     onClick={handleExportPNG}
                     className="p-2 rounded-lg transition-all text-gray-400 hover:text-white hover:bg-[#3d2b4f]/40"
                     title={lang === 'ru' ? 'Скачать PNG' : 'Export PNG'}
                   >
                     <Download size={18} />
                   </button>
                 </div>
               </div>

               {/* Dynamic sub-tool row for personal settings */}
               {mode === 'personal' && (
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#3d2b4f]/30">
                   <div className="flex items-center gap-2">
                     <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                       {lang === 'ru' ? 'РАЗМЕР:' : 'SIZE:'}
                     </span>
                     <div className="flex bg-[#15101e] p-0.5 rounded-lg border border-[#3d2b4f]/50">
                       {[16, 32, 64].map(sz => (
                         <button
                           key={sz}
                           onClick={() => setPersonalSize(sz)}
                           className={`px-2 py-1 rounded text-[10px] font-black transition-all ${personalSize === sz ? 'bg-[#ff4d4d] text-[#15101e]' : 'text-gray-400 hover:text-white'}`}
                         >
                           {sz}x{sz}
                         </button>
                       ))}
                     </div>
                   </div>

                   <div className="flex items-center gap-2">
                     <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                       {lang === 'ru' ? 'ШАБЛОНЫ:' : 'TEMPLATES:'}
                     </span>
                     <div className="flex flex-wrap gap-1 bg-[#15101e] p-0.5 rounded-lg border border-[#3d2b4f]/50">
                       {Object.entries(TEMPLATES).map(([key, val]) => (
                         <button
                           key={key}
                           onClick={() => loadTemplate(key)}
                           className="px-2 py-0.5 rounded text-[10px] font-bold text-gray-300 hover:text-white hover:bg-[#3d2b4f]/50 flex items-center gap-1 uppercase tracking-tight"
                         >
                           <LayoutGrid size={10} className="text-[#ff4d4d]" />
                           {lang === 'ru' ? val.nameRu : val.name}
                         </button>
                       ))}
                     </div>
                   </div>
                 </div>
               )}
             </div>

             {/* Draggable container wrapper */}
             <div className="aspect-square bg-[#0d0b14] rounded-xl overflow-hidden border-2 border-[#3d2b4f] shadow-inner relative flex items-center justify-center p-2">
               <motion.div 
                 className={`w-full h-full relative ${tool === 'move' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'} select-none touch-none`}
                 drag={tool === 'move'}
                 dragConstraints={isGlobal ? undefined : { left: -300, right: 300, top: -300, bottom: 300 }}
                 style={{ scale }}
                 onWheel={(e) => {
                   e.preventDefault();
                   setScale(s => Math.min(Math.max(0.5, s - e.deltaY * 0.001), 3));
                 }}
                 onTouchMove={(e) => {
                   if (e.touches.length === 2) {
                     e.preventDefault();
                     // Basic pinch zoom implementation
                     const touch1 = e.touches[0];
                     const touch2 = e.touches[1];
                     const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
                     
                     if (lastTouchDistRef.current === null) {
                       lastTouchDistRef.current = dist;
                     } else {
                       const delta = dist - lastTouchDistRef.current;
                       setScale(s => Math.min(Math.max(0.5, s + delta * 0.01), 3));
                       lastTouchDistRef.current = dist;
                     }
                   }
                 }}
                 onTouchEnd={() => {
                   lastTouchDistRef.current = null;
                 }}
               >
                 {isGlobal ? (
                     <div 
                         ref={innerRef}
                         className="w-[10000px] h-[10000px] border border-[#3d2b4f]/50 bg-[#15101e] shadow-2xl relative select-none touch-none absolute top-1/2 left-1/2 -mt-[5000px] -ml-[5000px]"
                         onPointerDown={(e) => { 
                           if (e.pointerType === 'mouse' && e.buttons !== 1) return;
                           (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                           handlePointerDown(e.clientX, e.clientY); 
                         }}
                         onPointerMove={(e) => { 
                           handlePointerMove(e.clientX, e.clientY); 
                         }}
                         onPointerUp={(e) => {
                           (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                           handlePointerUp(e.clientX, e.clientY);
                         }}
                         onPointerLeave={() => handlePointerUp()}
                         style={{
                             backgroundImage: showGrid ? `linear-gradient(to right, rgba(61,43,79,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(61,43,79,0.3) 1px, transparent 1px)` : 'none',
                             backgroundSize: `${PIXEL_CSS_SIZE}px ${PIXEL_CSS_SIZE}px`
                         }}
                     >
                         {Object.keys(pixels).map(key => {
                             const p = pixels[key];
                             if (!p) return null;
                             const [xx, yy] = key.split(',').map(Number);
                             const previewColor = previewPixels[key];
                             return (
                                 <div 
                                     key={key}
                                     style={{
                                         position: 'absolute',
                                         left: xx * PIXEL_CSS_SIZE,
                                         top: yy * PIXEL_CSS_SIZE,
                                         width: PIXEL_CSS_SIZE,
                                         height: PIXEL_CSS_SIZE,
                                         backgroundColor: previewColor || p.color
                                     }}
                                 />
                             );
                         })}
                     </div>
                 ) : (
                     <div className="w-full h-full border border-[#3d2b4f]/50 bg-[#15101e] shadow-2xl relative select-none touch-none"
                         ref={innerRef}
                         onPointerDown={(e) => { 
                           if (e.pointerType === 'mouse' && e.buttons !== 1) return;
                           (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                           handlePointerDown(e.clientX, e.clientY); 
                         }}
                         onPointerMove={(e) => { 
                           handlePointerMove(e.clientX, e.clientY); 
                         }}
                         onPointerUp={(e) => {
                           (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                           handlePointerUp(e.clientX, e.clientY);
                         }}
                         onPointerLeave={() => handlePointerUp()}>
                     <div 
                         className="w-full h-full grid pointer-events-none"
                         style={{ 
                         gridTemplateColumns: `repeat(${size}, 1fr)`,
                         gridTemplateRows: `repeat(${size}, 1fr)`
                         }}
                     >
                         {cells}
                     </div>
                     </div>
                 )}
               </motion.div>
             </div>
             
             <div className="mt-4 flex items-start gap-3 bg-[#251c35] p-3 rounded-xl border border-[#3d2b4f]">
               <Info size={20} className="text-[#ff4d4d] shrink-0 mt-0.5" />
               <p className="text-xs text-gray-400">
                 {mode === 'global' 
                   ? t.canvasDesc || "This is a real-time collaborative canvas. Any changes you make are instantly visible to everyone globally!"
                   : t.canvasPersonalDesc || "This is your personal canvas. You can draw here and publish a snapshot to your profile."}
                 {t.canvasMoveToolText || " Use the Move tool (or mouse wheel) to zoom and pan."}
               </p>
             </div>
           </div>

           <div className="w-full md:w-64 shrink-0 flex flex-col gap-6">
             <div className="bg-[#251c35] rounded-2xl p-4 sm:p-6 border border-[#3d2b4f]">
               <h3 className="text-sm font-black text-gray-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <Palette size={16} />
                 {t.canvasColors || "Colors"}
               </h3>
               <div className="flex flex-wrap gap-3">
                 {COLORS.map(color => (
                   <button
                     key={color}
                     onClick={() => { setSelectedColor(color); if (tool === 'move' || tool === 'eraser') setTool('draw'); }}
                     className={`shrink-0 w-10 h-10 rounded-xl transition-all border-2 ${
                       selectedColor === color && tool !== 'move' && tool !== 'eraser'
                         ? 'scale-110 border-white shadow-lg shadow-white/20' 
                         : 'border-transparent hover:scale-105'
                     }`}
                     style={{ backgroundColor: color }}
                     aria-label={`Select color ${color}`}
                   />
                 ))}
                 
                 <label
                   className={`shrink-0 w-10 h-10 rounded-xl transition-all border-2 flex items-center justify-center cursor-pointer relative overflow-hidden ${
                     selectedColor !== 'eraser' && !COLORS.includes(selectedColor) && tool !== 'move'
                       ? 'scale-110 border-white shadow-lg shadow-white/20' 
                       : 'border-transparent hover:scale-105'
                   }`}
                   style={{
                     background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)'
                   }}
                   title={t.canvasCustomColor || "Custom Color"}
                 >
                   <input
                     type="color"
                     value={selectedColor !== 'eraser' && !COLORS.includes(selectedColor) ? selectedColor : '#ff0000'}
                     onChange={(e) => { setSelectedColor(e.target.value); if (tool === 'move' || tool === 'eraser') setTool('draw'); }}
                     className="absolute opacity-0 w-20 h-20 cursor-pointer"
                   />
                 </label>
                 
                 <button
                   onClick={() => { setSelectedColor('eraser'); setTool('eraser'); }}
                   className={`shrink-0 w-10 h-10 rounded-xl transition-all border-2 flex items-center justify-center bg-[#15101e] ${
                     tool === 'eraser'
                       ? 'scale-110 border-white shadow-lg shadow-white/20' 
                       : 'border-[#3d2b4f] hover:scale-105 hover:border-[#ff4d4d]'
                   }`}
                   title={t.canvasEraser || "Eraser"}
                   aria-label="Eraser"
                 >
                   <Eraser size={20} className={tool === 'eraser' ? 'text-white' : 'text-gray-400'} />
                 </button>
               </div>
             </div>

             <div className="bg-[#251c35] rounded-2xl p-4 sm:p-6 border border-[#3d2b4f] space-y-4">
               <div>
                 <h3 className="text-sm font-black text-gray-300 uppercase tracking-widest mb-3">
                   {t.canvasYourColor || "Selected"}
                 </h3>
                 <div className="flex items-center gap-3">
                   <div 
                     className="w-12 h-12 shrink-0 rounded-xl shadow-inner border border-white/20 flex flex-col items-center justify-center animate-pulse"
                     style={{ backgroundColor: tool === 'eraser' ? '#15101e' : selectedColor }}
                   >
                     {tool === 'eraser' && <Eraser size={24} className="text-gray-400" />}
                   </div>
                   <div className="flex-1 min-w-0 bg-[#15101e] px-3 py-2.5 rounded-lg border border-[#3d2b4f] flex items-center">
                     <span className="text-xs font-mono text-gray-400 truncate">
                       {tool === 'eraser' ? t.canvasEraser || "ERASER" : selectedColor.toUpperCase()}
                     </span>
                   </div>
                 </div>
               </div>

               {mode === 'personal' && (
                 <div className="pt-4 border-t border-[#3d2b4f]/30 flex flex-col gap-2">
                   <button
                     onClick={handlePublish}
                     className="w-full flex items-center justify-center h-10 gap-2 bg-[#ff4d4d] text-[#15101e] rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#ff7a7a] transition-all active:scale-95 shadow-[0_0_15px_rgba(255,77,77,0.3)]"
                   >
                     <Save size={14} className="shrink-0" />
                     {t.canvasPublish || "ОПУБЛИКОВАТЬ"}
                   </button>


                   <button
                     onClick={() => {
                       if (window.confirm(t.canvasClearConfirm || "Are you sure you want to clear your personal canvas?")) {
                         clearCanvas();
                       }
                     }}
                     className="w-full flex items-center justify-center h-10 gap-2 bg-red-600/10 text-red-500 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-red-600 transition-all active:scale-95 border border-red-500/20"
                     title={t.canvasClear || "Clear Canvas"}
                   >
                     <Eraser size={14} className="shrink-0" />
                     {t.canvasClear || "ОЧИСТИТЬ"}
                   </button>
                 </div>
               )}
             </div>

             {/* Drafts Section */}
             {mode === 'personal' && (
               <div className="bg-[#251c35] rounded-2xl p-4 sm:p-6 border border-[#3d2b4f] space-y-4 animate-fadeIn">
                 <h3 className="text-sm font-black text-gray-300 uppercase tracking-widest flex items-center gap-2">
                   <Bookmark size={16} className="text-[#ff4d4d]" />
                   {lang === 'ru' ? 'Черновики' : 'Drafts & Sketches'}
                 </h3>
                 
                 {/* Create Draft Form */}
                 <div className="space-y-2">
                   <input
                     type="text"
                     value={draftName}
                     onChange={(e) => setDraftName(e.target.value)}
                     placeholder={lang === 'ru' ? 'Имя черновика...' : 'Draft name...'}
                     className="w-full bg-[#15101e] border border-[#3d2b4f]/60 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-[#ff4d4d] transition-all font-sans"
                     maxLength={40}
                   />
                   <button
                     onClick={handleSaveDraft}
                     disabled={isSavingDraft}
                     className="w-full flex items-center justify-center h-9 gap-1.5 bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-purple-600 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                   >
                     {isSavingDraft ? (
                       <div className="w-4 h-4 border-2 border-purple-300 border-t-transparent rounded-full animate-spin" />
                     ) : (
                       <>
                         <Plus size={14} />
                         {lang === 'ru' ? 'СОХРАНИТЬ ЭСКИЗ' : 'SAVE SKETCH'}
                       </>
                     )}
                   </button>
                 </div>

                 {/* List of drafts */}
                 <div className="pt-2 border-t border-[#3d2b4f]/30 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                   {loadingDrafts ? (
                     <div className="text-center py-4 text-white/40 text-xs">
                       <div className="w-4 h-4 border-2 border-[#ff4d4d] border-t-transparent rounded-full animate-spin mx-auto mb-1" />
                       {lang === 'ru' ? 'Загрузка...' : 'Loading...'}
                     </div>
                   ) : drafts.length === 0 ? (
                     <div className="text-center py-4 text-white/30 text-xs italic leading-tight">
                       {lang === 'ru' 
                         ? 'Нет сохраненных эскизов. Нарисуйте что-то и сохраните!' 
                         : 'No saved drafts yet. Draw something and save!'}
                     </div>
                   ) : (
                     drafts.map((d) => (
                       <div 
                         key={d.id} 
                         className="bg-[#15101e] border border-[#3d2b4f]/40 hover:border-[#ff4d4d]/40 transition-all p-2 rounded-xl flex items-center justify-between gap-2"
                       >
                         <div className="min-w-0 flex-1">
                           <p className="text-xs font-bold text-gray-200 truncate" title={d.name}>
                             {d.name}
                           </p>
                           <p className="text-[9px] text-gray-500 font-mono">
                             {d.size ? `${d.size}x${d.size}` : '32x32'} • {new Date(d.createdAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US')}
                           </p>
                         </div>
                         <div className="flex items-center gap-1 shrink-0">
                           <button
                             onClick={() => handleLoadDraft(d)}
                             className="p-1.5 bg-[#ff4d4d]/10 hover:bg-[#ff4d4d]/20 text-[#ff4d4d] rounded-lg transition-all"
                             title={lang === 'ru' ? 'Загрузить на холст' : 'Load onto canvas'}
                           >
                             <FolderOpen size={12} />
                           </button>
                           <button
                             onClick={() => setSelectedDraftForSaves(d)}
                             className="p-1.5 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 rounded-lg transition-all"
                             title={lang === 'ru' ? 'История сохранений (раз в 72ч)' : 'Save history (every 72h)'}
                           >
                             <Bookmark size={12} />
                           </button>
                           <button
                             onClick={() => handleDeleteDraft(d.id, d.name)}
                             className="p-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-lg transition-all"
                             title={lang === 'ru' ? 'Удалить' : 'Delete'}
                           >
                             <Trash2 size={12} />
                           </button>
                         </div>
                       </div>
                     ))
                   )}
                 </div>
               </div>
             )}
           </div>

        </div>
      </div>

      {/* Center-fixed Publish Post to Activity Modal */}
      <AnimatePresence>
        {isPublishModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#15101e] border border-[#3d2b4f] rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-lg overflow-hidden relative flex flex-col p-8 text-white text-left font-sans"
            >
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <h3 className="text-2xl font-black text-[#ff4d4d] uppercase tracking-wider mb-2">
                {lang === 'ru' ? 'Опубликовать в Активность' : 'Publish to Activity'}
              </h3>
              <p className="text-white/60 text-xs font-black uppercase tracking-widest mb-6 leading-relaxed">
                {lang === 'ru' ? 'Ваш рисунок появится в ленте активностей и постов!' : 'Your drawing will appear in the main activity and posts feed!'}
              </p>
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
                    {lang === 'ru' ? 'Название рисунка / поста' : 'Drawing Title / Post Subject'}
                  </label>
                  <input
                    type="text"
                    value={publishTitle}
                    onChange={(e) => setPublishTitle(e.target.value)}
                    placeholder={lang === 'ru' ? 'Например: Моё пиксель-арт сердечко...' : 'e.g., My Pixel Art Heart...'}
                    className="w-full bg-[#1e172a] border border-[#3d2b4f]/60 rounded-2xl px-5 py-3.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#ff4d4d] transition-all font-sans text-white"
                    maxLength={100}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
                    {lang === 'ru' ? 'Подпись / Описание' : 'Caption / Description'}
                  </label>
                  <textarea
                    value={publishCaption}
                    onChange={(e) => setPublishCaption(e.target.value)}
                    placeholder={lang === 'ru' ? 'Опишите ваш рисунок или оставьте комментарий...' : 'Write something about your drawing...'}
                    className="w-full h-28 bg-[#1e172a] border border-[#3d2b4f]/60 rounded-2xl px-5 py-3.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#ff4d4d] transition-all resize-none font-sans text-white"
                    maxLength={500}
                  />
                </div>
                
                {protectedViewFeatureEnabled && (
                  <div className="bg-[#1e172a] border border-[#3d2b4f]/60 rounded-2xl px-5 py-3.5 flex items-center justify-between">
                    <div className="flex-1 pr-4">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-[#ff4d4d] mb-1">
                        {lang === 'ru' ? 'Защищенный просмотр' : 'Protected View'}
                      </label>
                      <p className="text-white/50 text-[10px] leading-tight">
                        {lang === 'ru' 
                          ? 'Запретить скачивание, правый клик и сохранение вашего рисунка другими пользователями.' 
                          : 'Prevent downloading, right-click, and saving of your drawing by other users.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPublishIsProtected(!publishIsProtected)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shrink-0 ${
                        publishIsProtected ? 'bg-[#ff4d4d]' : 'bg-[#0d0b14]'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          publishIsProtected ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex gap-4 items-center justify-end">
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  disabled={isPublishing}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs text-white/50 hover:text-white px-5 py-3.5 hover:bg-white/5 border border-[#3d2b4f]/30 rounded-2xl transition-all cursor-pointer font-black uppercase tracking-widest text-[10px]"
                >
                  {lang === 'ru' ? 'Отмена' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPublish}
                  disabled={isPublishing || !publishTitle.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-6 py-3.5 bg-[#ff4d4d] text-[#15101e] font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-[#ff7a7a] transition-all disabled:opacity-50 active:scale-95 shadow-lg cursor-pointer"
                >
                  {isPublishing ? (
                    <div className="w-4 h-4 border-2 border-[#15101e] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={16} />
                      {lang === 'ru' ? 'Опубликовать' : 'Publish'}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saves/Backups Modal */}
      <AnimatePresence>
        {selectedDraftForSaves && (() => {
          const currentDraft = drafts.find(d => d.id === selectedDraftForSaves.id) || selectedDraftForSaves;
          const savesList = currentDraft?.saves || [];
          const now = Date.now();
          const hasRecentSave = savesList.some((s: any) => {
            const saveTime = new Date(s.createdAt).getTime();
            return (now - saveTime) < (72 * 60 * 60 * 1000); // 72 hours
          });

          const handleCreateCopy = async () => {
            if (Object.keys(pixels).length === 0) {
              window.dispatchEvent(new CustomEvent('aha_toast', { detail: lang === 'ru' ? "Нельзя сохранить пустой холст!" : "Cannot save empty canvas!" }));
              return;
            }
            if (hasRecentSave) {
              window.dispatchEvent(new CustomEvent('aha_toast', { 
                detail: lang === 'ru' 
                  ? 'Копия делается только раз в 72 часа!' 
                  : 'A copy can only be made once every 72 hours!' 
              }));
              return;
            }

            try {
              const newSave = {
                id: 'save_' + Date.now(),
                pixels: pixels,
                size: personalSize,
                createdAt: new Date().toISOString()
              };
              const updatedSaves = [...savesList, newSave];
              await setDoc(doc(db, 'canvas_drafts', currentDraft.id), {
                saves: updatedSaves
              }, { merge: true });

              window.dispatchEvent(new CustomEvent('aha_toast', { 
                detail: lang === 'ru' ? 'Новое сохранение эскиза создано!' : 'New sketch save created!' 
              }));
            } catch (e) {
              console.error(e);
              window.dispatchEvent(new CustomEvent('aha_toast', { 
                detail: lang === 'ru' ? 'Ошибка при создании копии' : 'Error creating copy' 
              }));
            }
          };

          const handleLoadSave = async (save: any) => {
            if (!window.confirm(lang === 'ru' ? `Загрузить эту версию? Текущий холст будет перезаписан.` : `Load this version? Current canvas will be overwritten.`)) {
              return;
            }

            try {
              if (save.size && save.size !== personalSize) {
                setPersonalSize(save.size);
              }
              const targetCanvasId = `canvas_personal/${user?.uid}_${save.size || personalSize}`;
              const targetDocId = targetCanvasId.replace(/\//g, '_');
              await setDoc(doc(db, 'canvases', targetDocId), {
                pixels: save.pixels || {}
              });
              setSelectedDraftForSaves(null);
              window.dispatchEvent(new CustomEvent('aha_toast', { 
                detail: lang === 'ru' ? 'Версия успешно загружена!' : 'Version successfully loaded!' 
              }));
            } catch (e) {
              console.error(e);
              window.dispatchEvent(new CustomEvent('aha_toast', { 
                detail: lang === 'ru' ? 'Ошибка загрузки версии' : 'Error loading version' 
              }));
            }
          };

          const handleDeleteSave = async (saveId: string) => {
            if (!window.confirm(lang === 'ru' ? 'Удалить это сохранение?' : 'Delete this save?')) {
              return;
            }

            try {
              const updatedSaves = savesList.filter((s: any) => s.id !== saveId);
              await setDoc(doc(db, 'canvas_drafts', currentDraft.id), {
                saves: updatedSaves
              }, { merge: true });
              window.dispatchEvent(new CustomEvent('aha_toast', { 
                detail: lang === 'ru' ? 'Сохранение удалено!' : 'Save deleted!' 
              }));
            } catch (e) {
              console.error(e);
              window.dispatchEvent(new CustomEvent('aha_toast', { 
                detail: lang === 'ru' ? 'Ошибка удаления сохранения' : 'Error deleting save' 
              }));
            }
          };

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-[#251c35] border border-[#3d2b4f] rounded-3xl p-6 max-w-md w-full shadow-2xl relative"
              >
                <button
                  onClick={() => setSelectedDraftForSaves(null)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>

                <h3 className="text-xl font-black text-[#ff4d4d] uppercase mb-1 flex items-center gap-2">
                  <Bookmark className="w-5 h-5" />
                  {lang === 'ru' ? 'Сохранения эскиза' : 'Sketch Saves'}
                </h3>
                <p className="text-xs text-gray-400 mb-4 font-semibold truncate">
                  {currentDraft.name}
                </p>

                <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1 mb-6">
                  {savesList.length === 0 ? (
                    <p className="text-center py-6 text-xs text-gray-500 italic">
                      {lang === 'ru' ? 'Нет сохраненных копий.' : 'No saved copies yet.'}
                    </p>
                  ) : (
                    savesList.map((s: any, idx: number) => {
                      return (
                        <div key={s.id || idx} className="bg-[#15101e] border border-[#3d2b4f]/60 p-3 rounded-xl flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold text-gray-200">
                              {lang === 'ru' ? `Копия #${idx + 1}` : `Copy #${idx + 1}`}
                            </p>
                            <p className="text-[10px] text-gray-500 font-mono">
                              {s.size ? `${s.size}x${s.size}` : '32x32'} • {new Date(s.createdAt).toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US')}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleLoadSave(s)}
                              className="px-2.5 py-1.5 bg-[#ff4d4d]/10 hover:bg-[#ff4d4d]/20 text-[#ff4d4d] rounded-lg text-[10px] font-bold uppercase transition-all"
                            >
                              {lang === 'ru' ? 'Загрузить' : 'Load'}
                            </button>
                            <button
                              onClick={() => handleDeleteSave(s.id)}
                              className="p-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-lg transition-all"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="pt-4 border-t border-[#3d2b4f]/30">
                  <button
                    onClick={handleCreateCopy}
                    disabled={hasRecentSave}
                    className="w-full flex items-center justify-center py-2.5 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-950/40 disabled:text-gray-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:cursor-not-allowed"
                  >
                    <Plus size={14} className="mr-1.5" />
                    {lang === 'ru' ? 'Сделать копию (1 раз в 72ч)' : 'Make Copy (1 per 72h)'}
                  </button>
                  {hasRecentSave && (
                    <p className="text-[10px] text-[#ff4d4d] text-center mt-2 font-medium">
                      {lang === 'ru' 
                        ? 'Копию можно делать только раз в 72 часа' 
                        : 'You can only make a copy once every 72 hours'}
                    </p>
                  )}
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};
