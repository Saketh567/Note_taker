import { useEffect, useRef, useCallback } from 'react';

interface UseIdleTimerOptions {
  timeout: number; // milliseconds
  onIdle: () => void;
  enabled?: boolean;
}

/**
 * Hook to detect when user has been idle (no typing/activity)
 * Resets timer on any keystroke or mouse activity
 */
export function useIdleTimer({ timeout, onIdle, enabled = true }: UseIdleTimerOptions) {
  const timerRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimer = useCallback(() => {
    if (!enabled) return;

    lastActivityRef.current = Date.now();

    // Clear existing timer
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    // Set new timer
    timerRef.current = window.setTimeout(() => {
      onIdle();
    }, timeout);
  }, [timeout, onIdle, enabled]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      clearTimer();
      return;
    }

    // Reset timer on activity
    const handleActivity = () => {
      resetTimer();
    };

    // Listen for various activity events
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('mousemove', handleActivity);

    // Start initial timer
    resetTimer();

    return () => {
      clearTimer();
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('mousemove', handleActivity);
    };
  }, [enabled, resetTimer, clearTimer]);

  return { resetTimer, clearTimer, lastActivity: lastActivityRef.current };
}
