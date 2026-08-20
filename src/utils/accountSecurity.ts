/**
 * Aha Advanced Account Security & Anti-Fraud Engine (v4.0)
 * 
 * Provides multi-vector account verification, disposable email blocking,
 * environment anomaly detection, device session authorization, rate limiting,
 * and real-time security scoring before granting system access.
 */

import { getDeviceId } from './deviceId';

// 1. Known Disposable / Temporary Email Domains Blacklist
export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'tempmail.com', '10minutemail.com', 'mailinator.com', 'guerrillamail.com',
  'sharklasers.com', 'grr.la', 'guerrillamail.biz', 'guerrillamail.info',
  'throwawaymail.com', 'yopmail.com', 'trashmail.com', 'dispostable.com',
  'getairmail.com', 'temp-mail.org', 'mohmal.com', 'burnermail.io',
  'tempmailo.com', 'generator.email', 'crazymailing.com', 'dropmail.me',
  'fakemailgenerator.com', 'nada.ltd', 'emailondeck.com', 'getnada.com',
  'inboxkitten.com', 'mytemp.email', 'trashmail.net', 'tempinbox.com',
  'minuteinbox.com', 'luxusmail.xyz', 'tmpmail.org', 'tmpbox.net',
  'tmailor.com', 'disposablemail.com', 'fakeinbox.com', 'guerrillamailblock.com',
  'pokemail.net', 'spam4.me', 'binkmail.com', 'safetymail.info',
  'trbvm.com', 'disbox.net', 'trashinbox.com', 'mohmal.im', 'mohmal.in',
  'mailcatch.com', 'armyspy.com', 'cuvox.de', 'dayrep.com', 'einrot.com',
  'fleckens.hu', 'gustr.com', 'jourrapide.com', 'rhyta.com', 'superrito.com',
  'teleworm.us', 'crazymailing.com', 'mailpoof.com', 'zillamail.com'
]);

export interface SecurityCheckResult {
  id: string;
  name: string;
  nameRu: string;
  passed: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low';
  details: string;
  detailsRu: string;
}

export interface AccountSecurityReport {
  score: number; // 0 to 100
  status: 'passed' | 'warning' | 'restricted' | 'blocked';
  checks: SecurityCheckResult[];
  failedCount: number;
  criticalFailures: number;
  deviceTrusted: boolean;
  botScore: number; // 0 (clean) to 100 (bot)
}

// 2. Disposable Email Check
export function isDisposableEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) return true;
  const domain = parts[1];
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

// 3. Email Format & Domain Health Check
export function validateEmailFormat(email: string): { valid: boolean; error?: string; errorRu?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required', errorRu: 'Email обязателен' };
  }
  const cleanEmail = email.trim().toLowerCase();
  
  // RFC 5322 regex validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(cleanEmail)) {
    return { 
      valid: false, 
      error: 'Invalid email address format', 
      errorRu: 'Некорректный формат адреса электронной почты' 
    };
  }

  if (isDisposableEmail(cleanEmail)) {
    return { 
      valid: false, 
      error: 'Temporary and disposable email providers are prohibited for account security.', 
      errorRu: 'Использование временных и одноразовых почтовых сервисов запрещено в целях безопасности.' 
    };
  }

  return { valid: true };
}

// 4. Password Strength Validator
export function evaluatePasswordStrength(password: string): {
  score: number; // 0 to 4
  level: 'very_weak' | 'weak' | 'moderate' | 'strong' | 'very_strong';
  feedbackRu: string;
  feedbackEn: string;
  hasMinLength: boolean;
  hasNumbers: boolean;
  hasLetters: boolean;
  hasSpecial: boolean;
} {
  const hasMinLength = password.length >= 8;
  const hasShortMin = password.length >= 6;
  const hasNumbers = /\d/.test(password);
  const hasLetters = /[a-zA-Zа-яА-Я]/.test(password);
  const hasUppercase = /[A-ZА-Я]/.test(password);
  const hasLowercase = /[a-zа-я]/.test(password);
  const hasSpecial = /[^A-Za-z0-9а-яА-Я]/.test(password);

  let points = 0;
  if (hasShortMin) points += 1;
  if (hasMinLength) points += 1;
  if (hasNumbers && hasLetters) points += 1;
  if ((hasUppercase && hasLowercase) || hasSpecial) points += 1;
  if (password.length >= 12 && hasSpecial && hasNumbers) points += 1;

  if (points <= 1) {
    return {
      score: 1,
      level: 'very_weak',
      feedbackRu: 'Слишком слабый пароль. Добавьте цифры и спецсимволы.',
      feedbackEn: 'Very weak password. Add numbers and special characters.',
      hasMinLength,
      hasNumbers,
      hasLetters,
      hasSpecial
    };
  } else if (points === 2) {
    return {
      score: 2,
      level: 'weak',
      feedbackRu: 'Слабый пароль. Рекомендуется от 8 символов.',
      feedbackEn: 'Weak password. 8+ characters recommended.',
      hasMinLength,
      hasNumbers,
      hasLetters,
      hasSpecial
    };
  } else if (points === 3) {
    return {
      score: 3,
      level: 'moderate',
      feedbackRu: 'Хороший пароль.',
      feedbackEn: 'Good password.',
      hasMinLength,
      hasNumbers,
      hasLetters,
      hasSpecial
    };
  } else if (points === 4) {
    return {
      score: 4,
      level: 'strong',
      feedbackRu: 'Надёжный пароль!',
      feedbackEn: 'Strong password!',
      hasMinLength,
      hasNumbers,
      hasLetters,
      hasSpecial
    };
  } else {
    return {
      score: 5,
      level: 'very_strong',
      feedbackRu: 'Превосходная криптостойкость!',
      feedbackEn: 'Excellent cryptographic resilience!',
      hasMinLength,
      hasNumbers,
      hasLetters,
      hasSpecial
    };
  }
}

// 5. Automated Headless / Bot Environment Detection
export function detectEnvironmentAnomalies(): { isBot: boolean; score: number; reasons: string[] } {
  const reasons: string[] = [];
  let botScore = 0;

  if (typeof window === 'undefined') {
    return { isBot: false, score: 0, reasons: [] };
  }

  // Check 1: navigator.webdriver
  if ((navigator as any).webdriver) {
    botScore += 45;
    reasons.push('Automated WebDriver flag detected');
  }

  // Check 2: Headless user agents
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('headless') || ua.includes('phantomjs') || ua.includes('selenium') || ua.includes('puppeteer')) {
    botScore += 60;
    reasons.push('Headless browser user-agent signature');
  }

  // Check 3: Missing standard browser plugins / language
  if (!navigator.languages || navigator.languages.length === 0) {
    botScore += 20;
    reasons.push('Anomalous missing browser language list');
  }

  // Check 4: Automation chrome object anomalies
  if ((window as any)._phantom || (window as any).__nightmare || (window as any).callPhantom) {
    botScore += 70;
    reasons.push('Headless crawler injection artifact detected');
  }

  // Check 5: Screen resolution dimensions
  if (window.screen && (window.screen.width === 0 || window.screen.height === 0)) {
    botScore += 50;
    reasons.push('Zero-pixel virtual screen canvas detected');
  }

  return {
    isBot: botScore >= 50,
    score: Math.min(botScore, 100),
    reasons
  };
}

// 6. Rate Limiting & Brute Force Tracker
const RATE_LIMIT_STORAGE_KEY = 'aha_auth_rate_limits';

interface RateLimitRecord {
  attempts: number;
  firstAttempt: number;
  lockedUntil: number;
}

export function recordFailedLoginAttempt(identifier: string): { isLocked: boolean; remainingSeconds: number; attempts: number } {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    const records: Record<string, RateLimitRecord> = raw ? JSON.parse(raw) : {};
    const key = identifier.toLowerCase().trim();
    const now = Date.now();

    const current = records[key] || { attempts: 0, firstAttempt: now, lockedUntil: 0 };

    if (current.lockedUntil > now) {
      return {
        isLocked: true,
        remainingSeconds: Math.ceil((current.lockedUntil - now) / 1000),
        attempts: current.attempts
      };
    }

    current.attempts += 1;

    // Lockout policy:
    // 5 attempts -> 3 minutes
    // 8 attempts -> 15 minutes
    // 12+ attempts -> 60 minutes
    if (current.attempts >= 12) {
      current.lockedUntil = now + 60 * 60 * 1000;
    } else if (current.attempts >= 8) {
      current.lockedUntil = now + 15 * 60 * 1000;
    } else if (current.attempts >= 5) {
      current.lockedUntil = now + 3 * 60 * 1000;
    }

    records[key] = current;
    localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(records));

    const isLocked = current.lockedUntil > now;
    return {
      isLocked,
      remainingSeconds: isLocked ? Math.ceil((current.lockedUntil - now) / 1000) : 0,
      attempts: current.attempts
    };
  } catch (e) {
    return { isLocked: false, remainingSeconds: 0, attempts: 1 };
  }
}

export function resetLoginAttempts(identifier: string) {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    if (!raw) return;
    const records: Record<string, RateLimitRecord> = JSON.parse(raw);
    const key = identifier.toLowerCase().trim();
    delete records[key];
    localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {}
}

export function checkRateLimitStatus(identifier: string): { isLocked: boolean; remainingSeconds: number } {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    if (!raw) return { isLocked: false, remainingSeconds: 0 };
    const records: Record<string, RateLimitRecord> = JSON.parse(raw);
    const key = identifier.toLowerCase().trim();
    const current = records[key];
    if (!current) return { isLocked: false, remainingSeconds: 0 };
    
    const now = Date.now();
    if (current.lockedUntil > now) {
      return {
        isLocked: true,
        remainingSeconds: Math.ceil((current.lockedUntil - now) / 1000)
      };
    }
    return { isLocked: false, remainingSeconds: 0 };
  } catch (e) {
    return { isLocked: false, remainingSeconds: 0 };
  }
}

// 7. Device Trust Verification
const TRUSTED_DEVICES_KEY = 'aha_trusted_devices';

export function isCurrentDeviceTrusted(userUid: string): boolean {
  if (!userUid) return false;
  try {
    const raw = localStorage.getItem(TRUSTED_DEVICES_KEY);
    const trusted: Record<string, { deviceId: string; expiresAt: number }> = raw ? JSON.parse(raw) : {};
    const record = trusted[userUid];
    if (!record) return false;
    const currentDevId = getDeviceId();
    return record.deviceId === currentDevId && record.expiresAt > Date.now();
  } catch (e) {
    return false;
  }
}

export function trustCurrentDevice(userUid: string, days = 30) {
  if (!userUid) return;
  try {
    const raw = localStorage.getItem(TRUSTED_DEVICES_KEY);
    const trusted = raw ? JSON.parse(raw) : {};
    trusted[userUid] = {
      deviceId: getDeviceId(),
      expiresAt: Date.now() + days * 24 * 60 * 60 * 1000
    };
    localStorage.setItem(TRUSTED_DEVICES_KEY, JSON.stringify(trusted));
  } catch (e) {}
}

// 8. Comprehensive Account Security Evaluator
export function evaluateAccountSecurity(
  user: any, 
  userDocData: any = {}, 
  blockedDevices: string[] = [], 
  blockedEmails: string[] = []
): AccountSecurityReport {
  const checks: SecurityCheckResult[] = [];
  let score = 100;
  let criticalFailures = 0;

  const email = user?.email?.toLowerCase() || userDocData?.email?.toLowerCase() || '';
  const currentDevId = getDeviceId();

  // Check 1: System Blocklist status
  const isEmailBlocked = email ? blockedEmails.includes(email) : false;
  const isDevBlocked = currentDevId ? blockedDevices.includes(currentDevId) : false;
  const isDocBlocked = !!userDocData.isBlocked;
  const isBlocked = isEmailBlocked || isDevBlocked || isDocBlocked;

  checks.push({
    id: 'blacklist_check',
    name: 'Platform Blacklist Verification',
    nameRu: 'Проверка в черных списках платформы',
    passed: !isBlocked,
    severity: 'critical',
    details: isBlocked ? 'Account, email, or device is present in security banlist.' : 'Device and account clean from blacklist entries.',
    detailsRu: isBlocked ? 'Аккаунт, почта или устройство находятся в бан-листе.' : 'Устройство и почта отсутствуют в черных списках.'
  });

  if (isBlocked) {
    score -= 100;
    criticalFailures++;
  }

  // Check 2: Email Format & Disposable Domain
  const isTempEmail = isDisposableEmail(email);
  checks.push({
    id: 'disposable_email',
    name: 'Disposable Domain & Email Health',
    nameRu: 'Проверка домена и одноразовой почты',
    passed: !isTempEmail && email.length > 0,
    severity: 'high',
    details: isTempEmail ? 'Disposable/temporary email domains are blocked.' : 'Email domain recognized and allowed.',
    detailsRu: isTempEmail ? 'Обнаружен временный/одноразовый почтовый домен.' : 'Домен почты проверен и разрешен.'
  });

  if (isTempEmail) {
    score -= 40;
    criticalFailures++;
  }

  // Check 3: Email Verification Confirmation
  const isEmailVerified = user?.emailVerified || userDocData?.isVerified || userDocData?.role === 'admin';
  checks.push({
    id: 'email_verification',
    name: 'Email Ownership Verification',
    nameRu: 'Подтверждение владения почтой (Email Verification)',
    passed: !!isEmailVerified,
    severity: 'medium',
    details: isEmailVerified ? 'Email address confirmed via secure token.' : 'Email address unconfirmed. Verification recommended.',
    detailsRu: isEmailVerified ? 'Почтовый ящик подтвержден через токен безопасности.' : 'Почта не подтверждена. Требуется верификация.'
  });

  if (!isEmailVerified) {
    score -= 20;
  }

  // Check 4: Bot & Headless Anomaly Detection
  const botDetection = detectEnvironmentAnomalies();
  checks.push({
    id: 'environment_integrity',
    name: 'Environment & Client Integrity',
    nameRu: 'Целостность клиентского окружения (Anti-Bot)',
    passed: !botDetection.isBot,
    severity: 'high',
    details: botDetection.isBot ? `Automated runtime artifacts detected: ${botDetection.reasons.join(', ')}` : 'Client browser environment verified as authentic human session.',
    detailsRu: botDetection.isBot ? `Обнаружены следы автоматизации: ${botDetection.reasons.join(', ')}` : 'Клиентское окружение прошло проверку на отсутствие ботов.'
  });

  if (botDetection.isBot) {
    score -= 50;
    criticalFailures++;
  }

  // Check 5: Device Session Trust
  const isTrusted = user ? isCurrentDeviceTrusted(user.uid) : false;
  checks.push({
    id: 'device_trust',
    name: 'Hardware Fingerprint & Device Authorization',
    nameRu: 'Авторизация и доверие текущему устройству',
    passed: isTrusted || userDocData?.deviceId === currentDevId,
    severity: 'low',
    details: isTrusted ? 'Device cryptographically trusted for 30 days.' : 'New or unrecognized device fingerprint.',
    detailsRu: isTrusted ? 'Устройство подтверждено и доверено на 30 дней.' : 'Новое или неавторизованное устройство.'
  });

  if (!isTrusted && userDocData?.deviceId !== currentDevId) {
    score -= 10;
  }

  // Check 6: Session Expiration Lifetime
  const sessionStart = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_session_start_time') : null;
  const sessionValid = !sessionStart || (Date.now() - parseInt(sessionStart, 10)) < 30 * 24 * 60 * 60 * 1000;
  checks.push({
    id: 'session_lifetime',
    name: 'Session Expiration & Token Freshness',
    nameRu: 'Срок действия сессии и свежесть токена',
    passed: sessionValid,
    severity: 'medium',
    details: sessionValid ? 'Session token is fresh and valid.' : 'Session expired (over 30 days old). Re-authentication required.',
    detailsRu: sessionValid ? 'Сессионный токен актуален.' : 'Сессия устарела (более 30 дней). Требуется повторный вход.'
  });

  if (!sessionValid) {
    score -= 30;
    criticalFailures++;
  }

  // Check 7: TOTP Two-Factor Authentication (2FA) Status
  const isTotpEnabled = !!userDocData?.totp?.enabled || (typeof localStorage !== 'undefined' && user?.uid && !!localStorage.getItem(`aha_totp_config_${user.uid}`));
  checks.push({
    id: 'totp_2fa',
    name: 'Time-based One-Time Password (TOTP / 2FA)',
    nameRu: 'Двухфакторная аутентификация TOTP (2FA)',
    passed: isTotpEnabled,
    severity: 'medium',
    details: isTotpEnabled ? 'Hardware Authenticator app linked and active.' : '2FA is inactive. Linking an authenticator app is strongly advised.',
    detailsRu: isTotpEnabled ? 'Приложение-аутентификатор подключено и активно.' : '2FA отключена. Рекомендуется привязать Authenticator.'
  });

  if (!isTotpEnabled) {
    score -= 15;
  }

  const finalScore = Math.max(0, Math.min(100, score));
  let status: 'passed' | 'warning' | 'restricted' | 'blocked' = 'passed';

  if (isBlocked || criticalFailures >= 2) {
    status = 'blocked';
  } else if (criticalFailures === 1 || finalScore < 60) {
    status = 'restricted';
  } else if (finalScore < 85) {
    status = 'warning';
  }

  return {
    score: finalScore,
    status,
    checks,
    failedCount: checks.filter(c => !c.passed).length,
    criticalFailures,
    deviceTrusted: isTrusted,
    botScore: botDetection.score
  };
}

export function openAccountSecurityCheckpoint(actionName?: string, onSuccess?: () => void) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aha_open_security_checkpoint', { 
      detail: { actionName, onSuccess } 
    }));
  }
}
