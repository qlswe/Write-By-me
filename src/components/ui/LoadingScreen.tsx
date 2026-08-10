import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePerfLogger } from '../../utils/logger';
import { Language } from '../../data/translations';
import { ShieldAlert } from 'lucide-react';

interface LoadingScreenProps {
  isLoading: boolean;
  lang: Language;
  lowPerfMode?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ isLoading, lang, lowPerfMode }) => {
  const { trackRender } = usePerfLogger('LoadingScreen');
  trackRender();

  const [progress, setProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState('');

  const stepsRu = [
    'Запуск ядра безопасности...',
    'Установка шифрованного соединения...',
    'Проверка прав доступа и верификации...',
    'Синхронизация защищенных баз данных...',
    'Активация интерфейса...'
  ];

  const stepsEn = [
    'Launching security core...',
    'Establishing encrypted connection...',
    'Verifying credentials & roles...',
    'Synchronizing secure databases...',
    'Readying interface...'
  ];

  const stepsBy = [
    'Запуск ядра бяспекі...',
    'Усталяванне зашыфраванага злучэння...',
    'Праверка правоў доступу і верыфікацыі...',
    'Сінхранізацыя абароненых баз даных...',
    'Актывацыя інтэрфейсу...'
  ];

  const stepsDe = [
    'Sicherheitskern wird gestartet...',
    'Verschlüsselte Verbindung herstellen...',
    'Anmeldeinformationen & Rollen überprüfen...',
    'Sichere Datenbanken synchronisieren...',
    'Schnittstelle wird vorbereitet...'
  ];

  const stepsFr = [
    'Lancement du cœur de sécurité...',
    'Établissement d\'une connexion cryptée...',
    'Vérification des identifiants et rôles...',
    'Synchronisation des bases de données sécurisées...',
    'Préparation de l\'interface...'
  ];

  const stepsZh = [
    '正在启动安全核心...',
    '正在建立加密连接...',
    '正在验证身份与角色...',
    '正在同步加密数据库...',
    '正在就绪界面...'
  ];

  const stepsByLang = {
    ru: stepsRu,
    en: stepsEn,
    by: stepsBy,
    de: stepsDe,
    fr: stepsFr,
    zh: stepsZh
  };

  const steps = stepsByLang[lang] || stepsEn;

  useEffect(() => {
    if (!isLoading) return;
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        const next = p + (Math.random() * 20);
        return next > 100 ? 100 : next;
      });
    }, 350);

    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    const stepIndex = Math.min(
      Math.floor((progress / 100) * steps.length),
      steps.length - 1
    );
    setLoadingStep(steps[stepIndex] || steps[0]);
  }, [progress, steps]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div 
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0, 
            scale: 1.05,
            filter: 'blur(10px)',
            transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } 
          }}
          className="fixed inset-0 z-[99999] bg-[#050505] text-white flex flex-col items-center justify-center overflow-hidden font-sans"
        >
          {/* Beautiful Ambient Glows */}
          {!lowPerfMode && (
            <>
              <motion.div 
                animate={{ 
                  scale: [1, 1.15, 1],
                  opacity: [0.25, 0.45, 0.25]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-[#ff4d4d] rounded-full mix-blend-screen blur-[130px] opacity-35 pointer-events-none" 
              />
              <motion.div 
                animate={{ 
                  scale: [1, 1.25, 1],
                  opacity: [0.15, 0.35, 0.15]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-[45vw] h-[45vw] max-w-[500px] max-h-[500px] bg-[#3d2b4f] rounded-full mix-blend-screen blur-[110px] opacity-25 pointer-events-none" 
              />
            </>
          )}

          {/* Central Animated Loader */}
          <div className="relative z-10 flex flex-col items-center gap-10">
            {/* Pulsating Radio Tower Broadcast Visual (No Texts) */}
            <div className="relative flex items-center justify-center w-48 h-48">
              {/* Pulsating Radio Waves (Broadcasting Signal) */}
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.2, opacity: 0.8 }}
                  animate={{ scale: 2.2, opacity: 0 }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.75,
                    ease: "easeOut"
                  }}
                  className="absolute w-40 h-40 rounded-full border-2 border-[#ff4d4d]/30"
                />
              ))}

              {/* Antenna Core Symbol */}
              <div className="relative w-24 h-24 bg-[#110c1a]/80 border border-[#ff4d4d]/40 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,77,77,0.15)] z-10">
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="w-10 h-10 bg-[#ff4d4d] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,77,77,0.6)]"
                >
                  {/* Central glowing core pin */}
                  <div className="w-4 h-4 bg-white rounded-full animate-ping" />
                </motion.div>
              </div>
            </div>

            {/* Dynamic Sound Equalizer Visualizer (No Texts) */}
            <div className="flex items-end justify-center gap-1.5 h-16 px-6 relative z-10">
              {[...Array(12)].map((_, i) => {
                const duration = 0.5 + Math.random() * 0.8;
                return (
                  <motion.div
                    key={i}
                    animate={{
                      height: [
                        "15%",
                        `${30 + Math.random() * 70}%`,
                        "15%"
                      ]
                    }}
                    transition={{
                      duration: duration,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="w-1.5 bg-gradient-to-t from-[#ff4d4d] via-[#ff7a7a] to-white rounded-full shadow-[0_0_10px_rgba(255,77,77,0.4)]"
                  />
                );
              })}
            </div>

            {/* Clean Progress Bar Container (No Texts) */}
            <div className="relative w-[220px] mt-4">
              <div className="w-full h-[3px] bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-[#ff4d4d] via-red-500 to-white rounded-full shadow-[0_0_10px_rgba(255,77,77,0.5)]"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut", duration: 0.3 }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
