// src/app/(dashboard)/templates/[id]/page.tsx
import TemplateDetailClient from "@/src/app/components/template-detail-client";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const res = await fetch(`${API_BASE}/api/templates/${id}`, { cache: "no-store" });
  if (!res.ok) {
    return (
      <main className="min-h-screen bg-white pl-16">
        <div className="mx-auto w-full max-w-6xl p-6">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            Could not load template details.
          </div>
        </div>
      </main>
    );
  }

  const detail = await res.json();

  return (
    <main className="min-h-screen bg-white pl-16">
      <div className="mx-auto w-full max-w-6xl p-6">
        <TemplateDetailClient apiBase={API_BASE} initialDetail={detail} />
      </div>
    </main>
  );
}
