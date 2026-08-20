/**
 * AHA TOTP (Time-based One-Time Password) RFC 6238 Engine
 * 
 * Provides standard 2FA TOTP secret generation, QR code generation,
 * time-drift tolerant verification, and backup recovery codes.
 */

import CryptoJS from 'crypto-js';
import QRCode from 'qrcode';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface TotpConfig {
  enabled: boolean;
  secret: string;
  backupCodes: string[];
  createdAt: string;
  lastUsedTimestamp?: number;
}

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// Generate cryptographically secure Base32 secret (16-32 chars)
export function generateTotpSecret(length = 20): string {
  const randomBytes = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(randomBytes);
  } else {
    for (let i = 0; i < length; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }

  let secret = '';
  for (let i = 0; i < length; i++) {
    secret += BASE32_CHARS[randomBytes[i] % 32];
  }
  return secret;
}

// Convert Base32 string to Uint8Array
export function base32ToBytes(base32: string): Uint8Array {
  const clean = base32.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = '';
  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_CHARS.indexOf(clean[i]);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }

  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substr(i * 8, 8), 2);
  }
  return bytes;
}

// Convert Uint8Array to CryptoJS WordArray
function uint8ArrayToWordArray(u8Array: Uint8Array): CryptoJS.lib.WordArray {
  const words: number[] = [];
  const len = u8Array.length;
  for (let i = 0; i < len; i++) {
    words[i >>> 2] |= (u8Array[i] & 0xff) << (24 - (i % 4) * 8);
  }
  return CryptoJS.lib.WordArray.create(words, len);
}

/**
 * Calculates RFC 6238 TOTP 6-digit code for a given timestamp
 */
export function generateTotpCode(
  secret: string,
  timestamp = Date.now(),
  period = 30,
  digits = 6
): string {
  try {
    const timeStep = Math.floor(timestamp / 1000 / period);
    
    // 8-byte big-endian counter
    const counterBytes = new Uint8Array(8);
    let temp = timeStep;
    for (let i = 7; i >= 0; i--) {
      counterBytes[i] = temp & 0xff;
      temp = Math.floor(temp / 256);
    }

    const keyBytes = base32ToBytes(secret);
    const keyWordArray = uint8ArrayToWordArray(keyBytes);
    const messageWordArray = uint8ArrayToWordArray(counterBytes);

    // Compute HMAC-SHA1
    const hmac = CryptoJS.HmacSHA1(messageWordArray, keyWordArray);
    const hmacHex = hmac.toString(CryptoJS.enc.Hex);

    // Convert hex string to byte array
    const hmacBytes: number[] = [];
    for (let i = 0; i < hmacHex.length; i += 2) {
      hmacBytes.push(parseInt(hmacHex.substr(i, 2), 16));
    }

    // Dynamic Truncation
    const offset = hmacBytes[hmacBytes.length - 1] & 0x0f;
    const binary =
      ((hmacBytes[offset] & 0x7f) << 24) |
      ((hmacBytes[offset + 1] & 0xff) << 16) |
      ((hmacBytes[offset + 2] & 0xff) << 8) |
      (hmacBytes[offset + 3] & 0xff);

    const otp = binary % Math.pow(10, digits);
    return otp.toString().padStart(digits, '0');
  } catch (e) {
    console.error('Error generating TOTP code:', e);
    return '000000';
  }
}

/**
 * Verifies a 6-digit TOTP code against the secret within a drift window (+/- 1 period)
 */
export function verifyTotpCode(
  secret: string,
  inputCode: string,
  windowPeriods = 1,
  period = 30
): boolean {
  if (!secret || !inputCode) return false;
  const cleanCode = inputCode.trim().replace(/\s+/g, '');
  if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) return false;

  const now = Date.now();
  for (let offset = -windowPeriods; offset <= windowPeriods; offset++) {
    const testTime = now + offset * period * 1000;
    const expected = generateTotpCode(secret, testTime, period, 6);
    if (expected === cleanCode) {
      return true;
    }
  }
  return false;
}

/**
 * Generates formatted one-time backup recovery codes
 */
export function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let i = 0; i < count; i++) {
    let part1 = '';
    let part2 = '';
    for (let j = 0; j < 4; j++) {
      part1 += chars[Math.floor(Math.random() * chars.length)];
      part2 += chars[Math.floor(Math.random() * chars.length)];
    }
    codes.push(`${part1}-${part2}`);
  }
  return codes;
}

/**
 * Constructs standard OTPAuth URL for QR Code Scanning
 */
export function getOtpAuthUri(
  secret: string,
  userEmail: string,
  issuer = 'AHA Theory Vault'
): string {
  const account = userEmail ? userEmail.trim() : 'User';
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Renders QR code as high-contrast Data URL image
 */
export async function generateQrCodeDataUrl(otpAuthUri: string): Promise<string> {
  try {
    return await QRCode.toDataURL(otpAuthUri, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
  } catch (err) {
    console.error('Error creating TOTP QR code:', err);
    return '';
  }
}

// Storage Helpers (LocalStorage + Firestore sync)
const STORAGE_PREFIX = 'aha_totp_config_';

export function getLocalTotpConfig(userId: string): TotpConfig | null {
  if (!userId || typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (!raw) return null;
    return JSON.parse(raw) as TotpConfig;
  } catch (e) {
    return null;
  }
}

export function saveLocalTotpConfig(userId: string, config: TotpConfig) {
  if (!userId || typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(config));
  } catch (e) {}
}

export function removeLocalTotpConfig(userId: string) {
  if (!userId || typeof window === 'undefined') return;
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${userId}`);
  } catch (e) {}
}

export async function fetchUserTotpConfig(userId: string): Promise<TotpConfig | null> {
  if (!userId) return null;
  
  // 1. Try local cache first for instant response
  const local = getLocalTotpConfig(userId);
  
  try {
    const secRef = doc(db, 'user_security', userId);
    const snap = await getDoc(secRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data.totp) {
        saveLocalTotpConfig(userId, data.totp);
        return data.totp as TotpConfig;
      }
    }
  } catch (e) {
    // If firestore fails/offline, use local
  }

  return local;
}

export async function saveUserTotpConfig(userId: string, config: TotpConfig): Promise<boolean> {
  if (!userId) return false;
  
  // Save local
  saveLocalTotpConfig(userId, config);

  // Sync to firestore
  try {
    const secRef = doc(db, 'user_security', userId);
    await setDoc(secRef, {
      totp: config,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (e) {
    console.warn('Could not sync TOTP config to Firestore:', e);
    return true; // Local is still saved
  }
}

export async function disableUserTotp(userId: string): Promise<boolean> {
  if (!userId) return false;
  removeLocalTotpConfig(userId);

  try {
    const secRef = doc(db, 'user_security', userId);
    await setDoc(secRef, {
      totp: {
        enabled: false,
        secret: '',
        backupCodes: [],
        createdAt: new Date().toISOString()
      },
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (e) {
    console.warn('Could not disable TOTP on Firestore:', e);
    return true;
  }
}

/**
 * Validates either a 6-digit TOTP token OR an 8-character backup recovery code.
 * If a backup code is used, it is consumed and removed from remaining backup codes.
 */
export async function verifyAndConsumeTotpOrBackup(
  userId: string,
  inputCode: string
): Promise<{ success: boolean; isBackupCode: boolean; remainingBackups?: number; error?: string }> {
  if (!userId || !inputCode) {
    return { success: false, isBackupCode: false, error: 'Код не может быть пустым' };
  }

  const config = await fetchUserTotpConfig(userId);
  if (!config || !config.enabled || !config.secret) {
    // If not enabled, return success or not configured
    return { success: true, isBackupCode: false };
  }

  const cleanInput = inputCode.trim().toUpperCase().replace(/\s+/g, '');

  // 1. Try 6-digit TOTP
  if (/^\d{6}$/.test(cleanInput)) {
    const isValid = verifyTotpCode(config.secret, cleanInput, 1);
    if (isValid) {
      config.lastUsedTimestamp = Date.now();
      await saveUserTotpConfig(userId, config);
      return { success: true, isBackupCode: false };
    }
  }

  // 2. Try Backup Recovery Code (e.g. ABCD-1234 or ABCD1234)
  const normalizedBackup = cleanInput.includes('-') ? cleanInput : `${cleanInput.slice(0, 4)}-${cleanInput.slice(4)}`;
  const backupIndex = config.backupCodes.findIndex(
    code => code.toUpperCase().replace(/\s+/g, '') === normalizedBackup || code.toUpperCase().replace(/[- ]/g, '') === cleanInput
  );

  if (backupIndex !== -1) {
    // Consume backup code
    const updatedBackupCodes = [...config.backupCodes];
    updatedBackupCodes.splice(backupIndex, 1);
    config.backupCodes = updatedBackupCodes;
    config.lastUsedTimestamp = Date.now();
    await saveUserTotpConfig(userId, config);

    return {
      success: true,
      isBackupCode: true,
      remainingBackups: updatedBackupCodes.length
    };
  }

  return {
    success: false,
    isBackupCode: false,
    error: 'Неверный код аутентификатора или резервный код'
  };
}
