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
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  isDestructive = false
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#2F244F] border border-[#5C4B8B] rounded-2xl p-6 max-w-sm w-full shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-full ${isDestructive ? 'bg-red-500/20 text-red-400' : 'bg-[#C3A6E6]/20 text-[#C3A6E6]'}`}>
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
          </div>
          
          <p className="text-gray-300 mb-6 leading-relaxed">
            {message}
          </p>
          
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-bold text-gray-300 bg-[#3E3160] hover:bg-[#5C4B8B] transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-2 rounded-xl font-bold transition-colors ${
                isDestructive 
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50' 
                  : 'bg-[#C3A6E6] text-[#2F244F] hover:bg-[#B094EB]'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
