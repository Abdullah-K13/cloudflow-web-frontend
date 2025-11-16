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
    const res = await apiClient.post("/auth/login", { email, password });

    const data = res.data;
    if (!data?.access_token) {
      throw new Error("Invalid response from server (no access_token)");
    }

    console.log("Login successful:", res);

    // Set cookie in browser (matching React version exactly)
    if (typeof window !== "undefined") {
      document.cookie = `access_token=${data.access_token}; path=/; samesite=lax`;
      // Also store in localStorage (matching React version's Storage.set("token", ...))
      localStorage.setItem("access_token", data.access_token);
    }

    return data.access_token;
  } catch (error: any) {
    if (error.response) {
      const msg =
        error.response.data?.detail ||
        error.response.data?.message ||
        `Login failed (${error.response.status})`;
      throw new Error(msg);
    }
    throw new Error(error.message || "Login failed");
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

