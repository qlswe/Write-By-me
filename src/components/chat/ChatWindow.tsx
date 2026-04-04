import React, { useState, useEffect, useRef } from 'react';
import { useChat, Message } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { translations, Language } from '../../data/translations';
import { Send, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

interface ChatWindowProps {
  recipientId: string;
  recipientName: string;
  recipientPhoto?: string;
  lang: Language;
  onClose: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ recipientId, recipientName, recipientPhoto, lang, onClose }) => {
  const { user, loginWithGoogle } = useAuth();
  const { messages, sendMessage } = useChat(recipientId);
  const t = translations[lang];
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending) return;
    
    setIsSending(true);
    try {
      await sendMessage(inputText, recipientId);
      setInputText('');
    } catch (error) {
      console.error("Error sending message:", error);
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
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 sm:inset-auto sm:bottom-4 sm:right-4 sm:w-[400px] sm:h-[600px] bg-[#2F244F] sm:border sm:border-[#3E3160] sm:rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden z-50"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 bg-[#3E3160]/50 border-b border-[#3E3160] flex items-center justify-between backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              {recipientPhoto ? (
                <img src={recipientPhoto} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl object-cover border-2 border-[#C3A6E6]/30" />
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#C3A6E6]/20 flex items-center justify-center border-2 border-[#C3A6E6]/30">
                  <User className="w-5 h-5 text-[#C3A6E6]" />
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#2F244F] rounded-full" />
            </div>
            <div>
              <span className="font-black text-white text-sm sm:text-base uppercase tracking-wider block leading-none mb-1">{recipientName}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest">Online</span>
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
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar bg-[#1A1528]/30">
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
                messages.map((msg, idx) => {
                  const isMe = msg.senderId === user?.uid;
                  return (
                    <motion.div
                      initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={msg.id || idx}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] p-3 sm:p-4 rounded-2xl text-sm sm:text-base shadow-lg ${
                          isMe
                            ? 'bg-[#C3A6E6] text-[#2F244F] rounded-tr-none font-medium'
                            : 'bg-[#3E3160] text-gray-200 rounded-tl-none border border-[#5C4B8B]/30'
                        }`}
                      >
                        <p className="break-words leading-relaxed">{msg.text}</p>
                        <div className={`text-[10px] mt-2 font-bold opacity-60 ${isMe ? 'text-right' : 'text-left'}`}>
                          {msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'HH:mm') : ''}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 sm:p-6 bg-[#3E3160]/40 border-t border-[#3E3160] flex gap-3 backdrop-blur-md shrink-0">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSending}
                placeholder={t.chatPlaceholder}
                className="flex-1 bg-[#2F244F] border border-[#5C4B8B] rounded-2xl px-5 py-3 text-sm sm:text-base text-white outline-none focus:border-[#C3A6E6] transition-all disabled:opacity-50 placeholder:text-gray-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-[#C3A6E6] hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-[#2F244F] rounded-2xl transition-all active:scale-90 shadow-lg shadow-[#C3A6E6]/20 shrink-0"
              >
                <Send className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </form>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
