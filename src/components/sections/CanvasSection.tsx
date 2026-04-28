import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation, useMotionValue } from 'framer-motion';
import { Palette, LogIn, Maximize, RefreshCw, Users, Info, Eraser, Move, PenTool, Save, User as UserIcon, Undo2, Redo2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useCanvas } from '../../hooks/useCanvas';
import { translations, Language } from '../../data/translations';
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
  const { pixels, loading, drawPixel, erasePixel, clearCanvas, size } = useCanvas(32, canvasId); 
  
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
      erasePixel(x, y);
    } else {
      if (existing && existing.color === selectedColor) return;
      if (!currentStrokeRef.current.find(s => s.pixelId === pixelId)) {
        currentStrokeRef.current.push({ pixelId, oldColor, newColor: selectedColor });
      }
      setLastDrawn(pixelId);
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
      alert(t.canvasPublishSuccess || 'Canvas published to your profile!');
    } catch (e) {
      console.error(e);
      alert(t.canvasPublishFail || 'Failed to publish');
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-[#251c35] rounded-3xl p-8 border border-[#3d2b4f] shadow-2xl text-center">
        <h2 className="text-2xl font-black text-[#ff4d4d] uppercase mb-4 tracking-widest">{t.canvasTitle || "Pixel Canvas"}</h2>
        <p className="text-gray-400 mb-6">{t.canvasLoginPrompt || "Please sign in to draw on the shared canvas."}</p>
        <button
          onClick={loginWithGoogle}
          className="bg-[#ff4d4d] hover:bg-[#ff3333] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-3 transition-colors shadow-lg shadow-[#ff4d4d]/20"
        >
          <LogIn size={20} />
          {t.loginWithGoogle || "Login with Google"}
        </button>
      </div>
    );
  }

  const cells = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const pixelId = `${x},${y}`;
      const pixel = pixels[pixelId];
      cells.push(
        <div
          key={pixelId}
          onPointerDown={(e) => {
            if (tool === 'move') return;
            e.preventDefault(); 
            handlePointerDown(x, y);
          }}
          onPointerMove={(e) => {
            if (tool === 'move') return;
            e.preventDefault();
            handlePointerMove(x, y);
          }}
          style={{ backgroundColor: pixel?.color || '#15101e' }}
          className="w-full h-full border-[0.5px] border-[#3d2b4f] border-opacity-30 select-none touch-none"
        />
      );
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
            <div className="mb-4 flex items-center justify-between bg-[#251c35] p-2 rounded-xl border border-[#3d2b4f]">
               <div className="flex items-center gap-2">
                 <button
                   onClick={() => setTool('draw')}
                   className={`p-2 rounded-lg transition-colors ${tool === 'draw' ? 'bg-[#ff4d4d] text-[#15101e]' : 'text-gray-400 hover:text-white hover:bg-[#3d2b4f]'}`}
                   title={t.canvasToolDraw || "Draw Tool"}
                 >
                   <PenTool size={18} />
                 </button>
                 <button
                   onClick={() => setTool('move')}
                   className={`p-2 rounded-lg transition-colors ${tool === 'move' ? 'bg-[#ff4d4d] text-[#15101e]' : 'text-gray-400 hover:text-white hover:bg-[#3d2b4f]'}`}
                   title={t.canvasToolMove || "Move/Pan Tool"}
                 >
                   <Move size={18} />
                 </button>
                 <div className="w-px h-6 bg-[#3d2b4f] mx-1" />
                 <button
                   onClick={undo}
                   disabled={undoStack.length === 0}
                   className="p-2 rounded-lg transition-colors text-gray-400 hover:text-white hover:bg-[#3d2b4f] disabled:opacity-30 disabled:cursor-not-allowed"
                   title="Undo"
                 >
                   <Undo2 size={18} />
                 </button>
                 <button
                   onClick={redo}
                   disabled={redoStack.length === 0}
                   className="p-2 rounded-lg transition-colors text-gray-400 hover:text-white hover:bg-[#3d2b4f] disabled:opacity-30 disabled:cursor-not-allowed"
                   title="Redo"
                 >
                   <Redo2 size={18} />
                 </button>
               </div>
               <div className="flex items-center gap-2">
                 <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest bg-[#15101e] px-2 py-1 rounded-md border border-[#3d2b4f]">{t.canvasZoom || "ZOOM"}: {Math.round(scale * 100)}%</span>
                 
                 <div className="flex bg-[#15101e] rounded-lg border border-[#3d2b4f] overflow-hidden ml-1">
                   <button 
                     onClick={() => setScale(s => Math.max(0.5, s - 0.1))} 
                     className="p-1.5 text-gray-400 hover:text-white hover:bg-[#3d2b4f] transition-colors"
                     disabled={scale <= 0.5}
                   >
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>
                   </button>
                   <div className="w-px bg-[#3d2b4f]" />
                   <button 
                     onClick={() => setScale(s => Math.min(3, s + 0.1))} 
                     className="p-1.5 text-gray-400 hover:text-white hover:bg-[#3d2b4f] transition-colors"
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
                       className="ml-2 flex items-center gap-1 bg-red-600/20 text-red-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-red-500 transition-colors"
                       title={t.canvasClear || "Clear Canvas"}
                     >
                       <Eraser size={14} /> {t.canvasClear || "Clear"}
                     </button>
                     <button
                       onClick={handlePublish}
                       className="ml-2 flex items-center gap-1 bg-[#ff4d4d] text-[#15101e] px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-[#ff7a7a] transition-colors"
                     >
                       <Save size={14} /> {t.canvasPublish || "Publish"}
                     </button>
                   </>
                 )}
               </div>
            </div>

            {/* Draggable container wrapper */}
            <div className="aspect-square bg-[#0d0b14] rounded-xl overflow-hidden border-2 border-[#3d2b4f] shadow-inner relative flex items-center justify-center p-2">
              <motion.div 
                className={`w-full h-full relative ${tool === 'move' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
                drag={tool === 'move'}
                dragConstraints={{ left: -300, right: 300, top: -300, bottom: 300 }}
                style={{ scale }}
                onWheel={(e) => {
                  e.preventDefault();
                  setScale(s => Math.min(Math.max(0.5, s - e.deltaY * 0.001), 3));
                }}
              >
                <div className="w-full h-full border border-[#3d2b4f]/50 bg-[#15101e] shadow-2xl relative"
                     onPointerUp={handlePointerUp}
                     onPointerLeave={handlePointerUp}>
                  <div 
                    className="w-full h-full grid"
                    style={{ 
                      gridTemplateColumns: `repeat(${size}, 1fr)`,
                      gridTemplateRows: `repeat(${size}, 1fr)`
                    }}
                  >
                    {cells}
                  </div>
                </div>
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
                    className={`w-10 h-10 rounded-xl transition-all border-2 ${
                      selectedColor === color && tool === 'draw'
                        ? 'scale-110 border-white shadow-lg shadow-white/20' 
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
                
                <label
                  className={`w-10 h-10 rounded-xl transition-all border-2 flex items-center justify-center cursor-pointer relative overflow-hidden ${
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
                  className={`w-10 h-10 rounded-xl transition-all border-2 flex items-center justify-center bg-[#15101e] ${
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
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-xl shadow-inner border border-white/20 flex flex-col items-center justify-center"
                  style={{ backgroundColor: selectedColor === 'eraser' ? '#15101e' : selectedColor }}
                >
                  {selectedColor === 'eraser' && <Eraser size={24} className="text-gray-400" />}
                </div>
                <span className="text-xs font-mono text-gray-500 bg-[#15101e] px-2 py-1 rounded w-full truncate">
                  {selectedColor === 'eraser' ? t.canvasEraser || "ERASER" : selectedColor.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
