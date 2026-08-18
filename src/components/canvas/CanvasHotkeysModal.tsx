import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X } from 'lucide-react';
import { Language } from '../../data/translations';

interface CanvasHotkeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const CanvasHotkeysModal: React.FC<CanvasHotkeysModalProps> = ({ isOpen, onClose, lang }) => {
  const loc = (ru: string, en: string) => (lang === 'ru' ? ru : en);

  const hotkeysList = [
    { key: 'B / P', name: loc('Карандаш', 'Pencil Tool'), desc: loc('Обычное рисование пикселями', 'Draw single or brush pixels') },
    { key: 'E', name: loc('Ластик', 'Eraser'), desc: loc('Стирание пикселей', 'Erase pixels') },
    { key: 'G', name: loc('Заливка', 'Flood Fill'), desc: loc('Заполнить замкнутую область', 'Fill connected pixel area') },
    { key: 'S', name: loc('Распылитель', 'Spray Brush'), desc: loc('Неоновые частицы и брызги', 'Neon particle splatter') },
    { key: 'D', name: loc('Дизеринг', 'Dither Brush'), desc: loc('Шахматный градиент и тени', 'Checkerboard shading') },
    { key: 'I', name: loc('Пипетка', 'Eyedropper'), desc: loc('Взять цвет с холста', 'Pick color from canvas') },
    { key: 'K', name: loc('Замена цвета', 'Color Replacer'), desc: loc('Заменить цвет во всем рисунке', 'Replace color globally') },
    { key: 'L', name: loc('Линия', 'Line Tool'), desc: loc('Рисование прямой линии', 'Draw straight line') },
    { key: 'R', name: loc('Прямоугольник', 'Rectangle'), desc: loc('Контур прямоугольника', 'Draw rectangle contour') },
    { key: 'C', name: loc('Окружность', 'Circle'), desc: loc('Контур круга', 'Draw circle contour') },
    { key: 'M / Space', name: loc('Панорама', 'Move / Pan'), desc: loc('Перемещение и перетаскивание', 'Pan canvas across viewport') },
    { key: 'Ctrl + Z', name: loc('Отмена', 'Undo'), desc: loc('Отменить последнее действие', 'Undo previous stroke') },
    { key: 'Ctrl + Y', name: loc('Повтор', 'Redo'), desc: loc('Повторить отменённое действие', 'Redo previously undone stroke') },
    { key: 'Стрелки', name: loc('Сдвиг холста', 'Shift Pixels'), desc: loc('Сдвинуть рисунок на 1px', 'Nudge all pixels 1px') },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#15101e] border border-[#3d2b4f] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative text-white"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-[#ff4d4d]/10 rounded-2xl border border-[#ff4d4d]/30 text-[#ff4d4d]">
                <Keyboard size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-wider">
                  {loc('Горячие клавиши', 'Keyboard Shortcuts')}
                </h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                  {loc('Быстрое управление инструментами', 'Speed up your pixel art workflow')}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
              {hotkeysList.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#1f172e] border border-[#3d2b4f]/50 p-2.5 rounded-xl flex items-center justify-between gap-3 hover:border-[#ff4d4d]/40 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-200">{item.name}</p>
                    <p className="text-[10px] text-gray-400 leading-tight">{item.desc}</p>
                  </div>
                  <kbd className="px-2.5 py-1 bg-[#15101e] border border-[#ff4d4d]/40 text-[#ff4d4d] font-mono text-xs font-black rounded-lg shrink-0 shadow-inner">
                    {item.key}
                  </kbd>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-[#3d2b4f]/40 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-[#ff4d4d] text-[#15101e] font-black uppercase text-xs rounded-xl hover:bg-[#ff7a7a] transition-all"
              >
                {loc('Понятно', 'Got it')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
