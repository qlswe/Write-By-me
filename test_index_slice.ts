import CryptoJS from 'crypto-js';

const msg1_raw = "AES_V2_ROLLING:2026-04-20IU2FsdGVkX1/p1H50+sYRV0geRJDqGN91Np6fYt0EdVfd6kVjnvnVr3ZFn33hS1ZgdYunYp5LB+kRDkPVKvRD2w==";
const msg2_raw = "AES_V2_ROLLING:2026-04-20IU2FsdGVkX1/qMR62vSNItHdEl2DtrsCNUnN6OVNdFjUM=";

const PREFIX = "AES_V2_ROLLING:";
const BASE_SECRET = "MINISTRY_SECRET_KEY_AHIHI_V2_SUPER_SECURE_AES_256";
const SYSTEM_SALT = "AHA_CHAT_SALT_9901";
const LEGACY_KEY = "MINISTRY_SECRET_KEY_AHIHI";

const senderId = "riwEcrLjeof6wg6PDIA9KZbdUGh2";
const receiverId = "vcxpskwzHZgVYjWdtfHm27F5Way2";
const chatId = "riwEcrLjeof6wg6PDIA9KZbdUGh2_vcxpskwzHZgVYjWdtfHm27F5Way2";
const reversedChatId = "vcxpskwzHZgVYjWdtfHm27F5Way2_riwEcrLjeof6wg6PDIA9KZbdUGh2";

const contexts = [
  "",
  senderId,
  receiverId,
  chatId,
  reversedChatId,
];

const secrets = [
  { name: "BASE_SECRET + SYSTEM_SALT", keyGen: (s: string, c: string) => CryptoJS.SHA256(BASE_SECRET + SYSTEM_SALT + s + c).toString() },
  { name: "BASE_SECRET", keyGen: (s: string, c: string) => CryptoJS.SHA256(BASE_SECRET + s + c).toString() },
  { name: "LEGACY_KEY + SYSTEM_SALT", keyGen: (s: string, c: string) => CryptoJS.SHA256(LEGACY_KEY + SYSTEM_SALT + s + c).toString() },
  { name: "LEGACY_KEY", keyGen: (s: string, c: string) => CryptoJS.SHA256(LEGACY_KEY + s + c).toString() },
];

function testDecrypt(raw: string) {
  const payload = raw.substring(PREFIX.length);
  const seed = payload.substring(0, 10);
  const actualCipherText = payload.substring(11);
  
  for (const sec of secrets) {
    for (const ctx of contexts) {
      const key = sec.keyGen(seed, ctx);
      try {
        const bytes = CryptoJS.AES.decrypt(actualCipherText, key);
        const text = bytes.toString(CryptoJS.enc.Utf8);
        if (text.trim().length > 0) {
          console.log(`SUCCESS [${sec.name}] with context [${ctx}]: "${text}"`);
        }
      } catch (e) {
        // ignore
      }
    }
  }
}

console.log("=== Msg 1 ===");
testDecrypt(msg1_raw);

console.log("\n=== Msg 2 ===");
testDecrypt(msg2_raw);
