import type { Metadata } from "next"
import DashboardLayoutClient from "@/src/app/components/DashboardLayoutClient";

export const metadata: Metadata = {
  title: "Dashboard - AWS Architecture Builder",
  description: "Main dashboard for managing your AWS architecture projects",
}

export default function DashboardLandingPage() {
  return (
    <DashboardLayoutClient>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome to AWS Architecture Builder</h1>
        <p className="mt-2 text-gray-600">Start building your cloud infrastructure today.</p>
      </div>
    </DashboardLayoutClient>
  )
}
