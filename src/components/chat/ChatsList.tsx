import React, { useState, useEffect } from 'react';
import { useChat, Chat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { translations, Language } from '../../data/translations';
import { MessageSquare, Clock, User } from 'lucide-react';
import { motion } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS, be, ja, de, fr, zhCN } from 'date-fns/locale';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

interface ChatsListProps {
  lang: Language;
  onSelectChat: (recipientId: string, name: string, photoURL?: string) => void;
}

const locales = { ru, en: enUS, by: be, jp: ja, de, fr, zh: zhCN };

const ChatItem: React.FC<{ 
  chat: Chat, 
  currentUserId: string, 
  lang: Language, 
  onSelect: (id: string, name: string, photo?: string) => void 
}> = ({ chat, currentUserId, lang, onSelect }) => {
  const [recipient, setRecipient] = useState<{ name: string, photo?: string } | null>(null);
  const recipientId = chat.participants.find(p => p !== currentUserId);

  useEffect(() => {
    if (recipientId) {
      getDoc(doc(db, 'public_profiles', recipientId)).then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          setRecipient({
            name: data.displayName || 'User',
            photo: data.photoURL
          });
        } else {
          setRecipient({ name: 'User' });
        }
      });
    }
  }, [recipientId]);

  return (
    <motion.button
      whileHover={{ scale: 1.02, backgroundColor: 'rgba(47, 36, 79, 0.6)' }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(recipientId || '', recipient?.name || 'User', recipient?.photo)}
      className="w-full bg-[#2F244F]/30 border border-[#5C4B8B]/30 rounded-2xl p-4 flex items-center gap-4 transition-all text-left group"
    >
      <div className="relative shrink-0">
        {recipient?.photo ? (
          <img src={recipient.photo} alt="" className="w-12 h-12 rounded-2xl object-cover border-2 border-[#5C4B8B]/50 group-hover:border-[#C3A6E6] transition-colors" />
        ) : (
          <div className="w-12 h-12 rounded-2xl bg-[#C3A6E6]/20 flex items-center justify-center border-2 border-[#5C4B8B]/50 group-hover:border-[#C3A6E6] transition-colors">
            <User className="w-6 h-6 text-[#C3A6E6]" />
          </div>
        )}
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-4 border-[#2F244F] rounded-full shadow-lg" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <span className="font-black text-white text-sm truncate uppercase tracking-wider">{recipient?.name || '...'}</span>
          {chat.lastMessageAt && (
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              {formatDistanceToNow(chat.lastMessageAt.toDate(), {
                addSuffix: true,
                locale: locales[lang] || locales.en
              })}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 truncate font-medium">{chat.lastMessage || '...'}</p>
      </div>
    </motion.button>
  );
};

export const ChatsList: React.FC<ChatsListProps> = ({ lang, onSelectChat }) => {
  const { user, loginWithGoogle } = useAuth();
  const { chats, loading } = useChat();
  const t = translations[lang];

  if (!user) {
    return (
      <div className="text-center py-16 bg-[#2F244F]/20 rounded-3xl border border-[#5C4B8B]/20 backdrop-blur-xl">
        <User className="mx-auto mb-6 text-gray-600" size={48} />
        <p className="text-sm font-black uppercase tracking-widest text-gray-400 mb-8">
          {lang === 'ru' ? "Войдите, чтобы просматривать сообщения" : "Log in to view your chats"}
        </p>
        <button
          onClick={loginWithGoogle}
          className="inline-flex items-center gap-4 bg-[#C3A6E6] hover:bg-[#B396D6] text-[#2F244F] px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(195,166,230,0.3)] hover:scale-105 active:scale-95 border border-white/20"
        >
          {t.loginWithGoogle || "Login with Google"}
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-[#C3A6E6] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(195,166,230,0.3)]"></div>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500 bg-[#2F244F]/20 rounded-3xl border border-[#5C4B8B]/20">
        <MessageSquare className="mx-auto mb-4 opacity-10" size={48} />
        <p className="text-sm font-black uppercase tracking-widest">{t.noChats}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {chats.map((chat) => (
        <ChatItem 
          key={chat.id} 
          chat={chat} 
          currentUserId={user?.uid || ''} 
          lang={lang} 
          onSelect={onSelectChat} 
        />
      ))}
    </div>
  );
};
