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

    // Store token so apiClient interceptors can attach it
    Storage.set("token", data.access_token);

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
 * body: { email, password }
 * response: { access_token: string }
 * - stores access_token in Storage under "token"
 */
export async function signup(email, password) {
  try {
    const res = await client.post("/auth/register", { email, password });

    const data = res.data;
    if (!data?.access_token) {
      throw new Error("Invalid response from server (no access_token)");
    }

    Storage.set("token", data.access_token);

    return data.access_token;
  } catch (error) {
    if (error.response) {
      const msg =
        error.response.data?.detail ||
        error.response.data?.message ||
        `Signup failed (${error.response.status})`;
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
