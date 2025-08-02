// Test API connection script
const API_BASE_URL = 'https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net';

// Test login endpoint with proper API path
fetch(`${API_BASE_URL}/api/auth/login/`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Origin': 'https://jolly-ocean-0e0dee90f.2.azurestaticapps.net'
  },
  body: JSON.stringify({
    username: 'testuser',
    password: 'testpass123'
  })
})
  .then(response => {
    console.log('Login endpoint test:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    return response.text(); // Use text first to see raw response
  })
  .then(data => {
    console.log('Login response (raw):', data);
    try {
      const jsonData = JSON.parse(data);
      console.log('Login response (parsed):', jsonData);
    } catch (e) {
      console.log('Response is not JSON');
    }
  })
  .catch(error => {
    console.error('Login error:', error);
  });

// Test v1 login endpoint as well
fetch(`${API_BASE_URL}/api/v1/auth/login/`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Origin': 'https://jolly-ocean-0e0dee90f.2.azurestaticapps.net'
  },
  body: JSON.stringify({
    username: 'testuser',
    password: 'testpass123'
  })
})
  .then(response => {
    console.log('V1 Login endpoint test:', {
      status: response.status,
      statusText: response.statusText
    });
    return response.text();
  })
  .then(data => {
    console.log('V1 Login response:', data);
  })
  .catch(error => {
    console.error('V1 Login error:', error);
  });
