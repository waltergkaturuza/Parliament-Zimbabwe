// Production Authentication Debugging Script
// Copy and paste this into your browser console when experiencing auth issues

(function() {
  console.log('🔧 Production Authentication Diagnostics');
  console.log('==========================================');
  
  // 1. Check localStorage tokens
  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');
  
  console.log('📋 Token Status:');
  console.log('  Access token exists:', !!accessToken);
  console.log('  Refresh token exists:', !!refreshToken);
  
  if (accessToken) {
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp < now;
      
      console.log('  Token expiry:', new Date(payload.exp * 1000));
      console.log('  Token expired:', isExpired);
      console.log('  User ID:', payload.user_id);
      console.log('  Role:', payload.role);
      
      if (isExpired) {
        console.warn('⚠️ Token is expired - this will cause 401 errors');
      } else {
        console.log('✅ Token is valid');
      }
    } catch (e) {
      console.error('❌ Invalid token format:', e);
    }
  }
  
  // 2. Check API configuration
  console.log('\n🌐 API Configuration:');
  console.log('  Current domain:', window.location.origin);
  console.log('  API base URL:', window.localStorage.getItem('api_base_url') || 'Not set');
  
  // 3. Test API connectivity
  console.log('\n🔍 Testing API connectivity...');
  
  const testApi = async () => {
    try {
      const response = await fetch('https://parliament-zimbabwe.onrender.com/api/v1/fuel-entitlements/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('  API Response Status:', response.status);
      
      if (response.status === 401) {
        console.warn('⚠️ API returned 401 - authentication issue');
      } else if (response.status === 200) {
        console.log('✅ API accessible');
      } else {
        console.log('  Response:', response.status, response.statusText);
      }
      
      const data = await response.json();
      console.log('  Response data:', data);
      
    } catch (error) {
      console.error('❌ API test failed:', error);
    }
  };
  
  if (accessToken) {
    testApi();
  } else {
    console.warn('⚠️ No access token - cannot test API');
  }
  
  // 4. Quick fixes
  console.log('\n🛠️ Quick Fixes:');
  console.log('  1. Clear expired tokens: clearExpiredTokens()');
  console.log('  2. Force logout: forceLogout()');
  console.log('  3. Test token refresh: testTokenRefresh()');
  
  // Quick fix functions
  window.clearExpiredTokens = () => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          console.log('✅ Cleared expired tokens');
          return true;
        }
      }
      console.log('ℹ️ No expired tokens found');
      return false;
    } catch (e) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      console.log('✅ Cleared invalid tokens');
      return true;
    }
  };
  
  window.forceLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    console.log('✅ Cleared all storage - refresh page to login again');
    setTimeout(() => window.location.reload(), 1000);
  };
  
  window.testTokenRefresh = async () => {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) {
      console.warn('⚠️ No refresh token available');
      return;
    }
    
    try {
      const response = await fetch('https://parliament-zimbabwe.onrender.com/auth/token/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refresh })
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access);
        console.log('✅ Token refreshed successfully');
      } else {
        const errorData = await response.json();
        console.error('❌ Token refresh failed:', errorData);
      }
    } catch (error) {
      console.error('❌ Token refresh error:', error);
    }
  };
  
  console.log('\n📝 Run the following commands if needed:');
  console.log('  clearExpiredTokens() - Clear expired authentication tokens');
  console.log('  forceLogout() - Clear all data and force re-login');
  console.log('  testTokenRefresh() - Try to refresh the access token');
})();