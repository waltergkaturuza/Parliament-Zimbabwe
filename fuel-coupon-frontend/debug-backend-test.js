// Debug Test for Backend Connection
// Add this to your Login page temporarily to test the exact same API call

export const testBackendConnection = async () => {
  console.log('=== BACKEND CONNECTION TEST ===');
  
  // Test 1: Environment Variables
  console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
  console.log('Mode:', import.meta.env.MODE);
  console.log('DEV:', import.meta.env.DEV);
  console.log('All env vars:', import.meta.env);
  
  // Test 2: Direct fetch test (bypass axios interceptors)
  const testUrl = `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/login/`;
  console.log('Testing URL:', testUrl);
  
  const testPayload = {
    username: 'admin',
    password: 'Admin@123'
  };
  
  try {
    console.log('Making direct fetch request...');
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': window.location.origin
      },
      credentials: 'include', // Important for CORS
      body: JSON.stringify(testPayload)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Success! Response data:', data);
      return { success: true, data };
    } else {
      const errorText = await response.text();
      console.log('Error response:', errorText);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.error('Fetch error:', error);
    return { success: false, error: error.message };
  }
};

// Test 3: Check if using axios directly works
export const testAxiosDirectly = async () => {
  console.log('=== AXIOS DIRECT TEST ===');
  
  try {
    const axios = (await import('axios')).default;
    
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/login/`,
      {
        username: 'admin',
        password: 'Admin@123'
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
        timeout: 10000
      }
    );
    
    console.log('Axios success:', response.status, response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Axios error:', error);
    console.error('Error response:', error.response);
    return { success: false, error: error.message };
  }
};

// Add these functions to your Login component and call them in useEffect or on button click
export const runAllTests = async () => {
  console.log('🔍 Starting comprehensive backend tests...');
  
  const test1 = await testBackendConnection();
  console.log('Test 1 (Direct Fetch):', test1);
  
  const test2 = await testAxiosDirectly();
  console.log('Test 2 (Axios Direct):', test2);
  
  return { test1, test2 };
};
