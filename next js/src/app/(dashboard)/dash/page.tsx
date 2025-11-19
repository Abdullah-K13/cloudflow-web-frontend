import type { Metadata } from "next";
import { cookies } from "next/headers";
import DashboardClient from "@/components/dashboard-client";
import { apiClient } from "@/lib/services/apiClient";

export const metadata: Metadata = {
  title: "Dashboard - AWS Architecture Builder",
  description: "Main dashboard for managing your AWS architecture projects",
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value ?? null;

  let userId: string | null = null;
  let userEmail: string | null = null;
  let userRole: string | null = null;

  // Fetch user info if token exists
  if (accessToken) {
    try {
      const userInfo = await apiClient.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      userId = userInfo.data?.id ?? null;
      userEmail = userInfo.data?.email ?? null;
      userRole = userInfo.data?.role ?? null;
    } catch (error) {
      console.error("Failed to fetch user info:", error);
      // If token is invalid, user will be redirected by client-side logic
    }
  }

  return (
    <DashboardClient
      userId={userId}
      apiKey={null}
      name={userEmail || "User"}
      userRole={userRole}
    />
  );
}

