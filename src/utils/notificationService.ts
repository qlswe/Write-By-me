import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from './errorHandlers';

export interface NotificationItem {
  id: string;
  userId: string; // The recipient of the notification
  actorId: string; // User who did the action
  actorName: string;
  actorPhoto?: string;
  type: 'post_comment' | 'comment_reply' | 'post_reaction' | 'post_share' | 'mention' | 'system';
  title: string;
  message: string;
  postId?: string;
  postTitle?: string;
  commentId?: string;
  reactionEmoji?: string;
  createdAt: any;
  isRead: boolean;
  targetSection?: string;
}

export type CreateNotificationPayload = Omit<NotificationItem, 'id' | 'createdAt' | 'isRead'>;

/**
 * Creates and stores a notification in Firestore.
 */
export async function sendNotification(payload: CreateNotificationPayload): Promise<string | null> {
  // Do not send notifications to oneself
  if (!payload.userId || payload.userId === payload.actorId) {
    return null;
  }

  const path = 'user_notifications';
  try {
    const docData = {
      ...payload,
      isRead: false,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, path), docData);

    // Dispatch local custom event if current client is the recipient (for multi-tab / testing)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aha_notification_sent', { detail: { id: docRef.id, ...docData } }));
    }

    return docRef.id;
  } catch (error) {
    console.error('Error sending notification:', error);
    try {
      handleFirestoreError(error, OperationType.CREATE, path);
    } catch {
      // Non-fatal if offline
    }
    return null;
  }
}

/**
 * Helper to notify the author of a post when someone comments.
 */
export async function notifyPostComment(params: {
  postAuthorId: string;
  postId: string;
  postTitle: string;
  commentAuthor: { uid: string; displayName?: string | null; photoURL?: string | null };
  commentSnippet: string;
}) {
  const { postAuthorId, postId, postTitle, commentAuthor, commentSnippet } = params;
  if (!postAuthorId || postAuthorId === commentAuthor.uid) return;

  const actorName = commentAuthor.displayName || 'Пользователь';
  const cleanSnippet = commentSnippet.length > 50 ? commentSnippet.slice(0, 50) + '...' : commentSnippet;
  const cleanTitle = postTitle ? `"${postTitle.slice(0, 40)}"` : 'вашей публикации';

  await sendNotification({
    userId: postAuthorId,
    actorId: commentAuthor.uid,
    actorName,
    actorPhoto: commentAuthor.photoURL || undefined,
    type: 'post_comment',
    title: '💬 Новый комментарий',
    message: `${actorName} оставил(а) комментарий к ${cleanTitle}: "${cleanSnippet}"`,
    postId,
    postTitle: postTitle || 'Публикация',
    targetSection: 'forum'
  });
}

/**
 * Helper to notify when someone replies to a comment.
 */
export async function notifyCommentReply(params: {
  parentCommentAuthorId: string;
  postId: string;
  postTitle: string;
  commentAuthor: { uid: string; displayName?: string | null; photoURL?: string | null };
  replySnippet: string;
}) {
  const { parentCommentAuthorId, postId, postTitle, commentAuthor, replySnippet } = params;
  if (!parentCommentAuthorId || parentCommentAuthorId === commentAuthor.uid) return;

  const actorName = commentAuthor.displayName || 'Пользователь';
  const cleanSnippet = replySnippet.length > 50 ? replySnippet.slice(0, 50) + '...' : replySnippet;

  await sendNotification({
    userId: parentCommentAuthorId,
    actorId: commentAuthor.uid,
    actorName,
    actorPhoto: commentAuthor.photoURL || undefined,
    type: 'comment_reply',
    title: '↩️ Ответ на ваш комментарий',
    message: `${actorName} ответил(а) на ваш комментарий: "${cleanSnippet}"`,
    postId,
    postTitle: postTitle || 'Публикация',
    targetSection: 'forum'
  });
}

/**
 * Helper to notify when someone reacts to a post.
 */
export async function notifyPostReaction(params: {
  postAuthorId: string;
  postId: string;
  postTitle: string;
  reactionEmoji: string;
  actor: { uid: string; displayName?: string | null; photoURL?: string | null };
}) {
  const { postAuthorId, postId, postTitle, reactionEmoji, actor } = params;
  if (!postAuthorId || postAuthorId === actor.uid) return;

  const actorName = actor.displayName || 'Пользователь';
  const cleanTitle = postTitle ? `"${postTitle.slice(0, 40)}"` : 'вашу публикацию';

  await sendNotification({
    userId: postAuthorId,
    actorId: actor.uid,
    actorName,
    actorPhoto: actor.photoURL || undefined,
    type: 'post_reaction',
    reactionEmoji,
    title: `${reactionEmoji} Новая реакция`,
    message: `${actorName} отреагировал(а) ${reactionEmoji} на ${cleanTitle}`,
    postId,
    postTitle: postTitle || 'Публикация',
    targetSection: 'forum'
  });
}

/**
 * Helper to notify when someone shares / bookmarks a post.
 */
export async function notifyPostShare(params: {
  postAuthorId: string;
  postId: string;
  postTitle: string;
  actor: { uid: string; displayName?: string | null; photoURL?: string | null };
}) {
  const { postAuthorId, postId, postTitle, actor } = params;
  if (!postAuthorId || postAuthorId === actor.uid) return;

  const actorName = actor.displayName || 'Пользователь';
  const cleanTitle = postTitle ? `"${postTitle.slice(0, 40)}"` : 'вашей публикацией';

  await sendNotification({
    userId: postAuthorId,
    actorId: actor.uid,
    actorName,
    actorPhoto: actor.photoURL || undefined,
    type: 'post_share',
    title: '🔄 Репост публикации',
    message: `${actorName} поделился(ась) ${cleanTitle}`,
    postId,
    postTitle: postTitle || 'Публикация',
    targetSection: 'forum'
  });
}

/**
 * Marks a single notification as read.
 */
export async function markNotificationAsRead(notificationId: string) {
  const path = `user_notifications/${notificationId}`;
  try {
    await updateDoc(doc(db, 'user_notifications', notificationId), {
      isRead: true
    });
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.UPDATE, path);
    } catch {}
  }
}

/**
 * Marks all notifications as read for a user.
 */
export async function markAllNotificationsAsRead(userId: string) {
  if (!userId) return;
  const path = 'user_notifications';
  try {
    const q = query(
      collection(db, path),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    let count = 0;
    snapshot.docs.forEach((d) => {
      if (!d.data().isRead) {
        batch.update(d.ref, { isRead: true });
        count++;
      }
    });
    if (count > 0) {
      await batch.commit();
    }
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.UPDATE, path);
    } catch {}
  }
}

/**
 * Deletes a single notification.
 */
export async function deleteNotificationDoc(notificationId: string) {
  const path = `user_notifications/${notificationId}`;
  try {
    await deleteDoc(doc(db, 'user_notifications', notificationId));
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.DELETE, path);
    } catch {}
  }
}

/**
 * Clears all notifications for a user.
 */
export async function clearAllUserNotifications(userId: string) {
  if (!userId) return;
  const path = 'user_notifications';
  try {
    const q = query(
      collection(db, path),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => {
      batch.delete(d.ref);
    });
    await batch.commit();
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.DELETE, path);
    } catch {}
  }
}
