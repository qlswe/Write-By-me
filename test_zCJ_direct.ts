import CryptoJS from 'crypto-js';

const msg_zCJ = "U2FsdGVkX18zHCHYd1U48XvS5+Z6rI5R1e/R73f7m5Y="; // from zCJp5OjxhSrxgR985Tpu, 2026-07-14

const BASE_SECRET = "MINISTRY_SECRET_KEY_AHIHI_V2_SUPER_SECURE_AES_256";
const SYSTEM_SALT = "AHA_CHAT_SALT_9901";

const seed = "2026-07-14";

const key = CryptoJS.SHA256(BASE_SECRET + SYSTEM_SALT + seed).toString();
try {
  const bytes = CryptoJS.AES.decrypt(msg_zCJ, key);
  const text = bytes.toString(CryptoJS.enc.Utf8);
  console.log(`Key without chatId decrypts to: "${text}"`);
} catch (e: any) {
  console.log(`Error: ${e.message}`);
}
