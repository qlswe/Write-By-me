import React, { useState, useRef, useEffect } from 'react';
import { useUsers, UserData } from '../../hooks/useUsers';
import { useAuth } from '../../hooks/useAuth';
import { translations, Language } from '../../data/translations';
import { Shield, User, UserCheck, MessageSquare, ChevronDown, Search, X, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

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
  t, 
  lang, 
  openDropdownId, 
  setOpenDropdownId, 
  onViewProfile, 
  onOpenChat, 
  updateUserRole 
}: { 
  user: UserData, 
  isAdmin: boolean, 
  t: any, 
  lang: Language, 
  openDropdownId: string | null, 
  setOpenDropdownId: (id: string | null) => void, 
  onViewProfile?: (user: UserData) => void, 
  onOpenChat: (uid: string, name: string, photoURL?: string) => void, 
  updateUserRole: (uid: string, role: 'admin' | 'user' | 'moderator' | 'beta-tester') => void 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-[#15101e] border border-[#3d2b4f]/30 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-[#ff4d4d]/30 transition-all hover:bg-[#251c35] relative ${openDropdownId === user.uid ? 'z-50' : 'z-10'}`}
    >
      <div className="flex items-center gap-4 sm:gap-5 flex-1 min-w-0">
        <button 
          onClick={() => onViewProfile?.(user)}
          className="relative shrink-0 hover:scale-110 transition-transform"
        >
          <img
            src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=1c1528&color=fff`}
            alt={user.displayName}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-[#3d2b4f]/50 group-hover:border-[#ff4d4d] transition-colors shadow-lg"
            referrerPolicy="no-referrer"
          />
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-4 border-[#0d0b14] ${
            user.lastSeen && (Date.now() - new Date(user.lastSeen).getTime() < 3 * 60 * 1000)
              ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' 
              : 'bg-gray-500 shadow-none'
          }`} />
        </button>
        <div className="min-w-0 flex-1">
          <h3 className="font-black text-white flex items-center gap-2 sm:gap-3 truncate uppercase tracking-tighter text-sm sm:text-base">
            <span className="truncate">{user.displayName}</span>
            {user.role === 'admin' && <Shield className="w-4 h-4 text-red-500 shrink-0" />}
          </h3>
          {isAdmin && user.email && <p className="text-[10px] text-gray-500 truncate font-black uppercase tracking-[0.2em] mt-1">{user.email}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap justify-end">
        <button
          onClick={() => onViewProfile?.(user)}
          className="p-2.5 sm:p-3 bg-[#3d2b4f]/30 hover:bg-[#ff4d4d] text-white rounded-2xl transition-all active:scale-90 border border-transparent hover:border-[#ff4d4d]/30 shadow-lg"
          title={t.adminProfile}
        >
          <User className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button
          onClick={() => onOpenChat(user.uid, user.displayName, user.photoURL)}
          className="p-2.5 sm:p-3 bg-[#3d2b4f]/30 hover:bg-[#ff4d4d] text-white rounded-2xl transition-all active:scale-90 border border-transparent hover:border-[#ff4d4d]/30 shadow-lg"
          title={t.sendMessage}
        >
          <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        
        {isAdmin && (
          <RoleSelector 
            user={user} 
            updateUserRole={updateUserRole} 
            t={t} 
            lang={lang}
            isOpen={openDropdownId === user.uid}
            onToggle={() => setOpenDropdownId(openDropdownId === user.uid ? null : user.uid)}
            onClose={() => setOpenDropdownId(null)}
          />
        )}
      </div>
    </motion.div>
  );
});

export const UsersList: React.FC<UsersListProps> = ({ lang, onOpenChat, onViewProfile }) => {
  const { users, loading, updateUserRole } = useUsers();
  const { isAdmin } = useAuth();
  const t = translations[lang];
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [securityHidden, setSecurityHidden] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMaintenanceMode(data.maintenanceMode || false);
        setSecurityHidden(data.securityHidden || false);
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
    <div className="space-y-4 pb-32">
      {isAdmin && (
        <div className="grid grid-cols-1 gap-4 mb-6">
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
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
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
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
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
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors"
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
              t={t}
              lang={lang}
              openDropdownId={openDropdownId}
              setOpenDropdownId={setOpenDropdownId}
              onViewProfile={onViewProfile}
              onOpenChat={onOpenChat}
              updateUserRole={updateUserRole}
            />
          ))
        )}
      </div>
    </div>
  );
};
