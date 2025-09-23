// src/components/debug/AuthDebug.tsx
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

const AuthDebug: React.FC = () => {
  try {
    const auth = useAuth();
    console.log('AuthDebug - Context:', auth);
    console.log('AuthDebug - User:', auth?.user);
    console.log('AuthDebug - IsAuthenticated:', auth?.isAuthenticated);
    console.log('AuthDebug - IsLoading:', auth?.isAuthLoading);
    
    return (
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#f0f0f0', 
        border: '1px solid #ccc',
        margin: '16px'
      }}>
        <h3>Auth Debug Info</h3>
        <pre style={{ fontSize: '12px' }}>
          {JSON.stringify({
            user: auth?.user,
            isAuthenticated: auth?.isAuthenticated,
            isAuthLoading: auth?.isAuthLoading,
            userRole: auth?.userRole,
            hasContext: !!auth
          }, null, 2)}
        </pre>
      </div>
    );
  } catch (error) {
    console.error('AuthDebug Error:', error);
    return (
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#ffebee', 
        border: '1px solid #f44336',
        margin: '16px',
        color: '#d32f2f'
      }}>
        <h3>Auth Context Error</h3>
        <p>Error: {String(error)}</p>
        <p>This usually means useAuth is being called outside of AuthProvider</p>
      </div>
    );
  }
};

export default AuthDebug;