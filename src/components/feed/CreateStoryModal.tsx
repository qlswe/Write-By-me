import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Image as ImageIcon, Type, Upload, Check, Trash2, Camera, Palette, Wand2 } from 'lucide-react';
import { Language, translations } from '../../data/translations';
import { useAuth } from '../../hooks/useAuth';
import { STORY_GRADIENTS } from '../../hooks/useStories';
import { uploadMediaFile, compressImageBase64 } from '../../utils/mediaUploader';
import { sdk } from '../../sdk';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onPublishStory: (params: {
    type: 'text' | 'image';
    text: string;
    mediaUrl?: string;
    gradient?: string;
  }) => Promise<void>;
}

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  isOpen,
  onClose,
  lang,
  onPublishStory
}) => {
  const { user } = useAuth();
  const [storyType, setStoryType] = useState<'text' | 'image'>('text');
  const [text, setText] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(STORY_GRADIENTS[0].class);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      if (file.type.startsWith('image/')) {
        const compressed = await compressImageBase64(file);
        setMediaUrl(compressed);
        setStoryType('image');
      } else {
        const uploadedUrl = await uploadMediaFile(file, user?.uid);
        if (uploadedUrl) {
          setMediaUrl(uploadedUrl);
          setStoryType('image');
        }
      }
    } catch (err) {
      console.error("Failed to upload story media:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAiInspiration = async () => {
    setIsGeneratingAi(true);
    try {
      const prompt = lang === 'ru'
        ? 'Напиши супер-короткую (1-2 предложения), яркую, веселую цитату или мысль для сторис в Honkai Star Rail про Радость, удачу в крутках или Масок Недотёп. С эмодзи.'
        : 'Write a super short (1-2 sentences), vibrant, witty quote for Honkai Star Rail story about Joy, warp luck, or Masked Fools. With emojis.';
      
      const res = await sdk.genai.generate(prompt, lang);
      if (res) {
        setText(res.replace(/^["'\s]+|["'\s]+$/g, ''));
      }
    } catch (e) {
      console.warn("AI generation error:", e);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handlePublish = async () => {
    if (!text.trim() && !mediaUrl) return;
    setIsPublishing(true);
    try {
      await onPublishStory({
        type: mediaUrl ? 'image' : 'text',
        text: text.trim(),
        mediaUrl: mediaUrl || undefined,
        gradient: selectedGradient
      });
      onClose();
      // Reset
      setText('');
      setMediaUrl(null);
    } catch (err) {
      console.error("Publish story error:", err);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="w-full max-w-lg bg-[#15101e] border border-[#3d2b4f]/70 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#251c35] flex items-center justify-between bg-[#1b1427]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#ff4d4d] to-fuchsia-500 flex items-center justify-center text-white shadow-md">
                <Sparkles size={16} />
              </div>
              <h3 className="text-base font-black text-white">
                {lang === 'ru' ? 'Создать историю' : 'Create Story'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-5 custom-scrollbar">
            {/* Story Live Preview Box */}
            <div className="flex justify-center">
              <div 
                className={`w-52 h-72 sm:w-60 sm:h-84 rounded-2xl bg-gradient-to-b ${selectedGradient} p-4 flex flex-col justify-between shadow-2xl relative overflow-hidden border-2 border-white/15`}
              >
                {/* Author badge preview */}
                <div className="flex items-center gap-2 relative z-10">
                  <img
                    src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'User')}&background=1c1528&color=fff`}
                    alt="Author"
                    className="w-8 h-8 rounded-full border-2 border-white/80 object-cover shadow"
                  />
                  <div className="text-xs font-black text-white drop-shadow truncate">
                    {user?.displayName || 'User'}
                  </div>
                </div>

                {/* Media or Text inside preview */}
                {mediaUrl ? (
                  <div className="absolute inset-0 z-0">
                    <img src={mediaUrl} alt="Story Media" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
                  </div>
                ) : null}

                <div className="relative z-10 my-auto text-center px-2">
                  <p className="text-sm sm:text-base font-black text-white drop-shadow-md leading-relaxed break-words line-clamp-6">
                    {text || (lang === 'ru' ? 'Ваш текст истории появится здесь...' : 'Your story text will appear here...')}
                  </p>
                </div>

                <div className="relative z-10 flex justify-between items-center text-[10px] text-white/70 font-mono">
                  <span>24h Story</span>
                  <span>Honkai Star Rail</span>
                </div>
              </div>
            </div>

            {/* Mode Switcher: Text vs Image */}
            <div className="grid grid-cols-2 gap-2 bg-[#0c0814] p-1.5 rounded-2xl border border-[#251c35]">
              <button
                type="button"
                onClick={() => { setStoryType('text'); setMediaUrl(null); }}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-black transition-all ${
                  storyType === 'text' && !mediaUrl
                    ? 'bg-[#ff4d4d] text-[#15101e] shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Type size={15} />
                <span>{lang === 'ru' ? 'Текст и Фон' : 'Text & Gradient'}</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-black transition-all ${
                  mediaUrl
                    ? 'bg-fuchsia-500 text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <ImageIcon size={15} />
                <span>{lang === 'ru' ? 'Фото + Текст' : 'Photo + Text'}</span>
              </button>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Text Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white/70">
                  {lang === 'ru' ? 'Текст истории:' : 'Story text:'}
                </label>
                <button
                  type="button"
                  onClick={handleAiInspiration}
                  disabled={isGeneratingAi}
                  className="flex items-center gap-1 text-xs font-bold text-fuchsia-400 hover:text-fuchsia-300 transition-colors disabled:opacity-50"
                >
                  <Wand2 size={13} className={isGeneratingAi ? 'animate-spin' : ''} />
                  <span>{isGeneratingAi ? (lang === 'ru' ? 'ИИ пишет...' : 'AI writing...') : (lang === 'ru' ? 'Аха-Идея' : 'Aha Idea')}</span>
                </button>
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={lang === 'ru' ? 'О чём вы думаете? Поделитесь с сообществом...' : 'What is on your mind? Share with the community...'}
                maxLength={240}
                className="w-full bg-[#0d0917] border border-[#3d2b4f]/60 rounded-2xl p-3.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#ff4d4d] min-h-[85px] resize-none"
              />
              <div className="text-right text-[11px] text-white/40 font-mono">
                {text.length}/240
              </div>
            </div>

            {/* Gradient Background Palettes */}
            {!mediaUrl && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/70 flex items-center gap-1.5">
                  <Palette size={14} className="text-[#ff4d4d]" />
                  <span>{lang === 'ru' ? 'Космический фон:' : 'Cosmic Theme:'}</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {STORY_GRADIENTS.map((grad) => (
                    <button
                      key={grad.id}
                      type="button"
                      onClick={() => setSelectedGradient(grad.class)}
                      className={`h-10 rounded-xl bg-gradient-to-r ${grad.class} border-2 transition-all flex items-center justify-center ${
                        selectedGradient === grad.class 
                          ? 'border-white scale-105 shadow-[0_0_12px_rgba(255,255,255,0.4)]' 
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      title={grad.name}
                    >
                      {selectedGradient === grad.class && <Check size={14} className="text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Media Attachment Info if attached */}
            {mediaUrl && (
              <div className="flex items-center justify-between bg-fuchsia-950/40 border border-fuchsia-500/30 rounded-2xl p-3">
                <div className="flex items-center gap-2.5">
                  <img src={mediaUrl} alt="Attached" className="w-10 h-10 rounded-xl object-cover border border-white/20" />
                  <span className="text-xs font-bold text-fuchsia-200">
                    {lang === 'ru' ? 'Изображение прикреплено' : 'Image attached'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMediaUrl(null)}
                  className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-[#251c35] flex items-center justify-end gap-3 bg-[#171022]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              {lang === 'ru' ? 'Отмена' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={(!text.trim() && !mediaUrl) || isPublishing || isUploading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-[#ff4d4d] to-fuchsia-600 text-white hover:from-[#ff6666] hover:to-fuchsia-500 transition-all shadow-lg hover:shadow-[0_0_20px_rgba(255,77,77,0.3)] disabled:opacity-40 active:scale-95"
            >
              {isPublishing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{lang === 'ru' ? 'Публикация...' : 'Publishing...'}</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>{lang === 'ru' ? 'Опубликовать историю' : 'Share Story'}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
