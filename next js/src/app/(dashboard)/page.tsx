import type { Metadata } from "next";
import { cookies } from "next/headers";
import DashboardClient from "@/components/dashboard-client";

export const metadata: Metadata = {
  title: "Dashboard - AWS Architecture Builder",
  description: "Main dashboard for managing your AWS architecture projects",
};

export default async function DashboardPage() {
  const cookieStore = await cookies(); // <-- await here
  const userId = cookieStore.get("user_id")?.value ?? null;
  const apiKey = cookieStore.get("api_key")?.value ?? null;
  const name = cookieStore.get("name")?.value ?? null;


  // Optional: gate the page if missing auth
  // import { redirect } from "next/navigation";
  // if (!apiKey) redirect("/login");
  console.log("User ID:", userId);
  console.log("API Key:", apiKey);
  console.log("Name:", name);

  return <DashboardClient userId={userId} apiKey={apiKey}  name={name} />;
}
