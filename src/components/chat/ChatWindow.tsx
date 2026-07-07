import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useChat, Message } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { translations, Language } from '../../data/translations';
import { GoogleLoginButton } from '../ui/GoogleLoginButton';
import { Send, X, User, Reply, Smile, Sticker, Pencil, Trash2, Ban, Copy, Check, CheckCheck, ChevronDown, Image as ImageIcon, ShieldAlert, Sparkles, Mail, VolumeX, Volume2, Pin, PinOff, Mic, Play, Pause, Trash, Flame, Heart, ThumbsUp, Zap, Star, Crown, Award, Ghost, Skull, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, isSameDay, isToday, isYesterday } from 'date-fns';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

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

export const VoiceMessagePlayer: React.FC<{ src: string; lang: Language; initialDuration?: number }> = ({ src, lang, initialDuration }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number | null>(initialDuration || null);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

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

  const formatTime = (time: number) => {
    if (isNaN(time) || time === Infinity) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = duration && duration !== Infinity ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 bg-[#11071a]/90 border border-[#ff4d4d]/30 rounded-2xl p-3 shadow-[0_0_15px_rgba(255,77,77,0.15)] min-w-[220px] sm:min-w-[260px] relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
      <div className="absolute top-0 left-0 w-1.5 h-full bg-[#ff4d4d] shadow-[0_0_8px_#ff4d4d]" />
      <button
        type="button"
        onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-[#ff4d4d] text-[#0d0714] hover:bg-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shrink-0 shadow-[0_0_12px_rgba(255,77,77,0.4)]"
      >
        {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-1.5 h-6">
          <div className="flex-1 h-1 bg-[#28153c] rounded-full overflow-hidden relative">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#ff4d4d] to-pink-500 rounded-full shadow-[0_0_8px_#ff4d4d]" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono">
          <span className="text-[#ff4d4d] font-bold">{formatTime(currentTime)}</span>
          <span>{duration && duration !== Infinity ? formatTime(duration) : '🎤 ' + (lang === 'ru' ? 'Голосовое' : 'Voice')}</span>
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
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ recipientId, recipientName, recipientPhoto, lang, onClose }) => {
  const { user } = useAuth();
  const { chats, messages, sendMessage, toggleReaction, deleteMessage, editMessage, setTyping, markChatAsRead, pinMessage, unpinMessage } = useChat(recipientId);
  const t = translations[lang] as any;
  const [inputText, setInputText] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [showStickers, setShowStickers] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
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

  const activeChatId = user ? [user.uid, recipientId].sort().join('_') : '';
  const currentChat = chats.find(c => c.id === activeChatId);
  const isRecipientTyping = currentChat?.typing?.[recipientId];

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
    if (!recipientId || typeof recipientId !== 'string' || recipientId.trim() === '') return;
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

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(t.chatFileTooLarge);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const base64String = canvas.toDataURL('image/jpeg', 0.7);
          setSelectedImages(prev => [...prev, base64String]);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
    
    e.target.value = '';
  };

  const removeSelectedImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && selectedImages.length === 0) || isSending) return;
    
    setIsSending(true);
    try {
      if (editingMessage) {
        await editMessage(editingMessage.id, recipientId, inputText);
        setEditingMessage(null);
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
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[420px] sm:h-[650px] bg-[#110b1a]/95 backdrop-blur-xl sm:border sm:border-[#382650]/80 sm:rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden z-50 transition-all duration-300"
      >
        {/* Header */}
        <div className="p-3 bg-[#09050d] border-b border-[#311c47] flex items-center justify-between shrink-0 z-20 shadow-lg relative">
          <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#ff4d4d]/20 to-transparent" />
          <div className="flex items-center gap-2.5">
            <div className="relative">
              {recipientPhoto ? (
                <img src={recipientPhoto} alt="" className="w-8 h-8 rounded-full object-cover border border-[#ff4d4d]/30" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#ff4d4d]/10 flex items-center justify-center border border-[#ff4d4d]/30">
                  <User className="w-4 h-4 text-[#ff4d4d]" />
                </div>
              )}
              <div className={`absolute bottom-0 right-0 w-2 h-2 border-2 border-[#09050d] rounded-full ${
                isUserOnline() 
                  ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]' 
                  : 'bg-gray-600'
              }`} />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-white text-sm sm:text-base uppercase tracking-wider block leading-none truncate max-w-[150px] sm:max-w-[200px]">{recipientName}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isUserOnline() ? (
                  <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                    {t.chatOnline}
                  </span>
                ) : (
                  <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-[#3d2b4f]"></span>
                    {t.chatOffline}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 border rounded-xl transition-all active:scale-90 flex items-center justify-center ${
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
              className="p-2 bg-[#150e24] hover:bg-[#ff4d4d] border border-[#3e245a] hover:border-[#ff4d4d] text-gray-300 hover:text-[#0d0714] rounded-xl transition-all active:scale-95 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

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
              className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 custom-scrollbar bg-[#0d0714] relative"
            >
              {activeMessageId && (
                <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]" onClick={() => setActiveMessageId(null)} />
              )}
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-40">
                  <div className="w-16 h-16 bg-[#ff4d4d]/5 rounded-3xl flex items-center justify-center border border-[#ff4d4d]/10">
                    <Send className="w-6 h-6 text-[#ff4d4d]" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                    {t.chatStartConversation}
                  </p>
                </div>
              ) : (
                (() => {
                  let lastDate: Date | null = null;
                  return messages.map((msg, idx) => {
                    const isMe = msg.senderId === user?.uid;
                    const repliedMsg = msg.replyTo ? messages.find(m => m.id === msg.replyTo) : null;
                    const msgDate = msg.createdAt?.toDate ? msg.createdAt.toDate() : new Date();
                    const showDateSeparator = !lastDate || !isSameDay(lastDate, msgDate);
                    lastDate = msgDate;
                    
                    let isRead = false;
                    if (currentChat?.lastReadAt?.[recipientId] && msg.createdAt) {
                      const readAt = currentChat.lastReadAt[recipientId]?.toMillis?.() || currentChat.lastReadAt[recipientId];
                      const msgAt = msg.createdAt?.toMillis?.() || msg.createdAt;
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
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} relative group ${msg.reactions && Object.keys(msg.reactions).some(k => msg.reactions![k].length > 0) ? 'mb-5.5' : ''}`}
                        >
                          {/* Global Portal-based message overlay menu renders at bottom of body instead of absolute inside list */}

                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!msg.isDeleted) {
                                setActiveMessageId(activeMessageId === msg.id ? null : msg.id);
                              }
                            }}
                            className={`max-w-[85%] p-3.5 sm:p-4 rounded-3xl text-sm sm:text-base shadow-lg relative cursor-pointer transition-all duration-200 active:scale-[0.98] ${
                              (msg.type === 'sticker' || msg.type === 'voice') && !msg.isDeleted
                                ? 'bg-transparent shadow-none p-0' 
                                : isMe
                                  ? 'bg-gradient-to-br from-[#ff3d5a] to-[#cc1b36] text-white rounded-tr-sm font-medium border border-[#ff4d4d]/20'
                                  : 'bg-[#181125]/95 text-gray-100 rounded-tl-sm border border-[#3e245a]/40 hover:border-[#ff4d4d]/30 shadow-[0_4px_20px_rgba(0,0,0,0.15)]'
                            } ${msg.isDeleted ? 'opacity-40 italic' : ''}`}
                          >
                            {repliedMsg && msg.type !== 'sticker' && !msg.isDeleted && (
                              <div className={`mb-2.5 p-2 rounded-xl text-xs border-l-2 ${isMe ? 'bg-[#0d0714]/15 border-[#0d0714]/40' : 'bg-[#0d0714]/40 border-[#ff4d4d]/50'}`}>
                                <span className="font-bold opacity-70 block mb-0.5">
                                  {repliedMsg.senderId === user?.uid ? (t.chatYou || "You") : recipientName}
                                </span>
                                <span className="opacity-80 line-clamp-1">
                                  {repliedMsg.isDeleted ? (t.chatMessageDeleted || "Deleted") : (repliedMsg.type === 'sticker' ? 'Sticker' : repliedMsg.type === 'voice' ? '🎤 ' + (lang === 'ru' ? 'Голосовое' : 'Voice') : repliedMsg.text)}
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
                            
                            <div className={`text-[9px] mt-2 font-black tracking-wider opacity-60 flex items-center gap-1 ${isMe ? 'justify-end' : 'justify-start'} ${msg.type === 'sticker' && !msg.isDeleted ? 'text-gray-400' : ''}`}>
                              {msg.isEdited && !msg.isDeleted && <span>({t.edited || "edited"})</span>}
                              {msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'HH:mm') : ''}
                              {isMe && !msg.isDeleted && (
                                isRead ? <CheckCheck className={`w-3.5 h-3.5 ml-0.5 ${msg.type === 'sticker' ? 'text-blue-400' : msg.type === 'voice' ? 'text-[#ff4d4d]' : 'text-[#0d0714]'}`} /> : <Check className={`w-3.5 h-3.5 ml-0.5 ${msg.type === 'sticker' ? 'text-gray-400' : 'opacity-60'}`} />
                              )}
                            </div>

                            {msg.reactions && Object.keys(msg.reactions).length > 0 && !msg.isDeleted && (
                              <div className={`absolute -bottom-3.5 ${isMe ? 'right-2' : 'left-2'} flex items-center gap-1 z-10 flex-wrap max-w-full`}>
                                {Object.entries(msg.reactions).map(([reactionId, users]) => users.length > 0 && (
                                  <button
                                    key={reactionId}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleReaction(msg.id, recipientId, reactionId);
                                    }}
                                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full border transition-all shadow-[0_2px_8px_rgba(0,0,0,0.4)] ${
                                      users.includes(user?.uid || '') 
                                        ? 'bg-[#ff4d4d]/15 border-[#ff4d4d]/40 text-[#ff4d4d]' 
                                        : 'bg-[#0f0a18]/95 border-[#2e1d44] text-gray-300 hover:border-[#ff4d4d]/30 hover:bg-[#1b112c]'
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
                    <label className="shrink-0 p-2.5 rounded-full transition-all text-gray-400 hover:text-[#ff4d4d] hover:bg-[#1a0f26] cursor-pointer flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={isSending} />
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
      
      return createPortal(
        <AnimatePresence>
          {activeMessageId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[99999] flex flex-col items-center justify-center p-4 bg-[#0a0510]/85 backdrop-blur-md"
              onClick={() => {
                setActiveMessageId(null);
                setShowMoreReactions(null);
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 15 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="w-full max-w-sm bg-[#130b1c] border-2 border-[#ff4d4d]/30 rounded-[32px] p-6 shadow-[0_20px_50px_rgba(255,77,77,0.2)] flex flex-col gap-5 text-center relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Neon decorative background glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#ff4d4d]/10 rounded-full blur-[45px] pointer-events-none" />

                {/* Header context */}
                <div className="flex flex-col items-center gap-1.5 relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#ff4d4d] mb-1 px-3 py-1 bg-[#ff4d4d]/10 rounded-full">
                    {lang === 'ru' ? 'СООБЩЕНИЕ' : 'MESSAGE INFO'}
                  </span>
                  
                  {/* Selected message preview */}
                  <div className={`w-full p-4 rounded-2xl text-sm sm:text-base text-left break-words border ${
                    isMe 
                      ? 'bg-gradient-to-br from-[#ff3d5a] to-[#cc1b36] border-[#ff3d5a]/20 text-white font-medium shadow-md shadow-[#ff3d5a]/10' 
                      : 'bg-[#181125] border-[#3e245a]/50 text-gray-100 shadow-md'
                  }`}>
                    {activeMsg.type === 'sticker' ? (
                      <span className="text-5xl block text-center py-2">{activeMsg.text}</span>
                    ) : (
                      <span className="block whitespace-pre-wrap">{activeMsg.text}</span>
                    )}
                    
                    {activeMsg.images && activeMsg.images.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {activeMsg.images.map((img: string, i: number) => (
                          <img key={i} src={img} className="max-h-24 w-full object-cover rounded-xl" alt="" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick reactions strip */}
                <div className="flex flex-col gap-2 relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    {lang === 'ru' ? 'Выбрать реакцию' : 'React to message'}
                  </span>
                  <div className="flex items-center justify-center p-2.5 bg-[#09050d] rounded-2xl border border-[#3e245a]/40 gap-1.5 overflow-x-auto">
                    {customReactionsList.map(reactionId => {
                      const isSelected = activeMsg.reactions?.[reactionId]?.includes(user?.uid || '');
                      return (
                        <button
                          key={reactionId}
                          onClick={() => {
                            toggleReaction(activeMsg.id, recipientId, reactionId);
                            playSound('react');
                            setActiveMessageId(null);
                          }}
                          className={`p-2.5 hover:scale-125 transition-transform rounded-xl duration-150 shrink-0 ${
                            isSelected 
                              ? 'bg-[#ff4d4d]/20 border border-[#ff4d4d]/40 shadow-[0_0_8px_rgba(255,77,77,0.2)]' 
                              : 'hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          {NEON_REACTION_CONFIG[reactionId] ? (
                            renderNeonReactionIcon(reactionId, 18)
                          ) : (
                            <span className="text-xl leading-none">{reactionId}</span>
                          )}
                        </button>
                      );
                    })}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMoreReactions(showMoreReactions === activeMsg.id ? null : activeMsg.id);
                      }}
                      className="p-2.5 hover:scale-125 transition-transform rounded-xl hover:bg-white/5 text-gray-400 hover:text-[#ff4d4d] shrink-0 border border-transparent"
                      title="More reactions"
                    >
                      ➕
                    </button>
                  </div>

                  {/* Additional reactions shelf */}
                  <AnimatePresence>
                    {showMoreReactions === activeMsg.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="grid grid-cols-6 gap-2 p-2.5 bg-[#06030a] border border-[#ff4d4d]/20 rounded-2xl max-h-36 overflow-y-auto mt-1"
                      >
                        {['thumbsup', 'heart', 'flame', 'zap', 'star', 'smile', 'crown', 'award', 'ghost', 'skull', 'sparkles', 'shield'].map(reactionId => {
                          const isSelected = activeMsg.reactions?.[reactionId]?.includes(user?.uid || '');
                          return (
                            <button
                              key={reactionId}
                              onClick={() => {
                                toggleReaction(activeMsg.id, recipientId, reactionId);
                                playSound('react');
                                setShowMoreReactions(null);
                                setActiveMessageId(null);
                              }}
                              className={`p-2 hover:scale-120 transition-transform rounded-xl flex items-center justify-center ${
                                isSelected 
                                  ? 'bg-[#ff4d4d]/25 border border-[#ff4d4d]/40 shadow-[0_0_8px_rgba(255,77,77,0.2)]' 
                                  : 'hover:bg-white/5 border border-transparent'
                              }`}
                            >
                              {renderNeonReactionIcon(reactionId, 18)}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Custom reaction panel configurer */}
                  <div className="mt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowReactionCustomizer(!showReactionCustomizer);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 bg-[#12091d] border border-[#ff4d4d]/20 hover:border-[#ff4d4d]/50 rounded-xl text-left text-xs text-gray-300 hover:text-white transition-colors"
                    >
                      <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
                        <span>⚙️</span>
                        {lang === 'ru' ? 'Настроить быстрые реакции' : 'Customize Quick Reactions'}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showReactionCustomizer ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {showReactionCustomizer && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-1.5 p-3 bg-[#0a0510] border border-[#3e245a]/50 rounded-2xl space-y-3"
                        >
                          <p className="text-[10px] text-gray-400 leading-normal">
                            {lang === 'ru' 
                              ? 'Выберите любой слот ниже, затем выберите новую неоновую реакцию для быстрой панели.' 
                              : 'Select a slot below, then choose a new neon reaction for your quick panel.'}
                          </p>

                          {/* 6 slots */}
                          <div className="grid grid-cols-6 gap-1.5">
                            {customReactionsList.map((reactionId, idx) => (
                              <button
                                key={idx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCustomizingSlotIndex(customizingSlotIndex === idx ? null : idx);
                                  setManualEmoji('');
                                }}
                                className={`p-1.5 rounded-xl border flex flex-col items-center justify-center transition-all h-14 ${customizingSlotIndex === idx ? 'bg-[#ff4d4d]/15 border-[#ff4d4d] scale-105 shadow-[0_0_8px_rgba(255,77,77,0.2)]' : 'bg-[#150d22] border-[#3e245a] hover:border-[#ff4d4d]/40'}`}
                              >
                                {NEON_REACTION_CONFIG[reactionId] ? (
                                  renderNeonReactionIcon(reactionId, 16)
                                ) : (
                                  <span className="text-sm leading-none">{reactionId}</span>
                                )}
                                <span className="text-[7px] text-[#ff4d4d]/60 font-mono mt-0.5">S{idx + 1}</span>
                              </button>
                            ))}
                          </div>

                          {/* Customizer drawer for selected slot */}
                          {customizingSlotIndex !== null && (
                            <motion.div 
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-[#120a1c] p-2.5 rounded-xl border border-[#ff4d4d]/20 space-y-2.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black uppercase text-[#ff4d4d] tracking-widest">
                                  {lang === 'ru' ? `Изменение слота ${customizingSlotIndex + 1}` : `Editing Slot ${customizingSlotIndex + 1}`}
                                </span>
                                <button 
                                  onClick={() => setCustomizingSlotIndex(null)}
                                  className="text-[10px] text-gray-400 hover:text-white font-bold"
                                >
                                  {lang === 'ru' ? 'Отмена' : 'Cancel'}
                                </button>
                              </div>

                              {/* Grid of extra emojis to pick */}
                              <div className="grid grid-cols-6 gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-[#09050d] rounded-lg border border-[#3e245a]/30">
                                {['thumbsup', 'heart', 'flame', 'zap', 'star', 'smile', 'crown', 'award', 'ghost', 'skull', 'sparkles', 'shield'].map(reactionId => (
                                  <button
                                    key={reactionId}
                                    onClick={() => {
                                      updateCustomReactionSlot(customizingSlotIndex, reactionId);
                                      setCustomizingSlotIndex(null);
                                    }}
                                    className="p-1.5 hover:bg-white/10 rounded-lg flex items-center justify-center transition-all active:scale-90"
                                  >
                                    {renderNeonReactionIcon(reactionId, 18)}
                                  </button>
                                ))}
                              </div>

                              {/* Manual text input to allow typing ANY custom emoji or letter */}
                              <div className="flex gap-1.5 items-center">
                                <input
                                  type="text"
                                  value={manualEmoji}
                                  onChange={(e) => setManualEmoji(e.target.value)}
                                  placeholder={lang === 'ru' ? 'Имя реакции (например, crown)...' : 'Reaction ID (e.g. crown)...'}
                                  maxLength={15}
                                  className="flex-1 bg-[#09050d] border border-[#3e245a]/50 focus:border-[#ff4d4d] rounded-lg px-2.5 py-1 text-xs text-white placeholder-gray-500 focus:outline-none"
                                />
                                <button
                                  onClick={() => {
                                    if (manualEmoji.trim()) {
                                      updateCustomReactionSlot(customizingSlotIndex, manualEmoji.trim());
                                      setCustomizingSlotIndex(null);
                                      setManualEmoji('');
                                    }
                                  }}
                                  disabled={!manualEmoji.trim()}
                                  className="px-3 py-1 bg-[#ff4d4d] hover:bg-white text-[#15101e] text-[10px] font-black uppercase tracking-wider rounded-lg disabled:opacity-40 transition-colors"
                                >
                                  {lang === 'ru' ? 'ОК' : 'OK'}
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Main options list */}
                <div className="grid grid-cols-2 gap-2 relative z-10 mt-1">
                  <button
                    onClick={() => {
                      setReplyingTo(activeMsg);
                      setActiveMessageId(null);
                    }}
                    className="flex items-center justify-center gap-2 py-3 bg-[#181125] hover:bg-[#ff4d4d]/10 hover:text-[#ff4d4d] text-gray-300 border border-[#3e245a]/50 rounded-2xl transition-all font-black uppercase tracking-wider text-[11px] active:scale-95 shadow-md"
                  >
                    <Reply className="w-4 h-4 text-[#ff4d4d]" />
                    {t.chatReply || "Reply"}
                  </button>

                  {currentChat?.pinnedMessage?.id === activeMsg.id ? (
                    <button
                      onClick={() => {
                        unpinMessage(recipientId);
                        setActiveMessageId(null);
                      }}
                      className="flex items-center justify-center gap-2 py-3 bg-[#181125] hover:bg-[#ff4d4d]/10 hover:text-[#ff4d4d] text-gray-300 border border-[#3e245a]/50 rounded-2xl transition-all font-black uppercase tracking-wider text-[11px] active:scale-95 shadow-md"
                    >
                      <PinOff className="w-4 h-4 text-[#ff4d4d]" />
                      {lang === 'ru' ? 'Открепить' : 'Unpin'}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        pinMessage(recipientId, activeMsg);
                        setActiveMessageId(null);
                      }}
                      className="flex items-center justify-center gap-2 py-3 bg-[#181125] hover:bg-[#ff4d4d]/10 hover:text-[#ff4d4d] text-gray-300 border border-[#3e245a]/50 rounded-2xl transition-all font-black uppercase tracking-wider text-[11px] active:scale-95 shadow-md"
                    >
                      <Pin className="w-4 h-4 text-[#ff4d4d]" />
                      {lang === 'ru' ? 'Закрепить' : 'Pin'}
                    </button>
                  )}

                  {activeMsg.type !== 'sticker' && (
                    <button
                      onClick={() => {
                        handleCopy(activeMsg.text);
                        setActiveMessageId(null);
                        window.dispatchEvent(new CustomEvent('aha_toast', { detail: lang === 'ru' ? 'Скопировано в буфер обмена!' : 'Copied to clipboard!' }));
                      }}
                      className="flex items-center justify-center gap-2 py-3 bg-[#181125] hover:bg-[#ff4d4d]/10 hover:text-[#ff4d4d] text-gray-300 border border-[#3e245a]/50 rounded-2xl transition-all font-black uppercase tracking-wider text-[11px] active:scale-95 shadow-md"
                    >
                      <Copy className="w-4 h-4 text-[#ff4d4d]" />
                      {t.chatCopy || "Copy"}
                    </button>
                  )}

                  {isMe && activeMsg.type !== 'sticker' && (
                    <button
                      onClick={() => {
                        setEditingMessage(activeMsg);
                        setInputText(activeMsg.text);
                        setActiveMessageId(null);
                      }}
                      className="flex items-center justify-center gap-2 py-3 bg-[#181125] hover:bg-[#ff4d4d]/10 hover:text-[#ff4d4d] text-gray-300 border border-[#3e245a]/50 rounded-2xl transition-all font-black uppercase tracking-wider text-[11px] active:scale-95 shadow-md"
                    >
                      <Pencil className="w-4 h-4 text-[#ff4d4d]" />
                      {t.chatEdit || "Edit"}
                    </button>
                  )}

                  {isMe && (
                    <button
                      onClick={() => {
                        deleteMessage(activeMsg.id, recipientId);
                        setActiveMessageId(null);
                      }}
                      className={`${activeMsg.type === 'sticker' ? 'col-span-2' : ''} flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 rounded-2xl transition-all font-black uppercase tracking-wider text-[11px] active:scale-95 shadow-md`}
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                      {t.chatDelete || "Delete"}
                    </button>
                  )}
                </div>

                {/* Direct Close Button */}
                <button
                  onClick={() => {
                    setActiveMessageId(null);
                    setShowMoreReactions(null);
                  }}
                  className="py-3 bg-[#ff4d4d] text-[#0d0714] rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white hover:scale-[1.02] active:scale-95 transition-all shadow-md shadow-[#ff4d4d]/10 relative z-10"
                >
                  {lang === 'ru' ? 'Закрыть' : 'Close'}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      );
    })()}
    </>
  );
};
