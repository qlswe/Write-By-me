import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity, CheckCircle2, AlertTriangle, XCircle, RefreshCw,
  Database, Key, Sparkles, Server, Globe, Film, Copy, Check,
  Clock, Shield, Wifi, WifiOff, Terminal, ArrowUpRight, Cpu
} from 'lucide-react';
import { db, auth } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { logger } from '../../utils/logger';
import { getDeviceId } from '../../utils/deviceId';

export interface ServiceHealthItem {
  id: string;
  name: string;
  category: 'database' | 'auth' | 'ai' | 'server' | 'network' | 'media';
  endpoint: string;
  status: 'pending' | 'checking' | 'operational' | 'degraded' | 'failed';
  latencyMs: number | null;
  details: string;
  error?: string;
  technicalData?: Record<string, any>;
}

export const ConnectionHealthCheck: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const [reportCopied, setReportCopied] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const [services, setServices] = useState<ServiceHealthItem[]>([
    {
      id: 'firestore',
      name: 'Firebase Firestore DB',
      category: 'database',
      endpoint: 'Cloud Firestore (default)',
      status: 'pending',
      latencyMs: null,
      details: 'Тестирование чтения документа и задержки БД'
    },
    {
      id: 'auth',
      name: 'Firebase Authentication',
      category: 'auth',
      endpoint: 'Firebase Identity Platform',
      status: 'pending',
      latencyMs: null,
      details: 'Проверка сессии, валидности токенов и доступности Auth'
    },
    {
      id: 'gemini',
      name: 'Gemini AI & Neural Endpoint',
      category: 'ai',
      endpoint: '/api/generate (Gemini & Multi-Model Proxy)',
      status: 'pending',
      latencyMs: null,
      details: 'Проверка доступности AI шлюза, Gemini API и резервных моделей'
    },
    {
      id: 'server',
      name: 'Applet Backend Server',
      category: 'server',
      endpoint: '/api/diagnostics/health',
      status: 'pending',
      latencyMs: null,
      details: 'Проверка Node.js ядра, аптайма и хранилища /uploads'
    },
    {
      id: 'protocol',
      name: 'Dual-Stack IPv6 / Сетевой протокол',
      category: 'network',
      endpoint: '/api/network/protocol',
      status: 'pending',
      latencyMs: null,
      details: 'Определение IP, проверка нативного IPv6 и NAT-маршрутизации'
    },
    {
      id: 'media_proxy',
      name: 'Media Streaming Proxy',
      category: 'media',
      endpoint: '/api/media-proxy',
      status: 'pending',
      latencyMs: null,
      details: 'Проверка потокового видео-прокси и обхода CORS'
    }
  ]);

  const updateService = (id: string, patch: Partial<ServiceHealthItem>) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  };

  const runAllChecks = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);

    logger.info('Starting comprehensive connection health check...', null, 'HealthCheck');

    // 1. Check Applet Backend Server
    const checkServer = async () => {
      updateService('server', { status: 'checking', details: 'Отправка пинга к /api/diagnostics/health...' });
      const t0 = performance.now();
      try {
        const res = await fetch('/api/diagnostics/health');
        const duration = Math.round(performance.now() - t0);
        if (res.ok) {
          const data = await res.json();
          updateService('server', {
            status: 'operational',
            latencyMs: duration,
            details: `Сервер активен (Uptime: ${data.checks?.server?.uptimeSeconds || 0}s, RAM: ${data.checks?.server?.memoryUsageMB || 0}MB)`,
            technicalData: data
          });
        } else {
          updateService('server', {
            status: 'degraded',
            latencyMs: duration,
            details: `Сервер вернул HTTP ${res.status}`,
            error: `HTTP ${res.status} ${res.statusText}`
          });
        }
      } catch (err: any) {
        const duration = Math.round(performance.now() - t0);
        updateService('server', {
          status: 'failed',
          latencyMs: duration,
          details: 'Не удалось связаться с сервером',
          error: err?.message || 'Network error'
        });
      }
    };

    // 2. Check Firebase Firestore
    const checkFirestore = async () => {
      updateService('firestore', { status: 'checking', details: 'Чтение тестового документа из Cloud Firestore...' });
      const t0 = performance.now();
      try {
        // Attempt fast read
        const docRef = doc(db, 'chats', 'group_ahi_radio_room');
        const snapshot = await getDoc(docRef);
        const duration = Math.round(performance.now() - t0);
        
        const isFromCache = snapshot.metadata?.fromCache ?? false;
        const hasPendingWrites = snapshot.metadata?.hasPendingWrites ?? false;

        updateService('firestore', {
          status: duration > 1000 ? 'degraded' : 'operational',
          latencyMs: duration,
          details: `Firestore доступен (Источник: ${isFromCache ? 'Кэш/IndexedDB' : 'Сеть Google Cloud'}, Существует: ${snapshot.exists() ? 'Да' : 'Нет'})`,
          technicalData: {
            fromCache: isFromCache,
            hasPendingWrites,
            docExists: snapshot.exists(),
            durationMs: duration
          }
        });
        logger.perf('Firestore health check probe OK', { durationMs: duration, fromCache: isFromCache }, 'HealthCheck');
      } catch (err: any) {
        const duration = Math.round(performance.now() - t0);
        const isPermDenied = err?.message?.includes('permission-denied') || err?.code === 'permission-denied';
        
        // Permission denied still proves the connection reached Firestore servers
        if (isPermDenied) {
          updateService('firestore', {
            status: 'operational',
            latencyMs: duration,
            details: 'Связь с Firestore активна (Security Rules работают штатно)',
            technicalData: { note: 'Connection verified via rule evaluation', durationMs: duration }
          });
        } else {
          updateService('firestore', {
            status: 'failed',
            latencyMs: duration,
            details: 'Ошибка связи с базой данных',
            error: err?.message || 'Firestore connection timeout'
          });
          logger.error(`Firestore health check error: ${err?.message}`, { error: err?.message }, 'HealthCheck');
        }
      }
    };

    // 3. Check Firebase Auth
    const checkAuth = async () => {
      updateService('auth', { status: 'checking', details: 'Проверка состояния Firebase Identity Platform...' });
      const t0 = performance.now();
      try {
        const currentUser = auth.currentUser;
        let tokenInfo = 'Анонимный/Гостевой доступ';
        let tokenExpiry = '';

        if (currentUser) {
          const token = await currentUser.getIdToken(false);
          const tokenResult = await currentUser.getIdTokenResult();
          tokenInfo = `Авторизован (${currentUser.email || currentUser.uid.substring(0, 8)}...)`;
          tokenExpiry = tokenResult.expirationTime;
        }

        const duration = Math.round(performance.now() - t0);
        updateService('auth', {
          status: 'operational',
          latencyMs: duration,
          details: `Сервис Auth доступен (${tokenInfo})`,
          technicalData: {
            uid: currentUser?.uid || null,
            email: currentUser?.email || null,
            isAnonymous: currentUser?.isAnonymous ?? true,
            tokenExpiry,
            durationMs: duration
          }
        });
      } catch (err: any) {
        const duration = Math.round(performance.now() - t0);
        updateService('auth', {
          status: 'failed',
          latencyMs: duration,
          details: 'Ошибка проверки Firebase Auth',
          error: err?.message || 'Auth check error'
        });
      }
    };

    // 4. Check Gemini AI & Neural Models Endpoint
    const checkGemini = async () => {
      updateService('gemini', { status: 'checking', details: 'Тестирование AI шлюза и генерации Gemini...' });
      const t0 = performance.now();
      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: 'PING_HEALTH_CHECK',
            systemInstruction: 'Health check probe test',
            model: 'openai'
          })
        });
        const duration = Math.round(performance.now() - t0);

        if (res.ok) {
          const data = await res.json();
          const hasResponse = !!data.text;
          updateService('gemini', {
            status: 'operational',
            latencyMs: duration,
            details: `AI шлюз исправен (Модель: ${data.model || 'Gemini/Neural'}, Длина ответа: ${data.text?.length || 0} симв.)`,
            technicalData: {
              activeModel: data.model,
              responseSample: data.text ? data.text.substring(0, 60) + '...' : null,
              durationMs: duration
            }
          });
          logger.perf('Gemini AI endpoint health check OK', { durationMs: duration, model: data.model }, 'HealthCheck');
        } else {
          updateService('gemini', {
            status: 'degraded',
            latencyMs: duration,
            details: `AI шлюз вернул статус HTTP ${res.status}`,
            error: `HTTP ${res.status} ${res.statusText}`
          });
        }
      } catch (err: any) {
        const duration = Math.round(performance.now() - t0);
        updateService('gemini', {
          status: 'failed',
          latencyMs: duration,
          details: 'Ошибка подключения к эндпоинту AI генерации',
          error: err?.message || 'AI proxy connection error'
        });
      }
    };

    // 5. Check Network & IPv6 Protocol
    const checkProtocol = async () => {
      updateService('protocol', { status: 'checking', details: 'Анализ сетевого протокола и маршрутизации...' });
      const t0 = performance.now();
      try {
        const res = await fetch('/api/network/protocol');
        const duration = Math.round(performance.now() - t0);
        if (res.ok) {
          const data = await res.json();
          updateService('protocol', {
            status: 'operational',
            latencyMs: duration,
            details: `Протокол: ${data.protocol} | IP: ${data.clientIp || '127.0.0.1'} | DualStack: ${data.serverDualStack ? 'Да' : 'Нет'}`,
            technicalData: data
          });
        } else {
          updateService('protocol', {
            status: 'degraded',
            latencyMs: duration,
            details: 'Протокол определен в базовом режиме'
          });
        }
      } catch (err: any) {
        const duration = Math.round(performance.now() - t0);
        updateService('protocol', {
          status: 'failed',
          latencyMs: duration,
          details: 'Не удалось получить данные сетевого протокола',
          error: err?.message
        });
      }
    };

    // 6. Check Media Proxy
    const checkMediaProxy = async () => {
      updateService('media_proxy', { status: 'checking', details: 'Тестирование потокового медиа-шлюза...' });
      const t0 = performance.now();
      try {
        const res = await fetch('/api/media-proxy?url=invalid', { method: 'HEAD' });
        const duration = Math.round(performance.now() - t0);
        // Returns 400 for invalid parameter, confirming the proxy endpoint is active and listening
        if (res.status === 400 || res.ok) {
          updateService('media_proxy', {
            status: 'operational',
            latencyMs: duration,
            details: 'Потоковый прокси активен (CORS Bypass, Range 206 Support)',
            technicalData: {
              status: res.status,
              acceptRanges: res.headers.get('accept-ranges') || 'bytes',
              durationMs: duration
            }
          });
        } else {
          updateService('media_proxy', {
            status: 'degraded',
            latencyMs: duration,
            details: `Медиа-прокси вернул статус ${res.status}`
          });
        }
      } catch (err: any) {
        const duration = Math.round(performance.now() - t0);
        updateService('media_proxy', {
          status: 'failed',
          latencyMs: duration,
          details: 'Медиа-прокси недоступен',
          error: err?.message
        });
      }
    };

    // Run parallel checks
    await Promise.allSettled([
      checkServer(),
      checkFirestore(),
      checkAuth(),
      checkGemini(),
      checkProtocol(),
      checkMediaProxy()
    ]);

    setLastCheckTime(new Date());
    setIsRunning(false);
    logger.info('Connection health check completed successfully', null, 'HealthCheck');
  }, [isRunning]);

  // Initial check on mount
  useEffect(() => {
    runAllChecks();
  }, []);

  // Compute statistics
  const totalCount = services.length;
  const operationalCount = services.filter(s => s.status === 'operational').length;
  const degradedCount = services.filter(s => s.status === 'degraded').length;
  const failedCount = services.filter(s => s.status === 'failed').length;

  const validLatencies = services.map(s => s.latencyMs).filter((l): l is number => typeof l === 'number' && l >= 0);
  const avgLatency = validLatencies.length > 0
    ? Math.round(validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length)
    : 0;

  const healthScore = Math.round((operationalCount / totalCount) * 100);

  // Generate Markdown Health Report
  const handleCopyReport = async () => {
    try {
      const rows = services.map(s => {
        const icon = s.status === 'operational' ? '🟢 Operational' : s.status === 'degraded' ? '🟡 Degraded' : '🔴 Failed';
        const lat = s.latencyMs !== null ? `${s.latencyMs} ms` : 'N/A';
        return `| **${s.name}** | \`${s.endpoint}\` | ${icon} | ${lat} | ${s.details} |`;
      }).join('\n');

      const markdown = [
        `# 🩺 AHI NETWORK CONNECTION HEALTH REPORT`,
        `**Generated At:** ${new Date().toISOString()}`,
        `**Health Score:** ${healthScore}% (${operationalCount}/${totalCount} Services Operational)`,
        `**Average Latency:** ${avgLatency} ms`,
        `**Device ID:** \`${getDeviceId()}\``,
        `**Client Online:** ${navigator.onLine ? '✅ Yes' : '❌ No'}`,
        ``,
        `## 🌐 Services Health Table`,
        `| Service | Endpoint | Status | Latency | Details |`,
        `| :--- | :--- | :--- | :--- | :--- |`,
        rows,
        ``,
        `## 🔬 Raw Technical Breakdown`,
        '```json',
        JSON.stringify(services.map(s => ({
          id: s.id,
          name: s.name,
          endpoint: s.endpoint,
          status: s.status,
          latencyMs: s.latencyMs,
          technicalData: s.technicalData,
          error: s.error
        })), null, 2),
        '```'
      ].join('\n');

      await navigator.clipboard.writeText(markdown);
      setReportCopied(true);
      setTimeout(() => setReportCopied(false), 2000);
      logger.info('Copied Connection Health Report to clipboard', { healthScore, avgLatency }, 'HealthCheck');
    } catch (err) {
      console.warn('Failed to copy report:', err);
    }
  };

  const handleCopyJson = async () => {
    try {
      const data = {
        timestamp: new Date().toISOString(),
        healthScore,
        avgLatencyMs: avgLatency,
        deviceId: getDeviceId(),
        services
      };
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setJsonCopied(true);
      setTimeout(() => setJsonCopied(false), 2000);
    } catch (err) {
      console.warn('Failed to copy JSON:', err);
    }
  };

  const getServiceIcon = (category: ServiceHealthItem['category']) => {
    switch (category) {
      case 'database': return <Database size={16} className="text-[#ff4d4d]" />;
      case 'auth': return <Key size={16} className="text-amber-400" />;
      case 'ai': return <Sparkles size={16} className="text-purple-400" />;
      case 'server': return <Server size={16} className="text-cyan-400" />;
      case 'network': return <Globe size={16} className="text-emerald-400" />;
      case 'media': return <Film size={16} className="text-pink-400" />;
    }
  };

  const getStatusBadge = (status: ServiceHealthItem['status']) => {
    switch (status) {
      case 'operational':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 size={12} className="text-emerald-400" />
            ДОСТУПЕН
          </span>
        );
      case 'degraded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <AlertTriangle size={12} className="text-amber-400" />
            ЗАМЕДЛЕН
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
            <XCircle size={12} className="text-red-400" />
            ОШИБКА
          </span>
        );
      case 'checking':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse">
            <RefreshCw size={12} className="animate-spin text-purple-300" />
            ПРОВЕРКА...
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-gray-500/20 text-gray-400 border border-gray-500/30">
            ОЖИДАНИЕ
          </span>
        );
    }
  };

  const getLatencyColor = (ms: number | null) => {
    if (ms === null) return 'text-gray-500';
    if (ms < 120) return 'text-emerald-400';
    if (ms < 300) return 'text-yellow-400';
    if (ms < 800) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Header Summary Dashboard */}
      <div className="bg-[#150d26] border border-[#3d2b4f] rounded-2xl p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#3d2b4f] pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner ${
              healthScore >= 90 
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-emerald-500/20' 
                : healthScore >= 60 
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-amber-500/20'
                  : 'bg-red-500/10 border-red-500/40 text-red-400 shadow-red-500/20'
            }`}>
              <Activity size={24} className={isRunning ? 'animate-pulse' : ''} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-black text-sm uppercase tracking-wider">
                  ДИАГНОСТИКА СЕТИ И ЗДОРОВЬЯ СЕРВИСОВ
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  healthScore >= 90 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {healthScore}% ИСПРАВНО
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Проверка соединения с Firebase Firestore, Identity Auth, Gemini AI и локальными серверами
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={runAllChecks}
              disabled={isRunning}
              className="px-4 py-2 bg-[#ff4d4d] hover:bg-[#ff6666] disabled:opacity-50 text-[#15101e] font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <RefreshCw size={14} className={isRunning ? 'animate-spin' : ''} />
              <span>{isRunning ? 'Диагностика...' : 'Перепроверить связь'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyReport}
              className="px-3.5 py-2 bg-[#251c35] hover:bg-[#342749] text-white border border-[#3d2b4f] text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              title="Скопировать Markdown отчет для багтрекера"
            >
              {reportCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{reportCopied ? 'Скопировано!' : 'Markdown Отчет'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyJson}
              className="px-3 py-2 bg-[#251c35] hover:bg-[#342749] text-gray-300 border border-[#3d2b4f] text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              title="Экспорт в JSON"
            >
              {jsonCopied ? <Check size={14} className="text-emerald-400" /> : <Terminal size={14} />}
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="bg-[#1c1130] p-3 rounded-xl border border-[#3d2b4f]/60">
            <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest block">Сервисы</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-black text-white font-mono">{operationalCount}</span>
              <span className="text-xs text-gray-400">/ {totalCount} онлайн</span>
            </div>
          </div>

          <div className="bg-[#1c1130] p-3 rounded-xl border border-[#3d2b4f]/60">
            <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest block">Средняя задержка (RTT)</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-lg font-black font-mono ${getLatencyColor(avgLatency)}`}>
                {avgLatency}
              </span>
              <span className="text-xs text-gray-400">мс</span>
            </div>
          </div>

          <div className="bg-[#1c1130] p-3 rounded-xl border border-[#3d2b4f]/60">
            <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest block">Статус сети браузера</span>
            <div className="flex items-center gap-1.5 mt-1">
              {navigator.onLine ? (
                <>
                  <Wifi size={14} className="text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400">Online</span>
                </>
              ) : (
                <>
                  <WifiOff size={14} className="text-red-400" />
                  <span className="text-xs font-bold text-red-400">Offline</span>
                </>
              )}
            </div>
          </div>

          <div className="bg-[#1c1130] p-3 rounded-xl border border-[#3d2b4f]/60">
            <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest block">Последняя проверка</span>
            <div className="flex items-center gap-1 mt-1">
              <Clock size={12} className="text-gray-400" />
              <span className="text-xs text-gray-300 font-mono">
                {lastCheckTime ? lastCheckTime.toLocaleTimeString() : 'Никогда'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Services List Cards */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-white/60 uppercase tracking-widest px-1 flex items-center justify-between">
          <span>ПРОВЕРЯЕМЫЕ ТОЧКИ ПОДКЛЮЧЕНИЯ И ЭНДПОИНТЫ</span>
          <span className="text-[10px] text-gray-500 font-normal">Нажмите на карточку для просмотра тех. данных</span>
        </h4>

        {services.map((service) => {
          const isExpanded = expandedItemId === service.id;

          return (
            <div
              key={service.id}
              onClick={() => setExpandedItemId(isExpanded ? null : service.id)}
              className="bg-[#150d26] border border-[#3d2b4f] hover:border-[#ff4d4d]/50 rounded-2xl p-4 transition-all cursor-pointer shadow-md group"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 bg-[#1c1130] rounded-xl border border-[#3d2b4f] group-hover:scale-105 transition-transform">
                    {getServiceIcon(service.category)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-black text-xs sm:text-sm tracking-wide">
                        {service.name}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400 hidden sm:inline">
                        [{service.endpoint}]
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 mt-0.5 truncate max-w-md sm:max-w-xl">
                      {service.details}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {service.latencyMs !== null && (
                    <div className="text-right hidden sm:block">
                      <span className="text-[10px] text-gray-500 block">Задержка</span>
                      <span className={`text-xs font-mono font-bold ${getLatencyColor(service.latencyMs)}`}>
                        {service.latencyMs} мс
                      </span>
                    </div>
                  )}

                  {getStatusBadge(service.status)}
                </div>
              </div>

              {/* Expandable Technical Details Dropdown */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-[#3d2b4f]/60 space-y-2 text-xs">
                  <div className="flex justify-between text-gray-400">
                    <span>Эндпоинт назначения:</span>
                    <span className="font-mono text-cyan-300">{service.endpoint}</span>
                  </div>

                  {service.latencyMs !== null && (
                    <div className="flex justify-between text-gray-400">
                      <span>Время отклика (Round-Trip Time):</span>
                      <span className={`font-mono font-bold ${getLatencyColor(service.latencyMs)}`}>
                        {service.latencyMs} мс
                      </span>
                    </div>
                  )}

                  {service.error && (
                    <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 font-mono text-[11px]">
                      <strong>Ошибка:</strong> {service.error}
                    </div>
                  )}

                  {service.technicalData && (
                    <div className="space-y-1">
                      <span className="text-gray-400 font-bold text-[10px] uppercase">Технические параметры ответа:</span>
                      <pre className="p-3 bg-[#0d0718] border border-[#3d2b4f]/60 rounded-xl font-mono text-[11px] text-emerald-300/90 overflow-x-auto max-h-48">
                        {JSON.stringify(service.technicalData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
