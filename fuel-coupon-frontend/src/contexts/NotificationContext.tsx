// src/contexts/NotificationContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { message } from 'antd';
import apiClient from '@/api/index';

interface NotificationStats {
  total: number;
  unread: number;
  priority: number;
}

interface NotificationContextType {
  stats: NotificationStats;
  refreshStats: () => Promise<void>;
  playNotificationSound: () => void;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
  userRole: 'MAIN_CENTER' | 'SUB_CENTER' | 'BENEFICIARY';
  userId: string;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  userRole,
  userId
}) => {
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    priority: 0
  });

  const refreshStats = async () => {
    // Skip polling when user is not authenticated or userId is missing
    const token = localStorage.getItem('access_token');
    if (!token || !userId) {
      // Clear stats when unauthenticated
      setStats({ total: 0, unread: 0, priority: 0 });
      return;
    }

    try {
      const response = await apiClient.get('/notifications/stats/', {
        params: {
          recipient_type: userRole,
          recipient_id: userId
        }
      });
      
      // Ensure the response has the expected structure
      const newStats = {
        total: response.data.total || 0,
        unread: response.data.unread || 0,
        priority: response.data.priority || 0
      };
      
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      // Always set to zero when there's an error to prevent hardcoded values
      setStats({ total: 0, unread: 0, priority: 0 });
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e: any = error;
      if (e?.response?.status === 404) {
        // Endpoint not found - keep stats at zero
        return;
      }
    }
  };

  const playNotificationSound = () => {
    // Create audio context for notification sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.post('/notifications/mark-all-read/', {
        recipient_type: userRole,
        recipient_id: userId
      });
      
      await refreshStats();
      message.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      // If endpoint is not deployed yet, fail silently with info
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e: any = error;
      if (e?.response?.status === 404) {
        message.info('Notifications are not available yet.');
        return;
      }
      message.error('Failed to mark all as read');
    }
  };

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    refreshStats();
    
    const interval = setInterval(() => {
      refreshStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [userRole, userId]);

  // Listen for real-time notifications via WebSocket (if implemented)
  useEffect(() => {
    // Temporarily disable WebSocket connections until backend WebSocket support is confirmed
    if (false && 'WebSocket' in window) {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      // Remove /api/v1 from base URL for WebSocket connection
      const wsBaseUrl = baseUrl.replace('/api/v1', '');
      const wsUrl = wsBaseUrl.replace('http', 'ws').replace('https', 'wss') + `/ws/notifications/${userRole}/${userId}/`;
      let ws: WebSocket | null = null;
      
      try {
        ws = new WebSocket(wsUrl);
        
        if (ws) {
          const socket = ws;
          socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'notification') {
              playNotificationSound();
              refreshStats();
              
              // Show toast notification
              message.info({
                content: `New notification: ${data.title}`,
                duration: 5,
              });
            }
          } catch (parseError) {
            console.warn('Failed to parse WebSocket message:', parseError);
          }
        };

          socket.onopen = () => {
            console.log('WebSocket connected for notifications');
          };

          socket.onclose = (event) => {
            console.log('WebSocket disconnected:', event.code, event.reason);
          };

          socket.onerror = (error) => {
            console.warn('WebSocket connection failed, falling back to polling:', error);
          };

          return () => {
            if (socket && socket.readyState === WebSocket.OPEN) {
              socket.close();
            }
          };
        }
      } catch (err) {
        console.warn('WebSocket not available, using polling only:', err);
        return;
      }
    }
    
    // WebSocket is disabled, rely on polling only
    console.log('Using notification polling (WebSocket disabled)');
  }, [userRole, userId]);

  const value = {
    stats,
    refreshStats,
    playNotificationSound,
    markAllAsRead
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
