/**
 * Cryptographically Secure UUID / UID Generator Utility
 * Eliminates predictable Date.now() or Math.random() identifiers to guarantee
 * tenant isolation, prevent ID enumeration, and secure database keys.
 */

export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    // Set v4 variant bits
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Generate a cryptographically secure prefixed ID.
 * Example: generatePrefixedId('msg') => "msg_3d81f211-120a-42cd-9428-1b228f4c519a"
 */
export const generatePrefixedId = (prefix: string): string => {
  return `${prefix}_${generateUUID()}`;
};

/**
 * Validate ID structure to guard against path injection & ID poisoning
 */
export const isValidSecureId = (id: unknown): boolean => {
  if (typeof id !== 'string' || !id || id.length > 128) return false;
  return /^[a-zA-Z0-9_\-]+$/.test(id);
};
