import React, { useEffect, useState } from 'react';
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

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isLoading) return;
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        const next = p + (Math.random() * 15);
        return next > 95 ? 95 : next;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div 
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0, 
            scale: 1.05,
            filter: 'blur(10px)',
            transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } 
          }}
          className="fixed inset-0 z-[99999] bg-[#050505] text-white flex flex-col items-center justify-center overflow-hidden font-sans"
        >
          {/* Beautiful Ambient Glows */}
          {!lowPerfMode && (
            <>
              <motion.div 
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] bg-[#ff4d4d] rounded-full mix-blend-screen blur-[120px] opacity-40 pointer-events-none" 
              />
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0.4, 0.2]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-[35vw] h-[35vw] max-w-[500px] max-h-[500px] bg-[#6b21a8] rounded-full mix-blend-screen blur-[100px] opacity-30 pointer-events-none" 
              />
            </>
          )}

          {/* Central Logo & Progress */}
          <div className="relative z-10 flex flex-col items-center gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative"
            >
              <h1 className="text-5xl sm:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40 drop-shadow-2xl">
                AHA
              </h1>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="w-[200px] h-[2px] bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-[#ff4d4d] to-white rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut", duration: 0.4 }}
                />
              </div>

              <div className="text-xs sm:text-sm font-medium tracking-[0.2em] text-white/40 uppercase">
                {((translations[lang] as any)?.loading) || "Loading Experience"}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

