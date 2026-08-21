import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Smartphone, KeyRound, Copy, Check, QrCode, 
  Download, ArrowRight, ArrowLeft, AlertTriangle, RefreshCw, 
  Lock, Trash2, Sparkles, CheckCircle2, ShieldAlert, Key, Eye, HelpCircle
} from 'lucide-react';
import { Language } from '../../data/translations';
import { 
  generateTotpSecret, 
  generateBackupCodes, 
  getOtpAuthUri, 
  generateQrCodeDataUrl, 
  verifyTotpCode, 
  saveUserTotpConfig, 
  fetchUserTotpConfig, 
  disableUserTotp,
  TotpConfig 
} from '../../utils/totp';
import { logSecurityCheckpointAttempt } from '../../utils/securityActivityLogger';

interface TotpProfileSectionProps {
  userId: string;
  userEmail: string;
  lang: Language;
  onTotpStatusChanged?: (enabled: boolean) => void;
  onToast?: (message: string) => void;
}

export const TotpProfileSection: React.FC<TotpProfileSectionProps> = ({
  userId,
  userEmail,
  lang,
  onTotpStatusChanged,
  onToast
}) => {
  const [loading, setLoading] = useState(true);
  const [currentConfig, setCurrentConfig] = useState<TotpConfig | null>(null);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupStep, setSetupStep] = useState<'qr_and_secret' | 'backup_codes' | 'verify'>('qr_and_secret');

  // Draft Setup State
  const [draftSecret, setDraftSecret] = useState('');
  const [draftQrUrl, setDraftQrUrl] = useState('');
  const [draftBackupCodes, setDraftBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isCopiedSecret, setIsCopiedSecret] = useState(false);
  const [isCopiedBackups, setIsCopiedBackups] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(30);

  // Active Mode Helpers
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [testCodeInput, setTestCodeInput] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // 30-second TOTP clock ticker
  useEffect(() => {
    const updateCountdown = () => {
      const sec = 30 - (Math.floor(Date.now() / 1000) % 30);
      setSecondsRemaining(sec);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadTotpConfig = async () => {
    if (!userId) return;
    setLoading(true);
    const cfg = await fetchUserTotpConfig(userId);
    setCurrentConfig(cfg);
    setLoading(false);
  };

  useEffect(() => {
    loadTotpConfig();
  }, [userId]);

  const initiateNewSetup = async () => {
    const secret = generateTotpSecret(20);
    const backups = generateBackupCodes(8);
    const otpUri = getOtpAuthUri(secret, userEmail || 'user@aha.vault', 'AHA Vault');
    const qrDataUrl = await generateQrCodeDataUrl(otpUri);

    setDraftSecret(secret);
    setDraftBackupCodes(backups);
    setDraftQrUrl(qrDataUrl);
    setVerificationCode('');
    setVerifyError(null);
    setSetupStep('qr_and_secret');
    setIsSettingUp(true);
  };

  const handleCopySecret = () => {
    if (!draftSecret) return;
    navigator.clipboard.writeText(draftSecret);
    setIsCopiedSecret(true);
    if (onToast) onToast(lang === 'ru' ? 'Секретный ключ скопирован!' : 'Secret key copied!');
    setTimeout(() => setIsCopiedSecret(false), 3000);
  };

  const handleCopyBackupCodes = () => {
    const codes = currentConfig?.enabled ? currentConfig.backupCodes : draftBackupCodes;
    if (!codes || codes.length === 0) return;
    const text = codes.join('\n');
    navigator.clipboard.writeText(text);
    setIsCopiedBackups(true);
    if (onToast) onToast(lang === 'ru' ? 'Резервные коды скопированы!' : 'Backup codes copied!');
    setTimeout(() => setIsCopiedBackups(false), 3000);
  };

  const handleDownloadBackupCodes = () => {
    const codes = currentConfig?.enabled ? currentConfig.backupCodes : draftBackupCodes;
    if (!codes || codes.length === 0) return;

    const content = `=========================================\n` +
      `AHA THEORY VAULT - 2FA BACKUP CODES\n` +
      `Account: ${userEmail || userId}\n` +
      `Generated: ${new Date().toLocaleString()}\n` +
      `=========================================\n\n` +
      codes.map((c, i) => `${i + 1}. ${c}`).join('\n') +
      `\n\n* Each backup code can be used ONCE to authenticate in case you lose access to your Authenticator app.\n` +
      `* Store this file securely and never share it.`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `aha_2fa_backup_codes_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    if (onToast) onToast(lang === 'ru' ? 'Файл с кодами скачан!' : 'Backup codes file downloaded!');
  };

  const handleConfirmAndActivate = async () => {
    if (!verificationCode || verificationCode.trim().length !== 6) {
      setVerifyError(lang === 'ru' ? 'Введите 6-значный код из приложения' : 'Enter 6-digit code from authenticator app');
      return;
    }

    setIsSubmitting(true);
    setVerifyError(null);

    // Verify against draft secret before saving
    const isValid = verifyTotpCode(draftSecret, verificationCode.trim(), 1);
    if (!isValid) {
      setIsSubmitting(false);
      setVerifyError(
        lang === 'ru' 
          ? 'Неверный проверочный код. Проверьте правильность времени на телефоне и введите текущий код из приложения.' 
          : 'Invalid code. Check device time synchronization and enter current code from app.'
      );
      return;
    }

    const newConfig: TotpConfig = {
      enabled: true,
      secret: draftSecret,
      backupCodes: draftBackupCodes,
      createdAt: new Date().toISOString(),
      lastUsedTimestamp: Date.now()
    };

    await saveUserTotpConfig(userId, newConfig);
    setCurrentConfig(newConfig);
    setIsSubmitting(false);
    setIsSettingUp(false);
    setVerificationCode('');

    logSecurityCheckpointAttempt(userId, {
      status: 'success',
      actionType: 'totp_activated',
      actionName: '2FA TOTP Activation',
      details: 'Two-Factor Authentication RFC 6238 successfully configured and activated.',
      detailsRu: 'Двухфакторная аутентификация RFC 6238 успешно настроена и включена.',
      score: 95,
      isTrusted: true
    });

    if (onTotpStatusChanged) {
      onTotpStatusChanged(true);
    }
    if (onToast) {
      onToast(lang === 'ru' ? '2FA успешно подключена и активирована!' : '2FA activated successfully!');
    }
  };

  const handleDisableTotp = async () => {
    const confirm = window.confirm(
      lang === 'ru'
        ? 'Вы уверены, что хотите отключить двухфакторную аутентификацию (2FA)? Уровень безопасности вашего аккаунта будет снижен.'
        : 'Are you sure you want to disable Two-Factor Authentication (2FA)? Your account security score will decrease.'
    );
    if (!confirm) return;

    setIsSubmitting(true);
    await disableUserTotp(userId);
    setCurrentConfig(null);
    setIsSubmitting(false);
    setShowBackupCodes(false);
    setTestResult(null);

    logSecurityCheckpointAttempt(userId, {
      status: 'warning',
      actionType: 'totp_disabled',
      actionName: '2FA Protection Disabled',
      details: 'User manually deactivated Two-Factor Authentication.',
      detailsRu: 'Пользователь вручную отключил двухфакторную защиту аккаунта.',
      score: 65,
      isTrusted: false
    });

    if (onTotpStatusChanged) {
      onTotpStatusChanged(false);
    }
    if (onToast) {
      onToast(lang === 'ru' ? '2FA отключена' : '2FA disabled');
    }
  };

  const handleTestActiveCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentConfig?.secret || !testCodeInput.trim()) return;

    const isValid = verifyTotpCode(currentConfig.secret, testCodeInput.trim(), 1);
    if (isValid) {
      setTestResult({
        success: true,
        message: lang === 'ru' ? 'Код верный! Приложение синхронизировано.' : 'Code is valid! Authenticator synchronized.'
      });
      logSecurityCheckpointAttempt(userId, {
        status: 'success',
        actionType: 'totp_verified',
        actionName: '2FA Sync Test',
        details: 'Self-test diagnostic: TOTP token synchronization validated.',
        detailsRu: 'Самодиагностика: Синхронизация TOTP токена подтверждена.',
        score: 95,
        isTrusted: true
      });
    } else {
      setTestResult({
        success: false,
        message: lang === 'ru' ? 'Неверный код. Проверьте время на устройстве.' : 'Invalid code. Check device time.'
      });
      logSecurityCheckpointAttempt(userId, {
        status: 'failed',
        actionType: 'totp_failed',
        actionName: '2FA Sync Test',
        details: 'Self-test diagnostic failed: Incorrect TOTP token entered.',
        detailsRu: 'Сбой самодиагностики: Введен неверный TOTP токен.',
        score: 75,
        isTrusted: false
      });
    }
  };

  if (loading) {
    return (
      <div className="p-8 rounded-2xl bg-[#1c152a]/60 border border-[#3d2b4f]/40 flex flex-col items-center justify-center gap-3">
        <div className="w-7 h-7 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-white/50 uppercase tracking-wider">
          {lang === 'ru' ? 'Проверка статуса 2FA...' : 'Checking 2FA status...'}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 2FA Status Card */}
      <div className={`p-5 sm:p-6 rounded-2xl border transition-all ${
        currentConfig?.enabled 
          ? 'bg-emerald-500/10 border-emerald-500/30' 
          : 'bg-[#1c152a] border-[#3d2b4f]'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-3.5 min-w-0 flex-1">
            <div className={`p-3 rounded-2xl shrink-0 ${
              currentConfig?.enabled 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-500/10' 
                : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
            }`}>
              <Smartphone size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-black text-white uppercase tracking-wider">
                  {lang === 'ru' ? '2FA Защита (TOTP)' : '2FA Protection (TOTP)'}
                </h4>
                <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider shrink-0 ${
                  currentConfig?.enabled 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : 'bg-white/10 text-white/50 border-white/20'
                }`}>
                  {currentConfig?.enabled ? (lang === 'ru' ? 'АКТИВНА' : 'ACTIVE') : (lang === 'ru' ? 'ОТКЛЮЧЕНА' : 'OFF')}
                </span>
              </div>
              <p className="text-xs text-white/60 mt-1 leading-relaxed">
                {currentConfig?.enabled
                  ? (lang === 'ru' 
                      ? 'Ваш аккаунт надежно защищен стандартом RFC 6238. При подтверждении критических операций в Центре Безопасности запрашивается 6-значный код.' 
                      : 'Account is protected by RFC 6238 TOTP. 6-digit codes will be required for critical actions.')
                  : (lang === 'ru'
                      ? 'Подключите Google Authenticator, Apple Passwords или Authy для максимальной защиты аккаунта.'
                      : 'Link Google Authenticator, Apple Passwords, or Authy to protect your account.')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 self-stretch md:self-center">
            {!currentConfig?.enabled && !isSettingUp && (
              <button
                onClick={initiateNewSetup}
                className="w-full md:w-auto px-4 py-2.5 bg-gradient-to-r from-purple-600 to-[#ff4d4d] hover:from-purple-500 hover:to-[#ff6666] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <KeyRound size={14} className="shrink-0" />
                <span>{lang === 'ru' ? 'Подключить 2FA' : 'Setup 2FA'}</span>
              </button>
            )}

            {currentConfig?.enabled && !isSettingUp && (
              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  onClick={initiateNewSetup}
                  className="flex-1 md:flex-none px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw size={13} />
                  <span>{lang === 'ru' ? 'Перепривязать' : 'Re-link'}</span>
                </button>
                <button
                  onClick={handleDisableTotp}
                  disabled={isSubmitting}
                  className="flex-1 md:flex-none px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={13} />
                  <span>{lang === 'ru' ? 'Отключить' : 'Disable'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SETUP WIZARD SECTION (If user is configuring or re-linking) */}
      <AnimatePresence>
        {isSettingUp && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="p-6 rounded-3xl bg-[#15101e] border-2 border-purple-500/40 shadow-2xl space-y-6 relative overflow-hidden"
          >
            {/* Header / Step Tracker */}
            <div className="flex items-center justify-between border-b border-[#3d2b4f] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-black text-sm">
                  {setupStep === 'qr_and_secret' ? '1' : setupStep === 'backup_codes' ? '2' : '3'}
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">
                    {setupStep === 'qr_and_secret' 
                      ? (lang === 'ru' ? 'Шаг 1: Сканирование QR-кода и Ключа' : 'Step 1: Scan QR & Secret Key')
                      : setupStep === 'backup_codes'
                      ? (lang === 'ru' ? 'Шаг 2: Резервные Коды Восстановления' : 'Step 2: Backup Recovery Codes')
                      : (lang === 'ru' ? 'Шаг 3: Проверка и Активация 2FA' : 'Step 3: Verify & Activate 2FA')}
                  </h4>
                  <p className="text-[11px] text-white/50">
                    {lang === 'ru' 
                      ? 'Проверьте генерацию кода перед требованием 2FA в Центре Безопасности' 
                      : 'Verify your code generation before requiring 2FA in Account Security Gate'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsSettingUp(false)}
                className="text-xs text-white/40 hover:text-white px-2.5 py-1 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              >
                {lang === 'ru' ? 'Отмена' : 'Cancel'}
              </button>
            </div>

            {/* STEP 1: QR CODE & SECRET KEY */}
            {setupStep === 'qr_and_secret' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  {/* QR Box */}
                  <div className="flex flex-col items-center justify-center p-5 bg-white rounded-2xl border-4 border-purple-500/30 shadow-xl max-w-[240px] mx-auto">
                    {draftQrUrl ? (
                      <img 
                        src={draftQrUrl} 
                        alt="TOTP QR Code" 
                        className="w-44 h-44 block rounded-lg select-none"
                      />
                    ) : (
                      <div className="w-44 h-44 flex items-center justify-center text-black font-bold text-xs">
                        QR...
                      </div>
                    )}
                    <span className="text-[10px] font-black text-black/60 uppercase tracking-widest mt-2 flex items-center gap-1">
                      <QrCode size={12} />
                      {lang === 'ru' ? 'Отсканируйте камерой' : 'Scan with Authenticator'}
                    </span>
                  </div>

                  {/* Secret & Instructions */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                        {lang === 'ru' ? 'Инструкция по подключению:' : 'Quick Instructions:'}
                      </h5>
                      <ol className="text-xs text-white/70 space-y-1 list-decimal list-inside leading-relaxed">
                        <li>{lang === 'ru' ? 'Откройте Google Authenticator, Microsoft Authenticator или Apple Passwords.' : 'Open Google Authenticator, Microsoft Authenticator or Apple Passwords.'}</li>
                        <li>{lang === 'ru' ? 'Нажмите «+» и выберите «Сканировать QR-код».' : 'Tap «+» and choose «Scan QR Code».'}</li>
                        <li>{lang === 'ru' ? 'Либо вручную введите секретный ключ ниже.' : 'Or manually enter the secret key below.'}</li>
                      </ol>
                    </div>

                    {/* Monospace Secret Key Box */}
                    <div className="p-3.5 bg-[#0e0a16] border border-[#3d2b4f] rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/60 font-bold">
                          {lang === 'ru' ? 'Секретный ключ (Base32):' : 'Secret Key (Base32):'}
                        </span>
                        <button
                          onClick={handleCopySecret}
                          className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 text-xs cursor-pointer transition-colors"
                        >
                          {isCopiedSecret ? <Check size={13} /> : <Copy size={13} />}
                          <span>{isCopiedSecret ? (lang === 'ru' ? 'Скопировано!' : 'Copied!') : (lang === 'ru' ? 'Скопировать' : 'Copy')}</span>
                        </button>
                      </div>
                      <div className="p-2.5 bg-[#1c152a] rounded-xl font-mono text-center text-sm font-black text-purple-300 tracking-widest break-all select-all border border-purple-500/20">
                        {draftSecret}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setSetupStep('backup_codes')}
                    className="px-6 py-3 bg-[#ff4d4d] hover:bg-[#ff6666] text-[#15101e] font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>{lang === 'ru' ? 'Далее: Резервные коды' : 'Next: Backup Codes'}</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: BACKUP CODES */}
            {setupStep === 'backup_codes' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3">
                    <AlertTriangle size={20} className="text-amber-400 shrink-0" />
                    <p className="text-xs text-amber-200 leading-relaxed">
                      {lang === 'ru' 
                        ? 'Сохраните эти 8 одноразовых резервных кодов. Если вы потеряете телефон или доступ к приложению, вы сможете войти с помощью любого из этих кодов.' 
                        : 'Save these 8 single-use recovery codes. If you lose access to your phone or authenticator, any of these codes can be used to authenticate.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#0e0a16] p-4 rounded-2xl border border-[#3d2b4f]">
                  {draftBackupCodes.map((code, idx) => (
                    <div 
                      key={idx} 
                      className="p-2.5 bg-[#1c152a] border border-[#3d2b4f]/70 rounded-xl font-mono text-center text-xs font-bold text-amber-300 select-all"
                    >
                      {code}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleCopyBackupCodes}
                    className="flex-1 py-2.5 px-4 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isCopiedBackups ? <Check size={14} /> : <Copy size={14} />}
                    <span>{isCopiedBackups ? (lang === 'ru' ? 'Скопировано!' : 'Copied!') : (lang === 'ru' ? 'Скопировать все' : 'Copy All')}</span>
                  </button>
                  <button
                    onClick={handleDownloadBackupCodes}
                    className="flex-1 py-2.5 px-4 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Download size={14} />
                    <span>{lang === 'ru' ? 'Скачать файл .txt' : 'Download .txt'}</span>
                  </button>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => setSetupStep('qr_and_secret')}
                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeft size={14} />
                    <span>{lang === 'ru' ? 'Назад к QR' : 'Back to QR'}</span>
                  </button>

                  <button
                    onClick={() => setSetupStep('verify')}
                    className="px-6 py-3 bg-[#ff4d4d] hover:bg-[#ff6666] text-[#15101e] font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>{lang === 'ru' ? 'Далее: Проверка Кода' : 'Next: Verify Code'}</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: VERIFY BEFORE ACTIVATING */}
            {setupStep === 'verify' && (
              <div className="space-y-6">
                <div className="text-center space-y-1.5">
                  <h5 className="text-sm font-black text-white uppercase tracking-wider">
                    {lang === 'ru' ? 'Введите 6-значный код для проверки' : 'Enter 6-digit Code to Verify'}
                  </h5>
                  <p className="text-xs text-white/60 max-w-md mx-auto">
                    {lang === 'ru'
                      ? 'Перед активацией убедитесь, что приложение генерирует правильные коды. Введите текущий код из Google Authenticator.'
                      : 'Confirm that your authenticator generates matching codes before finalizing activation.'}
                  </p>
                </div>

                <div className="max-w-xs mx-auto space-y-4">
                  <div className="flex justify-center">
                    <input
                      type="text"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setVerificationCode(val);
                        if (verifyError) setVerifyError(null);
                      }}
                      placeholder="000000"
                      autoFocus
                      className="w-56 py-3 px-4 bg-[#0e0a16] border-2 border-purple-500/60 focus:border-[#ff4d4d] rounded-2xl text-2xl font-mono text-center font-black tracking-[0.3em] text-white outline-none shadow-inner transition-colors"
                    />
                  </div>

                  {/* 30-Second Countdown */}
                  <div className="flex items-center justify-center gap-2 text-xs text-white/40 font-mono">
                    <RefreshCw size={12} className="animate-spin text-purple-400" />
                    <span>
                      {lang === 'ru' ? `Код обновится через: ${secondsRemaining}с` : `Code rotates in: ${secondsRemaining}s`}
                    </span>
                  </div>

                  {verifyError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                      <AlertTriangle size={14} className="shrink-0" />
                      <span>{verifyError}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => setSetupStep('backup_codes')}
                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeft size={14} />
                    <span>{lang === 'ru' ? 'Назад' : 'Back'}</span>
                  </button>

                  <button
                    onClick={handleConfirmAndActivate}
                    disabled={isSubmitting || verificationCode.length !== 6}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-[#15101e] font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-[#15101e] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles size={16} />
                    )}
                    <span>{lang === 'ru' ? 'Подтвердить и Активировать 2FA' : 'Verify & Activate 2FA'}</span>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ACTIVE MODE MANAGEMENT TOOLS */}
      {currentConfig?.enabled && !isSettingUp && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Backup Codes Card */}
          <div className="p-5 rounded-2xl bg-[#1c152a] border border-[#3d2b4f] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound size={16} className="text-amber-400" />
                <h5 className="text-xs font-black text-white uppercase tracking-wider">
                  {lang === 'ru' ? 'Резервные коды' : 'Backup Codes'}
                </h5>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400">
                {currentConfig.backupCodes.length} {lang === 'ru' ? 'осталось' : 'remaining'}
              </span>
            </div>

            <p className="text-xs text-white/50">
              {lang === 'ru' 
                ? 'Используйте при отсутствии доступа к телефону или приложению.' 
                : 'Single-use codes if you lose access to your authenticator.'}
            </p>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowBackupCodes(!showBackupCodes)}
                className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Eye size={13} />
                <span>{showBackupCodes ? (lang === 'ru' ? 'Скрыть коды' : 'Hide codes') : (lang === 'ru' ? 'Показать коды' : 'View codes')}</span>
              </button>

              <button
                onClick={handleDownloadBackupCodes}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Download size={13} />
                <span>{lang === 'ru' ? 'Скачать .txt' : 'Download .txt'}</span>
              </button>
            </div>

            {/* Expanded Backup Codes list */}
            {showBackupCodes && (
              <div className="mt-3 space-y-2 pt-2 border-t border-[#3d2b4f]/60">
                <div className="grid grid-cols-2 gap-1.5">
                  {currentConfig.backupCodes.map((c, i) => (
                    <div key={i} className="p-1.5 bg-[#0e0a16] border border-[#3d2b4f]/40 rounded-lg text-center font-mono text-xs font-bold text-amber-300">
                      {c}
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleCopyBackupCodes}
                  className="w-full py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Copy size={12} />
                  <span>{lang === 'ru' ? 'Скопировать все' : 'Copy All'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Test Authenticator Code Tool */}
          <div className="p-5 rounded-2xl bg-[#1c152a] border border-[#3d2b4f] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-400" />
                <h5 className="text-xs font-black text-white uppercase tracking-wider">
                  {lang === 'ru' ? 'Тестирование Синхронизации' : 'Test Synchronicity'}
                </h5>
              </div>
              <span className="text-[10px] font-mono text-white/40">
                {secondsRemaining}s
              </span>
            </div>

            <p className="text-xs text-white/50">
              {lang === 'ru' 
                ? 'Проверьте, совпадает ли код из приложения прямо сейчас.' 
                : 'Verify if your phone is currently generating valid codes.'}
            </p>

            <form onSubmit={handleTestActiveCode} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={testCodeInput}
                  onChange={(e) => {
                    setTestCodeInput(e.target.value.replace(/\D/g, ''));
                    setTestResult(null);
                  }}
                  placeholder="000000"
                  className="w-28 py-2 px-3 bg-[#0e0a16] border border-purple-500/40 focus:border-[#ff4d4d] rounded-xl text-center font-mono text-sm font-bold text-white outline-none tracking-widest"
                />
                <button
                  type="submit"
                  disabled={testCodeInput.length !== 6}
                  className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={13} />
                  <span>{lang === 'ru' ? 'Проверить код' : 'Test Code'}</span>
                </button>
              </div>

              {testResult && (
                <div className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                  testResult.success 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                  {testResult.success ? <Check size={13} /> : <AlertTriangle size={13} />}
                  <span>{testResult.message}</span>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
