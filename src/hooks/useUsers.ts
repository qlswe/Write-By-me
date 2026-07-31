import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, setDoc, deleteDoc, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './useAuth';
import { logAdminAction } from '../utils/auditLogger';

export interface UserData {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  role: 'admin' | 'moderator' | 'user' | 'beta-tester';
  createdAt: string;
  lastLogin: string;
  lastSeen?: string;
  isVerified?: boolean;
  isBot?: boolean;
  isBlocked?: boolean;
  deviceId?: string;
  bio?: string;
  tagColor?: string;
  statusMessage?: string;
  signature?: string;
  xp?: number;
  reputation?: number;
}

export const JUKY_BOT_USER: UserData = {
  uid: 'bot_juky',
  displayName: 'Juky AI (Жуки 🤖)',
  email: 'juky.bot@ahastation.internal',
  photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=JukyBotAha',
  role: 'admin',
  createdAt: '2026-01-01T00:00:00.000Z',
  lastLogin: new Date().toISOString(),
  isVerified: true,
  isBot: true
};

export function useUsers() {
  const [users, setUsers] = useState<UserData[]>([JUKY_BOT_USER]);
  const [blockedEmails, setBlockedEmails] = useState<string[]>([]);
  const [blockedDeviceIds, setBlockedDeviceIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const deletedUidsRef = useRef<Set<string>>(new Set());
  const { isAdmin, role: currentRole, user } = useAuth();

  useEffect(() => {
    if (!user) {
      setUsers([JUKY_BOT_USER]);
      setLoading(false);
      return;
    }

    // Admins can see full user data (including email)
    // Regular users see public profiles
    const collectionName = isAdmin ? 'users' : 'public_profiles';
    const q = query(collection(db, collectionName), limit(200));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs
        .filter(doc => !deletedUidsRef.current.has(doc.id))
        .map(doc => ({
          ...doc.data(),
          uid: doc.id
        } as UserData));
      
      // Always include Juky Bot if missing
      if (!usersData.some(u => u.uid === JUKY_BOT_USER.uid)) {
        usersData.unshift(JUKY_BOT_USER);
      }
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error(`Error fetching ${collectionName}:`, error);
      setUsers([JUKY_BOT_USER]);
      setLoading(false);
    });

    const blockedUnsub = onSnapshot(doc(db, 'settings', 'blocked_emails'), (docSnap) => {
      if (docSnap.exists()) {
        setBlockedEmails(docSnap.data().emails || []);
      }
    });

    const blockedDevicesUnsub = onSnapshot(doc(db, 'settings', 'blocked_devices'), (docSnap) => {
      if (docSnap.exists()) {
        setBlockedDeviceIds(docSnap.data().deviceIds || []);
      }
    });

    return () => {
      unsubscribe();
      blockedUnsub();
      blockedDevicesUnsub();
    };
  }, [isAdmin, user]);

  const updateUserRole = async (uid: string, role: 'admin' | 'moderator' | 'user' | 'beta-tester') => {
    if (!isAdmin) return;
    const targetUser = users.find(u => u.uid === uid);
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { role });
      
      const publicRef = doc(db, 'public_profiles', uid);
      await setDoc(publicRef, { role }, { merge: true });

      logAdminAction(user, 'CHANGE_ROLE', 'user_management', {
        targetId: uid,
        targetName: targetUser?.displayName || targetUser?.email || uid,
        details: `Роль изменена с ${targetUser?.role || 'user'} на ${role}`
      });
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const updateUserVerification = async (uid: string, isVerified: boolean) => {
    const isModeratorOrAdmin = isAdmin || currentRole === 'moderator';
    if (!isModeratorOrAdmin) return;
    const targetUser = users.find(u => u.uid === uid);
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, { isVerified }, { merge: true });
      
      const publicRef = doc(db, 'public_profiles', uid);
      await setDoc(publicRef, { isVerified }, { merge: true });

      logAdminAction(user, isVerified ? 'VERIFY_USER' : 'UNVERIFY_USER', 'user_management', {
        targetId: uid,
        targetName: targetUser?.displayName || targetUser?.email || uid,
        details: isVerified ? 'Пользователь верифицирован' : 'Снята верификация'
      });
    } catch (error) {
      console.error('Error updating user verification:', error);
    }
  };

  const deleteUser = async (uid: string) => {
    if (!isAdmin) return;
    const targetUser = users.find(u => u.uid === uid);
    deletedUidsRef.current.add(uid);
    // Optimistically update local state so the user disappears immediately from UI
    setUsers(prev => prev.filter(u => u.uid !== uid));

    if (uid === 'bot_juky') return;

    try {
      await deleteDoc(doc(db, 'users', uid)).catch(e => console.warn('Failed to delete users doc:', e));
      await deleteDoc(doc(db, 'public_profiles', uid)).catch(e => console.warn('Failed to delete public_profiles doc:', e));

      logAdminAction(user, 'DELETE_USER', 'user_management', {
        targetId: uid,
        targetName: targetUser?.displayName || targetUser?.email || uid,
        details: `Пользователь удален из системы`
      });
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const toggleBlockUser = async (uid: string, currentStatus?: boolean) => {
    if (!isAdmin) return;
    const isBlocked = !currentStatus;
    const targetUser = users.find(u => u.uid === uid);
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, isBlocked } : u));

    if (uid === 'bot_juky') return;

    try {
      await setDoc(doc(db, 'users', uid), { isBlocked }, { merge: true });
      await setDoc(doc(db, 'public_profiles', uid), { isBlocked }, { merge: true });

      logAdminAction(user, isBlocked ? 'BAN_USER' : 'UNBAN_USER', 'user_management', {
        targetId: uid,
        targetName: targetUser?.displayName || targetUser?.email || uid,
        details: isBlocked ? 'Пользователь заблокирован' : 'Пользователь разблокирован'
      });
    } catch (error) {
      console.error('Error toggling block user:', error);
    }
  };

  const deleteAvatar = async (uid: string) => {
    if (!isAdmin) return;
    const targetUser = users.find(u => u.uid === uid);
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, photoURL: '' } : u));

    if (uid === 'bot_juky') return;

    try {
      await setDoc(doc(db, 'users', uid), { photoURL: '' }, { merge: true });
      await setDoc(doc(db, 'public_profiles', uid), { photoURL: '' }, { merge: true });

      logAdminAction(user, 'DELETE_AVATAR', 'user_management', {
        targetId: uid,
        targetName: targetUser?.displayName || targetUser?.email || uid,
        details: 'Аватар пользователя сброшен администратором'
      });
    } catch (error) {
      console.error('Error deleting user avatar:', error);
    }
  };

  const blockEmail = async (emailToBlock: string) => {
    if (!isAdmin || !emailToBlock.trim()) return;
    try {
      const cleanEmail = emailToBlock.trim().toLowerCase();
      const newBlocked = Array.from(new Set([...blockedEmails, cleanEmail]));
      await setDoc(doc(db, 'settings', 'blocked_emails'), { emails: newBlocked }, { merge: true });

      logAdminAction(user, 'BLOCK_EMAIL', 'user_management', {
        targetName: cleanEmail,
        details: `Email ${cleanEmail} добавлен в черный список`
      });

      // Also mark any existing user with this email as blocked
      const userToBlock = users.find(u => u.email?.toLowerCase() === cleanEmail);
      if (userToBlock) {
        await toggleBlockUser(userToBlock.uid, false);
      }
    } catch (error) {
      console.error('Error blocking email:', error);
    }
  };

  const unblockEmail = async (emailToUnblock: string) => {
    if (!isAdmin) return;
    try {
      const cleanEmail = emailToUnblock.trim().toLowerCase();
      const newBlocked = blockedEmails.filter(e => e.toLowerCase() !== cleanEmail);
      await setDoc(doc(db, 'settings', 'blocked_emails'), { emails: newBlocked }, { merge: true });

      logAdminAction(user, 'UNBLOCK_EMAIL', 'user_management', {
        targetName: cleanEmail,
        details: `Email ${cleanEmail} удален из черного списка`
      });

      const userToUnblock = users.find(u => u.email?.toLowerCase() === cleanEmail);
      if (userToUnblock) {
        await toggleBlockUser(userToUnblock.uid, true);
      }
    } catch (error) {
      console.error('Error unblocking email:', error);
    }
  };

  const blockDeviceId = async (deviceIdToBlock: string) => {
    if (!isAdmin || !deviceIdToBlock.trim()) return;
    try {
      const cleanDeviceId = deviceIdToBlock.trim();
      const newBlocked = Array.from(new Set([...blockedDeviceIds, cleanDeviceId]));
      await setDoc(doc(db, 'settings', 'blocked_devices'), { deviceIds: newBlocked }, { merge: true });

      logAdminAction(user, 'BLOCK_DEVICE', 'user_management', {
        targetName: cleanDeviceId,
        details: `Устройство ${cleanDeviceId} добавлено в черный список`
      });

      // Also block any user linked with this deviceId
      const usersToBlock = users.filter(u => u.deviceId === cleanDeviceId);
      for (const u of usersToBlock) {
        await toggleBlockUser(u.uid, false);
      }
    } catch (error) {
      console.error('Error blocking device ID:', error);
    }
  };

  const unblockDeviceId = async (deviceIdToUnblock: string) => {
    if (!isAdmin) return;
    try {
      const cleanDeviceId = deviceIdToUnblock.trim();
      const newBlocked = blockedDeviceIds.filter(id => id !== cleanDeviceId);
      await setDoc(doc(db, 'settings', 'blocked_devices'), { deviceIds: newBlocked }, { merge: true });

      logAdminAction(user, 'UNBLOCK_DEVICE', 'user_management', {
        targetName: cleanDeviceId,
        details: `Устройство ${cleanDeviceId} удалено из черного списка`
      });

      const usersToUnblock = users.filter(u => u.deviceId === cleanDeviceId);
      for (const u of usersToUnblock) {
        // Only unblock if email is not blocked as well
        if (!blockedEmails.includes(u.email?.toLowerCase() || '')) {
          await toggleBlockUser(u.uid, true);
        }
      }
    } catch (error) {
      console.error('Error unblocking device ID:', error);
    }
  };

  return {
    users,
    blockedEmails,
    blockedDeviceIds,
    loading,
    updateUserRole,
    updateUserVerification,
    deleteUser,
    toggleBlockUser,
    deleteAvatar,
    blockEmail,
    unblockEmail,
    blockDeviceId,
    unblockDeviceId
  };
}
