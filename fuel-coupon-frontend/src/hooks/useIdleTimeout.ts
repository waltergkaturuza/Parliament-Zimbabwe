// src/hooks/useIdleTimeout.ts
import { useEffect, useRef, useCallback } from 'react';

interface UseIdleTimeoutProps {
  timeout: number; // timeout in milliseconds
  onIdle: () => void; // callback when user becomes idle
  enabled?: boolean; // whether the idle detection is enabled
}

const useIdleTimeout = ({ timeout, onIdle, enabled = true }: UseIdleTimeoutProps) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Clear existing timeout
  const clearIdleTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Reset the idle timer
  const resetIdleTimer = useCallback(() => {
    if (!enabled) return;

    lastActivityRef.current = Date.now();
    clearIdleTimeout();

    timeoutRef.current = setTimeout(() => {
      console.log('User has been idle for', timeout / 1000 / 60, 'minutes. Triggering logout.');
      onIdle();
    }, timeout);
  }, [timeout, onIdle, enabled, clearIdleTimeout]);

  // Activity event handler
  const handleActivity = useCallback(() => {
    resetIdleTimer();
  }, [resetIdleTimer]);

  useEffect(() => {
    if (!enabled) {
      clearIdleTimeout();
      return;
    }

    // Events that indicate user activity
    const events = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    // Start the timer
    resetIdleTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearIdleTimeout();
    };
  }, [enabled, handleActivity, resetIdleTimer, clearIdleTimeout]);

  // Return methods to manually control the timer
  return {
    resetTimer: resetIdleTimer,
    clearTimer: clearIdleTimeout,
    getLastActivity: () => lastActivityRef.current,
    getRemainingTime: () => {
      const elapsed = Date.now() - lastActivityRef.current;
      return Math.max(0, timeout - elapsed);
    }
  };
};

export default useIdleTimeout;
