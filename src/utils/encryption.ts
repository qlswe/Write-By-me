/**
 * Ministry E/D (Encoding/Decoding)
 * Simple XOR-based encryption for messages
 */

const SECRET_KEY = "MINISTRY_SECRET_KEY_AHIHI";

export const encrypt = (text: string): string => {
  if (!text) return "";
  
  try {
    // Convert text to UTF-8 bytes
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);
    
    // XOR with key
    const keyBytes = encoder.encode(SECRET_KEY);
    const encryptedBytes = new Uint8Array(bytes.length);
    
    for (let i = 0; i < bytes.length; i++) {
      encryptedBytes[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    // Convert to Base64 safely using a chunked approach to avoid stack limits
    // and ensuring it's treated as a binary string
    let binary = "";
    const len = encryptedBytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(encryptedBytes[i]);
    }
    return btoa(binary);
  } catch (e) {
    console.error("Encryption error:", e);
    return text;
  }
};

export const decrypt = (base64: string): string => {
  if (!base64) return "";
  
  // If the string contains non-ASCII characters or doesn't look like base64,
  // it's likely a legacy plain text message
  if (/[^\x00-\x7F]/.test(base64) || base64.includes(" ")) {
    return base64;
  }

  try {
    // Decode Base64
    const binary = atob(base64.trim());
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    // XOR with key
    const encoder = new TextEncoder();
    const keyBytes = encoder.encode(SECRET_KEY);
    const decryptedBytes = new Uint8Array(bytes.length);
    
    for (let i = 0; i < bytes.length; i++) {
      decryptedBytes[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    // Convert bytes back to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBytes);
  } catch (e) {
    // If it's not valid base64 or decryption fails, return as is (legacy support)
    return base64;
  }
};
