import type { Metadata } from "next"
import WorkplaceClient from "@/src/app/components/workplace-client";

export const metadata: Metadata = {
  title: "Workplace - AWS Architecture Builder",
  description: "Build and design your AWS cloud architecture with drag-and-drop interface",
}

export default function WorkplacePage() {
  return <WorkplaceClient />
}
