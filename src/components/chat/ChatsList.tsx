import React, { useState, useEffect, useMemo } from 'react';
import { useChat, Chat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { translations, Language } from '../../data/translations';
import { MessageSquare, Clock, User, Search, X, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS, be, ja, de, fr, zhCN } from 'date-fns/locale';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

interface ChatsListProps {
  lang: Language;
  onSelectChat: (recipientId: string, name: string, photoURL?: string) => void;
}

const locales = { ru, en: enUS, by: be, jp: ja, de, fr, zh: zhCN };

const ChatItem = React.memo(({ 
  chat, 
  currentUserId, 
  lang, 
  profile, 
  onSelect 
}: { 
  chat: Chat, 
  currentUserId: string, 
  lang: Language, 
  profile: { name: string, photo?: string } | null,
  onSelect: (id: string, name: string, photo?: string) => void 
}) => {
  const recipientId = chat.participants.find(p => p !== currentUserId);
  const isTyping = chat.typing?.[recipientId || ''];
  
  const lastRead = chat.lastReadAt?.[currentUserId]?.toMillis() || 0;
  const lastMsg = chat.lastMessageAt?.toMillis() || 0;
  const isUnread = lastMsg > lastRead && chat.lastMessage;

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(recipientId || '', profile?.name || 'User', profile?.photo)}
      className={`w-full border rounded-2xl p-4 flex items-center gap-4 transition-all text-left group relative overflow-hidden ${isUnread ? 'bg-[#3E3160]/60 border-[#C3A6E6]/50 hover:bg-[#3E3160]/80' : 'bg-[#2F244F]/30 border-[#5C4B8B]/30 hover:bg-[#2F244F]/60'}`}
    >
      {isUnread && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C3A6E6] shadow-[0_0_10px_#C3A6E6]" />
      )}
      <div className="relative shrink-0">
        {profile?.photo ? (
          <img src={profile.photo} alt="" className="w-12 h-12 rounded-2xl object-cover border-2 border-[#5C4B8B]/50 group-hover:border-[#C3A6E6] transition-colors" />
        ) : (
          <div className="w-12 h-12 rounded-2xl bg-[#C3A6E6]/20 flex items-center justify-center border-2 border-[#5C4B8B]/50 group-hover:border-[#C3A6E6] transition-colors">
            <User className="w-6 h-6 text-[#C3A6E6]" />
          </div>
        )}
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-4 border-[#2F244F] rounded-full shadow-lg" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <span className={`font-black text-sm truncate uppercase tracking-wider ${isUnread ? 'text-[#C3A6E6]' : 'text-white'}`}>
            {profile?.name || '...'}
          </span>
          {chat.lastMessageAt && (
            <span className={`text-[10px] font-bold uppercase tracking-widest ${isUnread ? 'text-[#C3A6E6]' : 'text-gray-500'}`}>
              {formatDistanceToNow(chat.lastMessageAt.toDate(), {
                addSuffix: true,
                locale: locales[lang] || locales.en
              })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isTyping ? (
            <p className="text-xs text-[#C3A6E6] font-bold italic truncate">
              {lang === 'ru' ? 'печатает...' : 'typing...'}
            </p>
          ) : (
            <p className={`text-xs truncate font-medium ${isUnread ? 'text-white' : 'text-gray-400'}`}>
              {chat.lastMessage || '...'}
            </p>
          )}
          {isUnread && !isTyping && (
            <Circle className="w-2 h-2 fill-[#C3A6E6] text-[#C3A6E6] shrink-0" />
          )}
        </div>
      </div>
    </motion.button>
  );
});

export const ChatsList: React.FC<ChatsListProps> = ({ lang, onSelectChat }) => {
  const { user, loginWithGoogle } = useAuth();
  const { chats, loading } = useChat();
  const t = translations[lang];
  
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState<Record<string, { name: string, photo?: string }>>({});

  useEffect(() => {
    if (!user || chats.length === 0) return;
    
    const fetchProfiles = async () => {
      const newProfiles: Record<string, { name: string, photo?: string }> = {};
      let hasNew = false;
      
      for (const chat of chats) {
        const recipientId = chat.participants.find(p => p !== user.uid);
        if (recipientId && !profiles[recipientId]) {
          hasNew = true;
          const snap = await getDoc(doc(db, 'public_profiles', recipientId));
          if (snap.exists()) {
            const data = snap.data();
            newProfiles[recipientId] = {
              name: data.displayName || 'User',
              photo: data.photoURL
            };
          } else {
            newProfiles[recipientId] = { name: 'User' };
          }
        }
      }
      
      if (hasNew) {
        setProfiles(prev => ({ ...prev, ...newProfiles }));
      }
    };
    
    fetchProfiles();
  }, [chats, user, profiles]);

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    
    const query = searchQuery.toLowerCase();
    return chats.filter(chat => {
      const recipientId = chat.participants.find(p => p !== user?.uid);
      if (!recipientId) return false;
      const profile = profiles[recipientId];
      if (!profile) return true; // Show while loading profile
      return profile.name.toLowerCase().includes(query);
    });
  }, [chats, searchQuery, profiles, user]);

  if (!user) {
    return (
      <div className="text-center py-16 bg-[#2F244F]/20 rounded-3xl border border-[#5C4B8B]/20">
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

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      {chats.length > 0 && (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'ru' ? 'Поиск чатов...' : 'Search chats...'}
            className="w-full bg-[#2F244F]/50 border border-[#5C4B8B]/50 rounded-2xl py-3 pl-10 pr-10 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#C3A6E6] focus:bg-[#2F244F]/80 transition-all"
          />
          <AnimatePresence>
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Chat List */}
      <div className="space-y-3">
        {chats.length === 0 ? (
          <div className="text-center py-16 text-gray-500 bg-[#2F244F]/20 rounded-3xl border border-[#5C4B8B]/20">
            <MessageSquare className="mx-auto mb-4 opacity-10" size={48} />
            <p className="text-sm font-black uppercase tracking-widest">{t.noChats}</p>
          </div>
        ) : filteredChats.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 text-gray-500 bg-[#2F244F]/10 rounded-3xl border border-[#5C4B8B]/10"
          >
            <Search className="mx-auto mb-4 opacity-20" size={32} />
            <p className="text-sm font-bold uppercase tracking-widest">
              {lang === 'ru' ? 'Ничего не найдено' : 'No chats found'}
            </p>
          </motion.div>
        ) : (
          filteredChats.map((chat) => (
            <ChatItem 
              key={chat.id} 
              chat={chat} 
              currentUserId={user?.uid || ''} 
              lang={lang} 
              profile={profiles[chat.participants.find(p => p !== user?.uid) || ''] || null}
              onSelect={onSelectChat} 
            />
          ))
        )}
      </div>
    </div>
  );
};
