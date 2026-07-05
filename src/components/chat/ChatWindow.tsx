import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useChat, Message } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { translations, Language } from '../../data/translations';
import { GoogleLoginButton } from '../ui/GoogleLoginButton';
import { Send, X, User, Reply, Smile, Sticker, Pencil, Trash2, Ban, Copy, Check, CheckCheck, ChevronDown, Image as ImageIcon, ShieldAlert, Sparkles, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, isSameDay, isToday, isYesterday } from 'date-fns';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

const STICKERS = ['👋', '👍', '❤️', '😂', '🔥', '🎉', '👀', '💯'];
import { CHAT_REACTIONS } from '../../constants/reactions';

interface ChatWindowProps {
  recipientId: string;
  recipientName: string;
  recipientPhoto?: string;
  lang: Language;
  onClose: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ recipientId, recipientName, recipientPhoto, lang, onClose }) => {
  const { user } = useAuth();
  const { chats, messages, sendMessage, toggleReaction, deleteMessage, editMessage, setTyping, markChatAsRead } = useChat(recipientId);
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
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && recipientId === user.uid) {
      onClose();
    }
  }, [user, recipientId, onClose]);

  const currentChat = chats.find(c => c.participants.includes(recipientId));
  const isRecipientTyping = currentChat?.typing?.[recipientId];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      markChatAsRead(recipientId);
    }
  }, [messages.length, recipientId]);

  useEffect(() => {
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
        <div className="p-4 bg-[#09050d] border-b border-[#311c47] flex items-center justify-between shrink-0 z-20 shadow-lg relative">
          <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#ff4d4d]/20 to-transparent" />
          <div className="flex items-center gap-3">
            <div className="relative">
              {recipientPhoto ? (
                <img src={recipientPhoto} alt="" className="w-10 h-10 rounded-2xl object-cover border-2 border-[#ff4d4d]/30 shadow-[0_0_15px_rgba(255,77,77,0.2)]" />
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-[#ff4d4d]/10 flex items-center justify-center border-2 border-[#ff4d4d]/30 shadow-[0_0_15px_rgba(255,77,77,0.2)]">
                  <User className="w-5 h-5 text-[#ff4d4d]" />
                </div>
              )}
              <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-[#09050d] rounded-full transition-colors ${
                isUserOnline() 
                  ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' 
                  : 'bg-gray-600'
              }`} />
            </div>
            <div>
              <span className="font-black text-white text-sm sm:text-base uppercase tracking-wider block leading-none mb-1">{recipientName}</span>
              <div className="flex items-center gap-2">
                {isUserOnline() ? (
                  <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    {t.chatOnline}
                  </span>
                ) : (
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3d2b4f]"></span>
                    {t.chatOffline}
                  </span>
                )}
                <span className="text-[8px] text-[#ff4d4d] font-black uppercase tracking-wider border border-[#ff4d4d]/30 bg-[#ff4d4d]/5 px-2 py-0.5 rounded flex items-center gap-1">
                  <Sparkles size={8} /> AHA SECURE E/D
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#1a0f26] border border-transparent hover:border-[#3d2b4f]/40 rounded-xl transition-all text-gray-400 hover:text-white active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} relative group ${msg.reactions && Object.keys(msg.reactions).some(k => msg.reactions![k].length > 0) ? 'mb-5' : ''}`}
                        >
                          {/* Premium Action Menu */}
                          <AnimatePresence>
                            {activeMessageId === msg.id && !msg.isDeleted && (
                              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md" onClick={(e) => { e.stopPropagation(); setActiveMessageId(null); }}>
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  className="bg-[#130b1c] border border-[#3e245a] rounded-3xl p-2 flex flex-col shadow-2xl w-full max-w-xs"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="px-4 py-3 border-b border-[#3e245a]/50 mb-1">
                                    <h4 className="text-white text-xs font-black uppercase tracking-widest text-center">Действия</h4>
                                  </div>
                                  <div className="flex items-center justify-between px-3 py-2 border-b border-[#3e245a]/50 bg-[#0a050f]/80 rounded-2xl mb-1">
                                    {CHAT_REACTIONS.map(emoji => (
                                      <button
                                        key={emoji}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleReaction(msg.id, recipientId, emoji);
                                          setActiveMessageId(null);
                                        }}
                                        className={`text-2xl hover:scale-130 transition-all p-1.5 duration-200 rounded-xl ${msg.reactions?.[emoji]?.includes(user?.uid || '') ? 'bg-[#ff4d4d]/10 border border-[#ff4d4d]/30' : 'hover:bg-[#ff4d4d]/5'}`}
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                  <button onClick={(e) => { e.stopPropagation(); setReplyingTo(msg); setActiveMessageId(null); }} className="flex items-center gap-3 px-4 py-3 hover:bg-[#ff4d4d]/5 rounded-xl text-gray-300 hover:text-white transition-all text-sm font-semibold">
                                    <Reply className="w-4 h-4 text-[#ff4d4d]" /> {t.chatReply || "Reply"}
                                  </button>
                                  {msg.type !== 'sticker' && (
                                    <button onClick={(e) => { e.stopPropagation(); handleCopy(msg.text); setActiveMessageId(null); }} className="flex items-center gap-3 px-4 py-3 hover:bg-[#ff4d4d]/5 rounded-xl text-gray-300 hover:text-white transition-all text-sm font-semibold">
                                      <Copy className="w-4 h-4 text-[#ff4d4d]" /> {t.chatCopy || "Copy"}
                                    </button>
                                  )}
                                  {isMe && msg.type !== 'sticker' && (
                                    <button onClick={(e) => { e.stopPropagation(); setEditingMessage(msg); setInputText(msg.text); setActiveMessageId(null); }} className="flex items-center gap-3 px-4 py-3 hover:bg-[#ff4d4d]/5 rounded-xl text-gray-300 hover:text-white transition-all text-sm font-semibold">
                                      <Pencil className="w-4 h-4 text-[#ff4d4d]" /> {t.chatEdit || "Edit"}
                                    </button>
                                  )}
                                  {isMe && (
                                    <button onClick={(e) => { e.stopPropagation(); deleteMessage(msg.id, recipientId); setActiveMessageId(null); }} className="flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 rounded-xl text-red-400 hover:text-red-300 transition-all text-sm font-bold mt-1 border-t border-[#3e245a]/30">
                                      <Trash2 className="w-4 h-4" /> {t.chatDelete || "Delete"}
                                    </button>
                                  )}
                                </motion.div>
                              </div>
                            )}
                          </AnimatePresence>

                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!msg.isDeleted) {
                                setActiveMessageId(activeMessageId === msg.id ? null : msg.id);
                              }
                            }}
                            className={`max-w-[85%] p-3.5 sm:p-4 rounded-3xl text-sm sm:text-base shadow-lg relative cursor-pointer transition-all duration-200 active:scale-[0.98] ${
                              msg.type === 'sticker' && !msg.isDeleted
                                ? 'bg-transparent shadow-none p-0' 
                                : isMe
                                  ? 'bg-gradient-to-br from-[#ff4d4d] to-[#cc2929] text-[#0d0714] rounded-tr-sm font-medium'
                                  : 'bg-[#150e21] text-gray-100 rounded-tl-sm border border-[#2e1d44]/70 hover:border-[#ff4d4d]/30'
                            } ${msg.isDeleted ? 'opacity-40 italic' : ''}`}
                          >
                            {repliedMsg && msg.type !== 'sticker' && !msg.isDeleted && (
                              <div className={`mb-2.5 p-2 rounded-xl text-xs border-l-2 ${isMe ? 'bg-[#0d0714]/15 border-[#0d0714]/40' : 'bg-[#0d0714]/40 border-[#ff4d4d]/50'}`}>
                                <span className="font-bold opacity-70 block mb-0.5">
                                  {repliedMsg.senderId === user?.uid ? (t.chatYou || "You") : recipientName}
                                </span>
                                <span className="opacity-80 line-clamp-1">
                                  {repliedMsg.isDeleted ? (t.chatMessageDeleted || "Deleted") : (repliedMsg.type === 'sticker' ? 'Sticker' : repliedMsg.text)}
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
                                isRead ? <CheckCheck className={`w-3.5 h-3.5 ml-0.5 ${msg.type === 'sticker' ? 'text-blue-400' : 'text-[#0d0714]'}`} /> : <Check className={`w-3.5 h-3.5 ml-0.5 ${msg.type === 'sticker' ? 'text-gray-400' : 'opacity-60'}`} />
                              )}
                            </div>

                            {msg.reactions && Object.keys(msg.reactions).length > 0 && !msg.isDeleted && (
                              <div className={`absolute -bottom-3 ${isMe ? 'right-2' : 'left-2'} flex items-center gap-1 bg-[#1c0f2a] border border-[#3e245a] rounded-full px-2 py-0.5 shadow-md z-10 hover:border-[#ff4d4d]/40 transition-colors`}>
                                {Object.entries(msg.reactions).map(([emoji, users]) => users.length > 0 && (
                                  <button
                                    key={emoji}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleReaction(msg.id, recipientId, emoji);
                                    }}
                                    className={`flex items-center gap-1 text-[10px] ${users.includes(user?.uid || '') ? 'text-[#ff4d4d]' : 'text-gray-400'}`}
                                  >
                                    <span>{emoji}</span>
                                    <span className="font-bold">{users.length}</span>
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
                  <button
                    type="submit"
                    disabled={(!inputText.trim() && selectedImages.length === 0) || isSending}
                    className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-[#ff4d4d] hover:bg-white disabled:opacity-20 disabled:cursor-not-allowed text-[#0d0714] hover:scale-105 disabled:scale-100 rounded-full transition-all active:scale-95 shrink-0 mr-1 shadow-lg shadow-[#ff4d4d]/10"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </div>
              </form>
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
    </>
  );
};
