import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Smartphone, KeyRound, Copy, Check, QrCode, 
  Download, ArrowRight, ArrowLeft, AlertTriangle, X, RefreshCw, Lock, Trash2, Sparkles
} from 'lucide-react';
import { ModalPortal } from '../ui/ModalPortal';
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

interface TotpSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  userId: string;
  userEmail: string;
  onTotpStatusChanged?: (enabled: boolean) => void;
}

export const TotpSetupModal: React.FC<TotpSetupModalProps> = ({
  isOpen,
  onClose,
  lang,
  userId,
  userEmail,
  onTotpStatusChanged
}) => {
  const [step, setStep] = useState<'status' | 'setup_qr' | 'setup_backup' | 'setup_verify' | 'view_backups'>('status');
  const [loading, setLoading] = useState(true);
  const [currentConfig, setCurrentConfig] = useState<TotpConfig | null>(null);

  // Setup Draft State
  const [draftSecret, setDraftSecret] = useState('');
  const [draftQrUrl, setDraftQrUrl] = useState('');
  const [draftBackupCodes, setDraftBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isCopiedSecret, setIsCopiedSecret] = useState(false);
  const [isCopiedBackups, setIsCopiedBackups] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(30);

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

  // Load existing TOTP config on open
  useEffect(() => {
    if (!isOpen || !userId) return;

    let mounted = true;
    setLoading(true);

    fetchUserTotpConfig(userId).then(cfg => {
      if (!mounted) return;
      setCurrentConfig(cfg);
      if (cfg && cfg.enabled) {
        setStep('status');
      } else {
        initiateNewSetup();
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [isOpen, userId, userEmail]);

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
    setStep('setup_qr');
  };

  const handleCopySecret = () => {
    if (!draftSecret) return;
    navigator.clipboard.writeText(draftSecret);
    setIsCopiedSecret(true);
    setTimeout(() => setIsCopiedSecret(false), 3000);
  };

  const handleCopyBackupCodes = () => {
    const codes = currentConfig?.enabled ? currentConfig.backupCodes : draftBackupCodes;
    if (!codes || codes.length === 0) return;
    const text = codes.join('\n');
    navigator.clipboard.writeText(text);
    setIsCopiedBackups(true);
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
  };

  const handleConfirmAndActivate = async () => {
    if (!verificationCode || verificationCode.trim().length !== 6) {
      setVerifyError(lang === 'ru' ? 'Введите 6-значный код из приложения' : 'Enter 6-digit code from authenticator app');
      return;
    }

    setIsSubmitting(true);
    setVerifyError(null);

    const isValid = verifyTotpCode(draftSecret, verificationCode.trim(), 1);
    if (!isValid) {
      setIsSubmitting(false);
      setVerifyError(
        lang === 'ru' 
          ? 'Неверный код. Проверьте время на устройстве и попробуйте следующий 6-значный код.' 
          : 'Invalid code. Verify device time sync and try the next code.'
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
    setStep('status');

    if (onTotpStatusChanged) {
      onTotpStatusChanged(true);
    }
  };

  const handleDisableTotp = async () => {
    const confirm = window.confirm(
      lang === 'ru'
        ? 'Вы уверены, что хотите отключить двухфакторную аутентификацию (2FA)? Уровень безопасности аккаунта снизится.'
        : 'Are you sure you want to disable Two-Factor Authentication (2FA)? Your security level will decrease.'
    );
    if (!confirm) return;

    setIsSubmitting(true);
    await disableUserTotp(userId);
    setCurrentConfig(null);
    setIsSubmitting(false);

    if (onTotpStatusChanged) {
      onTotpStatusChanged(false);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-[#15101e] border border-[#3d2b4f] w-full max-w-lg rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden z-10 flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-[#3d2b4f] bg-[#1a1325] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-[#ff4d4d]/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-inner">
                <Smartphone size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white tracking-tight">
                    {lang === 'ru' ? 'Двухфакторная Аутентификация (TOTP)' : 'Two-Factor Authentication (TOTP)'}
                  </h3>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                    RFC 6238
                  </span>
                </div>
                <p className="text-xs text-white/50">
                  {lang === 'ru' 
                    ? 'Google Authenticator, Apple Passwords, Authy, Microsoft Authenticator' 
                    : 'Google Authenticator, Apple Passwords, Authy, Microsoft Authenticator'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 text-white/50 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-white/50 uppercase tracking-widest font-bold">
                  {lang === 'ru' ? 'Загрузка конфигурации 2FA...' : 'Loading 2FA status...'}
                </p>
              </div>
            ) : step === 'status' && currentConfig?.enabled ? (
              /* Already Configured / Status View */
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-4">
                  <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
                    <ShieldCheck size={28} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-emerald-300 uppercase tracking-wider">
                      {lang === 'ru' ? '2FA Активна и Защищает Аккаунт' : '2FA is Active & Protecting Account'}
                    </h4>
                    <p className="text-xs text-white/70 mt-1 leading-relaxed">
                      {lang === 'ru'
                        ? 'При выполнении критических действий и подтверждении в Центре Безопасности будет запрашиваться 6-значный одноразовый код из вашего приложения.'
                        : 'Your account requires a 6-digit one-time passcode from your authenticator app for sensitive actions and security checkpoints.'}
                    </p>
                    <div className="text-[11px] text-white/40 mt-3 font-mono">
                      {lang === 'ru' ? 'Подключено:' : 'Activated:'} {new Date(currentConfig.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Backup Codes Info */}
                <div className="p-4 rounded-2xl bg-[#1c152a] border border-[#3d2b4f] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <KeyRound size={16} className="text-amber-400" />
                      <span className="text-xs font-bold text-white">
                        {lang === 'ru' ? 'Резервные коды восстановления' : 'Backup Recovery Codes'}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {currentConfig.backupCodes.length} {lang === 'ru' ? 'кодов осталось' : 'remaining'}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/50">
                    {lang === 'ru'
                      ? 'Резервные коды можно использовать в случае утери доступа к телефону или приложению аутентификатора.'
                      : 'Backup recovery codes allow you to sign in or perform sensitive actions if you lose access to your phone.'}
                  </p>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setStep('view_backups')}
                      className="px-3.5 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <KeyRound size={13} />
                      <span>{lang === 'ru' ? 'Показать коды' : 'View Codes'}</span>
                    </button>
                    <button
                      onClick={handleDownloadBackupCodes}
                      className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Download size={13} />
                      <span>{lang === 'ru' ? 'Скачать .txt' : 'Download .txt'}</span>
                    </button>
                  </div>
                </div>

                {/* Disable / Reconfigure Actions */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={initiateNewSetup}
                    className="flex-1 py-3 bg-[#15101e] hover:bg-[#251c35] text-purple-300 border border-purple-500/30 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={14} />
                    <span>{lang === 'ru' ? 'Перепривязать Authenticator' : 'Re-link Authenticator'}</span>
                  </button>

                  <button
                    onClick={handleDisableTotp}
                    disabled={isSubmitting}
                    className="py-3 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Trash2 size={14} />
                    <span>{lang === 'ru' ? 'Отключить 2FA' : 'Disable 2FA'}</span>
                  </button>
                </div>
              </div>
            ) : step === 'view_backups' && currentConfig?.enabled ? (
              /* View Backup Codes */
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <KeyRound size={16} />
                    {lang === 'ru' ? 'Ваши Резервные Коды (Одноразовые)' : 'Your Backup Recovery Codes (Single-Use)'}
                  </h4>
                  <button
                    onClick={() => setStep('status')}
                    className="text-xs text-white/50 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft size={13} />
                    <span>{lang === 'ru' ? 'Назад' : 'Back'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-[#0e0a16] p-4 rounded-2xl border border-[#3d2b4f]">
                  {currentConfig.backupCodes.length > 0 ? (
                    currentConfig.backupCodes.map((code, idx) => (
                      <div key={idx} className="p-2 bg-[#1c152a] border border-[#3d2b4f]/60 rounded-xl font-mono text-center text-xs font-bold text-amber-300">
                        {code}
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center text-xs text-white/40 py-4">
                      {lang === 'ru' ? 'Все резервные коды были использованы.' : 'All backup codes have been used.'}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleCopyBackupCodes}
                    className="flex-1 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isCopiedBackups ? <Check size={14} /> : <Copy size={14} />}
                    <span>{isCopiedBackups ? (lang === 'ru' ? 'Скопировано!' : 'Copied!') : (lang === 'ru' ? 'Скопировать все' : 'Copy All')}</span>
                  </button>
                  <button
                    onClick={handleDownloadBackupCodes}
                    className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Download size={14} />
                    <span>{lang === 'ru' ? 'Скачать файл .txt' : 'Download .txt'}</span>
                  </button>
                </div>
              </div>
            ) : step === 'setup_qr' ? (
              /* Step 1: Scan QR Code */
              <div className="space-y-6">
                <div className="space-y-2 text-center">
                  <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">
                    {lang === 'ru' ? 'Шаг 1 из 3 • Сканирование' : 'Step 1 of 3 • Scan QR'}
                  </span>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">
                    {lang === 'ru' ? 'Отсканируйте QR-код в приложении' : 'Scan QR in Authenticator App'}
                  </h4>
                  <p className="text-xs text-white/60 max-w-sm mx-auto">
                    {lang === 'ru'
                      ? 'Откройте Google Authenticator, Microsoft Authenticator или Apple Passwords и добавьте аккаунт через камеру.'
                      : 'Open Google Authenticator, Microsoft Authenticator, or Apple Passwords and add account via camera.'}
                  </p>
                </div>

                {/* QR Code Container */}
                <div className="flex flex-col items-center justify-center p-5 bg-white rounded-3xl w-fit mx-auto shadow-2xl border-4 border-[#ff4d4d]/30">
                  {draftQrUrl ? (
                    <img src={draftQrUrl} alt="TOTP QR Code" className="w-48 h-48 sm:w-56 sm:h-56 block rounded-xl" />
                  ) : (
                    <div className="w-48 h-48 bg-gray-100 flex items-center justify-center text-black font-bold">
                      QR...
                    </div>
                  )}
                </div>

                {/* Secret Key Manual Option */}
                <div className="p-3.5 bg-[#1c152a] rounded-2xl border border-[#3d2b4f] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/60">{lang === 'ru' ? 'Или введите ключ вручную:' : 'Or enter secret manually:'}</span>
                    <button
                      onClick={handleCopySecret}
                      className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {isCopiedSecret ? <Check size={12} /> : <Copy size={12} />}
                      <span>{isCopiedSecret ? (lang === 'ru' ? 'Скопировано' : 'Copied') : (lang === 'ru' ? 'Скопировать' : 'Copy')}</span>
                    </button>
                  </div>
                  <div className="p-2.5 bg-[#0e0a16] rounded-xl font-mono text-center text-sm font-black text-purple-300 tracking-widest break-all select-all">
                    {draftSecret}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setStep('setup_backup')}
                    className="w-full py-3 bg-[#ff4d4d] hover:bg-[#ff6666] text-[#15101e] font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>{lang === 'ru' ? 'Далее: Резервные коды' : 'Next: Backup Codes'}</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            ) : step === 'setup_backup' ? (
              /* Step 2: Backup Codes */
              <div className="space-y-6">
                <div className="space-y-2 text-center">
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
                    {lang === 'ru' ? 'Шаг 2 из 3 • Сохранение Кодов' : 'Step 2 of 3 • Save Codes'}
                  </span>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">
                    {lang === 'ru' ? 'Сохраните Резервные Коды Восстановления' : 'Save Backup Recovery Codes'}
                  </h4>
                  <p className="text-xs text-white/60 max-w-sm mx-auto">
                    {lang === 'ru'
                      ? 'Каждый код может быть использован один раз для входа при потере доступа к приложению аутентификатора.'
                      : 'Each single-use code allows account access if you lose your phone or authenticator.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-[#0e0a16] p-4 rounded-2xl border border-[#3d2b4f]">
                  {draftBackupCodes.map((code, idx) => (
                    <div key={idx} className="p-2.5 bg-[#1c152a] border border-[#3d2b4f]/60 rounded-xl font-mono text-center text-xs font-bold text-amber-300">
                      {code}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleCopyBackupCodes}
                    className="flex-1 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isCopiedBackups ? <Check size={14} /> : <Copy size={14} />}
                    <span>{isCopiedBackups ? (lang === 'ru' ? 'Скопировано!' : 'Copied!') : (lang === 'ru' ? 'Скопировать все' : 'Copy All')}</span>
                  </button>
                  <button
                    onClick={handleDownloadBackupCodes}
                    className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Download size={14} />
                    <span>{lang === 'ru' ? 'Скачать .txt' : 'Download .txt'}</span>
                  </button>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setStep('setup_qr')}
                    className="py-3 px-4 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeft size={14} />
                    <span>{lang === 'ru' ? 'Назад' : 'Back'}</span>
                  </button>

                  <button
                    onClick={() => setStep('setup_verify')}
                    className="flex-1 py-3 bg-[#ff4d4d] hover:bg-[#ff6666] text-[#15101e] font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>{lang === 'ru' ? 'Далее: Проверка Кода' : 'Next: Verify & Activate'}</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            ) : (
              /* Step 3: Verification & Activation */
              <div className="space-y-6">
                <div className="space-y-2 text-center">
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                    {lang === 'ru' ? 'Шаг 3 из 3 • Активация' : 'Step 3 of 3 • Activate'}
                  </span>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">
                    {lang === 'ru' ? 'Подтвердите 6-значный код' : 'Enter 6-digit Code'}
                  </h4>
                  <p className="text-xs text-white/60 max-w-sm mx-auto">
                    {lang === 'ru'
                      ? 'Введите текущий 6-значный код из вашего приложения-аутентификатора для завершения привязки.'
                      : 'Enter current 6-digit code from your authenticator app to finalize setup.'}
                  </p>
                </div>

                {/* 6-Digit Input */}
                <div className="space-y-3">
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
                      className="w-52 py-3 px-4 bg-[#0e0a16] border-2 border-purple-500/50 focus:border-[#ff4d4d] rounded-2xl text-2xl font-mono text-center font-black tracking-[0.3em] text-white outline-none shadow-inner transition-colors"
                    />
                  </div>

                  {/* 30-Second Refresh Indicator */}
                  <div className="flex items-center justify-center gap-2 text-[11px] text-white/40">
                    <RefreshCw size={11} className="animate-spin" />
                    <span>
                      {lang === 'ru' ? `Код обновится через ${secondsRemaining} сек` : `Code rotates in ${secondsRemaining}s`}
                    </span>
                  </div>

                  {verifyError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                      <AlertTriangle size={14} className="shrink-0" />
                      <span>{verifyError}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setStep('setup_backup')}
                    className="py-3 px-4 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeft size={14} />
                    <span>{lang === 'ru' ? 'Назад' : 'Back'}</span>
                  </button>

                  <button
                    onClick={handleConfirmAndActivate}
                    disabled={isSubmitting || verificationCode.length !== 6}
                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-[#15101e] font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-[#15101e] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles size={16} />
                    )}
                    <span>{lang === 'ru' ? 'Активировать 2FA' : 'Activate 2FA'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </ModalPortal>
  );
};
