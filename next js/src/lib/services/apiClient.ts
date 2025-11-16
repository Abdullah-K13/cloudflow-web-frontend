import axios from "axios";

//
// Detect correct baseURL for server vs client
// Default to localhost:8000 if not set (matching React version)
//
const baseURL =
  typeof window === "undefined"
    ? process.env.API_BASE_URL || "http://127.0.0.1:8000/"
    : process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/";

//
// Create axios instance with default config (matching React version)
//
export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true", // Match React version
  },
  withCredentials: true,
});

//
// Request interceptor: Attach token from localStorage or cookie
//
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      // Try localStorage first (matches React version's Storage.get("token"))
      let token = localStorage.getItem("access_token");
      
      // If not in localStorage, try to get from cookie
      if (!token) {
        const cookies = document.cookie.split(";");
        const tokenCookie = cookies.find((c) => c.trim().startsWith("access_token="));
        if (tokenCookie) {
          token = tokenCookie.split("=")[1];
        }
      }

      if (token) {
        // Ensure Bearer prefix (matching React version)
        config.headers.Authorization = token.startsWith("Bearer ")
          ? token
          : `Bearer ${token}`;
      }

      // If sending FormData, remove Content-Type header to let axios set it with boundary
      if (config.data instanceof FormData) {
        delete config.headers["Content-Type"];
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

//
// Response interceptor: Handle 401 errors globally (matching React version)
//
apiClient.interceptors.response.use(
  (response) => response, // Pass through successful responses
  (error) => {
    // Check if error response status is 401 (Unauthorized)
    if (error.response && error.response.status === 401) {
      console.warn("⚠ 401 Unauthorized - Token may be invalid");
      
      // Clear token from localStorage and cookie
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        
        // Optionally redirect to login (uncomment if needed)
        // window.location.href = "/login";
      }
    }

    // Reject the promise to allow error handling in components
    return Promise.reject(error);
  }
);
