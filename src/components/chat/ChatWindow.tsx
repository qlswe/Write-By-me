import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useChat, Message } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { translations, Language } from '../../data/translations';
import { Send, X, User, Reply, Smile, Sticker, Pencil, Trash2, Ban, Copy, Check, CheckCheck, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, isSameDay, isToday, isYesterday } from 'date-fns';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
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
  const { user, loginWithGoogle } = useAuth();
  const { chats, messages, sendMessage, toggleReaction, deleteMessage, editMessage, setTyping, markChatAsRead } = useChat(recipientId);
  const t = translations[lang];
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

  const currentChat = chats.find(c => c.participants.includes(recipientId));
  const isRecipientTyping = currentChat?.typing?.[recipientId];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    if (messages.length > 0) {
      markChatAsRead(recipientId);
    }
  }, [messages]);

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
    // Consider online if lastSeen was within the last 3 minutes
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
    
    // Clear the input value so the same files can be selected again
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
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 sm:inset-auto sm:bottom-4 sm:right-4 sm:w-[400px] sm:h-[600px] bg-[#15101e] sm:border sm:border-[#251c35] sm:rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden z-50"
      >
        {/* Header */}
        <div className="p-3 sm:p-4 bg-[#0d0b14] border-b border-[#3d2b4f]/30 flex items-center justify-between shrink-0 z-20 shadow-md">
          <div className="flex items-center gap-3">
            <div className="relative">
              {recipientPhoto ? (
                <img src={recipientPhoto} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl object-cover border-2 border-[#ff4d4d]/30 shadow-[0_0_10px_rgba(255,77,77,0.15)]" />
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#ff4d4d]/20 flex items-center justify-center border-2 border-[#ff4d4d]/30 shadow-[0_0_10px_rgba(255,77,77,0.15)]">
                  <User className="w-5 h-5 text-[#ff4d4d]" />
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#0d0b14] rounded-full shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
            </div>
            <div>
              <span className="font-black text-white text-sm sm:text-base uppercase tracking-wider block leading-none mb-1">{recipientName}</span>
              <div className="flex items-center gap-2">
                {isUserOnline() ? (
                  <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    {t.chatOnline}
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3d2b4f]"></span>
                    {t.chatOffline}
                  </span>
                )}
                <span className="text-[8px] text-[#ff4d4d]/60 font-black uppercase tracking-tighter border border-[#ff4d4d]/20 px-1.5 py-0.5 rounded">Aha radio E/D</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-all text-gray-400 hover:text-white active:scale-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {!user ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-[#ff4d4d]/10 rounded-full flex items-center justify-center border border-[#ff4d4d]/20">
              <User className="w-10 h-10 text-[#ff4d4d]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-white uppercase tracking-tight">
                {(t as any).chatAuthRequired || t.chatAuthRequired}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {(t as any).chatAuthDesc || t.chatsLoginToView}
              </p>
            </div>
            <button
              onClick={loginWithGoogle}
              className="w-full bg-white text-[#15101e] py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-white/90 transition-all active:scale-95 shadow-xl"
            >
              {t.maintenanceLoginGoogle}
            </button>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div 
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 custom-scrollbar bg-[#0f0c1b] relative"
            >
              {activeMessageId && (
                <div className="fixed inset-0 z-40" onClick={() => setActiveMessageId(null)} />
              )}
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-40">
                  <div className="w-16 h-16 bg-[#ff4d4d]/5 rounded-full flex items-center justify-center border border-[#ff4d4d]/10">
                    <Send className="w-8 h-8 text-[#ff4d4d]" />
                  </div>
                  <p className="text-sm font-bold uppercase tracking-widest text-gray-400">
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
                            <span className="bg-[#15101e] text-gray-300 text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border border-[#3d2b4f]/30 shadow-lg">
                              {formatDateSeparator(msgDate)}
                            </span>
                          </div>
                        )}
                        <motion.div
                          initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} relative group ${msg.reactions && Object.keys(msg.reactions).some(k => msg.reactions![k].length > 0) ? 'mb-4' : ''}`}
                        >
                          {/* Modern Action Menu - Centered Modal */}
                          <AnimatePresence>
                            {activeMessageId === msg.id && !msg.isDeleted && (
                              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); setActiveMessageId(null); }}>
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                  className="bg-[#15101e] border border-[#3d2b4f] rounded-3xl p-2 flex flex-col shadow-2xl w-full max-w-xs"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="px-4 py-3 border-b border-[#3d2b4f]/50 mb-1">
                                    <h4 className="text-white font-bold text-center">{(t as any).chatActions || t.profileUses}</h4>
                                  </div>
                                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#3d2b4f]/50 bg-[#15101e]/50">
                                    {CHAT_REACTIONS.map(emoji => (
                                      <button
                                        key={emoji}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleReaction(msg.id, recipientId, emoji);
                                          setActiveMessageId(null);
                                        }}
                                        className={`text-2xl hover:scale-125 transition-transform p-1 ${msg.reactions?.[emoji]?.includes(user?.uid || '') ? 'bg-[#ff4d4d]/20 rounded-full' : ''}`}
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                  <button onClick={(e) => { e.stopPropagation(); setReplyingTo(msg); setActiveMessageId(null); }} className="flex items-center gap-3 px-4 py-3.5 hover:bg-[#ff4d4d]/10 rounded-xl text-gray-300 hover:text-white transition-colors text-base font-medium">
                                    <Reply className="w-5 h-5 text-[#ff4d4d]" /> {(t as any).chatReply || "Reply"}
                                  </button>
                                  {msg.type !== 'sticker' && (
                                    <button onClick={(e) => { e.stopPropagation(); handleCopy(msg.text); setActiveMessageId(null); }} className="flex items-center gap-3 px-4 py-3.5 hover:bg-[#ff4d4d]/10 rounded-xl text-gray-300 hover:text-white transition-colors text-base font-medium">
                                      <Copy className="w-5 h-5 text-[#ff4d4d]" /> {(t as any).chatCopy || "Copy"}
                                    </button>
                                  )}
                                  {isMe && msg.type !== 'sticker' && (
                                    <button onClick={(e) => { e.stopPropagation(); setEditingMessage(msg); setInputText(msg.text); setActiveMessageId(null); }} className="flex items-center gap-3 px-4 py-3.5 hover:bg-[#ff4d4d]/10 rounded-xl text-gray-300 hover:text-white transition-colors text-base font-medium">
                                      <Pencil className="w-5 h-5 text-[#ff4d4d]" /> {(t as any).chatEdit || t.profileSave}
                                    </button>
                                  )}
                                  {isMe && (
                                    <button onClick={(e) => { e.stopPropagation(); deleteMessage(msg.id, recipientId); setActiveMessageId(null); }} className="flex items-center gap-3 px-4 py-3.5 hover:bg-red-500/10 rounded-xl text-red-400 hover:text-red-300 transition-colors text-base font-medium mt-1 border-t border-[#3d2b4f]/30">
                                      <Trash2 className="w-5 h-5" /> {(t as any).chatDelete || "Delete"}
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
                            className={`max-w-[85%] p-3 sm:p-4 rounded-2xl text-sm sm:text-base shadow-sm relative cursor-pointer transition-transform active:scale-[0.98] ${
                              msg.type === 'sticker' && !msg.isDeleted
                                ? 'bg-transparent shadow-none p-0' 
                                : isMe
                                  ? 'bg-[#ff4d4d] text-[#0d0b14] rounded-tr-sm font-medium'
                                  : 'bg-[#15101e] text-gray-100 rounded-tl-sm border border-[#3d2b4f]/30'
                            } ${msg.isDeleted ? 'opacity-50 italic' : ''}`}
                          >
                            {repliedMsg && msg.type !== 'sticker' && !msg.isDeleted && (
                              <div className={`mb-2 p-2 rounded-lg text-xs border-l-2 ${isMe ? 'bg-[#15101e]/10 border-[#15101e]/30' : 'bg-[#15101e]/30 border-[#ff4d4d]/50'}`}>
                                <span className="font-bold opacity-70 block mb-0.5">
                                  {repliedMsg.senderId === user?.uid ? ((t as any).chatYou || "You") : recipientName}
                                </span>
                                <span className="opacity-80 line-clamp-1">
                                  {repliedMsg.isDeleted ? ((t as any).chatMessageDeleted || "Deleted") : (repliedMsg.type === 'sticker' ? 'Sticker' : repliedMsg.text)}
                                </span>
                              </div>
                            )}
                            
                            {msg.isDeleted ? (
                              <div className="flex items-center gap-2">
                                <Ban className="w-4 h-4 opacity-50" />
                                <span>{msg.text}</span>
                              </div>
                            ) : msg.type === 'sticker' ? (
                              <div className="text-6xl filter drop-shadow-lg">{msg.text}</div>
                            ) : msg.type === 'image' ? (
                              <div className="flex flex-col gap-2">
                                {msg.images && msg.images.length > 0 ? (
                                  <div className={`grid ${msg.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
                                    {msg.images.map((img, i) => (
                                      <img key={i} src={img} alt="Sent image" className="max-w-full rounded-xl cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setFullscreenImage(img)} />
                                    ))}
                                  </div>
                                ) : (
                                  <img src={msg.text} alt="Sent image" className="max-w-[200px] sm:max-w-[250px] rounded-xl cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setFullscreenImage(msg.text)} />
                                )}
                                {msg.text && msg.images && msg.images.length > 0 && (
                                  <p className="break-words leading-relaxed mt-1">{msg.text}</p>
                                )}
                              </div>
                            ) : (
                              <p className="break-words leading-relaxed">{msg.text}</p>
                            )}
                            
                            <div className={`text-[10px] mt-1.5 font-bold opacity-70 flex items-center gap-1 ${isMe ? 'justify-end' : 'justify-start'} ${msg.type === 'sticker' && !msg.isDeleted ? 'text-gray-400' : ''}`}>
                              {msg.isEdited && !msg.isDeleted && <span>({t.edited || "edited"})</span>}
                              {msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'HH:mm') : ''}
                              {isMe && !msg.isDeleted && (
                                isRead ? <CheckCheck className={`w-3.5 h-3.5 ml-0.5 ${msg.type === 'sticker' ? 'text-blue-400' : 'text-[#0d0b14]'}`} /> : <Check className={`w-3.5 h-3.5 ml-0.5 ${msg.type === 'sticker' ? 'text-gray-400' : 'opacity-60'}`} />
                              )}
                            </div>

                            {msg.reactions && Object.keys(msg.reactions).length > 0 && !msg.isDeleted && (
                              <div className={`absolute -bottom-3 ${isMe ? 'right-2' : 'left-2'} flex items-center gap-1 bg-[#251c35] border border-[#3d2b4f] rounded-full px-2 py-0.5 shadow-lg z-10`}>
                                {Object.entries(msg.reactions).map(([emoji, users]) => users.length > 0 && (
                                  <button
                                    key={emoji}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleReaction(msg.id, recipientId, emoji);
                                    }}
                                    className={`flex items-center gap-1 text-xs ${users.includes(user?.uid || '') ? 'text-[#ff4d4d]' : 'text-gray-400'}`}
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
              <div ref={messagesEndRef} />
            </div>

            {/* Scroll to Bottom Button */}
            <AnimatePresence>
              {showScrollButton && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 20 }}
                  onClick={scrollToBottom}
                  className="absolute bottom-24 right-6 w-10 h-10 bg-[#251c35] border border-[#3d2b4f] rounded-full flex items-center justify-center text-[#ff4d4d] shadow-xl hover:bg-[#3d2b4f] transition-colors z-20"
                >
                  <ChevronDown className="w-5 h-5" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="bg-[#251c35] border-t border-[#251c35] shrink-0 relative">
              {/* Reply Banner */}
              <AnimatePresence>
                {replyingTo && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 py-2 bg-[#15101e]/50 border-b border-[#3d2b4f]/30 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Reply className="w-4 h-4 text-[#ff4d4d] shrink-0" />
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-xs font-bold text-[#ff4d4d]">
                          {replyingTo.senderId === user?.uid ? (t.you || 'You') : recipientName}
                        </span>
                        <span className="text-xs text-gray-300 truncate">
                          {replyingTo.type === 'sticker' ? 'Sticker' : replyingTo.text}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
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
                    className="absolute bottom-full left-0 w-full p-4 bg-[#15101e] border-t border-[#3d2b4f] shadow-2xl z-20"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-gray-300 uppercase tracking-wider">{t.stickers || "Stickers"}</span>
                      <button onClick={() => setShowStickers(false)} className="text-gray-400 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {STICKERS.map(sticker => (
                        <button
                          key={sticker}
                          onClick={() => handleSendSticker(sticker)}
                          className="text-3xl p-2 hover:bg-[#251c35] rounded-xl transition-transform hover:scale-110 flex items-center justify-center"
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
                    className="px-4 py-2 bg-[#15101e]/50 border-b border-[#3d2b4f]/30 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Pencil className="w-4 h-4 text-[#ff4d4d] shrink-0" />
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-xs font-bold text-[#ff4d4d]">{t.editingMessage || "Editing message"}</span>
                        <span className="text-xs text-gray-300 truncate">{editingMessage.text}</span>
                      </div>
                    </div>
                    <button onClick={() => { setEditingMessage(null); setInputText(''); }} className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Typing Indicator */}
              <AnimatePresence>
                {isRecipientTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute -top-8 left-6 bg-[#251c35] px-3 py-1.5 rounded-t-xl text-xs text-gray-300 flex items-center gap-2"
                  >
                    <span className="font-bold">{recipientName}</span> {t.isTyping || "is typing"}
                    <span className="flex gap-0.5">
                      <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}>.</motion.span>
                      <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}>.</motion.span>
                      <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}>.</motion.span>
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {selectedImages.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="px-4 sm:px-6 pt-2 flex gap-2 overflow-x-auto"
                  >
                    {selectedImages.map((img, idx) => (
                      <div key={idx} className="relative shrink-0">
                        <img src={img} alt="Preview" className="w-16 h-16 object-cover rounded-xl border border-[#3d2b4f]" />
                        <button
                          type="button"
                          onClick={() => removeSelectedImage(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSend} className="p-2 sm:p-3 bg-[#0d0b14] border-t border-[#3d2b4f]/30 z-20">
                <div className="flex items-center gap-1 sm:gap-2 bg-[#0f0c1b] rounded-full p-1 border border-[#3d2b4f]/40 focus-within:border-[#ff4d4d]/50 transition-colors">
                  <button
                    type="button"
                    onClick={() => setShowStickers(!showStickers)}
                    className={`shrink-0 p-2 sm:p-2.5 rounded-full transition-all ${showStickers ? 'bg-[#ff4d4d] text-[#0d0b14]' : 'text-gray-400 hover:text-[#ff4d4d] hover:bg-[#15101e]'}`}
                  >
                    <Sticker className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                  <label className="shrink-0 p-2 sm:p-2.5 rounded-full transition-all text-gray-400 hover:text-[#ff4d4d] hover:bg-[#15101e] cursor-pointer flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={isSending} />
                  </label>
                  <input
                    type="text"
                    value={inputText}
                    onChange={handleTyping}
                    onKeyDown={handleKeyDown}
                    disabled={isSending}
                    placeholder={t.chatPlaceholder}
                    className="flex-1 min-w-0 bg-transparent px-2 py-2 text-sm sm:text-base text-white outline-none disabled:opacity-50 placeholder:text-gray-500"
                  />
                  <button
                    type="submit"
                    disabled={(!inputText.trim() && selectedImages.length === 0) || isSending}
                    className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-[#ff4d4d] hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-[#0d0b14] rounded-full transition-all active:scale-95 shrink-0 mr-1"
                  >
                    <Send className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
    
    {/* Fullscreen Image Modal */}
    <AnimatePresence>
      {fullscreenImage && createPortal(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setFullscreenImage(null)}
        >
          <button className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-white/20 text-white rounded-full transition-colors">
            <X size={24} />
          </button>
          <motion.img
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            src={fullscreenImage}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>,
        document.body
      )}
    </AnimatePresence>
    </>
  );
};
