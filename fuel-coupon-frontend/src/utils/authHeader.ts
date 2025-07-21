// src/utils/authHeader.ts

export const authHeader = () => {
  // Try to get token from localStorage or session storage
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

  if (token) {
    return { Authorization: `Bearer ${token}` };
  } else {
    return {};
  }
};