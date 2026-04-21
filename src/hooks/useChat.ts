import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc, getDoc, where, limit, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './useAuth';
import { encrypt, decrypt } from '../utils/encryption';
import { vercelFallback } from '../utils/vercelFallback';

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
  type?: 'text' | 'sticker' | 'image';
  images?: string[];
  replyTo?: string; // ID of the message being replied to
  reactions?: Record<string, string[]>; // emoji -> array of user IDs
  isEdited?: boolean;
  isDeleted?: boolean;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: any;
  unreadCount?: Record<string, number>;
  typing?: Record<string, boolean>;
  lastReadAt?: Record<string, any>;
}

export function useChat(otherUserId?: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

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
          lastMessage: data.lastMessage ? decrypt(data.lastMessage) : undefined
        } as Chat;
      });
      
      // Sort client-side to avoid composite index requirement
      chatsData.sort((a, b) => {
        const timeA = a.lastMessageAt?.toMillis?.() || (a.lastMessageAt instanceof Date ? a.lastMessageAt.getTime() : 0);
        const timeB = b.lastMessageAt?.toMillis?.() || (b.lastMessageAt instanceof Date ? b.lastMessageAt.getTime() : 0);
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

    const chatId = [user.uid, otherUserId].sort().join('_');
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
          text: decrypt(data.text),
          images: data.images ? data.images.map((img: string) => decrypt(img)) : undefined
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
                 text: decrypt(data.text),
                 images: data.images ? data.images.map((img: string) => decrypt(img)) : undefined
               };
             }).reverse() as Message[];
             
             setMessages(prev => {
               const mapped = new Map([...prev, ...parsed].map(m => [m.id, m]));
               const sorted = Array.from(mapped.values()).sort((a, b) => {
                   const timeA = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : ((a.createdAt as any)?.toMillis?.() || 0);
                   const timeB = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : ((b.createdAt as any)?.toMillis?.() || 0);
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

  const sendMessage = async (text: string, recipientId: string, type: 'text' | 'sticker' | 'image' = 'text', replyTo?: string, images?: string[]) => {
    if (!user || (!text.trim() && type !== 'image' && (!images || images.length === 0))) return;

    const chatId = [user.uid, recipientId].sort().join('_');
    const chatRef = doc(db, 'chats', chatId);
    const messagesRef = collection(db, 'chats', chatId, 'messages');

    const encryptedText = text ? encrypt(text.trim()) : '';

    try {
      if (vercelFallback.isAvailable()) {
         // Fallback explicitly enabled - write to KV instead of crashing Firebase
         const messageData = {
           id: Date.now().toString(),
           senderId: user.uid,
           text: encryptedText,
           createdAt: new Date().toISOString(),
           type,
           replyTo,
           images: images ? images.map(img => encrypt(img)) : undefined
         };
         await vercelFallback.lpush(`chat:${chatId}`, JSON.stringify(messageData));
         return; // Skip firebase
      }

      // Ensure chat document exists
      const chatDoc = await getDoc(chatRef);
      if (!chatDoc.exists()) {
        await setDoc(chatRef, {
          participants: [user.uid, recipientId],
          createdAt: serverTimestamp()
        });
      }

      // Add message
      const messageData: any = {
        senderId: user.uid,
        text: encryptedText,
        createdAt: serverTimestamp(),
        type
      };
      if (replyTo) messageData.replyTo = replyTo;
      if (images && images.length > 0) messageData.images = images.map(img => encrypt(img));

      await addDoc(messagesRef, messageData);

      // Update chat metadata
      await setDoc(chatRef, {
        lastMessage: type === 'sticker' ? encrypt('Sticker') : type === 'image' ? encrypt('Фото') : encryptedText,
        lastMessageAt: serverTimestamp(),
        participants: [user.uid, recipientId]
      }, { merge: true });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const toggleReaction = async (messageId: string, recipientId: string, emoji: string) => {
    if (!user) return;
    const chatId = [user.uid, recipientId].sort().join('_');
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
    const chatId = [user.uid, recipientId].sort().join('_');
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
    try {
      await setDoc(messageRef, { isDeleted: true, text: encrypt('Сообщение удалено') }, { merge: true });
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const editMessage = async (messageId: string, recipientId: string, newText: string) => {
    if (!user || !newText.trim()) return;
    const chatId = [user.uid, recipientId].sort().join('_');
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
    try {
      await setDoc(messageRef, { text: encrypt(newText.trim()), isEdited: true }, { merge: true });
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const setTyping = async (recipientId: string, isTyping: boolean) => {
    if (!user) return;
    const chatId = [user.uid, recipientId].sort().join('_');
    const chatRef = doc(db, 'chats', chatId);
    try {
      await setDoc(chatRef, { [`typing.${user.uid}`]: isTyping }, { merge: true });
    } catch (error) {
      console.error('Error setting typing status:', error);
    }
  };

  const markChatAsRead = async (recipientId: string) => {
    if (!user) return;
    const chatId = [user.uid, recipientId].sort().join('_');
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

  return { chats, messages, loading, sendMessage, toggleReaction, deleteMessage, editMessage, setTyping, markChatAsRead };
}
