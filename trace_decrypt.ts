import CryptoJS from 'crypto-js';

const BASE_SECRET = "MINISTRY_SECRET_KEY_AHIHI_V2_SUPER_SECURE_AES_256";
const SYSTEM_SALT = "AHA_CHAT_SALT_9901";
const LEGACY_KEY = "MINISTRY_SECRET_KEY_AHIHI";
const PREFIX = "AES_V2_ROLLING:";

const generateRollingKey = (seed: string): string => {
  return CryptoJS.SHA256(BASE_SECRET + SYSTEM_SALT + seed).toString();
};

const isPrintable = (str: string): boolean => {
  if (!str) return false;
  const controlChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/;
  return !controlChars.test(str);
};

function traceDecrypt(cipherText: string, contextId?: string): string {
  if (!cipherText) return "";
  const trimmed = cipherText.trim();

  // 1. V2
  if (trimmed.startsWith(PREFIX)) {
    try {
      const payload = trimmed.substring(PREFIX.length);
      const delimiterIndex = payload.indexOf('|');
      if (delimiterIndex !== -1) {
        const seed = payload.substring(0, delimiterIndex);
        const actualCipherText = payload.substring(delimiterIndex + 1);
        const historicalDynamicKey = generateRollingKey(seed + (contextId || ''));
        const bytes = CryptoJS.AES.decrypt(actualCipherText, historicalDynamicKey);
        const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
        console.log(`[V2 with contextId: ${contextId}] decrypted: "${decryptedText}" (isPrintable: ${isPrintable(decryptedText)})`);
        if (decryptedText && isPrintable(decryptedText)) {
          return decryptedText;
        }
      }
    } catch (e: any) {
      console.log(`[V2] error: ${e.message}`);
    }
  }
  return cipherText;
}

const raw_eky = "AES_V2_ROLLING:2026-07-13|U2FsdGVkX19gpDzL91uJ2saiffWFRoAkFtXdRKRl3mM=";
const chatId = "ZDl2ElMREqTk3PMS80exNuGgDcH2_riwEcrLjeof6wg6PDIA9KZbdUGh2";

traceDecrypt(raw_eky, chatId);
traceDecrypt(raw_eky);
