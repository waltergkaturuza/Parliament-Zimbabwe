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
    try {
      const response = await apiClient.get('/api/v1/notifications/stats/', {
        params: {
          recipient_type: userRole,
          recipient_id: userId
        }
      });
      
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching notification stats:', error);
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
      await apiClient.post('/api/v1/notifications/mark-all-read/', {
        recipient_type: userRole,
        recipient_id: userId
      });
      
      await refreshStats();
      message.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
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
    if ('WebSocket' in window) {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const wsUrl = baseUrl.replace('http', 'ws').replace('https', 'wss') + `/ws/notifications/${userRole}/${userId}/`;
      const ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
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
      };

      ws.onopen = () => {
        console.log('WebSocket connected for notifications');
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      return () => {
        ws.close();
      };
    }
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
