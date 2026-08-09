import { sanitizeHttpHeaderValue } from './network';

export interface UserAgentProfile {
  id: string;
  name: string;
  userAgentString: string;
  platform: string;
  vendor: string;
  deviceType: 'mobile' | 'desktop' | 'hyper-v6' | 'bot';
  isAhaNative: boolean;
}

export const AHA_CUSTOM_USER_AGENTS: UserAgentProfile[] = [
  {
    id: 'aha-v6-hyper',
    name: 'AHA Browser v6 (IPv6 Hyper-Acceleration Native)',
    userAgentString: 'AhaBrowser/6.0.4 (AHA-OS 6.0; Dual-Stack IPv6; AHA-Protocol-v6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 AHA-v6-Engine/6.0',
    platform: 'AHA-OS x86_64 IPv6-Native',
    vendor: 'AHA Network Architecture Team',
    deviceType: 'hyper-v6',
    isAhaNative: true
  },
  {
    id: 'aha-mobile-safari',
    name: 'AHA Mobile Browser (iOS / IPv6-Opt)',
    userAgentString: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 AhaBrowser/6.0-Mobile (AHA-IPv6-Direct)',
    platform: 'iPhone iOS 17.5',
    vendor: 'Apple Computer, Inc. / AHA-v6',
    deviceType: 'mobile',
    isAhaNative: true
  },
  {
    id: 'aha-desktop-chrome',
    name: 'AHA Desktop Web Suite (Chrome 128 IPv6)',
    userAgentString: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 AhaBrowser/6.0.4',
    platform: 'Win32 / AHA-v6-Bypass',
    vendor: 'Google Inc. / AHA Protocol',
    deviceType: 'desktop',
    isAhaNative: true
  },
  {
    id: 'aha-bot-auditor',
    name: 'AHA Network Security Auditor Bot',
    userAgentString: 'AhaNetworkAuditor/6.0 (+https://ai.studio/aha-protocol-v6; Security & IPv6 Route Verification)',
    platform: 'Linux x86_64 Dual-Stack',
    vendor: 'AHA Core Security',
    deviceType: 'bot',
    isAhaNative: true
  }
];

const STORAGE_KEY_SELECTED_UA = 'aha_active_user_agent_id';

/**
 * Gets the active User-Agent string configured for the embedded browser and network requests.
 */
export function getActiveUserAgentProfile(): UserAgentProfile {
  const savedId = localStorage.getItem(STORAGE_KEY_SELECTED_UA);
  const found = AHA_CUSTOM_USER_AGENTS.find(u => u.id === savedId);
  return found || AHA_CUSTOM_USER_AGENTS[0];
}

/**
 * Sets the active custom User-Agent profile.
 */
export function setActiveUserAgentProfile(id: string): UserAgentProfile {
  const profile = AHA_CUSTOM_USER_AGENTS.find(u => u.id === id) || AHA_CUSTOM_USER_AGENTS[0];
  localStorage.setItem(STORAGE_KEY_SELECTED_UA, profile.id);
  return profile;
}

/**
 * Returns formatted HTTP headers for custom browser requests including custom User-Agent.
 */
export function getAhaBrowserHeaders(customUaId?: string): Record<string, string> {
  const profile = customUaId 
    ? (AHA_CUSTOM_USER_AGENTS.find(u => u.id === customUaId) || getActiveUserAgentProfile())
    : getActiveUserAgentProfile();

  const activeFlow = localStorage.getItem('aha_v6_active_flow_label') || '0x6AHA9F';

  return {
    'User-Agent': sanitizeHttpHeaderValue(profile.userAgentString),
    'X-AHA-User-Agent': sanitizeHttpHeaderValue(profile.userAgentString),
    'X-AHA-Protocol-Version': '6.0-HYPER-IPv6',
    'X-AHA-IPv6-Flow-Label': activeFlow,
    'X-AHA-Embedded-Browser': 'AhaBrowser/6.0.4'
  };
}
