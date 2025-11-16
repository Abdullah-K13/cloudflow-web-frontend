import type { Metadata } from "next";
import SettingsClient from "@/components/settings-client";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account, organization, and platform settings",
};

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-white pl-16">
      <div className="mx-auto w-full max-w-5xl p-6">
        <SettingsClient />
      </div>
    </main>
  );
}
