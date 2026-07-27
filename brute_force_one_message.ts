import CryptoJS from 'crypto-js';

const msg_eky = "U2FsdGVkX19gpDzL91uJ2saiffWFRoAkFtXdRKRl3mM="; // from eky6YUcAmoBpNrSkuXXu, 2026-07-13
const msg_zCJ = "U2FsdGVkX18zHCHYd1U48XvS5+Z6rI5R1e/R73f7m5Y="; // from zCJp5OjxhSrxgR985Tpu, 2026-07-14

const BASE_SECRET = "MINISTRY_SECRET_KEY_AHIHI_V2_SUPER_SECURE_AES_256";
const SYSTEM_SALT = "AHA_CHAT_SALT_9901";
const LEGACY_KEY = "MINISTRY_SECRET_KEY_AHIHI";

const chatId = "ZDl2ElMREqTk3PMS80exNuGgDcH2_riwEcrLjeof6wg6PDIA9KZbdUGh2";

function test(cipher: string, seed: string) {
  // Try direct hashing of BASE_SECRET + SYSTEM_SALT + seed + contextId
  const key = CryptoJS.SHA256(BASE_SECRET + SYSTEM_SALT + seed + chatId).toString();
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, key);
    const text = bytes.toString(CryptoJS.enc.Utf8);
    console.log(`With correctly generated key -> "${text}"`);
  } catch (e: any) {
    console.log(`Error: ${e.message}`);
  }
}

console.log("=== eky (2026-07-13) ===");
test(msg_eky, "2026-07-13");

console.log("\n=== zCJ (2026-07-14) ===");
test(msg_zCJ, "2026-07-14");
