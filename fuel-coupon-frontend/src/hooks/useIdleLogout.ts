import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { message } from 'antd';

interface UseIdleLogoutProps {
  idleTimeLimit?: number; // in milliseconds, default 30 minutes
  warningTime?: number; // show warning before logout, default 5 minutes
}

const useIdleLogout = ({ 
  idleTimeLimit = 30 * 60 * 1000, // 30 minutes
  warningTime = 5 * 60 * 1000 // 5 minutes warning
}: UseIdleLogoutProps = {}) => {
  const { logout, isAuthenticated } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef(false);

  const showWarning = useCallback(() => {
    if (warningShownRef.current) return;
    
    warningShownRef.current = true;
    message.warning({
      content: 'Your session will expire in 5 minutes due to inactivity. Move your mouse or click anywhere to stay logged in.',
      duration: 10,
      key: 'session-warning'
    });
  }, []);

  const resetTimer = useCallback(() => {
    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Reset warning flag
    warningShownRef.current = false;
    message.destroy('session-warning');

    // Only set timers if user is authenticated
    if (!isAuthenticated) return;

    // Set warning timer
    warningTimeoutRef.current = setTimeout(() => {
      showWarning();
    }, idleTimeLimit - warningTime);

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      message.destroy('session-warning');
      message.info('Session expired due to inactivity. Please log in again.');
      logout(() => {
        // Redirect to login page after logout
        window.location.href = '/login';
      });
    }, idleTimeLimit);
  }, [isAuthenticated, logout, idleTimeLimit, warningTime, showWarning]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Events that indicate user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Reset timer on any user activity
    const resetOnActivity = () => resetTimer();

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, resetOnActivity, true);
    });

    // Initialize timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetOnActivity, true);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      
      message.destroy('session-warning');
    };
  }, [isAuthenticated, resetTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      message.destroy('session-warning');
    };
  }, []);

  return {
    resetTimer
  };
};

export default useIdleLogout;
