import CryptoJS from 'crypto-js';

/**
 * Ministry E/D (Encoding/Decoding)
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

export const encrypt = (text: string): string => {
  if (!text) return "";
  
  try {
    const dailySeed = getDailyKeySeed();
    const dynamicKey = generateRollingKey(dailySeed);
    
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

export const decrypt = (cipherText: string): string => {
  if (!cipherText) return "";
  
  // V2: Rolling Key AES Decryption
  if (cipherText.startsWith(PREFIX)) {
    try {
      const payload = cipherText.substring(PREFIX.length);
      const delimiterIndex = payload.indexOf('|');
      
      if (delimiterIndex !== -1) {
        const seed = payload.substring(0, delimiterIndex);
        const actualCipherText = payload.substring(delimiterIndex + 1);
        
        // Reconstruct the exact rolling key used at the time of encryption
        const historicalDynamicKey = generateRollingKey(seed);
        
        const bytes = CryptoJS.AES.decrypt(actualCipherText, historicalDynamicKey);
        const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
        if (decryptedText) return decryptedText;
      }
    } catch (e) {
      console.error("V2 Rolling AES Decryption error:", e);
    }
  }

  // V1: Static AES Decryption (Fallback for older messages)
  if (cipherText.startsWith(PREFIX_V1)) {
    try {
      const actualCipherText = cipherText.substring(PREFIX_V1.length);
      const bytes = CryptoJS.AES.decrypt(actualCipherText, BASE_SECRET);
      const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
      if (decryptedText) return decryptedText;
    } catch (e) {
      console.error("V1 AES Decryption error:", e);
    }
  }

  // Legacy fallback: XOR Base64
  if (/[^\x00-\x7F]/.test(cipherText) || cipherText.includes(" ") || (!cipherText.startsWith(PREFIX) && !cipherText.startsWith(PREFIX_V1) && !cipherText.match(/^[A-Za-z0-9+/=]+$/))) {
    return cipherText;
  }

  try {
    const binary = atob(cipherText.trim());
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
    
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(result)) {
      return cipherText;
    }
    
    return result;
  } catch (e) {
    return cipherText;
  }
};
