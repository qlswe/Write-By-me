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
  const { user } = useAuth();
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
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="fixed bottom-4 right-4 w-[350px] sm:w-[400px] h-[500px] bg-[#2F244F] border border-[#3E3160] rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden z-50"
    >
      {/* Header */}
      <div className="p-4 bg-[#3E3160]/50 border-b border-[#3E3160] flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            {recipientPhoto ? (
              <img src={recipientPhoto} alt="" className="w-10 h-10 rounded-2xl object-cover border-2 border-[#C3A6E6]/30" />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-[#C3A6E6]/20 flex items-center justify-center border-2 border-[#C3A6E6]/30">
                <User className="w-5 h-5 text-[#C3A6E6]" />
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#2F244F] rounded-full" />
          </div>
          <div>
            <span className="font-black text-white text-sm uppercase tracking-wider block leading-none mb-1">{recipientName}</span>
            <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest">Online</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-xl transition-all text-gray-400 hover:text-white active:scale-90"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === user?.uid;
          return (
            <div
              key={msg.id || idx}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  isMe
                    ? 'bg-[#C3A6E6] text-[#2F244F] rounded-tr-none'
                    : 'bg-[#3E3160] text-gray-200 rounded-tl-none'
                }`}
              >
                <p className="break-words">{msg.text}</p>
                <div className={`text-[10px] mt-1 opacity-60 ${isMe ? 'text-right' : 'text-left'}`}>
                  {msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'HH:mm') : ''}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-[#3E3160]/20 border-t border-[#3E3160] flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSending}
          placeholder={t.chatPlaceholder}
          className="flex-1 bg-[#2F244F] border border-[#3E3160] rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-[#C3A6E6] transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="p-2 bg-[#C3A6E6] hover:bg-[#B094EB] disabled:opacity-50 disabled:cursor-not-allowed text-[#2F244F] rounded-xl transition-all active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </motion.div>
  );
};
