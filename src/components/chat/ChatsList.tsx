import React, { useState, useEffect, useMemo } from 'react';
import { useChat, Chat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { translations, Language } from '../../data/translations';
import { GoogleLoginButton } from '../ui/GoogleLoginButton';
import { MessageSquare, Clock, User, Search, X, Circle, Bell, BellOff, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns';
import { ru, enUS, be, de, fr, zhCN } from 'date-fns/locale';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { dbQueryCore } from '../../utils/dbQueryCore';

interface ChatsListProps {
  lang: Language;
  onSelectChat: (recipientId: string, name: string, photoURL?: string) => void;
}

const locales = { ru, en: enUS, by: be, de, fr, zh: zhCN };

const getSafeDate = (val: any): Date => {
  if (!val) return new Date();
  if (typeof val.toDate === 'function') return val.toDate();
  if (val instanceof Date) return val;
  if (typeof val === 'number') return new Date(val);
  if (typeof val === 'string') return new Date(val);
  if (typeof val.seconds === 'number') return new Date(val.seconds * 1000 + Math.floor((val.nanoseconds || 0) / 1000000));
  return new Date();
};

const formatChatTime = (val: any, lang: Language): string => {
  const date = getSafeDate(val);
  const t = translations[lang] as any;
  if (isToday(date)) {
    return format(date, 'HH:mm');
  }
  if (isYesterday(date)) {
    return t.chatYesterday || 'Yesterday';
  }
  const now = new Date();
  if (date.getFullYear() === now.getFullYear()) {
    return format(date, 'd MMM', { locale: locales[lang] || locales.en });
  } else {
    return format(date, 'dd.MM.yyyy');
  }
};

const getMillis = (val: any): number => {
  if (!val) return 0;
  if (typeof val.toMillis === 'function') return val.toMillis();
  if (typeof val.toDate === 'function') return val.toDate().getTime();
  if (val instanceof Date) return val.getTime();
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return new Date(val).getTime();
  if (typeof val.seconds === 'number') return val.seconds * 1000 + Math.floor((val.nanoseconds || 0) / 1000000);
  return 0;
};

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
  profile: { name: string, photo?: string, lastSeen?: string } | null,
  onSelect: (id: string, name: string, photo?: string) => void 
}) => {
  const recipientId = chat.participants.find(p => p !== currentUserId);
  const isTyping = chat.typing?.[recipientId || ''];
  
  const lastRead = getMillis(chat.lastReadAt?.[currentUserId]);
  const lastMsg = getMillis(chat.lastMessageAt);
  const isUnread = lastMsg > lastRead && chat.lastMessage;

  const t = translations[lang];
  const isOnline = profile?.lastSeen ? (Date.now() - new Date(profile.lastSeen).getTime() < 3 * 60 * 1000) : false;

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(recipientId || '', profile?.name || 'User', profile?.photo)}
      className={`w-full border rounded-2xl p-4 flex items-center gap-4 transition-all text-left group relative overflow-hidden ${isUnread ? 'bg-[#251c35]/60 border-[#ff4d4d]/50 hover:bg-[#251c35]/80' : 'bg-[#15101e]/30 border-[#3d2b4f]/30 hover:bg-[#15101e]/60'}`}
    >
      {isUnread && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ff4d4d] shadow-[0_0_10px_#ff4d4d]" />
      )}
      <div className="relative shrink-0">
        {profile?.photo ? (
          <img src={profile.photo} alt="" className="w-12 h-12 rounded-2xl object-cover border-2 border-[#3d2b4f]/50 group-hover:border-[#ff4d4d] transition-colors" />
        ) : (
          <div className="w-12 h-12 rounded-2xl bg-[#ff4d4d]/20 flex items-center justify-center border-2 border-[#3d2b4f]/50 group-hover:border-[#ff4d4d] transition-colors">
            <User className="w-6 h-6 text-[#ff4d4d]" />
          </div>
        )}
        <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-4 border-[#15101e] rounded-full shadow-lg ${
          isOnline ? 'bg-green-500' : 'bg-gray-500 shadow-none'
        }`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <span className={`font-black text-sm truncate uppercase tracking-wider ${isUnread ? 'text-[#ff4d4d]' : 'text-white'}`}>
            {profile?.name || '...'}
          </span>
          {chat.lastMessageAt && (
            <span className={`text-[10px] font-bold uppercase tracking-widest ${isUnread ? 'text-[#ff4d4d]' : 'text-gray-500'}`}>
              {formatChatTime(chat.lastMessageAt, lang)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isTyping ? (
            <p className="text-xs text-[#ff4d4d] font-bold italic truncate">
              {(t as any).chatTyping || t.chatsTyping}
            </p>
          ) : (
            <p className={`text-xs truncate font-medium ${isUnread ? 'text-white' : 'text-gray-400'}`}>
              {chat.lastMessage || '...'}
            </p>
          )}
          {isUnread && !isTyping && (
            <Circle className="w-2 h-2 fill-[#ff4d4d] text-[#ff4d4d] shrink-0" />
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
  const [profiles, setProfiles] = useState<Record<string, { name: string, photo?: string, lastSeen?: string }>>({});
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);

  const requestNotifications = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm !== 'default') {
        setShowNotifPrompt(false);
      }
    }
  };

  useEffect(() => {
    if (!user || chats.length === 0) return;
    
    const fetchProfiles = async () => {
      const newProfiles: Record<string, { name: string, photo?: string, lastSeen?: string }> = {};
      let hasNew = false;
      
      for (const chat of chats) {
        const recipientId = chat.participants.find(p => p !== user.uid);
        if (recipientId && !profiles[recipientId]) {
          hasNew = true;
          const data = await dbQueryCore.getProfileBatched(recipientId);
          if (data) {
            newProfiles[recipientId] = {
              name: data.displayName || 'User',
              photo: data.photoURL,
              lastSeen: data.lastSeen
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
      <div className="bg-[#15101e]/60 border border-[#3d2b4f]/20 rounded-[2.5rem] p-8 sm:p-12 text-center max-w-2xl mx-auto my-12 backdrop-blur-md">
        <User className="mx-auto text-[#ff4d4d]/60 mb-5" size={44} />
        <h4 className="text-xl font-black text-white uppercase tracking-wider mb-2">
          {lang === 'ru' ? 'Авторизация' : 'Authorization'}
        </h4>
        <p className="text-white/60 mb-8 font-black uppercase tracking-widest text-xs max-w-md mx-auto">
          {(t as any).chatLoginToView || t.chatsLoginToView || (lang === 'ru' ? 'Войдите, чтобы просмотреть чаты' : 'Log in to view chats')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <GoogleLoginButton lang={lang} />
          <button
            onClick={() => window.dispatchEvent(new Event('openEmailLogin'))}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#3d2b4f]/40 border border-[#3d2b4f] text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-[#ff4d4d] hover:text-[#15101e] hover:border-[#ff4d4d] transition-all active:scale-95 shadow-xl"
          >
            <Mail size={16} />
            {lang === 'ru' ? 'Зарегистрироваться через почту' : 'Register via email'}
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-[#ff4d4d] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(255,77,77,0.3)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showNotifPrompt && user && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#3d2b4f]/20 border border-[#ff4d4d]/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-[#ff4d4d]/20 rounded-xl shrink-0">
              <Bell className="w-5 h-5 text-[#ff4d4d]" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm mb-1">
                {(t as any).chatEnableNotifs || t.chatsEnableNotif}
              </h4>
              <p className="text-gray-300 text-xs leading-relaxed">
                {(t as any).chatEnableNotifsDesc || "Enable notifications to not miss messages."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button 
              onClick={() => setShowNotifPrompt(false)}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-[#3d2b4f]/30 transition-colors"
            >
              {(t as any).chatLater || t.chatsLater}
            </button>
            <button 
              onClick={requestNotifications}
              className="flex-1 sm:flex-none bg-[#ff4d4d] text-[#15101e] px-4 py-2 rounded-xl text-xs font-bold hover:bg-white transition-colors shadow-[0_0_15px_rgba(255,77,77,0.3)]"
            >
              {(t as any).chatEnable || t.chatsEnable}
            </button>
          </div>
        </motion.div>
      )}

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
            placeholder={(t as any).chatSearchChats || t.chatsSearch}
            className="w-full bg-[#15101e]/50 border border-[#3d2b4f]/50 rounded-2xl py-3 pl-10 pr-10 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#ff4d4d] focus:bg-[#15101e]/80 transition-all"
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
          <div className="text-center py-16 text-gray-500 bg-[#15101e]/20 rounded-3xl border border-[#3d2b4f]/20">
            <MessageSquare className="mx-auto mb-4 opacity-10" size={48} />
            <p className="text-sm font-black uppercase tracking-widest">{t.noChats}</p>
          </div>
        ) : filteredChats.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 text-gray-500 bg-[#15101e]/10 rounded-3xl border border-[#3d2b4f]/10"
          >
            <Search className="mx-auto mb-4 opacity-20" size={32} />
            <p className="text-sm font-bold uppercase tracking-widest">
              {(t as any).chatNoChatsFound || t.chatsNotFound}
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
