import type React from "react"
import type { Metadata } from "next"
import DashboardLayoutClient from "@/components/DashboardLayoutClient";

export const metadata: Metadata = {
  title: "Dashboard - AWS Architecture Builder",
  description: "Build and design your AWS cloud architecture",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>
}
