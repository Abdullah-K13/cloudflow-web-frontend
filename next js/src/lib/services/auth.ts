import { apiClient } from "./apiClient";

/**
 * LOGIN
 * POST /auth/login
 * body: { email, password }
 * response: { access_token: string }
 * - stores access_token in cookie and localStorage (token-only, no user data cookies)
 */
export async function login(email: string, password: string): Promise<string> {
  try {
    // Use Next.js API route proxy when in browser to avoid CORS issues
    // The API route will forward the request to the backend
    const useProxy = typeof window !== "undefined";
    
    let res;
    if (useProxy) {
      // Use Next.js API route as proxy (bypasses CORS)
      res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw {
          response: {
            status: res.status,
            data: errorData,
          },
        };
      }
      
      res = { data: await res.json(), status: res.status };
    } else {
      // Server-side: use direct API call
      res = await apiClient.post("/auth/login", { email, password });
    }

    // Check if response exists and has data
    if (!res || !res.data) {
      throw new Error("Invalid response from server: No data received");
    }

    const data = res.data;
    
    // Check if access_token exists in response
    if (!data?.access_token) {
      console.error("Login response missing access_token:", data);
      throw new Error("Invalid response from server: Missing access_token in response");
    }

    // Validate token is a non-empty string
    if (typeof data.access_token !== "string" || data.access_token.trim().length === 0) {
      throw new Error("Invalid response from server: access_token is empty or invalid");
    }

    console.log("Login successful, token received");

    // Set cookie in browser (matching React version exactly)
    if (typeof window !== "undefined") {
      try {
        document.cookie = `access_token=${data.access_token}; path=/; samesite=lax`;
        // Also store in localStorage (matching React version's Storage.set("token", ...))
        localStorage.setItem("access_token", data.access_token);
        
        // Verify token was stored
        const storedToken = localStorage.getItem("access_token");
        if (!storedToken || storedToken !== data.access_token) {
          console.warn("Warning: Token may not have been stored correctly");
        }
      } catch (storageError) {
        console.error("Error storing token:", storageError);
        throw new Error("Failed to store authentication token. Please check your browser settings.");
      }
    }

    return data.access_token;
  } catch (error: any) {
    // Get the attempted URL for better error messages
    const attemptedUrl = error.config 
      ? `${error.config.baseURL || ""}${error.config.url || ""}`
      : "unknown URL";

    // Handle network errors (no response received)
    if (!error.response) {
      // Check for CORS errors
      if (error.message?.includes("CORS") || error.code === "ERR_NETWORK") {
        const errorMsg = `Network error: Unable to connect to the server at ${attemptedUrl}. ` +
          `Please check:\n` +
          `1. Is the backend server running on ${error.config?.baseURL || "http://127.0.0.1:8000/"}?\n` +
          `2. Is CORS configured correctly on the backend?\n` +
          `3. Check the browser console for more details.`;
        throw new Error(errorMsg);
      }
      // Check for timeout errors
      if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        throw new Error(`Request timeout: The server at ${attemptedUrl} took too long to respond. Please try again.`);
      }
      // Generic network error
      const errorMsg = error.message 
        ? `Network error: ${error.message} (Attempted: ${attemptedUrl})`
        : `Network error: Unable to connect to the server at ${attemptedUrl}. Please check your connection and ensure the backend is running.`;
      throw new Error(errorMsg);
    }

    // Handle API errors (response received but with error status)
    if (error.response) {
      const status = error.response.status;
      const detail = error.response.data?.detail;
      const message = error.response.data?.message;

      // Handle specific status codes
      if (status === 401) {
        throw new Error("Invalid email or password. Please try again.");
      } else if (status === 422) {
        // Validation errors
        if (Array.isArray(detail)) {
          const validationErrors = detail
            .map((d: any) => {
              const loc = Array.isArray(d.loc) ? d.loc.join(".") : "";
              return loc ? `${loc}: ${d.msg}` : d.msg;
            })
            .join(" | ");
          throw new Error(`Validation error: ${validationErrors}`);
        }
        throw new Error(message || detail || "Invalid input. Please check your email and password.");
      } else if (status >= 500) {
        throw new Error("Server error: Please try again later or contact support.");
      }

      // Generic API error
      const errorMsg = message || detail || `Login failed (${status})`;
      throw new Error(errorMsg);
    }

    // Fallback for any other error
    throw new Error(error.message || "Login failed. Please try again.");
  }
}

/**
 * SIGNUP
 * POST /auth/register
 * body: { email, password, role }
 * response: { access_token: string }
 * - stores access_token in cookie and localStorage (token-only, no user data cookies)
 */
export async function signup(
  email: string,
  password: string,
  role?: string
): Promise<string> {
  try {
    const res = await apiClient.post("/auth/register", {
      email,
      password,
      role: role || "user",
    });

    const data = res.data;
    if (!data?.access_token) {
      throw new Error("Invalid response from server (no access_token)");
    }

    // Set cookie in browser
    if (typeof window !== "undefined") {
      document.cookie = `access_token=${data.access_token}; path=/; samesite=lax; max-age=86400`;
      localStorage.setItem("access_token", data.access_token);
    }

    return data.access_token;
  } catch (error: any) {
    if (error.response) {
      const detail = error.response.data?.detail;
      let msg;

      if (Array.isArray(detail)) {
        // FastAPI validation errors come as a list
        msg = detail
          .map((d: any) => {
            const loc = Array.isArray(d.loc) ? d.loc.join(".") : "";
            return loc ? `${loc}: ${d.msg}` : d.msg;
          })
          .join(" | ");
      } else if (typeof detail === "string") {
        msg = detail;
      } else if (detail && typeof detail === "object") {
        msg = JSON.stringify(detail);
      } else {
        msg =
          error.response.data?.message ||
          `Signup failed (${error.response.status})`;
      }

      console.error("Signup failed:", error.response.data);
      throw new Error(msg);
    }
    throw new Error(error.message || "Signup failed");
  }
}

/**
 * Get current user using /auth/me
 */
export async function getCurrentUser() {
  try {
    const res = await apiClient.get("/auth/me");
    return res.data;
  } catch (error: any) {
    if (error.response) {
      const msg =
        error.response.data?.detail ||
        error.response.data?.message ||
        `Failed to fetch current user (${error.response.status})`;
      throw new Error(msg);
    }
    throw new Error(error.message || "Failed to fetch current user");
  }
}

/**
 * GOOGLE OAUTH LOGIN
 * POST /auth/google
 * body: { id_token: string }
 * response: { access_token: string }
 * - stores access_token in cookie and localStorage
 */
export async function loginWithGoogle(idToken: string): Promise<string> {
  try {
    const useProxy = typeof window !== "undefined";
    
    let res;
    if (useProxy) {
      // Use Next.js API route as proxy (bypasses CORS)
      res = await fetch("/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id_token: idToken }),
      });
      
      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
        } catch (jsonError) {
          // If response is not JSON, try to get text
          const text = await res.text().catch(() => "Unknown error");
          errorData = { 
            detail: `Backend error: ${res.status} ${res.statusText}`,
            message: text 
          };
        }
        
        console.error("Backend error response:", {
          status: res.status,
          statusText: res.statusText,
          data: errorData
        });
        
        throw {
          response: {
            status: res.status,
            data: errorData,
          },
        };
      }
      
      res = { data: await res.json(), status: res.status };
    } else {
      // Server-side: use direct API call
      res = await apiClient.post("/auth/google", { id_token: idToken });
    }

    // Check if response exists and has data
    if (!res || !res.data) {
      throw new Error("Invalid response from server: No data received");
    }

    const data = res.data;
    
    // Check if access_token exists in response
    if (!data?.access_token) {
      console.error("Google login response missing access_token:", data);
      throw new Error("Invalid response from server: Missing access_token in response");
    }

    // Validate token is a non-empty string
    if (typeof data.access_token !== "string" || data.access_token.trim().length === 0) {
      throw new Error("Invalid response from server: access_token is empty or invalid");
    }

    console.log("Google login successful, token received");

    // Set cookie in browser
    if (typeof window !== "undefined") {
      try {
        document.cookie = `access_token=${data.access_token}; path=/; samesite=lax`;
        localStorage.setItem("access_token", data.access_token);
        
        // Verify token was stored
        const storedToken = localStorage.getItem("access_token");
        if (!storedToken || storedToken !== data.access_token) {
          console.warn("Warning: Token may not have been stored correctly");
        }
      } catch (storageError) {
        console.error("Error storing token:", storageError);
        throw new Error("Failed to store authentication token. Please check your browser settings.");
      }
    }

    return data.access_token;
  } catch (error: any) {
    // Handle network errors
    if (!error.response) {
      if (error.message?.includes("CORS") || error.code === "ERR_NETWORK") {
        throw new Error("Network error: Unable to connect to the server. Please check your connection.");
      }
      throw new Error(error.message || "Google login failed. Please try again.");
    }

    // Handle API errors
    if (error.response) {
      const status = error.response.status;
      const detail = error.response.data?.detail;
      const message = error.response.data?.message;

      if (status === 401) {
        const errorDetail = detail || message || "Google authentication failed";
        throw new Error(errorDetail);
      } else if (status >= 500) {
        // Show more details for server errors to help debugging
        const errorDetail = detail || message || "Server error: Please try again later or contact support.";
        console.error("Backend error details:", { status, detail, message, data: error.response.data });
        throw new Error(errorDetail);
      }

      const errorMsg = message || detail || `Google login failed (${status})`;
      throw new Error(errorMsg);
    }

    throw new Error(error.message || "Google login failed. Please try again.");
  }
}

/**
 * Logout helper - clears token from cookie and localStorage
 */
export function logout() {
  if (typeof window !== "undefined") {
    // Clear cookie
    document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    // Clear localStorage
    localStorage.removeItem("access_token");
  }
}

