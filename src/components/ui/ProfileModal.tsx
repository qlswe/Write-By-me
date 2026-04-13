import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Mail, Calendar, Hash, Edit2, Check, Copy, Award, Star, Zap, Shield, LogOut, MessageSquare, Camera } from 'lucide-react';
import { Language, translations } from '../../data/translations';
import { useAuth } from '../../hooks/useAuth';
import { updateProfile as updateAuthProfile } from 'firebase/auth';
import { ChatsList } from '../chat/ChatsList';
import { UserData } from '../../hooks/useUsers';
import { useUserPosts } from '../../hooks/useUserPosts';
import { useUserData } from '../../hooks/useUserData';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  viewUser?: UserData | null;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, lang, viewUser }) => {
  const t = translations[lang];
  const { user: currentUser, logout, isAdmin, role: currentUserRole } = useAuth();
  const { xp: currentXp, reputation: currentRep, role: currentRole, photoURL: currentPhoto, updateProfile: updateUserData } = useUserData(lang);
  
  const isOwnProfile = !viewUser || viewUser.uid === currentUser?.uid;
  const user = viewUser || currentUser;
  
  // Use real data if it's the current user's profile, otherwise use viewUser data
  const xp = isOwnProfile ? currentXp : (viewUser as any)?.xp || 0;
  const reputation = isOwnProfile ? currentRep : (viewUser as any)?.reputation || 0;
  const userRole = isOwnProfile ? currentRole : (viewUser?.role || 'user');
  const photoURL = isOwnProfile ? (currentPhoto || user?.photoURL) : (viewUser?.photoURL || user?.photoURL);

  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.displayName || '');
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [newPhotoURL, setNewPhotoURL] = useState(photoURL || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showChats, setShowChats] = useState(false);
  const [showPosts, setShowPosts] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const { posts, createPost, updatePost, deletePost, loading: postsLoading } = useUserPosts(user?.uid);
  const [newPostText, setNewPostText] = useState('');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  // Level calculation: 1000 XP per level
  const level = Math.floor(xp / 1000) + 1;
  const xpInLevel = xp % 1000;
  const xpNeeded = 1000;

  if (!isOpen || !user) return null;

  const handleUpdateName = async () => {
    if (!newName.trim() || newName === user.displayName) {
      setIsEditingName(false);
      return;
    }

    setIsUpdating(true);
    try {
      if (currentUser) {
        await updateAuthProfile(currentUser, { displayName: newName.trim() });
        // Also update public profile
        await setDoc(doc(db, 'public_profiles', currentUser.uid), {
          displayName: newName.trim()
        }, { merge: true });
        
        setIsEditingName(false);
        setToast(t.profileNameUpdated);
        setTimeout(() => setToast(null), 3000);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setToast(t.profileNameError);
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePhoto = async () => {
    if (!newPhotoURL.trim() || newPhotoURL === photoURL) {
      setIsEditingPhoto(false);
      return;
    }

    setIsUpdating(true);
    try {
      if (currentUser) {
        await updateAuthProfile(currentUser, { photoURL: newPhotoURL.trim() });
        // Update via useUserData hook
        await updateUserData('', '', 0, '', '', newPhotoURL.trim());
        
        // Also update public profile
        await setDoc(doc(db, 'public_profiles', currentUser.uid), {
          photoURL: newPhotoURL.trim()
        }, { merge: true });
        
        setIsEditingPhoto(false);
        setToast(t.profilePhotoUpdated);
        setTimeout(() => setToast(null), 3000);
      }
    } catch (error) {
      console.error('Error updating photo:', error);
      setToast(t.profilePhotoError);
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;
    await createPost(newPostText);
    setNewPostText('');
  };

  const handleUpdatePost = async (postId: string, text: string) => {
    await updatePost(postId, text);
    setEditingPostId(null);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.uid);
    setToast(t.profileIdCopied);
    setTimeout(() => setToast(null), 3000);
  };

  const creationDate = (user as any).metadata?.creationTime 
    ? new Date((user as any).metadata.creationTime).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : (user as any).createdAt 
      ? new Date((user as any).createdAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : t.profileUnknown;

  const stats = [
    { label: t.profileLevel, value: level.toString(), icon: Zap, color: 'text-yellow-400' },
    { label: t.profileExp, value: `${xpInLevel}/${xpNeeded}`, icon: Star, color: 'text-[#C3A6E6]' },
    { label: t.profileReputation, value: reputation.toString(), icon: Award, color: 'text-green-400' },
  ];

  const getRoleDisplay = () => {
    if (userRole === 'admin') return t.profileAdmin;
    if (userRole === 'moderator') return t.profileModerator;
    if (userRole === 'beta-tester') return t.profileBetaTester;
    return t.profileActiveTrailblazer;
  };

  const canSeeEmail = isOwnProfile || isAdmin;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/80">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[#2F244F] border border-[#3E3160] rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-lg overflow-hidden relative max-h-[90vh] flex flex-col"
          >
            {/* Header Section (Non-scrolling) */}
            <div className="relative shrink-0">
              {/* Header Cover */}
              <div className="h-32 bg-gradient-to-br from-[#2F244F] via-[#3E3160] to-[#5C4B8B] relative overflow-hidden">
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#C3A6E6,transparent)]" />
                </div>
                <button
                  onClick={onClose}
                  className="absolute top-6 right-6 p-2.5 bg-black/40 hover:bg-black/60 rounded-2xl text-white transition-all z-20 border border-white/10 hover:scale-110 active:scale-95"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="px-8 pt-6 pb-8 flex-1 overflow-y-auto custom-scrollbar">
              {/* Avatar - Now part of the content flow as requested */}
              <div className="flex justify-center mb-8">
                <div className="relative group">
                  <img 
                    src={photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=3E3160&color=fff`} 
                    alt="Avatar" 
                    className="w-40 h-40 rounded-[3rem] border-[8px] border-[#3E3160]/30 bg-[#3E3160] object-cover shadow-2xl transition-transform group-hover:scale-105"
                  />
                  {isOwnProfile && (
                    <button 
                      onClick={() => setIsEditingPhoto(true)}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity rounded-[3rem] text-white"
                    >
                      <Camera size={40} />
                    </button>
                  )}
                  <div className="absolute -bottom-2 -right-2 p-3 bg-[#C3A6E6] rounded-2xl shadow-xl border-4 border-[#2F244F] text-[#2F244F]">
                    <Award size={24} />
                  </div>
                </div>
              </div>
              {isEditingPhoto && isOwnProfile && (
                <div className="mb-6 p-4 bg-[#3E3160]/50 rounded-2xl border border-[#C3A6E6]/30">
                  <div className="text-[10px] font-black text-[#C3A6E6] uppercase tracking-widest mb-2">
                    {t.profilePhotoUrl}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPhotoURL}
                      onChange={(e) => setNewPhotoURL(e.target.value)}
                      className="flex-1 bg-[#2F244F] border border-[#5C4B8B] rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-[#C3A6E6]"
                      placeholder="https://..."
                    />
                    <button
                      onClick={handleUpdatePhoto}
                      disabled={isUpdating}
                      className="p-2.5 bg-[#C3A6E6] text-[#2F244F] rounded-xl hover:bg-[#B094EB] transition-colors disabled:opacity-50"
                    >
                      <Check size={20} />
                    </button>
                    <button
                      onClick={() => setIsEditingPhoto(false)}
                      className="p-2.5 bg-[#2F244F] text-gray-400 rounded-xl hover:text-white transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  {isEditingName && isOwnProfile ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="flex-1 min-w-0 bg-[#2F244F] border border-[#C3A6E6] rounded-xl px-4 py-2 text-white focus:outline-none text-xl font-bold"
                        placeholder={t.profileEnterName}
                        maxLength={30}
                        autoFocus
                      />
                      <button
                        onClick={handleUpdateName}
                        disabled={isUpdating}
                        className="shrink-0 p-2.5 bg-[#C3A6E6] text-[#2F244F] rounded-xl hover:bg-[#B094EB] transition-colors disabled:opacity-50"
                      >
                        <Check size={20} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 group">
                      <h2 className="text-3xl font-black text-white tracking-tight">{user.displayName}</h2>
                      {isOwnProfile && (
                        <button
                          onClick={() => setIsEditingName(true)}
                          className="p-1.5 text-gray-400 hover:text-[#C3A6E6] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all rounded-lg hover:bg-[#2F244F]"
                        >
                          <Edit2 size={18} />
                        </button>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[#C3A6E6] text-sm font-black uppercase tracking-[0.2em] mt-1">
                    <Zap size={14} />
                    {getRoleDisplay()}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {isOwnProfile ? (
                  <>
                    <button
                      onClick={() => { setShowChats(!showChats); setShowPosts(false); }}
                      className={`flex items-center justify-center gap-2 px-2 py-3 rounded-xl font-black uppercase tracking-tight transition-all active:scale-95 border text-[10px] sm:text-xs ${
                        showChats 
                          ? 'bg-[#C3A6E6] text-[#2F244F] border-white shadow-lg shadow-[#C3A6E6]/20' 
                          : 'bg-[#2F244F] text-[#C3A6E6] border-[#5C4B8B] hover:bg-[#3D2F66]'
                      }`}
                    >
                      <MessageSquare size={16} className="shrink-0" />
                      <span className="truncate">{t.navChats}</span>
                    </button>
                    <button
                      onClick={logout}
                      className="flex items-center justify-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-3 rounded-xl font-black uppercase tracking-tight hover:bg-red-500/20 transition-all active:scale-95 text-[10px] sm:text-xs"
                    >
                      <LogOut size={16} className="shrink-0" />
                      <span className="truncate">{t.logout}</span>
                    </button>
                  </>
                ) : (
                    <button
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('openChat', { detail: { uid: user.uid, displayName: user.displayName, photoURL: user.photoURL } }));
                        onClose();
                      }}
                      className="col-span-2 flex items-center justify-center gap-2 bg-[#C3A6E6] text-[#2F244F] border border-white/20 px-2 py-4 rounded-2xl font-black uppercase tracking-tight hover:bg-[#B094EB] transition-all active:scale-95 text-[10px] sm:text-xs shadow-[0_0_20px_rgba(195,166,230,0.3)]"
                    >
                      <MessageSquare size={16} className="shrink-0" />
                      <span className="truncate">{t.profileSendMessage}</span>
                    </button>
                )}
              </div>

              {/* Tabs for Posts */}
              <div className="flex border-b border-[#2F244F] mb-6">
                <button
                  onClick={() => { setShowPosts(false); setShowChats(false); }}
                  className={`px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${!showPosts && !showChats ? 'border-[#C3A6E6] text-[#C3A6E6]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                >
                  {t.profileInfo}
                </button>
                <button
                  onClick={() => { setShowPosts(true); setShowChats(false); }}
                  className={`px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${showPosts ? 'border-[#C3A6E6] text-[#C3A6E6]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                >
                  {t.profileUses}
                </button>
              </div>

              <AnimatePresence mode="wait">
                {showChats && isOwnProfile ? (
                  <motion.div
                    key="chats"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-8"
                  >
                    <h3 className="text-[10px] font-black text-[#C3A6E6] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <MessageSquare size={14} />
                      {t.navChats}
                    </h3>
                    <ChatsList lang={lang as any} onSelectChat={(id, name, photo) => {
                      window.dispatchEvent(new CustomEvent('openChat', { detail: { uid: id, displayName: name, photoURL: photo } }));
                      onClose();
                    }} />
                  </motion.div>
                ) : showPosts ? (
                  <motion.div
                    key="posts"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4 mb-8"
                  >
                    {isOwnProfile && (
                      <form onSubmit={handleCreatePost} className="space-y-2">
                        <textarea
                          value={newPostText}
                          onChange={(e) => setNewPostText(e.target.value)}
                          placeholder={t.profileWhatsNew}
                          className="w-full bg-[#2F244F]/50 border border-[#5C4B8B]/30 rounded-2xl p-4 text-sm text-white outline-none focus:border-[#C3A6E6] transition-colors resize-none h-24"
                        />
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={!newPostText.trim()}
                            className="bg-[#C3A6E6] text-[#2F244F] px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#B094EB] transition-colors disabled:opacity-50"
                          >
                            {t.profilePost}
                          </button>
                        </div>
                      </form>
                    )}

                    {postsLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-[#C3A6E6] border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : posts.length === 0 ? (
                      <div className="text-center py-12 text-gray-500 italic text-sm">
                        {t.profileNoUses}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {posts.map((post) => (
                          <div key={post.id} className="bg-[#2F244F]/30 p-4 rounded-2xl border border-[#5C4B8B]/20 group">
                            {editingPostId === post.id ? (
                              <div className="space-y-2">
                                <textarea
                                  defaultValue={post.text}
                                  id={`edit-${post.id}`}
                                  className="w-full bg-[#1a142e] border border-[#C3A6E6] rounded-xl p-3 text-sm text-white outline-none h-20"
                                />
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => setEditingPostId(null)} className="text-xs text-gray-500 uppercase font-bold">{t.profileCancel}</button>
                                  <button 
                                    onClick={() => handleUpdatePost(post.id, (document.getElementById(`edit-${post.id}`) as HTMLTextAreaElement).value)}
                                    className="text-xs text-[#C3A6E6] uppercase font-bold"
                                  >
                                    {t.profileSave}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{post.text}</p>
                                <div className="flex justify-between items-center mt-3">
                                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                    {new Date(post.createdAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  {isOwnProfile && (
                                    <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => setEditingPostId(post.id)} className="text-gray-500 hover:text-[#C3A6E6]"><Edit2 size={14} /></button>
                                      <button onClick={() => deletePost(post.id)} className="text-gray-500 hover:text-red-400"><X size={14} /></button>
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="info"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                      {stats.map((stat, i) => (
                        <div key={i} className="bg-[#2F244F]/50 p-4 rounded-2xl border border-[#5C4B8B]/30 flex flex-col items-center text-center">
                          <stat.icon size={20} className={`${stat.color} mb-2`} />
                          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{stat.label}</div>
                          <div className="text-sm font-black text-white">{stat.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Info List */}
                    <div className="space-y-3">
                      {canSeeEmail && (
                        <div className="flex items-center gap-4 bg-[#2F244F]/30 p-4 rounded-2xl border border-[#5C4B8B]/20 group hover:border-[#C3A6E6]/30 transition-colors">
                          <div className="p-2.5 bg-[#C3A6E6]/10 rounded-xl text-[#C3A6E6]">
                            <Mail size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">{t.profileEmail}</div>
                            <div className="text-sm text-gray-200 truncate">{user.email}</div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 bg-[#2F244F]/30 p-4 rounded-2xl border border-[#5C4B8B]/20 group hover:border-[#C3A6E6]/30 transition-colors">
                        <div className="p-2.5 bg-[#C3A6E6]/10 rounded-xl text-[#C3A6E6]">
                          <Calendar size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">{t.profileMemberSince}</div>
                          <div className="text-sm text-gray-200">{creationDate}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 bg-[#2F244F]/30 p-4 rounded-2xl border border-[#5C4B8B]/20 group hover:border-[#C3A6E6]/30 transition-colors">
                        <div className="p-2.5 bg-[#C3A6E6]/10 rounded-xl text-[#C3A6E6]">
                          <Hash size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">UID</div>
                          <div className="text-xs font-mono text-gray-400 truncate">{user.uid}</div>
                        </div>
                        <button 
                          onClick={handleCopyId}
                          className="p-2 hover:bg-[#5C4B8B] rounded-xl transition-colors text-gray-400 hover:text-white"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          {/* Toast */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-[#C3A6E6] text-[#2F244F] px-6 py-3 rounded-2xl text-sm font-black shadow-2xl border-2 border-white/20 uppercase tracking-widest z-[70]"
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
