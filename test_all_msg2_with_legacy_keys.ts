import CryptoJS from 'crypto-js';

const msg2_cipher = "U2FsdGVkX1/qMR62vSNItHdEl2DtrsCNUnN6OVNdFjUM=";
const LEGACY_KEY = "MINISTRY_SECRET_KEY_AHIHI";

try {
  const bytes = CryptoJS.AES.decrypt(msg2_cipher, LEGACY_KEY);
  const text = bytes.toString(CryptoJS.enc.Utf8);
  console.log(`LEGACY_KEY only decrypted text: "${text}"`);
} catch (e: any) {
  console.log(`Error: ${e.message}`);
}
