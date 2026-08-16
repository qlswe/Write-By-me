import React, { useState, useRef, useEffect } from 'react';
import { useUsers, UserData } from '../../hooks/useUsers';
import { useAuth } from '../../hooks/useAuth';
import { translations, Language } from '../../data/translations';
import { Shield, User, UserCheck, MessageSquare, ChevronDown, Search, X, Settings, Lock, Trash2, Ban, ImageOff, Plus, Mail, Smartphone, Copy, Check, Megaphone, Bell, Send, AlertTriangle, CheckCircle2, Sparkles, AlertOctagon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { CachedAvatar } from '../ui/CachedAvatar';
import { logTelemetryEvent } from '../../utils/telemetry';

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
  const [maintenanceReason, setMaintenanceReason] = useState('');
  const [maintenanceReasonInput, setMaintenanceReasonInput] = useState('');
  const [isSavingReason, setIsSavingReason] = useState(false);
  const [reasonSavedMsg, setReasonSavedMsg] = useState(false);

  // Broadcast Notification State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<'info' | 'warning' | 'alert' | 'success'>('info');
  const [activeBroadcast, setActiveBroadcast] = useState<any>(null);
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [broadcastStatusMsg, setBroadcastStatusMsg] = useState('');

  const [securityHidden, setSecurityHidden] = useState(false);
  const [protectedViewFeatureEnabled, setProtectedViewFeatureEnabled] = useState(true);

  useEffect(() => {
    const unsubGeneral = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMaintenanceMode(data.maintenanceMode || false);
        setSecurityHidden(data.securityHidden || false);
        setProtectedViewFeatureEnabled(data.protectedViewFeatureEnabled !== false);
        if (data.maintenanceReason !== undefined) {
          setMaintenanceReason(data.maintenanceReason || '');
          setMaintenanceReasonInput(data.maintenanceReason || '');
        }
      }
    });

    const unsubBroadcast = onSnapshot(doc(db, 'settings', 'broadcast'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setActiveBroadcast(data.activeBroadcast || null);
      } else {
        setActiveBroadcast(null);
      }
    });

    return () => {
      unsubGeneral();
      unsubBroadcast();
    };
  }, []);

  const handleSaveMaintenanceReason = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isAdmin) return;
    setIsSavingReason(true);
    const cleanReason = maintenanceReasonInput.trim();
    try {
      const docRef = doc(db, 'settings', 'general');
      const now = Date.now();
      await setDoc(docRef, { 
        maintenanceReason: cleanReason,
        maintenanceUpdatedAt: now 
      }, { merge: true });
      setReasonSavedMsg(true);
      setTimeout(() => setReasonSavedMsg(false), 2500);

      logTelemetryEvent(
        'maintenance_reason_updated',
        { reason: cleanReason, timestamp: now },
        'users',
        currentUser?.uid || 'admin',
        currentUser?.email || 'admin',
        currentUser?.displayName || 'Admin'
      );
    } catch (error) {
      console.error("Error saving maintenance reason:", error);
    } finally {
      setIsSavingReason(false);
    }
  };

  const toggleMaintenanceMode = async () => {
    if (!isAdmin) return;
    const nextMode = !maintenanceMode;
    const cleanReason = maintenanceReasonInput.trim();
    const now = Date.now();
    try {
      const docRef = doc(db, 'settings', 'general');
      await setDoc(docRef, { 
        maintenanceMode: nextMode,
        maintenanceReason: cleanReason,
        maintenanceUpdatedAt: now
      }, { merge: true });

      logTelemetryEvent(
        'maintenance_mode_toggled',
        { mode: nextMode ? 'LOCKED' : 'OPEN', reason: cleanReason, timestamp: now },
        'users',
        currentUser?.uid || 'admin',
        currentUser?.email || 'admin',
        currentUser?.displayName || 'Admin'
      );
    } catch (error) {
      console.error("Error toggling maintenance mode:", error);
    }
  };

  const handleSendBroadcast = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isModeratorOrAdmin) return;
    if (!broadcastMessage.trim()) return;

    setIsSendingBroadcast(true);
    try {
      const broadcastObj = {
        id: `broadcast_${Date.now()}`,
        title: broadcastTitle.trim() || (lang === 'ru' ? 'Системное оповещение' : 'System Announcement'),
        message: broadcastMessage.trim(),
        type: broadcastType,
        sender: currentUser?.displayName || (lang === 'ru' ? 'Администрация' : 'Admin Staff'),
        timestamp: Date.now()
      };

      await setDoc(doc(db, 'settings', 'broadcast'), {
        activeBroadcast: broadcastObj,
        lastUpdated: Date.now()
      }, { merge: true });

      setBroadcastStatusMsg(lang === 'ru' ? '🚀 Уведомление мгновенно отправлено всем онлайн пользователям!' : '🚀 Instant notification broadcasted to all users!');
      setBroadcastTitle('');
      setBroadcastMessage('');
      setTimeout(() => setBroadcastStatusMsg(''), 4000);
    } catch (err) {
      console.error("Error sending broadcast notification:", err);
      setBroadcastStatusMsg(lang === 'ru' ? 'Ошибка отправки уведомления' : 'Error sending broadcast');
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  const handleClearBroadcast = async () => {
    if (!isModeratorOrAdmin) return;
    try {
      await setDoc(doc(db, 'settings', 'broadcast'), {
        activeBroadcast: null,
        lastUpdated: Date.now()
      }, { merge: true });
      setBroadcastStatusMsg(lang === 'ru' ? 'Активное вещание снято' : 'Broadcast cleared');
      setTimeout(() => setBroadcastStatusMsg(''), 2500);
    } catch (err) {
      console.error("Error clearing broadcast:", err);
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

          {/* Realtime Broadcast Notification Studio (Instant Site-wide Alerts) */}
          <div className="bg-gradient-to-br from-[#1c1228] via-[#15101e] to-[#0d0a14] border border-[#ff4d4d]/40 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#3d2b4f]/60 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#ff4d4d]/20 text-[#ff4d4d] border border-[#ff4d4d]/30 shadow-md">
                  <Megaphone size={22} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-white uppercase tracking-wider text-base flex items-center gap-2">
                    <span>{lang === 'ru' ? 'Системное Моментальное Вещание' : 'System Instant Broadcast'}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 font-mono">LIVE</span>
                  </h3>
                  <p className="text-xs text-gray-400">
                    {lang === 'ru' ? 'Отправляйте всплывающие уведомления всем онлайн-пользователям без задержек и лимитов.' : 'Send instant popup alerts to all online users without hourly limits.'}
                  </p>
                </div>
              </div>

              {activeBroadcast && (
                <button
                  type="button"
                  onClick={handleClearBroadcast}
                  className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Снять активное уведомление"
                >
                  <Trash2 size={13} />
                  <span>{lang === 'ru' ? 'Снять вещание' : 'Clear Alert'}</span>
                </button>
              )}
            </div>

            {/* Quick Template Chips */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider font-mono">
                {lang === 'ru' ? 'Быстрые шаблоны уведомлений:' : 'Quick Notification Templates:'}
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { title: lang === 'ru' ? '🛠️ Технические работы' : '🛠️ Scheduled Maintenance', msg: lang === 'ru' ? 'Ведутся профилактические работы на серверах. Сайт может перезагружаться.' : 'Maintenance in progress. System might reload temporarily.', type: 'warning' },
                  { title: lang === 'ru' ? '🚀 Глобальное Обновление 6.0' : '🚀 Global Update 6.0 Released', msg: lang === 'ru' ? 'Выпущено обновление! Обновите страницу для получения новых функций.' : 'New update live! Refresh to access new features.', type: 'success' },
                  { title: lang === 'ru' ? '📢 Важное Объявление' : '📢 Important Announcement', msg: lang === 'ru' ? 'Пожалуйста, ознакомьтесь с новыми правилами и материалами.' : 'Please read the latest updates and announcements.', type: 'info' },
                  { title: lang === 'ru' ? '⚠️ Внимание всем пользователям' : '⚠️ Attention All Users', msg: lang === 'ru' ? 'В связи с высокими нагрузками включен режим оптимизации.' : 'High traffic optimization mode is currently active.', type: 'alert' }
                ].map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setBroadcastTitle(tmpl.title);
                      setBroadcastMessage(tmpl.msg);
                      setBroadcastType(tmpl.type as any);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-[#261836] hover:bg-[#ff4d4d]/20 text-gray-300 hover:text-white border border-[#3d2b4f] hover:border-[#ff4d4d]/40 text-xs transition-all cursor-pointer"
                  >
                    {tmpl.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Broadcast Form */}
            <form onSubmit={handleSendBroadcast} className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder={lang === 'ru' ? 'Заголовок уведомления (например: 🚀 Релиз 6.0)' : 'Notification Title'}
                    className="w-full bg-[#0d0b14] border border-[#3d2b4f] focus:border-[#ff4d4d] text-white text-xs rounded-xl px-3.5 py-2.5 outline-none transition-all font-sans"
                  />
                </div>
                <div>
                  <select
                    value={broadcastType}
                    onChange={(e) => setBroadcastType(e.target.value as any)}
                    className="w-full bg-[#0d0b14] border border-[#3d2b4f] focus:border-[#ff4d4d] text-white text-xs rounded-xl px-3 py-2.5 outline-none transition-all font-mono"
                  >
                    <option value="info">🔵 Info / Информация</option>
                    <option value="warning">🟡 Warning / Предупреждение</option>
                    <option value="alert">🔴 Alert / Важное</option>
                    <option value="success">🟢 Success / Успех</option>
                  </select>
                </div>
              </div>

              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder={lang === 'ru' ? 'Текст моментального системного уведомления...' : 'Instant system broadcast message...'}
                rows={2}
                className="w-full bg-[#0d0b14] border border-[#3d2b4f] focus:border-[#ff4d4d] text-white text-xs rounded-xl p-3 outline-none transition-all font-sans leading-relaxed resize-none"
              />

              <div className="flex items-center justify-between gap-3 pt-1">
                {broadcastStatusMsg ? (
                  <span className="text-xs font-bold text-emerald-400 font-mono animate-pulse">
                    {broadcastStatusMsg}
                  </span>
                ) : (
                  <span className="text-[11px] text-gray-400">
                    {lang === 'ru' ? 'Уведомление придет всем в реальном времени со звуком' : 'Broadcast triggers instantly with sound on all screens'}
                  </span>
                )}

                <button
                  type="submit"
                  disabled={isSendingBroadcast || !broadcastMessage.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-[#ff4d4d] hover:from-[#ff4d4d] hover:to-red-600 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-[0_0_20px_rgba(255,77,77,0.4)] transition-all cursor-pointer flex items-center gap-2 active:scale-95 shrink-0"
                >
                  <Send size={14} />
                  <span>{isSendingBroadcast ? (lang === 'ru' ? 'Отправка...' : 'Sending...') : (lang === 'ru' ? 'Отправить всем моментально' : 'Broadcast Now')}</span>
                </button>
              </div>
            </form>

            {/* Currently Active Broadcast Preview */}
            {activeBroadcast && (
              <div className="mt-3 p-3.5 rounded-2xl bg-[#0d0b14]/80 border border-[#3d2b4f] text-xs space-y-1">
                <div className="flex items-center justify-between text-[#ff4d4d] font-bold font-mono text-[10px] uppercase">
                  <span>{lang === 'ru' ? 'Активное системное вещание:' : 'Currently Active Broadcast:'}</span>
                  <span>{activeBroadcast.sender} • {new Date(activeBroadcast.timestamp || Date.now()).toLocaleTimeString()}</span>
                </div>
                <div className="font-bold text-white text-sm">{activeBroadcast.title}</div>
                <div className="text-gray-300 font-sans">{activeBroadcast.message}</div>
              </div>
            )}
          </div>

          {/* Maintenance Mode & Custom Reason Management */}
          <div className="bg-[#15101e] border border-[#3d2b4f]/40 rounded-3xl p-5 sm:p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl ${maintenanceMode ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-[#3d2b4f]/30 text-[#ff4d4d]'}`}>
                  <Settings size={22} className={maintenanceMode ? 'animate-spin' : ''} />
                </div>
                <div>
                  <h3 className="font-black text-white uppercase tracking-widest text-sm flex items-center gap-2">
                    <span>{t.adminMaintenanceMode}</span>
                    {maintenanceMode && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 font-mono font-bold">
                        {lang === 'ru' ? 'САЙТ ЗАКРЫТ' : 'SITE CLOSED'}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {(t as any).adminMaintenanceDesc || (lang === 'ru' ? 'Блокирует доступ к сайту для всех пользователей, кроме администраторов.' : 'Locks site access for standard users.')}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleMaintenanceMode}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none cursor-pointer p-0.5 ${
                  maintenanceMode ? 'bg-red-500' : 'bg-[#0d0b14] border border-[#3d2b4f]'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Custom Maintenance Reason Input */}
            <form onSubmit={handleSaveMaintenanceReason} className="space-y-2 pt-2 border-t border-[#3d2b4f]/40">
              <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                <AlertOctagon size={14} className="text-[#ff4d4d]" />
                <span>{lang === 'ru' ? 'Кастомная причина закрытия сайта (отображается на экране):' : 'Custom Site Closure Reason (Shown on Screen):'}</span>
              </label>

              <textarea
                value={maintenanceReasonInput}
                onChange={(e) => setMaintenanceReasonInput(e.target.value)}
                placeholder={lang === 'ru' ? 'Введите причину (например: Проводятся плановые технические работы до 18:00. Скоро вернемся!)...' : 'Type closure reason...'}
                rows={3}
                className="w-full bg-[#0d0b14] border border-[#3d2b4f] focus:border-[#ff4d4d] text-white text-xs rounded-xl p-3 outline-none transition-all font-sans leading-relaxed resize-none"
              />

              <div className="flex items-center justify-between gap-2 pt-1">
                {reasonSavedMsg ? (
                  <span className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCircle2 size={14} />
                    {lang === 'ru' ? 'Причина сохранена!' : 'Reason saved!'}
                  </span>
                ) : (
                  <span className="text-[11px] text-gray-500">
                    {lang === 'ru' ? 'Эта причина будет крупно показана на заблокированном экране.' : 'Will be displayed prominently on locked maintenance screen.'}
                  </span>
                )}

                <button
                  type="submit"
                  disabled={isSavingReason}
                  className="px-4 py-2 rounded-xl bg-[#3d2b4f]/60 hover:bg-[#ff4d4d] text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <Check size={14} />
                  <span>{isSavingReason ? (lang === 'ru' ? 'Сохранение...' : 'Saving...') : (lang === 'ru' ? 'Сохранить причину' : 'Save Reason')}</span>
                </button>
              </div>
            </form>
          </div>

          <div className="bg-[#15101e] border border-[#3d2b4f]/30 rounded-3xl p-5 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-2xl shrink-0 flex items-center justify-center ${securityHidden ? 'bg-gray-500/20 text-gray-400' : 'bg-green-500/20 text-green-400'}`}>
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
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none cursor-pointer p-0.5 ${
                securityHidden ? 'bg-red-500' : 'bg-[#0d0b14] border border-[#3d2b4f]'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  securityHidden ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="bg-[#15101e] border border-[#3d2b4f]/30 rounded-3xl p-5 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-2xl shrink-0 flex items-center justify-center ${protectedViewFeatureEnabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
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
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none cursor-pointer p-0.5 ${
                protectedViewFeatureEnabled ? 'bg-green-500' : 'bg-[#0d0b14] border border-[#3d2b4f]'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  protectedViewFeatureEnabled ? 'translate-x-5' : 'translate-x-0'
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

