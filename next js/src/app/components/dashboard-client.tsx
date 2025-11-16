"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Plus } from "lucide-react";
import axios from "axios";

// ---------- Types ----------
interface RecentArchitecture {
  id: string;
  name: string;
  lastModified: string;
}

// Raw API shape (from FastAPI /pipelines)
type PipelineApiResponse = {
  id: string;
  name: string;
  env: string;
  cloud: string;
  region?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  updatedAt?: string;
};

type Props = { userId: string | null; apiKey: string | null; name: string | null };

// ---------- API config & auth helpers ----------
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

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
  const localToken = localStorage.getItem("access_token");
  const token = cookieToken || localToken;

  return token ? { Authorization: `Bearer ${token}` } : {};
}

// small helper to show "2h ago", "3 days ago"
function formatRelativeTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";

  const diffMs = Date.now() - d.getTime();
  const sec = Math.floor(diffMs / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);

  if (sec < 60) return "Just now";
  if (min < 60) return `${min} min${min === 1 ? "" : "s"} ago`;
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  if (day < 7) return `${day} day${day === 1 ? "" : "s"} ago`;
  return d.toLocaleDateString();
}

export default function DashboardClient({ userId, apiKey, name }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [recentArchitectures, setRecentArchitectures] = useState<RecentArchitecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarError, setSidebarError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    loadRecentPipelines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRecentPipelines = async () => {
    try {
      setLoading(true);
      setSidebarError(null);

      const res = await axios.get<PipelineApiResponse[]>(
        `${API_BASE}/pipelines`,
        {
          headers: {
            ...getAuthHeaders(),
          },
        }
      );

      const pipelines = Array.isArray(res.data) ? res.data : [];

      // sort by updated_at / updatedAt / created_at desc
      const sorted = [...pipelines].sort((a, b) => {
        const aRaw = a.updated_at || a.updatedAt || a.created_at || "";
        const bRaw = b.updated_at || b.updatedAt || b.created_at || "";
        const aTime = new Date(aRaw).getTime();
        const bTime = new Date(bRaw).getTime();
        return (isNaN(bTime) ? 0 : bTime) - (isNaN(aTime) ? 0 : aTime);
      });

      // take top 3 as "Recent Architectures"
      const top = sorted.slice(0, 3).map((p) => ({
        id: p.id,
        name: p.name || "Untitled pipeline",
        lastModified: formatRelativeTime(p.updated_at || p.updatedAt || p.created_at),
      }));

      setRecentArchitectures(top);
    } catch (error: any) {
      console.error("Failed to load recent pipelines:", error);
      const detail =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "Failed to load recent pipelines";
      setSidebarError(typeof detail === "string" ? detail : "Failed to load recent pipelines");
      setRecentArchitectures([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isClient) {
    return (
      <div className="flex min-h-screen bg-white">
        <div className="flex-1 p-8">
          <div className="mb-8 h-8 w-64 animate-pulse rounded bg-gray-100" />
          <div className="grid grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white text-gray-800">
      {/* Left Content */}
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-semibold tracking-tight">
            Good Evening {name}
          </h1>
          <p className="mb-6 text-sm text-gray-500">
            Build, explore, and manage your pipelines with ease.
          </p>

          {/* Search Bar */}
          <div className="relative mb-8 max-w-md">
            <input
              type="text"
              placeholder="Search pipelines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="peer w-full rounded-xl border border-gray-200 bg-white/90 px-10 py-2 text-sm outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
            />
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 transition-colors duration-200 peer-focus:text-orange-600" />
          </div>
        </div>

        {/* Primary CTA (single button) */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* subtle orange wash */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-50/80 via-white to-white" />
          <div className="relative flex flex-col items-start gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
                <span className="inline-block h-2 w-2 rounded-full bg-orange-500" />
                Ready to ship faster?
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Create your next pipeline
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Start from a clean slate or customize from templates. You can add services and integrate later.
              </p>
            </div>

            <Link
              href="/workplace"
              className="group inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-orange-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 active:translate-y-0"
            >
              <Plus className="h-5 w-5 transition-transform duration-200 group-hover:rotate-90" />
              New Pipeline
            </Link>
          </div>
        </div>

        {/* Optional helper text */}
        <p className="mt-3 text-xs text-gray-400">
          Tip: You can refine and save pipeline drafts anytime.
        </p>
      </div>

      {/* Right Sidebar */}
      <aside className="w-80 border-l border-gray-200 bg-white p-6">
        <div className="mb-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Recent Architectures
          </h2>

          {sidebarError && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {sidebarError}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-lg bg-gray-100 p-3">
                  <div className="mb-2 h-4 rounded bg-gray-200" />
                  <div className="h-3 w-20 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : recentArchitectures.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-xs text-gray-500">
              No pipelines yet. Create your first pipeline to see it here.
            </div>
          ) : (
            <div className="space-y-3">
              {recentArchitectures.map((arch) => (
                <Link
                  key={arch.id}
                  href={`/workplace?pipeline=${arch.id}`}
                  className="block rounded-lg border border-transparent bg-gray-50 p-3 transition-all duration-200 hover:border-orange-200 hover:bg-orange-50"
                >
                  <h3 className="mb-1 font-medium text-gray-800">
                    {arch.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Last modified · {arch.lastModified}
                  </p>
                </Link>
              ))}
            </div>
          )}

          <Link
            href="/pipelines"
            className="mt-4 inline-flex items-center text-sm font-medium text-orange-600 transition-colors duration-200 hover:text-orange-700"
          >
            View All
            <svg
              className="ml-1 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </aside>
    </div>
  );
}
