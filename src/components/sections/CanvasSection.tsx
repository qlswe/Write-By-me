import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation, useMotionValue } from 'framer-motion';
import { Palette, LogIn, Maximize, RefreshCw, Users, Info, Eraser, Move, PenTool, Save, User as UserIcon, Undo2, Redo2 } from 'lucide-react';
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
type Tool = 'draw' | 'move';

type StrokeAction = {
  pixelId: string;
  oldColor: string | null;
  newColor: string | null;
};

export const CanvasSection: React.FC<{ lang: Language }> = ({ lang }) => {
  const { user, loginWithGoogle } = useAuth();
  
  const [mode, setMode] = useState<CanvasMode>('global');
  // Use unique ID for personal canvas
  const canvasId = mode === 'global' ? 'canvas' : `canvas_personal/${user?.uid}`;
  // For global we pass 0 which means infinite in our hook
  const { pixels, loading, drawPixel, erasePixel, clearCanvas, size } = useCanvas(mode === 'global' ? 0 : 32, canvasId); 
  
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
  }, [canvasId]);

  const t = translations[lang] as any;

  const lastTouchDistRef = useRef<number | null>(null);

  const handlePointerDown = (x: number, y: number) => {
    if (tool === 'move') return;
    setIsDrawing(true);
    currentStrokeRef.current = [];
    paintPixel(x, y);
  };

  const handlePointerMove = (x: number, y: number) => {
    if (tool === 'move') return;
    if (isDrawing) {
      paintPixel(x, y);
    }
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setLastDrawn(null);
    if (currentStrokeRef.current.length > 0) {
      setUndoStack(prev => [...prev, currentStrokeRef.current]);
      setRedoStack([]);
    }
    currentStrokeRef.current = [];
  };

  const paintPixel = (x: number, y: number) => {
    if (!user || tool === 'move') return;
    const pixelId = `${x},${y}`;
    if (lastDrawn === pixelId) return;
    
    const existing = pixels[pixelId];
    const oldColor = existing ? existing.color : null;
    
    if (selectedColor === 'eraser') {
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
      <div className="flex flex-col items-center justify-center h-64 bg-[#251c35] rounded-3xl p-8 border border-[#3d2b4f] shadow-2xl text-center">
        <h2 className="text-2xl font-black text-[#ff4d4d] uppercase mb-4 tracking-widest">{t.canvasTitle || "Pixel Canvas"}</h2>
        <p className="text-gray-400 mb-6">{t.canvasLoginPrompt || "Please sign in to draw on the shared canvas."}</p>
        <GoogleLoginButton lang={lang} />
      </div>
    );
  }

  const innerRef = useRef<HTMLDivElement>(null);

  const handleCanvasPointer = (e: React.PointerEvent<HTMLDivElement>, action: 'down' | 'move') => {
    if (tool === 'move' || !innerRef.current) return;
    const rect = innerRef.current.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    
    // For global canvas we use fixed 20px, for personal canvas we use the computed cell size
    const cellWidth = isGlobal ? (20 * scale) : (rect.width / size);
    const cellHeight = isGlobal ? (20 * scale) : (rect.height / size);
    
    const x = Math.floor(rawX / cellWidth);
    const y = Math.floor(rawY / cellHeight);
    
    if (action === 'down') {
      setIsDrawing(true);
      currentStrokeRef.current = [];
      paintPixel(x, y);
    } else if (isDrawing) {
      paintPixel(x, y);
    }
  };

  const isGlobal = mode === 'global';
  const PIXEL_CSS_SIZE = 20;

  const cells = [];
  if (!isGlobal) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const pixelId = `${x},${y}`;
        const pixel = pixels[pixelId];
        cells.push(
          <div
            key={pixelId}
            style={{ backgroundColor: pixel?.color || '#15101e' }}
            className="w-full h-full border-[0.5px] border-[#3d2b4f] border-opacity-30 select-none touch-none pointer-events-none"
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
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#15101e]/80 backdrop-blur-sm">
             <div className="w-10 h-10 border-4 border-[#ff4d4d] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8 items-start">
          
           <div className="flex-1 w-full max-w-[600px] mx-auto md:mx-0">
            {/* Toolbar for Canvas controls */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 bg-[#251c35] p-2 rounded-xl border border-[#3d2b4f]">
               <div className="flex flex-wrap items-center gap-2">
                 <button
                   onClick={() => setTool('draw')}
                   className={`p-2 rounded-lg transition-colors shrink-0 ${tool === 'draw' ? 'bg-[#ff4d4d] text-[#15101e]' : 'text-gray-400 hover:text-white hover:bg-[#3d2b4f]'}`}
                   title={t.canvasToolDraw || "Draw Tool"}
                 >
                   <PenTool size={18} />
                 </button>
                 <button
                   onClick={() => setTool('move')}
                   className={`p-2 rounded-lg transition-colors shrink-0 ${tool === 'move' ? 'bg-[#ff4d4d] text-[#15101e]' : 'text-gray-400 hover:text-white hover:bg-[#3d2b4f]'}`}
                   title={t.canvasToolMove || "Move/Pan Tool"}
                 >
                   <Move size={18} />
                 </button>
                 <div className="hidden sm:block w-px h-6 bg-[#3d2b4f] mx-1 shrink-0" />
                 <button
                   onClick={undo}
                   disabled={undoStack.length === 0}
                   className="p-2 rounded-lg transition-colors shrink-0 text-gray-400 hover:text-white hover:bg-[#3d2b4f] disabled:opacity-30 disabled:cursor-not-allowed"
                   title="Undo"
                 >
                   <Undo2 size={18} />
                 </button>
                 <button
                   onClick={redo}
                   disabled={redoStack.length === 0}
                   className="p-2 rounded-lg transition-colors shrink-0 text-gray-400 hover:text-white hover:bg-[#3d2b4f] disabled:opacity-30 disabled:cursor-not-allowed"
                   title="Redo"
                 >
                   <Redo2 size={18} />
                 </button>
               </div>
               <div className="flex flex-wrap items-center gap-2">
                 {mode === 'global' && (
                     <span className="text-[10px] shrink-0 whitespace-nowrap flex items-center h-7 text-[#ff4d4d] font-bold uppercase tracking-widest bg-[#15101e] px-2 rounded-md border border-[#ff4d4d]/30 shadow-[0_0_10px_rgba(255,77,77,0.1)]">
                       Лим: {pixelsLeft}/100
                     </span>
                 )}
                 <span className="text-[10px] shrink-0 whitespace-nowrap flex items-center h-7 text-white/50 font-bold uppercase tracking-widest bg-[#15101e] px-2 rounded-md border border-[#3d2b4f]">{t.canvasZoom || "ZOOM"}: {Math.round(scale * 100)}%</span>
                 
                 <div className="flex bg-[#15101e] h-7 shrink-0 rounded-md border border-[#3d2b4f] overflow-hidden">
                   <button 
                     onClick={() => setScale(s => Math.max(0.5, s - 0.1))} 
                     className="px-2 h-full flex shrink-0 items-center justify-center text-gray-400 hover:text-white hover:bg-[#3d2b4f] transition-colors"
                     disabled={scale <= 0.5}
                   >
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>
                   </button>
                   <div className="w-px h-full bg-[#3d2b4f] shrink-0" />
                   <button 
                     onClick={() => setScale(s => Math.min(3, s + 0.1))} 
                     className="px-2 h-full flex shrink-0 items-center justify-center text-gray-400 hover:text-white hover:bg-[#3d2b4f] transition-colors"
                     disabled={scale >= 3}
                   >
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                   </button>
                 </div>

                 {mode === 'personal' && (
                   <>
                     <button
                       onClick={() => {
                         if (window.confirm(t.canvasClearConfirm || "Are you sure you want to clear your personal canvas?")) {
                           clearCanvas();
                         }
                       }}
                       className="flex items-center shrink-0 whitespace-nowrap h-7 gap-1 bg-red-600/20 text-red-500 hover:text-white px-2 rounded-md text-[10px] font-black uppercase tracking-wider hover:bg-red-500 transition-colors"
                       title={t.canvasClear || "Clear Canvas"}
                     >
                       <Eraser size={12} className="shrink-0" /> {t.canvasClear || "ОЧИСТИТЬ"}
                     </button>
                     <button
                       onClick={handlePublish}
                       className="flex items-center shrink-0 whitespace-nowrap h-7 gap-1 bg-[#ff4d4d] text-[#15101e] px-2 rounded-md text-[10px] font-black uppercase tracking-wider hover:bg-[#ff7a7a] transition-colors"
                     >
                       <Save size={12} className="shrink-0" /> {t.canvasPublish || "ОПУБЛИКОВАТЬ"}
                     </button>
                   </>
                 )}
               </div>
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
                          // If drawing, we want to capture pointer to track mouse out of bounds
                          if (tool === 'draw') (e.target as HTMLElement).setPointerCapture(e.pointerId);
                          handleCanvasPointer(e, 'down'); 
                        }}
                        onPointerMove={(e) => { handleCanvasPointer(e, 'move'); }}
                        onPointerUp={(e) => {
                          if (tool === 'draw') (e.target as HTMLElement).releasePointerCapture(e.pointerId);
                          handlePointerUp();
                        }}
                        onPointerLeave={handlePointerUp}
                        style={{
                            backgroundImage: `linear-gradient(to right, rgba(61,43,79,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(61,43,79,0.3) 1px, transparent 1px)`,
                            backgroundSize: `${PIXEL_CSS_SIZE}px ${PIXEL_CSS_SIZE}px`
                        }}
                    >
                        {Object.keys(pixels).map(key => {
                            const p = pixels[key];
                            if (!p) return null;
                            const [xx, yy] = key.split(',').map(Number);
                            return (
                                <div 
                                    key={key}
                                    style={{
                                        position: 'absolute',
                                        left: xx * PIXEL_CSS_SIZE,
                                        top: yy * PIXEL_CSS_SIZE,
                                        width: PIXEL_CSS_SIZE,
                                        height: PIXEL_CSS_SIZE,
                                        backgroundColor: p.color
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
                          if (tool === 'draw') (e.target as HTMLElement).setPointerCapture(e.pointerId);
                          handleCanvasPointer(e, 'down'); 
                        }}
                        onPointerMove={(e) => { handleCanvasPointer(e, 'move'); }}
                        onPointerUp={(e) => {
                          if (tool === 'draw') (e.target as HTMLElement).releasePointerCapture(e.pointerId);
                          handlePointerUp();
                        }}
                        onPointerLeave={handlePointerUp}>
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
                    onClick={() => { setSelectedColor(color); setTool('draw'); }}
                    className={`shrink-0 w-10 h-10 rounded-xl transition-all border-2 ${
                      selectedColor === color && tool === 'draw'
                        ? 'scale-110 border-white shadow-lg shadow-white/20' 
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
                
                <label
                  className={`shrink-0 w-10 h-10 rounded-xl transition-all border-2 flex items-center justify-center cursor-pointer relative overflow-hidden ${
                    selectedColor !== 'eraser' && !COLORS.includes(selectedColor) && tool === 'draw'
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
                    onChange={(e) => { setSelectedColor(e.target.value); setTool('draw'); }}
                    className="absolute opacity-0 w-20 h-20 cursor-pointer"
                  />
                </label>
                
                <button
                  onClick={() => { setSelectedColor('eraser'); setTool('draw'); }}
                  className={`shrink-0 w-10 h-10 rounded-xl transition-all border-2 flex items-center justify-center bg-[#15101e] ${
                    selectedColor === 'eraser' && tool === 'draw'
                      ? 'scale-110 border-white shadow-lg shadow-white/20' 
                      : 'border-[#3d2b4f] hover:scale-105 hover:border-[#ff4d4d]'
                  }`}
                  title={t.canvasEraser || "Eraser"}
                  aria-label="Eraser"
                >
                  <Eraser size={20} className={selectedColor === 'eraser' && tool==='draw' ? 'text-white' : 'text-gray-400'} />
                </button>
              </div>
            </div>

            <div className="bg-[#251c35] rounded-2xl p-4 sm:p-6 border border-[#3d2b4f]">
              <h3 className="text-sm font-black text-gray-300 uppercase tracking-widest mb-3">
                {t.canvasYourColor || "Selected"}
              </h3>
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 shrink-0 rounded-xl shadow-inner border border-white/20 flex flex-col items-center justify-center"
                  style={{ backgroundColor: selectedColor === 'eraser' ? '#15101e' : selectedColor }}
                >
                  {selectedColor === 'eraser' && <Eraser size={24} className="text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0 bg-[#15101e] px-3 py-2.5 rounded-lg border border-[#3d2b4f] flex items-center">
                  <span className="text-xs font-mono text-gray-400 truncate">
                    {selectedColor === 'eraser' ? t.canvasEraser || "ERASER" : selectedColor.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
