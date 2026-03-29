import { GameEvent } from '../data/content';

// Reference date for alternating weeks: March 2, 2026 was a Monday.
const REFERENCE_DATE = new Date(2026, 2, 2, 0, 0, 0);

export function getNextEventDate(event: GameEvent): Date | null {
  const now = new Date();
  
  // Parse custom reset time or default to 03:00 UTC
  let resetHour = 3;
  let resetMinute = 0;
  if (event.resetTime) {
    const [h, m] = event.resetTime.split(':').map(Number);
    if (!isNaN(h)) resetHour = h;
    if (!isNaN(m)) resetMinute = m;
  }

  if (event.type === 'daily') {
    const target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), resetHour, resetMinute, 0));
    
    if (target <= now) {
      target.setUTCDate(target.getUTCDate() + 1);
    }
    return target;
  }
  
  if (event.type === 'weekly' && event.dayOfWeek !== undefined) {
    const target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), resetHour, resetMinute, 0));
    
    let daysUntilTarget = event.dayOfWeek - target.getUTCDay();
    if (daysUntilTarget < 0 || (daysUntilTarget === 0 && target <= now)) {
      daysUntilTarget += 7;
    }
    
    target.setUTCDate(target.getUTCDate() + daysUntilTarget);
    
    if (event.weekOffset !== undefined) {
      // Calculate weeks since reference date
      const targetMonday = new Date(target);
      const targetDay = targetMonday.getUTCDay();
      const diffToMonday = targetDay === 0 ? -6 : 1 - targetDay;
      targetMonday.setUTCDate(targetMonday.getUTCDate() + diffToMonday);
      targetMonday.setUTCHours(0, 0, 0, 0);
      
      const diffTime = targetMonday.getTime() - REFERENCE_DATE.getTime();
      const diffWeeks = Math.round(diffTime / (1000 * 60 * 60 * 24 * 7));
      
      const normalizedDiff = ((diffWeeks % 2) + 2) % 2;
      
      // If the week doesn't match the offset, add 7 days
      if (normalizedDiff !== event.weekOffset) {
        target.setUTCDate(target.getUTCDate() + 7);
      }
    }
    
    return target;
  }
  
  if (event.type === 'one-time' && event.endDate) {
    const target = new Date(event.endDate);
    if (target > now) return target;
    return null; // Ended
  }
  
  return null;
}

export function getEventProgress(event: GameEvent): { nextDate: Date | null, progress: number } {
  const nextDate = getNextEventDate(event);
  if (!nextDate) return { nextDate: null, progress: 0 };

  const now = new Date();
  let totalDuration = 0;

  if (event.type === 'daily') {
    totalDuration = 24 * 60 * 60 * 1000;
  } else if (event.type === 'weekly') {
    totalDuration = 7 * 24 * 60 * 60 * 1000;
    if (event.weekOffset !== undefined) {
      totalDuration = 14 * 24 * 60 * 60 * 1000; // 2 weeks for alternating
    }
  }

  if (totalDuration === 0) return { nextDate, progress: 0 };

  const timeRemaining = nextDate.getTime() - now.getTime();
  const timeElapsed = totalDuration - timeRemaining;
  const progress = Math.max(0, Math.min(100, (timeElapsed / totalDuration) * 100));

  return { nextDate, progress };
}

export function pluralize(count: number, forms: string | string[], lang: string): string {
  if (typeof forms === 'string') return forms;
  
  if (lang === 'ru' || lang === 'by') {
    const n = Math.abs(count) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return forms[2];
    if (n1 > 1 && n1 < 5) return forms[1];
    if (n1 === 1) return forms[0];
    return forms[2];
  }
  
  if (lang === 'en' || lang === 'de' || lang === 'fr') {
    return count === 1 ? forms[0] : forms[1];
  }
  
  return forms[0];
}

export function formatCountdown(targetDate: Date | null, t: any, lang: string): string {
  if (!targetDate) return t.ended;
  
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  
  if (diff <= 0) return t.ended;
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  const parts = [];
  if (days > 0) parts.push(`${days} ${pluralize(days, t.days, lang)}`);
  if (hours > 0 || days > 0) parts.push(`${hours} ${pluralize(hours, t.hours, lang)}`);
  if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes} ${pluralize(minutes, t.minutes, lang)}`);
  parts.push(`${seconds} ${pluralize(seconds, t.seconds, lang)}`);
  
  return `${parts.join(' ')} ${t.remaining}`;
}
