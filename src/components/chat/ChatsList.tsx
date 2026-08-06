import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare, Users, User, Search, Plus, Trash2, ShieldAlert,
  X, Check, Sparkles, UserPlus, Radio, Circle, Settings
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useChat, Chat } from '../../hooks/useChat';
import { useUsers } from '../../hooks/useUsers';
import { Language, translations } from '../../data/translations';
import { CachedAvatar } from '../ui/CachedAvatar';
import { decrypt } from '../../utils/encryption';
import { checkIsUserOnline, formatLastSeenStatus } from '../../utils/userStatus';

interface ChatsListProps {
  lang: Language;
  onSelectChat: (id: string, name: string, photo?: string) => void;
  activeChatId?: string;
}

const formatTimeAgo = (val: any, lang: Language) => {
  if (!val) return '';
  let date: Date;
  if (typeof val?.toMillis === 'function') date = new Date(val.toMillis());
  else if (typeof val?.toDate === 'function') date = val.toDate();
  else if (val instanceof Date) date = val;
  else if (typeof val === 'number') date = new Date(val);
  else if (typeof val === 'string') date = new Date(val);
  else if (typeof val?.seconds === 'number') date = new Date(val.seconds * 1000);
  else return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return lang === 'ru' ? 'только что' : 'just now';
  if (diffMins < 60) return `${diffMins} ${lang === 'ru' ? 'м' : 'm'}`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} ${lang === 'ru' ? 'ч' : 'h'}`;
  return date.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { month: 'short', day: 'numeric' });
};

export const ChatsList: React.FC<ChatsListProps> = ({ lang, onSelectChat, activeChatId }) => {
  const { user } = useAuth();
  const { chats, loading, deleteChat, deleteAllChats, createGroupChat } = useChat();
  const { users } = useUsers();
  const t = translations[lang] as any;

  // Search & Tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'directs' | 'groups'>('all');

  // Modal States
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  // Filtered Chats
  const filteredChats = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return chats.filter((c) => {
      if (activeTab === 'groups' && !c.isGroup) return false;
      if (activeTab === 'directs' && c.isGroup) return false;
      if (!q) return true;
      const name = c.name || '';
      return name.toLowerCase().includes(q);
    });
  }, [chats, activeTab, searchQuery]);

  // Other platform users for new 1-on-1 chats or groups
  const otherUsers = useMemo(() => {
    if (!user) return [];
    const q = searchQuery.toLowerCase().trim();
    return users.filter((u) => {
      if (u.uid === user.uid) return false;
      if (!q) return true;
      return (
        (u.displayName || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      );
    });
  }, [users, user, searchQuery]);

  // Handle single chat delete
  const handleDeleteSingleChat = async (e: React.MouseEvent, recipientId: string, chatName: string) => {
    e.stopPropagation();
    if (confirm(lang === 'ru' ? `Удалить чат в целом "${chatName}"?` : `Delete entire chat "${chatName}"?`)) {
      await deleteChat(recipientId);
      if (activeChatId === recipientId) {
        onSelectChat('', '');
      }
      window.dispatchEvent(
        new CustomEvent('aha_toast', {
          detail: lang === 'ru' ? 'Чат успешно удален' : 'Chat deleted successfully'
        })
      );
    }
  };

  // Handle delete all chats confirm
  const handleDeleteAllConfirm = async () => {
    await deleteAllChats();
    setShowDeleteAllModal(false);
    onSelectChat('', '');
    window.dispatchEvent(
      new CustomEvent('aha_toast', {
        detail: lang === 'ru' ? 'Все чаты очищены' : 'All chats cleared'
      })
    );
  };

  // Handle Create Group
  const handleCreateGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedParticipants.length === 0) return;

    const newGroupId = await createGroupChat(groupName, selectedParticipants);
    if (newGroupId) {
      setShowGroupModal(false);
      setGroupName('');
      setSelectedParticipants([]);
      onSelectChat(newGroupId, groupName, undefined);
      window.dispatchEvent(
        new CustomEvent('aha_toast', {
          detail: lang === 'ru' ? 'Группа создана!' : 'Group created!'
        })
      );
    }
  };

  return (
    <div className="w-full flex flex-col h-full bg-[#15101e] text-white rounded-3xl overflow-hidden border border-[#3d2b4f]/60 shadow-xl">
      {/* Header Bar */}
      <div className="p-4 bg-[#251c35] border-b border-[#3d2b4f] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#ff4d4d]/15 border border-[#ff4d4d]/40 flex items-center justify-center text-[#ff4d4d] shadow">
            <MessageSquare size={18} />
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-white">
              {lang === 'ru' ? 'Кибер Чаты' : 'Cyber Chats'}
            </h2>
            <span className="text-[10px] font-mono text-gray-400 block">
              {chats.length} {lang === 'ru' ? 'диалогов' : 'active chats'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* New Group Button */}
          <button
            type="button"
            onClick={() => setShowGroupModal(true)}
            className="p-2 bg-[#ff4d4d]/10 hover:bg-[#ff4d4d] text-[#ff4d4d] hover:text-[#15101e] border border-[#ff4d4d]/30 rounded-xl transition-all cursor-pointer"
            title={lang === 'ru' ? 'Создать группу' : 'Create Group'}
          >
            <Users size={16} />
          </button>

          {/* Clear All Chats Button */}
          {chats.length > 0 && (
            <button
              type="button"
              onClick={() => setShowDeleteAllModal(true)}
              className="p-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 rounded-xl transition-all cursor-pointer"
              title={lang === 'ru' ? 'Очистить все чаты' : 'Clear all chats'}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-3 py-2 border-b border-[#3d2b4f] flex items-center gap-1 bg-[#1a1428] shrink-0">
        {[
          { id: 'all', label: lang === 'ru' ? 'Все' : 'All', icon: MessageSquare },
          { id: 'directs', label: lang === 'ru' ? 'Личные' : 'Directs', icon: User },
          { id: 'groups', label: lang === 'ru' ? 'Группы' : 'Groups', icon: Users }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#ff4d4d] text-[#15101e] shadow-md'
                  : 'bg-[#251c35] text-gray-400 hover:text-white'
              }`}
            >
              <Icon size={13} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-[#3d2b4f] shrink-0">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'ru' ? 'Поиск...' : 'Search...'}
            className="w-full bg-[#0d0b14] border border-[#3d2b4f] rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#ff4d4d] transition-colors"
          />
        </div>
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3 custom-scrollbar">
        {/* Active Conversations Section */}
        {filteredChats.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-2 block">
              {lang === 'ru' ? 'Ваши диалоги' : 'Your Conversations'}
            </span>
            {filteredChats.map((chat) => {
              const isActive = chat.id === activeChatId;
              const chatName = chat.name || (lang === 'ru' ? 'Чат' : 'Chat');
              const recipientId = chat.isGroup
                ? chat.id
                : chat.participants?.find((p) => p !== user?.uid) || '';
              const recipientUser = users.find((u) => u.uid === recipientId);
              const isOnline = checkIsUserOnline(recipientUser);

              return (
                <div
                  key={chat.id}
                  onClick={() => onSelectChat(recipientId || chat.id, chatName, chat.avatar)}
                  className={`group relative p-2.5 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer ${
                    isActive
                      ? 'bg-[#2a1d3d] border-[#ff4d4d] shadow-lg'
                      : 'bg-[#1a1329]/60 hover:bg-[#251b36] border-[#3d2b4f]/40 hover:border-[#ff4d4d]/40'
                  }`}
                >
                  <div className="relative shrink-0">
                    <CachedAvatar
                      src={chat.avatar}
                      alt={chatName}
                      customSizeClass="w-10 h-10"
                      className="rounded-full border border-[#3d2b4f]"
                      fallbackText={chatName}
                    />
                    {chat.isGroup ? (
                      <span className="absolute -bottom-1 -right-1 bg-purple-600 text-white p-0.5 rounded-full border border-[#15101e]">
                        <Users size={10} />
                      </span>
                    ) : (
                      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#15101e] ${isOnline ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]' : 'bg-gray-500'}`} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-black text-white truncate">{chatName}</span>
                      {chat.lastMessageAt && (
                        <span className="text-[9px] font-mono text-gray-400 shrink-0">
                          {formatTimeAgo(chat.lastMessageAt, lang)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5 font-medium leading-tight">
                      {chat.lastMessage
                        ? (() => {
                            const decryptedPreview = decrypt(chat.lastMessage, recipientId || chat.id) || chat.lastMessage;
                            return decryptedPreview.length > 60 ? `${decryptedPreview.slice(0, 60)}...` : decryptedPreview;
                          })()
                        : (lang === 'ru' ? 'Сообщений пока нет' : 'No messages yet')}
                    </p>
                  </div>

                  {/* Delete entire chat button */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSingleChat(e, recipientId || chat.id, chatName)}
                    className="opacity-70 group-hover:opacity-100 p-1.5 bg-red-500/10 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-lg transition-all shrink-0 cursor-pointer ml-1"
                    title={lang === 'ru' ? 'Удалить чат в целом' : 'Delete entire chat'}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Start New Chat with Members Section */}
        <div className="space-y-1 pt-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-2 block">
            {lang === 'ru' ? 'Начать чат с пользователем' : 'Start Chat With Member'}
          </span>
          {otherUsers.map((u) => {
            const displayName = u.displayName || u.email || 'Cyber User';
            const isOnline = checkIsUserOnline(u);
            const statusInfo = formatLastSeenStatus(u, lang);
            return (
              <div
                key={u.uid}
                onClick={() => onSelectChat(u.uid, displayName, u.photoURL)}
                className="p-2.5 rounded-2xl bg-[#1a1329]/40 hover:bg-[#251b36] border border-[#3d2b4f]/30 hover:border-[#ff4d4d]/40 transition-all flex items-center gap-3 cursor-pointer"
              >
                <div className="relative shrink-0">
                  <CachedAvatar
                    src={u.photoURL}
                    alt={displayName}
                    customSizeClass="w-10 h-10"
                    className="rounded-full border border-[#3d2b4f]"
                    fallbackText={displayName}
                  />
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#15101e] ${isOnline ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]' : 'bg-gray-500'}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-white truncate block">
                    {displayName}
                  </span>
                  <p className="text-[11px] text-gray-400 truncate mt-0.5 font-mono">
                    {statusInfo.statusText}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Group Modal */}
      <AnimatePresence>
        {showGroupModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#15101e] border border-[#ff4d4d]/40 rounded-3xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[#3d2b4f] pb-3">
                <div className="flex items-center gap-2 text-[#ff4d4d]">
                  <Users size={20} />
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    {lang === 'ru' ? 'Создать Групповой Чат' : 'Create Group Chat'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
                  className="p-1 text-gray-400 hover:text-white rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateGroupSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">
                    {lang === 'ru' ? 'Название группы' : 'Group Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder={lang === 'ru' ? 'Например: Кибер Команда' : 'e.g. Cyber Squad'}
                    className="w-full bg-[#0d0b14] border border-[#3d2b4f] rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#ff4d4d]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">
                    {lang === 'ru' ? 'Выберите участников' : 'Select Participants'}
                  </label>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-[#0d0b14] border border-[#3d2b4f] rounded-xl custom-scrollbar">
                    {otherUsers.map((u) => {
                      const isSelected = selectedParticipants.includes(u.uid);
                      const name = u.displayName || u.email || 'User';
                      return (
                        <div
                          key={u.uid}
                          onClick={() => {
                            setSelectedParticipants((prev) =>
                              isSelected ? prev.filter((id) => id !== u.uid) : [...prev, u.uid]
                            );
                          }}
                          className={`p-2 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected ? 'bg-[#ff4d4d]/20 border border-[#ff4d4d]/50' : 'hover:bg-[#251c35]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <CachedAvatar
                              src={u.photoURL}
                              alt={name}
                              customSizeClass="w-7 h-7"
                              className="rounded-full"
                              fallbackText={name}
                            />
                            <span className="text-xs text-white font-medium truncate">{name}</span>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                              isSelected ? 'bg-[#ff4d4d] border-[#ff4d4d] text-[#15101e]' : 'border-gray-500'
                            }`}
                          >
                            {isSelected && <Check size={14} className="stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowGroupModal(false)}
                    className="flex-1 py-3 bg-[#251c35] hover:bg-[#32204d] text-gray-300 font-bold rounded-xl text-xs uppercase transition-all"
                  >
                    {lang === 'ru' ? 'Отмена' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={!groupName.trim() || selectedParticipants.length === 0}
                    className="flex-1 py-3 bg-[#ff4d4d] hover:bg-white text-[#15101e] disabled:opacity-50 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(255,77,77,0.4)]"
                  >
                    {lang === 'ru' ? 'Создать' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete All Confirmation Modal */}
      <AnimatePresence>
        {showDeleteAllModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#15101e] border border-red-500/40 rounded-3xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center gap-3 text-red-400">
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl">
                  <ShieldAlert size={26} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    {lang === 'ru' ? 'Очистить все чаты?' : 'Clear all chats?'}
                  </h3>
                  <p className="text-[10px] text-red-400/80 font-mono">
                    {lang === 'ru' ? 'Действие нельзя отменить' : 'Cannot be undone'}
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed bg-[#0d0814] p-4 rounded-2xl border border-white/5">
                {lang === 'ru'
                  ? 'Все ваши активные диалоги и истории переписок будут удалены с вашего экрана.'
                  : 'All your active conversations and chat histories will be cleared.'}
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteAllModal(false)}
                  className="flex-1 py-3 bg-[#251c35] hover:bg-[#32204d] text-gray-300 font-bold rounded-xl text-xs uppercase"
                >
                  {lang === 'ru' ? 'Отмена' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAllConfirm}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(239,68,68,0.4)] flex items-center justify-center gap-2"
                >
                  <Trash2 size={15} />
                  <span>{lang === 'ru' ? 'Да, очистить' : 'Yes, Clear All'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
