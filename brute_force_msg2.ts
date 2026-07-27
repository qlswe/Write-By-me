import CryptoJS from 'crypto-js';

const cipher = "U2FsdGVkX1/qMR62vSNItHdEl2DtrsCNUnN6OVNdFjUM="; // Msg 2

const BASE_SECRET = "MINISTRY_SECRET_KEY_AHIHI_V2_SUPER_SECURE_AES_256";
const SYSTEM_SALT = "AHA_CHAT_SALT_9901";
const LEGACY_KEY = "MINISTRY_SECRET_KEY_AHIHI";
const seed = "2026-04-20";
const chatId = "riwEcrLjeof6wg6PDIA9KZbdUGh2_vcxpskwzHZgVYjWdtfHm27F5Way2";

const candidateKeys: { [key: string]: string } = {};

// Let's list all possible historical ways generateRollingKey could have worked:
const secrets = [BASE_SECRET, LEGACY_KEY];
const salts = [SYSTEM_SALT, ""];
const seeds = [seed, ""];
const contexts = [chatId, ""];

for (const sec of secrets) {
  for (const salt of salts) {
    for (const sd of seeds) {
      for (const ctx of contexts) {
        // Option A: SHA256(sec + salt + sd + ctx)
        candidateKeys[`SHA256(${sec.substring(0, 5)} + ${salt.substring(0, 5)} + ${sd} + ${ctx.substring(0, 5)})`] = 
          CryptoJS.SHA256(sec + salt + sd + ctx).toString();
          
        // Option B: sec + salt + sd + ctx (direct)
        candidateKeys[`direct(${sec.substring(0, 5)} + ${salt.substring(0, 5)} + ${sd} + ${ctx.substring(0, 5)})`] = 
          sec + salt + sd + ctx;
      }
    }
  }
}

for (const [name, key] of Object.entries(candidateKeys)) {
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, key);
    const text = bytes.toString(CryptoJS.enc.Utf8);
    if (text.length > 0) {
      console.log(`[SUCCESS] ${name} -> "${text}"`);
    }
  } catch (e) {}
}
