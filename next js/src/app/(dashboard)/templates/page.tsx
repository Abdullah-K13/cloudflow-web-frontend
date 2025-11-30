"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Search, Tag, X, Plus, Cloud } from "lucide-react";

// Raw API shape from FastAPI
type TemplateApiResponse = {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  provider: string;
  version: string;
  folder: string;
};

// UI shape used by this page
export type Template = {
  id: string;
  name: string;
  description: string;
  tags: Array<"aws" | "serverless" | "data" | "k8s" | string>;
  provider?: string; // Cloud provider: aws, gcp, azure
  lastUpdated?: string; // we don't have it yet, so it'll be undefined
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const ALL_TAGS = ["all", "aws", "azure", "gcp","serverless"] as const;
type TagFilter = (typeof ALL_TAGS)[number];

// --- helpers ---

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split(";").map((c) => c.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith(name + "=")) {
      return cookie.substring(name.length + 1);
    }
  }
  return null;
}

function getAuthHeaders() {
  if (typeof window === "undefined") return {};
  const cookieToken = getCookie("access_token");
  const localToken = localStorage.getItem("access_token"); // fallback if you ever store it there too
  const token = cookieToken || localToken;

  console.log("Token from cookies/localStorage:", token);

  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState<TagFilter>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch templates from backend
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await axios.get<TemplateApiResponse[]>(`${API_BASE}/templates`, {
          headers: {
            ...getAuthHeaders(),
          },
        });

        const mapped: Template[] = res.data.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description ?? "",
          tags: t.tags || [],
          provider: t.provider?.toLowerCase(), // Include provider from API
          lastUpdated: undefined, // you can wire this later if backend returns it
        }));

        setTemplates(mapped);
      } catch (err: any) {
        console.error(err);
        setError(err?.response?.data?.detail || "Failed to load templates");
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return templates
      .filter((t) => {
        const matchesSearch =
          !term ||
          t.name.toLowerCase().includes(term) ||
          t.description.toLowerCase().includes(term);

        const matchesTag =
          tag === "all" ||
          t.tags.map((x) => x.toLowerCase()).includes(tag);

        return matchesSearch && matchesTag;
      })
      .sort((a, b) => {
        const da = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
        const db = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
        return db - da;
      });
  }, [templates, search, tag]);

  if (loading && !templates.length) {
    return <div className="p-4">Loading templates…</div>;
  }

  return (
<section className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Templates</h1>
          <p className="mt-1 text-sm text-gray-500">
            Start faster with curated, production-ready blueprints.
          </p>
        </div>
        <Link
          href="/pipelines/new"
          className="group inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-orange-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200"
        >
          <Plus className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
          New Pipeline
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white/60 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative w-full sm:max-w-sm">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates…"
            className="peer w-full rounded-xl border border-gray-200 bg-white px-10 py-2 text-sm outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
          />
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors duration-200 peer-focus:text-orange-600" />
        </div>

        {/* Tag filters */}
        <div className="flex flex-wrap items-center gap-2">
          {ALL_TAGS.map((t) => (
            <button
              key={t}
              onClick={() => setTag(t)}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                tag === t
                  ? "border-orange-300 bg-orange-50 text-orange-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-teal-300 hover:text-teal-700"
              }`}
              aria-pressed={tag === t}
            >
              <Tag className="h-3.5 w-3.5" />
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Blank starter */}
        <Link
          href="/pipelines/new"
          className="group block rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center transition-all duration-200 hover:border-orange-300 hover:bg-orange-50/40 hover:shadow-sm"
        >
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-teal-600 text-white transition-transform duration-200 group-hover:scale-105">
            <Plus className="h-6 w-6" />
          </div>
          <h3 className="font-medium text-gray-900">Start from blank</h3>
          <p className="mt-1 text-sm text-gray-500">Design your architecture from scratch.</p>
        </Link>

        {filtered.map((t) => {
          // Get provider from template or infer from tags
          const provider = t.provider || t.tags.find(tag => 
            ['aws', 'gcp', 'azure'].includes(tag.toLowerCase())
          )?.toLowerCase() as 'aws' | 'gcp' | 'azure' | undefined;
          
          // Provider colors
          const getProviderStyles = (prov?: string) => {
            switch (prov) {
              case 'aws':
                return 'bg-orange-50 border-orange-200 text-orange-700';
              case 'gcp':
                return 'bg-blue-50 border-blue-200 text-blue-700';
              case 'azure':
                return 'bg-cyan-50 border-cyan-200 text-cyan-700';
              default:
                return 'bg-gray-50 border-gray-200 text-gray-700';
            }
          };

          // Filter out provider tags from other tags
          const otherTags = t.tags.filter(tg => 
            !['aws', 'gcp', 'azure'].includes(tg.toLowerCase())
          );

          return (
            <article
              key={t.id}
              className="group relative flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg"
            >
              {/* Provider Badge - Top Right */}
              {provider && (
                <div className={`absolute top-4 right-4 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase ${getProviderStyles(provider)}`}>
                  <Cloud className="h-3 w-3" />
                  {provider}
                </div>
              )}

              {/* Header */}
              <div className="mb-3 pr-20">
                <h3 className="text-base font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                  {t.name}
                </h3>
              </div>

              {/* Description - Reduced */}
              <p className="line-clamp-2 text-sm text-gray-600 mb-4">{t.description}</p>

              {/* Tags - Only show non-provider tags */}
              {otherTags.length > 0 && (
                <div className="mt-auto flex flex-wrap gap-1.5 mb-4">
                  {otherTags.slice(0, 2).map((tg) => (
                    <span
                      key={tg}
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                        tg === "serverless"
                          ? "bg-teal-100 text-teal-700"
                          : tg === "data"
                          ? "bg-purple-100 text-purple-700"
                          : tg === "k8s"
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {String(tg).toUpperCase()}
                    </span>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  {t.lastUpdated ? new Date(t.lastUpdated).toLocaleDateString() : "—"}
                </span>
                <Link
                  href={`/templates/${t.id}`}
                  className="inline-flex items-center rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-orange-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200"
                >
                  Use template
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
