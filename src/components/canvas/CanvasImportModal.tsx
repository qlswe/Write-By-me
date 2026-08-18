import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, Sliders, Check } from 'lucide-react';
import { Language } from '../../data/translations';
import { processImageToPixels } from '../../utils/canvasUtils';

interface CanvasImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (pixels: Record<string, string>, targetSize: number) => void;
  lang: Language;
  currentSize: number;
}

export const CanvasImportModal: React.FC<CanvasImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  lang,
  currentSize,
}) => {
  const loc = (ru: string, en: string) => (lang === 'ru' ? ru : en);

  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [targetSize, setTargetSize] = useState<number>(currentSize || 32);
  const [alphaThreshold, setAlphaThreshold] = useState<number>(50);
  const [previewPixels, setPreviewPixels] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setSelectedImageSrc(src);
      loadImageAndProcess(src, targetSize, alphaThreshold);
    };
    reader.readAsDataURL(file);
  };

  const loadImageAndProcess = (src: string, size: number, threshold: number) => {
    setIsProcessing(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageElementRef.current = img;
      const res = processImageToPixels(img, size, threshold);
      setPreviewPixels(res);
      setIsProcessing(false);
    };
    img.src = src;
  };

  const handleSizeChange = (sz: number) => {
    setTargetSize(sz);
    if (selectedImageSrc) {
      loadImageAndProcess(selectedImageSrc, sz, alphaThreshold);
    }
  };

  const handleThresholdChange = (val: number) => {
    setAlphaThreshold(val);
    if (selectedImageSrc) {
      loadImageAndProcess(selectedImageSrc, targetSize, val);
    }
  };

  const handleApply = () => {
    if (Object.keys(previewPixels).length === 0) return;
    onImport(previewPixels, targetSize);
    onClose();
  };

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
            className="bg-[#15101e] border border-[#3d2b4f] rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative text-white"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-[#ff4d4d]/10 rounded-2xl border border-[#ff4d4d]/30 text-[#ff4d4d]">
                <Upload size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-wider">
                  {loc('Импорт изображения в пиксель-арт', 'Import Image to Pixel Art')}
                </h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                  {loc('Преобразование любой картинки в пиксели', 'Convert any photo or graphic into editable pixels')}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Upload Drop Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#3d2b4f] hover:border-[#ff4d4d] rounded-2xl p-6 text-center cursor-pointer transition-all bg-[#1f172e]/50 hover:bg-[#1f172e]"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-gray-200">
                  {selectedImageSrc
                    ? loc('Выбрать другой файл...', 'Choose another image...')
                    : loc('Нажмите для загрузки PNG / JPG / WebP', 'Click to upload PNG / JPG / WebP')}
                </p>
                <p className="text-[10px] text-gray-500 mt-1 uppercase font-mono tracking-wider">
                  {loc('Автоматическая растеризация и квантование', 'Automatic pixelation & quantization')}
                </p>
              </div>

              {/* Controls & Live Preview */}
              {selectedImageSrc && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#1f172e] p-4 rounded-2xl border border-[#3d2b4f]/60">
                  {/* Left: Settings */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                        {loc('Размер сетки (Разрешение):', 'Grid Resolution:')}
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {[16, 24, 32, 48, 64].map((sz) => (
                          <button
                            key={sz}
                            onClick={() => handleSizeChange(sz)}
                            className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all ${
                              targetSize === sz
                                ? 'bg-[#ff4d4d] text-[#15101e]'
                                : 'bg-[#15101e] text-gray-400 hover:text-white border border-[#3d2b4f]'
                            }`}
                          >
                            {sz}x{sz}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                        <span>{loc('Порог прозрачности:', 'Alpha Threshold:')}</span>
                        <span className="font-mono text-[#ff4d4d]">{alphaThreshold}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="254"
                        value={alphaThreshold}
                        onChange={(e) => handleThresholdChange(Number(e.target.value))}
                        className="w-full accent-[#ff4d4d] bg-[#15101e] cursor-pointer"
                      />
                    </div>

                    <div className="text-[10px] text-gray-400 font-mono">
                      {loc('Распознано пикселей:', 'Pixels detected:')}{' '}
                      <span className="text-[#ff4d4d] font-bold">{Object.keys(previewPixels).length}</span>
                    </div>
                  </div>

                  {/* Right: Live Preview Box */}
                  <div className="flex flex-col items-center justify-center p-2 bg-[#15101e] rounded-xl border border-[#3d2b4f]/60">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                      {loc('Превью результата', 'Live Pixel Preview')}
                    </p>
                    <div className="w-32 h-32 bg-[#0d0b14] border border-[#3d2b4f] rounded-lg overflow-hidden relative shadow-inner">
                      {isProcessing ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-[#ff4d4d] border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : (
                        <div
                          className="grid w-full h-full"
                          style={{
                            gridTemplateColumns: `repeat(${targetSize}, 1fr)`,
                            gridTemplateRows: `repeat(${targetSize}, 1fr)`,
                          }}
                        >
                          {Array.from({ length: targetSize * targetSize }).map((_, idx) => {
                            const x = idx % targetSize;
                            const y = Math.floor(idx / targetSize);
                            const color = previewPixels[`${x},${y}`];
                            return (
                              <div
                                key={idx}
                                style={{ backgroundColor: color || 'transparent' }}
                                className="w-full h-full"
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[#3d2b4f]/40 flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-black uppercase text-xs rounded-xl transition-all"
              >
                {loc('Отмена', 'Cancel')}
              </button>
              <button
                onClick={handleApply}
                disabled={Object.keys(previewPixels).length === 0}
                className="px-6 py-2.5 bg-[#ff4d4d] hover:bg-[#ff7a7a] disabled:opacity-40 disabled:cursor-not-allowed text-[#15101e] font-black uppercase text-xs rounded-xl transition-all shadow-lg flex items-center gap-1.5"
              >
                <Check size={16} />
                {loc('Загрузить на холст', 'Load onto Canvas')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
