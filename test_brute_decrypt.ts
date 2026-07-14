import { decrypt } from './src/utils/encryption';

const msg1_raw = "AES_V2_ROLLING:2026-04-20IU2FsdGVkX1/p1H50+sYRV0geRJDqGN91Np6fYt0EdVfd6kVjnvnVr3ZFn33hS1ZgdYunYp5LB+kRDkPVKvRD2w==";
const msg2_raw = "AES_V2_ROLLING:2026-04-20IU2FsdGVkX1/qMR62vSNItHdEl2DtrsCNUnN6OVNdFjUM=";

// Replace index 25 (the I right after the date) with a pipe |
const msg1_fixed = "AES_V2_ROLLING:2026-04-20|U2FsdGVkX1/p1H50+sYRV0geRJDqGN91Np6fYt0EdVfd6kVjnvnVr3ZFn33hS1ZgdYunYp5LB+kRDkPVKvRD2w==";
const msg2_fixed = "AES_V2_ROLLING:2026-04-20|U2FsdGVkX1/qMR62vSNItHdEl2DtrsCNUnN6OVNdFjUM=";

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

console.log("=== TRYING RAW MESSAGES ===");
for (const cid of chatIds) {
  const dec1 = decrypt(msg1_raw, cid);
  const dec2 = decrypt(msg2_raw, cid);
  if (dec1 !== msg1_raw) {
    console.log(`Success msg1 with chatId: ${cid} -> ${dec1}`);
  }
  if (dec2 !== msg2_raw) {
    console.log(`Success msg2 with chatId: ${cid} -> ${dec2}`);
  }
}

console.log("=== TRYING FIXED MESSAGES (WITH PIPE) ===");
for (const cid of chatIds) {
  const dec1 = decrypt(msg1_fixed, cid);
  const dec2 = decrypt(msg2_fixed, cid);
  if (dec1 !== msg1_fixed) {
    console.log(`Success msg1 with chatId: ${cid} -> ${dec1}`);
  }
  if (dec2 !== msg2_fixed) {
    console.log(`Success msg2 with chatId: ${cid} -> ${dec2}`);
  }
}
