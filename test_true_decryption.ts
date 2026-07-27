import CryptoJS from 'crypto-js';

const msg1_cipher = "U2FsdGVkX1/p1H50+sYRV0geRJDqGN91Np6fYt0EdVfd6kVjnvnVr3ZFn33hS1ZgdYunYp5LB+kRDkPVKvRD2w==";
const msg2_cipher = "U2FsdGVkX1/qMR62vSNItHdEl2DtrsCNUnN6OVNdFjUM=";

const BASE_SECRET = "MINISTRY_SECRET_KEY_AHIHI_V2_SUPER_SECURE_AES_256";
const SYSTEM_SALT = "AHA_CHAT_SALT_9901";
const LEGACY_KEY = "MINISTRY_SECRET_KEY_AHIHI";

const seed = "2026-04-20";

const chatIds = [
  "",
  "59CzMW6TgONgspE3kYegXcCmFQz1_Jez5EOmu3UPHO8ksToNxRUO2Nr72",
  "Jez5EOmu3UPHO8ksToNxRUO2Nr72_riwEcrLjeof6wg6PDIA9KZbdUGh2",
  "KvsLTBKUzJTlO36v6M9Kh22994H3_aC0b0PDNoCXyTvRk8Igz4CPpzgm2",
  "KvsLTBKUzJTlO36v6M9Kh22994H3_riwEcrLjeof6wg6PDIA9KZbdUGh2",
  "KvsLTBKUzJTlO36v6M9Kh22994H3_vcxpskwzHZgVYjWdtfHm27F5Way2",
  "XzwRMOTuwCbW3wnYdmaTqTFBpb83_vcxpskwzHZgVYjWdtfHm27F5Way2",
  "ZDl2ElMREqTk3PMS80exNuGgDcH2_riwEcrLjeof6wg6PDIA9KZbdUGh2",
  "aC0b0PDNoCXyTvRk8Igz4CPpzgm2_bFZ0bP0eRFXtFEEAvlF67mDmzyY2",
  "bFZ0bP0eRFXtFEEAvlF67mDmzyY2_bFZ0bP0eRFXtFEEAvlF67mDmzyY2",
  "bFZ0bP0eRFXtFEEAvlF67mDmzyY2_riwEcrLjeof6wg6PDIA9KZbdUGh2",
  "bFZ0bP0eRFXtFEEAvlF67mDmzyY2_vcxpskwzHZgVYjWdtfHm27F5Way2",
  "riwEcrLjeof6wg6PDIA9KZbdUGh2_riwEcrLjeof6wg6PDIA9KZbdUGh2",
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

function printDecrypt(cipher: string, key: string, label: string) {
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, key);
    const text = bytes.toString(CryptoJS.enc.Utf8);
    console.log(`[${label}] decrypted: "${text}"`);
  } catch (e) {
    // ignore
  }
}

console.log("=== Msg1 ===");
for (const dev of derivations) {
  printDecrypt(msg1_cipher, dev.key, dev.name);
  for (const cid of chatIds) {
    if (cid) {
      const derivedKey = CryptoJS.SHA256(dev.key + cid).toString();
      printDecrypt(msg1_cipher, derivedKey, `${dev.name} + chatId ${cid}`);
    }
  }
}

console.log("\n=== Msg2 ===");
for (const dev of derivations) {
  printDecrypt(msg2_cipher, dev.key, dev.name);
  for (const cid of chatIds) {
    if (cid) {
      const derivedKey = CryptoJS.SHA256(dev.key + cid).toString();
      printDecrypt(msg2_cipher, derivedKey, `${dev.name} + chatId ${cid}`);
    }
  }
}
