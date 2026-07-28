import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useChat, Message } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { translations, Language } from '../../data/translations';
import { GoogleLoginButton } from '../ui/GoogleLoginButton';
import { Send, MessageSquare, X, User, Reply, Smile, Sticker, Pencil, Trash2, Ban, Copy, Check, CheckCheck, ChevronDown, Image as ImageIcon, ShieldAlert, Sparkles, Mail, VolumeX, Volume2, Pin, PinOff, Mic, Play, Pause, Trash, Flame, Heart, ThumbsUp, Zap, Star, Crown, Award, Ghost, Skull, Shield, Plus, Settings, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, isSameDay, isToday, isYesterday } from 'date-fns';
import { doc, onSnapshot, setDoc, updateDoc, collection, getDocs, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../firebase';
import { ChatsList } from './ChatsList';
import { CachedAvatar } from '../ui/CachedAvatar';
import { useUsers } from '../../hooks/useUsers';
import { Paintbrush, Paperclip, Search, Shuffle, Download } from 'lucide-react';
import { compressImageFile } from '../../utils/imageCompressor';
import { sdk } from '../../sdk';

const STICKERS = ['👋', '👍', '❤️', '😂', '🔥', '🎉', '👀', '💯'];
const EXTRA_REACTIONS = ['👑', '💩', '🤡', '💅', '🚀', '👾', '🍿', '💡', '💯', '💰', '💀', '👽', '🔥', '🎉'];
import { CHAT_REACTIONS } from '../../constants/reactions';

export const NEON_REACTION_CONFIG: Record<string, { icon: any; color: string; labelRu: string; labelEn: string }> = {
  heart: { icon: Heart, color: 'text-rose-400 drop-shadow-[0_0_8px_#f43f5e]', labelRu: 'Любовь', labelEn: 'Love' },
  thumbsup: { icon: ThumbsUp, color: 'text-cyan-400 drop-shadow-[0_0_8px_#22d3ee]', labelRu: 'Класс', labelEn: 'Like' },
  flame: { icon: Flame, color: 'text-amber-400 drop-shadow-[0_0_8px_#f59e0b]', labelRu: 'Огонь', labelEn: 'Fire' },
  zap: { icon: Zap, color: 'text-yellow-300 drop-shadow-[0_0_8px_#facc15]', labelRu: 'Молния', labelEn: 'Power' },
  star: { icon: Star, color: 'text-purple-400 drop-shadow-[0_0_8px_#c084fc]', labelRu: 'Звезда', labelEn: 'Star' },
  smile: { icon: Smile, color: 'text-emerald-400 drop-shadow-[0_0_8px_#34d399]', labelRu: 'Улыбка', labelEn: 'Smile' },
  crown: { icon: Crown, color: 'text-orange-400 drop-shadow-[0_0_8px_#fb923c]', labelRu: 'Корона', labelEn: 'Crown' },
  award: { icon: Award, color: 'text-indigo-400 drop-shadow-[0_0_8px_#818cf8]', labelRu: 'Кубок', labelEn: 'Award' },
  ghost: { icon: Ghost, color: 'text-pink-400 drop-shadow-[0_0_8px_#f472b6]', labelRu: 'Призрак', labelEn: 'Ghost' },
  skull: { icon: Skull, color: 'text-red-400 drop-shadow-[0_0_8px_#f87171]', labelRu: 'Череп', labelEn: 'Skull' },
  sparkles: { icon: Sparkles, color: 'text-fuchsia-400 drop-shadow-[0_0_8px_#e08ef4]', labelRu: 'Блеск', labelEn: 'Sparkles' },
  shield: { icon: Shield, color: 'text-blue-400 drop-shadow-[0_0_8px_#60a5fa]', labelRu: 'Щит', labelEn: 'Shield' },
};

export const mapEmojiToReactionId = (emoji: string): string => {
  if (emoji === '👍' || emoji === 'thumbsup') return 'thumbsup';
  if (emoji === '❤️' || emoji === 'heart') return 'heart';
  if (emoji === '🔥' || emoji === 'flame') return 'flame';
  if (emoji === '⚡' || emoji === 'zap') return 'zap';
  if (emoji === '⭐' || emoji === 'star') return 'star';
  if (emoji === '😂' || emoji === 'smile') return 'smile';
  if (emoji === '👑' || emoji === 'crown') return 'crown';
  if (emoji === '🏆' || emoji === 'award') return 'award';
  if (emoji === '👻' || emoji === 'ghost') return 'ghost';
  if (emoji === '💀' || emoji === 'skull') return 'skull';
  if (emoji === '✨' || emoji === 'sparkles') return 'sparkles';
  if (emoji === '🛡️' || emoji === 'shield') return 'shield';
  return emoji;
};

export const renderNeonReactionIcon = (reactionId: string, size = 14) => {
  const config = NEON_REACTION_CONFIG[reactionId] || NEON_REACTION_CONFIG['thumbsup'];
  const IconComponent = config.icon;
  return <IconComponent size={size} className={config.color} />;
};

const getSafeDate = (val: any): Date => {
  if (!val) return new Date();
  if (typeof val.toDate === 'function') return val.toDate();
  if (val instanceof Date) return val;
  if (typeof val === 'number') return new Date(val);
  if (typeof val === 'string') return new Date(val);
  if (typeof val.seconds === 'number') return new Date(val.seconds * 1000 + Math.floor((val.nanoseconds || 0) / 1000000));
  return new Date();
};

const getMillis = (val: any): number => {
  if (!val) return 0;
  if (typeof val.toMillis === 'function') return val.toMillis();
  if (typeof val.toDate === 'function') return val.toDate().getTime();
  if (val instanceof Date) return val.getTime();
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return new Date(val).getTime();
  if (typeof val.seconds === 'number') return val.seconds * 1000 + Math.floor((val.nanoseconds || 0) / 1000000);
  return 0;
};

export const VoiceMessagePlayer: React.FC<{ src: string; lang: Language; initialDuration?: number }> = ({ src, lang, initialDuration }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number | null>(initialDuration || null);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;
    audio.playbackRate = speed;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
        setDuration(audio.duration);
      }
    };
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    // Only search for duration if initialDuration is not supplied
    let checkDurationInterval: NodeJS.Timeout | null = null;
    if (!initialDuration) {
      checkDurationInterval = setInterval(() => {
        if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
          setDuration(audio.duration);
          if (checkDurationInterval) clearInterval(checkDurationInterval);
        }
      }, 500);
    }

    return () => {
      audio.pause();
      if (checkDurationInterval) clearInterval(checkDurationInterval);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [src, initialDuration]);

  // Sync playback rate speed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed, isPlaying]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error("Audio playback failed", err);
      });
    }
  };

  const toggleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSpeed(prev => {
      if (prev === 1) return 1.5;
      if (prev === 1.5) return 2;
      return 1;
    });
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time === Infinity) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = duration && duration !== Infinity ? (currentTime / duration) * 100 : 0;

  // Generate wave visual h multipliers
  const waveBars = [6, 12, 18, 10, 16, 24, 14, 8, 20, 12, 16, 10, 22, 18, 12, 6];

  return (
    <div className="flex items-center gap-3 bg-[#11071a]/90 border border-[#ff4d4d]/30 rounded-2xl p-3 shadow-[0_0_15px_rgba(255,77,77,0.15)] min-w-[240px] sm:min-w-[280px] relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
      <div className="absolute top-0 left-0 w-1.5 h-full bg-[#ff4d4d] shadow-[0_0_8px_#ff4d4d]" />
      
      <button
        type="button"
        onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-[#ff4d4d] text-[#0d0714] hover:bg-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shrink-0 shadow-[0_0_12px_rgba(255,77,77,0.4)]"
      >
        {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        {/* Animated Waveform Display */}
        <div className="flex items-end gap-[3px] h-7 px-1 pt-1.5 overflow-hidden relative">
          {waveBars.map((h, i) => {
            const barProgress = (i / waveBars.length) * 100;
            const isFilled = progressPercent >= barProgress;
            return (
              <motion.div
                key={i}
                animate={isPlaying ? {
                  height: [h, h * 2.2, h * 0.6, h]
                } : {
                  height: h
                }}
                transition={{
                  duration: 0.8 + (i % 3) * 0.15,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: (i % 4) * 0.1
                }}
                className={`w-[3px] rounded-full transition-colors ${
                  isFilled 
                    ? 'bg-gradient-to-t from-[#ff4d4d] to-pink-500 shadow-[0_0_4px_#ff4d4d]' 
                    : 'bg-[#28153c]'
                }`}
                style={{ height: `${h}px` }}
              />
            );
          })}
        </div>

        {/* Time and Speed Controls */}
        <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-[#ff4d4d] font-bold">{formatTime(currentTime)}</span>
            <span className="opacity-40">/</span>
            <span>{duration && duration !== Infinity ? formatTime(duration) : '🎤 ' + (lang === 'ru' ? 'Голосовое' : 'Voice')}</span>
          </div>
          
          <button
            type="button"
            onClick={toggleSpeed}
            className="px-2 py-0.5 bg-[#25133d] hover:bg-[#ff4d4d] border border-[#ff4d4d]/20 hover:border-[#ff4d4d] text-[#ff4d4d] hover:text-[#0d0714] font-black text-[9px] uppercase tracking-widest rounded-md transition-all active:scale-90"
            title="Speed Control"
          >
            {speed}x
          </button>
        </div>
      </div>
    </div>
  );
};

interface ChatWindowProps {
  recipientId: string;
  recipientName: string;
  recipientPhoto?: string;
  lang: Language;
  onClose: () => void;
  onSelectChat?: (recipientId: string, name: string, photoURL?: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ recipientId, recipientName, recipientPhoto, lang, onClose, onSelectChat }) => {
  const { user } = useAuth();
  const { chats, messages, sendMessage, toggleReaction, deleteMessage, editMessage, setTyping, markChatAsRead, pinMessage, unpinMessage, deleteChat, blockUser, unblockUser } = useChat(recipientId);
  const t = translations[lang] as any;
  const [inputText, setInputText] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [showStickers, setShowStickers] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [recipientProfile, setRecipientProfile] = useState<any>(null);
  const [showMoreReactions, setShowMoreReactions] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [showReactionCustomizer, setShowReactionCustomizer] = useState(false);
  const [customizingSlotIndex, setCustomizingSlotIndex] = useState<number | null>(null);
  const [manualEmoji, setManualEmoji] = useState('');

  // Voice Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // New features state variables
  const { users } = useUsers();

  // Search History State
  const [showSearch, setShowSearch] = useState(false);
  const [searchHistoryQuery, setSearchHistoryQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);

  // Theme Customization State
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  // Pre-send file attachment state
  const [selectedFile, setSelectedFile] = useState<{ url: string; name: string; size: number; fileType: string } | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      try {
        const compressed = await compressImageFile(file, 800, 800, 0.65);
        setSelectedImages(prev => [...prev, compressed]);
      } catch (err) {
        console.error('Error compressing dropped image:', err);
      }
    } else {
      if (file.size > 750 * 1024) {
        alert(lang === 'ru' ? 'Файл слишком большой (макс. 750 КБ).' : 'File is too large (max 750 KB).');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFile({
          url: reader.result as string,
          name: file.name,
          size: file.size,
          fileType: file.type || 'application/octet-stream'
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Group Management & Info State
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [groupSearchText, setGroupSearchText] = useState('');
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupAvatar, setEditGroupAvatar] = useState('');

  // Memoized query matches for Dialog history
  const matchedMessageIds = useMemo(() => {
    if (!searchHistoryQuery.trim()) return [];
    const q = searchHistoryQuery.toLowerCase();
    return messages
      .filter(m => !m.isDeleted && m.text && m.text.toLowerCase().includes(q))
      .map(m => m.id);
  }, [messages, searchHistoryQuery]);

  // Navigate to a specific search match
  const scrollToMessageId = (msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bg-[#ff4d4d]/30', 'transition-all');
      setTimeout(() => {
        el.classList.remove('bg-[#ff4d4d]/30');
      }, 2000);
    }
  };

  useEffect(() => {
    if (matchedMessageIds.length > 0) {
      setCurrentMatchIndex(matchedMessageIds.length - 1); // Select the most recent match by default
    } else {
      setCurrentMatchIndex(-1);
    }
  }, [matchedMessageIds]);

  useEffect(() => {
    if (currentMatchIndex >= 0 && currentMatchIndex < matchedMessageIds.length) {
      scrollToMessageId(matchedMessageIds[currentMatchIndex]);
    }
  }, [currentMatchIndex]);

  const updateChatTheme = async (wallpaper: string, glowColor: string) => {
    if (!activeChatId) return;
    try {
      await updateDoc(doc(db, 'chats', activeChatId), {
        theme: { wallpaper, glowColor }
      });
      window.dispatchEvent(new CustomEvent('aha_toast', {
        detail: lang === 'ru' ? 'Тема оформления обновлена!' : 'Theme customization updated!'
      }));
    } catch (e) {
      console.error('Error saving theme:', e);
    }
  };

  const getWallpaperClasses = () => {
    const wp = currentChat?.theme?.wallpaper;
    if (wp === 'cyberpunk') return 'bg-[#09030d] bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.08)_0,transparent_100%)]';
    if (wp === 'matrix') return 'bg-[#030d05] bg-[radial-gradient(circle_at_center,rgba(57,255,20,0.08)_0,transparent_100%)]';
    if (wp === 'nebula') return 'bg-gradient-to-tr from-[#020108] via-[#0b041a] to-[#15032a]';
    if (wp === 'sunset') return 'bg-gradient-to-b from-[#100318] via-[#240620] to-[#340c1e]';
    return 'bg-[#0d0714]';
  };

  const getGlowColor = () => {
    return currentChat?.theme?.glowColor || '#ff4d4d';
  };

  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingSecondsRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      window.dispatchEvent(new CustomEvent('aha_toast', { 
        detail: lang === 'ru' 
          ? 'Запись голоса не поддерживается или заблокирована в iframe! Пожалуйста, откройте сайт в новой вкладке (кнопка сверху справа).' 
          : 'Voice recording is not supported or is blocked inside iframe! Please open the app in a new tab.' 
      }));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let recorder: MediaRecorder;
      const chunks: Blob[] = [];

      // Detect and use supported mime types
      const types = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav'];
      let selectedType = '';
      for (const t of types) {
        if (typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(t)) {
          selectedType = t;
          break;
        }
      }

      try {
        if (selectedType) {
          recorder = new MediaRecorder(stream, { mimeType: selectedType });
        } else {
          recorder = new MediaRecorder(stream);
        }
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: selectedType || 'audio/webm' });
        // stop all tracks
        stream.getTracks().forEach(track => track.stop());

        if (chunks.length > 0) {
          // Convert to Base64 data URL
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            await sendMessage(base64Audio, recipientId, 'voice', undefined, undefined, recordingSecondsRef.current);
            playSound('send');
          };
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setMediaRecorder(recorder);
      setAudioChunks([]);
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingSecondsRef.current = 0;

      recordingIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => {
          const next = prev + 1;
          recordingSecondsRef.current = next;
          return next;
        });
      }, 1000);
    } catch (err: any) {
      console.error("Failed to start voice recording:", err);
      const isPermissionDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.message?.toLowerCase().includes('permission denied');
      if (isPermissionDenied) {
        window.dispatchEvent(new CustomEvent('aha_toast', { 
          detail: lang === 'ru' 
            ? 'Доступ к микрофону отклонен! Разрешите доступ в настройках браузера и откройте приложение в новой вкладке.' 
            : 'Microphone access denied! Grant permission in browser settings and open the app in a new tab.' 
        }));
      } else {
        window.dispatchEvent(new CustomEvent('aha_toast', { 
          detail: lang === 'ru' 
            ? `Ошибка запуска записи: ${err.message || 'нет доступа'}` 
            : `Failed to start recording: ${err.message || 'access denied'}` 
        }));
      }
    }
  };

  const stopAndSendRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    setIsRecording(false);
  };

  const cancelRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.ondataavailable = null;
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    setIsRecording(false);
    setAudioChunks([]);
    setRecordingSeconds(0);
  };

  const formatRecordingTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(doc(db, 'public_profiles', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setCurrentUserProfile(docSnap.data());
      }
    });
    return () => unsub();
  }, [user?.uid]);

  const customReactionsList = (currentUserProfile?.customReactions || ['thumbsup', 'heart', 'flame', 'zap', 'star', 'smile']).map(mapEmojiToReactionId);

  const updateCustomReactionSlot = async (slotIndex: number, newReactionId: string) => {
    if (!user?.uid || !newReactionId.trim()) return;
    const cleanId = mapEmojiToReactionId(newReactionId.trim());
    const newReactions = [...customReactionsList];
    newReactions[slotIndex] = cleanId;
    try {
      await setDoc(doc(db, 'public_profiles', user.uid), {
        customReactions: newReactions
      }, { merge: true });
      window.dispatchEvent(new CustomEvent('aha_toast', { detail: lang === 'ru' ? 'Слот реакций обновлен!' : 'Reaction slot updated!' }));
    } catch (e) {
      console.error('Error saving custom reactions:', e);
    }
  };

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const playSound = (type: 'send' | 'receive' | 'react') => {
    if (isMuted) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      if (type === 'send') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.14);
      } else if (type === 'receive') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(800, ctx.currentTime);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1200, ctx.currentTime);
        
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        
        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.3);
        osc2.stop(ctx.currentTime + 0.3);
      } else if (type === 'react') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(550, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(850, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch (err) {
      console.warn('Audio blocked:', err);
    }
  };

  useEffect(() => {
    if (user && recipientId === user.uid) {
      onClose();
    }
  }, [user, recipientId, onClose]);

  const activeChatId = user ? (recipientId.startsWith('group_') ? recipientId : [user.uid, recipientId].sort().join('_')) : '';
  const currentChat = chats.find(c => c.id === activeChatId);
  const isRecipientTyping = !recipientId.startsWith('group_') && currentChat?.typing?.[recipientId];

  const groupTypingNames = useMemo(() => {
    if (!recipientId.startsWith('group_') || !currentChat?.typing) return [];
    return Object.keys(currentChat.typing)
      .filter(uid => uid !== user?.uid && currentChat.typing?.[uid])
      .map(uid => {
        const u = users.find(usr => usr.uid === uid);
        return u?.displayName || 'User';
      });
  }, [recipientId, currentChat?.typing, users, user?.uid]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle playing received audio chime automatically when recipient sends a message
  const lastMessagesLengthRef = useRef(messages.length);
  useEffect(() => {
    if (messages.length > lastMessagesLengthRef.current) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.senderId !== user?.uid) {
        playSound('receive');
      }
    }
    lastMessagesLengthRef.current = messages.length;
  }, [messages, user?.uid]);

  useEffect(() => {
    if (messages.length > 0) {
      markChatAsRead(recipientId);
    }
  }, [messages.length, recipientId]);

  useEffect(() => {
    if (!recipientId || typeof recipientId !== 'string' || recipientId.trim() === '' || recipientId.startsWith('group_')) return;
    const unsub = onSnapshot(doc(db, 'public_profiles', recipientId), (doc) => {
      if (doc.exists()) {
        setRecipientProfile(doc.data());
      }
    });
    return () => unsub();
  }, [recipientId]);

  const isUserOnline = () => {
    if (!recipientProfile?.lastSeen) return false;
    const lastSeenTime = new Date(recipientProfile.lastSeen).getTime();
    const now = new Date().getTime();
    return (now - lastSeenTime) < 3 * 60 * 1000;
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const shouldShow = scrollHeight - scrollTop - clientHeight > 100;
    if (showScrollButton !== shouldShow) {
      setShowScrollButton(shouldShow);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDateSeparator = (date: Date) => {
    if (isToday(date)) return t.chatToday;
    if (isYesterday(date)) return t.chatYesterday;
    return format(date, lang === 'ru' ? 'dd MMMM yyyy' : 'MMMM dd, yyyy');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach(async (file) => {
      if (file.size > 10 * 1024 * 1024) {
        alert(t.chatFileTooLarge);
        return;
      }

      try {
        const compressed = await compressImageFile(file, 800, 800, 0.65);
        setSelectedImages(prev => [...prev, compressed]);
      } catch (err) {
        console.error('Error compressing uploaded image:', err);
      }
    });
    
    e.target.value = '';
  };

  const removeSelectedImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 750 * 1024) {
      alert(lang === 'ru' ? 'Файл слишком большой (макс. 750 КБ).' : 'File is too large (max 750 KB).');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedFile({
        url: reader.result as string,
        name: file.name,
        size: file.size,
        fileType: file.type || 'application/octet-stream'
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const [isJukyTyping, setIsJukyTyping] = useState(false);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && selectedImages.length === 0 && !selectedFile) || isSending) return;
    
    const currentInput = inputText.trim();
    setIsSending(true);
    try {
      if (editingMessage) {
        await editMessage(editingMessage.id, recipientId, inputText);
        setEditingMessage(null);
      } else if (selectedFile) {
        await sendMessage(
          inputText || selectedFile.name,
          recipientId,
          'file',
          replyingTo?.id,
          undefined,
          undefined,
          selectedFile
        );
        setSelectedFile(null);
        playSound('send');
      } else {
        const type = selectedImages.length > 0 ? 'image' : 'text';
        await sendMessage(inputText, recipientId, type, replyingTo?.id, selectedImages);
        playSound('send');
      }

      setInputText('');
      setSelectedImages([]);
      setReplyingTo(null);
      setTyping(recipientId, false);
      setIsTyping(false);

      // --- JUKY BOT AI RESPONSES ---
      const isJukyTarget = recipientId === 'bot_juky' || recipientId.startsWith('juky_');
      const isGroupJukyMention = recipientId.startsWith('group_') && (
        currentInput.toLowerCase().includes('@juky') || 
        currentInput.toLowerCase().includes('@жуки') || 
        currentInput.toLowerCase().includes('@bot')
      );

      if (isJukyTarget) {
        setIsJukyTyping(true);
        setTimeout(async () => {
          try {
            const systemPrompt = `Ты - Juky AI (Жуки 🤖), умный, позитивный и отзывчивый ИИ-ассистент платформы Aha Station.
Отвечай развернуто, вежливо и информативно на языке запроса пользователя (текущий язык интерфейса: ${lang}).
Используй аккуратное Markdown форматирование (жирный текст, списки) и подходящие эмодзи.`;
            const aiReply = await sdk.genai.generate(currentInput || 'Привет', lang, systemPrompt);
            const finalReply = aiReply || (lang === 'ru' ? 'Я тут! Чем могу помочь? 🤖' : 'I am here! How can I help? 🤖');
            await sendMessage(finalReply, recipientId, 'text', undefined, undefined, undefined, null, 'bot_juky');
          } catch (botErr) {
            console.error('Juky Bot AI response error:', botErr);
          } finally {
            setIsJukyTyping(false);
          }
        }, 600);
      } else if (isGroupJukyMention) {
        setIsJukyTyping(true);
        setTimeout(async () => {
          try {
            const systemPrompt = `Ты - Juky AI (Жуки 🤖), ассистент участников группового чата Aha Station.
Отвечай с юмором, позитивно и емко (1-3 предложения) на языке ${lang}.`;
            const aiReply = await sdk.genai.generate(currentInput, lang, systemPrompt);
            if (aiReply) {
              await sendMessage(`🤖 @Juky: ${aiReply}`, recipientId, 'text', undefined, undefined, undefined, null, 'bot_juky');
            }
          } catch (botErr) {
            console.error('Group Juky Bot response error:', botErr);
          } finally {
            setIsJukyTyping(false);
          }
        }, 800);
      }

    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
      setTyping(recipientId, true);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      setTyping(recipientId, false);
    }, 2000);
  };

  const handleSendSticker = async (sticker: string) => {
    if (isSending) return;
    setIsSending(true);
    try {
      await sendMessage(sticker, recipientId, 'sticker', replyingTo?.id);
      playSound('send');
      setShowStickers(false);
      setReplyingTo(null);
    } catch (error) {
      console.error("Error sending sticker:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleScrollToPinned = (msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('animate-pulse', 'border-[#ff4d4d]');
      setTimeout(() => {
        el.classList.remove('animate-pulse', 'border-[#ff4d4d]');
      }, 1500);
    }
  };

  return (
    <>
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-[#0d0714] flex flex-col items-center justify-center z-50 transition-all duration-300 p-0"
      >
        <div 
          className="w-full h-full flex bg-[#0d0714] relative overflow-hidden"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Fullscreen drag-and-drop backdrop overlay */}
          <AnimatePresence>
            {isDraggingFile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#09030d]/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-8 border-4 border-dashed border-[#00f0ff] m-4 rounded-3xl shadow-[0_0_40px_rgba(0,240,255,0.2)]"
              >
                <div className="p-6 bg-[#00f0ff]/10 rounded-full text-[#00f0ff] animate-bounce mb-4 border border-[#00f0ff]/30">
                  <Paperclip className="w-10 h-10 shrink-0" />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-widest text-center mb-1">
                  {lang === 'ru' ? 'БРОСЬТЕ ФАЙЛЫ СЮДА' : 'DROP FILES HERE'}
                </h3>
                <p className="text-xs font-black uppercase tracking-widest text-[#00f0ff]">
                  {lang === 'ru' ? 'для мгновенной отправки в чат' : 'for instant upload to this chat'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bento Group Settings Panel */}
          <AnimatePresence>
            {showGroupSettings && recipientId.startsWith('group_') && (
              <motion.div
                initial={{ opacity: 0, x: '100%' }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute right-0 top-0 bottom-0 w-full sm:w-[400px] bg-[#0c0612]/98 backdrop-blur-lg border-l border-[#311c47] shadow-2xl z-40 flex flex-col custom-scrollbar overflow-y-auto"
              >
                {/* Header */}
                <div className="p-5 border-b border-[#311c47] flex items-center justify-between bg-[#08030c] shrink-0">
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-[#00f0ff] shadow-[0_0_8px_rgba(0,240,255,0.3)]" />
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                      {lang === 'ru' ? 'НАСТРОЙКИ ГРУППЫ' : 'GROUP SETTINGS'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowGroupSettings(false)}
                    className="p-1.5 hover:bg-red-500 hover:text-[#0d0714] text-gray-400 rounded-lg transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Body Content */}
                <div className="p-5 space-y-6 flex-1">
                  {/* Group Profile Card */}
                  <div className="bg-[#120a1c] border border-[#3e245a]/50 p-4 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest block">
                        {lang === 'ru' ? 'Профиль Группы' : 'Group Profile'}
                      </span>
                      {currentChat?.admins?.includes(user?.uid || '') ? (
                        <span className="text-[9px] font-black uppercase text-[#00f0ff] tracking-widest bg-[#00f0ff]/10 px-2 py-0.5 rounded-md border border-[#00f0ff]/30">
                          👑 {lang === 'ru' ? 'Вы - Админ' : 'You are Admin'}
                        </span>
                      ) : (
                        <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest bg-gray-500/10 px-2 py-0.5 rounded-md border border-gray-500/20">
                          👤 {lang === 'ru' ? 'Участник' : 'Member'}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col items-center gap-3">
                      <div className="relative group/avatar">
                        <img
                          src={editGroupAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${editGroupName || 'group'}`}
                          alt="Group avatar"
                          className="w-20 h-20 rounded-3xl object-cover border-2 border-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                        />
                        {currentChat?.admins?.includes(user?.uid || '') && (
                          <button
                            type="button"
                            onClick={() => {
                              const newSeed = Math.random().toString(36).substring(7);
                              setEditGroupAvatar(`https://api.dicebear.com/7.x/identicon/svg?seed=${newSeed}`);
                            }}
                            className="absolute -bottom-1.5 -right-1.5 p-2 bg-[#00f0ff] text-[#0d0714] rounded-xl hover:bg-white transition-all shadow-[0_0_10px_rgba(0,240,255,0.5)] active:scale-95"
                            title={lang === 'ru' ? 'Случайная аватарка' : 'Random Avatar'}
                          >
                            <Shuffle size={12} className="stroke-[3]" />
                          </button>
                        )}
                      </div>

                      {currentChat?.admins?.includes(user?.uid || '') ? (
                        <div className="w-full space-y-2">
                          <input
                            type="text"
                            value={editGroupName}
                            onChange={(e) => setEditGroupName(e.target.value)}
                            placeholder={lang === 'ru' ? 'Название группы...' : 'Group name...'}
                            className="w-full bg-[#0d0714] border border-[#311c47] rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              if (!editGroupName.trim()) return;
                              try {
                                await updateDoc(doc(db, 'chats', activeChatId), {
                                  name: editGroupName,
                                  avatar: editGroupAvatar
                                });
                                window.dispatchEvent(new CustomEvent('aha_toast', {
                                  detail: lang === 'ru' ? 'Профиль группы сохранен!' : 'Group profile saved!'
                                }));
                              } catch (e) {
                                console.error('Error updating group profile:', e);
                              }
                            }}
                            className="w-full py-2 bg-gradient-to-r from-[#00f0ff] to-cyan-500 text-[#0d0714] font-black uppercase tracking-widest text-xs rounded-xl shadow-[0_0_12px_rgba(0,240,255,0.3)] hover:brightness-110 active:scale-95 transition-all"
                          >
                            {lang === 'ru' ? 'Сохранить изменения' : 'Save Changes'}
                          </button>
                        </div>
                      ) : (
                        <div className="text-center space-y-1">
                          <h4 className="text-base font-black text-white">{currentChat?.name || editGroupName}</h4>
                          <p className="text-[10px] text-amber-400/90 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl">
                            {(t as any).groupOnlyAdminsEdit || 'Только администраторы могут изменять параметры группы'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add Participants Panel - Admin Only */}
                  {currentChat?.admins?.includes(user?.uid || '') && (
                    <div className="bg-[#120a1c] border border-[#3e245a]/50 p-4 rounded-3xl space-y-4">
                      <span className="text-[9px] font-black uppercase text-[#00f0ff] tracking-widest block">
                        {lang === 'ru' ? 'ДОБАВИТЬ УЧАСТНИКА' : 'ADD PARTICIPANT'}
                      </span>
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={groupSearchText}
                          onChange={(e) => setGroupSearchText(e.target.value)}
                          placeholder={lang === 'ru' ? 'Поиск контактов...' : 'Search contacts...'}
                          className="w-full bg-[#0d0714] border border-[#311c47] rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-[#00f0ff]"
                        />
                      </div>

                      <div className="max-h-[160px] overflow-y-auto space-y-2 custom-scrollbar">
                        {users
                          .filter(u => u.uid !== user?.uid && !currentChat?.participants?.includes(u.uid))
                          .filter(u => !groupSearchText || u.displayName?.toLowerCase().includes(groupSearchText.toLowerCase()))
                          .map(u => (
                            <div key={u.uid} className="flex items-center justify-between p-2 rounded-xl bg-[#0d0714]/60 border border-[#311c47]/40 hover:border-[#00f0ff]/30 transition-all">
                              <div className="flex items-center gap-2 min-w-0">
                                <CachedAvatar
                                  src={u.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${u.uid}`}
                                  alt={u.displayName || ''}
                                  customSizeClass="w-7 h-7"
                                  className="rounded-lg"
                                  fallbackText={u.displayName}
                                />
                                <span className="text-xs font-bold text-gray-200 truncate">{u.displayName}</span>
                              </div>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await updateDoc(doc(db, 'chats', activeChatId), {
                                      participants: arrayUnion(u.uid)
                                    });
                                    window.dispatchEvent(new CustomEvent('aha_toast', {
                                      detail: lang === 'ru' ? `${u.displayName} добавлен в группу!` : `${u.displayName} added to group!`
                                    }));
                                  } catch (e) {
                                    console.error('Error adding participant:', e);
                                  }
                                }}
                                className="px-2.5 py-1 bg-[#00f0ff]/10 hover:bg-[#00f0ff] text-[#00f0ff] hover:text-[#0d0714] text-[10px] font-black uppercase tracking-wider rounded-lg transition-all"
                              >
                                + {lang === 'ru' ? 'Добавить' : 'Add'}
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* List of current members */}
                  <div className="bg-[#120a1c] border border-[#3e245a]/50 p-4 rounded-3xl space-y-3">
                    <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest block mb-2">
                      {lang === 'ru' ? 'Список участников' : 'Current Participants'} ({currentChat?.participants?.length || 0})
                    </span>
                    <div className="space-y-2">
                      {currentChat?.participants?.map(uid => {
                        const memberUser = users.find(u => u.uid === uid);
                        const isAdmin = currentChat?.admins?.includes(uid);
                        const isMeAdmin = currentChat?.admins?.includes(user?.uid || '');
                        const isSelf = uid === user?.uid;

                        return (
                          <div key={uid} className="flex items-center justify-between p-2 rounded-xl bg-[#0d0714]/40 border border-[#311c47]/20">
                            <div className="flex items-center gap-2 min-w-0">
                              <CachedAvatar
                                src={memberUser?.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${uid}`}
                                alt={memberUser?.displayName || 'User'}
                                customSizeClass="w-7 h-7"
                                className="rounded-lg"
                                fallbackText={memberUser?.displayName}
                              />
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-gray-200 truncate block">
                                  {memberUser?.displayName || 'User'} {isSelf && `(${lang === 'ru' ? 'Вы' : 'You'})`}
                                </span>
                                {isAdmin && (
                                  <span className="text-[8px] font-black uppercase tracking-widest text-[#00f0ff]">
                                    👑 {lang === 'ru' ? 'Администратор' : 'Admin'}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Admin actions */}
                            {!isSelf && isMeAdmin && (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const nextAdmins = isAdmin 
                                        ? currentChat.admins.filter(id => id !== uid)
                                        : [...(currentChat.admins || []), uid];
                                      await updateDoc(doc(db, 'chats', activeChatId), {
                                        admins: nextAdmins
                                      });
                                    } catch (e) {
                                      console.error('Error toggling admin:', e);
                                    }
                                  }}
                                  className={`px-1.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg border transition-all ${
                                    isAdmin 
                                      ? 'bg-red-950/20 border-red-500/30 text-red-400'
                                      : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                                  }`}
                                  title={isAdmin ? 'Demote admin' : 'Make admin'}
                                >
                                  {isAdmin ? 'Demote' : 'Admin'}
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await updateDoc(doc(db, 'chats', activeChatId), {
                                        participants: arrayRemove(uid),
                                        admins: arrayRemove(uid)
                                      });
                                    } catch (e) {
                                      console.error('Error removing participant:', e);
                                    }
                                  }}
                                  className="p-1 hover:bg-red-500 hover:text-white border border-red-500/20 text-red-500 rounded-lg transition-all"
                                  title="Remove member"
                                >
                                  <Trash size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="p-5 border-t border-[#311c47] bg-[#08030c] flex flex-col gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!user) return;
                      const hasOtherParticipants = currentChat?.participants?.some(id => id !== user.uid);
                      const isSoleAdmin = currentChat?.admins?.includes(user.uid) && currentChat.admins.length === 1;
                      
                      try {
                        let updates: any = {
                          participants: arrayRemove(user.uid),
                          admins: arrayRemove(user.uid)
                        };
                        
                        // If sole admin leaves but others exist, assign a new admin randomly
                        if (isSoleAdmin && hasOtherParticipants) {
                          const otherParticipants = currentChat.participants.filter(id => id !== user.uid);
                          const nextAdmin = otherParticipants[0];
                          updates.admins = [nextAdmin];
                        }
                        
                        await updateDoc(doc(db, 'chats', activeChatId), updates);
                        setShowGroupSettings(false);
                        onClose();
                      } catch (e) {
                        console.error('Error leaving group:', e);
                      }
                    }}
                    className="w-full py-2.5 bg-red-950/30 hover:bg-red-600 border border-red-500/30 hover:border-red-600 text-red-400 hover:text-[#0d0714] font-black uppercase tracking-widest text-xs rounded-xl shadow-lg transition-all active:scale-95"
                  >
                    🚪 {lang === 'ru' ? 'Выйти из группы' : 'Leave Group'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Left Sidebar for Desktop: chats list */}
          <div className="hidden md:flex flex-col w-[320px] bg-[#09050d] border-r border-[#311c47] shrink-0">
            {/* Header */}
            <div className="p-4 bg-[#07040a] border-b border-[#311c47] flex items-center justify-between shrink-0 z-20">
              <span className="font-black text-xs text-[#ff4d4d] uppercase tracking-widest flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                {lang === 'ru' ? 'Мои Чаты' : 'My Chats'}
              </span>
              <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">
                {lang === 'ru' ? 'Онлайн' : 'Online'}
              </span>
            </div>
            
            {/* Chats List container */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <ChatsList 
                lang={lang} 
                onSelectChat={(id, name, photo) => {
                  if (onSelectChat) {
                    onSelectChat(id, name, photo);
                  }
                }}
                activeChatId={recipientId}
              />
            </div>
          </div>

          {/* Right main conversation area */}
          <div className="flex-1 flex flex-col h-full bg-[#0d0714] relative">
            {/* Header */}
            <div className="p-2.5 sm:p-3 bg-[#09050d] border-b border-[#311c47] flex items-center justify-between shrink-0 z-20 shadow-lg relative gap-2">
          <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#ff4d4d]/20 to-transparent" />
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative shrink-0">
              <CachedAvatar
                src={recipientPhoto}
                alt={recipientName}
                customSizeClass="w-8 h-8 sm:w-9 sm:h-9"
                className="rounded-full border border-[#ff4d4d]/30"
                fallbackText={recipientName}
              />
              {recipientId === 'bot_juky' && (
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-[#09050d] bg-[#00f0ff] rounded-full shadow-[0_0_6px_rgba(0,240,255,0.8)]" />
              )}
            </div>
            <div className="min-w-0">
              <span className="font-bold text-white text-xs sm:text-base uppercase tracking-wider block leading-tight truncate max-w-[100px] xs:max-w-[150px] sm:max-w-[240px]">{recipientName}</span>
              <div className="flex items-center gap-1 mt-0.5">
                {recipientId === 'bot_juky' ? (
                  <span className="text-[8px] sm:text-[9px] text-[#00f0ff] font-bold uppercase tracking-widest flex items-center gap-1">
                    🤖 {t.botJukyBadge || 'БОТ'}
                  </span>
                ) : recipientId.startsWith('group_') ? (
                  <span className="text-[8px] sm:text-[9px] text-purple-400 font-bold uppercase tracking-widest truncate">
                    👥 {lang === 'ru' ? 'ГРУППОВОЙ ЧАТ' : 'GROUP CHAT'}
                  </span>
                ) : (
                  <span className="text-[8px] sm:text-[9px] text-gray-400 font-medium tracking-wide truncate">
                    {lang === 'ru' ? 'Личный чат' : 'Private chat'}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0 overflow-x-auto no-scrollbar max-w-[55vw] sm:max-w-none">
            {recipientId.startsWith('group_') && (
              <button
                onClick={() => {
                  setEditGroupName(currentChat?.name || '');
                  setEditGroupAvatar(currentChat?.avatar || '');
                  setShowGroupSettings(!showGroupSettings);
                }}
                className={`p-1.5 sm:p-2 border rounded-xl transition-all active:scale-90 flex items-center justify-center shrink-0 ${
                  showGroupSettings
                    ? 'bg-[#00f0ff]/20 border-[#00f0ff] text-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                    : 'bg-[#150e24] border-[#3e245a] text-gray-300 hover:border-[#00f0ff]/50 hover:text-white'
                }`}
                title={lang === 'ru' ? 'Настройки группы' : 'Group settings'}
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => {
                setShowSearch(!showSearch);
                if (showSearch) {
                  setSearchHistoryQuery('');
                }
              }}
              className={`p-1.5 sm:p-2 border rounded-xl transition-all active:scale-90 flex items-center justify-center shrink-0 ${
                showSearch
                  ? 'bg-[#ff4d4d]/20 border-[#ff4d4d] text-[#ff4d4d] shadow-[0_0_10px_rgba(255,77,77,0.3)]'
                  : 'bg-[#150e24] border-[#3e245a] text-gray-300 hover:border-[#ff4d4d]/50 hover:text-white'
              }`}
              title={lang === 'ru' ? 'Поиск по истории' : 'Search history'}
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowThemeSelector(!showThemeSelector)}
              className={`p-1.5 sm:p-2 border rounded-xl transition-all active:scale-90 flex items-center justify-center shrink-0 ${
                showThemeSelector
                  ? 'bg-fuchsia-950/20 border-fuchsia-500/50 text-fuchsia-400 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                  : 'bg-[#150e24] border-[#3e245a] text-gray-300 hover:border-fuchsia-500/50 hover:text-white'
              }`}
              title={lang === 'ru' ? 'Кастомизация темы' : 'Theme customization'}
            >
              <Paintbrush className="w-4 h-4" />
            </button>

            {!recipientId.startsWith('group_') && recipientId !== 'bot_juky' && (
              <button
                onClick={async () => {
                  if (confirm(t.blockUserBtn ? `${t.blockUserBtn} ${recipientName}?` : `Заблокировать ${recipientName}?`)) {
                    await blockUser(recipientId);
                    window.dispatchEvent(new CustomEvent('aha_toast', { detail: `${recipientName} ${t.userBlockedNotice || 'заблокирован'}` }));
                  }
                }}
                className="p-1.5 sm:p-2 bg-[#150e24] hover:bg-amber-500/20 border border-[#3e245a] hover:border-amber-500/50 text-amber-400 rounded-xl transition-all active:scale-95 flex items-center justify-center shrink-0"
                title={t.blockUserBtn || "Заблокировать"}
              >
                <Ban className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={async () => {
                if (confirm(t.deleteChatConfirm || "Вы уверены, что хотите удалить этот чат?")) {
                  await deleteChat(recipientId);
                  window.dispatchEvent(new CustomEvent('aha_toast', { detail: lang === 'ru' ? 'Чат удален' : 'Chat deleted' }));
                  onClose();
                }
              }}
              className="p-1.5 sm:p-2 bg-[#150e24] hover:bg-red-500/20 border border-[#3e245a] hover:border-red-500/50 text-red-400 rounded-xl transition-all active:scale-95 flex items-center justify-center shrink-0"
              title={t.deleteChatBtn || "Удалить чат"}
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-1.5 sm:p-2 border rounded-xl transition-all active:scale-90 flex items-center justify-center shrink-0 ${
                isMuted 
                  ? 'bg-red-950/20 border-red-500/30 text-red-400 hover:bg-red-950/40 hover:border-red-500/60 shadow-[0_0_8px_rgba(239,68,68,0.2)]' 
                  : 'bg-[#150e24] border-[#3e245a] text-gray-300 hover:border-[#ff4d4d]/50 hover:text-white'
              }`}
              title={isMuted ? "Unmute sounds" : "Mute sounds"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 bg-[#150e24] hover:bg-[#ff4d4d] border border-[#3e245a] hover:border-[#ff4d4d] text-gray-300 hover:text-[#0d0714] rounded-xl transition-all active:scale-95 flex items-center justify-center shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Inside History Bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-[#11071a] border-b border-[#311c47] p-3 flex flex-col sm:flex-row items-center gap-3 shrink-0 z-10 w-full"
            >
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchHistoryQuery}
                  onChange={(e) => setSearchHistoryQuery(e.target.value)}
                  placeholder={lang === 'ru' ? 'Поиск слов в этом диалоге...' : 'Search words in this conversation...'}
                  className="w-full bg-[#0d0714] border border-[#3d2b4f]/60 rounded-xl py-2 pl-9 pr-24 text-xs text-white focus:outline-none focus:border-[#ff4d4d]"
                />
                {searchHistoryQuery && (
                  <button
                    onClick={() => setSearchHistoryQuery('')}
                    className="absolute right-3 top-2 text-xs font-bold text-gray-400 hover:text-white"
                  >
                    {lang === 'ru' ? 'Сброс' : 'Clear'}
                  </button>
                )}
              </div>
              
              {matchedMessageIds.length > 0 && (
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between shrink-0">
                  <span className="text-[10px] font-mono text-gray-400">
                    {currentMatchIndex + 1} / {matchedMessageIds.length}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentMatchIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentMatchIndex <= 0}
                      className="p-1.5 bg-[#1a0f28] hover:bg-[#311c47] rounded-lg text-white disabled:opacity-40"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => setCurrentMatchIndex(prev => Math.min(matchedMessageIds.length - 1, prev + 1))}
                      disabled={currentMatchIndex >= matchedMessageIds.length - 1}
                      className="p-1.5 bg-[#1a0f28] hover:bg-[#311c47] rounded-lg text-white disabled:opacity-40"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Theme Customization Bar */}
        <AnimatePresence>
          {showThemeSelector && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-[#11071a] border-b border-[#311c47] p-3 space-y-3 shrink-0 z-10 w-full"
            >
              <div>
                <span className="text-[10px] font-black uppercase text-fuchsia-400 tracking-widest block mb-2">
                  {lang === 'ru' ? 'ВЫБЕРИТЕ ОБОИ ЧАТА' : 'SELECT CHAT WALLPAPER'}
                </span>
                <div className="grid grid-cols-5 gap-2">
                  {['default', 'cyberpunk', 'matrix', 'nebula', 'sunset'].map(wp => (
                    <button
                      key={wp}
                      onClick={() => updateChatTheme(wp, getGlowColor())}
                      className={`py-1.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                        (currentChat?.theme?.wallpaper || 'default') === wp
                          ? 'bg-fuchsia-950/40 border-fuchsia-500 text-fuchsia-300'
                          : 'bg-[#0d0714] border-[#311c47] text-gray-400 hover:border-fuchsia-500/40'
                      }`}
                    >
                      {wp}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase text-fuchsia-400 tracking-widest block mb-2">
                  {lang === 'ru' ? 'ЦВЕТ НЕОНОВОГО СВЕЧЕНИЯ' : 'NEON GLOW COLOR'}
                </span>
                <div className="flex items-center gap-3">
                  {[
                    { hex: '#ff4d4d', name: lang === 'ru' ? 'Красный' : 'Red' },
                    { hex: '#00f0ff', name: lang === 'ru' ? 'Голубой' : 'Cyan' },
                    { hex: '#39ff14', name: lang === 'ru' ? 'Зеленый' : 'Green' },
                    { hex: '#ff007f', name: lang === 'ru' ? 'Розовый' : 'Pink' }
                  ].map(color => (
                    <button
                      key={color.hex}
                      onClick={() => updateChatTheme(currentChat?.theme?.wallpaper || 'default', color.hex)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#0d0714] border hover:bg-[#11071a] transition-all"
                      style={{ borderColor: getGlowColor() === color.hex ? color.hex : '#311c47' }}
                    >
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color.hex, boxShadow: `0 0 6px ${color.hex}` }} />
                      <span className="text-[9px] font-bold text-gray-300 uppercase tracking-wider">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pinned Message Bar */}
        {currentChat?.pinnedMessage && (
          <div className="bg-[#120a1c] border-b border-[#311c47] p-2 px-3.5 flex items-center justify-between shrink-0 z-10 relative">
            <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#ff4d4d]/10 to-transparent" />
            <div 
              onClick={() => handleScrollToPinned(currentChat.pinnedMessage!.id)}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
            >
              <Pin className="w-4 h-4 text-[#ff4d4d] shrink-0" />
              <div className="min-w-0">
                <span className="text-[8px] font-black uppercase text-[#ff4d4d] tracking-widest block leading-none mb-1">
                  {lang === 'ru' ? 'ЗАКРЕПЛЕННОЕ СООБЩЕНИЕ' : 'PINNED MESSAGE'}
                </span>
                <span className="text-xs text-gray-300 line-clamp-1 truncate max-w-[280px] sm:max-w-[340px]">
                  {currentChat.pinnedMessage.type === 'voice' 
                    ? '🎤 ' + (lang === 'ru' ? 'Голосовое сообщение' : 'Voice message')
                    : currentChat.pinnedMessage.type === 'sticker' 
                      ? 'Sticker' 
                      : currentChat.pinnedMessage.text}
                </span>
              </div>
            </div>
            <button
              onClick={() => unpinMessage(recipientId)}
              className="p-1 hover:bg-[#ff4d4d]/10 rounded-lg text-gray-400 hover:text-[#ff4d4d] transition-colors"
              title={lang === 'ru' ? 'Открепить' : 'Unpin'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {!user ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0f0a17] space-y-6">
            <User className="mx-auto text-[#ff4d4d]/60" size={44} />
            <div className="space-y-2">
              <h3 className="text-xl font-black text-white uppercase tracking-wider">
                {lang === 'ru' ? 'Авторизация' : 'Authorization'}
              </h3>
              <p className="text-white/60 font-black uppercase tracking-widest text-[10px] max-w-xs mx-auto leading-relaxed">
                {t.chatAuthRequired || (lang === 'ru' ? 'Войдите, чтобы общаться' : 'Sign in to chat')}
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <GoogleLoginButton lang={lang} className="w-full" />
              <button
                onClick={() => window.dispatchEvent(new Event('openEmailLogin'))}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#3d2b4f]/40 border border-[#3d2b4f] text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#ff4d4d] hover:text-[#15101e] hover:border-[#ff4d4d] transition-all active:scale-95 shadow-xl"
              >
                <Mail size={14} />
                {lang === 'ru' ? 'Зарегистрироваться через почту' : 'Register via email'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div 
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className={`flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 custom-scrollbar relative ${getWallpaperClasses()}`}
            >
              {activeMessageId && (
                <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]" onClick={() => setActiveMessageId(null)} />
              )}
              {messages.length === 0 ? (
                recipientId === 'bot_juky' || recipientId.startsWith('juky_') ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-5 max-w-md mx-auto my-auto">
                    <div className="w-16 h-16 bg-[#00f0ff]/10 rounded-3xl flex items-center justify-center border border-[#00f0ff]/30 shadow-[0_0_25px_rgba(0,240,255,0.25)]">
                      <Bot className="w-8 h-8 text-[#00f0ff]" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-base font-black text-white uppercase tracking-wider">
                        {(t as any).botJukyTitle || 'Juky AI (Жуки 🤖)'}
                      </h3>
                      <p className="text-xs text-gray-300 leading-relaxed font-medium">
                        {(t as any).botJukyWelcome || 'Привет! Я Жуки (Juky AI) — твой умный помощник на Aha Station 🤖✨ Спрашивай что угодно!'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 w-full pt-2">
                      {[
                        (t as any).botJukyQuickPrompt1 || '💡 Секреты Aha Station',
                        (t as any).botJukyQuickPrompt2 || '🔮 Безумная теория',
                        (t as any).botJukyQuickPrompt3 || '❓ Как работают права?'
                      ].map((prompt, pIdx) => (
                        <button
                          key={pIdx}
                          onClick={() => {
                            setInputText(prompt);
                          }}
                          className="w-full text-left px-4 py-2.5 bg-[#170e24] hover:bg-[#00f0ff]/15 border border-[#3e245a] hover:border-[#00f0ff] rounded-2xl text-xs text-gray-200 font-bold transition-all active:scale-98 flex items-center justify-between group"
                        >
                          <span>{prompt}</span>
                          <Send size={12} className="text-[#00f0ff] group-hover:translate-x-1 transition-transform" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-40">
                    <div className="w-16 h-16 bg-[#ff4d4d]/5 rounded-3xl flex items-center justify-center border border-[#ff4d4d]/10">
                      <Send className="w-6 h-6 text-[#ff4d4d]" />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                      {t.chatStartConversation}
                    </p>
                  </div>
                )
              ) : (
                (() => {
                  let lastDate: Date | null = null;
                  return messages.map((msg, idx) => {
                    const isMe = msg.senderId === user?.uid;
                    const repliedMsg = msg.replyTo ? messages.find(m => m.id === msg.replyTo) : null;
                    const msgDate = getSafeDate(msg.createdAt);
                    const showDateSeparator = !lastDate || !isSameDay(lastDate, msgDate);
                    lastDate = msgDate;
                    
                    let isRead = false;
                    if (currentChat?.lastReadAt?.[recipientId] && msg.createdAt) {
                      const readAt = getMillis(currentChat.lastReadAt[recipientId]);
                      const msgAt = getMillis(msg.createdAt);
                      if (readAt && msgAt) {
                        isRead = msgAt <= readAt;
                      }
                    }
                    
                    return (
                      <React.Fragment key={msg.id || idx}>
                        {showDateSeparator && (
                          <div className="flex justify-center my-6">
                            <span className="bg-[#150e1f] text-gray-400 text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-xl border border-[#301c47] shadow-md">
                              {formatDateSeparator(msgDate)}
                            </span>
                          </div>
                        )}
                        <motion.div
                          id={`msg-${msg.id}`}
                          initial={{ opacity: 0, y: 12, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ 
                            duration: 0.22, 
                            ease: [0.215, 0.610, 0.355, 1.000] // smooth cubic-bezier easeOut
                          }}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} relative group ${msg.reactions && Object.keys(msg.reactions).some(k => msg.reactions![k].length > 0) ? 'mb-6' : ''}`}
                        >
                          {/* Sender Display Name for Group Chats */}
                          {!isMe && recipientId.startsWith('group_') && !msg.isDeleted && (
                            <span className="text-[10px] font-black uppercase text-[#00f0ff] tracking-widest mb-1.5 ml-2.5">
                              {users.find(u => u.uid === msg.senderId)?.displayName || 'User'}
                            </span>
                          )}

                          {/* Global Portal-based message overlay menu renders at bottom of body instead of absolute inside list */}

                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!msg.isDeleted) {
                                  setActiveMessageId(activeMessageId === msg.id ? null : msg.id);
                                  setMenuPosition({ x: e.clientX, y: e.clientY });
                              }
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!msg.isDeleted) {
                                setActiveMessageId(msg.id);
                                setMenuPosition({ x: e.clientX, y: e.clientY });
                              }
                            }}
                            className={`max-w-[85%] p-3.5 sm:p-4 rounded-3xl text-sm sm:text-base shadow-lg relative cursor-pointer transition-all duration-200 active:scale-[0.98] ${
                              (msg.type === 'sticker' || msg.type === 'voice') && !msg.isDeleted
                                ? 'bg-transparent shadow-none p-0' 
                                : msg.type === 'file' && !msg.isDeleted
                                  ? 'bg-[#12071f] border border-[#00f0ff]/40 text-white rounded-2xl shadow-[0_4px_20px_rgba(0,240,255,0.15)] p-3'
                                  : isMe
                                    ? 'bg-gradient-to-br from-[#ff3d5a] to-[#cc1b36] text-white rounded-tr-sm font-medium border border-[#ff4d4d]/20'
                                    : 'bg-[#181125]/95 text-gray-100 rounded-tl-sm border border-[#3e245a]/40 hover:border-[#ff4d4d]/30 shadow-[0_4px_20px_rgba(0,0,0,0.15)]'
                            } ${msg.isDeleted ? 'opacity-40 italic' : ''}`}
                          >
                            {repliedMsg && msg.type !== 'sticker' && !msg.isDeleted && (
                              <div className={`mb-2.5 p-2 rounded-xl text-xs border-l-2 ${isMe ? 'bg-[#0d0714]/15 border-[#0d0714]/40' : 'bg-[#0d0714]/40 border-[#ff4d4d]/50'}`}>
                                <span className="font-bold opacity-70 block mb-0.5">
                                  {repliedMsg.senderId === user?.uid ? (t.chatYou || "You") : (recipientId.startsWith('group_') ? (users.find(u => u.uid === repliedMsg.senderId)?.displayName || 'User') : recipientName)}
                                </span>
                                <span className="opacity-80 line-clamp-1">
                                  {repliedMsg.isDeleted ? (t.chatMessageDeleted || "Deleted") : (repliedMsg.type === 'sticker' ? 'Sticker' : repliedMsg.type === 'voice' ? '🎤 ' + (lang === 'ru' ? 'Голосовое' : 'Voice') : repliedMsg.type === 'file' ? '📁 ' + (lang === 'ru' ? 'Файл' : 'File') : repliedMsg.text)}
                                </span>
                              </div>
                            )}
                            
                            {msg.isDeleted ? (
                              <div className="flex items-center gap-2">
                                <Ban className="w-4 h-4 opacity-50" />
                                <span>{msg.text}</span>
                              </div>
                            ) : msg.type === 'sticker' ? (
                              <div className="text-6xl filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)] transform hover:scale-110 transition-transform">{msg.text}</div>
                            ) : msg.type === 'voice' ? (
                              <VoiceMessagePlayer src={msg.text} lang={lang} initialDuration={msg.voiceDuration} />
                            ) : msg.type === 'file' ? (
                              <div className="flex items-center gap-3 relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
                                <div className="p-2.5 bg-[#00f0ff]/15 rounded-xl shrink-0 text-[#00f0ff] border border-[#00f0ff]/30">
                                  <Paperclip size={18} />
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                  <p className="text-xs font-black text-white truncate uppercase tracking-wider">{msg.fileAttachment?.name || msg.text || 'Document'}</p>
                                  <span className="text-[9px] text-[#00f0ff]/80 font-mono font-bold">
                                    {msg.fileAttachment?.size ? `${(msg.fileAttachment.size / 1024).toFixed(1)} KB` : 'Document'}
                                  </span>
                                </div>
                                <a
                                  href={msg.fileAttachment?.url || msg.text}
                                  download={msg.fileAttachment?.name || 'file'}
                                  className="p-2 bg-[#00f0ff] text-[#0d0714] rounded-xl hover:bg-white transition-all shadow-[0_0_10px_rgba(0,240,255,0.5)] shrink-0"
                                  title="Download"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Download size={14} className="stroke-[3]" />
                                </a>
                              </div>
                            ) : msg.type === 'image' ? (
                              <div className="flex flex-col gap-2">
                                {msg.images && msg.images.length > 0 ? (
                                  <div className={`grid ${msg.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2 rounded-2xl overflow-hidden`}>
                                    {msg.images.map((img, i) => (
                                      <img key={i} src={img} alt="Sent image" className="max-w-full rounded-xl cursor-pointer hover:opacity-90 transition-opacity" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFullscreenImage(img); }} />
                                    ))}
                                  </div>
                                ) : (
                                  <img src={msg.text} alt="Sent image" className="max-w-[200px] sm:max-w-[250px] rounded-2xl cursor-pointer hover:opacity-90 transition-opacity shadow-md" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFullscreenImage(msg.text); }} />
                                )}
                                {msg.text && msg.images && msg.images.length > 0 && (
                                  <p className="break-words leading-relaxed mt-1">{msg.text}</p>
                                )}
                              </div>
                            ) : (
                              <div className="break-words leading-relaxed">
                                {msg.text.match(/https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|gif|webp)/i) ? (
                                  <>
                                    <span>{msg.text.replace(/https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|gif|webp)/gi, '').trim()}</span>
                                    <div className="mt-2 flex flex-col gap-2">
                                      {msg.text.match(/https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|gif|webp)/gi)?.map((url, i) => (
                                        <img key={i} src={url} alt="Sent image" className="max-w-[200px] sm:max-w-[250px] rounded-2xl cursor-pointer hover:opacity-90 transition-opacity" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFullscreenImage(url); }} />
                                      ))}
                                    </div>
                                  </>
                                ) : (
                                  <p>{msg.text}</p>
                                )}
                              </div>
                            )}
                            
                            <div className={`text-[9px] mt-1.5 font-black tracking-wider opacity-80 flex items-center gap-1 ${isMe ? 'justify-end' : 'justify-start'} ${
                              msg.type === 'file' ? 'text-[#00f0ff]/90' : msg.type === 'sticker' && !msg.isDeleted ? 'text-gray-400' : ''
                            }`}>
                              {msg.isEdited && !msg.isDeleted && <span>({t.edited || "edited"})</span>}
                              {format(getSafeDate(msg.createdAt), 'HH:mm')}
                              {isMe && !msg.isDeleted && (
                                isRead ? <CheckCheck className={`w-3.5 h-3.5 ml-0.5 ${msg.type === 'file' ? 'text-[#00f0ff]' : msg.type === 'sticker' ? 'text-blue-400' : msg.type === 'voice' ? 'text-[#ff4d4d]' : 'text-white'}`} /> : <Check className={`w-3.5 h-3.5 ml-0.5 ${msg.type === 'file' ? 'text-[#00f0ff]/70' : msg.type === 'sticker' ? 'text-gray-400' : 'opacity-70'}`} />
                              )}
                            </div>

                            {msg.reactions && Object.keys(msg.reactions).length > 0 && !msg.isDeleted && (
                              <div className={`absolute -bottom-3.5 ${isMe ? 'right-2' : 'left-2'} flex items-center gap-1 bg-[#09050d] border border-[#2e1d44] rounded-full px-1.5 py-0.5 shadow-[0_2px_8px_rgba(0,0,0,0.5)] z-10 flex-wrap max-w-full`}>
                                {Object.entries(msg.reactions).map(([reactionId, users]) => users.length > 0 && (
                                  <button
                                    key={reactionId}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleReaction(msg.id, recipientId, reactionId);
                                    }}
                                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full transition-all ${
                                      users.includes(user?.uid || '') 
                                        ? 'bg-[#ff4d4d]/15 text-[#ff4d4d]' 
                                        : 'text-gray-300 hover:text-white'
                                    }`}
                                  >
                                    {NEON_REACTION_CONFIG[reactionId] ? (
                                      renderNeonReactionIcon(reactionId, 11)
                                    ) : (
                                      <span className="text-xs leading-none">{reactionId}</span>
                                    )}
                                    <span className={`text-[9px] font-black font-mono leading-none ${users.includes(user?.uid || '') ? 'text-[#ff4d4d]' : 'text-gray-400'}`}>{users.length}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </React.Fragment>
                    );
                  });
                })()
              )}
              {/* Typing Indicator as a message bubble */}
              <AnimatePresence>
                {isRecipientTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex justify-start mb-2"
                  >
                    <div className="bg-[#150e21] border border-[#2e1d44]/70 rounded-3xl rounded-bl-sm px-4 py-3 flex items-center gap-3 shadow-md">
                      <div className="w-6 h-6 rounded-xl overflow-hidden shrink-0 border border-[#ff4d4d]/30">
                        {recipientPhoto ? (
                          <img src={recipientPhoto} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full bg-[#ff4d4d]/10 flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-[#ff4d4d]" />
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1.5 items-center px-1">
                        <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 bg-[#ff4d4d] rounded-full" />
                        <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 bg-[#ff4d4d] rounded-full" />
                        <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 bg-[#ff4d4d] rounded-full" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Group Typing Indicator as a message bubble */}
              <AnimatePresence>
                {recipientId.startsWith('group_') && groupTypingNames.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex justify-start mb-2"
                  >
                    <div className="bg-[#150e21] border border-[#2e1d44]/70 rounded-3xl rounded-bl-sm px-4 py-3 flex items-center gap-3 shadow-md">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider">
                          {groupTypingNames.join(', ')} {groupTypingNames.length === 1 ? (lang === 'ru' ? 'печатает' : 'is typing') : (lang === 'ru' ? 'печатают' : 'are typing')}...
                        </span>
                        <div className="flex gap-1.5 items-center px-1 py-1">
                          <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 bg-[#00f0ff] rounded-full" />
                          <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 bg-[#00f0ff] rounded-full" />
                          <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 bg-[#00f0ff] rounded-full" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div ref={messagesEndRef} />
            </div>

            {/* Scroll to Bottom Button */}
            <AnimatePresence>
              {showScrollButton && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  onClick={scrollToBottom}
                  className="absolute bottom-24 right-6 w-10 h-10 bg-[#1c0f2a] border border-[#3e245a] hover:border-[#ff4d4d]/40 rounded-full flex items-center justify-center text-[#ff4d4d] shadow-xl hover:bg-[#2e1d44] transition-all z-20"
                >
                  <ChevronDown className="w-5 h-5 animate-bounce" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="bg-[#09050d] border-t border-[#311c47] shrink-0 relative">
              {/* Reply Banner */}
              <AnimatePresence>
                {replyingTo && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 py-2.5 bg-[#150e21]/90 border-b border-[#311c47] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Reply className="w-4 h-4 text-[#ff4d4d] shrink-0" />
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-xs font-black text-[#ff4d4d] uppercase tracking-wider">
                          {replyingTo.senderId === user?.uid ? (t.you || 'You') : recipientName}
                        </span>
                        <span className="text-xs text-gray-400 truncate">
                          {replyingTo.type === 'sticker' ? 'Sticker' : replyingTo.text}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-[#25133d] rounded-lg text-gray-400 hover:text-white transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sticker Picker */}
              <AnimatePresence>
                {showStickers && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-full left-0 w-full p-4 bg-[#0d0714] border-t border-[#311c47] shadow-2xl z-20"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.stickers || "Stickers"}</span>
                      <button onClick={() => setShowStickers(false)} className="text-gray-400 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {STICKERS.map(sticker => (
                        <button
                          key={sticker}
                          onClick={() => handleSendSticker(sticker)}
                          className="text-3xl p-2.5 hover:bg-[#1a0d26] border border-transparent hover:border-[#3e245a] rounded-2xl transition-all hover:scale-110 flex items-center justify-center"
                        >
                          {sticker}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Edit Banner */}
              <AnimatePresence>
                {editingMessage && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 py-2.5 bg-[#150e21]/90 border-b border-[#311c47] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Pencil className="w-4 h-4 text-[#ff4d4d] shrink-0" />
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-xs font-black text-[#ff4d4d] uppercase tracking-wider">{t.editingMessage || "Editing message"}</span>
                        <span className="text-xs text-gray-400 truncate">{editingMessage.text}</span>
                      </div>
                    </div>
                    <button onClick={() => { setEditingMessage(null); setInputText(''); }} className="p-1 hover:bg-[#25133d] rounded-lg text-gray-400 hover:text-white transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {selectedImages.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="px-4 pt-3 flex gap-2 overflow-x-auto bg-[#0a050f]"
                  >
                    {selectedImages.map((img, idx) => (
                      <div key={idx} className="relative shrink-0">
                        <img src={img} alt="Preview" className="w-16 h-16 object-cover rounded-2xl border border-[#3e245a]" />
                        <button
                          type="button"
                          onClick={() => removeSelectedImage(idx)}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Pre-send File Attachment Preview */}
              <AnimatePresence>
                {selectedFile && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="px-4 py-3 bg-[#0a050f] flex items-center justify-between border-t border-[#311c47]/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#00f0ff]/10 text-[#00f0ff] rounded-xl border border-[#00f0ff]/20">
                        <Paperclip className="w-4 h-4 shrink-0" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-white truncate uppercase tracking-wider max-w-[200px] sm:max-w-xs">{selectedFile.name}</p>
                        <span className="text-[9px] text-gray-500 font-mono">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="p-1.5 bg-red-500/10 hover:bg-red-500 hover:text-[#0d0714] text-red-400 rounded-lg transition-all"
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {isRecording ? (
                <div className="p-3 bg-[#09050d] z-20">
                  <div className="flex items-center justify-between bg-[#150a1c] rounded-full p-2 border border-[#ff4d4d]/30 shadow-[0_0_15px_rgba(255,77,77,0.1)]">
                    <button
                      type="button"
                      onClick={cancelRecording}
                      className="p-2.5 rounded-full bg-red-950/40 text-red-400 hover:bg-red-500 hover:text-[#0d0714] border border-red-500/20 transition-all active:scale-90 flex items-center justify-center animate-pulse"
                      title={lang === 'ru' ? 'Удалить запись' : 'Cancel recording'}
                    >
                      <Trash size={16} />
                    </button>
 
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ scale: [1, 1.25, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_8px_#ef4444]"
                      />
                      <span className="text-xs font-black uppercase tracking-widest text-[#ff4d4d]">
                        {lang === 'ru' ? 'ЗАПИСЬ' : 'RECORDING'}
                      </span>
                      <span className="text-sm font-mono font-bold text-white bg-[#09050d] px-2.5 py-1 rounded-lg border border-[#311c47]">
                        {formatRecordingTime(recordingSeconds)}
                      </span>
                    </div>
 
                    <button
                      type="button"
                      onClick={stopAndSendRecording}
                      className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-emerald-500 hover:bg-white text-[#0d0714] rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_0_12px_rgba(16,185,129,0.4)] animate-bounce"
                      title={lang === 'ru' ? 'Отправить' : 'Send recording'}
                    >
                      <Send className="w-4 h-4 ml-0.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSend} className="p-3 bg-[#09050d] z-20">
                  <div className="flex items-center gap-1.5 bg-[#0d0714] rounded-full p-1 border border-[#311c47] focus-within:border-[#ff4d4d]/50 focus-within:shadow-[0_0_15px_rgba(255,77,77,0.05)] transition-all">
                    <button
                      type="button"
                      onClick={() => setShowStickers(!showStickers)}
                      className={`shrink-0 p-2.5 rounded-full transition-all ${showStickers ? 'bg-[#ff4d4d] text-[#0d0714] shadow-md' : 'text-gray-400 hover:text-[#ff4d4d] hover:bg-[#1a0f26]'}`}
                    >
                      <Sticker className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                    </button>
                    <label className="shrink-0 p-2.5 rounded-full transition-all text-gray-400 hover:text-[#ff4d4d] hover:bg-[#1a0f26] cursor-pointer flex items-center justify-center" title={lang === 'ru' ? 'Прикрепить картинку' : 'Attach image'}>
                      <ImageIcon className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={isSending} />
                    </label>
                    <label className="shrink-0 p-2.5 rounded-full transition-all text-gray-400 hover:text-[#00f0ff] hover:bg-[#1a0f26] cursor-pointer flex items-center justify-center" title={lang === 'ru' ? 'Прикрепить документ' : 'Attach file'}>
                      <Paperclip className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                      <input type="file" className="hidden" onChange={handleFileUpload} disabled={isSending} />
                    </label>
                    <input
                      type="text"
                      value={inputText}
                      onChange={handleTyping}
                      onKeyDown={handleKeyDown}
                      disabled={isSending}
                      placeholder={t.chatPlaceholder}
                      className="flex-1 min-w-0 bg-transparent px-3 py-2 text-sm sm:text-base text-white outline-none disabled:opacity-50 placeholder:text-gray-600"
                    />
                    
                    {inputText.trim() || selectedImages.length > 0 ? (
                      <button
                        type="submit"
                        disabled={isSending}
                        className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-[#ff4d4d] hover:bg-white text-[#0d0714] hover:scale-105 rounded-full transition-all active:scale-95 shrink-0 mr-1 shadow-lg shadow-[#ff4d4d]/10"
                      >
                        <Send className="w-4 h-4 ml-0.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={startRecording}
                        className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-[#1b1129] hover:bg-[#ff4d4d] border border-[#3e245a] hover:border-[#ff4d4d] text-gray-400 hover:text-[#0d0714] hover:scale-105 rounded-full transition-all active:scale-95 shrink-0 mr-1 shadow-md shadow-[#ff4d4d]/5"
                        title={lang === 'ru' ? 'Голосовое сообщение' : 'Voice Message'}
                      >
                        <Mic className="w-4.5 h-4.5" />
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          </>
        )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
    
    {/* Fullscreen Image Modal */}
    {createPortal(
      <AnimatePresence>
        {fullscreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md"
            onClick={() => setFullscreenImage(null)}
          >
            <button className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 text-white rounded-full border border-white/10 transition-colors">
              <X size={20} />
            </button>
            <motion.img
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              src={fullscreenImage}
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/5"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )}

    {/* Global Premium Message Actions Overlay Portal */}
    {(() => {
      const activeMsg = messages.find(m => m.id === activeMessageId);
      if (!activeMsg) return null;
      const isMe = activeMsg.senderId === user?.uid;
      
      // Calculate dynamic positioning with safety boundary checks
      let x = menuPosition?.x ?? (typeof window !== 'undefined' ? window.innerWidth / 2 : 200);
      let y = menuPosition?.y ?? (typeof window !== 'undefined' ? window.innerHeight / 2 : 200);
      
      const menuWidth = 230;
      const menuHeight = showMoreReactions === activeMsg.id ? 285 : 240;
      
      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
      const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
      
      // Offset slightly from pointer for better focus and finger/cursor clearance
      x = x + 10;
      y = y - 10;

      // Auto-reposition relative to viewport to prevent clipping
      if (x + menuWidth > screenWidth) {
        x = screenWidth - menuWidth - 16;
      }
      if (x < 16) {
        x = 16;
      }
      if (y + menuHeight > screenHeight) {
        y = screenHeight - menuHeight - 16;
      }
      if (y < 16) {
        y = 16;
      }

      return createPortal(
        <AnimatePresence>
          {activeMessageId && (
            <div className="fixed inset-0 z-[99999] pointer-events-none">
              {/* Premium dark backdrop that dims the workspace elegantly */}
              <div 
                className="fixed inset-0 bg-[#0a0512]/60 backdrop-blur-[2px] pointer-events-auto transition-opacity"
                onClick={() => {
                  setActiveMessageId(null);
                  setMenuPosition(null);
                  setShowMoreReactions(null);
                }}
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 4 }}
                transition={{ duration: 0.1, ease: "easeOut" }}
                style={{ 
                  position: 'fixed',
                  left: `${x}px`,
                  top: `${y}px`,
                  width: `${menuWidth}px`
                }}
                className="bg-[#0e071c]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.7)] text-left overflow-hidden pointer-events-auto z-10 flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Selected Message Tiny Header */}
                <div className="px-3.5 py-2 border-b border-white/5 bg-black/10 flex flex-col gap-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-wider font-semibold text-gray-400">
                      {isMe ? (lang === 'ru' ? 'Ваше сообщение' : 'Your Message') : (lang === 'ru' ? 'Сообщение' : 'Message')}
                    </span>
                    <span className="text-[8px] text-gray-500 font-mono">
                      {activeMsg.createdAt ? format(new Date(getMillis(activeMsg.createdAt)), 'HH:mm') : ''}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-300 line-clamp-1 italic truncate">
                    {activeMsg.type === 'sticker' ? `Sticker: ${activeMsg.text}` : activeMsg.text}
                  </p>
                </div>

                {/* Quick reactions row */}
                <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between gap-1">
                  {['thumbsup', 'heart', 'flame', 'zap', 'star', 'smile'].map(reactionId => {
                    const isSelected = activeMsg.reactions?.[reactionId]?.includes(user?.uid || '');
                    return (
                      <button
                        key={reactionId}
                        onClick={() => {
                          toggleReaction(activeMsg.id, recipientId, reactionId);
                          playSound('react');
                          setActiveMessageId(null);
                          setMenuPosition(null);
                        }}
                        className={`w-7 h-7 flex items-center justify-center rounded-full transition-all duration-150 hover:scale-125 hover:bg-white/5 ${
                          isSelected 
                            ? 'bg-[#ff4d4d]/15 border border-[#ff4d4d]/30 shadow-[0_0_8px_rgba(255,77,77,0.2)]' 
                            : 'border border-transparent text-gray-400 hover:text-white'
                        }`}
                        title={reactionId}
                      >
                        {renderNeonReactionIcon(reactionId, 14)}
                      </button>
                    );
                  })}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMoreReactions(showMoreReactions === activeMsg.id ? null : activeMsg.id);
                    }}
                    className={`w-7 h-7 flex items-center justify-center rounded-full transition-all duration-150 hover:scale-125 ${
                      showMoreReactions === activeMsg.id 
                        ? 'text-[#ff4d4d] bg-[#ff4d4d]/10' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                    title="More reactions"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Expanded Reactions Grid */}
                <AnimatePresence>
                  {showMoreReactions === activeMsg.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="grid grid-cols-6 gap-1 p-2 bg-[#080410]/95 border-b border-white/5"
                    >
                      {['crown', 'award', 'ghost', 'skull', 'sparkles', 'shield'].map(reactionId => {
                        const isSelected = activeMsg.reactions?.[reactionId]?.includes(user?.uid || '');
                        return (
                          <button
                            key={reactionId}
                            onClick={() => {
                              toggleReaction(activeMsg.id, recipientId, reactionId);
                              playSound('react');
                              setShowMoreReactions(null);
                              setActiveMessageId(null);
                              setMenuPosition(null);
                            }}
                            className={`w-7 h-7 flex items-center justify-center mx-auto rounded-full transition-all duration-150 hover:scale-125 ${
                              isSelected 
                                ? 'bg-[#ff4d4d]/25 border border-[#ff4d4d]/40 shadow-[0_0_8px_rgba(255,77,77,0.2)]' 
                                : 'hover:bg-white/5 border border-transparent'
                            }`}
                          >
                            {renderNeonReactionIcon(reactionId, 14)}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Items List */}
                <div className="p-1 flex flex-col gap-0.5">
                  <button
                    onClick={() => {
                      setReplyingTo(activeMsg);
                      setActiveMessageId(null);
                      setMenuPosition(null);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-[11px] text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition-all text-left"
                  >
                    <span className="font-medium">{t.chatReply || "Reply"}</span>
                    <Reply className="w-3.5 h-3.5 text-gray-400" />
                  </button>

                  {/* Pin / Unpin with Admin rights check */}
                  {currentChat?.pinnedMessage?.id === activeMsg.id ? (
                    <button
                      onClick={() => {
                        const isGroup = recipientId.startsWith('group_');
                        const isMeAdmin = currentChat?.admins?.includes(user?.uid || '') || currentChat?.ownerId === user?.uid;
                        if (isGroup && !isMeAdmin) {
                          window.dispatchEvent(new CustomEvent('aha_toast', { detail: (t as any).groupOnlyAdminsPin || 'Только администраторы могут откреплять сообщения' }));
                          return;
                        }
                        unpinMessage(recipientId);
                        setActiveMessageId(null);
                        setMenuPosition(null);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-[11px] text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition-all text-left"
                    >
                      <span className="font-medium">{lang === 'ru' ? 'Открепить сообщение' : 'Unpin Message'}</span>
                      <PinOff className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const isGroup = recipientId.startsWith('group_');
                        const isMeAdmin = currentChat?.admins?.includes(user?.uid || '') || currentChat?.ownerId === user?.uid;
                        if (isGroup && !isMeAdmin) {
                          window.dispatchEvent(new CustomEvent('aha_toast', { detail: (t as any).groupOnlyAdminsPin || 'Только администраторы могут закреплять сообщения' }));
                          return;
                        }
                        pinMessage(recipientId, activeMsg);
                        setActiveMessageId(null);
                        setMenuPosition(null);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-[11px] text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition-all text-left"
                    >
                      <span className="font-medium">{lang === 'ru' ? 'Закрепить сообщение' : 'Pin Message'}</span>
                      <Pin className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  )}

                  {activeMsg.type !== 'sticker' && (
                    <button
                      onClick={() => {
                        handleCopy(activeMsg.text);
                        setActiveMessageId(null);
                        setMenuPosition(null);
                        window.dispatchEvent(new CustomEvent('aha_toast', { detail: lang === 'ru' ? 'Скопировано в буфер обмена!' : 'Copied to clipboard!' }));
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-[11px] text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition-all text-left"
                    >
                      <span className="font-medium">{t.chatCopy || "Copy"}</span>
                      <Copy className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  )}

                  {isMe && activeMsg.type !== 'sticker' && (
                    <button
                      onClick={() => {
                        setEditingMessage(activeMsg);
                        setInputText(activeMsg.text);
                        setActiveMessageId(null);
                        setMenuPosition(null);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-[11px] text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition-all text-left"
                    >
                      <span className="font-medium">{t.chatEdit || "Edit"}</span>
                      <Pencil className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  )}

                  {/* Delete message button: available to sender OR group admin */}
                  {(isMe || (recipientId.startsWith('group_') && (currentChat?.admins?.includes(user?.uid || '') || currentChat?.ownerId === user?.uid))) && (
                    <button
                      onClick={() => {
                        deleteMessage(activeMsg.id, recipientId);
                        setActiveMessageId(null);
                        setMenuPosition(null);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-[11px] text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-all text-left"
                    >
                      <span className="font-medium">{t.chatDelete || "Delete"}</span>
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      );
    })()}
    </>
  );
};
