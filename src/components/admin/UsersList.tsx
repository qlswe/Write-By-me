import React, { useState, useRef, useEffect } from 'react';
import { useUsers, UserData } from '../../hooks/useUsers';
import { useAuth } from '../../hooks/useAuth';
import { translations, Language } from '../../data/translations';
import { Shield, User, UserCheck, MessageSquare, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UsersListProps {
  lang: Language;
  onOpenChat: (uid: string, name: string, photoURL?: string) => void;
  onViewProfile?: (user: UserData) => void;
}

const RoleSelector: React.FC<{
  user: UserData;
  updateUserRole: (uid: string, role: 'admin' | 'user' | 'moderator') => void;
  t: any;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}> = ({ user, updateUserRole, t, isOpen, onToggle, onClose }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const roles = [
    { value: 'user', label: t.roleUser },
    { value: 'moderator', label: t.roleModerator },
    { value: 'admin', label: t.roleAdmin },
  ];

  const currentRole = roles.find(r => r.value === user.role) || roles[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={onToggle}
        className="bg-[#5C4B8B]/30 border border-[#5C4B8B]/50 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl px-4 py-3 outline-none focus:border-[#C3A6E6] transition-all cursor-pointer flex items-center gap-2 shadow-lg hover:bg-[#5C4B8B]/50"
      >
        {currentRole.label}
        <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-2 w-40 bg-[#2F244F] border border-[#5C4B8B] rounded-xl shadow-xl overflow-hidden z-50"
          >
            {roles.map((role) => (
              <button
                key={role.value}
                onClick={() => {
                  updateUserRole(user.uid, role.value as any);
                  onClose();
                }}
                className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${
                  user.role === role.value 
                    ? 'bg-[#C3A6E6] text-[#2F244F]' 
                    : 'text-white hover:bg-[#5C4B8B]/50'
                }`}
              >
                {role.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const UsersList: React.FC<UsersListProps> = ({ lang, onOpenChat, onViewProfile }) => {
  const { users, loading, updateUserRole } = useUsers();
  const { isAdmin } = useAuth();
  const t = translations[lang];
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-[#C3A6E6] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(195,166,230,0.3)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <motion.div
          key={user.uid}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-[#2F244F]/50 backdrop-blur-md border border-[#5C4B8B]/30 rounded-3xl p-5 flex items-center justify-between gap-4 group hover:border-[#C3A6E6]/30 transition-all hover:bg-[#3E3160] relative ${openDropdownId === user.uid ? 'z-50' : 'z-10'}`}
        >
          <div className="flex items-center gap-5 flex-1 min-w-0">
            <button 
              onClick={() => onViewProfile?.(user)}
              className="relative shrink-0 hover:scale-110 transition-transform"
            >
              <img
                src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=3E3160&color=fff`}
                alt={user.displayName}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-[#5C4B8B]/50 group-hover:border-[#C3A6E6] transition-colors shadow-lg"
                referrerPolicy="no-referrer"
              />
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-[#1A1625] ${
                user.role === 'admin' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : user.role === 'moderator' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'
              }`} />
            </button>
            <div className="min-w-0">
              <h3 className="font-black text-white flex items-center gap-3 truncate uppercase tracking-tighter text-base">
                {user.displayName}
                {user.role === 'admin' && <Shield className="w-4 h-4 text-red-500" />}
              </h3>
              {isAdmin && user.email && <p className="text-[10px] text-gray-500 truncate font-black uppercase tracking-[0.2em] mt-1">{user.email}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onViewProfile?.(user)}
              className="p-3 bg-[#5C4B8B]/30 hover:bg-[#C3A6E6] text-white rounded-2xl transition-all active:scale-90 border border-transparent hover:border-[#C3A6E6]/30 shadow-lg"
              title={lang === 'ru' ? 'Профиль' : 'Profile'}
            >
              <User className="w-5 h-5" />
            </button>
            <button
              onClick={() => onOpenChat(user.uid, user.displayName, user.photoURL)}
              className="p-3 bg-[#5C4B8B]/30 hover:bg-[#C3A6E6] text-white rounded-2xl transition-all active:scale-90 border border-transparent hover:border-[#C3A6E6]/30 shadow-lg"
              title={t.sendMessage}
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            
            {isAdmin && (
              <RoleSelector 
                user={user} 
                updateUserRole={updateUserRole} 
                t={t} 
                isOpen={openDropdownId === user.uid}
                onToggle={() => setOpenDropdownId(openDropdownId === user.uid ? null : user.uid)}
                onClose={() => setOpenDropdownId(null)}
              />
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};
