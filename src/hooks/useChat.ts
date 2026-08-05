import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  where,
  limit,
  updateDoc,
  deleteField,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './useAuth';
import { vercelFallback } from '../utils/vercelFallback';
import { generatePrefixedId } from '../utils/idGenerator';
import { uploadMediaFile } from '../utils/mediaUploader';

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
  type?: 'text' | 'sticker' | 'image' | 'voice' | 'file';
  images?: string[];
  replyTo?: {
    id: string;
    text: string;
    senderId: string;
    type?: string;
  } | null;
  reactions?: Record<string, string[]>; // emoji -> array of user UIDs
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

  // Helper to determine deterministic 1-on-1 chat ID or group chat ID
  const getChatId = (otherId: string) => {
    if (!user) return '';
    return otherId.startsWith('group_') ? otherId : [user.uid, otherId].sort().join('_');
  };

  // Subscribe to all chats for current user
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let localDeleted: string[] = [];
        try {
          localDeleted = JSON.parse(localStorage.getItem(`deleted_chats_${user.uid}`) || '[]');
        } catch {
          localDeleted = [];
        }

        const chatsData = snapshot.docs
          .map((docSnap) => {
            const data = docSnap.data();
            return {
              ...data,
              id: docSnap.id
            } as Chat;
          })
          .filter((c) => !localDeleted.includes(c.id));

        // Sort client-side by lastMessageAt timestamp descending
        chatsData.sort((a, b) => getMillis(b.lastMessageAt) - getMillis(a.lastMessageAt));

        setChats(chatsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching chats snapshot:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  // Subscribe to messages in active selected chat
  useEffect(() => {
    if (!user || !otherUserId) {
      setMessages([]);
      return;
    }

    const chatId = getChatId(otherUserId);
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(150)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messagesData = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            ...data,
            id: docSnap.id
          } as Message;
        });
        setMessages(messagesData);
      },
      (error) => {
        console.error('Error in messages snapshot listener:', error);
      }
    );

    // Fallback polling for serverless environment if available
    let fallbackInterval: ReturnType<typeof setInterval>;
    const fetchFallbackMessages = async () => {
      if (vercelFallback.isAvailable()) {
        try {
          const fallbackData = await vercelFallback.lrange(`chat:${chatId}`, 0, 150);
          if (fallbackData && fallbackData.length > 0) {
            const parsed = fallbackData
              .map((str: any) => (typeof str === 'string' ? JSON.parse(str) : str))
              .reverse() as Message[];

            setMessages((prev) => {
              const mapped = new Map([...prev, ...parsed].map((m) => [m.id, m]));
              return Array.from(mapped.values()).sort(
                (a, b) => getMillis(a.createdAt) - getMillis(b.createdAt)
              );
            });
          }
        } catch (e) {
          console.warn('Fallback read error:', e);
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

  // Send Message
  const sendMessage = async (
    text: string,
    recipientId: string,
    type: 'text' | 'sticker' | 'image' | 'voice' | 'file' = 'text',
    replyTo?: { id: string; text: string; senderId: string; type?: string } | null,
    images?: string[],
    voiceDuration?: number,
    fileAttachment?: { url: string; name: string; size: number; fileType: string } | null,
    overrideSenderId?: string
  ) => {
    const senderId = overrideSenderId || user?.uid;
    if (!senderId || !recipientId) return;

    // Guard empty content
    if (
      !text.trim() &&
      type !== 'image' &&
      type !== 'voice' &&
      type !== 'file' &&
      (!images || images.length === 0) &&
      !fileAttachment
    ) {
      return;
    }

    const chatId = getChatId(recipientId);
    const chatRef = doc(db, 'chats', chatId);
    const messagesRef = collection(db, 'chats', chatId, 'messages');

    // Handle media uploading if base64 data URL
    let processedImages = images;
    if (images && images.length > 0) {
      processedImages = await Promise.all(
        images.map(async (img) => {
          if (img && img.startsWith('data:image/')) {
            try {
              return await uploadMediaFile(img);
            } catch (e) {
              console.warn('Failed image upload, keeping local fallback:', e);
              return img;
            }
          }
          return img;
        })
      );
    }

    let processedFileAttachment = fileAttachment;
    if (fileAttachment?.url && fileAttachment.url.startsWith('data:')) {
      try {
        const uploadedUrl = await uploadMediaFile(fileAttachment.url, fileAttachment.name);
        processedFileAttachment = { ...fileAttachment, url: uploadedUrl };
      } catch (e) {
        console.warn('Failed file upload:', e);
      }
    }

    const trimmedText = text.trim();

    try {
      // Vercel Fallback mode
      if (vercelFallback.isAvailable()) {
        const messageData: Message = {
          id: generatePrefixedId('msg'),
          senderId,
          text: trimmedText,
          createdAt: new Date().toISOString(),
          type,
          replyTo: replyTo || undefined,
          images: processedImages,
          voiceDuration,
          fileAttachment: processedFileAttachment
        };
        await vercelFallback.lpush(`chat:${chatId}`, JSON.stringify(messageData));
        return;
      }

      // Ensure target chat document exists in Firestore
      const chatDoc = await getDoc(chatRef);
      if (!chatDoc.exists()) {
        if (recipientId.startsWith('group_')) {
          await setDoc(chatRef, {
            id: chatId,
            participants: [user?.uid || 'user'],
            isGroup: true,
            name: 'Cyber Group',
            createdAt: serverTimestamp()
          });
        } else {
          await setDoc(chatRef, {
            id: chatId,
            participants: Array.from(new Set([user?.uid || 'user', recipientId])),
            createdAt: serverTimestamp()
          });
        }
      }

      // Construct new message object
      const messageData: any = {
        senderId,
        text: trimmedText,
        createdAt: serverTimestamp(),
        type
      };

      if (replyTo) messageData.replyTo = replyTo;
      if (processedImages && processedImages.length > 0) messageData.images = processedImages;
      if (voiceDuration !== undefined) messageData.voiceDuration = voiceDuration;
      if (processedFileAttachment) messageData.fileAttachment = processedFileAttachment;

      // Check size before write
      const sizeStr = JSON.stringify(messageData);
      if (sizeStr.length > 850000) {
        window.dispatchEvent(
          new CustomEvent('aha_toast', {
            detail: 'Размер файла превышает лимит (макс. 800 КБ)'
          })
        );
        return;
      }

      await addDoc(messagesRef, messageData);

      // Determine last message summary text
      let lastMsgPreview = trimmedText;
      if (type === 'sticker') lastMsgPreview = '🎨 Стикер';
      else if (type === 'image') lastMsgPreview = '📷 Фото';
      else if (type === 'voice') lastMsgPreview = '🎤 Голосовое сообщение';
      else if (type === 'file') lastMsgPreview = `📁 ${fileAttachment?.name || 'Файл'}`;

      const updateData: any = {
        lastMessage: lastMsgPreview,
        lastMessageAt: serverTimestamp()
      };

      if (!recipientId.startsWith('group_') && user) {
        updateData.participants = Array.from(new Set([user.uid, recipientId]));
      }

      await setDoc(chatRef, updateData, { merge: true });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Toggle Reaction on a message
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
          // Remove user from existing reactions and add to new emoji
          Object.keys(reactions).forEach((existingEmoji) => {
            if (existingEmoji !== emoji && reactions[existingEmoji].includes(user.uid)) {
              const remaining = reactions[existingEmoji].filter((id: string) => id !== user.uid);
              if (remaining.length === 0) {
                updates[`reactions.${existingEmoji}`] = deleteField();
              } else {
                updates[`reactions.${existingEmoji}`] = remaining;
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

  // Delete single message
  const deleteMessage = async (messageId: string, recipientId: string) => {
    if (!user) return;
    const chatId = getChatId(recipientId);
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
    try {
      await setDoc(
        messageRef,
        { isDeleted: true, text: 'Сообщение удалено', images: [], fileAttachment: null },
        { merge: true }
      );
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  // Edit single message
  const editMessage = async (messageId: string, recipientId: string, newText: string) => {
    if (!user || !newText.trim()) return;
    const chatId = getChatId(recipientId);
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
    try {
      await setDoc(messageRef, { text: newText.trim(), isEdited: true }, { merge: true });
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  // Set typing indicator
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

  // Mark chat read timestamp
  const markChatAsRead = async (recipientId: string) => {
    if (!user) return;
    const chatId = getChatId(recipientId);
    const chatRef = doc(db, 'chats', chatId);
    try {
      await updateDoc(chatRef, { [`lastReadAt.${user.uid}`]: serverTimestamp() });
    } catch (error) {
      console.error('Error marking chat as read:', error);
    }
  };

  // Pin Message
  const pinMessage = async (recipientId: string, message: Message) => {
    if (!user) return;
    const chatId = getChatId(recipientId);
    const chatRef = doc(db, 'chats', chatId);
    try {
      await setDoc(
        chatRef,
        {
          pinnedMessage: {
            id: message.id,
            text: message.text || (message.type === 'image' ? 'Фото' : message.type === 'file' ? 'Файл' : 'Сообщение'),
            senderId: message.senderId,
            type: message.type || 'text'
          }
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error pinning message:', error);
    }
  };

  // Unpin Message
  const unpinMessage = async (recipientId: string) => {
    if (!user) return;
    const chatId = getChatId(recipientId);
    const chatRef = doc(db, 'chats', chatId);
    try {
      await updateDoc(chatRef, { pinnedMessage: deleteField() });
    } catch (error) {
      console.error('Error unpinning message:', error);
    }
  };

  // Delete single chat
  const deleteChat = async (recipientId: string) => {
    if (!user) return;
    const chatId = getChatId(recipientId);
    const chatRef = doc(db, 'chats', chatId);
    try {
      const existing = JSON.parse(localStorage.getItem(`deleted_chats_${user.uid}`) || '[]');
      localStorage.setItem(`deleted_chats_${user.uid}`, JSON.stringify(Array.from(new Set([...existing, chatId]))));

      if (vercelFallback.isAvailable()) {
        await vercelFallback.lpush(`deleted_chats:${user.uid}`, chatId);
      }

      await updateDoc(chatRef, {
        participants: arrayRemove(user.uid)
      });
      setChats((prev) => prev.filter((c) => c.id !== chatId));
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  // Delete ALL chats
  const deleteAllChats = async () => {
    if (!user) return;
    try {
      const allChatIds = chats.map((c) => c.id);
      const existing = JSON.parse(localStorage.getItem(`deleted_chats_${user.uid}`) || '[]');
      const updated = Array.from(new Set([...existing, ...allChatIds]));
      localStorage.setItem(`deleted_chats_${user.uid}`, JSON.stringify(updated));

      for (const c of chats) {
        const chatId = c.id;
        const chatRef = doc(db, 'chats', chatId);
        if (vercelFallback.isAvailable()) {
          await vercelFallback.lpush(`deleted_chats:${user.uid}`, chatId);
        }
        try {
          await updateDoc(chatRef, {
            participants: arrayRemove(user.uid)
          });
        } catch (e) {
          console.warn('Error updating chat participant removal:', e);
        }
      }
      setChats([]);
      setMessages([]);
    } catch (error) {
      console.error('Error deleting all chats:', error);
    }
  };

  // Create Group Chat
  const createGroupChat = async (groupName: string, participantUids: string[], avatarUrl?: string) => {
    if (!user || !groupName.trim()) return null;
    const groupId = `group_${generatePrefixedId('chat')}`;
    const groupRef = doc(db, 'chats', groupId);
    const allParticipants = Array.from(new Set([user.uid, ...participantUids]));

    try {
      const groupData = {
        id: groupId,
        name: groupName.trim(),
        avatar: avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${groupId}`,
        isGroup: true,
        participants: allParticipants,
        admins: [user.uid],
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        lastMessage: 'Группа создана',
        lastMessageAt: serverTimestamp()
      };
      await setDoc(groupRef, groupData);
      return groupId;
    } catch (error) {
      console.error('Error creating group chat:', error);
      return null;
    }
  };

  // Block/Unblock user
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

  return {
    chats,
    messages,
    loading,
    sendMessage,
    toggleReaction,
    deleteMessage,
    editMessage,
    setTyping,
    markChatAsRead,
    pinMessage,
    unpinMessage,
    deleteChat,
    deleteAllChats,
    createGroupChat,
    blockUser,
    unblockUser
  };
}
