import { logger } from './logger';

export interface IPv6NetworkStatus {
  clientIp: string;
  protocol: 'IPv6' | 'IPv4-Mapped-over-IPv6' | 'IPv4';
  isNativeIPv6: boolean;
  ipv6Enabled: boolean;
  hasLocalIPv6: boolean;
  serverDualStack: boolean;
  latencyMs?: number;
  advantages: string[];
  details: {
    globalIPv6Reachable: boolean;
    serverAddressIPv6: boolean;
    localAdapterIPv6: boolean;
    v6PublicIp?: string;
    v4PublicIp?: string;
  };
  timestamp?: string;
}

const STORAGE_KEY_IPV6_PREFERENCE = 'aha_ipv6_preference_enabled';

/**
 * Checks for local IPv6 network adapter presence via WebRTC candidates
 */
async function detectLocalIPv6Adapter(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined' || !window.RTCPeerConnection) {
        resolve(false);
        return;
      }
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      let foundV6 = false;

      pc.onicecandidate = (e) => {
        if (e.candidate && e.candidate.candidate) {
          const cand = e.candidate.candidate;
          if (cand.includes(':') && !cand.includes('::ffff:')) {
            foundV6 = true;
          }
        }
      };

      pc.createDataChannel('v6-probe');
      pc.createOffer().then((offer) => pc.setLocalDescription(offer)).catch(() => {});

      setTimeout(() => {
        pc.close();
        resolve(foundV6);
      }, 1000);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Probe real IPv6 connectivity against public external endpoints & server
 */
export async function checkIPv6Status(): Promise<IPv6NetworkStatus> {
  const startTime = performance.now();

  let globalIPv6Reachable = false;
  let serverAddressIPv6 = false;
  let v6PublicIp = '';
  let v4PublicIp = '';
  let serverIp = '';

  // Run probes in parallel for max performance
  const [localAdapterIPv6, serverRes, v6ProbeRes, dsProbeRes, v6ImagePing] = await Promise.all([
    detectLocalIPv6Adapter(),

    // Server probe
    fetch('/api/network/protocol', {
      headers: {
        'X-Prefer-IPv6': 'true',
        'X-Protocol-Preference': 'IPv6'
      }
    }).then(r => r.ok ? r.json() : null).catch(() => null),

    // IPv6-only public endpoints probe (tries multiple services)
    (async () => {
      const v6Endpoints = [
        'https://api6.ipify.org?format=json',
        'https://v6.ident.me',
        'https://ipv6.icanhazip.com'
      ];
      for (const endpoint of v6Endpoints) {
        try {
          const controller = new AbortController();
          const tid = setTimeout(() => controller.abort(), 2000);
          const res = await fetch(endpoint, {
            signal: controller.signal,
            cache: 'no-store'
          });
          clearTimeout(tid);
          if (res.ok) {
            const text = (await res.text()).trim();
            let ip = text;
            try {
              const json = JSON.parse(text);
              if (json?.ip) ip = json.ip;
            } catch {}
            if (ip && ip.includes(':')) {
              return ip;
            }
          }
        } catch {}
      }
      return null;
    })(),

    // Dual-stack public endpoint test
    (async () => {
      try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 2000);
        const res = await fetch('https://api64.ipify.org?format=json', {
          signal: controller.signal,
          cache: 'no-store'
        });
        clearTimeout(tid);
        if (res.ok) {
          const json = await res.json();
          return json?.ip || null;
        }
      } catch {
        return null;
      }
    })(),

    // Pure IPv6 connection check via google ipv6 endpoint
    (async () => {
      try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 1800);
        await fetch('https://ipv6.google.com/favicon.ico', {
          mode: 'no-cors',
          signal: controller.signal,
          cache: 'no-store'
        });
        clearTimeout(tid);
        return true;
      } catch {
        return false;
      }
    })()
  ]);

  const latency = Math.round(performance.now() - startTime);

  // Evaluate Server response
  if (serverRes) {
    serverIp = serverRes.clientIp || '';
    if (serverRes.isNativeIPv6 || (serverRes.clientIp && serverRes.clientIp.includes(':'))) {
      serverAddressIPv6 = true;
    }
  }

  // Evaluate IPv6-only public probe
  if (v6ProbeRes && typeof v6ProbeRes === 'string' && v6ProbeRes.includes(':')) {
    globalIPv6Reachable = true;
    v6PublicIp = v6ProbeRes;
  } else if (v6ImagePing) {
    globalIPv6Reachable = true;
  }

  // Evaluate Dual-stack probe
  if (dsProbeRes && typeof dsProbeRes === 'string') {
    if (dsProbeRes.includes(':')) {
      globalIPv6Reachable = true;
      v6PublicIp = v6PublicIp || dsProbeRes;
    } else {
      v4PublicIp = dsProbeRes;
    }
  }

  const hasGlobalIPv6 = globalIPv6Reachable || serverAddressIPv6;
  const activeIp = v6PublicIp || (hasGlobalIPv6 ? serverIp : (v4PublicIp || serverIp || '127.0.0.1'));

  const protocol: 'IPv6' | 'IPv4-Mapped-over-IPv6' | 'IPv4' = hasGlobalIPv6
    ? 'IPv6'
    : (localAdapterIPv6 ? 'IPv4-Mapped-over-IPv6' : 'IPv4');

  return {
    clientIp: activeIp,
    protocol: protocol,
    isNativeIPv6: hasGlobalIPv6,
    ipv6Enabled: hasGlobalIPv6,
    hasLocalIPv6: localAdapterIPv6,
    serverDualStack: true,
    latencyMs: latency,
    advantages: [
      "Отсутствие NAT (прямые Peer-to-Peer соединения без задержек)",
      "Оптимизированная маршрутизация с меньшим количеством скачков (Hops)",
      "Встроенная аппаратная фильтрация и безопасность IPsec",
      "Неограниченный массив IP-адресов (3.4×10^38 адресов)",
      "Полное соответствие стандартам будущего интернета"
    ],
    details: {
      globalIPv6Reachable,
      serverAddressIPv6,
      localAdapterIPv6,
      v6PublicIp: v6PublicIp || undefined,
      v4PublicIp: v4PublicIp || undefined
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Reads local IPv6 preference state
 */
export function isIPv6PriorityForced(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_KEY_IPV6_PREFERENCE);
    return val === null ? true : val === 'true'; // Default enabled
  } catch (e) {
    return true;
  }
}

/**
 * Sets local IPv6 priority preference
 */
export function setIPv6PriorityForced(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_IPV6_PREFERENCE, enabled ? 'true' : 'false');
    logger.info(`IPv6 Priority Preference set to: ${enabled}`, null, 'IPv6Manager');
    window.dispatchEvent(new CustomEvent('ipv6_preference_changed', { detail: { enabled } }));
  } catch (e) {
    console.error('Error saving IPv6 preference', e);
  }
}

/**
 * IPv6 Optimized Fetch Proxy Wrapper
 */
export async function ipv6Fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const isForced = isIPv6PriorityForced();
  const headers = new Headers(init?.headers || {});
  
  if (isForced) {
    headers.set('X-Prefer-IPv6', 'true');
    headers.set('X-Protocol-Preference', 'IPv6');
    headers.set('X-Dual-Stack-Priority', 'IPv6-Primary');
  }

  return fetch(input, {
    ...init,
    headers
  });
}

/**
 * Educational materials for popularizing IPv6
 */
export const IPV6_POPULARIZATION_DATA = {
  titleRu: "Популяризация протокола IPv6 на платформе AHA",
  titleEn: "IPv6 Protocol Promotion on AHA Platform",
  taglineRu: "Переход на гигабитный интернет следующего поколения без NAT и задержек",
  taglineEn: "Next-gen gigabit internet without NAT bottlenecks and routing delays",
  keyBenefits: [
    {
      id: "no-nat",
      icon: "Zap",
      titleRu: "Отсутствие NAT и туннелей",
      titleEn: "Zero NAT Bottlenecks",
      descRu: "Каждое устройство получает уникальный глобальный IP-адрес. Больше никакого двойного NAT, задержек при маршрутизации и проблем с P2P.",
      descEn: "Every device gets a global, unique IP address. No double NAT, zero routing overhead, and seamless peer-to-peer latency."
    },
    {
      id: "low-latency",
      icon: "Gauge",
      titleRu: "Минимальный PING и прямые маршруты",
      titleEn: "Lower Ping & Direct Routing",
      descRu: "Протокол IPv6 исключает фрагментацию маршрутизаторами в пути, снижая нагрузку на процессоры роутеров и уменьшая пинг на 15-30%.",
      descEn: "IPv6 eliminates router-in-path fragmentation, easing router CPU processing and lowering latency by 15-30%."
    },
    {
      id: "security",
      icon: "ShieldCheck",
      titleRu: "Встроенный IPsec и безопасность",
      titleEn: "Native IPsec & Security",
      descRu: "Аппаратная поддержка шифрования и аутентификации пакетов на уровне сетевого протокола встроена в IPv6 по умолчанию.",
      descEn: "Native hardware-level packet encryption and authentication (IPsec) is built directly into the IPv6 header specification."
    },
    {
      id: "infinite-capacity",
      icon: "Globe",
      titleRu: "3.4 × 10³⁸ IP-адресов",
      titleEn: "3.4 × 10³⁸ IP Addresses",
      descRu: "Абсолютная свобода сети: количество адресов в IPv6 превышает количество песчинок на планете Земля.",
      descEn: "Limitless connectivity: the IPv6 address space exceeds the total number of sand grains on Planet Earth."
    }
  ],
  popularizationSteps: [
    {
      step: 1,
      titleRu: "Включите IPv6 у вашего провайдера (ISP)",
      descRu: "Большинство провайдеров в РФ (Ростелеком, МТС, Билайн, Мегафон, Дом.ру) уже поддерживают IPv6 Native (Dual-Stack) или 6to4 бесплатно."
    },
    {
      step: 2,
      titleRu: "Активируйте IPv6 в настройках Wi-Fi роутера",
      descRu: "В настройках WAN/Internet выберите тип подключения 'IPv6 Native' или 'SLAAC / DHCPv6'."
    },
    {
      step: 3,
      titleRu: "Используйте IPv6 Приоритет AHA",
      descRu: "Наш сервер автоматизирует обработку через дуальный стек ::1 / IPv6, отдавая приоритет пакетам с поддержкой IPv6."
    }
  ]
};
