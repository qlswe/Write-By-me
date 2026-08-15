import { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './useAuth';
import { 
  NotificationItem, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotificationDoc, 
  clearAllUserNotifications 
} from '../utils/notificationService';
import { handleFirestoreError, OperationType } from '../utils/errorHandlers';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const isFirstLoad = useRef(true);
  const knownNotificationIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      isFirstLoad.current = true;
      knownNotificationIds.current.clear();
      return;
    }

    setLoading(true);
    const path = 'user_notifications';
    
    // Listen to user's notifications without composite index requirement
    const q = query(
      collection(db, path),
      where('userId', '==', user.uid),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: NotificationItem[] = [];
        let unread = 0;
        let hasNewArrival = false;

        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const item: NotificationItem = {
            id: docSnap.id,
            userId: data.userId,
            actorId: data.actorId,
            actorName: data.actorName || 'User',
            actorPhoto: data.actorPhoto,
            type: data.type || 'system',
            title: data.title || 'Уведомление',
            message: data.message || '',
            postId: data.postId,
            postTitle: data.postTitle,
            commentId: data.commentId,
            reactionEmoji: data.reactionEmoji,
            createdAt: data.createdAt,
            isRead: !!data.isRead,
            targetSection: data.targetSection,
          };
          items.push(item);

          if (!item.isRead) {
            unread++;
          }

          // Check if this is a newly arrived unread notification
          if (!isFirstLoad.current && !knownNotificationIds.current.has(item.id) && !item.isRead) {
            hasNewArrival = true;
            // Trigger in-app banner / toast
            window.dispatchEvent(
              new CustomEvent('aha_toast', {
                detail: `${item.title}: ${item.message}`,
              })
            );
          }
        });

        // Sort by creation time descending in memory to avoid requiring a Firestore composite index
        items.sort((a, b) => {
          const getMillis = (val: any) => {
            if (!val) return 0;
            if (typeof val.toMillis === 'function') return val.toMillis();
            if (typeof val.seconds === 'number') return val.seconds * 1000;
            if (val instanceof Date) return val.getTime();
            if (typeof val === 'number') return val;
            const parsed = new Date(val).getTime();
            return isNaN(parsed) ? 0 : parsed;
          };
          return getMillis(b.createdAt) - getMillis(a.createdAt);
        });

        // Update known IDs
        items.forEach((item) => knownNotificationIds.current.add(item.id));

        // Play subtle notification audio chime if new arrival occurred
        if (hasNewArrival && !isFirstLoad.current) {
          try {
            const audio = new Audio('/notification.mp3');
            audio.play().catch(() => {});
          } catch {}
        }

        isFirstLoad.current = false;
        setNotifications(items);
        setUnreadCount(unread);
        setLoading(false);
      },
      (error) => {
        console.error('Notifications snapshot error:', error);
        setLoading(false);
        try {
          handleFirestoreError(error, OperationType.GET, path);
        } catch {}
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user]);

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await markNotificationAsRead(id);
  };

  const markAllAsRead = async () => {
    if (!user) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await markAllNotificationsAsRead(user.uid);
  };

  const deleteNotification = async (id: string) => {
    const target = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (target && !target.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    await deleteNotificationDoc(id);
  };

  const clearAll = async () => {
    if (!user) return;
    setNotifications([]);
    setUnreadCount(0);
    await clearAllUserNotifications(user.uid);
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  };
}
