// Debug API configuration
import { API_BASE } from '@/api';

console.log('=== API CONFIGURATION DEBUG ===');
console.log('import.meta.env.DEV:', import.meta.env.DEV);
console.log('import.meta.env.VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
console.log('API_BASE:', API_BASE);
console.log('Current URL:', window.location.href);
console.log('================================');

export const debugApiConfig = () => {
  console.log('API Base URL being used:', API_BASE);
};