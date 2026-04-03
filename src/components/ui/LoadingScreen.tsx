import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, RefreshCw, Train } from 'lucide-react';
import { usePerfLogger } from '../../utils/logger';

interface LoadingScreenProps {
  isLoading: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ isLoading }) => {
  const { trackRender } = usePerfLogger('LoadingScreen');
  trackRender();

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div 
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }}
          className="fixed inset-0 z-[9999] bg-[#1a142e] flex flex-col items-center justify-center font-mono overflow-hidden"
        >
          {/* Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ x: '100%', y: `${Math.random() * 100}%`, opacity: 0 }}
                animate={{ x: '-100%', opacity: [0, 0.2, 0] }}
                transition={{ 
                  duration: 2 + Math.random() * 3, 
                  repeat: Infinity, 
                  delay: Math.random() * 5,
                  ease: "linear"
                }}
                className="absolute h-px w-32 bg-gradient-to-r from-transparent via-[#C3A6E6] to-transparent"
              />
            ))}
          </div>

          <div className="relative flex flex-col items-center">
            {/* Outer Ring */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="w-48 h-48 rounded-full border border-[#5C4B8B]/30 border-t-[#C3A6E6] border-r-[#C3A6E6]/50 mb-12 flex items-center justify-center"
            >
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                className="w-40 h-40 rounded-full border border-[#5C4B8B]/20 border-b-[#C3A6E6]/40 border-l-[#C3A6E6]/20"
              />
            </motion.div>

            {/* Train Icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="absolute top-[3.5rem]"
            >
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Train size={48} className="text-[#C3A6E6] drop-shadow-[0_0_15px_rgba(195,166,230,0.5)]" />
              </motion.div>
            </motion.div>
            
            <div className="text-center">
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-[#C3A6E6] tracking-[0.3em] mb-4 uppercase"
              >
                Министерство Ахахи
              </motion.h2>


              
              <div className="flex items-center justify-center gap-2">
                <motion.div 
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-1.5 h-1.5 bg-[#C3A6E6] rounded-full"
                />
                <motion.div 
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                  className="w-1.5 h-1.5 bg-[#C3A6E6] rounded-full"
                />
                <motion.div 
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                  className="w-1.5 h-1.5 bg-[#C3A6E6] rounded-full"
                />
              </div>
            </div>
          </div>

          {/* Bottom Loading Bar */}
          <div className="absolute bottom-12 w-64 h-1 bg-[#2F244F] rounded-full overflow-hidden border border-[#5C4B8B]/30">
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="h-full w-1/2 bg-gradient-to-r from-transparent via-[#C3A6E6] to-transparent"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
