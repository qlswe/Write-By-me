import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  isDestructive?: boolean;
  fullScreen?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  isDestructive = false,
  fullScreen = false
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${fullScreen ? (isDestructive ? 'bg-red-950' : 'bg-[#0d0b14]') : 'bg-black/80'}`}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className={fullScreen 
            ? "flex flex-col items-center justify-center text-center w-full h-full max-w-4xl mx-auto p-8" 
            : "bg-[#0d0b14] border border-[#15101e] rounded-[2.5rem] p-8 max-w-md w-full shadow-[0_0_50px_rgba(0,0,0,0.5)]"}
        >
          <div className={`flex items-center gap-4 mb-6 ${fullScreen ? 'flex-col mb-10' : ''}`}>
            <div className={`p-4 rounded-2xl ${isDestructive ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20'} ${fullScreen ? 'p-8 mb-6' : ''}`}>
              <AlertTriangle size={fullScreen ? 80 : 32} />
            </div>
            <h3 className={`font-black text-white uppercase tracking-tighter ${fullScreen ? 'text-5xl md:text-7xl' : 'text-2xl'}`}>{title}</h3>
          </div>
          
          <p className={`text-white/60 font-medium leading-relaxed ${fullScreen ? 'text-xl md:text-3xl mb-16 max-w-2xl' : 'mb-8 text-sm'}`}>
            {message}
          </p>
          
          <div className={`flex gap-4 justify-end ${fullScreen ? 'w-full max-w-md flex-col-reverse sm:flex-row sm:justify-center gap-6' : ''}`}>
            <button
              onClick={onClose}
              className={`rounded-2xl font-black uppercase tracking-widest text-white/40 bg-[#15101e]/50 hover:bg-[#15101e] hover:text-white transition-all border border-[#3d2b4f]/20 ${fullScreen ? 'px-10 py-5 text-xl flex-1' : 'px-6 py-3 text-[10px]'}`}
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg ${
                isDestructive 
                  ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20' 
                  : 'bg-[#8B5CF6] text-white hover:bg-[#7C3AED] shadow-[#8B5CF6]/20'
              } ${fullScreen ? 'px-10 py-5 text-xl flex-1 border-2 border-white/20' : 'px-6 py-3 text-[10px] border border-white/10'}`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
