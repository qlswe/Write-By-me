import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePerfLogger } from '../../utils/logger';
import { Language, translations } from '../../data/translations';

interface LoadingScreenProps {
  isLoading: boolean;
  lang: Language;
  lowPerfMode?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ isLoading, lang, lowPerfMode }) => {
  const { trackRender } = usePerfLogger('LoadingScreen');
  trackRender();
  
  const t = translations[lang];

  // Pre-calculate particles to avoid re-rendering layout jumps
  const particles = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      size: Math.random() * 4 + 2,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 3,
      xOffset: (Math.random() - 0.5) * 100 
    }));
  }, []);

  const logoLetters = "Aha".split("");

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div 
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 1, backdropFilter: 'blur(20px)' }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)', scale: 1.05 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center overflow-hidden bg-[#0d0a14]/90"
        >
          {/* Animated Background Mesh & Gradients */}
          {!lowPerfMode && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#ff4d4d]/10 via-[#0d0a14]/90 to-[#0d0a14]" 
              />
              
              {/* Massive Breathing MD3 Ripples */}
              {[0, 1, 2, 3].map((ring) => (
                <motion.div
                  key={`ripple-${ring}`}
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ scale: 6, opacity: 0 }}
                  transition={{
                    repeat: Infinity,
                    duration: 5,
                    delay: ring * 1.25,
                    ease: "easeOut"
                  }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-[#ff4d4d]/20 bg-[#ff4d4d]/5"
                />
              ))}

              {/* Floating Particles */}
              {particles.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ y: 0, opacity: 0, scale: 0, x: 0 }}
                  animate={{ 
                    y: -200, 
                    opacity: [0, 0.8, 0],
                    scale: [0, 1, 0],
                    x: p.xOffset
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: p.duration,
                    delay: p.delay,
                    ease: "easeInOut"
                  }}
                  className="absolute rounded-full bg-[#ff4d4d] shadow-[0_0_12px_#ff4d4d]"
                  style={{
                    width: p.size,
                    height: p.size,
                    top: p.top,
                    left: p.left,
                  }}
                />
              ))}
            </div>
          )}

          {/* Central Logo & Orbital Assembly */}
          <div className="relative z-10 flex flex-col items-center">
            
            {/* 3D Floating Stage */}
            <motion.div 
              animate={lowPerfMode ? {} : { 
                y: [0, -15, 0], 
                rotateZ: [-2, 2, -2]
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center perspective-[1200px]"
            >
              
              {/* Intricate SVG Orbits */}
              <motion.svg 
                viewBox="0 0 100 100" 
                className="absolute inset-0 w-full h-full drop-shadow-[0_0_20px_rgba(255,77,77,0.4)]"
              >
                {/* Outermost dotted ring */}
                <motion.circle 
                  cx="50" cy="50" r="48" 
                  fill="transparent" 
                  stroke="rgba(255, 77, 77, 0.3)" 
                  strokeWidth="0.5" 
                  strokeDasharray="1 3" 
                  animate={lowPerfMode ? {} : { rotate: 360 }} 
                  transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                  style={{ transformOrigin: "50% 50%" }}
                />
                
                {/* Primary Thick Dashed Orbit */}
                <motion.circle 
                  cx="50" cy="50" r="42" 
                  fill="transparent" 
                  stroke="#ff4d4d" 
                  strokeWidth="1.5" 
                  strokeDasharray="12 24" 
                  strokeLinecap="round"
                  animate={lowPerfMode ? {} : { rotate: -360 }} 
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                  style={{ transformOrigin: "50% 50%" }}
                />

                {/* Inner Complex Orbit */}
                <motion.circle 
                  cx="50" cy="50" r="35" 
                  fill="transparent" 
                  stroke="rgba(255, 20, 80, 0.6)" 
                  strokeWidth="2.5" 
                  strokeDasharray="30 15 5 15" 
                  strokeLinecap="round"
                  animate={lowPerfMode ? {} : { rotate: 360 }} 
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  style={{ transformOrigin: "50% 50%" }}
                />
              </motion.svg>

              {/* Central Glowing Core / Orb */}
              <motion.div
                animate={lowPerfMode ? {} : { 
                  scale: [1, 1.1, 1],
                  boxShadow: [
                    "0px 0px 30px 10px rgba(255, 77, 77, 0.2)",
                    "0px 0px 80px 25px rgba(255, 77, 77, 0.6)",
                    "0px 0px 30px 10px rgba(255, 77, 77, 0.2)"
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-gradient-to-br from-[#ff4d4d] via-[#cc0000] to-[#550000] flex items-center justify-center border-[3px] border-[#ff4d4d]/40"
              >
                {/* 3D Animated Aha Text Letters */}
                <div className="flex items-center justify-center gap-1">
                  {logoLetters.map((char, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={lowPerfMode ? { opacity: 1 } : { 
                        opacity: 1,
                        y: [0, -8, 0],
                      }}
                      transition={{ 
                        opacity: { duration: 0.5, delay: index * 0.1 },
                        y: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: index * 0.2 },
                      }}
                      className="font-black text-white text-4xl sm:text-6xl uppercase tracking-tighter drop-shadow-[0_8px_12px_rgba(0,0,0,0.8)] select-none"
                    >
                      {char}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* Modern Material Design 3 Pill (Loading Status) */}
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 20 }}
              className="mt-12 md:mt-16 bg-[#1a1225]/80 border border-[#ff4d4d]/30 px-8 py-4 rounded-full shadow-[0_15px_35px_rgba(0,0,0,0.5)] flex flex-col items-center gap-3 relative overflow-hidden backdrop-blur-xl"
            >
              {/* MD3 Scanning Laser Top Border */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#2d1b36] overflow-hidden">
                <motion.div
                  animate={lowPerfMode ? {} : { x: ["-100%", "200%"] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  className="w-1/2 h-full bg-gradient-to-r from-transparent via-[#ff4d4d] to-transparent rounded-full"
                />
              </div>
              
              {/* Dynamic Bottom Glow */}
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-[#ff4d4d]/10 blur-xl pointer-events-none" />

              <div className="flex items-center gap-3 md:gap-4 mt-1 relative z-10">
                {/* Advanced Mini Spinner */}
                <div className="relative w-5 h-5 flex items-center justify-center">
                  <motion.div 
                    animate={lowPerfMode ? {} : { rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-2 border-[#ff4d4d]/20 border-t-[#ff4d4d] rounded-full"
                  />
                  <motion.div 
                    animate={lowPerfMode ? {} : { rotate: -360, scale: [0.8, 1, 0.8] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute w-2 h-2 bg-[#ff0044] rounded-full shadow-[0_0_5px_#ff4d4d]"
                  />
                </div>
                
                {/* Pulsing Text */}
                <motion.span 
                  animate={lowPerfMode ? {} : { opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="font-black text-gray-100 tracking-[0.2em] md:tracking-[0.25em] uppercase text-sm sm:text-base drop-shadow-md"
                >
                  {translations[lang].loading || 'Loading...'}
                </motion.span>
              </div>
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

