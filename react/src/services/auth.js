// src/api/auth.js
import apiClient from "../services/api-client";
import { Storage } from "../utilities/app handlers/services";

// Create a shared client for auth calls
const client = apiClient();

/**
 * LOGIN
 * POST /auth/login
 * body: { email, password }
 * response: { access_token: string }
 * - stores access_token in Storage under "token"
 */
export async function login(email, password) {
  try {
    const res = await client.post("/auth/login", { email, password });

    const data = res.data;
    if (!data?.access_token) {
      throw new Error("Invalid response from server (no access_token)");
    }
    console.log("Login successful:", res);
    document.cookie = `access_token=${data.access_token}; path=/; samesite=lax`;

    return data.access_token;
  } catch (error) {
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
 * - stores access_token in Storage under "token"
 */
export async function signup(email, password, role) {
  try {
    const res = await client.post("/auth/register", {
      email,
      password,
      role,
    });

    const data = res.data;
    if (!data?.access_token) {
      throw new Error("Invalid response from server (no access_token)");
    }

    Storage.set("token", data.access_token);
    return data.access_token;
    } catch (error) {
    if (error.response) {
      const detail = error.response.data?.detail;
      let msg;

      if (Array.isArray(detail)) {
        // FastAPI validation errors come as a list
        msg = detail
          .map((d) => {
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
 * Optional: get current user using /auth/me
 */
export async function getCurrentUser() {
  try {
    const res = await client.get("/auth/me");
    return res.data;
  } catch (error) {
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
 * Optional: logout helper
 */
export function logout() {
  Storage.remove("token"); // or Storage.clear()
}
