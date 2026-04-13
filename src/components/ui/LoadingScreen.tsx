import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Train } from 'lucide-react';
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

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div 
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] bg-[#0d0b14] flex flex-col items-center justify-center font-mono overflow-hidden"
        >
          {/* Background Elements - Optimized */}
          {!lowPerfMode && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ x: '100%', y: `${Math.random() * 100}%`, opacity: 0 }}
                  animate={{ x: '-100%', opacity: [0, 0.2, 0] }}
                  transition={{ 
                    duration: 3 + Math.random() * 4, 
                    repeat: Infinity, 
                    delay: Math.random() * 5,
                    ease: "linear"
                  }}
                  className="absolute h-px w-24 bg-gradient-to-r from-transparent via-[#ff4d4d] to-transparent"
                />
              ))}
            </div>
          )}

          <div className="relative flex flex-col items-center">
            {/* Outer Ring - Optimized */}
            <motion.div 
              animate={lowPerfMode ? {} : { rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="w-40 h-40 rounded-full border border-[#3d2b4f]/30 border-t-[#ff4d4d] mb-12 flex items-center justify-center"
            >
              <motion.div 
                animate={lowPerfMode ? {} : { rotate: -360 }}
                transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
                className="w-32 h-32 rounded-full border border-[#3d2b4f]/20 border-b-[#ff4d4d]/40"
              />
            </motion.div>

            {/* Train Icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="absolute top-[2.5rem]"
            >
              <motion.div
                animate={lowPerfMode ? {} : { y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Train size={40} className="text-[#ff4d4d] drop-shadow-md" />
              </motion.div>
            </motion.div>
            
            <div className="text-center">
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl sm:text-2xl font-bold text-[#ff4d4d] tracking-[0.2em] sm:tracking-[0.3em] mb-4 uppercase"
              >
                {t.siteName}
              </motion.h2>


              
              <div className="flex items-center justify-center gap-2">
                <motion.div 
                  animate={lowPerfMode ? {} : { opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-1.5 h-1.5 bg-[#ff4d4d] rounded-full"
                />
                <motion.div 
                  animate={lowPerfMode ? {} : { opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                  className="w-1.5 h-1.5 bg-[#ff4d4d] rounded-full"
                />
                <motion.div 
                  animate={lowPerfMode ? {} : { opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                  className="w-1.5 h-1.5 bg-[#ff4d4d] rounded-full"
                />
              </div>
            </div>
          </div>

          {/* Bottom Loading Bar */}
          <div className="absolute bottom-12 w-64 h-1 bg-[#15101e] rounded-full overflow-hidden border border-[#3d2b4f]/30">
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="h-full w-1/2 bg-gradient-to-r from-transparent via-[#ff4d4d] to-transparent"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
