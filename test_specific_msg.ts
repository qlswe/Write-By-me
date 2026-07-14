import { decrypt } from './src/utils/encryption';
import CryptoJS from 'crypto-js';

const msg = "AES_V2_ROLLING:2026-07-12|U2FsdGVkX1+JtB5I44KIWVpaThQYFkXar7E2Yu5FR0kYJOt1KO/1UtFfb20TNMMD";
const chatId = "riwEcrLjeof6wg6PDIA9KZbdUGh2_vcxpskwzHZgVYjWdtfHm27F5Way2";

console.log("Standard decrypt:", decrypt(msg, chatId));
console.log("Decrypt without chatId:", decrypt(msg));

// Let's manually decrypt using various key structures
const BASE_SECRET = "MINISTRY_SECRET_KEY_AHIHI_V2_SUPER_SECURE_AES_256";
const SYSTEM_SALT = "AHA_CHAT_SALT_9901";
const seed = "2026-07-12";
const ciphertext = "U2FsdGVkX1+JtB5I44KIWVpaThQYFkXar7E2Yu5FR0kYJOt1KO/1UtFfb20TNMMD";

const keysToTry = [
  { name: "BASE_SECRET + SYSTEM_SALT + seed + chatId", key: CryptoJS.SHA256(BASE_SECRET + SYSTEM_SALT + seed + chatId).toString() },
  { name: "BASE_SECRET + SYSTEM_SALT + seed (no chatId)", key: CryptoJS.SHA256(BASE_SECRET + SYSTEM_SALT + seed).toString() },
  { name: "BASE_SECRET + seed + chatId", key: CryptoJS.SHA256(BASE_SECRET + seed + chatId).toString() },
  { name: "SYSTEM_SALT + seed + chatId", key: CryptoJS.SHA256(SYSTEM_SALT + seed + chatId).toString() },
  { name: "BASE_SECRET + SYSTEM_SALT + chatId + seed", key: CryptoJS.SHA256(BASE_SECRET + SYSTEM_SALT + chatId + seed).toString() },
];

for (const k of keysToTry) {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, k.key);
    const text = bytes.toString(CryptoJS.enc.Utf8);
    console.log(`With key [${k.name}]: "${text}"`);
  } catch (e) {
    console.log(`Failed key [${k.name}]`);
  }
}
