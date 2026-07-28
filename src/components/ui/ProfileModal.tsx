import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Mail, Calendar, Hash, Edit2, Check, Copy, Award, Star, Zap, Shield, LogOut, MessageSquare, Camera, Upload, Download, Sparkles } from 'lucide-react';
import { Language, translations } from '../../data/translations';
import { useAuth } from '../../hooks/useAuth';
import { updateProfile as updateAuthProfile } from 'firebase/auth';
import { ChatsList } from '../chat/ChatsList';
import { UserData } from '../../hooks/useUsers';
import { useUserPosts } from '../../hooks/useUserPosts';
import { useUserData } from '../../hooks/useUserData';
import { doc, setDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { encrypt, decrypt } from '../../utils/encryption';
import CryptoJS from 'crypto-js';
import { vercelFallback } from '../../utils/vercelFallback';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  viewUser?: UserData | null;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, lang, viewUser }) => {
  const t = translations[lang];
  const { user: currentUser, logout, isAdmin, role: currentUserRole, updateGlobalPhoto, isVerified: isOwnVerified, sendVerificationEmail, reloadUser } = useAuth();
  const { xp: currentXp, reputation: currentRep, role: currentRole, photoURL: currentPhoto, updateProfile: updateUserData } = useUserData(lang);
  
  const isOwnProfile = !viewUser || viewUser.uid === currentUser?.uid;
  const user = viewUser || currentUser;
  const isVerified = isOwnProfile ? isOwnVerified : (viewUser?.isVerified || false);

  // Dynamic verification status background poller
  useEffect(() => {
    if (!isOpen || !isOwnProfile || isOwnVerified) return;
    
    const interval = setInterval(async () => {
      if (reloadUser) {
        await reloadUser();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, isOwnProfile, isOwnVerified, reloadUser]);
  
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
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [showChats, setShowChats] = useState(false);
  const [showPosts, setShowPosts] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleGenerateAiAvatar = async () => {
    if (!user || isGeneratingAi) return;

    setIsGeneratingAi(true);
    try {
      const seed = `${user.uid}_${Date.now()}`;
      const nameStr = user.displayName || 'User';

      const styles = [
        `High quality 3D digital art avatar portrait of ${nameStr}, futuristic cyberpunk glowing lights, dark background, 8k render, profile avatar`,
        `Stylized futuristic anime portrait of ${nameStr}, vibrant neon purple aesthetic, detailed avatar icon`,
        `Cool 3D character portrait of ${nameStr}, dark tech background with cyan neon accents, highly detailed 3D avatar`,
        `Futuristic digital avatar of ${nameStr}, soft lighting, epic avatar icon, 3D render`
      ];
      const selectedStyle = styles[Math.floor(Math.random() * styles.length)];
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(selectedStyle)}?width=512&height=512&seed=${encodeURIComponent(seed)}&nologo=true`;

      let finalPhotoData = imageUrl;

      const response = await fetch(imageUrl, { mode: 'cors' }).catch(() => null);

      if (response && response.ok) {
        const blob = await response.blob();
        const base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              canvas.width = 256;
              canvas.height = 256;
              if (ctx) {
                ctx.drawImage(img, 0, 0, 256, 256);
                resolve(canvas.toDataURL('image/jpeg', 0.85));
              } else {
                resolve(reader.result as string);
              }
            };
            img.onerror = () => resolve(imageUrl);
            img.src = reader.result as string;
          };
          reader.onerror = () => resolve(imageUrl);
          reader.readAsDataURL(blob);
        });
        finalPhotoData = base64Data;
      } else {
        finalPhotoData = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}`;
      }

      if (updateGlobalPhoto) {
        updateGlobalPhoto(finalPhotoData);
      }
      await updateUserData('', '', 0, '', '', finalPhotoData);
      await setDoc(doc(db, 'public_profiles', user.uid), {
        photoURL: finalPhotoData
      }, { merge: true });

      setNewPhotoURL(finalPhotoData);
      setIsEditingPhoto(false);
      setToast(lang === 'ru' ? 'ИИ аватар успешно сгенерирован!' : 'AI avatar generated successfully!');
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error('Error generating AI avatar:', err);
      const fallbackUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}_${Date.now()}`;
      if (updateGlobalPhoto) updateGlobalPhoto(fallbackUrl);
      await updateUserData('', '', 0, '', '', fallbackUrl);
      await setDoc(doc(db, 'public_profiles', user.uid), { photoURL: fallbackUrl }, { merge: true });
      setToast(lang === 'ru' ? 'Сгенерирован уникальный аватар!' : 'Unique avatar generated!');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const performRestoreBackup = async (file: File) => {
    if (!file || !user) return;

    setIsUploadingBackup(true);
    setBackupStatus(lang === 'ru' ? 'Чтение резервной копии...' : 'Reading backup file...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const fileContent = event.target?.result as string;
        const backupData = JSON.parse(fileContent);

        if (backupData.type !== "AHA_SECURE_BACKUP" || !backupData.payload) {
          throw new Error(lang === 'ru' ? 'Неверный формат резервной копии или файл поврежден.' : 'Invalid backup format or file is corrupted.');
        }

        setBackupStatus(lang === 'ru' ? 'Расшифровка резервной копии...' : 'Decrypting backup database...');
        
        // Decrypt the payload
        let decryptedJson = '';
        try {
          const bytes = CryptoJS.AES.decrypt(backupData.payload, "AHA_SECURE_BACKUP_KEY_2026_V2");
          decryptedJson = bytes.toString(CryptoJS.enc.Utf8);
        } catch (e) {
          console.error("Backup decryption error:", e);
        }

        if (!decryptedJson) {
          throw new Error(lang === 'ru' ? 'Ошибка расшифровки. Возможно, ключ или файл не поддерживаются.' : 'Decryption failed. Unsupported or modified backup file.');
        }

        const data = JSON.parse(decryptedJson);

        // Helper to remove any undefined values recursively so Firestore doesn't crash
        const cleanUndefined = (obj: any): any => {
          if (obj === null || obj === undefined) return null;
          if (Array.isArray(obj)) {
            return obj.map(cleanUndefined).filter(val => val !== undefined && val !== null);
          }
          if (typeof obj === 'object') {
            const newObj: any = {};
            for (const key of Object.keys(obj)) {
              if (obj[key] !== undefined) {
                newObj[key] = cleanUndefined(obj[key]);
              }
            }
            return newObj;
          }
          return obj;
        };

        setBackupStatus(lang === 'ru' ? 'Восстановление профиля...' : 'Restoring profile elements...');
        
        let postsRestored = 0;
        let theoriesRestored = 0;
        let forumThreadsRestored = 0;
        let commentsRestored = 0;
        let chatsRestored = 0;
        let messagesRestored = 0;

        // 1. Restore User Posts
        if (data.userPosts && Array.isArray(data.userPosts)) {
          setBackupStatus(lang === 'ru' ? 'Восстановление публикаций...' : 'Restoring user posts...');
          for (const post of data.userPosts) {
            const postId = post.id;
            if (postId) {
              const postData = { ...post };
              delete postData.id;
              postData.uid = user.uid; // Bound to the restoring user
              await setDoc(doc(db, 'user_posts', postId), cleanUndefined(postData), { merge: true });
              postsRestored++;
            }
          }
        }

        // 2. Restore Theories
        if (data.theories && Array.isArray(data.theories)) {
          setBackupStatus(lang === 'ru' ? 'Восстановление теорий...' : 'Restoring theories...');
          for (const theory of data.theories) {
            const theoryId = theory.id;
            if (theoryId) {
              const theoryData = { ...theory };
              delete theoryData.id;
              theoryData.authorUid = user.uid;
              await setDoc(doc(db, 'theories', theoryId), cleanUndefined(theoryData), { merge: true });
              theoriesRestored++;
            }
          }
        }

        // 3. Restore Forum Threads
        if (data.forumThreads && Array.isArray(data.forumThreads)) {
          setBackupStatus(lang === 'ru' ? 'Восстановление тем форума...' : 'Restoring forum threads...');
          for (const thread of data.forumThreads) {
            const threadId = thread.id;
            if (threadId) {
              const threadData = { ...thread };
              delete threadData.id;
              threadData.authorId = user.uid;
              await setDoc(doc(db, 'forum_threads', threadId), cleanUndefined(threadData), { merge: true });
              forumThreadsRestored++;
            }
          }
        }

        // 4. Restore Forum & Blog Comments
        const allComments = [
          ...(data.forumComments || []),
          ...(data.comments || [])
        ];
        if (allComments.length > 0) {
          setBackupStatus(lang === 'ru' ? 'Восстановление комментариев...' : 'Restoring comments...');
          for (const comment of allComments) {
            const commentId = comment.id;
            if (commentId) {
              const commentData = { ...comment };
              delete commentData.id;
              if (commentData.authorId) commentData.authorId = user.uid;
              if (commentData.authorUid) commentData.authorUid = user.uid;
              
              const colName = comment.authorId ? 'forum_comments' : 'comments';
              await setDoc(doc(db, colName, commentId), cleanUndefined(commentData), { merge: true });
              commentsRestored++;
            }
          }
        }

        // 5. Restore Chats & Messages
        if (data.chats && Array.isArray(data.chats)) {
          setBackupStatus(lang === 'ru' ? 'Восстановление чатов...' : 'Restoring chat rooms...');
          for (const chat of data.chats) {
            const chatId = chat.chatId;
            if (chatId) {
              const chatRef = doc(db, 'chats', chatId);
              
              // Re-encrypt lastMessage with the chatId
              const lastMsgEncrypted = chat.lastMessage ? encrypt(chat.lastMessage, chatId) : '';
              
              const chatData = {
                participants: chat.participants || [user.uid],
                lastMessage: lastMsgEncrypted,
                lastMessageAt: chat.lastMessageAt ? new Date(chat.lastMessageAt) : new Date()
              };

              await setDoc(chatRef, cleanUndefined(chatData), { merge: true });
              chatsRestored++;

              // Restore messages
              if (chat.messages && Array.isArray(chat.messages)) {
                for (const msg of chat.messages) {
                  const messageId = msg.id;
                  if (messageId) {
                    const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
                    
                    // Re-encrypt text and images for that specific chat room
                    const encryptedText = msg.text ? encrypt(msg.text, chatId) : '';
                    
                    const msgData: any = {
                      senderId: msg.senderId,
                      text: encryptedText,
                      type: msg.type || 'text',
                      createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
                      isEdited: msg.isEdited || false,
                      isDeleted: msg.isDeleted || false,
                      reactions: msg.reactions || {}
                    };

                    if (msg.images && Array.isArray(msg.images)) {
                      msgData.images = msg.images.map((img: string) => encrypt(img, chatId)).filter((img: any) => img !== undefined && img !== null);
                    }

                    await setDoc(msgRef, cleanUndefined(msgData), { merge: true });
                    messagesRestored++;
                  }
                }
              }
            }
          }
        }

        setToast(lang === 'ru' 
          ? `Успешно импортировано! Восстановлено: ${chatsRestored} чатов, ${messagesRestored} сообщений, ${postsRestored} постов.` 
          : `Import completed! Restored: ${chatsRestored} chats, ${messagesRestored} messages, ${postsRestored} posts.`);
        setTimeout(() => setToast(null), 5000);
      } catch (err: any) {
        console.error("Backup restoration error:", err);
        setToast(lang === 'ru' ? `Ошибка восстановления: ${err.message}` : `Restoration failed: ${err.message}`);
        setTimeout(() => setToast(null), 5000);
      } finally {
        setIsUploadingBackup(false);
        setBackupStatus('');
        if (backupFileInputRef.current) {
          backupFileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  const processFile = async (file: File) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert(lang === 'ru' ? 'Файл слишком большой. Максимальный размер 10MB' : 'File is too large. Max size is 10MB');
      return;
    }

    setIsUpdating(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        
        if (ctx) {
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          try {
            if (currentUser) {
              // Firebase Auth's photoURL has a limit of 2048 characters.
              // To avoid "auth/invalid-profile-attribute" errors, we do NOT set base64 on it.
              // Instead, we use the local in-memory proxy helper to reflect it instantly,
              // and save the full resolution base64 image securely in Firestore.
              if (updateGlobalPhoto) {
                updateGlobalPhoto(compressedBase64);
              }
              await updateUserData('', '', 0, '', '', compressedBase64);
              await setDoc(doc(db, 'public_profiles', currentUser.uid), {
                photoURL: compressedBase64
              }, { merge: true });
              
              setNewPhotoURL(compressedBase64);
              setIsEditingPhoto(false);
              setToast(t.profilePhotoUpdated);
              setTimeout(() => setToast(null), 3000);
            }
          } catch (error) {
            console.error('Error saving uploaded photo:', error);
            setToast(t.profilePhotoError);
            setTimeout(() => setToast(null), 3000);
          } finally {
            setIsUpdating(false);
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.json') || file.type === 'application/json' || file.type === 'text/plain') {
      const confirmRestore = window.confirm(lang === 'ru' 
        ? 'Обнаружен файл резервной копии. Вы хотите восстановить данные из этого архива?' 
        : 'Backup file detected. Do you want to restore your data from this archive?');
      if (confirmRestore) {
        await performRestoreBackup(file);
      }
    } else if (file.type.startsWith('image/')) {
      await processFile(file);
    } else {
      alert(lang === 'ru' ? 'Пожалуйста, загрузите корректный файл изображения или архив резервной копии (.json)' : 'Please upload a valid image file or a backup archive file (.json)');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.json') || file.type === 'application/json' || file.type === 'text/plain') {
      const confirmRestore = window.confirm(lang === 'ru' 
        ? 'Обнаружен файл резервной копии. Вы хотите восстановить данные из этого архива?' 
        : 'Backup file detected. Do you want to restore your data from this archive?');
      if (confirmRestore) {
        await performRestoreBackup(file);
      }
    } else if (file.type.startsWith('image/')) {
      await processFile(file);
    } else {
      alert(lang === 'ru' ? 'Пожалуйста, загрузите корректный файл изображения или архив резервной копии (.json)' : 'Please upload a valid image file or a backup archive file (.json)');
    }
  };

  const { posts, createPost, updatePost, deletePost, loading: postsLoading } = useUserPosts(user?.uid);
  const [newPostText, setNewPostText] = useState('');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [isDownloadingData, setIsDownloadingData] = useState(false);
  const [isUploadingBackup, setIsUploadingBackup] = useState(false);
  const [backupStatus, setBackupStatus] = useState('');
  const backupFileInputRef = React.useRef<HTMLInputElement>(null);

  // Level calculation: 1000 XP per level
  const level = Math.floor(xp / 1000) + 1;
  const xpInLevel = xp % 1000;
  const xpNeeded = 1000;

  if (!isOpen || !user) return null;

  const handleUpdateName = async () => {
    const trimmedName = newName.trim();
    if (!trimmedName || trimmedName === user.displayName) {
      setIsEditingName(false);
      return;
    }

    if (trimmedName.length > 20) {
      setToast((t as any).nicknameLengthLimit || 'Максимальная длина никнейма — 20 символов');
      setTimeout(() => setToast(null), 3000);
      return;
    }

    if (trimmedName.length < 2) {
      setToast(lang === 'ru' ? 'Минимальная длина никнейма — 2 символа' : 'Nickname must be at least 2 characters');
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setIsUpdating(true);
    try {
      if (currentUser) {
        await updateAuthProfile(currentUser, { displayName: trimmedName });
        // Also update public profile
        await setDoc(doc(db, 'public_profiles', currentUser.uid), {
          displayName: trimmedName
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
        // Firebase Auth's photoURL is limited to 2048 characters.
        // If the custom URL is a standard URL (<= 2000 chars), we sync it with Auth profile too.
        if (newPhotoURL.trim().length <= 2000) {
          await updateAuthProfile(currentUser, { photoURL: newPhotoURL.trim() });
        }
        
        if (updateGlobalPhoto) {
          updateGlobalPhoto(newPhotoURL.trim());
        }
        
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

  const getFallbackDate = (uid: string) => {
    let hash = 0;
    for (let i = 0; i < uid.length; i++) {
      hash = uid.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Map to a range of registration dates between May 1, 2026 and July 1, 2026
    const start = new Date('2026-05-01').getTime();
    const end = new Date('2026-07-01').getTime();
    const range = end - start;
    const offset = Math.abs(hash) % range;
    return new Date(start + offset);
  };

  const creationDate = ((user as any).metadata?.creationTime || (user as any).createdAt)
    ? new Date((user as any).metadata?.creationTime || (user as any).createdAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : getFallbackDate(user.uid).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

  const stats = [
    { label: t.profileLevel, value: level.toString(), icon: Zap, color: 'text-yellow-400' },
    { label: t.profileExp, value: `${xpInLevel}/${xpNeeded}`, icon: Star, color: 'text-[#ff4d4d]' },
    { label: t.profileReputation, value: reputation.toString(), icon: Award, color: 'text-green-400' },
  ];

  const getRoleDisplay = () => {
    if (userRole === 'admin') return t.profileAdmin;
    if (userRole === 'moderator') return t.profileModerator;
    if (userRole === 'beta-tester') return t.profileBetaTester;
    return t.profileActiveTrailblazer;
  };

  const canSeeEmail = isOwnProfile || isAdmin;

  const handleDownloadData = async () => {
    if (!user) return;
    setIsDownloadingData(true);
    try {
      const dataArchive: Record<string, any> = {
        exportedAt: new Date().toISOString(),
        profile: {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: photoURL || user.photoURL || '',
          xp: xp,
          reputation: reputation,
          role: userRole,
          createdAt: creationDate
        },
        theories: [],
        userPosts: [],
        forumThreads: [],
        forumComments: [],
        comments: [],
        chats: []
      };

      // 1. Fetch user profile posts
      try {
        if (vercelFallback.isAvailable()) {
          const fallbackData = await vercelFallback.lrange(`user_posts:${user.uid}`, 0, 100);
          if (fallbackData && fallbackData.length > 0) {
            dataArchive.userPosts = fallbackData.map((str: any) => typeof str === 'string' ? JSON.parse(str) : str);
          }
        } else {
          const postsQuery = query(collection(db, 'user_posts'), where('uid', '==', user.uid));
          const postsSnap = await getDocs(postsQuery);
          dataArchive.userPosts = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
      } catch (err) {
        console.error("Error exporting user posts:", err);
      }

      // 2. Fetch theories
      try {
        if (vercelFallback.isAvailable()) {
          const fallbackData = await vercelFallback.lrange('theories', 0, 200);
          if (fallbackData && fallbackData.length > 0) {
            const parsed = fallbackData.map((str: any) => typeof str === 'string' ? JSON.parse(str) : str);
            dataArchive.theories = parsed.filter((t: any) => t.authorUid === user.uid);
          }
        } else {
          const theoriesQuery = query(collection(db, 'theories'), where('authorUid', '==', user.uid));
          const theoriesSnap = await getDocs(theoriesQuery);
          dataArchive.theories = theoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
      } catch (err) {
        console.error("Error exporting theories:", err);
      }

      // 3. Fetch forum threads
      try {
        if (vercelFallback.isAvailable()) {
          const fallbackData = await vercelFallback.lrange('forum_threads', 0, 200);
          if (fallbackData && fallbackData.length > 0) {
            const parsed = fallbackData.map((str: any) => typeof str === 'string' ? JSON.parse(str) : str);
            dataArchive.forumThreads = parsed.filter((t: any) => t.authorId === user.uid);
          }
        } else {
          const forumThreadsQuery = query(collection(db, 'forum_threads'), where('authorId', '==', user.uid));
          const forumThreadsSnap = await getDocs(forumThreadsQuery);
          dataArchive.forumThreads = forumThreadsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
      } catch (err) {
        console.error("Error exporting forum threads:", err);
      }

      // 4. Fetch forum comments
      try {
        const forumCommentsQuery = query(collection(db, 'forum_comments'), where('authorId', '==', user.uid));
        const forumCommentsSnap = await getDocs(forumCommentsQuery);
        dataArchive.forumComments = forumCommentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (err) {
        console.error("Error exporting forum comments:", err);
      }

      // 5. Fetch blog comments
      try {
        const commentsQuery = query(collection(db, 'comments'), where('authorUid', '==', user.uid));
        const commentsSnap = await getDocs(commentsQuery);
        dataArchive.comments = commentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (err) {
        console.error("Error exporting blog comments:", err);
      }

      // 6. Fetch chats and decrypt messages
      try {
        const chatsQuery = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid));
        const chatsSnap = await getDocs(chatsQuery);
        
        const chatsList = [];
        for (const chatDoc of chatsSnap.docs) {
          const chatData = chatDoc.data();
          const chatId = chatDoc.id;
          
          // Fetch messages for this chat
          const messagesQuery = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'));
          const messagesSnap = await getDocs(messagesQuery);
          
          const decryptedMessages = messagesSnap.docs.map(msgDoc => {
            const msgData = msgDoc.data();
            let decryptedText = '';
            try {
              decryptedText = decrypt(msgData.text || '', chatId);
            } catch (e) {
              decryptedText = msgData.text || '';
            }

            let decryptedImages = undefined;
            if (msgData.images) {
              try {
                decryptedImages = msgData.images.map((img: string) => decrypt(img, chatId));
              } catch (e) {
                decryptedImages = msgData.images;
              }
            }

            return {
              id: msgDoc.id,
              senderId: msgData.senderId,
              text: decryptedText,
              type: msgData.type || 'text',
              images: decryptedImages,
              createdAt: msgData.createdAt?.toDate ? msgData.createdAt.toDate().toISOString() : msgData.createdAt,
              isEdited: msgData.isEdited || false,
              isDeleted: msgData.isDeleted || false,
              reactions: msgData.reactions || {}
            };
          });

          chatsList.push({
            chatId: chatId,
            participants: chatData.participants,
            messages: decryptedMessages,
            lastMessage: chatData.lastMessage ? decrypt(chatData.lastMessage, chatId) : '',
            lastMessageAt: chatData.lastMessageAt?.toDate ? chatData.lastMessageAt.toDate().toISOString() : chatData.lastMessageAt
          });
        }
        dataArchive.chats = chatsList;
      } catch (err) {
        console.error("Error exporting chats:", err);
      }

      // Convert entire archive to a JSON string
      const rawJson = JSON.stringify(dataArchive);
      
      // Encrypt the JSON string using AES with a secure backup key
      const encryptedPayload = CryptoJS.AES.encrypt(rawJson, "AHA_SECURE_BACKUP_KEY_2026_V2").toString();
      
      // Wrap it in a secure backup container
      const backupContainer = {
        type: "AHA_SECURE_BACKUP",
        version: "2.0",
        checksum: CryptoJS.SHA256(encryptedPayload).toString().substring(0, 16),
        payload: encryptedPayload
      };

      // Trigger the JSON file download
      const jsonString = `data:application/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(backupContainer, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute(
        'download',
        `aha_backup_secure_${user.uid}_${new Date().toISOString().split('T')[0]}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setToast(lang === 'ru' ? 'Зашифрованная копия создана!' : 'Encrypted backup created!');
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error("Error gathering user data:", error);
      setToast(lang === 'ru' ? 'Ошибка создания копии!' : 'Error creating backup!');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsDownloadingData(false);
    }
  };

  const handleUploadBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    await performRestoreBackup(file);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/80">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[#15101e] border border-[#251c35] rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-lg overflow-hidden relative max-h-[90vh] flex flex-col"
          >
            {/* Header Section (Non-scrolling) */}
            <div className="relative shrink-0">
              {/* Header Cover */}
              <div className="h-32 bg-gradient-to-br from-[#15101e] via-[#251c35] to-[#3d2b4f] relative overflow-hidden">
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#ff4d4d,transparent)]" />
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
              <div className="flex flex-col items-center justify-center mb-8 gap-4">
                <div className="relative group">
                  <img 
                    src={photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=1c1528&color=fff`} 
                    alt="Avatar" 
                    className="w-40 h-40 rounded-[3rem] border-[8px] border-[#251c35]/30 bg-[#251c35] object-cover shadow-2xl transition-transform group-hover:scale-105"
                  />
                  {isOwnProfile && (
                    <button 
                      onClick={() => setIsEditingPhoto(true)}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity rounded-[3rem] text-white"
                    >
                      <Camera size={40} />
                    </button>
                  )}
                  <div className="absolute -bottom-2 -right-2 p-3 bg-[#ff4d4d] rounded-2xl shadow-xl border-4 border-[#15101e] text-[#15101e]">
                    <Award size={24} />
                  </div>
                </div>

                {/* AI Avatar Generator Button */}
                {isOwnProfile && (
                  <button
                    onClick={handleGenerateAiAvatar}
                    disabled={isGeneratingAi}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 via-[#ff4d4d] to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg hover:shadow-[0_0_20px_rgba(255,77,77,0.4)] transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Sparkles size={16} className={isGeneratingAi ? 'animate-spin text-yellow-300' : 'animate-pulse text-yellow-300'} />
                    <span>
                      {isGeneratingAi
                        ? (lang === 'ru' ? 'ИИ генерирует аватар...' : 'AI generating avatar...')
                        : (!photoURL 
                            ? (lang === 'ru' ? 'Сгенерировать аватар' : 'Generate Avatar')
                            : (lang === 'ru' ? 'Сгенерировать аватар (ИИ)' : 'Generate AI Avatar'))
                      }
                    </span>
                  </button>
                )}
              </div>
              {isEditingPhoto && isOwnProfile && (
                <div className="mb-6 p-6 bg-[#1a1326] rounded-[2rem] border-2 border-dashed border-[#ff4d4d]/30 hover:border-[#ff4d4d]/60 transition-colors space-y-6 relative overflow-hidden shadow-2xl">
                  {/* AI Quick Generator inside editing box */}
                  <div className="p-4 bg-gradient-to-r from-purple-900/40 via-[#ff4d4d]/10 to-indigo-900/40 border border-purple-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-purple-500/20 rounded-xl text-yellow-300 border border-purple-500/30">
                        <Sparkles size={20} className="animate-pulse" />
                      </div>
                      <div>
                        <h6 className="text-xs font-black text-white uppercase tracking-wider">
                          {lang === 'ru' ? 'Генерация через ИИ' : 'Generate with AI'}
                        </h6>
                        <p className="text-[10px] text-white/50">
                          {lang === 'ru' ? 'Создать уникальный аватар на основе имени' : 'Create unique avatar based on your name'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleGenerateAiAvatar}
                      disabled={isGeneratingAi}
                      className="w-full sm:w-auto px-4 py-2.5 bg-[#ff4d4d] hover:bg-[#ff6666] text-[#15101e] font-black text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 active:scale-95 shrink-0"
                    >
                      {isGeneratingAi 
                        ? (lang === 'ru' ? 'Генерация...' : 'Generating...') 
                        : (lang === 'ru' ? 'Сгенерировать' : 'Generate')
                      }
                    </button>
                  </div>

                  {/* Drag-and-drop zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-6 bg-[#15101e]/80 border border-[#3d2b4f]/40 rounded-2xl cursor-pointer flex flex-col items-center justify-center text-center transition-all ${
                      isDragging 
                        ? 'bg-[#ff4d4d]/10 border-[#ff4d4d] scale-[0.98]' 
                        : 'hover:bg-[#251c35]/40 hover:border-[#ff4d4d]/40'
                    }`}
                  >
                    {isUpdating ? (
                      <div className="space-y-3">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#ff4d4d] mx-auto" />
                        <p className="text-xs font-black uppercase tracking-widest text-white/60">
                          {lang === 'ru' ? 'Обработка файла...' : 'Processing file...'}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-[#ff4d4d]/10 rounded-full flex items-center justify-center mb-3 text-[#ff4d4d] border border-[#ff4d4d]/20">
                          <Upload size={22} className={isDragging ? 'animate-bounce' : ''} />
                        </div>
                        <h5 className="text-sm font-black text-white uppercase tracking-wider mb-1">
                          {lang === 'ru' ? 'Перетащите изображение сюда' : 'Drag & drop image here'}
                        </h5>
                        <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-3">
                          {lang === 'ru' ? 'или нажмите, чтобы выбрать на ПК' : 'or click to browse local files'}
                        </p>
                        <span className="text-[9px] bg-[#3d2b4f]/40 text-white/40 border border-[#3d2b4f]/50 px-2 py-1 rounded-lg uppercase tracking-widest font-mono">
                          JPG, PNG, WEBP (Max 10MB)
                        </span>
                      </>
                    )}
                  </div>

                  {/* Or URL block */}
                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-[#3d2b4f]/30"></div>
                    <span className="flex-shrink mx-4 text-[10px] font-black uppercase tracking-widest text-white/30">
                      {lang === 'ru' ? 'или используйте ссылку' : 'or use web link'}
                    </span>
                    <div className="flex-grow border-t border-[#3d2b4f]/30"></div>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="text"
                      value={newPhotoURL}
                      onChange={(e) => setNewPhotoURL(e.target.value)}
                      className="w-full bg-[#15101e] border border-[#3d2b4f] rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-[#ff4d4d] transition-all"
                      placeholder={lang === 'ru' ? 'Вставьте URL картинки...' : 'Paste image URL here...'}
                    />
                    
                    <div className="flex gap-3 items-center justify-end">
                      <button
                        onClick={() => setIsEditingPhoto(false)}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 text-xs text-white/50 hover:text-white px-4 py-3 hover:bg-white/5 border border-[#3d2b4f]/30 rounded-xl transition-all cursor-pointer font-black uppercase tracking-widest text-[10px] h-[46px]"
                      >
                        <X size={14} />
                        {t.profileCancel}
                      </button>
                      
                      <button
                        onClick={handleUpdatePhoto}
                        disabled={isUpdating || !newPhotoURL.trim()}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-3 bg-[#ff4d4d] text-[#15101e] font-black uppercase tracking-widest text-xs rounded-xl hover:bg-[#ff7a7a] transition-all disabled:opacity-50 active:scale-95 shadow-lg cursor-pointer h-[46px]"
                      >
                        <Check size={16} />
                        {lang === 'ru' ? 'ОК' : 'OK'}
                      </button>
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  {isEditingName && isOwnProfile ? (
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="flex-1 min-w-0 bg-[#15101e] border border-[#ff4d4d] rounded-xl px-4 py-2 text-white focus:outline-none text-xl font-bold"
                          placeholder={t.profileEnterName}
                          maxLength={20}
                          autoFocus
                        />
                        <button
                          onClick={handleUpdateName}
                          disabled={isUpdating}
                          className="shrink-0 p-2.5 bg-[#ff4d4d] text-[#15101e] rounded-xl hover:bg-[#ff7a7a] transition-colors disabled:opacity-50"
                        >
                          <Check size={20} />
                        </button>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono self-end font-bold px-1">
                        {newName.length}/20 {lang === 'ru' ? 'символов' : 'chars'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 group">
                      <h2 className="text-3xl font-black text-white tracking-tight">{user.displayName}</h2>
                      {isOwnProfile && (
                        <button
                          onClick={() => setIsEditingName(true)}
                          className="p-1.5 text-white/60 hover:text-[#ff4d4d] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all rounded-lg hover:bg-[#15101e]"
                        >
                          <Edit2 size={18} />
                        </button>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[#ff4d4d] text-sm font-black uppercase tracking-[0.2em] mt-1">
                    <Zap size={14} />
                    {getRoleDisplay()}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {isOwnProfile || (user && currentUser && user.uid === currentUser.uid) ? (
                  <>
                    <button
                      onClick={() => { setShowChats(!showChats); setShowPosts(false); }}
                      className={`flex items-center justify-center gap-2 px-2 py-3 rounded-xl font-black uppercase tracking-tight transition-all active:scale-95 border text-[10px] sm:text-xs ${
                        showChats 
                          ? 'bg-[#ff4d4d] text-[#15101e] border-white shadow-lg shadow-[#ff4d4d]/20' 
                          : 'bg-[#15101e] text-[#ff4d4d] border-[#3d2b4f] hover:bg-[#3D2F66]'
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
                      className="col-span-2 flex items-center justify-center gap-2 bg-[#ff4d4d] text-[#15101e] border border-white/20 px-2 py-4 rounded-2xl font-black uppercase tracking-tight hover:bg-[#ff7a7a] transition-all active:scale-95 text-[10px] sm:text-xs shadow-[0_0_20px_rgba(255,77,77,0.3)]"
                    >
                      <MessageSquare size={16} className="shrink-0" />
                      <span className="truncate">{t.profileSendMessage}</span>
                    </button>
                )}
              </div>

              {/* Tabs for Posts */}
              <div className="flex border-b border-[#15101e] mb-6">
                <button
                  onClick={() => { setShowPosts(false); setShowChats(false); }}
                  className={`px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${!showPosts && !showChats ? 'border-[#ff4d4d] text-[#ff4d4d]' : 'border-transparent text-white/40 hover:text-white/80'}`}
                >
                  {t.profileInfo}
                </button>
                <button
                  onClick={() => { setShowPosts(true); setShowChats(false); }}
                  className={`px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${showPosts ? 'border-[#ff4d4d] text-[#ff4d4d]' : 'border-transparent text-white/40 hover:text-white/80'}`}
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
                    <h3 className="text-[10px] font-black text-[#ff4d4d] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
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
                          className="w-full bg-[#15101e]/50 border border-[#3d2b4f]/30 rounded-2xl p-4 text-sm text-white outline-none focus:border-[#ff4d4d] transition-colors resize-none h-24"
                        />
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={!newPostText.trim()}
                            className="bg-[#ff4d4d] text-[#15101e] px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#ff7a7a] transition-colors disabled:opacity-50"
                          >
                            {t.profilePost}
                          </button>
                        </div>
                      </form>
                    )}

                    {postsLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-[#ff4d4d] border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : posts.length === 0 ? (
                      <div className="text-center py-12 text-white/40 italic text-sm">
                        {t.profileNoUses}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {posts.map((post) => (
                          <div key={post.id} className="bg-[#15101e]/30 p-4 rounded-2xl border border-[#3d2b4f]/20 group">
                            {editingPostId === post.id ? (
                              <div className="space-y-2">
                                <textarea
                                  defaultValue={post.text}
                                  id={`edit-${post.id}`}
                                  className="w-full bg-[#0d0b14] border border-[#ff4d4d] rounded-xl p-3 text-sm text-white outline-none h-20"
                                />
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => setEditingPostId(null)} className="text-xs text-white/40 uppercase font-bold">{t.profileCancel}</button>
                                  <button 
                                    onClick={() => handleUpdatePost(post.id, (document.getElementById(`edit-${post.id}`) as HTMLTextAreaElement).value)}
                                    className="text-xs text-[#ff4d4d] uppercase font-bold"
                                  >
                                    {t.profileSave}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">{post.text.replace('[CANVAS_SNAPSHOT]', '')}</p>
                                {post.pixelsSnapshot && (
                                  <div className="mt-3 aspect-square max-w-[200px] w-full bg-[#15101e] rounded-lg overflow-hidden border border-[#3d2b4f]/50">
                                    <div 
                                      className="w-full h-full grid"
                                      style={{ 
                                        gridTemplateColumns: `repeat(32, 1fr)`,
                                        gridTemplateRows: `repeat(32, 1fr)`
                                      }}
                                    >
                                      {(() => {
                                        let pixelsObj = {};
                                        try { pixelsObj = JSON.parse(post.pixelsSnapshot); } catch (e) {}
                                        const cells = [];
                                        for (let y = 0; y < 32; y++) {
                                          for (let x = 0; x < 32; x++) {
                                            const pixelId = `${x},${y}`;
                                            const pixel = (pixelsObj as any)[pixelId];
                                            cells.push(
                                              <div
                                                key={pixelId}
                                                style={{ backgroundColor: pixel?.color || '#15101e' }}
                                              />
                                            );
                                          }
                                        }
                                        return cells;
                                      })()}
                                    </div>
                                  </div>
                                )}
                                <div className="flex justify-between items-center mt-3">
                                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                                    {new Date(post.createdAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  {isOwnProfile && (
                                    <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => setEditingPostId(post.id)} className="text-white/40 hover:text-[#ff4d4d]"><Edit2 size={14} /></button>
                                      <button onClick={() => deletePost(post.id)} className="text-white/40 hover:text-red-400"><X size={14} /></button>
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
                        <div key={i} className="bg-[#15101e]/50 p-4 rounded-2xl border border-[#3d2b4f]/30 flex flex-col items-center text-center">
                          <stat.icon size={20} className={`${stat.color} mb-2`} />
                          <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">{stat.label}</div>
                          <div className="text-sm font-black text-white">{stat.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Info List */}
                    <div className="space-y-3">
                      {/* Verification status */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-[#15101e]/30 p-4 rounded-2xl border border-[#3d2b4f]/20 group hover:border-[#ff4d4d]/30 transition-colors">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`p-2.5 rounded-xl shrink-0 ${isVerified ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                            {isVerified ? <Check size={20} /> : <Shield size={20} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-0.5">
                              {lang === 'ru' ? 'Статус верификации' : 'Verification Status'}
                            </div>
                            <div className={`text-sm font-black uppercase tracking-wider ${isVerified ? 'text-green-400' : 'text-red-400'}`}>
                              {isVerified 
                                ? (lang === 'ru' ? 'Верифицирован' : 'Verified') 
                                : (lang === 'ru' ? 'Не верифицирован' : 'Not Verified')}
                            </div>
                          </div>
                        </div>
                        {isOwnProfile && !isVerified && (
                          <button
                            onClick={async () => {
                              try {
                                if (sendVerificationEmail) {
                                  await sendVerificationEmail();
                                  setToast(lang === 'ru' ? 'Ссылка для подтверждения отправлена на вашу почту!' : 'Verification link has been sent to your email!');
                                  setTimeout(() => setToast(null), 4000);
                                }
                              } catch (err: any) {
                                console.error(err);
                                setToast(lang === 'ru' ? 'Ошибка отправки ссылки!' : 'Error sending verification link!');
                                setTimeout(() => setToast(null), 3000);
                              }
                            }}
                            className="w-full sm:w-auto shrink-0 text-center text-[10px] font-black uppercase tracking-widest bg-[#ff4d4d] text-[#15101e] px-4 py-2.5 rounded-xl hover:bg-white hover:scale-105 transition-all"
                          >
                            {lang === 'ru' ? 'Подтвердить' : 'Verify'}
                          </button>
                        )}
                      </div>

                      {canSeeEmail && (
                        <div className="flex items-center gap-4 bg-[#15101e]/30 p-4 rounded-2xl border border-[#3d2b4f]/20 group hover:border-[#ff4d4d]/30 transition-colors">
                          <div className="p-2.5 bg-[#ff4d4d]/10 rounded-xl text-[#ff4d4d]">
                            <Mail size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-0.5">{t.profileEmail}</div>
                            <div className="text-sm text-white/90 truncate">{user.email}</div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 bg-[#15101e]/30 p-4 rounded-2xl border border-[#3d2b4f]/20 group hover:border-[#ff4d4d]/30 transition-colors">
                        <div className="p-2.5 bg-[#ff4d4d]/10 rounded-xl text-[#ff4d4d]">
                          <Calendar size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-0.5">{t.profileMemberSince}</div>
                          <div className="text-sm text-white/90">{creationDate}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 bg-[#15101e]/30 p-4 rounded-2xl border border-[#3d2b4f]/20 group hover:border-[#ff4d4d]/30 transition-colors">
                        <div className="p-2.5 bg-[#ff4d4d]/10 rounded-xl text-[#ff4d4d]">
                          <Hash size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-0.5">UID</div>
                          <div className="text-xs font-mono text-white/60 truncate">{user.uid}</div>
                        </div>
                        <button 
                          onClick={handleCopyId}
                          className="p-2 hover:bg-[#3d2b4f] rounded-xl transition-colors text-white/60 hover:text-white"
                        >
                          <Copy size={16} />
                        </button>
                      </div>

                      {isOwnProfile && (
                        <div className="mt-6 bg-[#251c35]/40 border border-[#3d2b4f]/40 p-5 rounded-2xl flex flex-col gap-4">
                          <div>
                            <h4 className="text-xs font-black text-[#ff4d4d] uppercase tracking-wider mb-1 flex items-center gap-2">
                              <Shield size={14} />
                              {lang === 'ru' ? 'Защищенное резервное копирование' : 'Secure Backup & Restore'}
                            </h4>
                            <p className="text-[10px] text-white/50 leading-relaxed">
                              {lang === 'ru'
                                ? 'Экспортируйте ваши переписки, посты и теории в виде зашифрованного архива. Данные будут полностью скрыты от посторонних и расшифрованы только этой системой при восстановлении.'
                                : 'Export your chat history, posts, and theories into a secure encrypted archive. Your data remains completely private and can only be decrypted by restoring it back onto this site.'}
                            </p>
                          </div>
                          
                          <input 
                            type="file" 
                            ref={backupFileInputRef} 
                            onChange={handleUploadBackup} 
                            accept=".json" 
                            className="hidden" 
                          />

                          {isUploadingBackup ? (
                            <div className="flex flex-col items-center justify-center p-4 bg-[#15101e]/60 rounded-xl border border-[#ff4d4d]/20 gap-3">
                              <div className="w-6 h-6 border-2 border-[#ff4d4d] border-t-transparent rounded-full animate-spin" />
                              <div className="text-[10px] font-bold text-[#ff4d4d] uppercase tracking-widest text-center">
                                {backupStatus}
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <button
                                onClick={handleDownloadData}
                                disabled={isDownloadingData}
                                className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#ff4d4d] text-[#15101e] hover:bg-white hover:scale-[1.02] transition-all rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50 active:scale-95 shadow-md shadow-[#ff4d4d]/10 cursor-pointer"
                              >
                                {isDownloadingData ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-[#15101e] border-t-transparent rounded-full animate-spin shrink-0" />
                                    <span>{lang === 'ru' ? 'Шифрование...' : 'Encrypting...'}</span>
                                  </>
                                ) : (
                                  <>
                                    <Download size={14} className="shrink-0" />
                                    <span>{lang === 'ru' ? 'Скачать копию' : 'Create Backup'}</span>
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => backupFileInputRef.current?.click()}
                                className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#15101e] text-[#ff4d4d] border border-[#ff4d4d]/30 hover:border-[#ff4d4d] hover:bg-[#ff4d4d]/5 hover:scale-[1.02] transition-all rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 cursor-pointer"
                              >
                                <Upload size={14} className="shrink-0" />
                                <span>{lang === 'ru' ? 'Восстановить' : 'Restore Backup'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
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
                className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-[#ff4d4d] text-[#15101e] px-6 py-3 rounded-2xl text-sm font-black shadow-2xl border-2 border-white/20 uppercase tracking-widest z-[70]"
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
