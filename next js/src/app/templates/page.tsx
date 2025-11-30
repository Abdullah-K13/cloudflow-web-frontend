"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Search, Tag, Eye, X, Lock } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

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
  lastUpdated?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const ALL_TAGS = ["all", "aws", "azure", "serverless", "data", "k8s"] as const;
type TagFilter = (typeof ALL_TAGS)[number];

export default function PublicTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState<TagFilter>("all");
  const [preview, setPreview] = useState<Template | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch templates from backend (public endpoint, no auth required)
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await axios.get<TemplateApiResponse[]>(`${API_BASE}/templates`);

        const mapped: Template[] = res.data.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description ?? "",
          tags: t.tags || [],
          lastUpdated: undefined,
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
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="p-4 text-center">Loading templates…</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <section className="space-y-6">
          {/* Header */}
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Templates</h1>
              <p className="mt-2 text-lg text-muted-foreground">
                Browse our collection of production-ready cloud architecture templates. Sign up to use them.
              </p>
            </div>
            <Button size="lg" className="btn-primary" asChild>
              <Link href="/signup">
                Get Started Free
              </Link>
            </Button>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative w-full sm:max-w-sm">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates…"
                className="peer w-full rounded-xl border border-border bg-background px-10 py-2 text-sm outline-none transition-all duration-200 placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20"
              />
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors duration-200 peer-focus:text-primary" />
            </div>

            {/* Tag filters */}
            <div className="flex flex-wrap items-center gap-2">
              {ALL_TAGS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTag(t)}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    tag === t
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
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
            {filtered.map((t) => (
              <article
                key={t.id}
                className="group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="max-w-[75%] truncate text-base font-semibold text-foreground">
                    {t.name}
                  </h3>
                  <button
                    onClick={() => setPreview(t)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                    aria-label={`Preview ${t.name}`}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </button>
                </div>

                <p className="line-clamp-3 text-sm text-muted-foreground">{t.description}</p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {t.tags.map((tg) => (
                    <span
                      key={tg}
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                        tg === "aws"
                          ? "bg-orange-100 text-orange-700"
                          : tg === "serverless"
                          ? "bg-teal-100 text-teal-700"
                          : tg === "data"
                          ? "bg-gray-100 text-gray-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {String(tg).toUpperCase()}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Updated {t.lastUpdated ? new Date(t.lastUpdated).toLocaleDateString() : "—"}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="inline-flex items-center gap-1"
                    asChild
                  >
                    <Link href="/signup">
                      <Lock className="h-3.5 w-3.5" />
                      Sign up to use
                    </Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>

          {filtered.length === 0 && !loading && (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">No templates found matching your search.</p>
            </div>
          )}
        </section>

        {/* Preview Modal */}
        {preview && (
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm"
            onClick={() => setPreview(null)}
          >
            <div
              className="relative w-full max-w-lg scale-100 rounded-2xl border border-border bg-card p-6 shadow-xl transition-transform duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreview(null)}
                className="absolute right-3 top-3 rounded-lg border border-border bg-background p-1 text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                aria-label="Close preview"
              >
                <X className="h-4 w-4" />
              </button>

              <h3 className="pr-8 text-lg font-semibold text-foreground">{preview.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{preview.description}</p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {preview.tags.map((tg) => (
                  <span
                    key={tg}
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                      tg === "aws"
                        ? "bg-orange-100 text-orange-700"
                        : tg === "serverless"
                        ? "bg-teal-100 text-teal-700"
                        : tg === "data"
                        ? "bg-gray-100 text-gray-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {String(tg).toUpperCase()}
                  </span>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
                <p className="mb-1 font-medium text-foreground">What's inside</p>
                <ul className="list-inside list-disc text-muted-foreground">
                  <li>Terraform template in infra/templates</li>
                  <li>Tags, sensible defaults, providers</li>
                  <li>Ready for Plan/Apply from the Builder</li>
                </ul>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPreview(null)}
                >
                  Close
                </Button>
                <Button className="btn-primary" asChild>
                  <Link href="/signup">
                    Sign up to use
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

