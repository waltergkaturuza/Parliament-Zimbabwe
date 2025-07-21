// src/utils/refreshToken.ts
const refreshToken = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
  
    if (!refreshToken) {
      throw new Error("No refresh token found.");
    }
  
    const response = await fetch("/api/token/refresh/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh: refreshToken,
      }),
    });
  
    if (!response.ok) {
      throw new Error("Failed to refresh token.");
    }
  
    const data = await response.json();
    localStorage.setItem("accessToken", data.access);
  };
  
  export default refreshToken;
  