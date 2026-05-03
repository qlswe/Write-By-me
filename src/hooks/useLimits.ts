import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

// Limits:
// AI chats per day: 10
// Aha Radio runs per day: 20? Let's say 20
// Aha Protocol (terminal) commands per day: 10
// Comments per day: 50
// Threads per month: 20

// AI message length: 250 characters (handled separately)

const LIMITS = {
  chats_daily: 10,
  radio_daily: 20,
  terminal_daily: 10,
  comments_daily: 50,
  threads_monthly: 20
};

export const useLimits = () => {
  const { user, role, isPremium } = useAuth();
  
  // if admin, moderator, beta-tester or premium, no limits
  const hasUnlimitedAccess = role === 'admin' || 
                             role === 'moderator' || 
                             role === 'beta-tester' || 
                             isPremium;

  const [limitsStatus, setLimitsStatus] = useState<any>({});

  const checkLimit = useCallback((type: keyof typeof LIMITS) => {
    if (hasUnlimitedAccess) return true;
    if (!user) return false;

    const now = new Date();
    const isMonthly = type.includes('monthly');
    const timeKey = isMonthly 
      ? `${now.getFullYear()}-${now.getMonth()}`
      : `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    
    const storageKey = `aha_limits_${user.uid}_${type}_${timeKey}`;
    const currentUsage = parseInt(localStorage.getItem(storageKey) || '0', 10);
    
    return currentUsage < LIMITS[type];
  }, [hasUnlimitedAccess, user]);

  const incrementUsage = useCallback((type: keyof typeof LIMITS) => {
    if (hasUnlimitedAccess || !user) return;

    const now = new Date();
    const isMonthly = type.includes('monthly');
    const timeKey = isMonthly 
      ? `${now.getFullYear()}-${now.getMonth()}`
      : `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    
    const storageKey = `aha_limits_${user.uid}_${type}_${timeKey}`;
    const currentUsage = parseInt(localStorage.getItem(storageKey) || '0', 10);
    
    localStorage.setItem(storageKey, (currentUsage + 1).toString());
    
    // Update state to trigger re-renders if needed
    setLimitsStatus((prev: any) => ({
      ...prev,
      [type]: currentUsage + 1
    }));
  }, [hasUnlimitedAccess, user]);

  const getUsage = useCallback((type: keyof typeof LIMITS) => {
    if (hasUnlimitedAccess || !user) return 0;
    
    const now = new Date();
    const isMonthly = type.includes('monthly');
    const timeKey = isMonthly 
      ? `${now.getFullYear()}-${now.getMonth()}`
      : `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    
    const storageKey = `aha_limits_${user.uid}_${type}_${timeKey}`;
    return parseInt(localStorage.getItem(storageKey) || '0', 10);
  }, [hasUnlimitedAccess, user]);

  return {
    checkLimit,
    incrementUsage,
    getUsage,
    hasUnlimitedAccess,
    LIMITS
  };
};
