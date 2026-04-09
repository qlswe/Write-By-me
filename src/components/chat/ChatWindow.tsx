import React, { useState, useEffect, useRef } from 'react';
import { useChat, Message } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { translations, Language } from '../../data/translations';
import { Send, X, User, Reply, Smile, Sticker, Pencil, Trash2, Ban, Copy, Check, CheckCheck, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, isSameDay, isToday, isYesterday } from 'date-fns';

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
    if (isToday(date)) return lang === 'ru' ? 'Сегодня' : 'Today';
    if (isYesterday(date)) return lang === 'ru' ? 'Вчера' : 'Yesterday';
    return format(date, lang === 'ru' ? 'dd MMMM yyyy' : 'MMMM dd, yyyy');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(lang === 'ru' ? 'Файл слишком большой. Максимум 5MB.' : 'File too large. Maximum 5MB.');
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
        className="fixed inset-0 sm:inset-auto sm:bottom-4 sm:right-4 sm:w-[400px] sm:h-[600px] bg-[#2F244F] sm:border sm:border-[#3E3160] sm:rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden z-50"
      >
        {/* Header */}
        <div className="p-3 sm:p-4 bg-[#1a142e] border-b border-[#5C4B8B]/30 flex items-center justify-between shrink-0 z-20 shadow-md">
          <div className="flex items-center gap-3">
            <div className="relative">
              {recipientPhoto ? (
                <img src={recipientPhoto} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl object-cover border-2 border-[#C3A6E6]/30 shadow-[0_0_10px_rgba(195,166,230,0.15)]" />
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#C3A6E6]/20 flex items-center justify-center border-2 border-[#C3A6E6]/30 shadow-[0_0_10px_rgba(195,166,230,0.15)]">
                  <User className="w-5 h-5 text-[#C3A6E6]" />
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#1a142e] rounded-full shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
            </div>
            <div>
              <span className="font-black text-white text-sm sm:text-base uppercase tracking-wider block leading-none mb-1">{recipientName}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  Online
                </span>
                <span className="text-[8px] text-[#C3A6E6]/60 font-black uppercase tracking-tighter border border-[#C3A6E6]/20 px-1.5 py-0.5 rounded">Ministry E/D</span>
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
            <div className="w-20 h-20 bg-[#C3A6E6]/10 rounded-full flex items-center justify-center border border-[#C3A6E6]/20">
              <User className="w-10 h-10 text-[#C3A6E6]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-white uppercase tracking-tight">
                {lang === 'ru' ? 'Требуется авторизация' : 'Authorization Required'}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {lang === 'ru' 
                  ? 'Войдите в систему, чтобы просматривать сообщения и общаться с другими пользователями.' 
                  : 'Log in to view messages and chat with other users.'}
              </p>
            </div>
            <button
              onClick={loginWithGoogle}
              className="w-full bg-white text-[#2F244F] py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95 shadow-xl"
            >
              {lang === 'ru' ? 'Войти через Google' : 'Login with Google'}
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
                  <div className="w-16 h-16 bg-[#C3A6E6]/5 rounded-full flex items-center justify-center border border-[#C3A6E6]/10">
                    <Send className="w-8 h-8 text-[#C3A6E6]" />
                  </div>
                  <p className="text-sm font-bold uppercase tracking-widest text-gray-400">
                    {lang === 'ru' ? 'Начните общение' : 'Start a conversation'}
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
                            <span className="bg-[#2F244F] text-gray-300 text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border border-[#5C4B8B]/30 shadow-lg">
                              {formatDateSeparator(msgDate)}
                            </span>
                          </div>
                        )}
                        <motion.div
                          initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} relative group`}
                        >
                          {/* Modern Action Menu */}
                          <AnimatePresence>
                            {activeMessageId === msg.id && !msg.isDeleted && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                className={`absolute z-50 flex flex-col gap-2 ${isMe ? 'right-0 items-end' : 'left-0 items-start'} bottom-full mb-2`}
                              >
                                {/* Reactions Row */}
                                <div className="bg-[#2F244F] border border-[#5C4B8B] rounded-2xl p-1.5 flex gap-1 shadow-2xl">
                                  {CHAT_REACTIONS.map(emoji => (
                                    <button 
                                      key={emoji}
                                      onClick={(e) => { e.stopPropagation(); toggleReaction(msg.id, recipientId, emoji); setActiveMessageId(null); }}
                                      className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-[#C3A6E6]/20 rounded-xl text-lg sm:text-xl transition-transform hover:scale-125"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                                
                                {/* Actions Row */}
                                <div className="bg-[#2F244F] border border-[#5C4B8B] rounded-2xl p-1 flex flex-col shadow-2xl min-w-[160px]">
                                  <button onClick={(e) => { e.stopPropagation(); setReplyingTo(msg); setActiveMessageId(null); }} className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#C3A6E6]/10 rounded-xl text-gray-300 hover:text-white transition-colors text-sm font-medium">
                                    <Reply className="w-4 h-4" /> Ответить
                                  </button>
                                  {msg.type !== 'sticker' && (
                                    <button onClick={(e) => { e.stopPropagation(); handleCopy(msg.text); setActiveMessageId(null); }} className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#C3A6E6]/10 rounded-xl text-gray-300 hover:text-white transition-colors text-sm font-medium">
                                      <Copy className="w-4 h-4" /> Копировать
                                    </button>
                                  )}
                                  {isMe && msg.type !== 'sticker' && (
                                    <button onClick={(e) => { e.stopPropagation(); setEditingMessage(msg); setInputText(msg.text); setActiveMessageId(null); }} className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#C3A6E6]/10 rounded-xl text-gray-300 hover:text-white transition-colors text-sm font-medium">
                                      <Pencil className="w-4 h-4" /> Изменить
                                    </button>
                                  )}
                                  {isMe && (
                                    <button onClick={(e) => { e.stopPropagation(); deleteMessage(msg.id, recipientId); setActiveMessageId(null); }} className="flex items-center gap-3 px-3 py-2.5 hover:bg-red-500/10 rounded-xl text-red-400 hover:text-red-300 transition-colors text-sm font-medium">
                                      <Trash2 className="w-4 h-4" /> Удалить
                                    </button>
                                  )}
                                </div>
                              </motion.div>
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
                                  ? 'bg-[#C3A6E6] text-[#1a142e] rounded-tr-sm font-medium'
                                  : 'bg-[#2F244F] text-gray-100 rounded-tl-sm border border-[#5C4B8B]/30'
                            } ${msg.isDeleted ? 'opacity-50 italic' : ''}`}
                          >
                            {repliedMsg && msg.type !== 'sticker' && !msg.isDeleted && (
                              <div className={`mb-2 p-2 rounded-lg text-xs border-l-2 ${isMe ? 'bg-[#2F244F]/10 border-[#2F244F]/30' : 'bg-[#2F244F]/30 border-[#C3A6E6]/50'}`}>
                                <span className="font-bold opacity-70 block mb-0.5">
                                  {repliedMsg.senderId === user?.uid ? 'Вы' : recipientName}
                                </span>
                                <span className="opacity-80 line-clamp-1">
                                  {repliedMsg.isDeleted ? 'Сообщение удалено' : (repliedMsg.type === 'sticker' ? 'Sticker' : repliedMsg.text)}
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
                                  <div className="grid grid-cols-2 gap-2">
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
                              {msg.isEdited && !msg.isDeleted && <span>(изменено)</span>}
                              {msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'HH:mm') : ''}
                              {isMe && !msg.isDeleted && (
                                isRead ? <CheckCheck className={`w-3.5 h-3.5 ml-0.5 ${msg.type === 'sticker' ? 'text-blue-400' : 'text-[#1a142e]'}`} /> : <Check className={`w-3.5 h-3.5 ml-0.5 ${msg.type === 'sticker' ? 'text-gray-400' : 'opacity-60'}`} />
                              )}
                            </div>
                          </div>

                          {/* Reactions */}
                          {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                            <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                              {Object.entries(msg.reactions).map(([emoji, users]) => (
                                <button
                                  key={emoji}
                                  onClick={() => toggleReaction(msg.id, recipientId, emoji)}
                                  className={`text-xs px-1.5 py-0.5 rounded-full border flex items-center gap-1 ${
                                    users.includes(user?.uid || '') 
                                      ? 'bg-[#C3A6E6]/20 border-[#C3A6E6]/50 text-white' 
                                      : 'bg-[#2F244F]/50 border-[#5C4B8B]/50 text-gray-300'
                                  }`}
                                >
                                  <span>{emoji}</span>
                                  <span className="text-[10px] opacity-70">{users.length}</span>
                                </button>
                              ))}
                            </div>
                          )}
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
                  className="absolute bottom-24 right-6 w-10 h-10 bg-[#3E3160] border border-[#5C4B8B] rounded-full flex items-center justify-center text-[#C3A6E6] shadow-xl hover:bg-[#5C4B8B] transition-colors z-20"
                >
                  <ChevronDown className="w-5 h-5" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="bg-[#3E3160] border-t border-[#3E3160] shrink-0 relative">
              {/* Reply Banner */}
              <AnimatePresence>
                {replyingTo && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 py-2 bg-[#2F244F]/50 border-b border-[#5C4B8B]/30 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Reply className="w-4 h-4 text-[#C3A6E6] shrink-0" />
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-xs font-bold text-[#C3A6E6]">
                          {replyingTo.senderId === user?.uid ? 'Вы' : recipientName}
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
                    className="absolute bottom-full left-0 w-full p-4 bg-[#2F244F] border-t border-[#5C4B8B] shadow-2xl z-20"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-gray-300 uppercase tracking-wider">Стикеры</span>
                      <button onClick={() => setShowStickers(false)} className="text-gray-400 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {STICKERS.map(sticker => (
                        <button
                          key={sticker}
                          onClick={() => handleSendSticker(sticker)}
                          className="text-3xl p-2 hover:bg-[#3E3160] rounded-xl transition-transform hover:scale-110 flex items-center justify-center"
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
                    className="px-4 py-2 bg-[#2F244F]/50 border-b border-[#5C4B8B]/30 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Pencil className="w-4 h-4 text-[#C3A6E6] shrink-0" />
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-xs font-bold text-[#C3A6E6]">Редактирование сообщения</span>
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
                    className="absolute -top-8 left-6 bg-[#3E3160] px-3 py-1.5 rounded-t-xl text-xs text-gray-300 flex items-center gap-2"
                  >
                    <span className="font-bold">{recipientName}</span> печатает
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
                        <img src={img} alt="Preview" className="w-16 h-16 object-cover rounded-xl border border-[#5C4B8B]" />
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

              <form onSubmit={handleSend} className="p-2 sm:p-3 bg-[#1a142e] border-t border-[#5C4B8B]/30 z-20">
                <div className="flex items-center gap-1 sm:gap-2 bg-[#0f0c1b] rounded-full p-1 border border-[#5C4B8B]/40 focus-within:border-[#C3A6E6]/50 transition-colors">
                  <button
                    type="button"
                    onClick={() => setShowStickers(!showStickers)}
                    className={`shrink-0 p-2 sm:p-2.5 rounded-full transition-all ${showStickers ? 'bg-[#C3A6E6] text-[#1a142e]' : 'text-gray-400 hover:text-[#C3A6E6] hover:bg-[#2F244F]'}`}
                  >
                    <Sticker className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                  <label className="shrink-0 p-2 sm:p-2.5 rounded-full transition-all text-gray-400 hover:text-[#C3A6E6] hover:bg-[#2F244F] cursor-pointer flex items-center justify-center">
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
                    className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-[#C3A6E6] hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-[#1a142e] rounded-full transition-all active:scale-95 shrink-0 mr-1"
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
      {fullscreenImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
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
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};
