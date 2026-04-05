import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc, getDoc, where, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './useAuth';
import { encrypt, decrypt } from '../utils/encryption';

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
  type?: 'text' | 'sticker';
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
          text: decrypt(data.text)
        } as Message;
      });
      setMessages(messagesData);
    });

    return unsubscribe;
  }, [user, otherUserId]);

  const sendMessage = async (text: string, recipientId: string, type: 'text' | 'sticker' = 'text', replyTo?: string) => {
    if (!user || (!text.trim() && type === 'text')) return;

    const chatId = [user.uid, recipientId].sort().join('_');
    const chatRef = doc(db, 'chats', chatId);
    const messagesRef = collection(db, 'chats', chatId, 'messages');

    const encryptedText = encrypt(text.trim());

    try {
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

      await addDoc(messagesRef, messageData);

      // Update chat metadata
      await setDoc(chatRef, {
        lastMessage: type === 'sticker' ? encrypt('Sticker') : encryptedText,
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
        
        if (usersForEmoji.includes(user.uid)) {
          reactions[emoji] = usersForEmoji.filter((id: string) => id !== user.uid);
          if (reactions[emoji].length === 0) delete reactions[emoji];
        } else {
          reactions[emoji] = [...usersForEmoji, user.uid];
        }
        
        await setDoc(messageRef, { reactions }, { merge: true });
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
      await setDoc(chatRef, { [`lastReadAt.${user.uid}`]: serverTimestamp() }, { merge: true });
    } catch (error) {
      console.error('Error marking chat as read:', error);
    }
  };

  return { chats, messages, loading, sendMessage, toggleReaction, deleteMessage, editMessage, setTyping, markChatAsRead };
}
