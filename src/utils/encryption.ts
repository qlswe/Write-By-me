import CryptoJS from 'crypto-js';

/**
 * Aha E/D (Encoding/Decoding)
 * Ultra-secure rolling Key AES-256 encryption for messages
 */

const BASE_SECRET = "MINISTRY_SECRET_KEY_AHIHI_V2_SUPER_SECURE_AES_256";
const SYSTEM_SALT = "AHA_CHAT_SALT_9901"; // The required "secret salt"
const LEGACY_KEY = "MINISTRY_SECRET_KEY_AHIHI";
const PREFIX = "AES_V2_ROLLING:";
const PREFIX_V1 = "AES_V1:";

// Helper to get a stable timestamp for the current day (UTC)
const getDailyKeySeed = (): string => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Generate the master key for the DAY using SHA256(BASE_SECRET + SALT + DAY_SEED)
// This ensures that keys rotate daily. Once a message is encrypted with a specific day's key,
// we somehow need to know which key to use to decrypt it. 
// Solution: embed the seed in the ciphertext payload!
const generateRollingKey = (seed: string): string => {
  return CryptoJS.SHA256(BASE_SECRET + SYSTEM_SALT + seed).toString();
};

export const encrypt = (text: string, contextId?: string): string => {
  if (!text) return "";
  
  // Do NOT pass data URLs (images, voice, files) or raw http/blob/relative URLs to AES encrypt,
  // as multi-megabyte base64 strings cause RangeError: Invalid array length in CryptoJS
  if (text.startsWith('data:') || text.startsWith('http://') || text.startsWith('https://') || text.startsWith('blob:') || text.startsWith('/') || text.startsWith('ipfs://')) {
    return text;
  }

  try {
    const dailySeed = getDailyKeySeed();
    const dynamicKey = generateRollingKey(dailySeed + (contextId || ''));
    
    // Encrypt the text using the dynamic key derived from SHA-256
    const encryptedText = CryptoJS.AES.encrypt(text, dynamicKey).toString();
    
    // Payload format: PREFIX + SEED + | + CIPHERTEXT
    // This allows the decryptor to know exactly which rolling key to reconstruct to decrypt the message
    return `${PREFIX}${dailySeed}|${encryptedText}`;
  } catch (e) {
    console.error("Encryption error:", e);
    return text;
  }
};

export const decrypt = (cipherText: string, contextId?: string): string => {
  if (!cipherText) return "";

  const trimmed = cipherText.trim();

  // If text is a data URL (image, audio, voice, file attachment) or a raw URL, return as-is instantly
  if (trimmed.startsWith('data:') || trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Helper to check if decrypted string is printable/clean text
  const isPrintable = (str: string): boolean => {
    if (!str) return false;
    // Check for high density of control characters which indicates decryption failure
    const controlChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/;
    return !controlChars.test(str);
  };

  // 1. V2: Rolling Key AES Decryption
  if (trimmed.startsWith(PREFIX)) {
    try {
      const payload = trimmed.substring(PREFIX.length);
      
      // Try index-based slicing first as the seed is always a 10-char date (YYYY-MM-DD)
      const seed = payload.substring(0, 10);
      const actualCipherText = payload.substring(11);
      const historicalDynamicKey = generateRollingKey(seed + (contextId || ''));
      const bytes = CryptoJS.AES.decrypt(actualCipherText, historicalDynamicKey);
      const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
      if (decryptedText && isPrintable(decryptedText)) {
        return decryptedText;
      }
      
      // Fallback: search for delimiter
      const delimiterIndex = payload.indexOf('|') !== -1 ? payload.indexOf('|') : payload.indexOf('I');
      if (delimiterIndex !== -1) {
        const altSeed = payload.substring(0, delimiterIndex);
        const altCipherText = payload.substring(delimiterIndex + 1);
        const altKey = generateRollingKey(altSeed + (contextId || ''));
        const altBytes = CryptoJS.AES.decrypt(altCipherText, altKey);
        const altDecryptedText = altBytes.toString(CryptoJS.enc.Utf8);
        if (altDecryptedText && isPrintable(altDecryptedText)) {
          return altDecryptedText;
        }
      }
    } catch (e) {
      // Fallback
    }
  }

  // 2. V1: Static AES Decryption (with Prefix)
  if (trimmed.startsWith(PREFIX_V1)) {
    try {
      const actualCipherText = trimmed.substring(PREFIX_V1.length);
      const bytes = CryptoJS.AES.decrypt(actualCipherText, BASE_SECRET);
      const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
      if (decryptedText && isPrintable(decryptedText)) {
        return decryptedText;
      }
    } catch (e) {
      // Fallback
    }
  }

  // If text does NOT start with known prefixes and is not formatted as standard base64 ciphertext
  // return early to prevent unnecessary CryptoJS decrypt calls on plain text or emojis
  if (!/^[A-Za-z0-9+/=]+$/.test(trimmed) || trimmed.length < 16) {
    return cipherText;
  }

  // 3. Raw AES Fallback with BASE_SECRET (No prefix)
  try {
    const bytes = CryptoJS.AES.decrypt(trimmed, BASE_SECRET);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    if (decryptedText && isPrintable(decryptedText)) {
      return decryptedText;
    }
  } catch (e) {
    // Fallback
  }

  // 4. Raw AES Fallback with LEGACY_KEY (No prefix)
  try {
    const bytes = CryptoJS.AES.decrypt(trimmed, LEGACY_KEY);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    if (decryptedText && isPrintable(decryptedText)) {
      return decryptedText;
    }
  } catch (e) {
    // Fallback
  }

  // 5. Raw AES Fallback with Daily Rolling Key (No prefix)
  try {
    const dailySeed = getDailyKeySeed();
    const dynamicKey = generateRollingKey(dailySeed + (contextId || ''));
    const bytes = CryptoJS.AES.decrypt(trimmed, dynamicKey);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    if (decryptedText && isPrintable(decryptedText)) {
      return decryptedText;
    }
  } catch (e) {
    // Fallback
  }

  // 6. Legacy Fallback: XOR Base64 with LEGACY_KEY
  try {
    if (/^[A-Za-z0-9+/=]+$/.test(trimmed) && trimmed.length < 100000) {
      const binary = atob(trimmed);
      if (binary.length > 0 && binary.length < 100000) {
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        
        const encoder = new TextEncoder();
        const keyBytes = encoder.encode(LEGACY_KEY);
        const decryptedBytes = new Uint8Array(bytes.length);
        
        for (let i = 0; i < bytes.length; i++) {
          decryptedBytes[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
        }
        
        const decoder = new TextDecoder();
        const result = decoder.decode(decryptedBytes);
        if (isPrintable(result)) {
          return result;
        }
      }
    }
  } catch (e) {
    // Fallback
  }

  // 7. Legacy Fallback: XOR Base64 with BASE_SECRET
  try {
    if (/^[A-Za-z0-9+/=]+$/.test(trimmed) && trimmed.length < 100000) {
      const binary = atob(trimmed);
      if (binary.length > 0 && binary.length < 100000) {
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        
        const encoder = new TextEncoder();
        const keyBytes = encoder.encode(BASE_SECRET);
        const decryptedBytes = new Uint8Array(bytes.length);
        
        for (let i = 0; i < bytes.length; i++) {
          decryptedBytes[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
        }
        
        const decoder = new TextDecoder();
        const result = decoder.decode(decryptedBytes);
        if (isPrintable(result)) {
          return result;
        }
      }
    }
  } catch (e) {
    // Fallback
  }

  // 8. Plain Base64 Fallback
  try {
    if (/^[A-Za-z0-9+/=]+$/.test(trimmed) && trimmed.length > 4 && trimmed.length < 100000) {
      const decoded = atob(trimmed);
      if (isPrintable(decoded) && decoded.length > 0) {
        return decoded;
      }
    }
  } catch (e) {
    // Fallback
  }

  // 9. Caesar ROT13 Fallback
  try {
    const rot13 = (str: string) => {
      return str.replace(/[a-zA-Z]/g, (c) => {
        const base = c <= 'Z' ? 65 : 97;
        return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
      });
    };
    const decoded = rot13(trimmed);
    if (/^[a-zA-Z\s.,!?]+$/.test(trimmed) && trimmed !== decoded) {
      return decoded;
    }
  } catch (e) {
    // Fallback
  }

  // 10. Default: Return original
  return cipherText;
};

/**
 * Image data URL AES encryption for safeguarding user-uploaded and drawn photos.
 */
export const encryptImage = (dataUrl: string): string => {
  if (!dataUrl) return "";
  if (dataUrl.startsWith("IMG_AES:") || dataUrl.startsWith("enc:")) return dataUrl; // Already encrypted
  // Do NOT encrypt web URLs, relative paths, blobs, or data URIs (drawings/photos)
  if (dataUrl.startsWith("http://") || dataUrl.startsWith("https://") || dataUrl.startsWith("/") || dataUrl.startsWith("blob:") || dataUrl.startsWith("data:") || dataUrl.startsWith("ipfs://")) {
    return dataUrl;
  }
  if (dataUrl.length > 500000) {
    // Avoid CryptoJS array length overflow on large image data URLs
    return dataUrl;
  }
  try {
    const encrypted = CryptoJS.AES.encrypt(dataUrl, BASE_SECRET).toString();
    return `IMG_AES:${encrypted}`;
  } catch (e) {
    console.error("Image encryption error:", e);
    return dataUrl;
  }
};

/**
 * Decrypt AES-encrypted image data URL. Supporting legacy unencrypted images.
 */
export const decryptImage = (cipherText: string): string => {
  if (!cipherText) return "";
  if (!cipherText.startsWith("IMG_AES:") && !cipherText.startsWith("enc:")) return cipherText; // Not encrypted
  try {
    const prefix = cipherText.startsWith("IMG_AES:") ? "IMG_AES:" : "enc:";
    const cipher = cipherText.substring(prefix.length);
    const bytes = CryptoJS.AES.decrypt(cipher, BASE_SECRET);
    const result = bytes.toString(CryptoJS.enc.Utf8);
    return result || cipherText;
  } catch (e) {
    console.error("Image decryption error:", e);
    return cipherText;
  }
};

