// src/app/(dashboard)/templates/[id]/page.tsx

import { cookies } from "next/headers";
import TemplateDetailClient from "@/components/template-detail-client";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type TemplateDetail = {
  id: string;
  name: string;
  version: string;
  provider: string;
  tags: string[];
  description?: string;
  folder: string;
};

export default async function TemplateDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  // 👇 NOTE: we await cookies() because TS says it returns Promise<ReadonlyRequestCookies>
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/templates/${id}`, {
    cache: "no-store",
    headers,
  });

  if (!res.ok) {
    return (
      <main className="min-h-screen bg-white pl-16">
        <div className="mx-auto w-full max-w-6xl p-6">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            Could not load template details (status {res.status})
          </div>
        </div>
      </main>
    );
  }

  const detail: TemplateDetail = await res.json();

  return (
    <main className="min-h-screen bg-white pl-16">
      <div className="mx-auto w-full max-w-6xl p-6">
        <TemplateDetailClient apiBase={API_BASE} initialDetail={detail} />
      </div>
    </main>
  );
}
