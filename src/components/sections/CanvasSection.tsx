import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Palette, LogIn, Maximize, RefreshCw, Users, Info, Eraser } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useCanvas } from '../../hooks/useCanvas';
import { translations, Language } from '../../data/translations';

const COLORS = [
  '#000000', '#ffffff', '#ff4d4d', '#4dff4d', '#4d4dff', 
  '#ffff4d', '#ff4dff', '#4dffff', '#ff8800', '#8c1aff',
  '#00cc66', '#808080'
];

export const CanvasSection: React.FC<{ lang: Language }> = ({ lang }) => {
  const { user, loginWithGoogle } = useAuth();
  const { pixels, loading, drawPixel, erasePixel, size } = useCanvas(32); // 32x32 canvas
  const [selectedColor, setSelectedColor] = useState<string>(COLORS[2]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastDrawn, setLastDrawn] = useState<string | null>(null);

  const t = translations[lang] as any;

  const handlePointerDown = (x: number, y: number) => {
    setIsDrawing(true);
    paintPixel(x, y);
  };

  const handlePointerMove = (x: number, y: number) => {
    if (isDrawing) {
      paintPixel(x, y);
    }
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
    setLastDrawn(null);
  };

  const paintPixel = (x: number, y: number) => {
    if (!user) return;
    const pixelId = `${x},${y}`;
    if (lastDrawn === pixelId) return; // Prevent duplicate paints in same stroke
    
    // Check if pixel already has this color to save bandwidth
    const existing = pixels[pixelId];
    
    if (selectedColor === 'eraser') {
      if (!existing) return; // already empty
      setLastDrawn(pixelId);
      erasePixel(x, y);
    } else {
      if (existing && existing.color === selectedColor) return;
      setLastDrawn(pixelId);
      drawPixel(x, y, selectedColor);
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

  // Generate grid cells
  const cells = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const pixelId = `${x},${y}`;
      const pixel = pixels[pixelId];
      cells.push(
        <div
          key={pixelId}
          onPointerDown={(e) => {
            // Prevent default zooming/scrolling behavior on touch devices while drawing
            e.preventDefault(); 
            handlePointerDown(x, y);
          }}
          onPointerMove={(e) => {
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
        <div className="flex items-center gap-2 bg-[#251c35] px-4 py-2 rounded-xl border border-[#3d2b4f]">
          <Users size={16} className="text-[#ff4d4d]" />
          <span className="text-sm font-bold text-gray-300 uppercase tracking-widest text-[#ff4d4d]">Global</span>
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
            <div className="aspect-square bg-[#15101e] rounded-xl overflow-hidden border-2 border-[#3d2b4f] shadow-inner touch-none relative p-2"
                 onPointerUp={handlePointerUp}
                 onPointerLeave={handlePointerUp}
            >
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
            <div className="mt-4 flex items-start gap-3 bg-[#251c35] p-3 rounded-xl border border-[#3d2b4f]">
              <Info size={20} className="text-[#ff4d4d] shrink-0 mt-0.5" />
              <p className="text-xs text-gray-400">
                {t.canvasDesc || "This is a real-time collaborative canvas. Any changes you make are instantly visible to everyone globally!"}
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
                    onClick={() => setSelectedColor(color)}
                    className={`w-10 h-10 rounded-xl transition-all border-2 ${
                      selectedColor === color 
                        ? 'scale-110 border-white shadow-lg shadow-white/20' 
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
                
                <label
                  className={`w-10 h-10 rounded-xl transition-all border-2 flex items-center justify-center cursor-pointer relative overflow-hidden ${
                    selectedColor !== 'eraser' && !COLORS.includes(selectedColor)
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
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="absolute opacity-0 w-20 h-20 cursor-pointer"
                  />
                </label>
                
                <button
                  onClick={() => setSelectedColor('eraser')}
                  className={`w-10 h-10 rounded-xl transition-all border-2 flex items-center justify-center bg-[#15101e] ${
                    selectedColor === 'eraser' 
                      ? 'scale-110 border-white shadow-lg shadow-white/20' 
                      : 'border-[#3d2b4f] hover:scale-105 hover:border-[#ff4d4d]'
                  }`}
                  title={t.canvasEraser || "Eraser"}
                  aria-label="Eraser"
                >
                  <Eraser size={20} className={selectedColor === 'eraser' ? 'text-white' : 'text-gray-400'} />
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
                <span className="text-xs font-mono text-gray-500 bg-[#15101e] px-2 py-1 rounded">
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
