// src/utils/fetchWithAuth.ts
const fetchWithAuth = async (url: string, method: string = "GET", body?: any) => {
    const token = localStorage.getItem("accessToken");
  
    if (!token) {
      throw new Error("No token found. Please log in.");
    }
  
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  
    if (!response.ok) {
      throw new Error("Failed to fetch data.");
    }
  
    return await response.json();
  };
  
  export default fetchWithAuth;
  