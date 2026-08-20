import { useState, useEffect, useCallback } from 'react';
import { gamificationEngine, GamificationState, GamificationChallenge, FloatingPointEvent } from '../utils/gamification';

export interface GamificationNotification {
  id: string;
  type: 'challenge_unlocked' | 'points_awarded' | 'level_up';
  title: string;
  subtitle: string;
  reward?: number;
  timestamp: number;
}

export function useGamification() {
  const [state, setState] = useState<GamificationState>(() => gamificationEngine.getState());
  const [activeAlert, setActiveAlert] = useState<GamificationNotification | null>(null);

  useEffect(() => {
    // Sync state on mount and subscription
    setState(gamificationEngine.getState());
    const unsubscribe = gamificationEngine.subscribe(() => {
      setState(gamificationEngine.getState());
    });

    const handleChallengeUnlocked = (e: any) => {
      const { title, reward } = e.detail || {};
      const notif: GamificationNotification = {
        id: `notif_${Date.now()}`,
        type: 'challenge_unlocked',
        title: 'Задание выполнено!',
        subtitle: title || 'Награда готова к получению',
        reward: reward || 0,
        timestamp: Date.now()
      };
      setActiveAlert(notif);
      setTimeout(() => setActiveAlert(null), 4000);
    };

    const handlePointsAwarded = (e: any) => {
      const { amount, reason } = e.detail || {};
      const notif: GamificationNotification = {
        id: `pts_${Date.now()}`,
        type: 'points_awarded',
        title: `+${amount} ✦ Звёздный Нефрит`,
        subtitle: reason || 'Награда за активность',
        reward: amount,
        timestamp: Date.now()
      };
      setActiveAlert(notif);
      setTimeout(() => setActiveAlert(null), 3500);
    };

    window.addEventListener('aha_challenge_unlocked', handleChallengeUnlocked);
    window.addEventListener('aha_points_awarded', handlePointsAwarded);

    return () => {
      unsubscribe();
      window.removeEventListener('aha_challenge_unlocked', handleChallengeUnlocked);
      window.removeEventListener('aha_points_awarded', handlePointsAwarded);
    };
  }, []);

  const awardPoints = useCallback((amount: number, reason: string = '', type: 'jades' | 'xp' | 'badge' = 'jades') => {
    gamificationEngine.awardPoints(amount, reason, type);
  }, []);

  const spendPoints = useCallback((amount: number) => {
    return gamificationEngine.spendPoints(amount);
  }, []);

  const updateProgress = useCallback((type: GamificationChallenge['type'], delta: number = 1, specificId?: string) => {
    gamificationEngine.updateProgress(type, delta, specificId);
  }, []);

  const claimChallenge = useCallback((challengeId: string) => {
    return gamificationEngine.claimChallenge(challengeId);
  }, []);

  const claimAll = useCallback(() => {
    return gamificationEngine.claimAll();
  }, []);

  const clearNewUnlockBadges = useCallback(() => {
    gamificationEngine.clearNewUnlockBadges();
  }, []);

  return {
    ...state,
    badgeCount: gamificationEngine.getBadgeCount(),
    activeAlert,
    awardPoints,
    spendPoints,
    updateProgress,
    claimChallenge,
    claimAll,
    clearNewUnlockBadges
  };
}
