import React, { useState, useEffect, useMemo } from 'react';
import { useChat, Chat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { translations, Language } from '../../data/translations';
import { GoogleLoginButton } from '../ui/GoogleLoginButton';
import { MessageSquare, Clock, User, Search, X, Circle, Bell, BellOff, Mail, UserPlus, Plus, Users, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns';
import { ru, enUS, be, de, fr, zhCN } from 'date-fns/locale';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { dbQueryCore } from '../../utils/dbQueryCore';
import { useUsers } from '../../hooks/useUsers';
import { generatePrefixedId } from '../../utils/idGenerator';
import { CachedAvatar } from '../ui/CachedAvatar';

interface ChatsListProps {
  lang: Language;
  onSelectChat: (recipientId: string, name: string, photoURL?: string) => void;
  activeChatId?: string;
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
  onSelect,
  isActive
}: { 
  chat: Chat, 
  currentUserId: string, 
  lang: Language, 
  profile: { name: string, photo?: string, lastSeen?: string } | null,
  onSelect: (id: string, name: string, photo?: string) => void,
  isActive?: boolean
}) => {
  const isGroup = chat.isGroup;
  const recipientId = isGroup ? chat.id : chat.participants.find(p => p !== currentUserId);

  let isTyping = false;
  let typingText = '';
  const t = translations[lang];

  if (isGroup) {
    const typingUids = Object.keys(chat.typing || {}).filter(uid => uid !== currentUserId && chat.typing?.[uid]);
    if (typingUids.length > 0) {
      isTyping = true;
      typingText = lang === 'ru' ? 'Кто-то печатает...' : 'Someone is typing...';
    }
  } else {
    isTyping = !!chat.typing?.[recipientId || ''];
    typingText = (t as any).chatTyping || t.chatsTyping || 'Typing...';
  }
  
  const lastRead = getMillis(chat.lastReadAt?.[currentUserId]);
  const lastMsg = getMillis(chat.lastMessageAt);
  const isUnread = lastMsg > lastRead && chat.lastMessage;

  const isOnline = !isGroup && profile?.lastSeen 
    ? (Date.now() - new Date(profile.lastSeen).getTime() < 3 * 60 * 1000) 
    : false;

  const isJukyBot = recipientId === 'bot_juky';
  const chatName = isGroup ? chat.name : (isJukyBot ? 'Juky AI (Жуки 🤖)' : (profile?.name || 'User'));
  const chatPhoto = isGroup ? chat.avatar : (isJukyBot ? 'https://api.dicebear.com/7.x/bottts/svg?seed=JukyBotAha' : profile?.photo);

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(recipientId || '', chatName || 'Group', chatPhoto)}
      className={`w-full border rounded-2xl p-4 flex items-center gap-4 transition-all text-left group relative overflow-hidden ${
        isActive 
          ? 'bg-[#ff4d4d]/15 border-[#ff4d4d] hover:bg-[#ff4d4d]/20 shadow-[0_0_15px_rgba(255,77,77,0.15)]' 
          : isUnread 
            ? 'bg-[#251c35]/60 border-[#ff4d4d]/50 hover:bg-[#251c35]/80' 
            : 'bg-[#15101e]/30 border-[#3d2b4f]/30 hover:bg-[#15101e]/60'
      }`}
    >
      {isUnread && !isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ff4d4d] shadow-[0_0_10px_#ff4d4d]" />
      )}
      <div className="relative shrink-0">
        <CachedAvatar
          src={chatPhoto}
          alt={chatName}
          customSizeClass="w-12 h-12"
          className="rounded-2xl border-2 border-[#3d2b4f]/50 group-hover:border-[#ff4d4d] transition-colors"
          fallbackText={chatName}
        />
        {!isGroup && isJukyBot && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 border-4 border-[#15101e] rounded-full shadow-lg bg-[#00f0ff]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <span className={`font-black text-sm truncate uppercase tracking-wider flex items-center gap-1.5 ${isActive ? 'text-[#ff4d4d]' : isUnread ? 'text-[#ff4d4d]' : 'text-white'}`}>
            {chatName || '...'}
            {isGroup && (
              <span className="text-[9px] bg-[#ff4d4d]/20 text-[#ff4d4d] border border-[#ff4d4d]/30 px-1 rounded font-bold font-mono uppercase tracking-normal">
                {lang === 'ru' ? 'ГРУППА' : 'GROUP'}
              </span>
            )}
            {isJukyBot && (
              <span className="text-[9px] bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30 px-1.5 py-0.5 rounded font-black font-mono uppercase tracking-wider">
                {(t as any).botJukyBadge || '🤖 BOT'}
              </span>
            )}
          </span>
          {chat.lastMessageAt && (
            <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-[#ff4d4d]' : isUnread ? 'text-[#ff4d4d]' : 'text-gray-500'}`}>
              {formatChatTime(chat.lastMessageAt, lang)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isTyping ? (
            <p className="text-xs text-[#ff4d4d] font-bold italic truncate">
              {typingText}
            </p>
          ) : (
            <p className={`text-xs truncate font-medium ${isActive ? 'text-gray-200' : isUnread ? 'text-white' : 'text-gray-400'}`}>
              {chat.lastMessage || '...'}
            </p>
          )}
          {isUnread && !isTyping && !isActive && (
            <Circle className="w-2 h-2 fill-[#ff4d4d] text-[#ff4d4d] shrink-0 animate-pulse" />
          )}
        </div>
      </div>
    </motion.button>
  );
});

export const ChatsList: React.FC<ChatsListProps> = ({ lang, onSelectChat, activeChatId }) => {
  const { user, loginWithGoogle } = useAuth();
  const { chats, loading } = useChat();
  const { users } = useUsers();
  const t = translations[lang];
  
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState<Record<string, { name: string, photo?: string, lastSeen?: string }>>({});
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);
  
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState('');

  const [showNewGroup, setShowNewGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');

  const otherUsers = useMemo(() => {
    if (!user) return [];
    const searchLower = newChatSearch.toLowerCase().trim();
    return users.filter(u => {
      if (u.uid === user.uid) return false;
      if (!searchLower) return true;
      return (u.displayName || '').toLowerCase().includes(searchLower) || (u.email || '').toLowerCase().includes(searchLower);
    });
  }, [users, user, newChatSearch]);

  const groupUsersFiltered = useMemo(() => {
    if (!user) return [];
    const searchLower = groupSearchQuery.toLowerCase().trim();
    return users.filter(u => {
      if (u.uid === user.uid) return false;
      if (!searchLower) return true;
      return (u.displayName || '').toLowerCase().includes(searchLower) || (u.email || '').toLowerCase().includes(searchLower);
    });
  }, [users, user, groupSearchQuery]);

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
        if (chat.isGroup) continue;
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
      if (chat.isGroup) {
        return (chat.name || '').toLowerCase().includes(query);
      }
      const recipientId = chat.participants.find(p => p !== user?.uid);
      if (!recipientId) return false;
      if (recipientId === 'bot_juky') return 'juky ai (жуки 🤖) bot'.includes(query);
      const profile = profiles[recipientId];
      if (!profile) return true;
      return profile.name.toLowerCase().includes(query);
    });
  }, [chats, searchQuery, profiles, user]);

  const displayChats = useMemo(() => {
    let list = [...filteredChats];
    const hasJukyChat = list.some(c => !c.isGroup && c.participants.includes('bot_juky'));
    if (!hasJukyChat && user) {
      const virtualJukyChat = {
        id: `juky_${user.uid}`,
        participants: [user.uid, 'bot_juky'],
        isGroup: false,
        name: 'Juky AI (Жуки 🤖)',
        lastMessage: (t as any).botJukyWelcome || 'Привет! Я Жуки (Juky AI) — твой умный помощник на Aha Station 🤖✨',
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0
      };
      list.unshift(virtualJukyChat as any);
    }
    return list;
  }, [filteredChats, user, t]);

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedParticipants.length === 0 || !user) return;
    const groupId = generatePrefixedId('group');
    const chatRef = doc(db, 'chats', groupId);
    try {
      const gAvatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(groupName)}`;
      await setDoc(chatRef, {
        id: groupId,
        isGroup: true,
        name: groupName.trim(),
        avatar: gAvatar,
        participants: [user.uid, ...selectedParticipants],
        admins: [user.uid],
        createdAt: serverTimestamp(),
        lastMessage: lang === 'ru' ? 'Группа создана' : 'Group created',
        lastMessageAt: serverTimestamp()
      });
      setGroupName('');
      setSelectedParticipants([]);
      setShowNewGroup(false);
      window.dispatchEvent(new CustomEvent('aha_toast', { 
        detail: lang === 'ru' ? 'Группа успешно создана!' : 'Group successfully created!' 
      }));
      onSelectChat(groupId, groupName.trim(), gAvatar);
    } catch (e) {
      console.error('Error creating group:', e);
    }
  };

  const toggleGroupParticipant = (uid: string) => {
    setSelectedParticipants(prev => 
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  if (!user) {
    return (
      <div className="bg-[#15101e]/80 border border-[#3d2b4f]/60 rounded-3xl p-5 sm:p-8 text-center w-full max-w-md mx-auto my-4 backdrop-blur-md shadow-2xl">
        <User className="mx-auto text-[#ff4d4d]/70 mb-3" size={38} />
        <h4 className="text-lg font-black text-white uppercase tracking-wider mb-1.5">
          {lang === 'ru' ? 'Авторизация' : 'Authorization'}
        </h4>
        <p className="text-gray-300 mb-6 font-bold uppercase tracking-wider text-[11px] max-w-xs mx-auto leading-relaxed">
          {(t as any).chatLoginToView || t.chatsLoginToView || (lang === 'ru' ? 'Войдите, чтобы просмотреть чаты' : 'Log in to view chats')}
        </p>
        <div className="flex flex-col gap-3 items-stretch w-full max-w-xs mx-auto">
          <GoogleLoginButton lang={lang} className="w-full" size="md" />
          <button
            onClick={() => window.dispatchEvent(new Event('openEmailLogin'))}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#3d2b4f]/50 border border-[#3d2b4f] text-white rounded-2xl font-black uppercase tracking-wider text-xs hover:bg-[#ff4d4d] hover:text-[#15101e] hover:border-[#ff4d4d] transition-all active:scale-95 shadow-lg cursor-pointer"
          >
            <Mail size={15} />
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

      {/* Search Bar & Actions */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
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

        {/* Create Group Chat */}
        <button
          onClick={() => { setShowNewGroup(!showNewGroup); setShowNewChat(false); }}
          className={`shrink-0 p-3 rounded-2xl border transition-all flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs ${
            showNewGroup
              ? 'bg-[#00f0ff] border-[#00f0ff] text-[#0d0714] shadow-[0_0_15px_rgba(0,240,255,0.3)]'
              : 'bg-[#3d2b4f]/30 border-[#3d2b4f]/50 text-[#00f0ff] hover:bg-[#3d2b4f]/50'
          }`}
          title={lang === 'ru' ? 'Создать групповой чат' : 'Create Group Chat'}
        >
          <Users size={18} />
        </button>

        {/* Start New Direct Chat */}
        <button
          onClick={() => { setShowNewChat(!showNewChat); setShowNewGroup(false); }}
          className={`shrink-0 p-3 rounded-2xl border transition-all flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs ${
            showNewChat
              ? 'bg-[#ff4d4d] border-[#ff4d4d] text-[#0d0714] shadow-[0_0_15px_rgba(255,77,77,0.3)]'
              : 'bg-[#3d2b4f]/30 border-[#3d2b4f]/50 text-[#ff4d4d] hover:bg-[#3d2b4f]/50'
          }`}
          title={lang === 'ru' ? 'Начать новый чат' : 'Start new chat'}
        >
          <UserPlus size={18} />
        </button>
      </div>

      {/* New Group Chat Inline Panel */}
      <AnimatePresence>
        {showNewGroup && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#1b1229]/60 border border-[#00f0ff]/30 rounded-2xl p-4 overflow-hidden space-y-3 shadow-inner"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-widest text-[#00f0ff]">
                {lang === 'ru' ? 'Создание группы:' : 'Create Group:'}
              </span>
              <button onClick={() => setShowNewGroup(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={14} />
              </button>
            </div>

            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder={lang === 'ru' ? 'Название группы...' : 'Group name...'}
              className="w-full bg-[#0d0714]/60 border border-[#3d2b4f]/40 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00f0ff] transition-all"
            />

            <input
              type="text"
              value={groupSearchQuery}
              onChange={(e) => setGroupSearchQuery(e.target.value)}
              placeholder={lang === 'ru' ? 'Поиск участников...' : 'Search participants...'}
              className="w-full bg-[#0d0714]/60 border border-[#3d2b4f]/40 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00f0ff] transition-all"
            />

            <div className="max-h-40 overflow-y-auto space-y-1.5 custom-scrollbar">
              {groupUsersFiltered.length === 0 ? (
                <p className="text-xs text-gray-500 italic py-2 text-center">
                  {lang === 'ru' ? 'Пользователи не найдены' : 'No users found'}
                </p>
              ) : (
                groupUsersFiltered.map(u => {
                  const isSelected = selectedParticipants.includes(u.uid);
                  return (
                    <button
                      key={u.uid}
                      onClick={() => toggleGroupParticipant(u.uid)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all ${
                        isSelected 
                          ? 'bg-[#00f0ff]/10 border-[#00f0ff]/40' 
                          : 'bg-[#0d0714]/40 border-[#3d2b4f]/20 hover:border-[#00f0ff]/20'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {u.photoURL ? (
                          <img src={u.photoURL} alt="" className="w-7 h-7 rounded-lg object-cover border border-[#3d2b4f]/50" />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-[#00f0ff]/10 flex items-center justify-center border border-[#3d2b4f]/50">
                            <User className="w-3.5 h-3.5 text-[#00f0ff]" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-black text-white truncate uppercase tracking-wider">{u.displayName || 'User'}</p>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                        isSelected ? 'bg-[#00f0ff] border-[#00f0ff]' : 'border-gray-500'
                      }`}>
                        {isSelected && <Check size={10} className="text-[#0d0714] stroke-[3]" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <button
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || selectedParticipants.length === 0}
              className="w-full py-2 bg-[#00f0ff] hover:bg-white text-[#0d0714] rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:hover:bg-[#00f0ff]"
            >
              {lang === 'ru' ? 'Создать группу' : 'Create Group'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Chat Inline Panel */}
      <AnimatePresence>
        {showNewChat && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#1b1229]/60 border border-[#ff4d4d]/30 rounded-2xl p-4 overflow-hidden space-y-3 shadow-inner"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-widest text-[#ff4d4d]">
                {lang === 'ru' ? 'Выберите пользователя:' : 'Select a user:'}
              </span>
              <button onClick={() => { setShowNewChat(false); setNewChatSearch(''); }} className="text-gray-400 hover:text-white transition-colors">
                <X size={14} />
              </button>
            </div>
            
            <input
              type="text"
              value={newChatSearch}
              onChange={(e) => setNewChatSearch(e.target.value)}
              placeholder={lang === 'ru' ? 'Поиск пользователей...' : 'Search users...'}
              className="w-full bg-[#0d0714]/60 border border-[#3d2b4f]/40 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#ff4d4d] transition-all"
            />
            
            <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar">
              {otherUsers.length === 0 ? (
                <p className="text-xs text-gray-500 italic py-2 text-center">
                  {lang === 'ru' ? 'Никого не найдено' : 'No users found'}
                </p>
              ) : (
                otherUsers.map(u => (
                  <button
                    key={u.uid}
                    onClick={() => {
                      onSelectChat(u.uid, u.displayName, u.photoURL);
                      setShowNewChat(false);
                      setNewChatSearch('');
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-xl bg-[#0d0714]/40 hover:bg-[#ff4d4d]/10 border border-[#3d2b4f]/20 hover:border-[#ff4d4d]/30 text-left transition-all"
                  >
                    {u.photoURL ? (
                      <img src={u.photoURL} alt="" className="w-8 h-8 rounded-lg object-cover border border-[#3d2b4f]/50" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-[#ff4d4d]/10 flex items-center justify-center border border-[#3d2b4f]/50">
                        <User className="w-4 h-4 text-[#ff4d4d]" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-white truncate uppercase tracking-wider">{u.displayName || 'User'}</p>
                      <p className="text-[10px] text-gray-500 truncate">{u.email}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat List */}
      <div className="space-y-3">
        {displayChats.length === 0 ? (
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
          displayChats.map((chat) => (
            <ChatItem 
              key={chat.id} 
              chat={chat} 
              currentUserId={user?.uid || ''} 
              lang={lang} 
              profile={chat.isGroup ? null : (profiles[chat.participants.find(p => p !== user?.uid) || ''] || null)}
              onSelect={onSelectChat} 
              isActive={chat.id === activeChatId || chat.participants.includes(activeChatId || '')}
            />
          ))
        )}
      </div>
    </div>
  );
};
