/**
 * Ministry E/D (Encoding/Decoded)
 * A custom encryption utility for the project.
 */

const SECRET_KEY = 'MINISTRY_SECRET_KEY_2024';

/**
 * Encodes text using byte-level XOR and Base64.
 * Handles UTF-8 characters correctly.
 */
export const ministryEncode = (text: string): string => {
  if (!text) return '';
  
  try {
    const encoder = new TextEncoder();
    const textBytes = encoder.encode(text);
    const keyBytes = encoder.encode(SECRET_KEY);
    
    const encodedBytes = new Uint8Array(textBytes.length);
    for (let i = 0; i < textBytes.length; i++) {
      encodedBytes[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    // Convert bytes to a binary string that btoa can handle
    let binary = '';
    const len = encodedBytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(encodedBytes[i]);
    }
    
    return btoa(binary);
  } catch (e) {
    console.error("Ministry E/D: Encoding failed", e);
    return text;
  }
};

/**
 * Decodes text using Base64 and byte-level XOR.
 * Gracefully handles non-encoded strings (e.g., legacy data).
 */
export const ministryDecode = (encodedText: string): string => {
  if (!encodedText) return '';
  
  // If the string contains non-ASCII characters, it's definitely not our Base64 output.
  // This prevents atob() from throwing "The string to be decoded contains characters outside of the Latin1 range."
  if (/[^\x00-\x7F]/.test(encodedText)) {
    return encodedText;
  }

  try {
    const binary = atob(encodedText);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    const encoder = new TextEncoder();
    const keyBytes = encoder.encode(SECRET_KEY);
    
    const decodedBytes = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      decodedBytes[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    const decoder = new TextDecoder();
    return decoder.decode(decodedBytes);
  } catch (e) {
    // If it's not valid Base64 or XOR decoding fails, it's likely plain text
    return encodedText;
  }
};
