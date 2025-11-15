import axios from "axios";

//
// Detect correct baseURL for server vs client
//
const baseURL =
  typeof window === "undefined"
    ? process.env.API_BASE_URL                // server-side
    : process.env.NEXT_PUBLIC_API_BASE_URL;   // client-side

//
// Create axios instance
//
export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
});

//
// Attach token (client-side only, using localStorage)
//
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    // Browser/client component → read token from localStorage
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});
