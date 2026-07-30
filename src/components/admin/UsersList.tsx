import React, { useState, useRef, useEffect } from 'react';
import { useUsers, UserData } from '../../hooks/useUsers';
import { useAuth } from '../../hooks/useAuth';
import { translations, Language } from '../../data/translations';
import { Shield, User, UserCheck, MessageSquare, ChevronDown, Search, X, Settings, Lock, Trash2, Ban, ImageOff, Plus, Mail, Smartphone, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { CachedAvatar } from '../ui/CachedAvatar';

interface UsersListProps {
  lang: Language;
  onOpenChat: (uid: string, name: string, photoURL?: string) => void;
  onViewProfile?: (user: UserData) => void;
}

const RoleSelector: React.FC<{
  user: UserData;
  updateUserRole: (uid: string, role: 'admin' | 'user' | 'moderator' | 'beta-tester') => void;
  t: any;
  lang: Language;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}> = ({ user, updateUserRole, t, lang, isOpen, onToggle, onClose }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const roles = [
    { value: 'user', label: t.roleUser },
    { value: 'beta-tester', label: t.roleBetaTester },
    { value: 'moderator', label: t.roleModerator },
    { value: 'admin', label: t.roleAdmin },
  ];

  const currentRole = roles.find(r => r.value === user.role) || roles[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={onToggle}
        className="bg-[#3d2b4f]/30 border border-[#3d2b4f]/50 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl px-4 py-3 outline-none focus:border-[#ff4d4d] transition-all cursor-pointer flex items-center gap-2 shadow-lg hover:bg-[#3d2b4f]/50"
      >
        {currentRole.label}
        <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#15101e] border border-[#3d2b4f] rounded-3xl overflow-hidden w-full max-w-[280px] shadow-[0_0_50px_rgba(0,0,0,0.5)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-4 border-b border-[#3d2b4f]/50 bg-[#0d0b14]/50">
                <h4 className="text-white font-black text-center tracking-widest text-xs uppercase">{t.selectRole || "Select role"}</h4>
              </div>
              <div className="flex flex-col p-2 gap-1">
                {roles.map((role) => (
                  <button
                    key={role.value}
                    onClick={() => {
                      updateUserRole(user.uid, role.value as any);
                      onClose();
                    }}
                    className={`w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest transition-colors rounded-xl ${
                      user.role === role.value 
                        ? 'bg-[#ff4d4d] text-[#15101e]' 
                        : 'text-white hover:bg-[#3d2b4f]/50'
                    }`}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const UserListItem = React.memo(({ 
  user, 
  isAdmin, 
  isModeratorOrAdmin,
  t, 
  lang, 
  openDropdownId, 
  setOpenDropdownId, 
  onViewProfile, 
  onOpenChat, 
  updateUserRole,
  updateUserVerification,
  deleteUser,
  toggleBlockUser,
  deleteAvatar,
  currentUserId,
  blockedDeviceIds = [],
  blockDeviceId,
  unblockDeviceId
}: { 
  user: UserData, 
  isAdmin: boolean, 
  isModeratorOrAdmin: boolean,
  t: any, 
  lang: Language, 
  openDropdownId: string | null, 
  setOpenDropdownId: (id: string | null) => void, 
  onViewProfile?: (user: UserData) => void, 
  onOpenChat: (uid: string, name: string, photoURL?: string) => void, 
  updateUserRole: (uid: string, role: 'admin' | 'user' | 'moderator' | 'beta-tester') => void,
  updateUserVerification: (uid: string, isVerified: boolean) => void,
  deleteUser: (uid: string) => void,
  toggleBlockUser: (uid: string, currentStatus?: boolean) => void,
  deleteAvatar: (uid: string) => void,
  currentUserId?: string,
  blockedDeviceIds?: string[],
  blockDeviceId?: (id: string) => void,
  unblockDeviceId?: (id: string) => void
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmAvatar, setConfirmAvatar] = useState(false);
  const [copiedDevice, setCopiedDevice] = useState(false);

  const isDeviceBlocked = user.deviceId ? blockedDeviceIds.includes(user.deviceId) : false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-[#15101e] border ${user.isBlocked || isDeviceBlocked ? 'border-red-500/50 bg-red-950/10' : 'border-[#3d2b4f]/30'} rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-[#ff4d4d]/30 transition-all hover:bg-[#251c35] relative ${openDropdownId === user.uid ? 'z-50' : 'z-10'}`}
    >
      <div className="flex items-center gap-4 sm:gap-5 flex-1 min-w-0">
        <button 
          onClick={() => onViewProfile?.(user)}
          className="relative shrink-0 hover:scale-105 transition-transform cursor-pointer"
        >
          <CachedAvatar
            src={user.photoURL}
            alt={user.displayName}
            customSizeClass="w-12 h-12 sm:w-14 sm:h-14"
            className="rounded-2xl border-2 border-[#3d2b4f]/50 group-hover:border-[#ff4d4d] transition-colors shadow-lg"
            fallbackText={user.displayName}
          />
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-4 border-[#0d0b14] ${
            user.lastSeen && (Date.now() - new Date(user.lastSeen).getTime() < 3 * 60 * 1000)
              ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' 
              : 'bg-gray-500 shadow-none'
          }`} />
        </button>
        <div className="min-w-0 flex-1">
          <h3 className="font-black text-white flex items-center gap-2 sm:gap-3 truncate uppercase tracking-tighter text-sm sm:text-base flex-wrap">
            <span className="truncate">{user.displayName}</span>
            {user.isBlocked && (
              <span className="bg-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded-lg border border-red-500/30 uppercase tracking-widest font-black">
                {lang === 'ru' ? 'Заблокирован' : 'Blocked'}
              </span>
            )}
            {isDeviceBlocked && (
              <span className="bg-purple-500/20 text-purple-300 text-[10px] px-2 py-0.5 rounded-lg border border-purple-500/40 uppercase tracking-widest font-black flex items-center gap-1">
                <Smartphone size={10} />
                {lang === 'ru' ? 'Устройство заблокировано' : 'Device Blocked'}
              </span>
            )}
            {user.isVerified && <UserCheck className="w-4.5 h-4.5 text-green-500 shrink-0" />}
            {user.role === 'admin' && <Shield className="w-4 h-4 text-red-500 shrink-0" />}
          </h3>
          <div className="flex items-center gap-3 flex-wrap mt-1">
            {isAdmin && user.email && <p className="text-[10px] text-gray-500 truncate font-black uppercase tracking-[0.2em]">{user.email}</p>}
            {isAdmin && user.deviceId && (
              <div className="flex items-center gap-1 text-[10px] font-mono text-purple-400/90 bg-purple-950/40 border border-purple-500/30 px-2 py-0.5 rounded-lg">
                <Smartphone size={10} className="text-purple-400 shrink-0" />
                <span className="truncate max-w-[150px]">{user.deviceId}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(user.deviceId!);
                    setCopiedDevice(true);
                    setTimeout(() => setCopiedDevice(false), 2000);
                  }}
                  className="hover:text-white transition-colors ml-1 cursor-pointer shrink-0"
                  title={lang === 'ru' ? 'Скопировать ID устройства' : 'Copy Device ID'}
                >
                  {copiedDevice ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap justify-end">
        <button
          onClick={() => onViewProfile?.(user)}
          className="p-2.5 sm:p-3 bg-[#3d2b4f]/30 hover:bg-[#ff4d4d] text-white rounded-2xl transition-all active:scale-90 border border-transparent hover:border-[#ff4d4d]/30 shadow-lg cursor-pointer"
          title={t.adminProfile}
        >
          <User className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        {user.uid !== currentUserId && (
          <button
            onClick={() => onOpenChat(user.uid, user.displayName, user.photoURL)}
            className="p-2.5 sm:p-3 bg-[#3d2b4f]/30 hover:bg-[#ff4d4d] text-white rounded-2xl transition-all active:scale-90 border border-transparent hover:border-[#ff4d4d]/30 shadow-lg cursor-pointer"
            title={t.sendMessage}
          >
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}
        
        {isModeratorOrAdmin && (
          <button
            onClick={() => updateUserVerification(user.uid, !user.isVerified)}
            className={`p-2.5 sm:p-3 rounded-2xl transition-all active:scale-90 border shadow-lg cursor-pointer ${
              user.isVerified 
                ? 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500 hover:text-white' 
                : 'bg-[#3d2b4f]/30 hover:bg-green-500/10 text-white border-transparent hover:bg-green-500 hover:text-[#0d0b14]'
            }`}
            title={user.isVerified ? (lang === 'ru' ? 'Отменить верификацию' : 'Revoke verification') : (lang === 'ru' ? 'Верифицировать' : 'Verify user')}
          >
            <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        {/* Admin Actions: Delete Avatar, Block, Delete User */}
        {isAdmin && !user.isBot && (
          <>
            {user.photoURL && (
              confirmAvatar ? (
                <div className="flex items-center gap-1 bg-amber-950/80 border border-amber-500/50 p-1 rounded-2xl animate-fadeIn">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteAvatar(user.uid);
                      setConfirmAvatar(false);
                    }}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
                  >
                    {lang === 'ru' ? 'Удалить' : 'Delete'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmAvatar(false);
                    }}
                    className="p-1.5 text-gray-400 hover:text-white cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmAvatar(true);
                  }}
                  className="p-2.5 sm:p-3 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-white rounded-2xl transition-all active:scale-90 border border-amber-500/30 shadow-lg cursor-pointer"
                  title={lang === 'ru' ? 'Удалить аватарку' : 'Delete Avatar'}
                >
                  <ImageOff className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleBlockUser(user.uid, user.isBlocked);
              }}
              className={`p-2.5 sm:p-3 rounded-2xl transition-all active:scale-90 border shadow-lg cursor-pointer ${
                user.isBlocked
                  ? 'bg-red-600 text-white border-red-500'
                  : 'bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border-red-500/30'
              }`}
              title={user.isBlocked ? (lang === 'ru' ? 'Разблокировать аккаунт' : 'Unblock Account') : (lang === 'ru' ? 'Заблокировать аккаунт' : 'Block Account')}
            >
              <Ban className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {user.deviceId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isDeviceBlocked) {
                    unblockDeviceId?.(user.deviceId!);
                  } else {
                    blockDeviceId?.(user.deviceId!);
                  }
                }}
                className={`p-2.5 sm:p-3 rounded-2xl transition-all active:scale-90 border shadow-lg cursor-pointer ${
                  isDeviceBlocked
                    ? 'bg-purple-600 text-white border-purple-500'
                    : 'bg-purple-500/10 hover:bg-purple-600 text-purple-400 hover:text-white border-purple-500/30'
                }`}
                title={isDeviceBlocked 
                  ? (lang === 'ru' ? 'Разблокировать устройство' : 'Unblock Device') 
                  : (lang === 'ru' ? 'Заблокировать устройство (Device ID)' : 'Block Device ID')}
              >
                <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}

            {user.uid !== currentUserId && (
              confirmDelete ? (
                <div className="flex items-center gap-1.5 bg-red-950/90 border border-red-500/50 p-1 rounded-2xl animate-fadeIn">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteUser(user.uid);
                      setConfirmDelete(false);
                    }}
                    className="bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase px-3 py-2 rounded-xl transition-all cursor-pointer shadow-md"
                  >
                    {lang === 'ru' ? 'Да, удалить' : 'Confirm'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete(false);
                    }}
                    className="p-2 bg-[#3d2b4f]/40 hover:bg-[#3d2b4f] text-gray-300 rounded-xl cursor-pointer"
                    title="Cancel"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(true);
                  }}
                  className="p-2.5 sm:p-3 bg-red-500/20 hover:bg-red-600 text-red-400 hover:text-white rounded-2xl transition-all active:scale-90 border border-red-500/40 shadow-lg cursor-pointer"
                  title={lang === 'ru' ? 'Удалить пользователя' : 'Delete User'}
                >
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )
            )}

            <RoleSelector 
              user={user} 
              updateUserRole={updateUserRole} 
              t={t} 
              lang={lang}
              isOpen={openDropdownId === user.uid}
              onToggle={() => setOpenDropdownId(openDropdownId === user.uid ? null : user.uid)}
              onClose={() => setOpenDropdownId(null)}
            />
          </>
        )}
      </div>
    </motion.div>
  );
});

export const UsersList: React.FC<UsersListProps> = ({ lang, onOpenChat, onViewProfile }) => {
  const {
    users,
    blockedEmails,
    blockedDeviceIds = [],
    loading,
    updateUserRole,
    updateUserVerification,
    deleteUser,
    toggleBlockUser,
    deleteAvatar,
    blockEmail,
    unblockEmail,
    blockDeviceId,
    unblockDeviceId
  } = useUsers();

  const { isAdmin, role: currentRole, user: currentUser } = useAuth();
  const isModeratorOrAdmin = isAdmin || currentRole === 'moderator';
  const t = translations[lang];
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newBlockEmailInput, setNewBlockEmailInput] = useState('');
  const [newBlockDeviceIdInput, setNewBlockDeviceIdInput] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [securityHidden, setSecurityHidden] = useState(false);
  const [protectedViewFeatureEnabled, setProtectedViewFeatureEnabled] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMaintenanceMode(data.maintenanceMode || false);
        setSecurityHidden(data.securityHidden || false);
        setProtectedViewFeatureEnabled(data.protectedViewFeatureEnabled !== false);
      }
    });
    return () => unsub();
  }, []);

  const toggleMaintenanceMode = async () => {
    if (!isAdmin) return;
    try {
      const docRef = doc(db, 'settings', 'general');
      await setDoc(docRef, { maintenanceMode: !maintenanceMode }, { merge: true });
    } catch (error) {
      console.error("Error toggling maintenance mode:", error);
    }
  };

  const toggleSecurityHidden = async () => {
    if (!isAdmin) return;
    try {
      const docRef = doc(db, 'settings', 'general');
      await setDoc(docRef, { securityHidden: !securityHidden }, { merge: true });
    } catch (error) {
      console.error("Error toggling security hidden:", error);
    }
  };

  const toggleProtectedViewFeature = async () => {
    if (!isAdmin) return;
    try {
      const docRef = doc(db, 'settings', 'general');
      await setDoc(docRef, { protectedViewFeatureEnabled: !protectedViewFeatureEnabled }, { merge: true });
    } catch (error) {
      console.error("Error toggling protected view feature:", error);
    }
  };

  const handleAddBlockEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBlockEmailInput.trim()) {
      blockEmail(newBlockEmailInput.trim());
      setNewBlockEmailInput('');
    }
  };

  const handleAddBlockDeviceId = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBlockDeviceIdInput.trim()) {
      blockDeviceId(newBlockDeviceIdInput.trim());
      setNewBlockDeviceIdInput('');
    }
  };

  const filteredUsers = React.useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(user => 
      user.displayName?.toLowerCase().includes(query) || 
      user.email?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-[#ff4d4d] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(255,77,77,0.3)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32">
      {isAdmin && (
        <div className="grid grid-cols-1 gap-4 mb-6">
          {/* Email Blocking Admin Tool */}
          <div className="bg-[#15101e] border border-red-500/30 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-red-500/20 text-red-400">
                <Ban size={22} />
              </div>
              <div>
                <h3 className="font-black text-white uppercase tracking-widest text-sm">
                  {lang === 'ru' ? 'Блокировка по Email' : 'Email Address Blocking'}
                </h3>
                <p className="text-xs text-gray-400">
                  {lang === 'ru' ? 'Введите email для полной блокировки аккаунта пользователя' : 'Enter an email address to block/ban users'}
                </p>
              </div>
            </div>

            <form onSubmit={handleAddBlockEmail} className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={newBlockEmailInput}
                  onChange={(e) => setNewBlockEmailInput(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full bg-[#251c35] border border-[#3d2b4f] rounded-2xl py-3 pl-11 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                />
              </div>
              <button
                type="submit"
                disabled={!newBlockEmailInput.trim()}
                className="bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest px-5 py-3 rounded-2xl transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
              >
                <Plus size={16} />
                {lang === 'ru' ? 'Заблокировать Email' : 'Block Email'}
              </button>
            </form>

            {blockedEmails.length > 0 && (
              <div className="pt-2 border-t border-[#3d2b4f]/50">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  {lang === 'ru' ? 'Заблокированные адреса:' : 'Blocked addresses:'} ({blockedEmails.length})
                </p>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto no-scrollbar">
                  {blockedEmails.map((email) => (
                    <span key={email} className="inline-flex items-center gap-2 bg-red-950/40 text-red-300 border border-red-500/30 px-3 py-1 rounded-xl text-xs font-mono">
                      {email}
                      <button
                        onClick={() => unblockEmail(email)}
                        className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                        title="Unblock email"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Device ID Blocking Admin Tool */}
          <div className="bg-[#15101e] border border-purple-500/30 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-400">
                <Smartphone size={22} />
              </div>
              <div>
                <h3 className="font-black text-white uppercase tracking-widest text-sm">
                  {lang === 'ru' ? 'Блокировка по ID Устройства (Device ID)' : 'Device ID Blocking'}
                </h3>
                <p className="text-xs text-gray-400">
                  {lang === 'ru' 
                    ? 'Блокировка доступа по уникальному идентификатору устройства с сохранением в Firestore' 
                    : 'Block access by unique device identifier with state saved in Firestore'}
                </p>
              </div>
            </div>

            <form onSubmit={handleAddBlockDeviceId} className="flex gap-2">
              <div className="relative flex-1">
                <Smartphone className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={newBlockDeviceIdInput}
                  onChange={(e) => setNewBlockDeviceIdInput(e.target.value)}
                  placeholder="dev_1234abc..."
                  className="w-full bg-[#251c35] border border-[#3d2b4f] rounded-2xl py-3 pl-11 pr-4 text-xs text-white placeholder-gray-500 font-mono focus:outline-none focus:border-purple-500"
                />
              </div>
              <button
                type="submit"
                disabled={!newBlockDeviceIdInput.trim()}
                className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-widest px-5 py-3 rounded-2xl transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Plus size={16} />
                {lang === 'ru' ? 'Заблокировать ID' : 'Block Device'}
              </button>
            </form>

            {blockedDeviceIds.length > 0 && (
              <div className="pt-2 border-t border-[#3d2b4f]/50">
                <p className="text-[11px] font-bold text-purple-300 uppercase tracking-widest mb-2">
                  {lang === 'ru' ? 'Заблокированные устройства:' : 'Blocked devices:'} ({blockedDeviceIds.length})
                </p>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto no-scrollbar">
                  {blockedDeviceIds.map((devId) => (
                    <span key={devId} className="inline-flex items-center gap-2 bg-purple-950/50 text-purple-300 border border-purple-500/40 px-3 py-1 rounded-xl text-xs font-mono">
                      <Smartphone size={12} className="shrink-0 text-purple-400" />
                      <span className="truncate max-w-[180px]">{devId}</span>
                      <button
                        onClick={() => unblockDeviceId(devId)}
                        className="text-gray-400 hover:text-white transition-colors cursor-pointer shrink-0"
                        title="Unblock device ID"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#15101e] border border-[#3d2b4f]/30 rounded-3xl p-5 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${maintenanceMode ? 'bg-red-500/20 text-red-400' : 'bg-[#3d2b4f]/30 text-[#ff4d4d]'}`}>
                <Settings size={20} />
              </div>
              <div>
                <h3 className="font-black text-white uppercase tracking-widest text-sm">
                  {t.adminMaintenanceMode}
                </h3>
                <p className="text-xs text-gray-400">
                  {(t as any).adminMaintenanceDesc || t.adminCloseSite}
                </p>
              </div>
            </div>
            <button
              onClick={toggleMaintenanceMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                maintenanceMode ? 'bg-red-500' : 'bg-[#0d0b14]'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="bg-[#15101e] border border-[#3d2b4f]/30 rounded-3xl p-5 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${securityHidden ? 'bg-gray-500/20 text-gray-400' : 'bg-green-500/20 text-green-400'}`}>
                <Shield size={20} />
              </div>
              <div>
                <h3 className="font-black text-white uppercase tracking-widest text-sm">
                  Hide Aha Security
                </h3>
                <p className="text-xs text-gray-400">
                  Globally hide the Aha Security badge for all users
                </p>
              </div>
            </div>
            <button
              onClick={toggleSecurityHidden}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                securityHidden ? 'bg-red-500' : 'bg-[#0d0b14]'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  securityHidden ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="bg-[#15101e] border border-[#3d2b4f]/30 rounded-3xl p-5 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${protectedViewFeatureEnabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                <Lock size={20} />
              </div>
              <div>
                <h3 className="font-black text-white uppercase tracking-widest text-sm">
                  {lang === 'ru' ? 'Функция защищенного просмотра' : 'Protected View Feature'}
                </h3>
                <p className="text-xs text-gray-400">
                  {lang === 'ru' 
                    ? 'Включить/выключить функцию защищенного просмотра для холста' 
                    : 'Enable/disable protected viewing controls for canvas drawings'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleProtectedViewFeature}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                protectedViewFeatureEnabled ? 'bg-green-500' : 'bg-[#0d0b14]'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  protectedViewFeatureEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {users.length > 0 && (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.adminSearchUsers}
            className="w-full bg-[#15101e]/50 border border-[#3d2b4f]/50 rounded-2xl py-3 pl-10 pr-10 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#ff4d4d] focus:bg-[#15101e]/80 transition-all"
          />
          <AnimatePresence>
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="space-y-3">
        {filteredUsers.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 text-gray-500 bg-[#15101e]/10 rounded-3xl border border-[#3d2b4f]/10"
          >
            <Search className="mx-auto mb-4 opacity-20" size={32} />
            <p className="text-sm font-bold uppercase tracking-widest">
              {(t as any).adminNoUsersFound || t.adminNoUsers}
            </p>
          </motion.div>
        ) : (
          filteredUsers.map((user) => (
            <UserListItem 
              key={user.uid}
              user={user}
              isAdmin={isAdmin}
              isModeratorOrAdmin={isModeratorOrAdmin}
              t={t}
              lang={lang}
              openDropdownId={openDropdownId}
              setOpenDropdownId={setOpenDropdownId}
              onViewProfile={onViewProfile}
              onOpenChat={onOpenChat}
              updateUserRole={updateUserRole}
              updateUserVerification={updateUserVerification}
              deleteUser={deleteUser}
              toggleBlockUser={toggleBlockUser}
              deleteAvatar={deleteAvatar}
              currentUserId={currentUser?.uid}
              blockedDeviceIds={blockedDeviceIds}
              blockDeviceId={blockDeviceId}
              unblockDeviceId={unblockDeviceId}
            />
          ))
        )}
      </div>
    </div>
  );
};

