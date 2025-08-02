// Quick test script to check CORS and API endpoints
const backendUrl = 'https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net';

console.log('Testing backend endpoints...');

// Test CORS endpoint
fetch(`${backendUrl}/cors-test/`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  }
})
.then(response => {
  console.log('CORS test response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('CORS test data:', data);
})
.catch(error => {
  console.error('CORS test error:', error);
});

// Test auth endpoint
fetch(`${backendUrl}/api/v1/auth/login/`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'test',
    password: 'test'
  })
})
.then(response => {
  console.log('Auth test response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('Auth test data:', data);
})
.catch(error => {
  console.error('Auth test error:', error);
});

// Test root endpoint
fetch(`${backendUrl}/`)
.then(response => {
  console.log('Root endpoint status:', response.status);
  return response.json();
})
.then(data => {
  console.log('Root endpoint data:', data);
})
.catch(error => {
  console.error('Root endpoint error:', error);
});
