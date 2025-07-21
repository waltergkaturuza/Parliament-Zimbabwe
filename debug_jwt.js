// Debug script to decode JWT and test the system
// You can run this in the browser console

function decodeJWT(token) {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

// Test with the tokens from your logs
const accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzUxNjQ1MTE2LCJpYXQiOjE3NTE2NDMzMTYsImp0aSI6ImFlZjExMzU4MjA3MzRmZjc4NGU4MWU2YjdjNDlhM2JlIiwidXNlcl9pZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJBRE1JTiJ9.K0pFiEF02aF0fh0jPS4lAibf2G5uo7atNqj6P1yXzTI";

console.log('Decoded JWT:', decodeJWT(accessToken));

// Expected output should show:
// {
//   token_type: "access",
//   exp: 1751645116,
//   iat: 1751643316,
//   jti: "aef1135820734ff784e81e6b7c49a3be",
//   user_id: 1,
//   username: "admin",
//   role: "ADMIN"
// }
