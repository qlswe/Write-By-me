import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface AiMessage {
  role: 'user' | 'assistant' | 'system' | 'info';
  content: string;
  createdAt: number;
}

export interface AiChat {
  id: string;
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
          console.error('Failed to parse ai chats', e);
        }
      }
    } else {
      setChats([]);
      setActiveChatId(null);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      if (chats.length > 0) {
        localStorage.setItem(`ai_chats_${user.uid}`, JSON.stringify(chats));
      } else {
        localStorage.removeItem(`ai_chats_${user.uid}`);
      }
    }
  }, [chats, user]);

  const createChat = (systemPrompt: string = '', title: string = 'Новый чат') => {
    if (!user) return null;
    const newChat: AiChat = {
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      title,
      systemPrompt,
      messages: [],
      updatedAt: Date.now(),
      createdAt: Date.now(),
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    return newChat;
  };

  const deleteChat = (id: string) => {
    setChats(prev => {
      const filtered = prev.filter(c => c.id !== id);
      if (activeChatId === id) {
        setActiveChatId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  };

  const updateChat = (id: string, updates: Partial<AiChat>) => {
    setChats(prev => prev.map(c => 
      c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
    ));
  };

  const addMessage = (chatId: string, message: Omit<AiMessage, 'createdAt'>) => {
    setChats(prev => prev.map(c => {
      if (c.id === chatId) {
        const newMessages = [...c.messages, { ...message, createdAt: Date.now() }];
        // Generate title if it's the first user message and title is default
        let newTitle = c.title;
        if (newMessages.filter(m => m.role === 'user').length === 1 && message.role === 'user') {
          newTitle = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '');
        }
        return { ...c, messages: newMessages, title: newTitle, updatedAt: Date.now() };
      }
      return c;
    }));
  };

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
