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
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: any;
  unreadCount?: Record<string, number>;
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

  const sendMessage = async (text: string, recipientId: string) => {
    if (!user || !text.trim()) return;

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
      await addDoc(messagesRef, {
        senderId: user.uid,
        text: encryptedText,
        createdAt: serverTimestamp()
      });

      // Update chat metadata
      await setDoc(chatRef, {
        lastMessage: encryptedText,
        lastMessageAt: serverTimestamp(),
        participants: [user.uid, recipientId]
      }, { merge: true });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return { chats, messages, loading, sendMessage };
}
