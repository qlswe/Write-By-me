import { decrypt } from './src/utils/encryption';

const msg1 = "AES_V2_ROLLING:2026-07-12|U2FsdGVkX18OLxUXnVFvzi0XIN4Iygvr8UB1ioZ4l3Q=";
const chatId = "riwEcrLjeof6wg6PDIA9KZbdUGh2_vcxpskwzHZgVYjWdtfHm27F5Way2";

console.log("Decrypting message 1:", msg1);
const res1 = decrypt(msg1, chatId);
console.log("Result:", res1);
if (res1 === msg1) {
  console.log("Decryption failed (returned original string)");
} else {
  console.log("Decryption succeeded!");
}
