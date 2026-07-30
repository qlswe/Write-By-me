import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export type AuditActionType = 'user_management' | 'content_management' | 'system';

export interface AuditLogItem {
  id: string;
  adminUid: string;
  adminEmail: string;
  adminName: string;
  action: string;
  actionType: AuditActionType;
  targetId?: string;
  targetName?: string;
  details?: string;
  timestamp: any;
}

export async function logAdminAction(
  user: { uid?: string; email?: string | null; displayName?: string | null } | null,
  action: string,
  actionType: AuditActionType,
  details?: {
    targetId?: string;
    targetName?: string;
    details?: string;
  }
) {
  if (!user || !user.uid) return;
  try {
    await addDoc(collection(db, 'admin_audit_logs'), {
      adminUid: user.uid,
      adminEmail: user.email || 'unknown@admin',
      adminName: user.displayName || user.email?.split('@')[0] || 'Admin',
      action,
      actionType,
      targetId: details?.targetId || '',
      targetName: details?.targetName || '',
      details: details?.details || '',
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}
