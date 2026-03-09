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
        className={`fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm ${fullScreen ? (isDestructive ? 'bg-red-950/90' : 'bg-[#2F244F]/95') : 'bg-black/60'}`}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className={fullScreen 
            ? "flex flex-col items-center justify-center text-center w-full h-full max-w-4xl mx-auto p-8" 
            : "bg-[#2F244F] border border-[#5C4B8B] rounded-2xl p-6 max-w-sm w-full shadow-2xl"}
        >
          <div className={`flex items-center gap-3 mb-4 ${fullScreen ? 'flex-col mb-8' : ''}`}>
            <div className={`p-2 rounded-full ${isDestructive ? 'bg-red-500/20 text-red-400' : 'bg-[#C3A6E6]/20 text-[#C3A6E6]'} ${fullScreen ? 'p-6 mb-4' : ''}`}>
              <AlertTriangle size={fullScreen ? 80 : 24} />
            </div>
            <h3 className={`font-bold text-white ${fullScreen ? 'text-4xl md:text-6xl uppercase tracking-wider' : 'text-xl'}`}>{title}</h3>
          </div>
          
          <p className={`text-gray-300 leading-relaxed ${fullScreen ? 'text-xl md:text-3xl mb-12 max-w-2xl' : 'mb-6'}`}>
            {message}
          </p>
          
          <div className={`flex gap-3 justify-end ${fullScreen ? 'w-full max-w-md flex-col-reverse sm:flex-row sm:justify-center gap-6' : ''}`}>
            <button
              onClick={onClose}
              className={`rounded-xl font-bold text-gray-300 bg-[#3E3160] hover:bg-[#5C4B8B] transition-colors ${fullScreen ? 'px-8 py-4 text-xl flex-1' : 'px-4 py-2'}`}
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`rounded-xl font-bold transition-colors ${
                isDestructive 
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50' 
                  : 'bg-[#C3A6E6] text-[#2F244F] hover:bg-[#B094EB]'
              } ${fullScreen ? 'px-8 py-4 text-xl flex-1 border-2' : 'px-4 py-2'}`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
