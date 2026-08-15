import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Smile, 
  Tag, 
  Link as LinkIcon, 
  Palette as PaletteIcon, 
  X, 
  Send, 
  Sparkles, 
  Lock, 
  Globe, 
  Flame, 
  Lightbulb, 
  Coffee, 
  Rocket, 
  Gamepad2, 
  Laugh,
  Plus,
  Bot,
  Wand2,
  ChevronDown,
  Check
} from 'lucide-react';
import { sdk } from '../../sdk';
import { Language, translations } from '../../data/translations';
import { useAuth } from '../../hooks/useAuth';
import { uploadMediaFile, compressImageBase64 } from '../../utils/mediaUploader';
import { MediaViewer } from '../ui/MediaViewer';

interface FacebookPostCreatorProps {
  lang: Language;
  onSubmit: (postData: {
    title: string;
    content: string;
    imageUrl?: string;
    feeling?: string;
    category?: string;
    isProtected?: boolean;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export const FacebookPostCreator: React.FC<FacebookPostCreatorProps> = ({
  lang,
  onSubmit,
  isSubmitting
}) => {
  const { user } = useAuth();
  const t = translations[lang];

  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('general');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [attachedMedia, setAttachedMedia] = useState<string | null>(null);
  const [isProtected, setIsProtected] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Quick AI post generator
  const handleGenerateAiPost = async (style: 'meme' | 'theory' | 'joy' | 'banner') => {
    setIsGeneratingAi(true);
    setIsExpanded(true);
    try {
      const prompts = {
        meme: lang === 'ru' 
          ? 'Напиши смешной пост для форума Honkai Star Rail про недотёп в масках, Аху или неудачные крутки баннера. Сделай заголовок и текст с эмодзи.'
          : 'Write a funny Honkai Star Rail forum post about Masked Fools, Aha or unlucky banner warps. Include title and text with emojis.',
        theory: lang === 'ru'
          ? 'Напиши интригующую безумную теорию по лору HSR про Эонов и Аху. Сделай заголовок и текст с эмодзи.'
          : 'Write an intriguing wild HSR lore theory about Aeons and Aha. Include title and text with emojis.',
        joy: lang === 'ru'
          ? 'Напиши короткий манифест чистой Радости и веселья в стиле Ахи для соцсети. Заголовок и текст с эмодзи.'
          : 'Write a short manifesto of Joy in the style of Aha. Include title and text with emojis.',
        banner: lang === 'ru'
          ? 'Напиши пост с отчетом о крутках нового баннера и призывом благословения Ахи. Заголовок и текст.'
          : 'Write a post reporting recent banner warps and asking for Aha blessing. Include title and text.'
      };

      const result = await sdk.genai.generate(prompts[style], lang);
      if (result) {
        const lines = result.split('\n').filter(l => l.trim().length > 0);
        if (lines.length > 1) {
          setTitle(lines[0].replace(/^[#* \t]+/, '').slice(0, 80));
          setContent(lines.slice(1).join('\n'));
        } else {
          setContent(result);
        }
      }
    } catch (e) {
      console.warn("AI generation failed", e);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Feeling Picker Modal
  const [showFeelingPicker, setShowFeelingPicker] = useState(false);

  // Doodle Canvas states
  const [isDoodling, setIsDoodling] = useState(false);
  const [doodleColor, setDoodleColor] = useState('#ff4d4d');
  const [doodleBrushSize, setDoodleBrushSize] = useState(4);
  const doodleCanvasRef = useRef<HTMLCanvasElement>(null);
  const doodleDrawingRef = useRef(false);

  const feelingsList = [
    { emoji: '🎭', labelRu: 'веселится с Ахой', labelEn: 'feeling joyful with Aha' },
    { emoji: '💡', labelRu: 'размышляет над лором', labelEn: 'pondering deep lore' },
    { emoji: '🔥', labelRu: 'горит азартом круток', labelEn: 'hyped for warps' },
    { emoji: '☕', labelRu: 'отдыхает на Экспрессе', labelEn: 'chilling on Express' },
    { emoji: '🎉', labelRu: 'празднует победу', labelEn: 'celebrating victory' },
    { emoji: '🚀', labelRu: 'бороздит космос', labelEn: 'exploring cosmos' },
    { emoji: '🎮', labelRu: 'проходит Виртуальную Вселенную', labelEn: 'clearing Simulated Universe' },
    { emoji: '🤡', labelRu: 'троллит КММ', labelEn: 'trolling the IPC' },
    { emoji: '✨', labelRu: 'творит шедевр', labelEn: 'creating art' },
    { emoji: '🤯', labelRu: 'в шоке от сюжета', labelEn: 'mind blown by story' }
  ];

  const categories = [
    { id: 'general', labelRu: '💬 Всеобщий', labelEn: '💬 General' },
    { id: 'theories', labelRu: '💡 Теории', labelEn: '💡 Theories' },
    { id: 'memes', labelRu: '🎭 Мемы и Аха', labelEn: '🎭 Memes & Aha' },
    { id: 'events', labelRu: '🎉 Ивенты', labelEn: '🎉 Events' },
    { id: 'art', labelRu: '🎨 Творчество', labelEn: '🎨 Fan Art' },
    { id: 'guides', labelRu: '📖 Гайды', labelEn: '📖 Guides' }
  ];

  // Canvas Drawing
  const startDoodling = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = doodleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    doodleDrawingRef.current = true;
    ctx.beginPath();
    
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = doodleColor;
    ctx.lineWidth = doodleBrushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const drawDoodle = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!doodleDrawingRef.current) return;
    e.preventDefault();
    const canvas = doodleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDoodling = () => {
    doodleDrawingRef.current = false;
  };

  const clearDoodle = () => {
    const canvas = doodleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveDoodle = () => {
    const canvas = doodleCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setAttachedMedia(dataUrl);
    setIsDoodling(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      if (file.type.startsWith('video/')) {
        const uploadedUrl = await uploadMediaFile(file);
        setAttachedMedia(uploadedUrl);
      } else {
        const reader = new FileReader();
        reader.onload = async () => {
          const rawBase64 = reader.result as string;
          const compressed = await compressImageBase64(rawBase64, 1200, 1200, 0.8);
          const uploadedUrl = await uploadMediaFile(compressed, file.name);
          setAttachedMedia(uploadedUrl);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error(err);
      alert(lang === 'ru' ? 'Ошибка загрузки медиафайла' : 'Failed to upload media file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !title.trim() && !attachedMedia) return;
    
    await onSubmit({
      title: title.trim() || content.trim().slice(0, 50),
      content: content.trim(),
      imageUrl: attachedMedia || undefined,
      feeling: selectedFeeling || undefined,
      category: selectedCategory,
      isProtected
    });

    // Reset Form
    setTitle('');
    setContent('');
    setSelectedFeeling(null);
    setAttachedMedia(null);
    setIsExpanded(false);
    setIsDoodling(false);
  };

  if (!user) {
    return (
      <div className="bg-[#15101e] border border-[#3d2b4f]/40 rounded-3xl p-5 mb-6 text-center shadow-lg">
        <p className="text-sm text-white/60 mb-3">
          {lang === 'ru' ? 'Войдите в аккаунт, чтобы публиковать посты и делиться активностями' : 'Sign in to share posts and publish activities'}
        </p>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('openEmailLogin'))}
          className="px-6 py-2.5 bg-[#ff4d4d] text-[#15101e] font-black text-xs uppercase tracking-wider rounded-xl hover:bg-white transition-all shadow-[0_0_15px_rgba(255,77,77,0.3)]"
        >
          {lang === 'ru' ? 'Войти в аккаунт' : 'Sign In'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#15101e] border border-[#3d2b4f]/40 hover:border-[#ff4d4d]/30 transition-all rounded-3xl p-4 sm:p-5 mb-6 shadow-xl relative overflow-hidden">
      {/* Top collapsed/expanded input area */}
      <div className="flex items-start gap-3">
        <img
          src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=1c1528&color=fff`}
          alt={user.displayName || 'User'}
          className="w-10 sm:w-11 h-10 sm:h-11 rounded-full border-2 border-[#3d2b4f]/60 shrink-0 object-cover mt-0.5"
        />

        <div className="flex-1 min-w-0">
          {!isExpanded ? (
            <div
              onClick={() => setIsExpanded(true)}
              className="w-full bg-[#0d0b14]/80 hover:bg-[#0d0b14] border border-[#3d2b4f]/50 hover:border-[#ff4d4d]/40 rounded-2xl py-3 px-4 text-white/50 hover:text-white/80 text-sm cursor-pointer transition-all flex items-center justify-between"
            >
              <span className="truncate">
                {lang === 'ru' 
                  ? `Что у вас нового, ${user.displayName?.split(' ')[0] || 'Путник'}?` 
                  : `What's on your mind, ${user.displayName?.split(' ')[0] || 'Traveler'}?`}
              </span>
              <Sparkles size={16} className="text-[#ff4d4d]/70 shrink-0 ml-2" />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Header with Feeling Badge & Category Selection */}
              <div className="flex flex-wrap items-center gap-2">
                {selectedFeeling && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 text-xs font-bold text-[#ff4d4d]">
                    <span>{selectedFeeling}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedFeeling(null)}
                      className="hover:text-white ml-1"
                    >
                      ×
                    </button>
                  </span>
                )}

                {/* Custom Category Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className="bg-[#0d0b14] border border-[#3d2b4f]/70 hover:border-[#ff4d4d]/60 rounded-xl px-3 py-1 text-xs font-bold text-white/90 focus:outline-none transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <span>
                      {categories.find(c => c.id === selectedCategory)?.[lang === 'ru' ? 'labelRu' : 'labelEn'] || '💬 Всеобщий'}
                    </span>
                    <ChevronDown size={12} className={`text-white/50 transition-transform ${showCategoryDropdown ? 'rotate-180 text-[#ff4d4d]' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showCategoryDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        className="absolute left-0 top-full mt-1.5 z-40 bg-[#15101e] border border-[#3d2b4f] rounded-2xl shadow-2xl p-1.5 w-44 space-y-0.5"
                      >
                        {categories.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(c.id);
                              setShowCategoryDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                              selectedCategory === c.id
                                ? 'bg-[#ff4d4d]/15 text-[#ff4d4d]'
                                : 'text-white/70 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <span>{lang === 'ru' ? c.labelRu : c.labelEn}</span>
                            {selectedCategory === c.id && <Check size={12} className="text-[#ff4d4d]" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="ml-auto text-[11px] text-white/40 flex items-center gap-1">
                  <Globe size={12} /> {lang === 'ru' ? 'Публично' : 'Public'}
                </div>
              </div>

              {/* Title input (optional) */}
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={lang === 'ru' ? 'Заголовок темы (по желанию)...' : 'Post title (optional)...'}
                className="w-full bg-[#0d0b14] border border-[#3d2b4f]/50 rounded-xl px-3.5 py-2 text-sm font-bold text-white placeholder-white/40 focus:outline-none focus:border-[#ff4d4d]"
              />

              {/* Main Content input */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={lang === 'ru' 
                  ? 'Поделитесь новостью, теорией, мемом или задайте вопрос...' 
                  : 'Share a thought, lore theory, meme, or ask a question...'}
                className="w-full bg-[#0d0b14] border border-[#3d2b4f]/50 rounded-xl p-3.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#ff4d4d] min-h-[110px] resize-y"
              />

              {/* Attached Media Preview */}
              {attachedMedia && (
                <div className="relative max-w-sm bg-[#0d0b14] border border-[#3d2b4f]/60 rounded-2xl p-2 group">
                  <MediaViewer url={attachedMedia} maxHeight="max-h-[200px]" />
                  <button
                    type="button"
                    onClick={() => setAttachedMedia(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors z-10"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Doodle Drawing Pad */}
              {isDoodling && (
                <div className="bg-[#0d0b14] border border-[#ff4d4d]/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                      <PaletteIcon size={14} className="text-[#ff4d4d]" />
                      {lang === 'ru' ? 'Нарисуйте дудл' : 'Aha Doodle Pad'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsDoodling(false)}
                      className="text-white/40 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <canvas
                      ref={doodleCanvasRef}
                      width={320}
                      height={200}
                      onMouseDown={startDoodling}
                      onMouseMove={drawDoodle}
                      onMouseUp={stopDoodling}
                      onMouseLeave={stopDoodling}
                      onTouchStart={startDoodling}
                      onTouchMove={drawDoodle}
                      onTouchEnd={stopDoodling}
                      className="bg-[#15101e] border border-[#3d2b4f]/60 rounded-xl cursor-crosshair touch-none w-full max-w-[320px] h-[200px]"
                    />
                    <div className="space-y-3 w-full sm:w-auto">
                      <div className="flex flex-wrap gap-1.5">
                        {['#ff4d4d', '#4da6ff', '#4dff88', '#ffff4d', '#ff4dff', '#ffffff', '#0d0b14'].map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setDoodleColor(color)}
                            className={`w-6 h-6 rounded-full border transition-all ${doodleColor === color ? 'scale-110 border-white ring-2 ring-[#ff4d4d]/40' : 'border-[#3d2b4f]/50'}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={clearDoodle}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-white/60"
                        >
                          {lang === 'ru' ? 'Очистить' : 'Clear'}
                        </button>
                        <button
                          type="button"
                          onClick={saveDoodle}
                          className="px-4 py-1.5 bg-[#ff4d4d] text-[#15101e] rounded-lg text-xs font-black"
                        >
                          {lang === 'ru' ? 'Прикрепить' : 'Attach'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Bar (Facebook-like) */}
      <div className="border-t border-[#3d2b4f]/30 mt-4 pt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Photo / Video Button */}
          <input
            type="file"
            id="fb-post-file-upload"
            className="hidden"
            accept="image/*,video/*"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          <label
            htmlFor="fb-post-file-upload"
            onClick={() => setIsExpanded(true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white/70 hover:text-white hover:bg-[#251c35] border border-transparent hover:border-[#3d2b4f]/50 cursor-pointer transition-all ${isUploading ? 'opacity-50' : ''}`}
          >
            <Camera size={16} className="text-emerald-400" />
            <span className="hidden sm:inline">{lang === 'ru' ? 'Фото / Видео' : 'Photo / Video'}</span>
          </label>

          {/* Feeling / Activity Picker */}
          <button
            type="button"
            onClick={() => {
              setIsExpanded(true);
              setShowFeelingPicker(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white/70 hover:text-white hover:bg-[#251c35] border border-transparent hover:border-[#3d2b4f]/50 transition-all"
          >
            <Smile size={16} className="text-amber-400" />
            <span className="hidden sm:inline">{lang === 'ru' ? 'Чувство / Статус' : 'Feeling / Activity'}</span>
          </button>

          {/* Doodle Drawing */}
          <button
            type="button"
            onClick={() => {
              setIsExpanded(true);
              setIsDoodling(!isDoodling);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white/70 hover:text-white hover:bg-[#251c35] border border-transparent hover:border-[#3d2b4f]/50 transition-all"
          >
            <PaletteIcon size={16} className="text-pink-400" />
            <span className="hidden sm:inline">{lang === 'ru' ? 'Дудл' : 'Doodle'}</span>
          </button>

          {/* Direct Link */}
          <button
            type="button"
            onClick={() => {
              setIsExpanded(true);
              const url = prompt(lang === 'ru' ? 'Вставьте ссылку на YouTube, видео или фото:' : 'Paste YouTube or Image URL:');
              if (url) setAttachedMedia(url.trim());
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white/70 hover:text-white hover:bg-[#251c35] border border-transparent hover:border-[#3d2b4f]/50 transition-all"
          >
            <LinkIcon size={16} className="text-sky-400" />
            <span className="hidden sm:inline">{lang === 'ru' ? 'Ссылка' : 'Link'}</span>
          </button>

          {/* Aha AI Inspiration */}
          <button
            type="button"
            onClick={() => handleGenerateAiPost('meme')}
            disabled={isGeneratingAi}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-fuchsia-300 hover:text-white bg-fuchsia-500/10 hover:bg-fuchsia-500/25 border border-fuchsia-500/30 transition-all active:scale-95 disabled:opacity-50"
            title={lang === 'ru' ? 'Сгенерировать пост с Аха-ИИ' : 'Generate post with Aha AI'}
          >
            <Sparkles size={16} className={`text-fuchsia-400 ${isGeneratingAi ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isGeneratingAi ? (lang === 'ru' ? 'Генерация...' : 'Generating...') : (lang === 'ru' ? 'Аха-ИИ Пост' : 'Aha AI Post')}</span>
          </button>
        </div>

        {isExpanded && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="px-3 py-2 text-xs font-bold text-white/40 hover:text-white transition-colors"
            >
              {lang === 'ru' ? 'Отмена' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={(!content.trim() && !title.trim() && !attachedMedia) || isSubmitting || isUploading}
              className="px-5 py-2 bg-[#ff4d4d] text-[#15101e] font-black text-xs uppercase tracking-wider rounded-xl hover:bg-white transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(255,77,77,0.3)] flex items-center gap-1.5 active:scale-95"
            >
              {isSubmitting ? (
                <span>...</span>
              ) : (
                <>
                  <Send size={13} />
                  <span>{lang === 'ru' ? 'Опубликовать' : 'Post'}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Feeling Picker Modal */}
      {showFeelingPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-[#15101e] border border-[#ff4d4d]/40 rounded-3xl p-5 shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between border-b border-[#3d2b4f]/40 pb-3">
              <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Smile size={18} className="text-[#ff4d4d]" />
                {lang === 'ru' ? 'Как вы себя чувствуете?' : 'How are you feeling?'}
              </h4>
              <button onClick={() => setShowFeelingPicker(false)} className="text-white/40 hover:text-white">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-1.5 max-h-[300px] overflow-y-auto pr-1">
              {feelingsList.map((f) => (
                <button
                  key={f.emoji + f.labelRu}
                  type="button"
                  onClick={() => {
                    setSelectedFeeling(`${f.emoji} ${lang === 'ru' ? f.labelRu : f.labelEn}`);
                    setShowFeelingPicker(false);
                  }}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0d0b14] hover:bg-[#ff4d4d]/10 hover:border-[#ff4d4d]/30 border border-transparent text-left text-xs font-bold text-white transition-all"
                >
                  <span className="text-xl">{f.emoji}</span>
                  <span>{lang === 'ru' ? f.labelRu : f.labelEn}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
