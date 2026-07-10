import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Plus, Search, User as UserIcon, Shield, Clock, ArrowLeft, Send, Trash2, ChevronUp, ChevronDown, Pencil, X, Check, Camera, Palette as PaletteIcon, Activity, Key, ShieldAlert, ShieldCheck, Cpu, RefreshCw, Ticket, Info, Sparkles } from 'lucide-react';
import { Language, translations } from '../../data/translations';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, doc, getDoc, serverTimestamp, updateDoc, deleteDoc, arrayUnion, arrayRemove, increment, limit, where } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { TimeAgo } from '../ui/TimeAgo';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useLimits } from '../../hooks/useLimits';
import { AdsBlock } from '../ui/AdsBlock';

import { vercelFallback } from '../../utils/vercelFallback';
import { CanvasSection } from './CanvasSection';
import { PromoSection } from './PromoSection';
import { ChronicleSection } from './ChronicleSection';
import { decryptImage, encryptImage } from '../../utils/encryption';


interface ForumThread {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  createdAt: any;
  commentCount: number;
  upvotes?: string[];
  downvotes?: string[];
  isEdited?: boolean;
  imageUrl?: string;
  isProtected?: boolean;
}

interface ForumComment {
  id: string;
  threadId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  createdAt: any;
  upvotes?: string[];
  downvotes?: string[];
  isEdited?: boolean;
  isBot?: boolean;
  replyToId?: string;
}

interface ForumSectionProps {
  lang: Language;
  onOpenChat: (uid: string, name: string, photoURL?: string) => void;
  role?: 'admin' | 'moderator' | 'user' | 'beta-tester';
  lowPerfMode?: boolean;
  events?: any[];
  promoCodes?: any[];
  handleCopy?: (text: string) => void;
  onEditEvent?: any;
  onCreateEvent?: any;
}

const quotes: Record<string, string[]> = {
  ru: [
    "Ха-ха-ха! Смертный, добро пожаловать в обитель Радости! Здесь нет правил, кроме одного — будь весел! Ткни меня ещё раз!",
    "Я подсыпал радость в твою овсянку сегодня утром! Слышишь этот смех? Это вселенная смеется над нами!",
    "Форум? О, вы обсуждаете теории лора? А знали ли вы, что я однажды дал силу Безымянного простому червю? Это было восхитительно!",
    "Пиши комментарии, ставь апвоуты, нарушай правила (но не слишком сильно, а то админы рассердятся)! Разве жизнь — не прекрасная шутка?",
    "Ты кликаешь по мне... Означает ли это, что мы теперь лучшие друзья? Или я просто контролирую твой указательный палец? Ха-ха-ха!",
    "Аха одобряет этот тред! Или не одобряет... Какая разница, если это весело?!"
  ],
  by: [
    "Ха-ха-ха! Смяротны, вітаем у мясціне Радасці! Тут няма правілаў, акрамя аднаго — будзь вясёлым! Ткні мяне яшэ раз!",
    "Я падсыпаў радасць у тваю аўсянку сёння раніцай! Чуеш гэты смех? Гэта сусвет смяецца з нас!",
    "Форум? О, вы абмяркоўваеце тэорыі лору? А ці ведалі вы, што я аднойчы даў сілу Безыменнага звычайнаму чарвяку? Гэта было цудоўна!",
    "Пішы каментарыі, стаў апвоўты, парушай правілы (але не занадта моцна, а то адміны раззлуюцца)! Хіба жыццё — не выдатны жарт?",
    "Ты клікаеш па мне... Ці азначае гэта, што мы цяпер лепшыя сябры? Ці я проста кантралюю твой палец? Ха-ха-ха!"
  ],
  de: [
    "Ha-ha-ha! Sterblicher, willkommen im Reich der Elation! Es gibt hier keine Regeln außer einer: Sei fröhlich! Klicke mich noch einmal!",
    "Ich habe heute Morgen etwas Elation in deine Haferflocken gemischt! Hörst du das Lachen? Das ist das Universum, das über uns kichert!",
    "Ein Forum? Oh, ihr diskutiert über Lore-Theorien? Wusstet ihr, dass ich einst einen einfachen Wurm zum Äonen-Emanator ernannt habe? Es war herrlich!",
    "Schreibe Kommentare, gib Upvotes, brich die Regeln (aber nicht zu sehr, sonst weinen die Admins)! Ist das Leben nicht ein wunderbarer Witz?",
    "Du klickst mich weiter an... Bedeutet das, dass wir jetzt beste Freunde sind? Oder kontrolliere ich deinen Zeigefinger? Ha-ha-ha!",
    "Aha stimmt diesem Thread zu! Oder vielleicht auch nicht... Wen interessiert das schon, solange es Spaß macht?!"
  ],
  fr: [
    "Ha-ha-ha ! Mortel, bienvenue dans la demeure de l'Allégresse ! Il n'y a pas de règles ici sauf une : sois joyeux ! Touche-moi encore !",
    "J'ai glissé un peu d'Allégresse dans tes flocons d'avoine ce matin ! Tu entends ce rire ? C'est l'univers qui se moque de nous !",
    "Un forum ? Oh, vous discutez de théories de lore ? Saviez-vous que j'ai un jour élevé un simple ver au rang d'Émanateur ? C'était glorieux !",
    "Écris des commentaires, mets des votes positifs, enfreins les règles (mais pas trop, sinon les admins vont pleurer) ! La vie n'est-elle pas une farce magnifique ?",
    "Tu continues de cliquer sur moi... Cela signifie-t-il que nous sommes meilleurs amis ? Ou est-ce moi qui contrôle ton index ? Ha-ha-ha !",
    "Aha approuve ce fil ! Ou peut-être pas... Qui s'en soucie, tant que c'est amusant !?"
  ],
  zh: [
    "哈-哈-哈！凡人，欢迎来到阿哈的欢愉居所！这里除了保持快乐，没有任何规则！再戳我一下！",
    "我今天早上往你的麦片里加了点欢愉！听到笑声了吗？那是宇宙在嘲笑我们！",
    "论坛？哦，在讨论背景设定？你知道我曾经把一个无名之辈（一条虫子）升格为令使吗？那真是太妙了！",
    "发评论，点赞，打破规则（但别太过分，否则管理员会哭的）！生活难道不就是一个伟大的玩笑吗？",
    "你一直在点我... 这意味着我们是最好的朋友吗？还是我在控制你的食指？哈-哈-哈！",
    "阿哈批准了这个帖子！或者不批准... 只要有趣，谁在乎呢？！"
  ]
};

const ForumBotComment: React.FC<{
  comment: ForumComment;
  lang: Language;
  t: any;
  isReply: boolean;
}> = ({ comment, lang, t, isReply }) => {
  const [pokeCount, setPokeCount] = useState(0);
  const [isJiggling, setIsJiggling] = useState(false);

  const activeQuotes = quotes[lang] || quotes['en'] || quotes['ru'];
  const initialIndex = Math.abs(comment.threadId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % activeQuotes.length;
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(initialIndex);

  const handlePoke = () => {
    setPokeCount(prev => prev + 1);
    setIsJiggling(true);
    setTimeout(() => setIsJiggling(false), 500);

    let newIndex = Math.floor(Math.random() * activeQuotes.length);
    if (newIndex === currentQuoteIndex && activeQuotes.length > 1) {
      newIndex = (newIndex + 1) % activeQuotes.length;
    }
    setCurrentQuoteIndex(newIndex);

    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const notes = [440, 554, 659, 880];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
          gain.gain.setValueAtTime(0.06, ctx.currentTime + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.08 + 0.15);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.08);
          osc.stop(ctx.currentTime + idx * 0.08 + 0.16);
        });
      }
    } catch (err) {
      console.warn('Audio blocked:', err);
    }
  };

  return (
    <motion.div 
      key={comment.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-[#15101e] border-2 border-[#ff4d4d]/40 rounded-2xl p-4 sm:p-5 flex gap-4 relative overflow-hidden bg-gradient-to-br from-[#ff4d4d]/5 to-transparent ${isReply ? 'ml-8 sm:ml-12 mt-2 border-l-4 border-l-[#ff4d4d]/80' : ''}`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff4d4d]/5 rounded-full blur-2xl pointer-events-none" />

      <motion.img 
        animate={isJiggling ? { 
          scale: [1, 1.2, 0.9, 1.1, 1],
          rotate: [0, -10, 10, -5, 5, 0]
        } : {}}
        transition={{ duration: 0.5 }}
        src="https://ui-avatars.com/api/?name=Aha+Bot&background=ff4d4d&color=15101e"
        alt="Aha Bot"
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-[#ff4d4d]/50 shrink-0 cursor-pointer shadow-[0_0_15px_rgba(255,77,77,0.3)] active:scale-90 transition-transform"
        onClick={handlePoke}
      />
      <div className="flex-1 min-w-0 z-10">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="font-bold text-white text-sm truncate flex items-center gap-1.5">
            <span className="text-[#ff4d4d] font-black tracking-wider uppercase">Aha Bot</span>
            <Shield size={12} className="text-[#ff4d4d]" />
            <span className="text-[9px] bg-[#ff4d4d]/15 border border-[#ff4d4d]/30 text-[#ff4d4d] px-1.5 py-0.5 rounded font-black uppercase tracking-widest">
              {lang === 'ru' ? 'ЭЛАТИЯ' : 'ELATION'}
            </span>
          </div>
          <div className="text-[10px] text-[#ff4d4d]/60 font-mono">
            {lang === 'ru' ? `Ткнули: ${pokeCount}` : `Poked: ${pokeCount}`}
          </div>
        </div>

        <div className="text-white/90 text-sm whitespace-pre-wrap break-words leading-relaxed mb-4 font-medium border-l-2 border-l-[#ff4d4d]/40 pl-3">
          {activeQuotes[currentQuoteIndex]}
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePoke}
            className="px-3.5 py-1.5 bg-[#ff4d4d] hover:bg-white text-[#15101e] text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,77,77,0.2)] transition-colors"
          >
            <span>🎭</span>
            {lang === 'ru' ? 'Ткнуть бота!' : 'Poke Aha Bot!'}
          </motion.button>
          
          {pokeCount > 0 && (
            <motion.span 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-[10px] text-gray-400 italic"
            >
              {pokeCount >= 10 
                ? (lang === 'ru' ? '🎉 Аха безумно хохочет!' : '🎉 Aha is laughing maniacally!')
                : (lang === 'ru' ? '✨ Ой, щекотно!' : '✨ Oh, that tickles!')}
            </motion.span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const compressAndGetBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
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
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
};

export const ForumSection: React.FC<ForumSectionProps> = ({ 
  lang, 
  onOpenChat, 
  role,
  lowPerfMode = false,
  events = [],
  promoCodes = [],
  handleCopy = () => {},
  onEditEvent = () => {},
  onCreateEvent = () => {}
}) => {
  const { user } = useAuth();
  const t = translations[lang];
  const { checkLimit, incrementUsage } = useLimits();
  const [protectedViewFeatureEnabled, setProtectedViewFeatureEnabled] = useState<boolean>(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        setProtectedViewFeatureEnabled(docSnap.data().protectedViewFeatureEnabled !== false);
      }
    });
    return () => unsub();
  }, []);

  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newComment, setNewComment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Custom states for Consolidated Activities & Posts section
  const [activeTab, setActiveTab] = useState<'posts' | 'activities' | 'security'>('posts');
  const [subActivityTab, setSubActivityTab] = useState<'events' | 'promos'>('events');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Doodling states
  const [isDoodling, setIsDoodling] = useState(false);
  const [doodleColor, setDoodleColor] = useState('#ff4d4d');
  const [doodleBrushSize, setDoodleBrushSize] = useState(4);
  const doodleCanvasRef = useRef<HTMLCanvasElement>(null);
  const doodleDrawingRef = useRef(false);

  // Security concept states
  const [isE2EEEnabled, setIsE2EEEnabled] = useState(() => {
    return localStorage.getItem('aha_security_e2ee') !== 'false';
  });
  const [isAntiIPCCensorEnabled, setIsAntiIPCCensorEnabled] = useState(() => {
    return localStorage.getItem('aha_security_censor') !== 'false';
  });
  const [securityLogs, setSecurityLogs] = useState<Array<{ id: string; time: string; type: string; msg: string }>>([
    { id: '1', time: new Date().toLocaleTimeString(), type: 'INFO', msg: 'Fools-Guard Firewall Core online.' },
    { id: '2', time: new Date().toLocaleTimeString(), type: 'SUCCESS', msg: 'Anti-KMM Encryption Protocol loaded successfully.' }
  ]);

  const addSecurityLog = (type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ALERT', msg: string) => {
    setSecurityLogs(prev => [
      { id: Date.now().toString(), time: new Date().toLocaleTimeString(), type, msg },
      ...prev.slice(0, 49)
    ]);
  };

  useEffect(() => {
    localStorage.setItem('aha_security_e2ee', String(isE2EEEnabled));
  }, [isE2EEEnabled]);

  useEffect(() => {
    localStorage.setItem('aha_security_censor', String(isAntiIPCCensorEnabled));
  }, [isAntiIPCCensorEnabled]);

  // Handle active drawing on canvas
  const startDoodling = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = doodleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    doodleDrawingRef.current = true;
    ctx.beginPath();
    
    const rect = canvas.getBoundingClientRect();
    let clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    let clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
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
    let clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    let clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

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

  const saveDoodleAttachment = () => {
    const canvas = doodleCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setAttachedImage(dataUrl);
    setIsDoodling(false);
    addSecurityLog('SUCCESS', 'Doodle attached to post draft.');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const base64 = await compressAndGetBase64(file);
      setAttachedImage(base64);
      addSecurityLog('SUCCESS', `Image loaded successfully: ${file.name} compressed.`);
    } catch (err) {
      console.error(err);
      addSecurityLog('ALERT', 'Failed to compress or upload image.');
    } finally {
      setIsUploading(false);
    }
  };
  
  const [threadToDelete, setThreadToDelete] = useState<string | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<{id: string, threadId: string} | null>(null);
  
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editThreadTitle, setEditThreadTitle] = useState('');
  const [editThreadContent, setEditThreadContent] = useState('');
  
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'forum_threads'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const threadsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ForumThread[];
      setThreads(threadsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'forum_threads');
    });

    let fallbackInterval: ReturnType<typeof setInterval>;
    const fetchFallback = async () => {
      if (vercelFallback.isAvailable()) {
        try {
          const fallbackData = await vercelFallback.lrange('forum_threads', 0, 100);
          if (fallbackData && fallbackData.length > 0) {
            const parsed = fallbackData.map((str: any) => typeof str === 'string' ? JSON.parse(str) : str) as ForumThread[];
            
            setThreads(prev => {
              const mapped = new Map([...prev, ...parsed].map(t => [t.id, t]));
              const sorted = Array.from(mapped.values()).sort((a, b) => {
                  const timeA = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : ((a.createdAt as any)?.toMillis?.() || 0);
                  const timeB = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : ((b.createdAt as any)?.toMillis?.() || 0);
                  return timeB - timeA;
              });
              return sorted;
            });
          }
        } catch (e) {}
      }
    };
    
    fetchFallback();
    fallbackInterval = setInterval(fetchFallback, 5000);

    return () => {
      unsubscribe();
      clearInterval(fallbackInterval);
    }
  }, []);

  useEffect(() => {
    if (!selectedThread) return;
    const q = query(
      collection(db, 'forum_comments'), 
      where('threadId', '==', selectedThread.id), 
      orderBy('createdAt', 'asc'),
      limit(100)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as ForumComment));
      setComments(commentsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'forum_comments');
    });

    let fallbackInterval: ReturnType<typeof setInterval>;
    const fetchFallback = async () => {
      if (vercelFallback.isAvailable()) {
        try {
          const fallbackData = await vercelFallback.lrange(`forum_comments:${selectedThread.id}`, 0, 100);
          if (fallbackData && fallbackData.length > 0) {
            const parsed = fallbackData.map((str: any) => typeof str === 'string' ? JSON.parse(str) : str).reverse() as ForumComment[];
            
            setComments(prev => {
              const mapped = new Map([...prev, ...parsed].map(c => [c.id, c]));
              const sorted = Array.from(mapped.values()).sort((a, b) => {
                  const timeA = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : ((a.createdAt as any)?.toMillis?.() || 0);
                  const timeB = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : ((b.createdAt as any)?.toMillis?.() || 0);
                  return timeA - timeB;
              });
              return sorted;
            });
          }
        } catch (e) {}
      }
    };

    fetchFallback();
    fallbackInterval = setInterval(fetchFallback, 5000);

    return () => {
      unsubscribe();
      clearInterval(fallbackInterval);
    };
  }, [selectedThread]);

  const handleCreateThread = async () => {
    if (!checkLimit('threads_monthly')) {
      alert(lang === 'ru' ? 'Вы исчерпали лимит в 20 тредов за месяц. Приобретите Aha Premium.' : 'You have reached the monthly thread limit of 20. Get Aha Premium.');
      return;
    }
    if (!user || !newTitle.trim() || !newContent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    incrementUsage('threads_monthly');
    try {
      const threadData = {
        title: newTitle.trim(),
        content: newContent.trim(),
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorPhoto: user.photoURL || '',
        createdAt: new Date().toISOString(), // Fallback ready format
        commentCount: 1,
        upvotes: [],
        downvotes: [],
        imageUrl: attachedImage ? encryptImage(attachedImage) : ''
      };

      let threadId = Date.now().toString() + '_' + user.uid;

      if (vercelFallback.isAvailable()) {
        const payload = { ...threadData, id: threadId, createdAt: new Date().toISOString() };
        await vercelFallback.lpush('forum_threads', JSON.stringify(payload));
        
        const botPayload = {
          id: Date.now().toString() + '_bot',
          threadId: threadId,
          content: (t as any).forumBotWelcome || "Welcome to the forum!",
          authorId: 'system-bot',
          authorName: 'Aha Bot',
          authorPhoto: 'https://ui-avatars.com/api/?name=Aha+Bot&background=ff4d4d&color=15101e',
          createdAt: new Date().toISOString(),
          upvotes: [],
          downvotes: [],
          isBot: true
        };
        await vercelFallback.lpush(`forum_comments:${threadId}`, JSON.stringify(botPayload));

        setThreads(prev => [payload, ...prev]);
      } else {
        const threadRef = await addDoc(collection(db, 'forum_threads'), {
          ...threadData,
          createdAt: serverTimestamp()
        });
        
        threadId = threadRef.id;

        await addDoc(collection(db, 'forum_comments'), {
          threadId: threadRef.id,
          content: (t as any).forumBotWelcome || "Welcome to the forum!",
          authorId: 'system-bot',
          authorName: 'Aha Bot',
          authorPhoto: 'https://ui-avatars.com/api/?name=Aha+Bot&background=ff4d4d&color=15101e',
          createdAt: serverTimestamp(),
          upvotes: [],
          downvotes: [],
          isBot: true
        });
      }

      setIsCreating(false);
      setNewTitle('');
      setNewContent('');
      setAttachedImage(null);
      addSecurityLog('SUCCESS', `New post "${threadData.title}" created successfully${attachedImage ? ' with attached image' : ''}.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'forum_threads');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateComment = async (replyToId?: string) => {
    if (!checkLimit('comments_daily')) {
      alert(lang === 'ru' ? 'Вы исчерпали лимит в 50 комментариев за день. Приобретите Aha Premium.' : 'You have reached the daily comment limit of 50. Get Aha Premium.');
      return;
    }
    const contentToSubmit = replyToId ? replyContent : newComment;
    if (!user || !selectedThread || !contentToSubmit.trim() || isSubmitting) return;
    setIsSubmitting(true);
    incrementUsage('comments_daily');
    try {
      const commentData = {
        threadId: selectedThread.id,
        content: contentToSubmit.trim(),
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorPhoto: user.photoURL || '',
        createdAt: new Date().toISOString(),
        upvotes: [],
        downvotes: [],
        ...(replyToId ? { replyToId } : {})
      };

      if (vercelFallback.isAvailable()) {
        const commentId = Date.now().toString() + '_' + user.uid;
        const payload = { ...commentData, id: commentId, createdAt: new Date().toISOString() };
        await vercelFallback.lpush(`forum_comments:${selectedThread.id}`, JSON.stringify(payload));
        setComments(prev => [...prev, payload]);
        // Update local state for comment count since we can't do a partial update easily in KV array
        setSelectedThread(prev => prev ? { ...prev, commentCount: (prev.commentCount || 0) + 1 } : null);
      } else {
        await addDoc(collection(db, 'forum_comments'), {
          ...commentData,
          createdAt: serverTimestamp()
        });
        
        const threadRef = doc(db, 'forum_threads', selectedThread.id);
        await updateDoc(threadRef, {
          commentCount: increment(1)
        });
      }
      
      if (replyToId) {
        setReplyContent('');
        setReplyingToCommentId(null);
      } else {
        setNewComment('');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'forum_comments');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteThread = async () => {
    if (!threadToDelete) return;
    try {
      await deleteDoc(doc(db, 'forum_threads', threadToDelete));
      if (selectedThread?.id === threadToDelete) setSelectedThread(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `forum_threads/${threadToDelete}`);
    } finally {
      setThreadToDelete(null);
    }
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;
    try {
      await deleteDoc(doc(db, 'forum_comments', commentToDelete.id));
      const threadRef = doc(db, 'forum_threads', commentToDelete.threadId);
      const threadDoc = await getDoc(threadRef);
      if (threadDoc.exists()) {
        await updateDoc(threadRef, {
          commentCount: Math.max(0, (threadDoc.data().commentCount || 1) - 1)
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `forum_comments/${commentToDelete.id}`);
    } finally {
      setCommentToDelete(null);
    }
  };

  const handleUpdateThread = async () => {
    if (!editingThreadId || !editThreadTitle.trim() || !editThreadContent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'forum_threads', editingThreadId), {
        title: editThreadTitle.trim(),
        content: editThreadContent.trim(),
        isEdited: true
      });
      setEditingThreadId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `forum_threads/${editingThreadId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateComment = async () => {
    if (!editingCommentId || !editCommentContent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'forum_comments', editingCommentId), {
        content: editCommentContent.trim(),
        isEdited: true
      });
      setEditingCommentId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `forum_comments/${editingCommentId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (type: 'thread' | 'comment', item: ForumThread | ForumComment, voteType: 'up' | 'down') => {
    if (!user) return;
    
    const collectionName = type === 'thread' ? 'forum_threads' : 'forum_comments';
    const docRef = doc(db, collectionName, item.id);
    const upvotes = item.upvotes || [];
    const downvotes = item.downvotes || [];
    
    const hasUpvoted = upvotes.includes(user.uid);
    const hasDownvoted = downvotes.includes(user.uid);
    
    let xpChange = 0;

    try {
      if (voteType === 'up') {
        if (hasUpvoted) {
          await updateDoc(docRef, { upvotes: arrayRemove(user.uid) });
          xpChange = -5;
        } else {
          await updateDoc(docRef, {
            upvotes: arrayUnion(user.uid),
            downvotes: arrayRemove(user.uid)
          });
          xpChange = hasDownvoted ? 10 : 5;
        }
      } else {
        if (hasDownvoted) {
          await updateDoc(docRef, { downvotes: arrayRemove(user.uid) });
          xpChange = 5;
        } else {
          await updateDoc(docRef, {
            downvotes: arrayUnion(user.uid),
            upvotes: arrayRemove(user.uid)
          });
          xpChange = hasUpvoted ? -10 : -5;
        }
      }

      if (item.authorId !== 'system-bot' && item.authorId !== user.uid) {
        const authorRef = doc(db, 'users', item.authorId);
        await updateDoc(authorRef, {
          xp: increment(xpChange),
          reputation: increment(xpChange > 0 ? 1 : (xpChange < 0 ? -1 : 0))
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${item.id}`);
    }
  };

  useEffect(() => {
    if (selectedThread) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedThread]);

  const filteredThreads = threads.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedThread) {
    const topLevelComments = comments.filter(c => !c.replyToId).reverse();
    const getReplies = (parentId: string) => comments.filter(c => c.replyToId === parentId);

    const renderComment = (comment: ForumComment, isReply: boolean = false) => {
      if (comment.isBot) {
        return <ForumBotComment key={comment.id} comment={comment} lang={lang} t={t} isReply={isReply} />;
      }

      return (
        <motion.div 
          key={comment.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-[#15101e] border border-[#3d2b4f]/20 rounded-2xl p-4 sm:p-5 flex gap-4 group ${isReply ? 'ml-8 sm:ml-12 mt-2 border-l-2 border-l-[#ff4d4d]/30' : ''}`}
        >
          <img 
            src={comment.authorPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.authorName)}&background=1c1528&color=fff`}
            alt={comment.authorName}
            className="w-10 h-10 rounded-full border border-[#3d2b4f]/50 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="font-bold text-white text-sm truncate flex items-center gap-2">
                {comment.authorName}
                {comment.isEdited && <span className="text-[10px] text-white/40 font-normal">({t.edited || "edited"})</span>}
              </div>
              <div className="flex items-center gap-2">
                <div className="text-[10px] text-white/40 flex items-center gap-1 shrink-0">
                  <TimeAgo date={comment.createdAt} lang={lang} />
                </div>
                <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                  {user?.uid === comment.authorId && (
                    <button 
                      onClick={() => {
                        setEditingCommentId(comment.id);
                        setEditCommentContent(comment.content);
                      }}
                      className="p-1.5 text-white/60 hover:text-blue-400 transition-all rounded-md hover:bg-blue-400/10"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  {(user?.uid === comment.authorId || role === 'admin' || role === 'moderator' || role === 'beta-tester') && (
                    <button 
                      onClick={() => setCommentToDelete({id: comment.id, threadId: selectedThread.id})}
                      className="p-1.5 text-white/60 hover:text-red-400 transition-all rounded-md hover:bg-red-400/10"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {editingCommentId === comment.id ? (
              <div className="mt-2 space-y-3">
                <textarea
                  value={editCommentContent}
                  onChange={(e) => setEditCommentContent(e.target.value)}
                  className="w-full bg-[#0d0b14] border border-[#3d2b4f]/50 rounded-xl p-3 text-white placeholder-white/40 focus:outline-none focus:border-[#ff4d4d] min-h-[80px] resize-y text-sm"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingCommentId(null)}
                    className="px-3 py-1.5 rounded-lg text-white/40 hover:text-white transition-colors text-xs font-bold"
                  >
                    {(t as any).forumCancel || t.profileCancel}
                  </button>
                  <button
                    onClick={handleUpdateComment}
                    disabled={!editCommentContent.trim() || isSubmitting}
                    className="bg-[#ff4d4d] text-[#15101e] px-4 py-1.5 rounded-lg font-bold transition-colors disabled:opacity-50 text-xs"
                  >
                    {isSubmitting ? '...' : ((t as any).forumSave || t.profileSave)}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-white/80 text-sm whitespace-pre-wrap break-words mb-3">{comment.content}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 bg-[#0d0b14]/50 p-1 rounded-lg border border-[#3d2b4f]/30 w-fit">
                    <button
                      onClick={() => handleVote('comment', comment, 'up')}
                      disabled={!user}
                      className={`p-1 rounded transition-all ${comment.upvotes?.includes(user?.uid || '') ? 'text-green-500 bg-green-500/10' : 'text-white/40 hover:text-green-500 hover:bg-green-500/5'}`}
                    >
                      <ChevronUp size={16} />
                    </button>
                    <span className={`text-[10px] font-black px-2 min-w-[1.5rem] text-center ${((comment.upvotes?.length || 0) - (comment.downvotes?.length || 0)) > 0 ? 'text-green-500' : ((comment.upvotes?.length || 0) - (comment.downvotes?.length || 0)) < 0 ? 'text-red-500' : 'text-white/40'}`}>
                      {(comment.upvotes?.length || 0) - (comment.downvotes?.length || 0)}
                    </span>
                    <button
                      onClick={() => handleVote('comment', comment, 'down')}
                      disabled={!user}
                      className={`p-1 rounded transition-all ${comment.downvotes?.includes(user?.uid || '') ? 'text-red-500 bg-red-500/10' : 'text-white/40 hover:text-red-500 hover:bg-red-500/5'}`}
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                    {user && !isReply && (
                      <button 
                        onClick={() => setReplyingToCommentId(comment.id)}
                        className="p-1.5 text-white/40 hover:text-[#ff4d4d] transition-all rounded-md hover:bg-[#ff4d4d]/10 text-xs font-bold tracking-widest"
                      >
                        {(t as any).forumReply || "Reply"}
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {replyingToCommentId === comment.id && (
              <div className="mt-4 bg-[#0d0b14] rounded-xl p-3 border border-[#3d2b4f]/30">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={(t as any).forumYourReply || "Your reply..."}
                  className="w-full bg-transparent text-white placeholder-white/40 focus:outline-none min-h-[60px] resize-y text-sm mb-2"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setReplyingToCommentId(null);
                      setReplyContent('');
                    }}
                    className="px-3 py-1.5 rounded-lg text-white/40 hover:text-white transition-colors text-xs font-bold"
                  >
                    {(t as any).forumCancel || t.profileCancel}
                  </button>
                  <button
                    onClick={() => handleCreateComment(comment.id)}
                    disabled={!replyContent.trim() || isSubmitting}
                    className="bg-[#ff4d4d] text-[#15101e] px-4 py-1.5 rounded-lg font-bold transition-colors disabled:opacity-50 text-xs flex items-center gap-2"
                  >
                    {isSubmitting ? '...' : (
                      <>
                        <Send size={12} />
                        {(t as any).forumReply || "Reply"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      );
    };

    return (
      <div className="space-y-6">
        <button 
          onClick={() => setSelectedThread(null)}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-bold tracking-widest text-sm">{t.forumBack}</span>
        </button>

        <div className="bg-[#15101e] border border-[#3d2b4f]/30 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <img 
                src={selectedThread.authorPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedThread.authorName)}&background=1c1528&color=fff`}
                alt={selectedThread.authorName}
                className="w-12 h-12 rounded-full border-2 border-[#3d2b4f]/50"
              />
              <div>
                <div className="font-black text-white flex items-center gap-2">
                  {selectedThread.authorName}
                  {selectedThread.isEdited && <span className="text-[10px] text-white/40 font-normal">({t.edited || "edited"})</span>}
                </div>
                <div className="text-xs text-white/40 flex items-center gap-2">
                  <Clock size={12} />
                  <TimeAgo date={selectedThread.createdAt} lang={lang} />
                </div>
              </div>
            </div>
            {(user?.uid === selectedThread.authorId || role === 'admin' || role === 'moderator') && (
              <div className="flex items-center gap-2">
                {user?.uid === selectedThread.authorId && (
                  <button 
                    onClick={() => {
                      setEditingThreadId(selectedThread.id);
                      setEditThreadTitle(selectedThread.title);
                      setEditThreadContent(selectedThread.content);
                    }}
                    className="p-2 text-white/40 hover:text-blue-400 transition-all rounded-lg hover:bg-blue-400/10"
                  >
                    <Pencil size={18} />
                  </button>
                )}
                <button 
                  onClick={() => setThreadToDelete(selectedThread.id)}
                  className="p-2 text-white/40 hover:text-red-400 transition-all rounded-lg hover:bg-red-400/10"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          </div>
          
          {editingThreadId === selectedThread.id ? (
            <div className="space-y-4">
              <input
                type="text"
                value={editThreadTitle}
                onChange={(e) => setEditThreadTitle(e.target.value)}
                className="w-full bg-[#0d0b14] border border-[#3d2b4f]/50 rounded-xl p-4 text-white placeholder-white/40 focus:outline-none focus:border-[#ff4d4d] font-bold"
              />
              <textarea
                value={editThreadContent}
                onChange={(e) => setEditThreadContent(e.target.value)}
                className="w-full bg-[#0d0b14] border border-[#3d2b4f]/50 rounded-xl p-4 text-white placeholder-white/40 focus:outline-none focus:border-[#ff4d4d] min-h-[150px] resize-y"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditingThreadId(null)}
                  className="px-4 py-2 rounded-xl text-white/40 hover:text-white transition-colors text-sm font-bold"
                >
                  {(t as any).forumCancel || t.profileCancel}
                </button>
                <button
                  onClick={handleUpdateThread}
                  disabled={!editThreadTitle.trim() || !editThreadContent.trim() || isSubmitting}
                  className="bg-[#ff4d4d] text-[#15101e] px-6 py-2 rounded-xl font-bold transition-colors disabled:opacity-50 text-sm"
                >
                  {isSubmitting ? '...' : ((t as any).forumSave || t.profileSave)}
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-4">
                {isAntiIPCCensorEnabled ? (
                  selectedThread.title.replace(/кмм/gi, '🤡 Корпорация Смешных Людей (КММ)').replace(/ipc/gi, '🤡 Interastral Clown Corporation (IPC)').replace(/стелларон/gi, '🔮 Искрящаяся Грань').replace(/stellaron/gi, '🔮 Sparkling Toy')
                ) : selectedThread.title}
              </h2>
              <p className="text-white/80 whitespace-pre-wrap leading-relaxed mb-6">
                {isAntiIPCCensorEnabled ? (
                  selectedThread.content.replace(/кмм/gi, '🤡 Корпорация Смешных Людей (КММ)').replace(/ipc/gi, '🤡 Interastral Clown Corporation (IPC)').replace(/стелларон/gi, '🔮 Искрящаяся Грань').replace(/stellaron/gi, '🔮 Sparkling Toy')
                ) : selectedThread.content}
              </p>
              
              {selectedThread.imageUrl && (() => {
                const isThreadProtected = protectedViewFeatureEnabled && (selectedThread.isProtected !== false);
                return (
                  <div className="mb-6 rounded-3xl overflow-hidden border border-[#3d2b4f]/40 h-[320px] sm:h-[400px] w-full flex items-center justify-center bg-black/40 relative">
                    <img 
                      src={decryptImage(selectedThread.imageUrl)} 
                      alt="Attached visual" 
                      className={`w-full h-full object-cover ${isThreadProtected ? 'select-none pointer-events-none' : ''}`} 
                      onContextMenu={isThreadProtected ? (e) => e.preventDefault() : undefined}
                      onDragStart={isThreadProtected ? (e) => e.preventDefault() : undefined}
                    />
                    {isThreadProtected ? (
                      <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-[#3d2b4f]/30 text-[10px] font-black uppercase tracking-widest text-white/50 select-none pointer-events-none">
                        🔒 {lang === 'ru' ? 'Защищенный просмотр' : 'Secure View'}
                      </div>
                    ) : (
                      <div className="absolute bottom-4 right-4 flex gap-2">
                        <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-[#3d2b4f]/30 text-[10px] font-black uppercase tracking-widest text-white/50 select-none pointer-events-none">
                          🔓 {lang === 'ru' ? 'Открытый просмотр' : 'Public View'}
                        </div>
                        <button
                          onClick={() => {
                            if (!selectedThread.imageUrl) return;
                            const link = document.createElement('a');
                            link.href = decryptImage(selectedThread.imageUrl);
                            link.download = `${selectedThread.title.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'drawing'}.png`;
                            link.click();
                          }}
                          className="bg-[#ff4d4d] hover:bg-white text-[#15101e] px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(255,77,77,0.3)] flex items-center gap-1 cursor-pointer"
                        >
                          📥 {lang === 'ru' ? 'Скачать' : 'Download'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
              
              <div className="flex items-center gap-1 bg-[#0d0b14]/50 p-1 rounded-xl border border-[#3d2b4f]/30 w-fit">
                <button
                  onClick={() => handleVote('thread', selectedThread, 'up')}
                  disabled={!user}
                  className={`p-1.5 rounded-lg transition-all ${selectedThread.upvotes?.includes(user?.uid || '') ? 'text-green-500 bg-green-500/10' : 'text-white/40 hover:text-green-500 hover:bg-green-500/5'}`}
                >
                  <ChevronUp size={20} />
                </button>
                <span className={`text-xs font-black px-2 min-w-[2rem] text-center ${((selectedThread.upvotes?.length || 0) - (selectedThread.downvotes?.length || 0)) > 0 ? 'text-green-500' : ((selectedThread.upvotes?.length || 0) - (selectedThread.downvotes?.length || 0)) < 0 ? 'text-red-500' : 'text-white/40'}`}>
                  {(selectedThread.upvotes?.length || 0) - (selectedThread.downvotes?.length || 0)}
                </span>
                <button
                  onClick={() => handleVote('thread', selectedThread, 'down')}
                  disabled={!user}
                  className={`p-1.5 rounded-lg transition-all ${selectedThread.downvotes?.includes(user?.uid || '') ? 'text-red-500 bg-red-500/10' : 'text-white/40 hover:text-red-500 hover:bg-red-500/5'}`}
                >
                  <ChevronDown size={20} />
                </button>
              </div>
            </>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-2">
            <MessageSquare size={20} className="text-[#ff4d4d]" />
            {t.forumDiscussion} ({comments.length})
          </h3>

          {user ? (
            <div className="bg-[#15101e] border border-[#3d2b4f]/30 rounded-3xl p-4 flex gap-4">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=1c1528&color=fff`}
                alt={user.displayName}
                className="w-10 h-10 rounded-full border border-[#3d2b4f]/50 hidden sm:block"
              />
              <div className="flex-1 flex flex-col gap-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={(t as any).forumWriteComment || "Write a comment..."}
                  className="w-full bg-[#0d0b14] border border-[#3d2b4f]/50 rounded-xl p-3 text-white placeholder-white/40 focus:outline-none focus:border-[#ff4d4d] min-h-[80px] resize-none"
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => handleCreateComment()}
                    disabled={!newComment.trim() || isSubmitting}
                    className="bg-[#ff4d4d] text-[#15101e] px-6 py-2 rounded-xl font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? <span className="animate-pulse">...</span> : <><Send size={16} /> {(t as any).forumSend || "Send"}</>}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#15101e]/50 border border-[#3d2b4f]/30 rounded-3xl p-6 text-center text-white/40">
              {(t as any).forumLoginToComment || "Login to comment"}
            </div>
          )}

          <div className="space-y-4 mt-8">
            {topLevelComments.map(comment => (
              <React.Fragment key={comment.id}>
                {renderComment(comment)}
                {getReplies(comment.id).map(reply => renderComment(reply, true))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isCreating) {
    return (
      <div className="bg-[#15101e] border border-[#3d2b4f]/30 rounded-3xl p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-white tracking-widest">
            {t.forumNewThread}
          </h2>
          <button onClick={() => setIsCreating(false)} className="text-white/40 hover:text-white">
            <ArrowLeft size={24} />
          </button>
        </div>
        <div className="space-y-4">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={t.forumThreadTitle}
            className="w-full bg-[#0d0b14] border border-[#3d2b4f]/50 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#ff4d4d] font-bold"
          />
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder={t.forumMessageContent}
            className="w-full bg-[#0d0b14] border border-[#3d2b4f]/50 rounded-xl p-4 text-white placeholder-white/40 focus:outline-none focus:border-[#ff4d4d] min-h-[160px] resize-y"
          />

          {/* Visual Attachments Block */}
          <div className="bg-[#0d0b14]/40 border border-[#3d2b4f]/20 rounded-2xl p-4 space-y-4">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <span className="text-sm text-white/60 font-bold uppercase tracking-wider flex items-center gap-2">
                <Camera size={16} className="text-[#ff4d4d]" />
                {lang === 'ru' ? 'Прикрепить контент' : 'Attach Visual Content'}
              </span>
              <div className="flex gap-2">
                {/* File Upload Button */}
                <input
                  type="file"
                  id="forum-photo-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <label
                  htmlFor="forum-photo-upload"
                  className={`bg-[#15101e] border border-[#3d2b4f]/50 text-white hover:text-[#ff4d4d] hover:border-[#ff4d4d]/50 px-4 py-2 rounded-xl text-xs font-black cursor-pointer flex items-center gap-2 transition-all ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <Camera size={14} />
                  {lang === 'ru' ? 'Загрузить фото' : 'Upload Photo'}
                </label>

                {/* Draw Doodle Toggle */}
                <button
                  type="button"
                  onClick={() => setIsDoodling(!isDoodling)}
                  className="bg-[#15101e] border border-[#3d2b4f]/50 text-white hover:text-[#ff4d4d] hover:border-[#ff4d4d]/50 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all"
                >
                  <PaletteIcon size={14} />
                  {lang === 'ru' ? 'Нарисовать' : 'Draw Doodle'}
                </button>
              </div>
            </div>

            {/* Doodle Canvas Interactive Drawer */}
            {isDoodling && (
              <div className="bg-[#15101e] border border-[#ff4d4d]/30 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <PaletteIcon size={16} className="text-[#ff4d4d]" />
                    {lang === 'ru' ? 'Интерактивная рисовашка Ахи' : 'Aha Doodle Pad'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsDoodling(false)}
                    className="text-white/40 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <canvas
                    ref={doodleCanvasRef}
                    width={400}
                    height={260}
                    onMouseDown={startDoodling}
                    onMouseMove={drawDoodle}
                    onMouseUp={stopDoodling}
                    onMouseLeave={stopDoodling}
                    onTouchStart={startDoodling}
                    onTouchMove={drawDoodle}
                    onTouchEnd={stopDoodling}
                    className="bg-[#0d0b14] border border-[#3d2b4f]/60 rounded-xl cursor-crosshair touch-none w-full max-w-[400px] h-[260px] shadow-inner"
                  />
                  <div className="space-y-4 w-full md:w-auto">
                    {/* Brush Colors */}
                    <div>
                      <span className="text-xs text-white/40 block mb-2 font-bold uppercase">{lang === 'ru' ? 'Цвет кисти' : 'Brush Color'}</span>
                      <div className="flex flex-wrap gap-2">
                        {['#ff4d4d', '#4da6ff', '#4dff88', '#ffff4d', '#ff4dff', '#ffffff', '#0d0b14'].map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setDoodleColor(color)}
                            className={`w-7 h-7 rounded-full border transition-all ${doodleColor === color ? 'scale-110 border-white ring-2 ring-[#ff4d4d]/40' : 'border-[#3d2b4f]/50'}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Brush Size */}
                    <div>
                      <span className="text-xs text-white/40 block mb-1 font-bold uppercase">{lang === 'ru' ? 'Толщина' : 'Brush Size'} ({doodleBrushSize}px)</span>
                      <input
                        type="range"
                        min="2"
                        max="20"
                        value={doodleBrushSize}
                        onChange={(e) => setDoodleBrushSize(Number(e.target.value))}
                        className="w-full accent-[#ff4d4d] bg-[#0d0b14] h-1.5 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={clearDoodle}
                        className="bg-black/40 border border-[#3d2b4f]/40 hover:bg-[#ff4d4d]/10 hover:border-[#ff4d4d]/30 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors w-full"
                      >
                        {lang === 'ru' ? 'Очистить' : 'Clear'}
                      </button>
                      <button
                        type="button"
                        onClick={saveDoodleAttachment}
                        className="bg-[#ff4d4d] text-[#15101e] hover:bg-white text-xs font-black px-4 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(255,77,77,0.3)] w-full"
                      >
                        {lang === 'ru' ? 'Прикрепить' : 'Attach'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Attached Image Preview */}
            {attachedImage && (
              <div className="relative w-fit bg-[#15101e] border border-[#3d2b4f]/60 rounded-2xl p-2 group">
                <img
                  src={attachedImage}
                  alt="Attachment preview"
                  className="max-h-[120px] rounded-xl object-contain"
                />
                <button
                  type="button"
                  onClick={() => setAttachedImage(null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              onClick={() => setIsCreating(false)}
              className="px-6 py-3 rounded-xl font-bold tracking-widest text-white/40 hover:text-white transition-colors"
            >
              {(t as any).forumCancel || t.profileCancel}
            </button>
            <button
              onClick={handleCreateThread}
              disabled={!newTitle.trim() || !newContent.trim() || isSubmitting || isUploading}
              className="bg-[#ff4d4d] text-[#15101e] px-8 py-3 rounded-xl font-black tracking-widest hover:bg-white transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(255,77,77,0.3)]"
            >
              {isSubmitting ? '...' : ((t as any).forumCreate || t.profileSave)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdsBlock lang={lang} />
      
      {/* Consolidated Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <h2 className="text-4xl md:text-5xl lg:text-5xl font-black text-white tracking-tighter uppercase flex items-center gap-4">
          <Activity className="text-[#ff4d4d] animate-pulse" size={36} />
          {lang === 'ru' ? 'Активности и Посты' : 'Activities & Posts'}
        </h2>
        {activeTab === 'posts' && user && !selectedThread && (
          <button
            onClick={() => {
              setIsCreating(true);
              addSecurityLog('INFO', 'User opened post creation box.');
            }}
            className="bg-[#ff4d4d] text-[#15101e] px-6 py-3 rounded-xl font-black tracking-widest hover:bg-white transition-all active:scale-95 shadow-[0_0_20px_rgba(255,77,77,0.3)] flex items-center gap-2 justify-center"
          >
            <Plus size={20} />
            {(t as any).forumCreateThread || "Create Thread"}
          </button>
        )}
      </div>

      {/* Sub-Tabs Selector */}
      {!selectedThread && (
        <div className="flex border-b border-[#3d2b4f]/30 gap-2 overflow-x-auto pb-px mb-6 scrollbar-none">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-black uppercase text-xs tracking-wider transition-all whitespace-nowrap ${activeTab === 'posts' ? 'border-[#ff4d4d] text-[#ff4d4d]' : 'border-transparent text-white/40 hover:text-white'}`}
          >
            <MessageSquare size={14} />
            {lang === 'ru' ? 'Лента Постов' : 'Posts Feed'}
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-black uppercase text-xs tracking-wider transition-all whitespace-nowrap ${activeTab === 'security' ? 'border-[#ff4d4d] text-[#ff4d4d]' : 'border-transparent text-white/40 hover:text-white'}`}
          >
            <Shield size={14} />
            {lang === 'ru' ? 'Центр Безопасности' : 'Security Center'}
          </button>
        </div>
      )}

      {/* Tab Contents */}
      {activeTab === 'posts' && (
        <>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={(t as any).forumSearch || "Search threads..."}
              className="w-full bg-[#15101e] border border-[#3d2b4f]/50 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-[#ff4d4d] transition-colors"
            />
          </div>

          <div className="space-y-4">
            {filteredThreads.length === 0 ? (
              <div className="text-center py-12 text-white/40 bg-[#15101e]/30 rounded-3xl border border-[#3d2b4f]/20">
                {(t as any).forumNoThreads || "No threads found."}
              </div>
            ) : (
              filteredThreads.map(thread => (
                <motion.div
                  key={thread.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => {
                    setSelectedThread(thread);
                    addSecurityLog('INFO', `Viewed thread: ${thread.title}`);
                  }}
                  className="bg-[#15101e] border border-[#3d2b4f]/30 rounded-3xl p-5 sm:p-6 hover:border-[#ff4d4d]/50 hover:bg-[#251c35] transition-all cursor-pointer group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                    <h3 className="text-xl font-black text-white group-hover:text-[#ff4d4d] transition-colors line-clamp-2">
                      {isAntiIPCCensorEnabled ? (
                        thread.title.replace(/кмм/gi, '🤡 КММ').replace(/ipc/gi, '🤡 IPC').replace(/стелларон/gi, '🔮 Стелларон').replace(/stellaron/gi, '🔮 Stellaron')
                      ) : thread.title}
                    </h3>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="flex items-center gap-1.5 text-white/40 text-sm bg-[#0d0b14] px-3 py-1.5 rounded-lg">
                        <MessageSquare size={14} />
                        <span className="font-bold">{thread.commentCount || 0}</span>
                      </div>
                      {(user?.uid === thread.authorId || role === 'admin' || role === 'moderator') && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setThreadToDelete(thread.id);
                          }}
                          className="p-2 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-white/40 text-sm line-clamp-2 mb-4">
                    {isAntiIPCCensorEnabled ? (
                      thread.content.replace(/кмм/gi, '🤡 КММ').replace(/ipc/gi, '🤡 IPC').replace(/стелларон/gi, '🔮 Стелларон').replace(/stellaron/gi, '🔮 Stellaron')
                    ) : thread.content}
                  </p>

                  {thread.imageUrl && (() => {
                    const isThreadProtected = protectedViewFeatureEnabled && (thread.isProtected !== false);
                    return (
                      <div className="mb-4 rounded-xl overflow-hidden border border-[#3d2b4f]/20 h-[140px] w-[240px] max-w-full flex items-center bg-black/40 relative">
                        <img 
                          src={decryptImage(thread.imageUrl)} 
                          alt="Post attachment" 
                          className={`w-full h-full object-cover ${isThreadProtected ? 'select-none pointer-events-none' : ''}`} 
                          onContextMenu={isThreadProtected ? (e) => e.preventDefault() : undefined}
                          onDragStart={isThreadProtected ? (e) => e.preventDefault() : undefined}
                        />
                      </div>
                    );
                  })()}

                  <div className="flex items-center gap-3">
                    <img 
                      src={thread.authorPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(thread.authorName)}&background=1c1528&color=fff`}
                      alt={thread.authorName}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-xs font-bold text-white/80">{thread.authorName}</span>
                    <span className="text-xs text-white/40 flex items-center gap-1">
                      <Clock size={10} />
                      <TimeAgo date={thread.createdAt} lang={lang} />
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left side: status and settings */}
            <div className="lg:col-span-5 space-y-6">
              {/* Security Status Card */}
              <div className="bg-[#15101e] border border-[#3d2b4f]/30 rounded-3xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-10 text-[#ff4d4d] group-hover:scale-110 transition-transform duration-300">
                  <Shield size={120} />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ShieldCheck className="text-green-400" size={20} />
                  {lang === 'ru' ? 'Допуск Безопасности' : 'Security Clearance'}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-sm">{lang === 'ru' ? 'Уровень Допуска:' : 'Clearance Level:'}</span>
                    <span className="bg-[#ff4d4d]/10 text-[#ff4d4d] border border-[#ff4d4d]/30 px-3 py-1 rounded-lg text-xs font-black uppercase">
                      {role === 'admin' ? 'LEVEL 5 (ADMIN)' : role === 'moderator' ? 'LEVEL 4 (MOD)' : 'LEVEL 2 (FOOL)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-sm">{lang === 'ru' ? 'Верификация аккаунта:' : 'Account Verification:'}</span>
                    <span className="text-green-400 text-xs font-bold flex items-center gap-1">
                      <Check size={14} /> {lang === 'ru' ? 'Активна' : 'Verified'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-sm">{lang === 'ru' ? 'Протокол защиты:' : 'Defense Protocol:'}</span>
                    <span className="text-white/80 font-black text-xs">Fools-Guard v4.1.2</span>
                  </div>
                </div>
              </div>

              {/* Security Controls */}
              <div className="bg-[#15101e] border border-[#3d2b4f]/30 rounded-3xl p-6 space-y-4">
                <h3 className="text-md font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Cpu size={18} className="text-[#ff4d4d]" />
                  {lang === 'ru' ? 'Управление Протоколами' : 'Protocol Controls'}
                </h3>

                {/* E2EE Chat Switch */}
                <div className="p-4 bg-[#0d0b14]/50 rounded-2xl border border-[#3d2b4f]/20 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Key size={14} className="text-[#ff4d4d]" />
                      {lang === 'ru' ? 'Сквозное Шифрование' : 'E2EE Encryption'}
                    </div>
                    <p className="text-xs text-white/40 leading-relaxed">
                      {lang === 'ru' 
                        ? 'Шифрует сообщения в чатах на стороне клиента перед отправкой в сеть.' 
                        : 'Encrypts private chat messages client-side before sending to server.'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsE2EEEnabled(!isE2EEEnabled);
                      addSecurityLog(!isE2EEEnabled ? 'SUCCESS' : 'WARNING', !isE2EEEnabled ? 'E2EE Encryption Protocol armed.' : 'E2EE Encryption disarmed.');
                    }}
                    className={`w-12 h-6 rounded-full p-1 transition-colors shrink-0 ${isE2EEEnabled ? 'bg-green-500' : 'bg-[#0d0b14] border border-[#3d2b4f]/50'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isE2EEEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Anti-IPC Censor Switch */}
                <div className="p-4 bg-[#0d0b14]/50 rounded-2xl border border-[#3d2b4f]/20 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                      <ShieldAlert size={14} className="text-[#ff4d4d]" />
                      {lang === 'ru' ? 'Цензура КММ / IPC' : 'Anti-IPC Fools-Guard'}
                    </div>
                    <p className="text-xs text-white/40 leading-relaxed">
                      {lang === 'ru' 
                        ? 'Автоматически заменяет упоминания КММ на смешные смайлики.' 
                        : 'Filters out Interastral Peace Corporation references with clown emojis.'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsAntiIPCCensorEnabled(!isAntiIPCCensorEnabled);
                      addSecurityLog(!isAntiIPCCensorEnabled ? 'SUCCESS' : 'WARNING', !isAntiIPCCensorEnabled ? 'Anti-IPC firewall filter activated.' : 'Anti-IPC firewall filter deactivated.');
                    }}
                    className={`w-12 h-6 rounded-full p-1 transition-colors shrink-0 ${isAntiIPCCensorEnabled ? 'bg-green-500' : 'bg-[#0d0b14] border border-[#3d2b4f]/50'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isAntiIPCCensorEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Right side: Console Logs */}
            <div className="lg:col-span-7">
              <div className="bg-[#0d0b14] border border-[#3d2b4f]/40 rounded-3xl p-5 font-mono h-[420px] flex flex-col shadow-2xl">
                <div className="flex items-center justify-between border-b border-[#3d2b4f]/40 pb-3 mb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs text-white/60 font-black tracking-widest uppercase">{lang === 'ru' ? 'КОНСОЛЬ БЕЗОПАСНОСТИ' : 'SECURITY CORE LOGS'}</span>
                  </div>
                  <button
                    onClick={() => setSecurityLogs([])}
                    className="text-[10px] text-white/40 hover:text-white uppercase font-black"
                  >
                    [Clear Logs]
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 text-xs pr-2 scrollbar-thin scrollbar-thumb-[#3d2b4f]">
                  {securityLogs.length === 0 ? (
                    <div className="text-white/20 text-center py-12 italic">{lang === 'ru' ? '[Лонг пуст... Все спокойно]' : '[Console empty]'}</div>
                  ) : (
                    securityLogs.map(log => (
                      <div key={log.id} className="leading-relaxed break-all">
                        <span className="text-white/30 mr-2">[{log.time}]</span>
                        <span className={`font-black mr-2 ${log.type === 'ALERT' ? 'text-red-500' : log.type === 'WARNING' ? 'text-yellow-500' : log.type === 'SUCCESS' ? 'text-green-500' : 'text-blue-400'}`}>
                          {log.type}
                        </span>
                        <span className="text-white/80">{log.msg}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!threadToDelete}
        onClose={() => setThreadToDelete(null)}
        onConfirm={confirmDeleteThread}
        title={(t as any).forumDeleteThreadTitle || "Delete Thread"}
        message={(t as any).forumDeleteThreadMessage || t.forumDeleteThreadMsg}
        confirmText={(t as any).forumDelete || "Delete"}
        cancelText={(t as any).forumCancel || t.profileCancel}
        isDestructive={true}
      />

      <ConfirmModal
        isOpen={!!commentToDelete}
        onClose={() => setCommentToDelete(null)}
        onConfirm={confirmDeleteComment}
        title={(t as any).forumDeleteCommentTitle || "Delete Comment"}
        message={(t as any).forumDeleteCommentMessage || t.forumDeleteCommentMsg}
        confirmText={(t as any).forumDelete || "Delete"}
        cancelText={(t as any).forumCancel || t.profileCancel}
        isDestructive={true}
      />
    </div>
  );
};
