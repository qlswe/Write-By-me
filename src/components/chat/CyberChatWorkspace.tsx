import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare, Radio, ArrowLeft, Radio as RadioIcon, Sparkles
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Language, translations } from '../../data/translations';
import { ChatWindow } from './ChatWindow';
import { ChatsList } from './ChatsList';
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
  const t = translations[lang] as any;

  // Active selected chat state
  const [selectedChat, setSelectedChat] = useState<{
    uid: string;
    displayName: string;
    photoURL?: string;
  } | null>(null);

  // Sync with App-level activeChat
  useEffect(() => {
    if (activeChatFromApp) {
      setSelectedChat({
        uid: activeChatFromApp.uid,
        displayName: activeChatFromApp.displayName,
        photoURL: activeChatFromApp.photoURL
      });
    }
  }, [activeChatFromApp]);

  // Global Community Radio Room configuration
  const GLOBAL_RADIO_ROOM = useMemo(
    () => ({
      uid: 'group_ahi_radio_room',
      displayName: lang === 'ru' ? '🌐 ОБЩИЙ РАДИО-ЧАТ AHI' : '🌐 AHI GLOBAL RADIO ROOM',
      photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=AHI-Radio-Hub'
    }),
    [lang]
  );

  // Ensure global radio chat document exists in Firestore
  useEffect(() => {
    const initRadioRoom = async () => {
      if (!user) return;
      try {
        await setDoc(
          doc(db, 'chats', 'group_ahi_radio_room'),
          {
            id: 'group_ahi_radio_room',
            name: lang === 'ru' ? '🌐 ОБЩИЙ РАДИО-ЧАТ AHI' : '🌐 AHI GLOBAL RADIO ROOM',
            avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AHI-Radio-Hub',
            isGroup: true,
            participants: [user.uid],
            updatedAt: Date.now()
          },
          { merge: true }
        );
      } catch (e) {
        console.warn('initRadioRoom error:', e);
      }
    };
    initRadioRoom();
  }, [user, lang]);

  const handleSelectChat = (uid: string, displayName: string, photoURL?: string) => {
    if (!uid) {
      setSelectedChat(null);
      if (setActiveChatFromApp) setActiveChatFromApp(null);
      return;
    }
    const chatObj = { uid, displayName, photoURL };
    setSelectedChat(chatObj);
    if (setActiveChatFromApp) {
      setActiveChatFromApp(chatObj);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto h-[calc(100vh-140px)] min-h-[600px] bg-[#0d0b14] border border-[#3d2b4f] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative">
      {/* Left Sidebar Pane: Chats List */}
      <div
        className={`w-full md:w-[360px] lg:w-[400px] bg-[#15101e] border-r border-[#3d2b4f] flex flex-col shrink-0 h-full ${
          selectedChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Global Radio Room Shortcut Button */}
        <div className="p-3 bg-[#1c132c] border-b border-[#3d2b4f] shrink-0">
          <button
            type="button"
            onClick={() =>
              handleSelectChat(
                GLOBAL_RADIO_ROOM.uid,
                GLOBAL_RADIO_ROOM.displayName,
                GLOBAL_RADIO_ROOM.photoURL
              )
            }
            className={`w-full p-3 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer group ${
              selectedChat?.uid === GLOBAL_RADIO_ROOM.uid
                ? 'bg-gradient-to-r from-[#ff4d4d]/20 to-[#a855f7]/20 border-[#ff4d4d] shadow-[0_0_20px_rgba(255,77,77,0.25)]'
                : 'bg-[#251c35] hover:bg-[#2e2343] border-[#3d2b4f] hover:border-purple-500/50'
            }`}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ff4d4d] to-[#a855f7] flex items-center justify-center text-[#15101e] shrink-0 shadow-lg group-hover:scale-105 transition-transform">
              <Radio size={22} className="animate-pulse" />
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
                {lang === 'ru' ? '🔥 Общий радио-чат для всех пользователей' : '🔥 Community radio chat room'}
              </p>
            </div>
          </button>
        </div>

        {/* Chats List Component */}
        <div className="flex-1 overflow-hidden">
          <ChatsList
            lang={lang}
            activeChatId={selectedChat?.uid}
            onSelectChat={handleSelectChat}
          />
        </div>
      </div>

      {/* Right Main Pane: Active Chat Window or Welcome Screen */}
      <div
        className={`flex-1 h-full bg-[#0d0714] flex flex-col relative ${
          !selectedChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        {selectedChat ? (
          <div className="w-full h-full flex flex-col relative">
            {/* Mobile Top Back Bar */}
            <div className="md:hidden p-3 bg-[#15101e] border-b border-[#3d2b4f] flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleSelectChat('', '')}
                className="p-1.5 bg-[#251c35] text-white rounded-xl hover:bg-[#ff4d4d] hover:text-[#15101e] transition-colors cursor-pointer"
              >
                <ArrowLeft size={18} />
              </button>
              <span className="text-xs font-bold text-white truncate">
                {selectedChat.displayName}
              </span>
            </div>

            {/* Embedded Active Chat Window */}
            <div className="flex-1 h-full overflow-hidden relative">
              <ChatWindow
                recipientId={selectedChat.uid}
                recipientName={selectedChat.displayName}
                recipientPhoto={selectedChat.photoURL}
                lang={lang}
                embedded={true}
                onClose={() => handleSelectChat('', '')}
                onSelectChat={handleSelectChat}
              />
            </div>
          </div>
        ) : (
          /* Empty / Welcome State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
            <div className="absolute w-96 h-96 bg-[#ff4d4d]/10 rounded-full blur-3xl pointer-events-none -top-20 -right-20" />
            <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -bottom-20 -left-20" />

            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#ff4d4d] to-[#a855f7] flex items-center justify-center text-[#15101e] shadow-[0_0_30px_rgba(255,77,77,0.3)] mb-6 animate-pulse">
              <RadioIcon size={44} />
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider mb-2">
              {lang === 'ru' ? 'КИБЕР-ЧАТ AHI STATION' : 'AHI STATION CYBER CHAT'}
            </h3>
            <p className="text-sm text-gray-400 max-w-md mb-8 leading-relaxed">
              {lang === 'ru'
                ? 'Выберите чат из списка или подключитесь к Общему Радио-Чату для общения в прямом эфире!'
                : 'Select a conversation from the sidebar or jump into the Global Radio Room!'}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={() =>
                  handleSelectChat(
                    GLOBAL_RADIO_ROOM.uid,
                    GLOBAL_RADIO_ROOM.displayName,
                    GLOBAL_RADIO_ROOM.photoURL
                  )
                }
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
                {lang === 'ru' ? 'Настройки профиля' : 'Profile Settings'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
