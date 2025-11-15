"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function TemplateStarter({
  apiBase,
  templateDetail,
}: {
  apiBase: string;
  templateDetail: any | null;
}) {
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!templateDetail) setMsg("No template selected. Pick one from Templates.");
  }, [templateDetail]);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">New Pipeline</h1>
        <p className="text-sm text-gray-600">
          Start from a template and deploy, or open in the canvas to customize.
        </p>
      </header>

      {!templateDetail ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
          {msg}{" "}
          <Link href="/templates" className="text-teal-700 underline">
            Go to Templates
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">{templateDetail.name}</h2>
          {templateDetail.summary && (
            <p className="mt-1 text-sm text-gray-600">{templateDetail.summary}</p>
          )}
          <div className="mt-4 flex items-center gap-2">
            <Link
              href={`/templates/${templateDetail.id}`}
              className="inline-flex items-center rounded-xl border border-teal-200 bg-white px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50"
            >
              Review details
            </Link>
            <Link
              href={`/canvas?template=${templateDetail.id}`}
              className="inline-flex items-center rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
            >
              Open in Canvas
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
