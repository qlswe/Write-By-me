import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, ShieldAlert, ShieldX, CheckCircle2, AlertTriangle, 
  RefreshCw, Mail, Smartphone, Fingerprint, Lock, Bot, KeyRound, 
  Send, ExternalLink, X, ChevronRight, Sparkles, Check, Key
} from 'lucide-react';
import { ModalPortal } from '../ui/ModalPortal';
import { Language } from '../../data/translations';
import { useAuth } from '../../hooks/useAuth';
import { 
  evaluateAccountSecurity, 
  trustCurrentDevice, 
  isCurrentDeviceTrusted, 
  AccountSecurityReport 
} from '../../utils/accountSecurity';
import { getDeviceId } from '../../utils/deviceId';
import { fetchUserTotpConfig, verifyAndConsumeTotpOrBackup, TotpConfig } from '../../utils/totp';
import { TotpSetupModal } from './TotpSetupModal';

interface AccountSecurityCheckpointProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  requiredActionName?: string;
  onVerificationSuccess?: () => void;
}

export const AccountSecurityCheckpoint: React.FC<AccountSecurityCheckpointProps> = ({
  isOpen,
  onClose,
  lang,
  requiredActionName,
  onVerificationSuccess
}) => {
  const { user, isVerified, isAdmin, role, sendVerificationEmail, reloadUser } = useAuth();
  
  const [report, setReport] = useState<AccountSecurityReport>(() => evaluateAccountSecurity(user));
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isHumanVerified, setIsHumanVerified] = useState(false);
  const [isDeviceTrustedState, setIsDeviceTrustedState] = useState(false);
  
  // TOTP State
  const [totpConfig, setTotpConfig] = useState<TotpConfig | null>(null);
  const [isTotpSetupModalOpen, setIsTotpSetupModalOpen] = useState(false);
  const [totpInputCode, setTotpInputCode] = useState('');
  const [isTotpVerified, setIsTotpVerified] = useState(false);
  const [totpError, setTotpError] = useState<string | null>(null);
  const [isVerifyingTotp, setIsVerifyingTotp] = useState(false);
  const [usedBackupCode, setUsedBackupCode] = useState(false);

  const currentDeviceId = useMemo(() => getDeviceId(), []);

  const runDiagnostics = async () => {
    let currentTotp: TotpConfig | null = null;
    if (user?.uid) {
      currentTotp = await fetchUserTotpConfig(user.uid);
      setTotpConfig(currentTotp);
      setIsDeviceTrustedState(isCurrentDeviceTrusted(user.uid));
    }
    const updated = evaluateAccountSecurity(user, { totp: currentTotp });
    setReport(updated);
  };

  useEffect(() => {
    if (isOpen) {
      runDiagnostics();
      setTotpInputCode('');
      setTotpError(null);
      setIsTotpVerified(false);
      setUsedBackupCode(false);
    }
  }, [isOpen, user, isVerified]);

  const handleSendVerificationEmail = async () => {
    setIsVerifyingEmail(true);
    try {
      await sendVerificationEmail();
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 8000);
    } catch (e) {
      console.warn('sendVerificationEmail error:', e);
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handleCheckEmailStatus = async () => {
    setIsVerifyingEmail(true);
    try {
      await reloadUser();
      await runDiagnostics();
      if (user?.emailVerified) {
        if (onVerificationSuccess) onVerificationSuccess();
      }
    } catch (e) {
      console.warn('reloadUser error:', e);
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handleTrustDevice = () => {
    if (user) {
      trustCurrentDevice(user.uid, 30);
      setIsDeviceTrustedState(true);
      runDiagnostics();
    }
  };

  const handleSolveHumanPuzzle = () => {
    setIsHumanVerified(true);
    runDiagnostics();
  };

  const handleVerifyTotpSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user?.uid || !totpInputCode) return;

    setIsVerifyingTotp(true);
    setTotpError(null);

    try {
      const result = await verifyAndConsumeTotpOrBackup(user.uid, totpInputCode);
      if (result.success) {
        setIsTotpVerified(true);
        setUsedBackupCode(result.isBackupCode);
        await runDiagnostics();
      } else {
        setTotpError(result.error || (lang === 'ru' ? 'Неверный код 2FA' : 'Invalid 2FA code'));
      }
    } catch (err: any) {
      setTotpError(err.message || 'Verification failed');
    } finally {
      setIsVerifyingTotp(false);
    }
  };

  if (!isOpen) return null;

  const isTotpRequiredAndUnverified = !!totpConfig?.enabled && !isTotpVerified;

  const scoreColor = report.score >= 85 
    ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' 
    : report.score >= 60 
    ? 'text-amber-400 border-amber-500/40 bg-amber-500/10' 
    : 'text-red-400 border-red-500/40 bg-red-500/10';

  const isAccessAllowed = 
    (report.status === 'passed' || (report.status === 'warning' && (isVerified || isAdmin))) &&
    !isTotpRequiredAndUnverified;

  return (
    <>
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

          {/* Modal Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="relative bg-[#15101e] border border-[#3d2b4f] w-full max-w-2xl rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden z-10 flex flex-col max-h-[92vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-[#3d2b4f] bg-[#1a1325] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-inner">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white tracking-tight">
                      {lang === 'ru' ? 'Центр Безопасности Аккаунта' : 'Account Security Gate'}
                    </h3>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
                      AHA-v4 Guard
                    </span>
                  </div>
                  <p className="text-xs text-white/50">
                    {requiredActionName 
                      ? (lang === 'ru' ? `Проверка профиля перед действием: ${requiredActionName}` : `Profile verification for: ${requiredActionName}`)
                      : (lang === 'ru' ? 'Многоуровневая верификация и защита профиля' : 'Multi-layered profile verification & protection')}
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
              {/* Score Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center ${scoreColor}`}>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
                    {lang === 'ru' ? 'Индекс Защиты' : 'Security Score'}
                  </span>
                  <div className="text-3xl sm:text-4xl font-black mt-1">
                    {report.score}<span className="text-sm font-normal opacity-60">/100</span>
                  </div>
                  <span className="text-[11px] font-bold mt-1">
                    {report.score >= 85 ? (lang === 'ru' ? 'Отличный уровень' : 'High Trust') : (lang === 'ru' ? 'Требуется проверка' : 'Action Needed')}
                  </span>
                </div>

                <div className="sm:col-span-2 p-4 rounded-2xl bg-[#1c152a] border border-[#3d2b4f] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white/80">
                      {lang === 'ru' ? 'Статус Доступа' : 'Access Authorization'}
                    </span>
                    <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      isAccessAllowed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {isAccessAllowed ? (lang === 'ru' ? 'Доступ Разрешён' : 'Granted') : (lang === 'ru' ? 'Ограничено' : 'Restricted')}
                    </span>
                  </div>
                  
                  <div className="text-xs text-white/60 mt-2 space-y-1">
                    <div>• {lang === 'ru' ? 'Пройдено проверок:' : 'Checks passed:'} <strong className="text-white">{report.checks.filter(c => c.passed).length} / {report.checks.length}</strong></div>
                    <div>• 2FA TOTP: <strong className={totpConfig?.enabled ? 'text-emerald-400' : 'text-amber-400'}>{totpConfig?.enabled ? (lang === 'ru' ? 'Подключена' : 'Linked') : (lang === 'ru' ? 'Отключена' : 'Not linked')}</strong></div>
                    <div>• {lang === 'ru' ? 'Устройство:' : 'Device:'} <strong className={isDeviceTrustedState ? 'text-emerald-400' : 'text-amber-400'}>{isDeviceTrustedState ? (lang === 'ru' ? 'Доверенное (30 дней)' : 'Trusted (30 days)') : (lang === 'ru' ? 'Не авторизовано' : 'Unregistered')}</strong></div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={runDiagnostics}
                      className="text-xs font-bold text-[#ff4d4d] hover:text-[#ff7a7a] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RefreshCw size={12} />
                      <span>{lang === 'ru' ? 'Перепроверить статус' : 'Re-run diagnostic'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 2FA Verification Form for Sensitive Actions (Mandatory when TOTP is active) */}
              {totpConfig?.enabled && (
                <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isTotpVerified 
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : 'bg-purple-950/30 border-purple-500/40 shadow-lg'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl ${isTotpVerified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-purple-500/20 text-purple-300'}`}>
                        <Smartphone size={20} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-white">
                          {lang === 'ru' ? 'Подтверждение через Authenticator (2FA)' : 'Authenticator 2FA Verification'}
                        </h4>
                        <p className="text-[11px] text-white/50 mt-0.5">
                          {isTotpVerified 
                            ? (lang === 'ru' ? (usedBackupCode ? 'Подтверждено резервным кодом' : 'Код аутентификатора успешно подтвержден!') : '2FA verified!')
                            : (lang === 'ru' ? 'Введите 6-значный код из Google Authenticator или резервный код' : 'Enter 6-digit code from Google Authenticator or backup code')}
                        </p>
                      </div>
                    </div>

                    {isTotpVerified && (
                      <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1">
                        <Check size={14} />
                        <span>{lang === 'ru' ? 'Проверено' : 'Verified'}</span>
                      </span>
                    )}
                  </div>

                  {!isTotpVerified && (
                    <form onSubmit={handleVerifyTotpSubmit} className="mt-4 space-y-3">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={totpInputCode}
                          onChange={(e) => {
                            setTotpInputCode(e.target.value);
                            if (totpError) setTotpError(null);
                          }}
                          placeholder={lang === 'ru' ? '6 цифр или Резервный код' : '6 digits or Backup code'}
                          className="flex-1 py-2.5 px-4 bg-[#0e0a16] border border-purple-500/40 focus:border-[#ff4d4d] rounded-xl text-center sm:text-left font-mono text-base font-bold text-white outline-none tracking-widest"
                        />
                        <button
                          type="submit"
                          disabled={isVerifyingTotp || !totpInputCode.trim()}
                          className="py-2.5 px-5 bg-gradient-to-r from-purple-600 to-[#ff4d4d] hover:from-purple-500 hover:to-[#ff6666] disabled:opacity-40 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {isVerifyingTotp ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <KeyRound size={14} />
                          )}
                          <span>{lang === 'ru' ? 'Подтвердить код' : 'Verify Code'}</span>
                        </button>
                      </div>

                      {totpError && (
                        <p className="text-xs text-red-400 font-bold flex items-center gap-1">
                          <AlertTriangle size={13} />
                          <span>{totpError}</span>
                        </p>
                      )}
                    </form>
                  )}
                </div>
              )}

              {/* Checklist of Real-Time Checks */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-white/60">
                  {lang === 'ru' ? 'Результаты Проверок Безопасности' : 'Security Vector Analysis'}
                </h4>

                <div className="space-y-2">
                  {report.checks.map(chk => (
                    <div 
                      key={chk.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                        chk.passed 
                          ? 'bg-[#1c152a]/60 border-[#3d2b4f]/60 text-white/90' 
                          : chk.severity === 'critical'
                          ? 'bg-red-500/10 border-red-500/30 text-red-300'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0">
                          {chk.passed ? (
                            <CheckCircle2 size={18} className="text-emerald-400" />
                          ) : chk.severity === 'critical' ? (
                            <ShieldX size={18} className="text-red-400" />
                          ) : (
                            <AlertTriangle size={18} className="text-amber-400" />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold">
                            {lang === 'ru' ? chk.nameRu : chk.name}
                          </div>
                          <div className="text-[11px] text-white/50 mt-0.5">
                            {lang === 'ru' ? chk.detailsRu : chk.details}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      {!chk.passed && chk.id === 'totp_2fa' && (
                        <button
                          onClick={() => setIsTotpSetupModalOpen(true)}
                          className="shrink-0 px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                        >
                          <Smartphone size={11} />
                          <span>{lang === 'ru' ? 'Включить 2FA' : 'Enable 2FA'}</span>
                        </button>
                      )}

                      {!chk.passed && chk.id === 'email_verification' && (
                        <div className="shrink-0 flex items-center gap-1.5">
                          <button
                            onClick={handleSendVerificationEmail}
                            disabled={isVerifyingEmail}
                            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                          >
                            <Send size={11} />
                            <span>{emailSent ? (lang === 'ru' ? 'Отправлено!' : 'Sent!') : (lang === 'ru' ? 'Отправить код' : 'Send email')}</span>
                          </button>
                          <button
                            onClick={handleCheckEmailStatus}
                            disabled={isVerifyingEmail}
                            title={lang === 'ru' ? 'Проверить подтверждение' : 'Check status'}
                            className="p-1 hover:bg-white/10 text-white/70 rounded-lg transition-colors cursor-pointer"
                          >
                            <RefreshCw size={13} className={isVerifyingEmail ? 'animate-spin' : ''} />
                          </button>
                        </div>
                      )}

                      {!chk.passed && chk.id === 'device_trust' && (
                        <button
                          onClick={handleTrustDevice}
                          className="shrink-0 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Fingerprint size={12} />
                          <span>{lang === 'ru' ? 'Доверять' : 'Trust Device'}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Human Biometrics Challenge */}
              {!isHumanVerified && (
                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <Bot size={18} className="text-purple-400" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-purple-300">
                      {lang === 'ru' ? 'Интерактивная Проверка Человека (AHA Biometrics)' : 'Interactive Human Check (AHA Biometrics)'}
                    </h4>
                  </div>
                  <p className="text-xs text-white/70">
                    {lang === 'ru' 
                      ? 'Нажмите на подтверждающий токен ниже, чтобы синхронизировать криптографический ключ сессии и подтвердить отсутствие ботов.' 
                      : 'Click the verification token below to synchronize your session cryptographic key and confirm human interaction.'}
                  </p>

                  <button
                    onClick={handleSolveHumanPuzzle}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-[#ff4d4d] hover:from-purple-500 hover:to-[#ff6666] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Sparkles size={16} />
                    <span>{lang === 'ru' ? 'Я человек — Подтвердить Сессию' : 'I am human — Confirm Session'}</span>
                  </button>
                </div>
              )}

              {isHumanVerified && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <Check size={16} />
                  <span>{lang === 'ru' ? 'Интерактивная проверка на бота успешно пройдена!' : 'Human biometric check verified!'}</span>
                </div>
              )}

              {/* Device Details Card */}
              <div className="p-4 rounded-2xl bg-[#1c152a] border border-[#3d2b4f] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white/70">{lang === 'ru' ? 'Аппаратный Device ID' : 'Hardware Device ID'}</span>
                  <span className="font-mono text-purple-300 text-[11px] truncate max-w-[200px]">{currentDeviceId}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white/70">{lang === 'ru' ? 'Статус Доверия' : 'Trust Status'}</span>
                  <span className={isDeviceTrustedState ? 'text-emerald-400 font-bold' : 'text-white/40'}>
                    {isDeviceTrustedState ? (lang === 'ru' ? 'Авторизован на 30 дней' : 'Authorized for 30 days') : (lang === 'ru' ? 'Временный доступ' : 'Transient Session')}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#3d2b4f] bg-[#1a1325] flex items-center justify-between gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 hover:bg-white/5 text-white/60 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {lang === 'ru' ? 'Закрыть' : 'Close'}
              </button>

              <button
                onClick={() => {
                  if (onVerificationSuccess) onVerificationSuccess();
                  onClose();
                }}
                disabled={!isAccessAllowed}
                className="px-5 py-2.5 bg-[#ff4d4d] hover:bg-[#ff6666] disabled:opacity-40 disabled:hover:bg-[#ff4d4d] text-[#15101e] font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#ff4d4d]/20 flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>{lang === 'ru' ? 'Продолжить с доступом' : 'Proceed with Access'}</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </motion.div>
        </div>
      </ModalPortal>

      {/* TOTP Setup Modal Nested Handler */}
      {user && (
        <TotpSetupModal
          isOpen={isTotpSetupModalOpen}
          onClose={() => {
            setIsTotpSetupModalOpen(false);
            runDiagnostics();
          }}
          lang={lang}
          userId={user.uid}
          userEmail={user.email || ''}
          onTotpStatusChanged={() => {
            runDiagnostics();
          }}
        />
      )}
    </>
  );
};
