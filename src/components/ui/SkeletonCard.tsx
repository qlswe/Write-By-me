import React from 'react';
import { motion } from 'motion/react';

export const SkeletonCard: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-[#251c35] p-6 rounded-2xl shadow-lg border border-[#3d2b4f] relative overflow-hidden"
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent z-10" />
      
      <div className="flex justify-between items-start mb-4">
        <div className="h-6 w-24 bg-[#3d2b4f]/50 rounded-full animate-pulse" />
        <div className="h-8 w-8 bg-[#3d2b4f]/50 rounded-full animate-pulse" />
      </div>
      
      <div className="h-7 w-3/4 bg-[#3d2b4f]/50 rounded-lg animate-pulse mb-4" />
      
      <div className="space-y-2">
        <div className="h-4 w-full bg-[#3d2b4f]/30 rounded animate-pulse" />
        <div className="h-4 w-5/6 bg-[#3d2b4f]/30 rounded animate-pulse" />
        <div className="h-4 w-4/6 bg-[#3d2b4f]/30 rounded animate-pulse" />
      </div>
    </motion.div>
  );
};
