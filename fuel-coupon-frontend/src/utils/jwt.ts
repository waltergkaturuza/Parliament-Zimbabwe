// src/utils/jwt.ts
interface JWTPayload {
  user_id?: number;
  username?: string;
  role?: string;
  exp?: number;
  iat?: number;
  [key: string]: any; // Allow other potential claims
}

export const decodeJWT = (token: string | null): JWTPayload | null => {
  if (!token) {
    return null;
  }
  try {
  const base64Url = token.split('.')[1] || '';
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};