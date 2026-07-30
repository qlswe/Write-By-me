import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radio, Video, Calendar, Clock, Users, Heart, Send, Plus, Trash2, X, Play, AlertCircle, Camera, Link as LinkIcon, Sparkles, Edit, Check } from 'lucide-react';
import { collection, onSnapshot, addDoc, doc, deleteDoc, updateDoc, query, orderBy, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { Language, translations } from '../../data/translations';
import { KuruVideoPlayer } from '../ui/KuruVideoPlayer';
import { uploadMediaFile } from '../../utils/mediaUploader';
import { vercelFallback } from '../../utils/vercelFallback';
import { generatePrefixedId } from '../../utils/idGenerator';

interface StreamItem {
  id: string;
  title: string;
  description: string;
  streamerName: string;
  streamerAvatar?: string;
  authorUid: string;
  streamUrl: string;
  scheduledTime: number; // Unix timestamp in ms
  isLive: boolean;
  category: string;
  thumbnailUrl?: string;
  createdAt: string;
  viewersCount?: number;
  likesCount?: number;
  likedBy?: string[];
}

interface ChatMessage {
  id: string;
  uid: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: number;
  timestampSec?: number;
}

interface StreamsSectionProps {
  lang: Language;
  role?: string;
}

export const StreamsSection: React.FC<StreamsSectionProps> = ({ lang, role }) => {
  const { user } = useAuth();
  const t = translations[lang] || translations['ru'];

  const [streams, setStreams] = useState<StreamItem[]>([]);
  const [activeStream, setActiveStream] = useState<StreamItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStream, setEditingStream] = useState<StreamItem | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('игры');
  const [streamUrl, setStreamUrl] = useState('');
  const [streamUrlInput, setStreamUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Instant force play mode override for active stream
  const [forcePlay, setForcePlay] = useState(false);

  // Live Video Playback & Synchronized Replay Chat Time
  const [currentVideoTime, setCurrentVideoTime] = useState<number>(0);

  // Live Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [hasLiked, setHasLiked] = useState(false);
  const [countdown, setCountdown] = useState<string>('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Load Streams from Firestore or Fallback
  useEffect(() => {
    const q = query(collection(db, 'streams'), orderBy('scheduledTime', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const items: StreamItem[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as StreamItem));
      setStreams(items);

      if (items.length > 0 && !activeStream) {
        setActiveStream(items[0]);
      } else if (activeStream) {
        // Keep activeStream in sync with updated list data
        const updated = items.find(s => s.id === activeStream.id);
        if (updated) {
          setActiveStream(updated);
        }
      }
    }, (err) => {
      console.warn('Firestore streams error, using fallback', err);
    });

    const fetchFallback = async () => {
      if (vercelFallback.isAvailable()) {
        try {
          const raw = await vercelFallback.lrange('streams', 0, 20);
          if (raw && raw.length > 0) {
            const parsed = raw.map(r => typeof r === 'string' ? JSON.parse(r) : r);
            setStreams(parsed);
            if (parsed.length > 0 && !activeStream) {
              setActiveStream(parsed[0]);
            }
          }
        } catch (e) {}
      }
    };
    fetchFallback();

    return () => unsub();
  }, []);

  // Update active user viewer presence and liked state
  useEffect(() => {
    if (!activeStream) return;

    setForcePlay(false);

    // Check if current user has liked this stream
    if (user && activeStream.likedBy?.includes(user.uid)) {
      setHasLiked(true);
    } else {
      setHasLiked(false);
    }

    // Real viewer tracking increment in Firestore
    const activeStreamRef = doc(db, 'streams', activeStream.id);
    updateDoc(activeStreamRef, {
      viewersCount: increment(1)
    }).catch(() => {});

    // Decrement viewer count on unmount / stream change
    return () => {
      updateDoc(activeStreamRef, {
        viewersCount: increment(-1)
      }).catch(() => {});
    };
  }, [activeStream?.id]);

  // Listen to active stream chat
  useEffect(() => {
    if (!activeStream) return;

    const unsubChat = onSnapshot(
      query(collection(db, 'streams', activeStream.id, 'chat'), orderBy('createdAt', 'asc')),
      (snapshot) => {
        const msgs: ChatMessage[] = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as ChatMessage));
        setChatMessages(msgs);
      },
      (err) => {
        setChatMessages([
          { id: '1', uid: 'system', userName: 'AhaBot', text: 'Добро пожаловать на трансляцию! Соблюдайте правила общения.', createdAt: Date.now() - 300000 },
          { id: '2', uid: 'user1', userName: 'KuruFan', text: 'Всем привет! Отличный эфир 🔥', createdAt: Date.now() - 120000 }
        ]);
      }
    );

    return () => unsubChat();
  }, [activeStream?.id]);

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Countdown timer calculation
  useEffect(() => {
    if (!activeStream) return;

    const timer = setInterval(() => {
      const diff = activeStream.scheduledTime - Date.now();
      if (diff <= 0) {
        setCountdown('');
      } else {
        const hrs = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown(`${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeStream]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      alert(lang === 'ru' ? 'Файл превышает 100 МБ' : 'File exceeds 100MB');
      return;
    }
    setIsUploading(true);
    try {
      const url = await uploadMediaFile(file);
      setStreamUrl(url);
    } catch (err: any) {
      alert(err.message || 'Error uploading video');
    } finally {
      setIsUploading(false);
    }
  };

  const openCreateModal = () => {
    setEditingStream(null);
    setTitle('');
    setDescription('');
    setCategory('игры');
    setStreamUrl('');
    setStreamUrlInput('');
    setIsScheduled(false);
    setScheduledDateTime('');
    setShowCreateModal(true);
  };

  const openEditModal = (stream: StreamItem) => {
    setEditingStream(stream);
    setTitle(stream.title);
    setDescription(stream.description || '');
    setCategory(stream.category || 'игры');
    setStreamUrl(stream.streamUrl);
    setStreamUrlInput(stream.streamUrl);
    setIsScheduled(!stream.isLive && stream.scheduledTime > Date.now());
    if (stream.scheduledTime) {
      const d = new Date(stream.scheduledTime);
      const isoLocal = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setScheduledDateTime(isoLocal);
    } else {
      setScheduledDateTime('');
    }
    setShowCreateModal(true);
  };

  const handleSaveStream = async () => {
    if (!title.trim() || !streamUrl) {
      alert(lang === 'ru' ? 'Заполните название и укажите ссылку или загрузите видео' : 'Fill title and provide stream video');
      return;
    }

    setIsSubmitting(true);
    try {
      const schedTime = isScheduled && scheduledDateTime ? new Date(scheduledDateTime).getTime() : Date.now();
      const liveStatus = !isScheduled || schedTime <= Date.now();

      if (editingStream) {
        // Edit existing stream
        const updatedData = {
          title: title.trim(),
          description: description.trim(),
          category,
          streamUrl,
          scheduledTime: schedTime,
          isLive: liveStatus
        };

        await updateDoc(doc(db, 'streams', editingStream.id), updatedData);

        setStreams(prev => prev.map(s => s.id === editingStream.id ? { ...s, ...updatedData } : s));
        if (activeStream?.id === editingStream.id) {
          setActiveStream(prev => prev ? { ...prev, ...updatedData } : null);
        }
      } else {
        // Create new stream
        const streamData: Omit<StreamItem, 'id'> = {
          title: title.trim(),
          description: description.trim(),
          streamerName: user?.displayName || 'Стример',
          streamerAvatar: user?.photoURL || '',
          authorUid: user?.uid || 'guest',
          streamUrl,
          scheduledTime: schedTime,
          isLive: liveStatus,
          category,
          createdAt: new Date().toISOString(),
          viewersCount: 1,
          likesCount: 0,
          likedBy: []
        };

        const docRef = await addDoc(collection(db, 'streams'), streamData);

        if (vercelFallback.isAvailable()) {
          try {
            await vercelFallback.lpush('streams', JSON.stringify({ id: docRef.id, ...streamData }));
          } catch (e) {}
        }
      }

      setShowCreateModal(false);
      setEditingStream(null);
    } catch (e) {
      console.error(e);
      alert('Ошибка при сохранении трансляции');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Instant Start Live Broadcast Action
  const handleStartStreamNow = async (stream: StreamItem) => {
    try {
      await updateDoc(doc(db, 'streams', stream.id), {
        isLive: true,
        scheduledTime: Date.now()
      });
      setForcePlay(true);
      setActiveStream(prev => prev ? { ...prev, isLive: true, scheduledTime: Date.now() } : null);
    } catch (e) {
      setForcePlay(true);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeStream) return;

    const msgText = chatInput.trim();
    setChatInput('');

    const newMsg: ChatMessage = {
      id: generatePrefixedId('chat_msg'),
      uid: user?.uid || 'guest',
      userName: user?.displayName || 'Гость',
      userAvatar: user?.photoURL || '',
      text: msgText,
      createdAt: Date.now()
    };

    try {
      await addDoc(collection(db, 'streams', activeStream.id, 'chat'), newMsg);
    } catch (e) {
      setChatMessages(prev => [...prev, newMsg]);
    }
  };

  const handleLike = async () => {
    if (!activeStream) return;

    if (hasLiked) {
      // Unlike
      setHasLiked(false);
      try {
        if (user) {
          await updateDoc(doc(db, 'streams', activeStream.id), {
            likesCount: increment(-1),
            likedBy: arrayRemove(user.uid)
          });
        }
      } catch (e) {}
    } else {
      // Like
      setHasLiked(true);
      try {
        if (user) {
          await updateDoc(doc(db, 'streams', activeStream.id), {
            likesCount: increment(1),
            likedBy: arrayUnion(user.uid)
          });
        }
      } catch (e) {}
    }
  };

  const handleDeleteStream = async (id: string) => {
    if (!window.confirm(lang === 'ru' ? 'Удалить этот стрим?' : 'Delete this stream?')) return;
    try {
      await deleteDoc(doc(db, 'streams', id));
      setStreams(prev => prev.filter(s => s.id !== id));
      if (activeStream?.id === id) {
        setActiveStream(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getStreamStatus = (stream: StreamItem): 'LIVE' | 'SCHEDULED' | 'REPLAY' => {
    if (forcePlay && activeStream?.id === stream.id) return 'LIVE';
    if (stream.isLive) return 'LIVE';
    if (stream.scheduledTime > Date.now()) return 'SCHEDULED';
    return 'REPLAY';
  };

  const formatSeconds = (sec: number): string => {
    if (isNaN(sec) || sec < 0) return '00:00';
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs > 0) {
      return `${hrs}:${remMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const activeStatus = activeStream ? getStreamStatus(activeStream) : 'SCHEDULED';
  const isScheduledNotStarted = activeStatus === 'SCHEDULED';
  const isReplay = activeStatus === 'REPLAY';

  const displayedChat = isReplay && currentVideoTime > 0
    ? chatMessages.filter(msg => msg.timestampSec === undefined || msg.timestampSec <= currentVideoTime)
    : chatMessages;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-[#251c35] rounded-3xl p-6 sm:p-8 border border-[#3d2b4f] shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 text-[#ff4d4d] text-xs font-black uppercase tracking-widest mb-3">
            <Radio size={14} className="animate-pulse" />
            {lang === 'ru' ? 'Прямой Эфир & Стримы' : 'Live Streams Platform'}
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight italic uppercase">
            {lang === 'ru' ? 'Трансляции и Стримы' : 'Broadcasts & Live Streams'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-2 max-w-xl">
            {lang === 'ru' 
              ? 'Смотрите прямые трансляции, планируйте стримы, общайтесь в чате в реальном времени и смотрите записи с синхронным чатом!' 
              : 'Watch live broadcasts, schedule upcoming streams, chat in real time, and watch recorded streams with synchronized chat!'}
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="relative z-10 flex items-center gap-2 bg-[#ff4d4d] hover:bg-white text-[#15101e] px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95 shadow-[0_0_25px_rgba(255,77,77,0.3)] shrink-0 cursor-pointer"
        >
          <Plus size={18} />
          {lang === 'ru' ? 'Создать Стрим' : 'Create Stream'}
        </button>
      </div>

      {/* Main Broadcast Viewer & Chat Grid */}
      {activeStream ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stream Player & Info (2 Columns on Large Screens) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#15101e] rounded-3xl overflow-hidden border border-[#3d2b4f] shadow-2xl relative">
              {isScheduledNotStarted ? (
                /* Scheduled Stream Countdown Screen (Locked for Regular Viewers) */
                <div className="relative aspect-video bg-[#0d0b14] flex flex-col items-center justify-center p-6 sm:p-8 text-center border border-[#ff4d4d]/20 rounded-3xl">
                  <div className="w-16 h-16 rounded-3xl bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 flex items-center justify-center mb-4 text-[#ff4d4d] animate-bounce">
                    <Calendar size={32} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-[#ff4d4d] mb-2">
                    Запланированная Трансляция
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white max-w-lg mb-4">
                    {activeStream.title}
                  </h3>

                  {countdown && (
                    <div className="bg-[#15101e] border border-[#3d2b4f] px-6 py-3 rounded-2xl font-mono text-xl sm:text-3xl font-black text-white tracking-widest shadow-xl mb-6">
                      {countdown}
                    </div>
                  )}

                  {/* Instant Start Button for Streamer/Admin OR Waiting Info for Viewers */}
                  {(user?.uid === activeStream.authorUid || role === 'admin') ? (
                    <div className="space-y-3">
                      <button
                        onClick={() => handleStartStreamNow(activeStream)}
                        className="px-6 py-3.5 bg-[#ff4d4d] hover:bg-white text-[#15101e] font-black uppercase tracking-widest text-xs rounded-2xl shadow-[0_0_20px_rgba(255,77,77,0.4)] transition-all flex items-center gap-2 hover:scale-105 cursor-pointer mx-auto"
                      >
                        <Play size={16} className="fill-current" />
                        Запустить Эфир Прямо Сейчас
                      </button>
                      <p className="text-[11px] text-gray-400">
                        Вы являетесь автором трансляции. Нажмите для досрочного запуска эфира.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-[#251c35] border border-[#3d2b4f] p-4 rounded-2xl max-w-md text-xs text-gray-300">
                      <p className="font-bold text-white mb-1 flex items-center justify-center gap-2">
                        <Clock size={14} className="text-[#ff4d4d]" />
                        Трансляция ещё не началась
                      </p>
                      <p className="text-gray-400">
                        Стрим станет доступен к просмотру сразу после запуска эфира в назначенное время.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Live or Replay Video Player */
                <div className="relative">
                  <KuruVideoPlayer
                    src={activeStream.streamUrl}
                    isCompact={false}
                    onTimeUpdate={(curr) => setCurrentVideoTime(curr)}
                  />
                  <div className="absolute top-4 left-4 z-20 pointer-events-none flex gap-2">
                    {activeStatus === 'LIVE' ? (
                      <span className="bg-red-600/90 text-white font-black text-xs uppercase tracking-widest px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-xl border border-red-400/50 backdrop-blur-md">
                        <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                        ПРЯМОЙ ЭФИР
                      </span>
                    ) : (
                      <span className="bg-[#15101e]/90 text-red-400 border border-[#ff4d4d]/40 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-xl backdrop-blur-md">
                        <Video size={14} className="text-[#ff4d4d]" />
                        ЗАПИСЬ СТРИМА
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Stream Title Bar */}
              <div className="p-5 bg-[#251c35]/80 border-t border-[#3d2b4f] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={activeStream.streamerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeStream.streamerName)}&background=ff4d4d&color=fff`}
                      alt="Avatar"
                      className="w-12 h-12 rounded-2xl border border-[#ff4d4d]/30 object-cover"
                    />
                    {activeStatus === 'LIVE' && (
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 border-2 border-[#15101e] rounded-full animate-ping" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-white text-lg leading-tight flex items-center gap-2">
                      {activeStream.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                      <span className="font-bold text-[#ff4d4d]">{activeStream.streamerName}</span>
                      <span>•</span>
                      <span className="uppercase text-[10px] font-black bg-[#15101e] px-2 py-0.5 rounded-lg border border-[#3d2b4f]">
                        {activeStream.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Real Viewers Count */}
                  <div className="flex items-center gap-1.5 bg-[#15101e] px-3 py-1.5 rounded-xl border border-[#3d2b4f] text-xs font-bold text-gray-300">
                    <Users size={14} className="text-[#ff4d4d]" />
                    <span>{Math.max(1, activeStream.viewersCount || 1)} {lang === 'ru' ? 'зрителей' : 'viewers'}</span>
                  </div>

                  {/* Real Likes Count */}
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      hasLiked
                        ? 'bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_12px_rgba(255,77,77,0.3)]'
                        : 'bg-[#15101e] border-[#3d2b4f] text-gray-300 hover:text-red-400 hover:border-red-500/50'
                    }`}
                  >
                    <Heart size={14} className={hasLiked ? 'fill-red-500 text-red-500' : ''} />
                    <span>{activeStream.likesCount || 0}</span>
                  </button>

                  {/* Stream Edit Button for Author or Admin */}
                  {(user?.uid === activeStream.authorUid || role === 'admin') && (
                    <>
                      <button
                        onClick={() => openEditModal(activeStream)}
                        className="p-2 bg-[#15101e] hover:bg-[#3d2b4f] text-gray-200 hover:text-white rounded-xl border border-[#3d2b4f] transition-all cursor-pointer"
                        title="Редактировать стрим"
                      >
                        <Edit size={16} />
                      </button>

                      <button
                        onClick={() => handleDeleteStream(activeStream.id)}
                        className="p-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl border border-red-500/30 transition-all cursor-pointer"
                        title="Удалить стрим"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Stream Live Chat / Synchronized Replay Chat */}
          <div className="bg-[#251c35] rounded-3xl border border-[#3d2b4f] shadow-2xl flex flex-col h-[520px] overflow-hidden">
            <div className="p-4 border-b border-[#3d2b4f] bg-[#15101e]/80 flex items-center justify-between">
              <span className="font-black text-xs uppercase tracking-widest text-white flex items-center gap-2">
                <Sparkles size={14} className="text-[#ff4d4d]" />
                {isReplay ? 'Чат Записи Стрима' : (lang === 'ru' ? 'Чат Трансляции' : 'Live Stream Chat')}
              </span>
              {isReplay ? (
                <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/30 uppercase tracking-widest flex items-center gap-1">
                  <Clock size={10} />
                  Синхронизирован
                </span>
              ) : (
                <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/30 uppercase tracking-widest">
                  Онлайн
                </span>
              )}
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 no-scrollbar font-sans">
              {displayedChat.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-xs font-medium">
                  {isReplay ? 'На данном моменте записи комментариев ещё нет.' : 'Сообщений пока нет. Напишите первым!'}
                </div>
              ) : (
                displayedChat.map(msg => (
                  <div key={msg.id} className="flex items-start gap-2 text-xs">
                    <img
                      src={msg.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.userName)}&background=251c35&color=fff`}
                      alt="User"
                      className="w-6 h-6 rounded-full border border-[#3d2b4f] shrink-0 mt-0.5"
                    />
                    <div className="bg-[#15101e]/80 p-2.5 rounded-2xl border border-[#3d2b4f]/50 max-w-[85%] break-words">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-bold text-[#ff4d4d]">{msg.userName}:</span>
                        {msg.timestampSec !== undefined && (
                          <span className="text-[10px] text-gray-400 font-mono bg-[#251c35] px-1.5 py-0.2 rounded border border-[#3d2b4f]">
                            [{formatSeconds(msg.timestampSec)}]
                          </span>
                        )}
                      </div>
                      <span className="text-gray-200">{msg.text}</span>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-[#3d2b4f] bg-[#15101e] flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={user ? (isReplay ? 'Комментарий к моменту...' : (lang === 'ru' ? 'Написать в чат...' : 'Send a message...')) : (lang === 'ru' ? 'Войдите для общения' : 'Log in to chat')}
                disabled={!user}
                className="flex-1 bg-[#251c35] border border-[#3d2b4f] rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#ff4d4d] transition-all"
              />
              <button
                type="submit"
                disabled={!user || !chatInput.trim()}
                className="bg-[#ff4d4d] hover:bg-white text-[#15101e] px-4 rounded-xl font-black transition-all disabled:opacity-40 cursor-pointer"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {/* Stream List Grid */}
      <div className="space-y-4">
        <h3 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Radio size={20} className="text-[#ff4d4d]" />
          {lang === 'ru' ? 'Все Стримы и Трансляции' : 'All Streams'}
        </h3>

        {streams.length === 0 ? (
          <div className="bg-[#251c35] rounded-3xl p-12 text-center border border-[#3d2b4f]">
            <Radio size={48} className="text-gray-600 mx-auto mb-4 animate-pulse" />
            <p className="text-white font-bold text-lg">Стримов пока нет</p>
            <p className="text-gray-400 text-xs mt-1">Создайте первый стрим или запланируйте трансляцию!</p>
            <button
              onClick={openCreateModal}
              className="mt-6 inline-flex items-center gap-2 bg-[#ff4d4d] text-[#15101e] font-black text-xs px-6 py-3 rounded-xl hover:bg-white transition-all cursor-pointer"
            >
              <Plus size={16} />
              Создать Стрим
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {streams.map(stream => {
              const status = getStreamStatus(stream);
              const isSelected = activeStream?.id === stream.id;

              return (
                <div
                  key={stream.id}
                  onClick={() => {
                    setActiveStream(stream);
                    setForcePlay(false);
                    setCurrentVideoTime(0);
                  }}
                  className={`group relative bg-[#251c35] rounded-3xl overflow-hidden border transition-all cursor-pointer hover:scale-[1.02] ${
                    isSelected
                      ? 'border-[#ff4d4d] shadow-[0_0_20px_rgba(255,77,77,0.3)]'
                      : 'border-[#3d2b4f] hover:border-[#ff4d4d]/50'
                  }`}
                >
                  <div className="relative aspect-video bg-[#0d0b14] overflow-hidden">
                    {status === 'SCHEDULED' ? (
                      /* Scheduled Stream Poster Card (No Video Player) */
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-[#251c35] to-[#15101e]">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-2">
                          <Calendar size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20 mb-1">
                          Запланирован
                        </span>
                        <span className="text-xs text-gray-300 font-bold">
                          {new Date(stream.scheduledTime).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ) : (
                      /* Live or Replay Video Preview */
                      <KuruVideoPlayer src={stream.streamUrl} isCompact={true} />
                    )}

                    {/* Status Badge Tag */}
                    <div className="absolute top-3 left-3 flex gap-2 z-20 pointer-events-none">
                      {status === 'LIVE' && (
                        <span className="bg-red-600 text-white font-black text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                          LIVE
                        </span>
                      )}
                      {status === 'SCHEDULED' && (
                        <span className="bg-purple-600 text-white font-black text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                          <Clock size={12} />
                          Запланирован
                        </span>
                      )}
                      {status === 'REPLAY' && (
                        <span className="bg-[#15101e]/90 border border-[#ff4d4d]/40 text-red-400 font-black text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                          <Video size={12} />
                          Запись
                        </span>
                      )}
                    </div>

                    {/* Clean Card Hover Action Badge */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-10">
                      <span className="px-4 py-2 bg-[#ff4d4d] text-[#15101e] font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-2">
                        {status === 'SCHEDULED' ? (
                          <>
                            <Clock size={14} />
                            Информация
                          </>
                        ) : status === 'LIVE' ? (
                          <>
                            <Play size={14} className="fill-current" />
                            Смотреть Эфир
                          </>
                        ) : (
                          <>
                            <Video size={14} />
                            Смотреть Запись
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <h4 className="font-black text-white text-base line-clamp-1 group-hover:text-[#ff4d4d] transition-colors">
                      {stream.title}
                    </h4>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className="font-bold text-gray-300">{stream.streamerName}</span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-red-400 font-bold">
                          <Heart size={12} className="fill-current" />
                          {stream.likesCount || 0}
                        </span>
                        <span className="uppercase text-[10px] font-black bg-[#15101e] px-2 py-0.5 rounded-lg border border-[#3d2b4f]">
                          {stream.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Stream Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#15101e] rounded-3xl w-full max-w-xl p-6 sm:p-8 border border-[#3d2b4f] shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[#3d2b4f] pb-4">
                <h3 className="text-xl font-black text-white uppercase italic tracking-wider flex items-center gap-2">
                  <Radio className="text-[#ff4d4d]" size={22} />
                  {editingStream 
                    ? (lang === 'ru' ? 'Редактирование Стрима' : 'Edit Stream')
                    : (lang === 'ru' ? 'Создание / Планирование Стрима' : 'Create Stream')}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingStream(null);
                  }}
                  className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 text-xs font-sans">
                <div>
                  <label className="block text-gray-400 font-bold mb-1 uppercase tracking-wider">Название трансляции</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Например: Прямой эфир — Разбор обновлений Kuru"
                    className="w-full bg-[#251c35] border border-[#3d2b4f] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff4d4d]"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-bold mb-1 uppercase tracking-wider">Категория</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#251c35] border border-[#3d2b4f] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff4d4d]"
                  >
                    <option value="игры">Игры & Гейминг</option>
                    <option value="новости">Новости & Анонсы</option>
                    <option value="разработка">Разработка & IT</option>
                    <option value="музыка">Музыка & Радио</option>
                  </select>
                </div>

                {/* Video Selection */}
                <div className="bg-[#251c35] p-4 rounded-2xl border border-[#3d2b4f] space-y-3">
                  <label className="block text-white font-bold uppercase tracking-wider">Видеозапись или ссылка на эфир</label>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="file"
                      id="stream-video-file"
                      className="hidden"
                      accept="video/*"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                    <label
                      htmlFor="stream-video-file"
                      className={`bg-[#15101e] border border-[#3d2b4f] hover:border-[#ff4d4d] text-white px-4 py-2.5 rounded-xl font-bold cursor-pointer flex items-center gap-2 transition-all ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <Camera size={14} className="text-[#ff4d4d]" />
                      Загрузить видеофайл
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={streamUrlInput}
                      onChange={(e) => setStreamUrlInput(e.target.value)}
                      placeholder="Или вставьте ссылку на MP4 / HLS / YouTube"
                      className="flex-1 bg-[#15101e] border border-[#3d2b4f] rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-[#ff4d4d]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (streamUrlInput.trim()) {
                          setStreamUrl(streamUrlInput.trim());
                        }
                      }}
                      className="bg-[#ff4d4d] text-[#15101e] font-black px-4 py-2 rounded-xl"
                    >
                      Применить
                    </button>
                  </div>

                  {streamUrl && (
                    <div className="p-3 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl flex items-center justify-between">
                      <span className="truncate max-w-xs font-mono">{streamUrl}</span>
                      <button onClick={() => setStreamUrl('')} className="text-red-400 font-bold">Удалить</button>
                    </div>
                  )}
                </div>

                {/* Schedule Checkbox */}
                <div className="flex items-center gap-3 bg-[#251c35] p-3 rounded-2xl border border-[#3d2b4f]">
                  <input
                    type="checkbox"
                    id="schedule-toggle"
                    checked={isScheduled}
                    onChange={(e) => setIsScheduled(e.target.checked)}
                    className="w-4 h-4 accent-[#ff4d4d]"
                  />
                  <label htmlFor="schedule-toggle" className="text-white font-bold cursor-pointer">
                    Запланировать трансляцию на определенное время
                  </label>
                </div>

                {isScheduled && (
                  <div>
                    <label className="block text-gray-400 font-bold mb-1 uppercase tracking-wider">Дата и время начала</label>
                    <input
                      type="datetime-local"
                      value={scheduledDateTime}
                      onChange={(e) => setScheduledDateTime(e.target.value)}
                      className="w-full bg-[#251c35] border border-[#3d2b4f] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff4d4d]"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#3d2b4f]">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingStream(null);
                  }}
                  className="px-5 py-3 rounded-xl text-xs font-bold text-gray-400 hover:text-white"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSaveStream}
                  disabled={isSubmitting || !title.trim() || !streamUrl}
                  className="px-6 py-3 bg-[#ff4d4d] hover:bg-white text-[#15101e] font-black text-xs uppercase tracking-widest rounded-xl transition-all disabled:opacity-40"
                >
                  {editingStream 
                    ? 'Сохранить Изменения' 
                    : (isScheduled ? 'Запланировать Стрим' : 'Запустить Стрим')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

