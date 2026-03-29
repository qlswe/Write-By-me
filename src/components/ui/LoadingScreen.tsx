import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, RefreshCw } from 'lucide-react';
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
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] bg-[#2F244F] flex flex-col items-center justify-center font-mono overflow-hidden"
        >
          <div className="relative flex flex-col items-center">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="w-32 h-32 rounded-full border-2 border-dashed border-[#5C4B8B] border-t-[#C3A6E6] border-r-[#C3A6E6] mb-8"
            />
            <div className="absolute top-[2rem] w-16 h-16 bg-[#C3A6E6]/20 rounded-full blur-xl animate-pulse" />
            <Globe size={40} className="absolute top-[2.5rem] text-[#C3A6E6]" />
            
            <h2 className="text-2xl font-bold text-[#C3A6E6] tracking-widest mb-2">Министерство Ахахи</h2>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
