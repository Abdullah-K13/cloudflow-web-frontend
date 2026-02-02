import axios from "axios";

//
// Detect correct baseURL for server vs client
// Default to localhost:8000 if not set (matching React version)
//
const baseURL =
  typeof window === "undefined"
    ? process.env.API_BASE_URL || "http://127.0.0.1:8000/"
    : process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/";

// Log the base URL in development for debugging
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  console.log("🔗 API Base URL:", baseURL);
}

//
// Create axios instance with default config (matching React version)
// Note: withCredentials is set per-request for auth endpoints to avoid CORS issues
//
export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true", // Match React version
  },
  timeout: 30000, // 30 second timeout
});

//
// Request interceptor: Attach token from localStorage or cookie
// Note: Login and register endpoints should NOT include Authorization header
//
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      // Skip adding Authorization header only for login/register (they don't need auth)
      const isPublicAuthEndpoint = 
        config.url?.includes("/auth/login") || 
        config.url?.includes("/auth/register");
      
      // For endpoints that don't need credentials (login/register/cloud-credentials),
      // don't use withCredentials to avoid CORS issues when backend uses wildcard CORS
      const shouldSkipCredentials = 
        isPublicAuthEndpoint || 
        config.url?.includes("/auth/cloud-credentials");
      
      if (shouldSkipCredentials) {
        config.withCredentials = false;
      } else {
        // For other endpoints, use credentials to send cookies
        config.withCredentials = true;
      }
      
      // Log request details in development
      if (process.env.NODE_ENV === "development") {
        const fullUrl = `${config.baseURL}${config.url}`;
        console.log("📤 API Request:", {
          method: config.method?.toUpperCase(),
          url: fullUrl,
          isPublicAuthEndpoint,
          withCredentials: config.withCredentials,
          hasAuthHeader: !!config.headers.Authorization,
        });
      }
      
      // Add Authorization header for all endpoints except login/register
      if (!isPublicAuthEndpoint) {
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
// Response interceptor: Handle 401 errors globally and log responses for debugging
//
apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging (can be removed in production)
    if (process.env.NODE_ENV === "development") {
      console.log("✅ API Response:", {
        url: response.config.url,
        status: response.status,
        data: response.data,
      });
    }
    return response;
  },
  (error) => {
    // Log errors for debugging
    if (process.env.NODE_ENV === "development") {
      const fullUrl = error.config ? `${error.config.baseURL}${error.config.url}` : "unknown";
      console.error("❌ API Error:", {
        fullUrl,
        method: error.config?.method?.toUpperCase(),
        status: error.response?.status,
        message: error.message,
        code: error.code,
        data: error.response?.data,
        responseHeaders: error.response?.headers,
        requestHeaders: error.config?.headers,
      });
      
      // Additional debugging for network errors
      if (!error.response) {
        // Check for CORS-specific errors
        const isCorsError = 
          error.code === "ERR_NETWORK" || 
          error.message?.includes("CORS") ||
          error.message?.includes("Network Error") ||
          (error.message?.includes("Failed to fetch") && !error.message?.includes("timeout"));
        
        console.error("🔍 Network Error Details:", {
          message: error.message,
          code: error.code,
          baseURL: error.config?.baseURL,
          url: error.config?.url,
          fullUrl,
          isCorsError,
          withCredentials: error.config?.withCredentials,
          suggestion: isCorsError 
            ? "This is likely a CORS issue. The backend needs to include proper CORS headers (Access-Control-Allow-Origin, etc.)"
            : "Check if the backend server is running and CORS is configured correctly",
        });
      }
    }

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
