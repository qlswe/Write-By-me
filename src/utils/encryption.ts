import CryptoJS from 'crypto-js';

/**
 * Ministry E/D (Encoding/Decoding)
 * High-security AES-256 encryption for messages
 */

const SECRET_KEY = "MINISTRY_SECRET_KEY_AHIHI_V2_SUPER_SECURE_AES_256";
const LEGACY_KEY = "MINISTRY_SECRET_KEY_AHIHI";
const PREFIX = "AES_V1:";

export const encrypt = (text: string): string => {
  if (!text) return "";
  
  try {
    // Use AES encryption (CryptoJS uses AES-256 by default with a passphrase)
    const encrypted = CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
    return PREFIX + encrypted;
  } catch (e) {
    console.error("Encryption error:", e);
    return text;
  }
};

export const decrypt = (cipherText: string): string => {
  if (!cipherText) return "";
  
  // Check if it's our new highly secure AES encryption
  if (cipherText.startsWith(PREFIX)) {
    try {
      const actualCipherText = cipherText.substring(PREFIX.length);
      const bytes = CryptoJS.AES.decrypt(actualCipherText, SECRET_KEY);
      const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
      if (decryptedText) return decryptedText;
    } catch (e) {
      console.error("AES Decryption error:", e);
    }
  }

  // Legacy fallback: If the string contains non-ASCII characters or doesn't look like base64,
  // it's likely a legacy plain text message
  if (/[^\x00-\x7F]/.test(cipherText) || cipherText.includes(" ")) {
    return cipherText;
  }

  try {
    // Decode Base64
    const binary = atob(cipherText.trim());
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    // XOR with key
    const encoder = new TextEncoder();
    const keyBytes = encoder.encode(LEGACY_KEY);
    const decryptedBytes = new Uint8Array(bytes.length);
    
    for (let i = 0; i < bytes.length; i++) {
      decryptedBytes[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    // Convert bytes back to string
    const decoder = new TextDecoder();
    const result = decoder.decode(decryptedBytes);
    
    // Basic check to see if decryption made sense (no control chars)
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(result)) {
      return cipherText;
    }
    
    return result;
  } catch (e) {
    // If it's not valid base64 or decryption fails, return as is (legacy support)
    return cipherText;
  }
};
