import CryptoJS from 'crypto-js';

const msg2_cipher = "U2FsdGVkX1/qMR62vSNItHdEl2DtrsCNUnN6OVNdFjUM=";

const BASE_SECRET = "MINISTRY_SECRET_KEY_AHIHI_V2_SUPER_SECURE_AES_256";
const SYSTEM_SALT = "AHA_CHAT_SALT_9901";
const LEGACY_KEY = "MINISTRY_SECRET_KEY_AHIHI";

const seed = "2026-04-20";

const chatIds = [
  "",
  "riwEcrLjeof6wg6PDIA9KZbdUGh2_vcxpskwzHZgVYjWdtfHm27F5Way2"
];

const derivations = [
  { name: "BASE_SECRET + SYSTEM_SALT + seed", key: CryptoJS.SHA256(BASE_SECRET + SYSTEM_SALT + seed).toString() },
  { name: "BASE_SECRET + seed", key: CryptoJS.SHA256(BASE_SECRET + seed).toString() },
  { name: "LEGACY_KEY + SYSTEM_SALT + seed", key: CryptoJS.SHA256(LEGACY_KEY + SYSTEM_SALT + seed).toString() },
  { name: "LEGACY_KEY + seed", key: CryptoJS.SHA256(LEGACY_KEY + seed).toString() },
  { name: "BASE_SECRET only", key: BASE_SECRET },
  { name: "LEGACY_KEY only", key: LEGACY_KEY },
];

for (const dev of derivations) {
  try {
    const bytes = CryptoJS.AES.decrypt(msg2_cipher, dev.key);
    const text = bytes.toString(CryptoJS.enc.Utf8);
    console.log(`[${dev.name}] decrypted text: "${text}"`);
  } catch (e) {
    // ignore
  }
  
  for (const cid of chatIds) {
    if (cid) {
      try {
        const derivedKey = CryptoJS.SHA256(dev.key + cid).toString();
        const bytes = CryptoJS.AES.decrypt(msg2_cipher, derivedKey);
        const text = bytes.toString(CryptoJS.enc.Utf8);
        console.log(`[${dev.name} + chatId] decrypted text: "${text}"`);
      } catch (e) {
        // ignore
      }
    }
  }
}
