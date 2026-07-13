import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { db } from '../firebase';
import { collection, doc, query, where, onSnapshot, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/errorHandlers';

export interface AiMessage {
  role: 'user' | 'assistant' | 'system' | 'info';
  content: string;
  createdAt: number;
}

export interface AiChat {
  id: string;
  userId: string;
  title: string;
  systemPrompt: string;
  messages: AiMessage[];
  updatedAt: number;
  createdAt: number;
}

export const useAiChats = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<AiChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // 1. Initial load from local storage cache for instant rendering
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`ai_chats_${user.uid}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setChats(parsed);
          if (parsed.length > 0 && !activeChatId) {
            setActiveChatId(parsed[0].id);
          }
        } catch (e) {
          console.error('Failed to parse cached ai chats', e);
        }
      }
    } else {
      setChats([]);
      setActiveChatId(null);
    }
  }, [user]);

  // 2. Real-time Firestore synchronization
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'ai_chats'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched: AiChat[] = [];
        snapshot.forEach((doc) => {
          fetched.push({ id: doc.id, ...doc.data() } as AiChat);
        });

        // Sort by updatedAt descending
        fetched.sort((a, b) => b.updatedAt - a.updatedAt);

        setChats(fetched);
        
        // Save to cache
        if (fetched.length > 0) {
          localStorage.setItem(`ai_chats_${user.uid}`, JSON.stringify(fetched));
        } else {
          localStorage.removeItem(`ai_chats_${user.uid}`);
        }

        // Set active chat if none is set
        if (fetched.length > 0 && !activeChatId) {
          setActiveChatId(fetched[0].id);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `ai_chats (user: ${user.uid})`);
      }
    );

    return () => unsubscribe();
  }, [user, activeChatId]);

  const createChat = useCallback(async (systemPrompt: string = '', title: string = 'Новый чат') => {
    if (!user) return null;

    const newChatId = Date.now().toString() + Math.random().toString(36).substring(7);
    const newChat: AiChat = {
      id: newChatId,
      userId: user.uid,
      title,
      systemPrompt,
      messages: [],
      updatedAt: Date.now(),
      createdAt: Date.now(),
    };

    // Optimistic UI state update
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);

    try {
      await setDoc(doc(db, 'ai_chats', newChatId), newChat);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `ai_chats/${newChatId}`);
    }

    return newChat;
  }, [user]);

  const deleteChat = useCallback(async (id: string) => {
    if (!user) return;

    // Optimistic UI update
    setChats(prev => {
      const filtered = prev.filter(c => c.id !== id);
      if (activeChatId === id) {
        setActiveChatId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });

    try {
      await deleteDoc(doc(db, 'ai_chats', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `ai_chats/${id}`);
    }
  }, [user, activeChatId]);

  const updateChat = useCallback(async (id: string, updates: Partial<AiChat>) => {
    if (!user) return;

    // Optimistic UI update
    setChats(prev => prev.map(c => 
      c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
    ));

    try {
      await updateDoc(doc(db, 'ai_chats', id), {
        ...updates,
        updatedAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `ai_chats/${id}`);
    }
  }, [user]);

  const addMessage = useCallback(async (chatId: string, message: Omit<AiMessage, 'createdAt'>) => {
    if (!user) return;

    let finalMessages: AiMessage[] = [];
    let finalTitle = '';
    let found = false;

    setChats(prev => {
      const targetChat = prev.find(c => c.id === chatId);
      if (!targetChat) return prev;
      found = true;

      const newMessages = [...targetChat.messages, { ...message, createdAt: Date.now() }];
      let newTitle = targetChat.title;
      if (newMessages.filter(m => m.role === 'user').length === 1 && message.role === 'user') {
        newTitle = message.content.slice(0, 20).trim() + (message.content.length > 20 ? '...' : '');
      }

      finalMessages = newMessages;
      finalTitle = newTitle;

      return prev.map(c => {
        if (c.id === chatId) {
          return { ...c, messages: newMessages, title: newTitle, updatedAt: Date.now() };
        }
        return c;
      });
    });

    if (!found) return;

    try {
      await updateDoc(doc(db, 'ai_chats', chatId), {
        messages: finalMessages,
        title: finalTitle,
        updatedAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `ai_chats/${chatId}`);
    }
  }, [user]);

  return {
    chats,
    activeChatId,
    setActiveChatId,
    activeChat: chats.find(c => c.id === activeChatId) || null,
    createChat,
    deleteChat,
    updateChat,
    addMessage,
  };
};
