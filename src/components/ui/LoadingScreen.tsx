import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePerfLogger } from '../../utils/logger';
import { Language, translations } from '../../data/translations';

interface LoadingScreenProps {
  isLoading: boolean;
  lang: Language;
  lowPerfMode?: boolean;
}

const BOOT_SEQUENCE = [
  'AHA_OS KERNEL INITIALIZED',
  'ESTABLISHING SECURE UPLINK...',
  'DECRYPTING ARCHIVES...',
  'MOUNTING VIRTUAL DOM...',
  'SYNCING LORE ENTITIES...',
  'OVERRIDE GRANTED.'
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ isLoading, lang, lowPerfMode }) => {
  const { trackRender } = usePerfLogger('LoadingScreen');
  trackRender();

  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    if (!isLoading) return;
    
    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < BOOT_SEQUENCE.length) {
        setLines(prev => [...prev, BOOT_SEQUENCE[currentLine]]);
        currentLine++;
      }
    }, 300);

    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div 
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0, 
            scale: 1.1, 
            filter: 'brightness(2) contrast(1.5)', 
            transition: { duration: 0.4, ease: "easeIn" } 
          }}
          className="fixed inset-0 z-[99999] bg-black text-[#ff4d4d] flex flex-col justify-end p-6 sm:p-12 overflow-hidden font-mono"
        >
          {/* Scanlines Effect */}
          {!lowPerfMode && (
            <div 
              className="absolute inset-0 pointer-events-none opacity-20 Mix-blend-overlay"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)',
                backgroundSize: '100% 4px'
              }}
            />
          )}

          {/* Glitch Logo background overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-5">
            <h1 className="text-[20vw] font-black italic tracking-tighter mix-blend-screen scale-150 blur-sm">
              AHA
            </h1>
          </div>

          {/* Terminal Output */}
          <div className="relative z-10 max-w-2xl w-full mx-auto space-y-2 text-xs sm:text-base md:text-lg font-bold tracking-widest uppercase">
            {lines.map((line, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4"
              >
                <span className="text-white/30 shrink-0">[{String(idx * 0.123).padEnd(5, '0')}]</span>
                <span className="text-[#ff4d4d]">{line}</span>
              </motion.div>
            ))}
            
            {/* Blinking Cursor */}
            <motion.div 
              animate={{ opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
              className="inline-block w-3 sm:w-4 h-4 sm:h-5 bg-[#ff4d4d] ml-4 mt-2"
            />
          </div>

          {/* Status Bar */}
          <div className="absolute top-0 left-0 w-full p-4 sm:p-6 flex justify-between items-center text-[10px] sm:text-xs text-[#ff4d4d]/50 tracking-[0.3em] uppercase">
            <div>SYS_MEM: OK</div>
            <div className="flex items-center gap-2">
              <motion.div 
                animate={lowPerfMode ? {} : { opacity: [0.2, 1, 0.2] }} 
                transition={{ duration: 1.5, repeat: Infinity }} 
                className="w-1.5 h-1.5 rounded-full bg-[#ff4d4d]" 
              />
              CONNECTION LIVE
            </div>
            <div>VER 4.0.1</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

