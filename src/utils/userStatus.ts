import { UserData } from '../hooks/useUsers';
import { Language } from '../data/translations';

/**
 * Checks if a user is currently online based on their lastSeen timestamp.
 * A user is considered online if lastSeen was updated within the past 5 minutes.
 * AI Bots (isBot: true) are always online.
 */
export function checkIsUserOnline(u?: { lastSeen?: string; isBot?: boolean } | null): boolean {
  if (!u) return false;
  if (u.isBot) return true;
  if (!u.lastSeen) return false;

  try {
    const lastSeenMs = new Date(u.lastSeen).getTime();
    if (isNaN(lastSeenMs)) return false;
    const diffMs = Date.now() - lastSeenMs;
    return diffMs < 5 * 60 * 1000; // 5 minutes threshold
  } catch {
    return false;
  }
}

/**
 * Formats a user's lastSeen timestamp into a readable localized status string.
 * e.g., "🟢 В сети", "⚪ Был(а) 12 мин. назад", "⚪ Не в сети"
 */
export function formatLastSeenStatus(
  u?: { lastSeen?: string; isBot?: boolean; displayName?: string } | null,
  lang: Language = 'ru'
): { statusText: string; isOnline: boolean } {
  if (!u) {
    return {
      statusText: lang === 'ru' ? '⚪ Не в сети' : '⚪ Offline',
      isOnline: false,
    };
  }

  if (u.isBot) {
    return {
      statusText: lang === 'ru' ? '🤖 ИИ-Ассистент (В сети)' : '🤖 AI Assistant (Online)',
      isOnline: true,
    };
  }

  const isOnline = checkIsUserOnline(u);
  if (isOnline) {
    return {
      statusText: lang === 'ru' ? '🟢 В сети' : '🟢 Online',
      isOnline: true,
    };
  }

  if (!u.lastSeen) {
    return {
      statusText: lang === 'ru' ? '⚪ Не в сети' : '⚪ Offline',
      isOnline: false,
    };
  }

  try {
    const date = new Date(u.lastSeen);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) {
      return {
        statusText: lang === 'ru' ? '⚪ Был(а) только что' : '⚪ Last seen just now',
        isOnline: false,
      };
    }

    if (diffMins < 60) {
      return {
        statusText: lang === 'ru' ? `⚪ Был(а) ${diffMins} мин. назад` : `⚪ Last seen ${diffMins}m ago`,
        isOnline: false,
      };
    }

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return {
        statusText: lang === 'ru' ? `⚪ Был(а) ${diffHours} ч. назад` : `⚪ Last seen ${diffHours}h ago`,
        isOnline: false,
      };
    }

    const formattedDate = date.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return {
      statusText: lang === 'ru' ? `⚪ Был(а) ${formattedDate}` : `⚪ Last seen ${formattedDate}`,
      isOnline: false,
    };
  } catch {
    return {
      statusText: lang === 'ru' ? '⚪ Не в сети' : '⚪ Offline',
      isOnline: false,
    };
  }
}
