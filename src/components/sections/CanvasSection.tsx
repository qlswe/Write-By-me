import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation, useMotionValue } from 'framer-motion';
import { Palette, LogIn, Maximize, RefreshCw, Users, Info, Eraser, Move, PenTool, Save, User as UserIcon, Undo2, Redo2, Mail, Lock, ShieldAlert, PaintBucket, Slash, Square, Grid, Download, LayoutGrid } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useCanvas } from '../../hooks/useCanvas';
import { translations, Language } from '../../data/translations';
import { GoogleLoginButton } from '../ui/GoogleLoginButton';
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

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
  
  const [mode, setMode] = useState<CanvasMode>('global');
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
        setUndoStack(prev => [...prev, currentStrokeRef.current]);
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
    
    lastAction.forEach(action => {
      const { pixelId, oldColor } = action;
      const [px, py] = pixelId.split(',').map(Number);
      if (oldColor) {
        drawPixel(px, py, oldColor);
      } else {
        erasePixel(px, py);
      }
    });
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const nextAction = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, nextAction]);
    
    nextAction.forEach(action => {
      const { pixelId, newColor } = action;
      const [px, py] = pixelId.split(',').map(Number);
      if (newColor) {
        drawPixel(px, py, newColor);
      } else {
        erasePixel(px, py);
      }
    });
  };

  const handlePublish = async () => {
    if (!user) return;
    if (Object.keys(pixels).length === 0) {
      window.dispatchEvent(new CustomEvent('aha_toast', { detail: "Нельзя выкладывать пустой холст!" }));
      return;
    }
    try {
      const postRef = collection(db, 'user_posts');
      await addDoc(postRef, {
        uid: user.uid,
        authorName: user.displayName || 'Unknown',
        authorPhoto: user.photoURL || '',
        text: t.canvasPublishText || "Check out my new canvas artwork! \n[CANVAS_SNAPSHOT]",
        pixelsSnapshot: JSON.stringify(pixels),
        createdAt: new Date().toISOString()
      });
      window.dispatchEvent(new CustomEvent('aha_toast', { detail: t.canvasPublishSuccess || 'Успешно опубликовано в профиль' }));
    } catch (e) {
      console.error(e);
      window.dispatchEvent(new CustomEvent('aha_toast', { detail: t.canvasPublishFail || 'Ошибка публикации' }));
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
            {t.canvasTitle || "Aha Canvas"}
          </h2>
        </div>
        <div className="flex items-center gap-2 bg-[#251c35] px-2 py-1.5 rounded-xl border border-[#3d2b4f]">
           <button
             onClick={() => setMode('global')}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${mode === 'global' ? 'bg-[#ff4d4d] text-[#15101e]' : 'text-gray-400 hover:text-white'}`}
           >
             <Users size={14} /> {t.canvasGlobal || "Global"}
           </button>
           <button
             onClick={() => setMode('personal')}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${mode === 'personal' ? 'bg-[#ff4d4d] text-[#15101e]' : 'text-gray-400 hover:text-white'}`}
           >
             <UserIcon size={14} /> {t.canvasPersonal || "Personal"}
           </button>
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
           </div>

        </div>
      </div>
    </div>
  );
};
