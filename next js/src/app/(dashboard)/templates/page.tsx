// app/(dashboard)/templates/page.tsx
import type { Metadata } from "next";
import TemplatesClient, { Template } from "@/src/app/components/templates-client";

export const metadata: Metadata = {
  title: "Templates",
  description: "Browse, preview, and start from ready-made architectures",
};

// const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

// Shape returned by FastAPI /api/templates
type ApiTemplateCard = {
  id: string;
  name: string;
  summary?: string | null;
  tags: string[];
  providers: Array<"aws" | "gcp" | "azure">;
  lastUpdated?: string | null;
};

// --- MOCK DATA ---
const mockTemplates: Template[] = [
  {
    id: "tmpl-aws-001",
    name: "AWS Lambda Microservice",
    description: "Serverless microservice setup using AWS Lambda and API Gateway.",
    tags: ["serverless", "microservice", "aws"],
    lastUpdated: "2025-10-30",
  },
  {
    id: "tmpl-gcp-001",
    name: "GCP Data Pipeline",
    description: "End-to-end data pipeline using Cloud Storage, Dataflow, and BigQuery.",
    tags: ["data", "pipeline", "gcp"],
    lastUpdated: "2025-09-22",
  },
  {
    id: "tmpl-azure-001",
    name: "Azure Web App Deployment",
    description: "CI/CD-ready web app with Azure App Service and Container Registry.",
    tags: ["webapp", "azure", "devops"],
    lastUpdated: "2025-08-15",
  },
];

// --- keep for later ---
/*
async function fetchTemplates(params?: {
  q?: string;
  tag?: string;
  category?: string;
  provider?: "aws" | "gcp" | "azure";
}): Promise<Template[]> {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q);
  if (params?.tag) qs.set("tag", params.tag);
  if (params?.category) qs.set("category", params.category);
  if (params?.provider) qs.set("provider", params.provider);

  const url = `${API_BASE}/api/templates${qs.toString() ? `?${qs.toString()}` : ""}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    console.error("Failed to fetch templates:", res.status, await res.text());
    return [];
  }

  const data = (await res.json()) as ApiTemplateCard[];
  return data.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.summary ?? "",
    tags: t.tags,
    lastUpdated: t.lastUpdated ?? undefined,
  }));
}
*/

// Resolve a possibly-array value from searchParams
function pickFirst(val: string | string[] | undefined): string | undefined {
  if (Array.isArray(val)) return val[0];
  return val;
}

// NOTE: searchParams is a Promise in Next.js 15+ app router
export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  // For now, skip API call and use mock data
  // const templates = await fetchTemplates({
  //   q: pickFirst(sp.q),
  //   tag: pickFirst(sp.tag),
  //   category: pickFirst(sp.category),
  //   provider: pickFirst(sp.provider) as "aws" | "gcp" | "azure" | undefined,
  // });

  const templates = mockTemplates;

  return (
    <main className="min-h-screen bg-white pl-16">
      <div className="mx-auto w-full max-w-7xl p-6">
        <TemplatesClient initialData={templates} />
      </div>
    </main>
  );
}
