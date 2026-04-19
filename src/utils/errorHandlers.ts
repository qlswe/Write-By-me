import { auth } from '../firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };

  console.error('Firestore Error: ', JSON.stringify(errInfo));

  // Auto-Fallback System: Prevent Denial of Service
  if (errorMessage.includes('resource-exhausted') || errorMessage.includes('Quota exceeded')) {
    console.warn(`[Aha Security] Quota Exceeded on ${path}. Activating Local Fallback Resources.`);
    localStorage.setItem('aha_quota_fallback', Date.now().toString());
    window.dispatchEvent(new Event('aha_quota_fallback_active'));
    // Do NOT throw the error. Allow the component to gracefully fallback to local initial state
    return;
  }

  // Permissions errors shouldn't crash the whole app either, just log them
  if (errorMessage.includes('Missing or insufficient permissions')) {
    console.warn(`[Aha Security] Permission Denied on ${path}.`);
    return;
  }

  throw new Error(JSON.stringify(errInfo));
}
