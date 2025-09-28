// Debug component to check authentication state
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { decodeJWT } from '@/utils/jwt';

const AuthDebug: React.FC = () => {
  const { user, isAuthenticated, userRole, accessToken, isAuthLoading } = useAuth();
  
  // Get stored tokens from localStorage
  const storedAccessToken = localStorage.getItem('access_token');
  const storedRefreshToken = localStorage.getItem('refresh_token');
  
  // Try to decode the stored token
  const decodedToken = storedAccessToken ? decodeJWT(storedAccessToken) : null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: '#fff',
      border: '1px solid #ccc',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      maxWidth: '400px',
      zIndex: 9999,
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <h4>🐛 Auth Debug Panel</h4>
      <div><strong>Loading:</strong> {isAuthLoading ? 'Yes' : 'No'}</div>
      <div><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</div>
      <div><strong>User Role:</strong> {userRole || 'undefined'}</div>
      <div><strong>User ID:</strong> {user?.id || 'undefined'}</div>
      <div><strong>Username:</strong> {user?.username || 'undefined'}</div>
      
      <hr style={{ margin: '10px 0' }} />
      
      <div><strong>Stored Access Token:</strong> {storedAccessToken ? 'Present' : 'Missing'}</div>
      <div><strong>Stored Refresh Token:</strong> {storedRefreshToken ? 'Present' : 'Missing'}</div>
      
      {decodedToken && (
        <>
          <hr style={{ margin: '10px 0' }} />
          <div><strong>Decoded Token:</strong></div>
          <pre style={{ fontSize: '10px', maxHeight: '200px', overflow: 'auto' }}>
            {JSON.stringify(decodedToken, null, 2)}
          </pre>
        </>
      )}
      
      {storedAccessToken && (
        <button 
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
          style={{ 
            marginTop: '10px', 
            padding: '5px 10px', 
            backgroundColor: '#ff4444', 
            color: 'white', 
            border: 'none', 
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Clear Tokens & Reload
        </button>
      )}
    </div>
  );
};

export default AuthDebug;