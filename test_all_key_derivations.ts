import CryptoJS from 'crypto-js';

const msg1_cipher = "U2FsdGVkX1/p1H50+sYRV0geRJDqGN91Np6fYt0EdVfd6kVjnvnVr3ZFn33hS1ZgdYunYp5LB+kRDkPVKvRD2w==";
const msg2_cipher = "U2FsdGVkX1/qMR62vSNItHdEl2DtrsCNUnN6OVNdFjUM=";

const BASE_SECRET = "MINISTRY_SECRET_KEY_AHIHI_V2_SUPER_SECURE_AES_256";
const SYSTEM_SALT = "AHA_CHAT_SALT_9901";
const LEGACY_KEY = "MINISTRY_SECRET_KEY_AHIHI";

const seed = "2026-04-20";

// All possible chatIds in the database
const chatIds = [
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

// Helper to check if decrypted string is printable/clean text
const isPrintable = (str: string): boolean => {
  if (!str) return false;
  const controlChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/;
  return !controlChars.test(str);
};

function tryDecrypt(cipher: string, key: string): string | null {
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, key);
    const text = bytes.toString(CryptoJS.enc.Utf8);
    if (text && isPrintable(text) && text.trim().length > 0) {
      return text;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

const derivations: { name: string; makeKey: (cid: string) => string }[] = [
  {
    name: "BASE_SECRET + SYSTEM_SALT + seed + chatId",
    makeKey: (cid) => CryptoJS.SHA256(BASE_SECRET + SYSTEM_SALT + seed + cid).toString()
  },
  {
    name: "BASE_SECRET + seed + chatId",
    makeKey: (cid) => CryptoJS.SHA256(BASE_SECRET + seed + cid).toString()
  },
  {
    name: "LEGACY_KEY + SYSTEM_SALT + seed + chatId",
    makeKey: (cid) => CryptoJS.SHA256(LEGACY_KEY + SYSTEM_SALT + seed + cid).toString()
  },
  {
    name: "LEGACY_KEY + seed + chatId",
    makeKey: (cid) => CryptoJS.SHA256(LEGACY_KEY + seed + cid).toString()
  },
  {
    name: "BASE_SECRET + SYSTEM_SALT + seed",
    makeKey: () => CryptoJS.SHA256(BASE_SECRET + SYSTEM_SALT + seed).toString()
  },
  {
    name: "BASE_SECRET + seed",
    makeKey: () => CryptoJS.SHA256(BASE_SECRET + seed).toString()
  },
  {
    name: "LEGACY_KEY + SYSTEM_SALT + seed",
    makeKey: () => CryptoJS.SHA256(LEGACY_KEY + SYSTEM_SALT + seed).toString()
  },
  {
    name: "LEGACY_KEY + seed",
    makeKey: () => CryptoJS.SHA256(LEGACY_KEY + seed).toString()
  },
  {
    name: "seed + chatId",
    makeKey: (cid) => CryptoJS.SHA256(seed + cid).toString()
  },
  {
    name: "seed only",
    makeKey: () => CryptoJS.SHA256(seed).toString()
  }
];

for (const derivation of derivations) {
  // If it doesn't depend on chatId, only run once
  if (derivation.name.includes("chatId")) {
    for (const cid of chatIds) {
      const key = derivation.makeKey(cid);
      const dec1 = tryDecrypt(msg1_cipher, key);
      const dec2 = tryDecrypt(msg2_cipher, key);
      if (dec1) {
        console.log(`[SUCCEEDED] ${derivation.name} on chatId ${cid} for Msg1: "${dec1}"`);
      }
      if (dec2) {
        console.log(`[SUCCEEDED] ${derivation.name} on chatId ${cid} for Msg2: "${dec2}"`);
      }
    }
  } else {
    const key = derivation.makeKey("");
    const dec1 = tryDecrypt(msg1_cipher, key);
    const dec2 = tryDecrypt(msg2_cipher, key);
    if (dec1) {
      console.log(`[SUCCEEDED] ${derivation.name} for Msg1: "${dec1}"`);
    }
    if (dec2) {
      console.log(`[SUCCEEDED] ${derivation.name} for Msg2: "${dec2}"`);
    }
  }
}
