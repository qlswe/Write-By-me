import CryptoJS from 'crypto-js';

const BASE_SECRET = "MINISTRY_SECRET_KEY_AHIHI_V2_SUPER_SECURE_AES_256";
const trimmed = "AES_V2_ROLLING:2026-07-14|U2FsdGVkX18zHCHYd1U48XvS5+Z6rI5R1e/R73f7m5Y=";

try {
  const bytes = CryptoJS.AES.decrypt(trimmed, BASE_SECRET);
  const text = bytes.toString(CryptoJS.enc.Utf8);
  console.log(`Decrypted raw with prefix: "${text}"`);
} catch (e: any) {
  console.log(`Error: ${e.message}`);
}
