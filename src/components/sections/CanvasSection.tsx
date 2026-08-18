import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette,
  Maximize,
  RefreshCw,
  Info,
  Eraser,
  Move,
  PenTool,
  Save,
  Undo2,
  Redo2,
  Mail,
  Lock,
  ShieldAlert,
  PaintBucket,
  Slash,
  Square,
  Grid,
  Download,
  LayoutGrid,
  FolderOpen,
  Trash2,
  Plus,
  Bookmark,
  X,
  FlipHorizontal,
  FlipVertical,
  Pipette,
  Circle,
  CircleDot,
  BoxSelect,
  RotateCw,
  SunMedium,
  Moon,
  Sparkles,
  Grid2X2,
  Repeat,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Upload,
  Copy,
  FileCode2,
  Keyboard,
  Eye,
  Sliders,
  Check,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useCanvas } from '../../hooks/useCanvas';
import { translations, Language } from '../../data/translations';
import { GoogleLoginButton } from '../ui/GoogleLoginButton';
import { ConfirmModal } from '../ui/ConfirmModal';
import { doc, setDoc, collection, addDoc, serverTimestamp, onSnapshot, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { encryptImage } from '../../utils/encryption';
import { vercelFallback } from '../../utils/vercelFallback';
import { CANVAS_PALETTES } from '../../data/canvasPalettes';
import { TEMPLATES } from '../../data/canvasTemplates';
import {
  StrokeAction,
  getLinePixels,
  getRectPixels,
  getRectFilledPixels,
  getCirclePixels,
  getSprayPixels,
  invertHex,
  toGrayscaleHex,
  adjustBrightnessHex,
  shiftCanvasPixels,
  generateCanvasSVG,
  hexToRgb,
  rgbToHex
} from '../../utils/canvasUtils';
import { CanvasHotkeysModal } from '../canvas/CanvasHotkeysModal';
import { CanvasImportModal } from '../canvas/CanvasImportModal';

type CanvasMode = 'global' | 'personal';
type Tool =
  | 'draw'
  | 'eraser'
  | 'bucket'
  | 'spray'
  | 'dither'
  | 'replace_color'
  | 'line'
  | 'rect'
  | 'rect_filled'
  | 'circle'
  | 'circle_filled'
  | 'picker'
  | 'move';

export const CanvasSection: React.FC<{ lang: Language }> = ({ lang }) => {
  const loc = (ru: string, en: string, by?: string, de?: string, fr?: string, zh?: string) => {
    switch (lang) {
      case 'en': return en;
      case 'by': return by || ru;
      case 'de': return de || en;
      case 'fr': return fr || en;
      case 'zh': return zh || en;
      default: return ru;
    }
  };

  const { user, isVerified } = useAuth();
  const innerRef = useRef<HTMLDivElement>(null);
  const zoomContainerRef = useRef<HTMLDivElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<CanvasMode>('personal');
  const [personalSize, setPersonalSize] = useState<number>(32);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [previewPixels, setPreviewPixels] = useState<Record<string, string>>({});
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

  // Palette & Colors
  const [currentPaletteId, setCurrentPaletteId] = useState<string>('cyber');
  const activePalette = useMemo(() => {
    return CANVAS_PALETTES.find(p => p.id === currentPaletteId) || CANVAS_PALETTES[0];
  }, [currentPaletteId]);

  const [selectedColor, setSelectedColor] = useState<string>(activePalette.colors[2] || '#ff4d4d');
  const [customHexInput, setCustomHexInput] = useState<string>('#ff4d4d');
  const [recentColors, setRecentColors] = useState<string[]>(['#ff4d4d', '#4dffff', '#ffff4d', '#ffffff', '#000000']);

  const canvasId = mode === 'global' ? 'canvas' : `canvas_personal/${user?.uid}_${personalSize}`;
  const { pixels, loading, drawPixel, erasePixel, drawPixelsBatch, clearCanvas, size } = useCanvas(
    mode === 'global' ? 0 : personalSize,
    canvasId
  );

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
    } catch (e) {}
    return MAX_PIXELS;
  });

  useEffect(() => {
    const currentHourId = Math.floor(Date.now() / 3600000);
    localStorage.setItem('aha_canvas_limit', JSON.stringify({ hour: currentHourId, left: pixelsLeft }));
  }, [pixelsLeft]);

  // Tools & Canvas State
  const [tool, setTool] = useState<Tool>('draw');
  const [scale, setScale] = useState(1);
  const [symmetryMode, setSymmetryMode] = useState<'none' | 'horizontal' | 'vertical' | 'radial'>('none');
  const [brushSize, setBrushSize] = useState<number>(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastDrawn, setLastDrawn] = useState<string | null>(null);

  // Undo/Redo Stacks
  const [undoStack, setUndoStack] = useState<StrokeAction[][]>([]);
  const [redoStack, setRedoStack] = useState<StrokeAction[][]>([]);
  const currentStrokeRef = useRef<StrokeAction[]>([]);

  // Modals state
  const [isHotkeysModalOpen, setIsHotkeysModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishTitle, setPublishTitle] = useState('');
  const [publishCaption, setPublishCaption] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishIsProtected, setPublishIsProtected] = useState<boolean>(true);
  const [protectedViewFeatureEnabled, setProtectedViewFeatureEnabled] = useState<boolean>(true);

  // Drafts State
  const [drafts, setDrafts] = useState<any[]>([]);
  const [draftName, setDraftName] = useState('');
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [selectedDraftForSaves, setSelectedDraftForSaves] = useState<any | null>(null);
  const [draftToLoad, setDraftToLoad] = useState<any | null>(null);
  const [draftToDelete, setDraftToDelete] = useState<any | null>(null);
  const [saveToLoad, setSaveToLoad] = useState<any | null>(null);
  const [saveToDelete, setSaveToDelete] = useState<{ saveId: string; draftId: string; savesList: any[] } | null>(null);

  const [templateToLoad, setTemplateToLoad] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [showPublishClearConfirm, setShowPublishClearConfirm] = useState<boolean>(false);

  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);

  const isGlobal = mode === 'global';
  const PIXEL_CSS_SIZE = 20;

  // Add color to recent colors strip
  const trackRecentColor = (col: string) => {
    if (!col || col === 'eraser' || !col.startsWith('#')) return;
    setRecentColors(prev => {
      const filtered = prev.filter(c => c.toLowerCase() !== col.toLowerCase());
      return [col, ...filtered].slice(0, 10);
    });
  };

  const handleSelectColor = (col: string) => {
    setSelectedColor(col);
    setCustomHexInput(col);
    trackRecentColor(col);
    if (tool === 'move' || tool === 'eraser') setTool('draw');
  };

  useEffect(() => {
    setUndoStack([]);
    setRedoStack([]);
    setPreviewPixels({});
  }, [canvasId]);

  // Zoom with Wheel
  useEffect(() => {
    const container = zoomContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setScale(s => Math.min(Math.max(0.5, s - e.deltaY * 0.001), 3.5));
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [mode, loading]);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'b':
        case 'p':
          setTool('draw');
          break;
        case 'e':
          setTool('eraser');
          break;
        case 'g':
          setTool('bucket');
          break;
        case 's':
          if (!e.ctrlKey && !e.metaKey) setTool('spray');
          break;
        case 'd':
          setTool('dither');
          break;
        case 'i':
          setTool('picker');
          break;
        case 'k':
          setTool('replace_color');
          break;
        case 'l':
          setTool('line');
          break;
        case 'r':
          setTool('rect');
          break;
        case 'c':
          setTool('circle');
          break;
        case 'm':
        case ' ':
          setTool(t => (t === 'move' ? 'draw' : 'move'));
          break;
        case 'arrowup':
          if (mode === 'personal') {
            e.preventDefault();
            handleShiftPixels(0, -1);
          }
          break;
        case 'arrowdown':
          if (mode === 'personal') {
            e.preventDefault();
            handleShiftPixels(0, 1);
          }
          break;
        case 'arrowleft':
          if (mode === 'personal') {
            e.preventDefault();
            handleShiftPixels(-1, 0);
          }
          break;
        case 'arrowright':
          if (mode === 'personal') {
            e.preventDefault();
            handleShiftPixels(1, 0);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack, redoStack, pixels, mode, personalSize]);

  // Drafts real-time fetch
  useEffect(() => {
    if (!user) {
      setDrafts([]);
      setLoadingDrafts(false);
      return;
    }
    setLoadingDrafts(true);
    const q = query(collection(db, 'canvas_drafts'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        list.sort((a: any, b: any) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        setDrafts(list);
        setLoadingDrafts(false);
      },
      err => {
        console.error('Drafts subscribe error:', err);
        setLoadingDrafts(false);
      }
    );
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'general'), docSnap => {
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

    const cellWidth = isGlobal ? 20 * scale : rect.width / size;
    const cellHeight = isGlobal ? 20 * scale : rect.height / size;

    const x = Math.floor(rawX / cellWidth);
    const y = Math.floor(rawY / cellHeight);
    return { x, y };
  };

  // Canvas content manipulations
  const handleShiftPixels = async (dx: number, dy: number) => {
    if (mode === 'global') return;
    const { updates, strokeActions } = shiftCanvasPixels(pixels, size, dx, dy, false);
    if (Object.keys(updates).length > 0) {
      await drawPixelsBatch(updates);
      setUndoStack(prev => [...prev, strokeActions]);
      setRedoStack([]);
    }
  };

  const handleFlipHorizontal = async () => {
    if (mode === 'global') return;
    const updates: Record<string, string | null> = {};
    const strokeActions: StrokeAction[] = [];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < Math.floor(size / 2); x++) {
        const leftKey = `${x},${y}`;
        const rightKey = `${size - 1 - x},${y}`;
        const leftColor = pixels[leftKey]?.color || null;
        const rightColor = pixels[rightKey]?.color || null;
        if (leftColor !== rightColor) {
          updates[leftKey] = rightColor;
          updates[rightKey] = leftColor;
          strokeActions.push({ pixelId: leftKey, oldColor: leftColor, newColor: rightColor });
          strokeActions.push({ pixelId: rightKey, oldColor: rightColor, newColor: leftColor });
        }
      }
    }
    if (Object.keys(updates).length > 0) {
      await drawPixelsBatch(updates);
      setUndoStack(prev => [...prev, strokeActions]);
      setRedoStack([]);
      window.dispatchEvent(
        new CustomEvent('aha_toast', { detail: loc('Отражено по горизонтали!', 'Flipped horizontally!') })
      );
    }
  };

  const handleFlipVertical = async () => {
    if (mode === 'global') return;
    const updates: Record<string, string | null> = {};
    const strokeActions: StrokeAction[] = [];
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < Math.floor(size / 2); y++) {
        const topKey = `${x},${y}`;
        const bottomKey = `${x},${size - 1 - y}`;
        const topColor = pixels[topKey]?.color || null;
        const bottomColor = pixels[bottomKey]?.color || null;
        if (topColor !== bottomColor) {
          updates[topKey] = bottomColor;
          updates[bottomKey] = topColor;
          strokeActions.push({ pixelId: topKey, oldColor: topColor, newColor: bottomColor });
          strokeActions.push({ pixelId: bottomKey, oldColor: bottomColor, newColor: topColor });
        }
      }
    }
    if (Object.keys(updates).length > 0) {
      await drawPixelsBatch(updates);
      setUndoStack(prev => [...prev, strokeActions]);
      setRedoStack([]);
      window.dispatchEvent(
        new CustomEvent('aha_toast', { detail: loc('Отражено по вертикали!', 'Flipped vertically!') })
      );
    }
  };

  const handleRotate90 = async () => {
    if (mode === 'global') return;
    const updates: Record<string, string | null> = {};
    const strokeActions: StrokeAction[] = [];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const oldKey = `${x},${y}`;
        const oldColor = pixels[oldKey]?.color || null;
        const srcX = y;
        const srcY = size - 1 - x;
        const newColor = pixels[`${srcX},${srcY}`]?.color || null;
        if (oldColor !== newColor) {
          updates[oldKey] = newColor;
          strokeActions.push({ pixelId: oldKey, oldColor, newColor });
        }
      }
    }
    if (Object.keys(updates).length > 0) {
      await drawPixelsBatch(updates);
      setUndoStack(prev => [...prev, strokeActions]);
      setRedoStack([]);
      window.dispatchEvent(
        new CustomEvent('aha_toast', { detail: loc('Повернуто на 90°!', 'Rotated 90°!') })
      );
    }
  };

  const handleInvertColors = async () => {
    if (mode === 'global') return;
    const updates: Record<string, string | null> = {};
    const strokeActions: StrokeAction[] = [];

    Object.keys(pixels).forEach(key => {
      const oldColor = pixels[key]?.color;
      if (oldColor) {
        const inverted = invertHex(oldColor);
        if (inverted) {
          updates[key] = inverted;
          strokeActions.push({ pixelId: key, oldColor, newColor: inverted });
        }
      }
    });

    if (Object.keys(updates).length > 0) {
      await drawPixelsBatch(updates);
      setUndoStack(prev => [...prev, strokeActions]);
      setRedoStack([]);
      window.dispatchEvent(
        new CustomEvent('aha_toast', { detail: loc('Цвета инвертированы!', 'Colors inverted!') })
      );
    }
  };

  const handleGrayscale = async () => {
    if (mode === 'global') return;
    const updates: Record<string, string | null> = {};
    const strokeActions: StrokeAction[] = [];

    Object.keys(pixels).forEach(key => {
      const oldColor = pixels[key]?.color;
      if (oldColor) {
        const gray = toGrayscaleHex(oldColor);
        if (gray && gray !== oldColor) {
          updates[key] = gray;
          strokeActions.push({ pixelId: key, oldColor, newColor: gray });
        }
      }
    });

    if (Object.keys(updates).length > 0) {
      await drawPixelsBatch(updates);
      setUndoStack(prev => [...prev, strokeActions]);
      setRedoStack([]);
      window.dispatchEvent(
        new CustomEvent('aha_toast', { detail: loc('Холст переведен в Ч/Б!', 'Converted to grayscale!') })
      );
    }
  };

  const handleAdjustBrightness = async (factor: number) => {
    if (mode === 'global') return;
    const updates: Record<string, string | null> = {};
    const strokeActions: StrokeAction[] = [];

    Object.keys(pixels).forEach(key => {
      const oldColor = pixels[key]?.color;
      if (oldColor) {
        const adjusted = adjustBrightnessHex(oldColor, factor);
        if (adjusted && adjusted !== oldColor) {
          updates[key] = adjusted;
          strokeActions.push({ pixelId: key, oldColor, newColor: adjusted });
        }
      }
    });

    if (Object.keys(updates).length > 0) {
      await drawPixelsBatch(updates);
      setUndoStack(prev => [...prev, strokeActions]);
      setRedoStack([]);
      window.dispatchEvent(
        new CustomEvent('aha_toast', {
          detail: factor > 1 ? loc('Осветлено на +15%!', 'Brightened +15%!') : loc('Затемнено на -15%!', 'Darkened -15%!')
        })
      );
    }
  };

  const handleReplaceColorGlobal = async (targetColor: string | null, newColor: string | null) => {
    if (!targetColor || targetColor === newColor) return;
    const updates: Record<string, string | null> = {};
    const strokeActions: StrokeAction[] = [];

    Object.keys(pixels).forEach(key => {
      const curr = pixels[key]?.color || null;
      if (curr && curr.toLowerCase() === targetColor.toLowerCase()) {
        updates[key] = newColor;
        strokeActions.push({ pixelId: key, oldColor: curr, newColor });
      }
    });

    if (Object.keys(updates).length > 0) {
      await drawPixelsBatch(updates);
      setUndoStack(prev => [...prev, strokeActions]);
      setRedoStack([]);
      window.dispatchEvent(
        new CustomEvent('aha_toast', {
          detail: loc(`Заменено ${Object.keys(updates).length} пикселей!`, `Replaced ${Object.keys(updates).length} pixels!`)
        })
      );
    }
  };

  const floodFill = async (startX: number, startY: number, fillHexColor: string) => {
    if (!user || !isVerified) return;
    const currentSize = isGlobal ? 500 : size;
    if (startX < 0 || startX >= currentSize || startY < 0 || startY >= currentSize) return;

    const targetColor = pixels[`${startX},${startY}`]?.color || null;
    const realFillColor = fillHexColor === 'eraser' ? null : fillHexColor;
    if (targetColor === realFillColor) return;

    const maxFlood = 2000;
    const queue: [number, number][] = [[startX, startY]];
    const visited = new Set<string>();
    const strokeActions: StrokeAction[] = [];
    const updates: Record<string, string | null> = {};

    const getPixelColorLocal = (key: string): string | null => {
      if (key in updates) return updates[key];
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

  const getSymmetricCoordinates = (cx: number, cy: number): { x: number; y: number }[] => {
    const coords = [{ x: cx, y: cy }];
    if (isGlobal) return coords;

    if (symmetryMode === 'horizontal') {
      coords.push({ x: size - 1 - cx, y: cy });
    } else if (symmetryMode === 'vertical') {
      coords.push({ x: cx, y: size - 1 - cy });
    } else if (symmetryMode === 'radial') {
      coords.push({ x: size - 1 - cx, y: cy });
      coords.push({ x: cx, y: size - 1 - cy });
      coords.push({ x: size - 1 - cx, y: size - 1 - cy });
    }
    return coords;
  };

  const getBrushOffsets = (sz: number): { dx: number; dy: number }[] => {
    if (sz === 1) return [{ dx: 0, dy: 0 }];
    if (sz === 2) {
      return [
        { dx: 0, dy: 0 },
        { dx: 1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 1, dy: 1 }
      ];
    }
    return [
      { dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 },
      { dx: -1, dy: 0 },  { dx: 0, dy: 0 },  { dx: 1, dy: 0 },
      { dx: -1, dy: 1 },  { dx: 0, dy: 1 },  { dx: 1, dy: 1 }
    ];
  };

  const isOutOfBounds = (cx: number, cy: number): boolean => {
    if (isGlobal) return false;
    return cx < 0 || cx >= size || cy < 0 || cy >= size;
  };

  const paintPixelsGroup = (cx: number, cy: number) => {
    if (!user || tool === 'move' || !isVerified) return;

    const key = `${cx},${cy}`;
    if (lastDrawn === key) return;
    setLastDrawn(key);

    let baseTargetCoords: { x: number; y: number }[] = [];

    if (tool === 'spray') {
      const sprayed = getSprayPixels(cx, cy, brushSize + 1, 3 + brushSize);
      baseTargetCoords = sprayed.map(([x, y]) => ({ x, y }));
    } else if (tool === 'dither') {
      const offsets = getBrushOffsets(brushSize);
      offsets.forEach(offset => {
        const tx = cx + offset.dx;
        const ty = cy + offset.dy;
        if ((tx + ty) % 2 === 0) {
          baseTargetCoords.push({ x: tx, y: ty });
        }
      });
    } else {
      const offsets = getBrushOffsets(brushSize);
      offsets.forEach(offset => {
        baseTargetCoords.push({ x: cx + offset.dx, y: cy + offset.dy });
      });
    }

    const symmetricCenters: { x: number; y: number }[] = [];
    baseTargetCoords.forEach(baseCoord => {
      const syms = getSymmetricCoordinates(baseCoord.x, baseCoord.y);
      syms.forEach(s => {
        if (!isOutOfBounds(s.x, s.y) && !symmetricCenters.some(c => c.x === s.x && c.y === s.y)) {
          symmetricCenters.push(s);
        }
      });
    });

    const updates: Record<string, string | null> = {};

    symmetricCenters.forEach(({ x, y }) => {
      const pixelId = `${x},${y}`;
      const existing = pixels[pixelId];
      const oldColor = existing ? existing.color : null;

      if (tool === 'eraser' || selectedColor === 'eraser') {
        if (!existing) return;
        if (!currentStrokeRef.current.find(s => s.pixelId === pixelId)) {
          currentStrokeRef.current.push({ pixelId, oldColor, newColor: null });
        }
        updates[pixelId] = null;
      } else {
        if (existing && existing.color === selectedColor) return;
        if (mode === 'global' && pixelsLeft <= 0) {
          window.dispatchEvent(new CustomEvent('aha_toast', { detail: 'Достигнут часовой лимит пикселей!' }));
          return;
        }
        if (!currentStrokeRef.current.find(s => s.pixelId === pixelId)) {
          currentStrokeRef.current.push({ pixelId, oldColor, newColor: selectedColor });
        }
        updates[pixelId] = selectedColor;
        if (mode === 'global') setPixelsLeft((prev: number) => prev - 1);
      }
    });

    if (Object.keys(updates).length > 0) {
      drawPixelsBatch(updates);
    }
  };

  const handlePointerDown = (clientX: number, clientY: number) => {
    if (tool === 'move' || !user) return;
    if (!isVerified) {
      window.dispatchEvent(
        new CustomEvent('aha_toast', {
          detail: loc('Только верифицированные пользователи могут рисовать!', 'Only verified users can paint!')
        })
      );
      return;
    }
    const coords = getGridCoords(clientX, clientY);
    if (!coords) return;
    const { x, y } = coords;

    if (tool === 'picker') {
      const clickedPixel = pixels[`${x},${y}`];
      if (clickedPixel && clickedPixel.color) {
        handleSelectColor(clickedPixel.color);
        setTool('draw');
        window.dispatchEvent(
          new CustomEvent('aha_toast', { detail: loc(`Пипетка: ${clickedPixel.color}`, `Picked: ${clickedPixel.color}`) })
        );
      }
      setIsDrawing(false);
      return;
    }

    if (tool === 'replace_color') {
      const clickedPixel = pixels[`${x},${y}`];
      if (clickedPixel && clickedPixel.color) {
        handleReplaceColorGlobal(clickedPixel.color, selectedColor === 'eraser' ? null : selectedColor);
      }
      setIsDrawing(false);
      return;
    }

    setIsDrawing(true);
    setLastDrawn(null);
    setLastMoveCoords({ x, y });

    if (tool === 'bucket') {
      floodFill(x, y, selectedColor);
      setIsDrawing(false);
    } else if (['line', 'rect', 'rect_filled', 'circle', 'circle_filled'].includes(tool)) {
      setStartPoint({ x, y });
      setPreviewPixels({});
    } else {
      currentStrokeRef.current = [];
      paintPixelsGroup(x, y);
    }
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDrawing || tool === 'move' || tool === 'picker' || tool === 'replace_color' || !user) return;
    const coords = getGridCoords(clientX, clientY);
    if (!coords) return;
    const { x, y } = coords;
    setLastMoveCoords({ x, y });

    if (['line', 'rect', 'rect_filled', 'circle', 'circle_filled'].includes(tool)) {
      if (startPoint) {
        const previewMap: Record<string, string> = {};
        let pPixels: [number, number][] = [];
        if (tool === 'line') pPixels = getLinePixels(startPoint.x, startPoint.y, x, y);
        else if (tool === 'rect') pPixels = getRectPixels(startPoint.x, startPoint.y, x, y);
        else if (tool === 'rect_filled') pPixels = getRectFilledPixels(startPoint.x, startPoint.y, x, y);
        else if (tool === 'circle') pPixels = getCirclePixels(startPoint.x, startPoint.y, x, y, false);
        else if (tool === 'circle_filled') pPixels = getCirclePixels(startPoint.x, startPoint.y, x, y, true);

        pPixels.forEach(([px, py]) => {
          if (isGlobal || (px >= 0 && px < size && py >= 0 && py < size)) {
            previewMap[`${px},${py}`] = selectedColor === 'eraser' ? '#15101e' : selectedColor;
          }
        });
        setPreviewPixels(previewMap);
      }
    } else if (['draw', 'eraser', 'spray', 'dither'].includes(tool)) {
      paintPixelsGroup(x, y);
    }
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setLastDrawn(null);

    const targetX = lastMoveCoords?.x ?? startPoint?.x;
    const targetY = lastMoveCoords?.y ?? startPoint?.y;

    if (
      ['line', 'rect', 'rect_filled', 'circle', 'circle_filled'].includes(tool) &&
      startPoint &&
      targetX !== undefined &&
      targetY !== undefined
    ) {
      let pPixels: [number, number][] = [];
      if (tool === 'line') pPixels = getLinePixels(startPoint.x, startPoint.y, targetX, targetY);
      else if (tool === 'rect') pPixels = getRectPixels(startPoint.x, startPoint.y, targetX, targetY);
      else if (tool === 'rect_filled') pPixels = getRectFilledPixels(startPoint.x, startPoint.y, targetX, targetY);
      else if (tool === 'circle') pPixels = getCirclePixels(startPoint.x, startPoint.y, targetX, targetY, false);
      else if (tool === 'circle_filled') pPixels = getCirclePixels(startPoint.x, startPoint.y, targetX, targetY, true);

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

  // Image & File Export handlers
  const generateCanvasBase64 = (exportDim = 512): string | null => {
    const canvas = document.createElement('canvas');
    canvas.width = exportDim;
    canvas.height = exportDim;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#15101e';
    ctx.fillRect(0, 0, exportDim, exportDim);

    const resolution = isGlobal ? 50 : size;
    const cellPixelSize = exportDim / resolution;

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

      const width = maxX - minX + 1;
      const height = maxY - minY + 1;
      const maxDim = Math.max(width, height, 10);
      const startX = minX - Math.floor((maxDim - width) / 2);
      const startY = minY - Math.floor((maxDim - height) / 2);

      const cellGlobalSize = exportDim / maxDim;
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

  const handleExportPNG = (exportDim = 512) => {
    if (Object.keys(pixels).length === 0) {
      window.dispatchEvent(new CustomEvent('aha_toast', { detail: loc('Холст пуст!', 'Canvas is empty!') }));
      return;
    }
    const dataUrl = generateCanvasBase64(exportDim);
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.download = `pixel_art_${exportDim}px_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
    setShowExportMenu(false);
  };

  const handleExportSVG = () => {
    if (Object.keys(pixels).length === 0) {
      window.dispatchEvent(new CustomEvent('aha_toast', { detail: loc('Холст пуст!', 'Canvas is empty!') }));
      return;
    }
    const svgStr = generateCanvasSVG(pixels, size);
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `pixel_art_${size}x${size}_${Date.now()}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportJSON = () => {
    if (Object.keys(pixels).length === 0) {
      window.dispatchEvent(new CustomEvent('aha_toast', { detail: loc('Холст пуст!', 'Canvas is empty!') }));
      return;
    }
    const exportData = {
      version: 1,
      size: personalSize,
      mode,
      pixels,
      exportedAt: new Date().toISOString()
    };
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `canvas_sketch_${Date.now()}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleImportJSONFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.pixels) {
          if (parsed.size && parsed.size !== personalSize) {
            setPersonalSize(parsed.size);
          }
          const updates: Record<string, string | null> = {};
          Object.entries(parsed.pixels).forEach(([key, val]: [string, any]) => {
            const col = typeof val === 'string' ? val : val?.color;
            if (col) updates[key] = col;
          });
          await drawPixelsBatch(updates);
          window.dispatchEvent(
            new CustomEvent('aha_toast', { detail: loc('Скетч JSON успешно импортирован!', 'JSON sketch imported!') })
          );
        }
      } catch (err) {
        window.dispatchEvent(
          new CustomEvent('aha_toast', { detail: loc('Ошибка чтения JSON файла', 'Invalid JSON file') })
        );
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCopyToClipboard = async () => {
    if (Object.keys(pixels).length === 0) {
      window.dispatchEvent(new CustomEvent('aha_toast', { detail: loc('Холст пуст!', 'Canvas is empty!') }));
      return;
    }
    try {
      const dataUrl = generateCanvasBase64(512);
      if (!dataUrl) throw new Error('No base64');
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      if (navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        window.dispatchEvent(
          new CustomEvent('aha_toast', {
            detail: loc('Изображение скопировано в буфер обмена!', 'Image copied to clipboard!')
          })
        );
      }
    } catch (e) {
      window.dispatchEvent(
        new CustomEvent('aha_toast', {
          detail: loc('Не удалось скопировать изображение', 'Failed to copy to clipboard')
        })
      );
    }
    setShowExportMenu(false);
  };

  // Draft operations
  const handleSaveDraft = async () => {
    if (!user) return;
    if (Object.keys(pixels).length === 0) {
      window.dispatchEvent(
        new CustomEvent('aha_toast', { detail: loc('Нельзя сохранить пустой холст!', 'Cannot save empty canvas!') })
      );
      return;
    }

    setIsSavingDraft(true);
    const nameToUse = draftName.trim() || `${loc('Черновик', 'Draft')} #${drafts.length + 1}`;

    const initialSave = {
      id: 'save_' + Date.now(),
      pixels,
      size: personalSize,
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'canvas_drafts'), {
        userId: user.uid,
        name: nameToUse,
        pixels,
        size: personalSize,
        createdAt: new Date().toISOString(),
        saves: [initialSave]
      });
      setDraftName('');
      window.dispatchEvent(
        new CustomEvent('aha_toast', { detail: loc('Эскиз успешно сохранен в черновики!', 'Sketch saved to drafts!') })
      );
    } catch (e) {
      console.error('Error saving draft:', e);
      window.dispatchEvent(
        new CustomEvent('aha_toast', { detail: loc('Ошибка сохранения черновика', 'Error saving draft') })
      );
    } finally {
      setIsSavingDraft(false);
    }
  };

  const executeLoadDraft = async () => {
    if (!user || !draftToLoad) return;
    const draft = draftToLoad;
    setDraftToLoad(null);
    try {
      if (draft.size && draft.size !== personalSize) {
        setPersonalSize(draft.size);
      }
      const targetCanvasId = `canvas_personal/${user.uid}_${draft.size || personalSize}`;
      const targetDocId = targetCanvasId.replace(/\//g, '_');
      const docRef = doc(db, 'canvases', targetDocId);

      await setDoc(docRef, { pixels: draft.pixels || {} });
      window.dispatchEvent(
        new CustomEvent('aha_toast', { detail: loc('Черновик успешно загружен!', 'Draft loaded successfully!') })
      );
    } catch (e) {
      console.error('Error loading draft:', e);
    }
  };

  const executeDeleteDraft = async () => {
    if (!draftToDelete) return;
    const draftId = draftToDelete.id;
    setDraftToDelete(null);
    try {
      await deleteDoc(doc(db, 'canvas_drafts', draftId));
      window.dispatchEvent(new CustomEvent('aha_toast', { detail: loc('Черновик удален', 'Draft deleted') }));
    } catch (e) {
      console.error('Error deleting draft:', e);
    }
  };

  const executeLoadSave = async () => {
    if (!user || !saveToLoad) return;
    const save = saveToLoad;
    setSaveToLoad(null);
    setSelectedDraftForSaves(null);
    try {
      if (save.size && save.size !== personalSize) {
        setPersonalSize(save.size);
      }
      const targetCanvasId = `canvas_personal/${user.uid}_${save.size || personalSize}`;
      const targetDocId = targetCanvasId.replace(/\//g, '_');
      await setDoc(doc(db, 'canvases', targetDocId), { pixels: save.pixels || {} });
      window.dispatchEvent(
        new CustomEvent('aha_toast', { detail: loc('Версия успешно загружена!', 'Version loaded successfully!') })
      );
    } catch (e) {
      console.error(e);
    }
  };

  const executeDeleteSave = async () => {
    if (!saveToDelete) return;
    const { saveId, draftId, savesList } = saveToDelete;
    setSaveToDelete(null);
    try {
      const updatedSaves = savesList.filter((s: any) => s.id !== saveId);
      await setDoc(doc(db, 'canvas_drafts', draftId), { saves: updatedSaves }, { merge: true });
      window.dispatchEvent(new CustomEvent('aha_toast', { detail: loc('Сохранение удалено!', 'Save deleted!') }));
    } catch (e) {
      console.error(e);
    }
  };

  const executeLoadTemplate = async () => {
    if (!user || !templateToLoad) return;
    const templateKey = templateToLoad;
    setTemplateToLoad(null);
    const template = TEMPLATES[templateKey];
    if (!template) return;

    try {
      const docRef = doc(db, 'canvases', canvasId.replace(/\//g, '_'));
      const templatePixels: Record<string, any> = {};
      Object.entries(template.pixels).forEach(([key, color]) => {
        templatePixels[key] = { color, userId: user.uid, updatedAt: Date.now() };
      });
      await setDoc(docRef, { pixels: templatePixels });
      window.dispatchEvent(
        new CustomEvent('aha_toast', { detail: loc('Шаблон успешно загружен!', 'Template successfully loaded!') })
      );
    } catch (e) {
      console.error('Error loading template:', e);
    }
  };

  const handlePublish = () => {
    if (!user) return;
    if (Object.keys(pixels).length === 0) {
      window.dispatchEvent(
        new CustomEvent('aha_toast', { detail: loc('Нельзя выкладывать пустой холст!', 'Cannot publish empty canvas!') })
      );
      return;
    }
    setPublishTitle('');
    setPublishCaption('');
    setPublishIsProtected(true);
    setIsPublishModalOpen(true);
  };

  const handleConfirmPublish = async () => {
    if (!user || !publishTitle.trim()) return;
    setIsPublishing(true);
    try {
      const canvasBase64 = generateCanvasBase64(512);
      if (!canvasBase64) throw new Error('Could not compile canvas pixels');

      const encryptedImage = encryptImage(canvasBase64);
      const threadData = {
        title: publishTitle.trim(),
        content: publishCaption.trim() || loc('Рисунок с холста (пиксели)', 'Canvas pixel art drawing'),
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

      const threadRef = await addDoc(collection(db, 'forum_threads'), threadData);

      await addDoc(collection(db, 'forum_comments'), {
        threadId: threadRef.id,
        content: loc(
          'Добро пожаловать в обсуждение этого рисунка!',
          'Welcome to the discussion of this pixel art artwork!'
        ),
        authorId: 'system-bot',
        authorName: 'Aha Bot',
        authorPhoto: 'https://ui-avatars.com/api/?name=Aha+Bot&background=ff4d4d&color=15101e',
        createdAt: serverTimestamp(),
        upvotes: [],
        downvotes: [],
        isBot: true
      });

      if (vercelFallback.isAvailable()) {
        try {
          const payload = { ...threadData, id: threadRef.id };
          await vercelFallback.lpush('forum_threads', JSON.stringify(payload));
        } catch (e) {}
      }

      window.dispatchEvent(
        new CustomEvent('aha_toast', { detail: loc('Рисунок успешно опубликован!', 'Drawing published!') })
      );
      setIsPublishModalOpen(false);
      setShowPublishClearConfirm(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPublishing(false);
    }
  };

  // Import image pixel handler
  const handleImportImagePixels = async (importedPixels: Record<string, string>, targetSz: number) => {
    if (!user) return;
    if (targetSz !== personalSize) {
      setPersonalSize(targetSz);
    }
    const targetCanvasId = `canvas_personal/${user.uid}_${targetSz}`;
    const targetDocId = targetCanvasId.replace(/\//g, '_');
    const docRef = doc(db, 'canvases', targetDocId);

    const formattedPayload: Record<string, any> = {};
    Object.entries(importedPixels).forEach(([key, col]) => {
      formattedPayload[key] = {
        color: col,
        userId: user.uid,
        updatedAt: Date.now()
      };
    });

    await setDoc(docRef, { pixels: formattedPayload });
    window.dispatchEvent(
      new CustomEvent('aha_toast', { detail: loc('Картинка успешно импортирована!', 'Image successfully imported!') })
    );
  };

  // Stats calculation
  const totalPixelsCount = size * size;
  const activePixelsCount = Object.keys(pixels).length;
  const fillPercentage = totalPixelsCount > 0 ? Math.round((activePixelsCount / totalPixelsCount) * 100) : 0;
  const uniqueColorsCount = useMemo(() => {
    const set = new Set<string>();
    Object.values(pixels).forEach(p => {
      if (p?.color) set.add(p.color.toLowerCase());
    });
    return set.size;
  }, [pixels]);

  if (!user) {
    return (
      <div className="bg-[#15101e]/80 border border-[#3d2b4f]/60 rounded-3xl p-6 sm:p-10 text-center max-w-xl mx-auto my-12 backdrop-blur-md shadow-2xl">
        <Lock className="mx-auto text-[#ff4d4d]/70 mb-4" size={40} />
        <h4 className="text-xl font-black text-white uppercase tracking-wider mb-2">
          {loc('Авторизация', 'Authorization')}
        </h4>
        <p className="text-gray-300 mb-6 font-bold uppercase tracking-wider text-xs max-w-sm mx-auto leading-relaxed">
          {loc('Для доступа к Canvas и рисованию необходимо войти в аккаунт.', 'Log in to draw on the canvas.')}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center w-full max-w-md mx-auto">
          <GoogleLoginButton lang={lang} className="w-full sm:w-auto" size="md" />
          <button
            onClick={() => window.dispatchEvent(new Event('openEmailLogin'))}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#3d2b4f]/50 border border-[#3d2b4f] text-white rounded-2xl font-black uppercase tracking-wider text-xs hover:bg-[#ff4d4d] hover:text-[#15101e] hover:border-[#ff4d4d] transition-all active:scale-95 shadow-xl cursor-pointer"
          >
            <Mail size={16} />
            {loc('Зарегистрироваться через почту', 'Register via email')}
          </button>
        </div>
      </div>
    );
  }

  // Pre-generate cells for grid
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 text-[#ff4d4d] rounded-2xl">
            <Palette className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider flex items-center gap-2">
              {mode === 'global' ? loc('Глобальный Холст', 'Global Canvas') : loc('Личный Холст', 'Personal Canvas')}
            </h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
              {mode === 'global'
                ? loc('Совместное полотно в реальном времени', 'Live real-time collaborative canvas')
                : loc('Пиксель-арт студия со слоями, фильтрами и экспортом', 'Pixel art studio with filters, tools & export')}
            </p>
          </div>
        </div>

        {/* Top Action Buttons: Mode Switch + Shortcuts + Import */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-[#15101e] p-1 rounded-2xl border border-[#3d2b4f]/60 shadow-lg">
            <button
              onClick={() => setMode('personal')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                mode === 'personal' ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg shadow-[#ff4d4d]/20' : 'text-gray-400 hover:text-white'
              }`}
            >
              {loc('Личный', 'Personal')}
            </button>
            <button
              onClick={() => setMode('global')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                mode === 'global' ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg shadow-[#ff4d4d]/20' : 'text-gray-400 hover:text-white'
              }`}
            >
              {loc('Глобальный', 'Global')}
            </button>
          </div>

          <button
            onClick={() => setIsHotkeysModalOpen(true)}
            className="p-2 bg-[#251c35] border border-[#3d2b4f] hover:border-[#ff4d4d] text-gray-300 hover:text-white rounded-xl transition-all shadow-md"
            title={loc('Горячие клавиши (Шпаргалка)', 'Hotkeys Cheat-Sheet')}
          >
            <Keyboard size={18} />
          </button>

          {mode === 'personal' && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#251c35] border border-[#3d2b4f] hover:border-[#ff4d4d] text-gray-200 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md"
              title={loc('Импорт картинки в пиксели', 'Import Image to Pixels')}
            >
              <Upload size={14} className="text-[#ff4d4d]" />
              <span className="hidden sm:inline">{loc('Импорт', 'Import')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas Workspace Container */}
      <div className="bg-[#15101e] rounded-3xl p-4 sm:p-6 shadow-2xl border border-[#3d2b4f] relative overflow-hidden">
        {user && !isVerified && (
          <div className="absolute inset-x-0 top-0 bg-[#ff4d4d]/10 border-b border-[#ff4d4d]/30 text-[#ff4d4d] px-4 py-2.5 z-30 text-center flex items-center justify-center gap-2 backdrop-blur-md">
            <ShieldAlert size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">
              {loc('Режим просмотра: Верифицируйте аккаунт для рисования', 'Read-only mode: Verification required to paint')}
            </span>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#15101e]/80 backdrop-blur-sm">
            <div className="w-10 h-10 border-4 border-[#ff4d4d] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left Column: Toolbar + Stage Canvas */}
          <div className="flex-1 w-full max-w-[650px] mx-auto lg:mx-0">
            {/* Primary Interactive Toolbar */}
            <div className="mb-4 flex flex-col gap-2.5 bg-[#251c35] p-3 rounded-2xl border border-[#3d2b4f]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Main Drawing Tools Group */}
                <div className="flex flex-wrap items-center gap-1 bg-[#15101e] p-1 rounded-xl border border-[#3d2b4f]/50">
                  <button
                    onClick={() => setTool('draw')}
                    className={`p-2 rounded-lg transition-all shrink-0 ${
                      tool === 'draw' ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg shadow-[#ff4d4d]/20' : 'text-gray-400 hover:text-white hover:bg-[#3d2b4f]/40'
                    }`}
                    title={loc('Карандаш (B / P)', 'Pencil (B / P)')}
                  >
                    <PenTool size={16} />
                  </button>
                  <button
                    onClick={() => setTool('eraser')}
                    className={`p-2 rounded-lg transition-all shrink-0 ${
                      tool === 'eraser' ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg shadow-[#ff4d4d]/20' : 'text-gray-400 hover:text-white hover:bg-[#3d2b4f]/40'
                    }`}
                    title={loc('Ластик (E)', 'Eraser (E)')}
                  >
                    <Eraser size={16} />
                  </button>
                  <button
                    onClick={() => setTool('bucket')}
                    className={`p-2 rounded-lg transition-all shrink-0 ${
                      tool === 'bucket' ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg shadow-[#ff4d4d]/20' : 'text-gray-400 hover:text-white hover:bg-[#3d2b4f]/40'
                    }`}
                    title={loc('Заливка (G)', 'Flood Fill (G)')}
                  >
                    <PaintBucket size={16} />
                  </button>
                  <button
                    onClick={() => setTool('spray')}
                    className={`p-2 rounded-lg transition-all shrink-0 ${
                      tool === 'spray' ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg shadow-[#ff4d4d]/20' : 'text-gray-400 hover:text-white hover:bg-[#3d2b4f]/40'
                    }`}
                    title={loc('Распылитель / Неон спрей (S)', 'Spray / Neon Particles (S)')}
                  >
                    <Sparkles size={16} />
                  </button>
                  <button
                    onClick={() => setTool('dither')}
                    className={`p-2 rounded-lg transition-all shrink-0 ${
                      tool === 'dither' ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg shadow-[#ff4d4d]/20' : 'text-gray-400 hover:text-white hover:bg-[#3d2b4f]/40'
                    }`}
                    title={loc('Дизеринг / Шахматная штриховка (D)', 'Dither / Checkerboard Shading (D)')}
                  >
                    <Grid2X2 size={16} />
                  </button>
                  <button
                    onClick={() => setTool('replace_color')}
                    className={`p-2 rounded-lg transition-all shrink-0 ${
                      tool === 'replace_color' ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg shadow-[#ff4d4d]/20' : 'text-gray-400 hover:text-white hover:bg-[#3d2b4f]/40'
                    }`}
                    title={loc('Замена цвета во всем холсте (K)', 'Global Color Replacer (K)')}
                  >
                    <Repeat size={16} />
                  </button>
                  <button
                    onClick={() => setTool('picker')}
                    className={`p-2 rounded-lg transition-all shrink-0 ${
                      tool === 'picker' ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg shadow-[#ff4d4d]/20' : 'text-gray-400 hover:text-white hover:bg-[#3d2b4f]/40'
                    }`}
                    title={loc('Пипетка (I)', 'Eyedropper (I)')}
                  >
                    <Pipette size={16} />
                  </button>
                  <button
                    onClick={() => setTool('move')}
                    className={`p-2 rounded-lg transition-all shrink-0 ${
                      tool === 'move' ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg shadow-[#ff4d4d]/20' : 'text-gray-400 hover:text-white hover:bg-[#3d2b4f]/40'
                    }`}
                    title={loc('Перемещение / Панорама (M / Пробел)', 'Move / Pan (M / Space)')}
                  >
                    <Move size={16} />
                  </button>
                </div>

                {/* Shape Tools Group */}
                <div className="flex items-center gap-1 bg-[#15101e] p-1 rounded-xl border border-[#3d2b4f]/50">
                  <button
                    onClick={() => setTool('line')}
                    className={`p-2 rounded-lg transition-all shrink-0 ${
                      tool === 'line' ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg shadow-[#ff4d4d]/20' : 'text-gray-400 hover:text-white hover:bg-[#3d2b4f]/40'
                    }`}
                    title={loc('Линия (L)', 'Line Tool (L)')}
                  >
                    <Slash size={16} />
                  </button>
                  <button
                    onClick={() => setTool('rect')}
                    className={`p-2 rounded-lg transition-all shrink-0 ${
                      tool === 'rect' ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg shadow-[#ff4d4d]/20' : 'text-gray-400 hover:text-white hover:bg-[#3d2b4f]/40'
                    }`}
                    title={loc('Прямоугольник (R)', 'Rectangle Contour (R)')}
                  >
                    <Square size={16} />
                  </button>
                  <button
                    onClick={() => setTool('rect_filled')}
                    className={`p-2 rounded-lg transition-all shrink-0 ${
                      tool === 'rect_filled' ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg shadow-[#ff4d4d]/20' : 'text-gray-400 hover:text-white hover:bg-[#3d2b4f]/40'
                    }`}
                    title={loc('Заполненный прямоугольник', 'Filled Rectangle')}
                  >
                    <BoxSelect size={16} />
                  </button>
                  <button
                    onClick={() => setTool('circle')}
                    className={`p-2 rounded-lg transition-all shrink-0 ${
                      tool === 'circle' ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg shadow-[#ff4d4d]/20' : 'text-gray-400 hover:text-white hover:bg-[#3d2b4f]/40'
                    }`}
                    title={loc('Окружность (C)', 'Circle Contour (C)')}
                  >
                    <Circle size={16} />
                  </button>
                  <button
                    onClick={() => setTool('circle_filled')}
                    className={`p-2 rounded-lg transition-all shrink-0 ${
                      tool === 'circle_filled' ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg shadow-[#ff4d4d]/20' : 'text-gray-400 hover:text-white hover:bg-[#3d2b4f]/40'
                    }`}
                    title={loc('Заполненный круг', 'Filled Circle')}
                  >
                    <CircleDot size={16} />
                  </button>
                </div>

                {/* History & View Controls */}
                <div className="flex items-center gap-1 bg-[#15101e] p-1 rounded-xl border border-[#3d2b4f]/50">
                  <button
                    onClick={undo}
                    disabled={undoStack.length === 0}
                    className="p-2 rounded-lg transition-all text-gray-400 hover:text-white hover:bg-[#3d2b4f]/40 disabled:opacity-30 disabled:hover:bg-transparent"
                    title={loc('Отменить (Ctrl+Z)', 'Undo (Ctrl+Z)')}
                  >
                    <Undo2 size={16} />
                  </button>
                  <button
                    onClick={redo}
                    disabled={redoStack.length === 0}
                    className="p-2 rounded-lg transition-all text-gray-400 hover:text-white hover:bg-[#3d2b4f]/40 disabled:opacity-30 disabled:hover:bg-transparent"
                    title={loc('Повторить (Ctrl+Y)', 'Redo (Ctrl+Y)')}
                  >
                    <Redo2 size={16} />
                  </button>
                  <div className="w-px h-5 bg-[#3d2b4f] mx-0.5" />
                  <button
                    onClick={() => setShowGrid(!showGrid)}
                    className={`p-2 rounded-lg transition-all ${
                      showGrid ? 'text-[#ff4d4d] bg-[#ff4d4d]/10' : 'text-gray-400 hover:text-white hover:bg-[#3d2b4f]/40'
                    }`}
                    title={loc('Переключить сетку', 'Toggle Grid')}
                  >
                    <Grid size={16} />
                  </button>
                  <button
                    onClick={() => setScale(1)}
                    className="p-2 rounded-lg transition-all text-gray-400 hover:text-white hover:bg-[#3d2b4f]/40 text-[10px] font-mono font-bold"
                    title={loc('Сбросить масштаб 100%', 'Reset 100% Zoom')}
                  >
                    {Math.round(scale * 100)}%
                  </button>
                </div>
              </div>

              {/* Sub-bar: Size, Symmetry, Brush, Canvas Shift & Filters */}
              {mode === 'personal' && (
                <div className="flex flex-col gap-2 pt-2 border-t border-[#3d2b4f]/30">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {/* Size Selector */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        {loc('РАЗМЕР:', 'SIZE:')}
                      </span>
                      <div className="flex bg-[#15101e] p-0.5 rounded-lg border border-[#3d2b4f]/50">
                        {[16, 24, 32, 48, 64].map(sz => (
                          <button
                            key={sz}
                            onClick={() => setPersonalSize(sz)}
                            className={`px-2 py-0.5 rounded text-[10px] font-black transition-all ${
                              personalSize === sz ? 'bg-[#ff4d4d] text-[#15101e]' : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            {sz}x{sz}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Brush Size */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        {loc('КИСТЬ:', 'BRUSH:')}
                      </span>
                      <div className="flex bg-[#15101e] p-0.5 rounded-lg border border-[#3d2b4f]/50">
                        {[1, 2, 3].map(sz => (
                          <button
                            key={sz}
                            onClick={() => setBrushSize(sz)}
                            className={`px-2 py-0.5 rounded text-[10px] font-black transition-all ${
                              brushSize === sz ? 'bg-[#ff4d4d] text-[#15101e]' : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            {sz}px
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Symmetry */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        {loc('СИММЕТРИЯ:', 'SYMMETRY:')}
                      </span>
                      <div className="flex bg-[#15101e] p-0.5 rounded-lg border border-[#3d2b4f]/50">
                        {[
                          { mode: 'none', label: loc('ВЫКЛ', 'OFF'), icon: null },
                          { mode: 'horizontal', label: loc('ГОР', 'HOR'), icon: <FlipHorizontal size={10} /> },
                          { mode: 'vertical', label: loc('ВЕР', 'VER'), icon: <FlipVertical size={10} /> },
                          { mode: 'radial', label: loc('РАД', 'RAD'), icon: <RefreshCw size={10} /> }
                        ].map(sym => (
                          <button
                            key={sym.mode}
                            onClick={() => setSymmetryMode(sym.mode as any)}
                            className={`px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1 transition-all ${
                              symmetryMode === sym.mode ? 'bg-[#ff4d4d] text-[#15101e]' : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            {sym.icon}
                            {sym.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Transformation & Pixel Shift Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#3d2b4f]/20">
                    <div className="flex items-center gap-1 bg-[#15101e] p-1 rounded-lg border border-[#3d2b4f]/50">
                      <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 px-1">
                        {loc('СДВИГ:', 'SHIFT:')}
                      </span>
                      <button
                        onClick={() => handleShiftPixels(0, -1)}
                        className="p-1 rounded hover:bg-[#3d2b4f]/40 text-gray-300 hover:text-white transition-all"
                        title={loc('Сдвинуть вверх', 'Shift Up')}
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        onClick={() => handleShiftPixels(0, 1)}
                        className="p-1 rounded hover:bg-[#3d2b4f]/40 text-gray-300 hover:text-white transition-all"
                        title={loc('Сдвинуть вниз', 'Shift Down')}
                      >
                        <ArrowDown size={13} />
                      </button>
                      <button
                        onClick={() => handleShiftPixels(-1, 0)}
                        className="p-1 rounded hover:bg-[#3d2b4f]/40 text-gray-300 hover:text-white transition-all"
                        title={loc('Сдвинуть влево', 'Shift Left')}
                      >
                        <ArrowLeft size={13} />
                      </button>
                      <button
                        onClick={() => handleShiftPixels(1, 0)}
                        className="p-1 rounded hover:bg-[#3d2b4f]/40 text-gray-300 hover:text-white transition-all"
                        title={loc('Сдвинуть вправо', 'Shift Right')}
                      >
                        <ArrowRight size={13} />
                      </button>
                    </div>

                    {/* Quick Filters */}
                    <div className="flex items-center gap-1 bg-[#15101e] p-1 rounded-lg border border-[#3d2b4f]/50">
                      <button
                        onClick={handleFlipHorizontal}
                        className="p-1.5 rounded hover:bg-[#3d2b4f]/40 text-gray-300 hover:text-white transition-all"
                        title={loc('Отразить по горизонтали', 'Flip Horizontally')}
                      >
                        <FlipHorizontal size={14} />
                      </button>
                      <button
                        onClick={handleFlipVertical}
                        className="p-1.5 rounded hover:bg-[#3d2b4f]/40 text-gray-300 hover:text-white transition-all"
                        title={loc('Отразить по вертикали', 'Flip Vertically')}
                      >
                        <FlipVertical size={14} />
                      </button>
                      <button
                        onClick={handleRotate90}
                        className="p-1.5 rounded hover:bg-[#3d2b4f]/40 text-gray-300 hover:text-white transition-all"
                        title={loc('Повернуть на 90°', 'Rotate 90°')}
                      >
                        <RotateCw size={14} />
                      </button>
                      <button
                        onClick={handleInvertColors}
                        className="p-1.5 rounded hover:bg-[#3d2b4f]/40 text-gray-300 hover:text-white transition-all"
                        title={loc('Инвертировать цвета', 'Invert Colors')}
                      >
                        <SunMedium size={14} />
                      </button>
                      <button
                        onClick={handleGrayscale}
                        className="p-1.5 rounded hover:bg-[#3d2b4f]/40 text-gray-300 hover:text-white transition-all"
                        title={loc('Оттенки серого (Ч/Б)', 'Grayscale')}
                      >
                        <Moon size={14} />
                      </button>
                      <button
                        onClick={() => handleAdjustBrightness(1.15)}
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold text-gray-300 hover:text-white hover:bg-[#3d2b4f]/40 transition-all"
                        title={loc('Осветлить (+15%)', 'Brighten (+15%)')}
                      >
                        +15%
                      </button>
                      <button
                        onClick={() => handleAdjustBrightness(0.85)}
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold text-gray-300 hover:text-white hover:bg-[#3d2b4f]/40 transition-all"
                        title={loc('Затемнить (-15%)', 'Darken (-15%)')}
                      >
                        -15%
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Stage Canvas Viewport */}
            <div
              ref={zoomContainerRef}
              className="aspect-square bg-[#0d0b14] rounded-2xl overflow-hidden border-2 border-[#3d2b4f] shadow-inner relative flex items-center justify-center p-2"
            >
              <motion.div
                className={`w-full h-full relative ${
                  tool === 'move' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
                } select-none touch-none`}
                drag={tool === 'move'}
                dragConstraints={isGlobal ? undefined : { left: -300, right: 300, top: -300, bottom: 300 }}
                style={{ scale }}
                onTouchMove={e => {
                  if (e.touches.length === 2) {
                    e.preventDefault();
                    const touch1 = e.touches[0];
                    const touch2 = e.touches[1];
                    const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);

                    if (lastTouchDistRef.current === null) {
                      lastTouchDistRef.current = dist;
                    } else {
                      const delta = dist - lastTouchDistRef.current;
                      setScale(s => Math.min(Math.max(0.5, s + delta * 0.01), 3.5));
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
                    onPointerDown={e => {
                      if (e.pointerType === 'mouse' && e.buttons !== 1) return;
                      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                      handlePointerDown(e.clientX, e.clientY);
                    }}
                    onPointerMove={e => {
                      handlePointerMove(e.clientX, e.clientY);
                    }}
                    onPointerUp={e => {
                      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                      handlePointerUp();
                    }}
                    onPointerLeave={() => handlePointerUp()}
                    style={{
                      backgroundImage: showGrid
                        ? `linear-gradient(to right, rgba(61,43,79,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(61,43,79,0.3) 1px, transparent 1px)`
                        : 'none',
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
                  <div
                    className="w-full h-full border border-[#3d2b4f]/50 bg-[#15101e] shadow-2xl relative select-none touch-none"
                    ref={innerRef}
                    onPointerDown={e => {
                      if (e.pointerType === 'mouse' && e.buttons !== 1) return;
                      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                      handlePointerDown(e.clientX, e.clientY);
                    }}
                    onPointerMove={e => {
                      handlePointerMove(e.clientX, e.clientY);
                    }}
                    onPointerUp={e => {
                      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                      handlePointerUp();
                    }}
                    onPointerLeave={() => handlePointerUp()}
                  >
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

              {/* Mini Radar Preview */}
              {mode === 'personal' && (
                <div className="absolute bottom-3 right-3 bg-[#15101e]/90 border border-[#ff4d4d]/30 backdrop-blur-md rounded-2xl p-2 shadow-xl pointer-events-none select-none z-10 flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ff4d4d] animate-pulse" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/50">RADAR</span>
                  </div>
                  <div className="w-14 h-14 bg-[#0d0b14] border border-[#3d2b4f]/60 rounded-lg overflow-hidden relative">
                    <div
                      className="grid w-full h-full"
                      style={{
                        gridTemplateColumns: `repeat(${size}, 1fr)`,
                        gridTemplateRows: `repeat(${size}, 1fr)`
                      }}
                    >
                      {Object.keys(pixels).length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center text-[7px] text-white/20 font-mono uppercase">
                          EMPTY
                        </div>
                      ) : (
                        Array.from({ length: size * size }).map((_, idx) => {
                          const x = idx % size;
                          const y = Math.floor(idx / size);
                          const pixel = pixels[`${x},${y}`];
                          return (
                            <div
                              key={idx}
                              style={{ backgroundColor: pixel?.color || '#15101e' }}
                              className="w-full h-full"
                            />
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Canvas Live Stats Bar */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#251c35]/80 rounded-xl border border-[#3d2b4f]/60 text-[11px] text-gray-300 font-mono">
              <div className="flex items-center gap-3">
                <span>
                  {loc('Заполнено:', 'Filled:')}{' '}
                  <strong className="text-[#ff4d4d]">{activePixelsCount}</strong> / {totalPixelsCount} px ({fillPercentage}%)
                </span>
                <span>
                  {loc('Цветов:', 'Colors:')} <strong className="text-purple-400">{uniqueColorsCount}</strong>
                </span>
              </div>
              <div className="text-gray-400">
                {mode === 'global' ? (
                  <span>
                    {loc('Лимит:', 'Limit:')} <strong className="text-[#ff4d4d]">{pixelsLeft}</strong>/{MAX_PIXELS}
                  </span>
                ) : (
                  <span>
                    {size}x{size} • {Math.round(scale * 100)}% zoom
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Colors, Templates, Drafts, Actions */}
          <div className="w-full lg:w-72 shrink-0 flex flex-col gap-4">
            {/* Color Palette Panel */}
            <div className="bg-[#251c35] rounded-2xl p-4 border border-[#3d2b4f] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-gray-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Palette size={14} className="text-[#ff4d4d]" />
                  {loc('Палитры', 'Palettes')}
                </h3>

                {/* Palette Switcher Dropdown */}
                <select
                  value={currentPaletteId}
                  onChange={e => setCurrentPaletteId(e.target.value)}
                  className="bg-[#15101e] border border-[#3d2b4f] text-[10px] font-bold text-white rounded-lg px-2 py-1 outline-none cursor-pointer focus:border-[#ff4d4d]"
                >
                  {CANVAS_PALETTES.map(p => (
                    <option key={p.id} value={p.id}>
                      {lang === 'ru' ? p.nameRu : p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Palette Color Grid */}
              <div className="grid grid-cols-6 gap-2">
                {activePalette.colors.map(color => (
                  <button
                    key={color}
                    onClick={() => handleSelectColor(color)}
                    className={`w-9 h-9 rounded-xl transition-all border-2 ${
                      selectedColor.toLowerCase() === color.toLowerCase() && tool !== 'eraser'
                        ? 'scale-110 border-white shadow-lg shadow-white/30'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}

                {/* Eraser button */}
                <button
                  onClick={() => {
                    setSelectedColor('eraser');
                    setTool('eraser');
                  }}
                  className={`w-9 h-9 rounded-xl transition-all border-2 flex items-center justify-center bg-[#15101e] ${
                    tool === 'eraser'
                      ? 'scale-110 border-white shadow-lg shadow-white/30'
                      : 'border-[#3d2b4f] hover:scale-105 hover:border-[#ff4d4d]'
                  }`}
                  title={loc('Ластик', 'Eraser')}
                >
                  <Eraser size={16} className={tool === 'eraser' ? 'text-white' : 'text-gray-400'} />
                </button>
              </div>

              {/* Custom HEX Input & Native Color Picker */}
              <div className="pt-2 border-t border-[#3d2b4f]/40 space-y-2">
                <div className="flex items-center gap-2">
                  <label
                    className="w-8 h-8 rounded-lg border border-white/20 flex items-center justify-center cursor-pointer relative overflow-hidden shrink-0 shadow-inner"
                    style={{ backgroundColor: selectedColor !== 'eraser' ? selectedColor : '#15101e' }}
                  >
                    <input
                      type="color"
                      value={selectedColor !== 'eraser' ? selectedColor : '#ff4d4d'}
                      onChange={e => handleSelectColor(e.target.value)}
                      className="absolute opacity-0 w-16 h-16 cursor-pointer"
                    />
                  </label>
                  <input
                    type="text"
                    value={customHexInput}
                    onChange={e => {
                      setCustomHexInput(e.target.value);
                      if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                        setSelectedColor(e.target.value);
                        trackRecentColor(e.target.value);
                      }
                    }}
                    placeholder="#ff4d4d"
                    maxLength={7}
                    className="flex-1 bg-[#15101e] border border-[#3d2b4f] rounded-lg px-2 py-1.5 text-xs font-mono text-white outline-none focus:border-[#ff4d4d]"
                  />
                </div>

                {/* Recent Colors Strip */}
                {recentColors.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1 custom-scrollbar">
                    <span className="text-[8px] font-black uppercase text-gray-500 shrink-0">REC:</span>
                    {recentColors.map((col, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectColor(col)}
                        style={{ backgroundColor: col }}
                        className="w-5 h-5 rounded-md shrink-0 border border-white/10 hover:scale-110 transition-transform"
                        title={col}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Templates Selector */}
            {mode === 'personal' && (
              <div className="bg-[#251c35] rounded-2xl p-4 border border-[#3d2b4f] space-y-2.5">
                <h3 className="text-xs font-black text-gray-300 uppercase tracking-widest flex items-center gap-1.5">
                  <LayoutGrid size={14} className="text-[#ff4d4d]" />
                  {loc('Шаблоны (Пиксель-Арт)', 'Templates')}
                </h3>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                  {Object.entries(TEMPLATES).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => setTemplateToLoad(key)}
                      className="px-2 py-1.5 bg-[#15101e] hover:bg-[#ff4d4d]/10 hover:border-[#ff4d4d]/40 border border-[#3d2b4f]/60 rounded-xl text-[10px] font-bold text-gray-300 hover:text-white transition-all text-left truncate flex items-center gap-1.5"
                    >
                      <Sparkles size={10} className="text-[#ff4d4d] shrink-0" />
                      <span className="truncate">{lang === 'ru' ? val.nameRu : val.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions: Export, Publish, Clear */}
            <div className="bg-[#251c35] rounded-2xl p-4 border border-[#3d2b4f] space-y-2">
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="w-full flex items-center justify-center h-10 gap-2 bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 text-[#ff4d4d] hover:text-white hover:bg-[#ff4d4d] rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-md"
                >
                  <Download size={14} className="shrink-0" />
                  {loc('ЭКСПОРТ & СКАЧАТЬ', 'EXPORT & DOWNLOAD')}
                </button>

                {showExportMenu && (
                  <div className="mt-1.5 bg-[#15101e] border border-[#3d2b4f] rounded-2xl p-2 shadow-2xl space-y-1 z-20">
                    <button
                      onClick={() => handleExportPNG(512)}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-gray-200 hover:text-white hover:bg-[#ff4d4d]/20 rounded-xl flex items-center justify-between"
                    >
                      <span>{loc('Скачать PNG (512px)', 'Download PNG (512px)')}</span>
                      <span className="text-[9px] text-gray-500 font-mono">PNG</span>
                    </button>
                    <button
                      onClick={() => handleExportPNG(1024)}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-gray-200 hover:text-white hover:bg-[#ff4d4d]/20 rounded-xl flex items-center justify-between"
                    >
                      <span>{loc('Скачать HD PNG (1024px)', 'Download HD PNG (1024px)')}</span>
                      <span className="text-[9px] text-gray-500 font-mono">HQ</span>
                    </button>
                    <button
                      onClick={handleExportSVG}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-gray-200 hover:text-white hover:bg-[#ff4d4d]/20 rounded-xl flex items-center justify-between"
                    >
                      <span>{loc('Скачать векторный SVG', 'Download Vector SVG')}</span>
                      <span className="text-[9px] text-[#ff4d4d] font-mono">SVG</span>
                    </button>
                    <button
                      onClick={handleCopyToClipboard}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-gray-200 hover:text-white hover:bg-[#ff4d4d]/20 rounded-xl flex items-center justify-between"
                    >
                      <span>{loc('Скопировать в буфер', 'Copy to Clipboard')}</span>
                      <Copy size={12} className="text-gray-400" />
                    </button>
                    <button
                      onClick={handleExportJSON}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-gray-200 hover:text-white hover:bg-[#ff4d4d]/20 rounded-xl flex items-center justify-between"
                    >
                      <span>{loc('Сохранить JSON файл', 'Export JSON file')}</span>
                      <FileCode2 size={12} className="text-purple-400" />
                    </button>
                    <label className="w-full text-left px-3 py-2 text-xs font-bold text-gray-200 hover:text-white hover:bg-[#ff4d4d]/20 rounded-xl flex items-center justify-between cursor-pointer">
                      <span>{loc('Импортировать JSON', 'Import JSON file')}</span>
                      <Upload size={12} className="text-blue-400" />
                      <input
                        ref={jsonFileInputRef}
                        type="file"
                        accept=".json,application/json"
                        onChange={handleImportJSONFile}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {mode === 'personal' && (
                <>
                  <button
                    onClick={handlePublish}
                    className="w-full flex items-center justify-center h-10 gap-2 bg-[#ff4d4d] text-[#15101e] rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#ff7a7a] transition-all active:scale-95 shadow-[0_0_15px_rgba(255,77,77,0.3)]"
                  >
                    <Save size={14} className="shrink-0" />
                    {loc('ОПУБЛИКОВАТЬ В ЛЕНТУ', 'PUBLISH TO ACTIVITIES')}
                  </button>

                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="w-full flex items-center justify-center h-9 gap-1.5 bg-red-600/10 text-red-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-red-600 transition-all active:scale-95 border border-red-500/20"
                  >
                    <Eraser size={14} className="shrink-0" />
                    {loc('ОЧИСТИТЬ ХОЛСТ', 'CLEAR CANVAS')}
                  </button>
                </>
              )}
            </div>

            {/* Drafts & Sketches Section */}
            {mode === 'personal' && (
              <div className="bg-[#251c35] rounded-2xl p-4 border border-[#3d2b4f] space-y-3">
                <h3 className="text-xs font-black text-gray-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Bookmark size={14} className="text-[#ff4d4d]" />
                  {loc('Черновики и Эскизы', 'Drafts & Sketches')}
                </h3>

                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={draftName}
                    onChange={e => setDraftName(e.target.value)}
                    placeholder={loc('Имя черновика...', 'Draft name...')}
                    className="w-full bg-[#15101e] border border-[#3d2b4f]/60 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-[#ff4d4d] transition-all font-sans"
                    maxLength={40}
                  />
                  <button
                    onClick={handleSaveDraft}
                    disabled={isSavingDraft}
                    className="w-full flex items-center justify-center h-8 gap-1 bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-purple-600 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingDraft ? (
                      <div className="w-3.5 h-3.5 border-2 border-purple-300 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Plus size={12} />
                        {loc('СОХРАНИТЬ ЭСКИЗ', 'SAVE SKETCH')}
                      </>
                    )}
                  </button>
                </div>

                <div className="pt-2 border-t border-[#3d2b4f]/30 space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                  {loadingDrafts ? (
                    <div className="text-center py-3 text-white/40 text-xs">
                      <div className="w-4 h-4 border-2 border-[#ff4d4d] border-t-transparent rounded-full animate-spin mx-auto mb-1" />
                      {loc('Загрузка...', 'Loading...')}
                    </div>
                  ) : drafts.length === 0 ? (
                    <div className="text-center py-3 text-white/30 text-xs italic">
                      {loc('Нет сохраненных эскизов', 'No saved drafts yet')}
                    </div>
                  ) : (
                    drafts.map(d => (
                      <div
                        key={d.id}
                        className="bg-[#15101e] border border-[#3d2b4f]/40 hover:border-[#ff4d4d]/40 transition-all p-2 rounded-xl flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-200 truncate" title={d.name}>
                            {d.name}
                          </p>
                          <p className="text-[9px] text-gray-500 font-mono">
                            {d.size ? `${d.size}x${d.size}` : '32x32'} •{' '}
                            {new Date(d.createdAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setDraftToLoad(d)}
                            className="p-1.5 bg-[#ff4d4d]/10 hover:bg-[#ff4d4d]/20 text-[#ff4d4d] rounded-lg transition-all"
                            title={loc('Загрузить', 'Load')}
                          >
                            <FolderOpen size={12} />
                          </button>
                          <button
                            onClick={() => setSelectedDraftForSaves(d)}
                            className="p-1.5 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 rounded-lg transition-all"
                            title={loc('Версии', 'Versions')}
                          >
                            <Bookmark size={12} />
                          </button>
                          <button
                            onClick={() => setDraftToDelete(d)}
                            className="p-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-lg transition-all"
                            title={loc('Удалить', 'Delete')}
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
                {loc('Опубликовать в Активность', 'Publish to Activity')}
              </h3>
              <p className="text-white/60 text-xs font-black uppercase tracking-widest mb-6 leading-relaxed">
                {loc('Ваш рисунок появится в ленте активностей и постов!', 'Your drawing will appear in the main activities feed!')}
              </p>
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
                    {loc('Название рисунка / поста', 'Drawing Title')}
                  </label>
                  <input
                    type="text"
                    value={publishTitle}
                    onChange={e => setPublishTitle(e.target.value)}
                    placeholder={loc('Например: Моё пиксель-арт сердечко...', 'e.g. My Pixel Art Heart...')}
                    className="w-full bg-[#1e172a] border border-[#3d2b4f]/60 rounded-2xl px-5 py-3.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#ff4d4d] transition-all font-sans"
                    maxLength={100}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
                    {loc('Подпись / Описание', 'Caption / Description')}
                  </label>
                  <textarea
                    value={publishCaption}
                    onChange={e => setPublishCaption(e.target.value)}
                    placeholder={loc('Опишите ваш рисунок...', 'Describe your drawing...')}
                    className="w-full h-28 bg-[#1e172a] border border-[#3d2b4f]/60 rounded-2xl px-5 py-3.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#ff4d4d] transition-all resize-none font-sans"
                    maxLength={500}
                  />
                </div>

                {protectedViewFeatureEnabled && (
                  <div className="bg-[#1e172a] border border-[#3d2b4f]/60 rounded-2xl px-5 py-3.5 flex items-center justify-between">
                    <div className="flex-1 pr-4">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-[#ff4d4d] mb-1">
                        {loc('Защищенный просмотр', 'Protected View')}
                      </label>
                      <p className="text-white/50 text-[10px] leading-tight">
                        {loc(
                          'Запретить прямое скачивание и копирование рисунка другими пользователями.',
                          'Prevent downloading and saving of your artwork by others.'
                        )}
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
                  className="flex-1 inline-flex items-center justify-center text-xs text-white/50 hover:text-white px-5 py-3.5 hover:bg-white/5 border border-[#3d2b4f]/30 rounded-2xl transition-all font-black uppercase tracking-widest text-[10px]"
                >
                  {loc('Отмена', 'Cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPublish}
                  disabled={isPublishing || !publishTitle.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-6 py-3.5 bg-[#ff4d4d] text-[#15101e] font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-[#ff7a7a] transition-all disabled:opacity-50 active:scale-95 shadow-lg"
                >
                  {isPublishing ? (
                    <div className="w-4 h-4 border-2 border-[#15101e] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={16} />
                      {loc('Опубликовать', 'Publish')}
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
            return now - saveTime < 72 * 60 * 60 * 1000;
          });

          const handleCreateCopy = async () => {
            if (Object.keys(pixels).length === 0) {
              window.dispatchEvent(
                new CustomEvent('aha_toast', { detail: loc('Нельзя сохранить пустой холст!', 'Cannot save empty canvas!') })
              );
              return;
            }
            if (hasRecentSave) {
              window.dispatchEvent(
                new CustomEvent('aha_toast', {
                  detail: loc('Копия делается только раз в 72 часа!', 'A copy can only be made once every 72 hours!')
                })
              );
              return;
            }

            try {
              const newSave = {
                id: 'save_' + Date.now(),
                pixels,
                size: personalSize,
                createdAt: new Date().toISOString()
              };
              const updatedSaves = [...savesList, newSave];
              await setDoc(doc(db, 'canvas_drafts', currentDraft.id), { saves: updatedSaves }, { merge: true });
              window.dispatchEvent(
                new CustomEvent('aha_toast', { detail: loc('Новое сохранение создано!', 'New save created!') })
              );
            } catch (e) {
              console.error(e);
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
                  {loc('Сохранения эскиза', 'Sketch Saves')}
                </h3>
                <p className="text-xs text-gray-400 mb-4 font-semibold truncate">{currentDraft.name}</p>

                <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1 mb-6">
                  {savesList.length === 0 ? (
                    <p className="text-center py-6 text-xs text-gray-500 italic">
                      {loc('Нет сохраненных копий.', 'No saved copies yet.')}
                    </p>
                  ) : (
                    savesList.map((s: any, idx: number) => (
                      <div
                        key={s.id || idx}
                        className="bg-[#15101e] border border-[#3d2b4f]/60 p-3 rounded-xl flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="text-xs font-bold text-gray-200">
                            {loc(`Копия #${idx + 1}`, `Copy #${idx + 1}`)}
                          </p>
                          <p className="text-[10px] text-gray-500 font-mono">
                            {s.size ? `${s.size}x${s.size}` : '32x32'} •{' '}
                            {new Date(s.createdAt).toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US')}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setSaveToLoad(s)}
                            className="px-2.5 py-1.5 bg-[#ff4d4d]/10 hover:bg-[#ff4d4d]/20 text-[#ff4d4d] rounded-lg text-[10px] font-bold uppercase transition-all"
                          >
                            {loc('Загрузить', 'Load')}
                          </button>
                          <button
                            onClick={() =>
                              setSaveToDelete({ saveId: s.id, draftId: currentDraft.id, savesList })
                            }
                            className="p-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-lg transition-all"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-4 border-t border-[#3d2b4f]/30">
                  <button
                    onClick={handleCreateCopy}
                    disabled={hasRecentSave}
                    className="w-full flex items-center justify-center py-2.5 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-950/40 disabled:text-gray-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:cursor-not-allowed"
                  >
                    <Plus size={14} className="mr-1.5" />
                    {loc('Сделать копию (1 раз в 72ч)', 'Make Copy (1 per 72h)')}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* External Components: Hotkeys & Import Modals */}
      <CanvasHotkeysModal
        isOpen={isHotkeysModalOpen}
        onClose={() => setIsHotkeysModalOpen(false)}
        lang={lang}
      />

      <CanvasImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportImagePixels}
        lang={lang}
        currentSize={personalSize}
      />

      {/* Confirmation Dialogs */}
      <ConfirmModal
        isOpen={draftToLoad !== null}
        onClose={() => setDraftToLoad(null)}
        onConfirm={executeLoadDraft}
        title={loc('Загрузить черновик?', 'Load draft?')}
        message={
          draftToLoad
            ? loc(
                `Вы действительно хотите загрузить черновик "${draftToLoad.name}"? Текущий холст будет перезаписан.`,
                `Are you sure you want to load draft "${draftToLoad.name}"? Current canvas will be overwritten.`
              )
            : ''
        }
        confirmText={loc('Загрузить', 'Load')}
        cancelText={loc('Отмена', 'Cancel')}
      />

      <ConfirmModal
        isOpen={draftToDelete !== null}
        onClose={() => setDraftToDelete(null)}
        onConfirm={executeDeleteDraft}
        title={loc('Удалить черновик?', 'Delete draft?')}
        message={
          draftToDelete
            ? loc(
                `Вы действительно хотите безвозвратно удалить черновик "${draftToDelete.name}"?`,
                `Are you sure you want to permanently delete draft "${draftToDelete.name}"?`
              )
            : ''
        }
        confirmText={loc('Удалить', 'Delete')}
        cancelText={loc('Отмена', 'Cancel')}
        isDestructive={true}
      />

      <ConfirmModal
        isOpen={saveToLoad !== null}
        onClose={() => setSaveToLoad(null)}
        onConfirm={executeLoadSave}
        title={loc('Загрузить версию?', 'Load version?')}
        message={loc(
          'Загрузить эту версию? Текущий холст будет перезаписан.',
          'Load this version? Current canvas will be overwritten.'
        )}
        confirmText={loc('Загрузить', 'Load')}
        cancelText={loc('Отмена', 'Cancel')}
      />

      <ConfirmModal
        isOpen={saveToDelete !== null}
        onClose={() => setSaveToDelete(null)}
        onConfirm={executeDeleteSave}
        title={loc('Удалить это сохранение?', 'Delete this save?')}
        message={loc(
          'Вы действительно хотите удалить эту копию сохранения?',
          'Are you sure you want to delete this saved copy?'
        )}
        confirmText={loc('Удалить', 'Delete')}
        cancelText={loc('Отмена', 'Cancel')}
        isDestructive={true}
      />

      <ConfirmModal
        isOpen={templateToLoad !== null}
        onClose={() => setTemplateToLoad(null)}
        onConfirm={executeLoadTemplate}
        title={loc('Загрузить шаблон?', 'Load template?')}
        message={
          templateToLoad
            ? loc(
                `Загрузка шаблона "${TEMPLATES[templateToLoad]?.nameRu || templateToLoad}" очистит текущий холст. Продолжить?`,
                `Loading template "${TEMPLATES[templateToLoad]?.name || templateToLoad}" will clear current canvas. Continue?`
              )
            : ''
        }
        confirmText={loc('Загрузить', 'Load')}
        cancelText={loc('Отмена', 'Cancel')}
      />

      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={async () => {
          setShowClearConfirm(false);
          await clearCanvas();
        }}
        title={loc('Очистить холст?', 'Clear canvas?')}
        message={loc('Вы действительно хотите полностью очистить холст?', 'Are you sure you want to clear the canvas?')}
        confirmText={loc('Очистить', 'Clear')}
        cancelText={loc('Отмена', 'Cancel')}
        isDestructive={true}
      />

      <ConfirmModal
        isOpen={showPublishClearConfirm}
        onClose={() => setShowPublishClearConfirm(false)}
        onConfirm={async () => {
          setShowPublishClearConfirm(false);
          await clearCanvas();
        }}
        title={loc('Очистить холст после публикации?', 'Clear canvas after publishing?')}
        message={loc(
          'Хотите ли вы очистить холст теперь, когда рисунок опубликован?',
          'Would you like to clear your canvas now that your drawing is published?'
        )}
        confirmText={loc('Очистить', 'Clear')}
        cancelText={loc('Оставить', 'Keep')}
      />
    </div>
  );
};
