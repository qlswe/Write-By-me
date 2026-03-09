import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Mail, Calendar, Hash, Edit2, Check, Copy } from 'lucide-react';
import { Language, translations } from '../../data/translations';
import { useAuth } from '../../hooks/useAuth';
import { updateProfile } from 'firebase/auth';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, lang }) => {
  const t = translations[lang];
  const { user } = useAuth();
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.displayName || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleUpdateName = async () => {
    if (!newName.trim() || newName === user.displayName) {
      setIsEditingName(false);
      return;
    }

    setIsUpdating(true);
    try {
      await updateProfile(user, { displayName: newName.trim() });
      setIsEditingName(false);
      setToast(lang === 'ru' ? 'Имя успешно обновлено!' : 'Name updated successfully!');
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setToast(lang === 'ru' ? 'Ошибка при обновлении имени' : 'Error updating name');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.uid);
    setToast(lang === 'ru' ? 'ID скопирован!' : 'ID copied!');
    setTimeout(() => setToast(null), 3000);
  };

  const creationDate = user.metadata.creationTime 
    ? new Date(user.metadata.creationTime).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : (lang === 'ru' ? 'Неизвестно' : 'Unknown');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#2F244F] border border-[#5C4B8B] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative"
        >
          {/* Header Cover */}
          <div className="h-24 bg-gradient-to-r from-[#5C4B8B] to-[#C3A6E6] relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors backdrop-blur-md"
            >
              <X size={20} />
            </button>
          </div>

          {/* Avatar */}
          <div className="px-6 relative pb-6">
            <div className="absolute -top-12 left-6">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=3E3160&color=fff`} 
                alt="Avatar" 
                className="w-24 h-24 rounded-full border-4 border-[#2F244F] bg-[#3E3160] object-cover"
              />
            </div>

            <div className="pt-14">
              {/* Name Edit */}
              <div className="mb-6">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="flex-1 bg-[#3E3160] border border-[#C3A6E6] rounded-lg px-3 py-2 text-white focus:outline-none"
                      placeholder={lang === 'ru' ? 'Введите имя' : 'Enter name'}
                      maxLength={30}
                      autoFocus
                    />
                    <button
                      onClick={handleUpdateName}
                      disabled={isUpdating}
                      className="p-2 bg-[#C3A6E6] text-[#2F244F] rounded-lg hover:bg-[#B094EB] transition-colors disabled:opacity-50"
                    >
                      <Check size={20} />
                    </button>
                    <button
                      onClick={() => {
                        setNewName(user.displayName || '');
                        setIsEditingName(false);
                      }}
                      className="p-2 bg-[#3E3160] text-gray-400 hover:text-white rounded-lg transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 group">
                    <h2 className="text-2xl font-bold text-white">{user.displayName}</h2>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="p-1.5 text-gray-400 hover:text-[#C3A6E6] opacity-0 group-hover:opacity-100 transition-all rounded-md hover:bg-[#3E3160]"
                      title={lang === 'ru' ? 'Изменить имя' : 'Edit name'}
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                )}
                <div className="text-[#C3A6E6] text-sm font-medium mt-1">
                  {lang === 'ru' ? 'Звездный Экспресс' : 'Astral Express'}
                </div>
              </div>

              {/* Info List */}
              <div className="space-y-4 bg-[#3E3160]/50 rounded-xl p-4 border border-[#5C4B8B]/50">
                <div className="flex items-center gap-3 text-gray-300">
                  <Mail size={18} className="text-[#C3A6E6]" />
                  <span className="text-sm flex-1 truncate">{user.email}</span>
                </div>
                
                <div className="flex items-center gap-3 text-gray-300">
                  <Calendar size={18} className="text-[#C3A6E6]" />
                  <span className="text-sm flex-1">
                    {lang === 'ru' ? 'Регистрация: ' : 'Joined: '}
                    <span className="text-white font-medium">{creationDate}</span>
                  </span>
                </div>

                <div className="flex items-center gap-3 text-gray-300">
                  <Hash size={18} className="text-[#C3A6E6]" />
                  <span className="text-sm flex-1 font-mono text-xs truncate">{user.uid}</span>
                  <button 
                    onClick={handleCopyId}
                    className="p-1.5 hover:bg-[#5C4B8B] rounded-md transition-colors text-gray-400 hover:text-white"
                    title={lang === 'ru' ? 'Копировать ID' : 'Copy ID'}
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Toast */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#C3A6E6] text-[#2F244F] px-4 py-2 rounded-lg text-sm font-bold shadow-lg"
              >
                {toast}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
