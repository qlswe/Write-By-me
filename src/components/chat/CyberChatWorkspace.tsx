import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare, Users, Radio, Search, Plus, Sparkles, Settings, User,
  Volume2, VolumeX, Shield, CircleDot, ChevronRight, ArrowLeft, Send,
  Smile, Image as ImageIcon, Paperclip, Mic, Globe, Zap, Heart, Flame,
  Radio as RadioIcon, Bookmark, Pin, Check, CheckCheck
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useChat, Chat } from '../../hooks/useChat';
import { useUsers } from '../../hooks/useUsers';
import { Language, translations } from '../../data/translations';
import { CachedAvatar } from '../ui/CachedAvatar';
import { ChatWindow } from './ChatWindow';
import { dbQueryCore } from '../../utils/dbQueryCore';
import { db } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';

interface CyberChatWorkspaceProps {
  lang: Language;
  onOpenProfileModal: () => void;
  activeChatFromApp?: { uid: string; displayName: string; photoURL?: string } | null;
  setActiveChatFromApp?: (chat: { uid: string; displayName: string; photoURL?: string } | null) => void;
}

export const CyberChatWorkspace: React.FC<CyberChatWorkspaceProps> = ({
  lang,
  onOpenProfileModal,
  activeChatFromApp,
  setActiveChatFromApp
}) => {
  const { user } = useAuth();
  const { chats, loading } = useChat();
  const { users } = useUsers();
  const t = translations[lang] as any;

  // Active chat state (defaults to Global Radio Room if user clicks it)
  const [selectedChat, setSelectedChat] = useState<{
    uid: string;
    displayName: string;
    photoURL?: string;
    isGroup?: boolean;
  } | null>(null);

  // Tab: 'all' | 'directs' | 'groups' | 'radio'
  const [activeTab, setActiveTab] = useState<'all' | 'directs' | 'groups'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync with App-level activeChat if provided
  useEffect(() => {
    if (activeChatFromApp) {
      setSelectedChat({
        uid: activeChatFromApp.uid,
        displayName: activeChatFromApp.displayName,
        photoURL: activeChatFromApp.photoURL
      });
    }
  }, [activeChatFromApp]);

  // Ensure Global Radio Room chat document exists in Firestore
  const GLOBAL_RADIO_ROOM = useMemo(() => ({
    uid: 'group_ahi_radio_room',
    displayName: lang === 'ru' ? '🌐 ОБЩИЙ РАДИО-ЧАТ AHI' : '🌐 AHI GLOBAL RADIO ROOM',
    photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=AHI-Radio-Hub',
    isGroup: true
  }), [lang]);

  useEffect(() => {
    const initRadioRoom = async () => {
      if (!user) return;
      try {
        await setDoc(doc(db, 'chats', 'group_ahi_radio_room'), {
          id: 'group_ahi_radio_room',
          name: lang === 'ru' ? '🌐 ОБЩИЙ РАДИО-ЧАТ AHI' : '🌐 AHI GLOBAL RADIO ROOM',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AHI-Radio-Hub',
          isGroup: true,
          participants: [user.uid],
          updatedAt: Date.now()
        }, { merge: true });
      } catch (e) {
        console.warn('initRadioRoom error:', e);
      }
    };
    initRadioRoom();
  }, [user, lang]);

  // Filter chats & users
  const filteredChats = useMemo(() => {
    const queryLower = searchQuery.toLowerCase().trim();
    return chats.filter(c => {
      if (activeTab === 'groups' && !c.isGroup) return false;
      if (activeTab === 'directs' && c.isGroup) return false;
      if (!queryLower) return true;
      const name = c.name || '';
      return name.toLowerCase().includes(queryLower);
    });
  }, [chats, activeTab, searchQuery]);

  // Other users list for quick direct chats
  const otherUsers = useMemo(() => {
    if (!user) return [];
    const queryLower = searchQuery.toLowerCase().trim();
    return users.filter(u => {
      if (u.uid === user.uid) return false;
      if (!queryLower) return true;
      return (u.displayName || '').toLowerCase().includes(queryLower) || (u.email || '').toLowerCase().includes(queryLower);
    });
  }, [users, user, searchQuery]);

  const handleSelectChat = (uid: string, displayName: string, photoURL?: string, isGroup?: boolean) => {
    const chatObj = { uid, displayName, photoURL, isGroup };
    setSelectedChat(chatObj);
    if (setActiveChatFromApp) {
      setActiveChatFromApp(chatObj);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto h-[calc(100vh-140px)] min-h-[600px] bg-[#0d0b14] border border-[#3d2b4f] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative">
      {/* LEFT SIDEBAR: CHAT CHANNELS & DIRECTS */}
      <div className={`w-full md:w-[340px] lg:w-[380px] bg-[#15101e] border-r border-[#3d2b4f] flex flex-col shrink-0 h-full ${
        selectedChat ? 'hidden md:flex' : 'flex'
      }`}>
        {/* Sidebar Header */}
        <div className="p-4 bg-[#251c35] border-b border-[#3d2b4f] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#ff4d4d]/10 border border-[#ff4d4d]/40 flex items-center justify-center text-[#ff4d4d]">
              <MessageSquare size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-white">
                {lang === 'ru' ? 'КИБЕР-ЧАТ AHI' : 'AHI CYBER CHAT'}
              </h2>
              <span className="text-[10px] text-gray-400 font-mono block">
                {lang === 'ru' ? 'ОНЛАЙН СТАНЦИЯ' : 'ONLINE STATION'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenProfileModal}
            className="p-2 bg-[#1c132c] hover:bg-[#ff4d4d] text-gray-300 hover:text-[#15101e] border border-[#3d2b4f] hover:border-[#ff4d4d] rounded-xl transition-all cursor-pointer shadow-md"
            title={lang === 'ru' ? 'Настройки и профиль' : 'Settings & profile'}
          >
            <Settings size={18} />
          </button>
        </div>

        {/* Global Radio Chat Featured Button */}
        <div className="p-3 border-b border-[#3d2b4f]/60 bg-[#1c132c]/50">
          <button
            type="button"
            onClick={() => handleSelectChat(
              GLOBAL_RADIO_ROOM.uid,
              GLOBAL_RADIO_ROOM.displayName,
              GLOBAL_RADIO_ROOM.photoURL,
              true
            )}
            className={`w-full p-3 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer group ${
              selectedChat?.uid === GLOBAL_RADIO_ROOM.uid
                ? 'bg-gradient-to-r from-[#ff4d4d]/20 to-[#a855f7]/20 border-[#ff4d4d] shadow-[0_0_20px_rgba(255,77,77,0.25)]'
                : 'bg-[#251c35]/80 hover:bg-[#251c35] border-[#3d2b4f] hover:border-purple-500/50'
            }`}
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#ff4d4d] to-[#a855f7] flex items-center justify-center text-[#15101e] shrink-0 shadow-lg group-hover:scale-105 transition-transform">
              <Radio size={24} className="animate-pulse" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-white truncate">
                  {GLOBAL_RADIO_ROOM.displayName}
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-gray-400 truncate mt-0.5">
                {lang === 'ru' ? '🔥 Общий чат станции для всех пользователей' : '🔥 Community chat station for everyone'}
              </p>
            </div>
          </button>
        </div>

        {/* Tabs: All / Directs / Groups */}
        <div className="px-3 py-2 border-b border-[#3d2b4f] flex items-center gap-1.5 bg-[#1a1428]">
          {[
            { id: 'all', label: lang === 'ru' ? 'Все' : 'All', icon: MessageSquare },
            { id: 'directs', label: lang === 'ru' ? 'Личные' : 'Directs', icon: User },
            { id: 'groups', label: lang === 'ru' ? 'Группы' : 'Groups', icon: Users }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#ff4d4d] text-[#15101e] shadow-md'
                    : 'bg-[#251c35] text-gray-400 hover:text-white'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-[#3d2b4f]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'ru' ? 'Поиск чатов и пользователей...' : 'Search chats & users...'}
              className="w-full bg-[#0d0b14] border border-[#3d2b4f] rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#ff4d4d] transition-colors"
            />
          </div>
        </div>

        {/* Chats & Users List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
          {/* Active Chats section */}
          {filteredChats.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 block">
                {lang === 'ru' ? 'Активные диалоги' : 'Active Conversations'}
              </span>
              {filteredChats.map(chat => {
                const isCurrent = selectedChat?.uid === chat.id;
                const name = chat.name || (lang === 'ru' ? 'Чат' : 'Chat');
                return (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => handleSelectChat(chat.id, name, chat.avatar, chat.isGroup)}
                    className={`w-full p-2.5 rounded-xl border transition-all flex items-center gap-3 text-left cursor-pointer ${
                      isCurrent
                        ? 'bg-[#251c35] border-[#ff4d4d] shadow-md'
                        : 'bg-transparent hover:bg-[#1f162e] border-transparent hover:border-[#3d2b4f]'
                    }`}
                  >
                    <CachedAvatar
                      src={chat.avatar}
                      alt={name}
                      customSizeClass="w-10 h-10"
                      className="rounded-full shrink-0 border border-[#3d2b4f]"
                      fallbackText={name}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate">
                          {name}
                        </span>
                        {chat.isGroup && (
                          <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-md font-mono">
                            Group
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">
                        {chat.lastMessage || (lang === 'ru' ? 'Нет сообщений' : 'No messages')}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Users for Direct Message section */}
          <div className="space-y-1 pt-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 block">
              {lang === 'ru' ? 'Участники и пользователи' : 'Community Members'}
            </span>
            {otherUsers.map(u => {
              const isCurrent = selectedChat?.uid === u.uid;
              const dName = u.displayName || u.email || 'Cyber User';
              return (
                <button
                  key={u.uid}
                  type="button"
                  onClick={() => handleSelectChat(u.uid, dName, u.photoURL, false)}
                  className={`w-full p-2.5 rounded-xl border transition-all flex items-center gap-3 text-left cursor-pointer ${
                    isCurrent
                      ? 'bg-[#251c35] border-[#ff4d4d] shadow-md'
                      : 'bg-transparent hover:bg-[#1f162e] border-transparent hover:border-[#3d2b4f]'
                  }`}
                >
                  <div className="relative shrink-0">
                    <CachedAvatar
                      src={u.photoURL}
                      alt={dName}
                      customSizeClass="w-10 h-10"
                      className="rounded-full border border-[#3d2b4f]"
                      fallbackText={dName}
                    />
                    <span
                      className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#15101e]"
                      style={{ backgroundColor: (u as any).tagColor || '#22c55e' }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate">
                        {dName}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">
                      {(u as any).statusMessage || (lang === 'ru' ? 'Слушаю AHI Radio 📻' : 'Listening to AHI Radio 📻')}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* User's Cyber Identity Card at Bottom */}
        {user && (
          <div className="p-3 bg-[#1a1428] border-t border-[#3d2b4f] flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <CachedAvatar
                src={user.photoURL || undefined}
                alt={user.displayName || 'Me'}
                customSizeClass="w-10 h-10"
                className="rounded-full border-2 shrink-0"
                style={{ borderColor: '#ff4d4d' }}
                fallbackText={user.displayName || 'Me'}
              />
              <div className="min-w-0">
                <span className="text-xs font-black uppercase text-white truncate block">
                  {user.displayName || user.email?.split('@')[0] || 'Cyber User'}
                </span>
                <span className="text-[10px] text-gray-400 truncate block">
                  {lang === 'ru' ? '🟢 В сети • AHI Кибер' : '🟢 Online • AHI Cyber'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenProfileModal}
              className="px-2.5 py-1.5 bg-[#ff4d4d] hover:bg-white text-[#15101e] font-black rounded-lg text-[11px] transition-all uppercase shrink-0 cursor-pointer shadow"
            >
              {lang === 'ru' ? 'Профиль' : 'Profile'}
            </button>
          </div>
        )}
      </div>

      {/* RIGHT MAIN PANE: ACTIVE CHAT CONVERSATION */}
      <div className={`flex-1 h-full bg-[#0d0714] flex flex-col relative ${
        !selectedChat ? 'hidden md:flex' : 'flex'
      }`}>
        {selectedChat ? (
          <div className="w-full h-full flex flex-col relative">
            {/* Mobile Back Button Bar */}
            <div className="md:hidden p-2.5 bg-[#15101e] border-b border-[#3d2b4f] flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedChat(null);
                  if (setActiveChatFromApp) setActiveChatFromApp(null);
                }}
                className="p-1.5 bg-[#251c35] text-white rounded-lg hover:bg-[#ff4d4d] hover:text-[#15101e] transition-colors cursor-pointer"
              >
                <ArrowLeft size={18} />
              </button>
              <span className="text-xs font-bold text-white truncate">
                {selectedChat.displayName}
              </span>
            </div>

            {/* Embedded ChatWindow */}
            <div className="flex-1 h-full overflow-hidden relative">
              <ChatWindow
                recipientId={selectedChat.uid}
                recipientName={selectedChat.displayName}
                recipientPhoto={selectedChat.photoURL}
                lang={lang}
                onClose={() => {
                  setSelectedChat(null);
                  if (setActiveChatFromApp) setActiveChatFromApp(null);
                }}
                onSelectChat={(id, name, photo) => handleSelectChat(id, name, photo)}
              />
            </div>
          </div>
        ) : (
          /* Empty / Welcome State when no chat is selected */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
            {/* Ambient cyberpunk glow */}
            <div className="absolute w-96 h-96 bg-[#ff4d4d]/10 rounded-full blur-3xl pointer-events-none -top-20 -right-20" />
            <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -bottom-20 -left-20" />

            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#ff4d4d] to-[#a855f7] flex items-center justify-center text-[#15101e] shadow-[0_0_30px_rgba(255,77,77,0.3)] mb-6 animate-pulse">
              <RadioIcon size={44} />
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider mb-2">
              {lang === 'ru' ? 'ДОБРО ПОЖАЛОВАТЬ В КИБЕР-ЧАТ AHI' : 'WELCOME TO AHI CYBER CHAT'}
            </h3>
            <p className="text-sm text-gray-400 max-w-md mb-8 leading-relaxed">
              {lang === 'ru'
                ? 'Общайтесь в прямом эфире в нашем общем Радио-Чате, создавайте кибер-группы и отправляйте личные сообщения с кастомными тегами и аватарами!'
                : 'Chat live in our Global Radio Room, create cyber-groups, and send direct messages with custom tags and avatars!'}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => handleSelectChat(
                  GLOBAL_RADIO_ROOM.uid,
                  GLOBAL_RADIO_ROOM.displayName,
                  GLOBAL_RADIO_ROOM.photoURL,
                  true
                )}
                className="px-6 py-3.5 bg-[#ff4d4d] hover:bg-white text-[#15101e] font-black uppercase tracking-widest text-xs rounded-xl shadow-[0_0_20px_rgba(255,77,77,0.3)] transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Radio size={18} />
                {lang === 'ru' ? '🚀 Войти в Общий Радио-Чат' : '🚀 Enter Global Radio Room'}
              </button>

              <button
                type="button"
                onClick={onOpenProfileModal}
                className="px-6 py-3.5 bg-[#251c35] hover:bg-[#3d2b4f] text-white border border-[#3d2b4f] font-bold uppercase tracking-wider text-xs rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Sparkles size={18} className="text-purple-400" />
                {lang === 'ru' ? 'Кастомизировать профиль' : 'Customize Profile'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
