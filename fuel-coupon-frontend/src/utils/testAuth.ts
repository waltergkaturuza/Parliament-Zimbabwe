// src/utils/testAuth.ts
// Utility for quick admin authentication during development/testing

export const testAdminAuth = async () => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const adminUsername = import.meta.env.VITE_ADMIN_USERNAME || 'admin';
  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'Admin@123';

  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: adminUsername,
        password: adminPassword,
      }),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Store tokens
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    
    console.log('Admin authentication successful:', {
      username: adminUsername,
      role: 'SUPERUSER',
      tokens: 'stored in localStorage'
    });
    
    return {
      success: true,
      access: data.access,
      refresh: data.refresh,
      user: {
        username: adminUsername,
        role: 'SUPERUSER'
      }
    };
  } catch (error) {
    console.error('Admin authentication failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Auto-authenticate on page load if no tokens exist
export const autoAuthIfNeeded = async () => {
  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');
  
  if (!accessToken || !refreshToken) {
    console.log('No tokens found, attempting admin auto-authentication...');
    return await testAdminAuth();
  }
  
  console.log('Tokens found in localStorage');
  return { success: true, message: 'Already authenticated' };
};
