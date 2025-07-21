//src/hooks/useAuthSync.ts
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useAuthSync = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const channel = new BroadcastChannel('auth');

    channel.onmessage = (event) => {
      if (event.data.type === 'logout') {
        navigate('/login');
      }
      if (event.data.type === 'login') {
        // Optional: force reload if needed
      }
    };

    return () => channel.close();
  }, [navigate]);
};
