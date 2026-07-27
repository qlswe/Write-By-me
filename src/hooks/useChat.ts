import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc, getDoc, where, limit, updateDoc, deleteField, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './useAuth';
import { encrypt, decrypt } from '../utils/encryption';
import { vercelFallback } from '../utils/vercelFallback';
import { generatePrefixedId } from '../utils/idGenerator';

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
  type?: 'text' | 'sticker' | 'image' | 'voice' | 'file';
  images?: string[];
  replyTo?: string; // ID of the message being replied to
  reactions?: Record<string, string[]>; // emoji -> array of user IDs
  isEdited?: boolean;
  isDeleted?: boolean;
  voiceDuration?: number;
  fileAttachment?: {
    url: string;
    name: string;
    size: number;
    fileType: string;
  } | null;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: any;
  unreadCount?: Record<string, number>;
  typing?: Record<string, boolean>;
  lastReadAt?: Record<string, any>;
  isGroup?: boolean;
  name?: string;
  avatar?: string;
  admins?: string[];
  ownerId?: string;
  theme?: {
    wallpaper?: string;
    glowColor?: string;
    gradient?: string;
  };
  pinnedMessage?: {
    id: string;
    text: string;
    senderId: string;
    type?: string;
  } | null;
}

const getMillis = (val: any): number => {
  if (!val) return 0;
  if (typeof val.toMillis === 'function') return val.toMillis();
  if (typeof val.toDate === 'function') return val.toDate().getTime();
  if (val instanceof Date) return val.getTime();
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return new Date(val).getTime();
  if (typeof val.seconds === 'number') return val.seconds * 1000 + Math.floor((val.nanoseconds || 0) / 1000000);
  return 0;
};

export function useChat(otherUserId?: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to safely get the current chat ID
  const getChatId = (otherId: string) => {
    if (!user) return '';
    return otherId.startsWith('group_') ? otherId : [user.uid, otherId].sort().join('_');
  };

  // Get all chats for the current user
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          lastMessage: data.lastMessage ? decrypt(data.lastMessage, doc.id) : undefined
        } as Chat;
      });
      
      // Sort client-side to avoid composite index requirement
      chatsData.sort((a, b) => {
        const timeA = getMillis(a.lastMessageAt);
        const timeB = getMillis(b.lastMessageAt);
        return timeB - timeA;
      });
      
      setChats(chatsData);
      setLoading(false);
    }, (error) => {
      console.error("Error in chats snapshot listener:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  // Get messages for a specific chat
  useEffect(() => {
    if (!user || !otherUserId) return;

    const chatId = getChatId(otherUserId);
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          text: decrypt(data.text, chatId),
          images: data.images ? data.images.map((img: string) => decrypt(img, chatId)) : undefined,
          fileAttachment: data.fileAttachment ? {
            ...data.fileAttachment,
            url: decrypt(data.fileAttachment.url, chatId)
          } : undefined
        } as Message;
      });
      setMessages(messagesData);
    });

    let fallbackInterval: ReturnType<typeof setInterval>;
    const fetchFallbackMessages = async () => {
      if (vercelFallback.isAvailable()) {
         try {
           const fallbackData = await vercelFallback.lrange(`chat:${chatId}`, 0, 100);
           if (fallbackData && fallbackData.length > 0) {
             const parsed = fallbackData.map((str: any) => {
               const data = typeof str === 'string' ? JSON.parse(str) : str;
               return {
                 ...data,
                 text: decrypt(data.text, chatId),
                 images: data.images ? data.images.map((img: string) => decrypt(img, chatId)) : undefined,
                 fileAttachment: data.fileAttachment ? {
                   ...data.fileAttachment,
                   url: decrypt(data.fileAttachment.url, chatId)
                 } : undefined
               };
             }).reverse() as Message[];
             
             setMessages(prev => {
               const mapped = new Map([...prev, ...parsed].map(m => [m.id, m]));
               const sorted = Array.from(mapped.values()).sort((a, b) => {
                   const timeA = getMillis(a.createdAt);
                   const timeB = getMillis(b.createdAt);
                   return timeA - timeB;
               });
               return sorted;
             });
           }
         } catch (e) {
           console.error('Fallback read error', e);
         }
      }
    };

    fetchFallbackMessages();
    fallbackInterval = setInterval(fetchFallbackMessages, 3000);

    return () => {
      unsubscribe();
      clearInterval(fallbackInterval);
    };
  }, [user, otherUserId]);

  const sendMessage = async (
    text: string, 
    recipientId: string, 
    type: 'text' | 'sticker' | 'image' | 'voice' | 'file' = 'text', 
    replyTo?: string, 
    images?: string[], 
    voiceDuration?: number,
    fileAttachment?: { url: string; name: string; size: number; fileType: string } | null,
    overrideSenderId?: string
  ) => {
    const senderId = overrideSenderId || user?.uid;
    if (!senderId || (!recipientId.startsWith('group_') && user?.uid === recipientId && !overrideSenderId) || (!text.trim() && type !== 'image' && type !== 'voice' && type !== 'file' && (!images || images.length === 0) && !fileAttachment)) return;

    const chatId = getChatId(recipientId);
    const chatRef = doc(db, 'chats', chatId);
    const messagesRef = collection(db, 'chats', chatId, 'messages');

    const encryptedText = text ? encrypt(text.trim(), chatId) : '';

    try {
      if (vercelFallback.isAvailable()) {
         const messageData = {
           id: generatePrefixedId('msg'),
           senderId,
           text: encryptedText,
           createdAt: new Date().toISOString(),
           type,
           replyTo,
           images: images ? images.map(img => encrypt(img, chatId)) : undefined,
           voiceDuration,
           fileAttachment: fileAttachment ? {
             ...fileAttachment,
             url: encrypt(fileAttachment.url, chatId)
           } : undefined
         };
         await vercelFallback.lpush(`chat:${chatId}`, JSON.stringify(messageData));
         return;
      }

      // Ensure chat document exists
      const chatDoc = await getDoc(chatRef);
      if (!chatDoc.exists()) {
        if (recipientId.startsWith('group_')) {
          await setDoc(chatRef, {
            participants: [user?.uid || 'user', recipientId.startsWith('group_') ? '' : recipientId].filter(Boolean),
            isGroup: true,
            name: 'Group Chat',
            createdAt: serverTimestamp()
          });
        } else {
          await setDoc(chatRef, {
            participants: [user?.uid || 'user', recipientId],
            createdAt: serverTimestamp()
          });
        }
      }

      // Add message
      const messageData: any = {
        senderId,
        text: encryptedText,
        createdAt: serverTimestamp(),
        type
      };
      if (replyTo) messageData.replyTo = replyTo;
      if (images && images.length > 0) messageData.images = images.map(img => encrypt(img, chatId));
      if (voiceDuration !== undefined) messageData.voiceDuration = voiceDuration;
      if (fileAttachment) {
        messageData.fileAttachment = {
          ...fileAttachment,
          url: encrypt(fileAttachment.url, chatId)
        };
      }

      // Check payload size to prevent Firestore 1MB document limit error
      const payloadString = JSON.stringify(messageData);
      if (payloadString.length > 850000) {
        console.warn('Message payload size exceeds safety limit:', payloadString.length);
        window.dispatchEvent(new CustomEvent('aha_toast', {
          detail: 'Вложение или файл слишком велики для отправки (макс. 800 КБ).'
        }));
        return;
      }

      await addDoc(messagesRef, messageData);

      // Update chat metadata
      const updateData: any = {
        lastMessage: type === 'sticker' 
          ? encrypt('Sticker', chatId) 
          : type === 'image' 
            ? encrypt('Фото', chatId) 
            : type === 'voice' 
              ? encrypt('🎤 Голосовое сообщение', chatId) 
              : type === 'file'
                ? encrypt(`📁 ${fileAttachment?.name || 'Файл'}`, chatId)
                : encryptedText,
        lastMessageAt: serverTimestamp()
      };
      if (!recipientId.startsWith('group_')) {
        updateData.participants = [user.uid, recipientId];
      }
      await setDoc(chatRef, updateData, { merge: true });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const toggleReaction = async (messageId: string, recipientId: string, emoji: string) => {
    if (!user) return;
    const chatId = getChatId(recipientId);
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
    
    try {
      const msgDoc = await getDoc(messageRef);
      if (msgDoc.exists()) {
        const data = msgDoc.data();
        const reactions = data.reactions || {};
        const usersForEmoji = reactions[emoji] || [];
        
        const updates: any = {};
        
        if (usersForEmoji.includes(user.uid)) {
          const newUsers = usersForEmoji.filter((id: string) => id !== user.uid);
          if (newUsers.length === 0) {
            updates[`reactions.${emoji}`] = deleteField();
          } else {
            updates[`reactions.${emoji}`] = newUsers;
          }
        } else {
          // Remove user from all other reactions
          Object.keys(reactions).forEach(existingKey => {
            if (existingKey !== emoji && reactions[existingKey].includes(user.uid)) {
              const remainingUsers = reactions[existingKey].filter((id: string) => id !== user.uid);
              if (remainingUsers.length === 0) {
                updates[`reactions.${existingKey}`] = deleteField();
              } else {
                updates[`reactions.${existingKey}`] = remainingUsers;
              }
            }
          });
          updates[`reactions.${emoji}`] = [...usersForEmoji, user.uid];
        }
        
        await updateDoc(messageRef, updates);
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  const deleteMessage = async (messageId: string, recipientId: string) => {
    if (!user) return;
    const chatId = getChatId(recipientId);
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
    try {
      await setDoc(messageRef, { isDeleted: true, text: encrypt('Сообщение удалено', chatId) }, { merge: true });
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const editMessage = async (messageId: string, recipientId: string, newText: string) => {
    if (!user || !newText.trim()) return;
    const chatId = getChatId(recipientId);
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
    try {
      await setDoc(messageRef, { text: encrypt(newText.trim(), chatId), isEdited: true }, { merge: true });
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const setTyping = async (recipientId: string, isTyping: boolean) => {
    if (!user) return;
    const chatId = getChatId(recipientId);
    const chatRef = doc(db, 'chats', chatId);
    try {
      await setDoc(chatRef, { [`typing.${user.uid}`]: isTyping }, { merge: true });
    } catch (error) {
      console.error('Error setting typing status:', error);
    }
  };

  const markChatAsRead = async (recipientId: string) => {
    if (!user) return;
    const chatId = getChatId(recipientId);
    const chatRef = doc(db, 'chats', chatId);
    try {
      const chatDoc = await getDoc(chatRef);
      if (chatDoc.exists()) {
        await updateDoc(chatRef, { [`lastReadAt.${user.uid}`]: serverTimestamp() });
      }
    } catch (error) {
      console.error('Error marking chat as read:', error);
    }
  };

  const pinMessage = async (recipientId: string, message: Message) => {
    if (!user) return;
    const chatId = getChatId(recipientId);
    const chatRef = doc(db, 'chats', chatId);
    try {
      await setDoc(chatRef, {
        pinnedMessage: {
          id: message.id,
          text: message.text,
          senderId: message.senderId,
          type: message.type || 'text'
        }
      }, { merge: true });
    } catch (error) {
      console.error('Error pinning message:', error);
    }
  };

  const unpinMessage = async (recipientId: string) => {
    if (!user) return;
    const chatId = getChatId(recipientId);
    const chatRef = doc(db, 'chats', chatId);
    try {
      await updateDoc(chatRef, {
        pinnedMessage: deleteField()
      });
    } catch (error) {
      console.error('Error unpinning message:', error);
    }
  };

  const deleteChat = async (recipientId: string) => {
    if (!user) return;
    const chatId = getChatId(recipientId);
    const chatRef = doc(db, 'chats', chatId);
    try {
      if (vercelFallback.isAvailable()) {
        await vercelFallback.lpush(`deleted_chats:${user.uid}`, chatId);
      }
      await updateDoc(chatRef, {
        participants: arrayRemove(user.uid)
      });
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const blockUser = async (targetUid: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'public_profiles', user.uid), {
        blockedUsers: arrayUnion(targetUid)
      });
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  };

  const unblockUser = async (targetUid: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'public_profiles', user.uid), {
        blockedUsers: arrayRemove(targetUid)
      });
    } catch (error) {
      console.error('Error unblocking user:', error);
    }
  };

  return { chats, messages, loading, sendMessage, toggleReaction, deleteMessage, editMessage, setTyping, markChatAsRead, pinMessage, unpinMessage, deleteChat, blockUser, unblockUser };
}
