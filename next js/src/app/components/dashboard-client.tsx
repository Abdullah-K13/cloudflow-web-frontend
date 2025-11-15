"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Plus } from "lucide-react";

// Types
interface RecentArchitecture {
  id: string;
  name: string;
  lastModified: string;
}

// API Configuration (for future use)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";
const API_ENDPOINTS = {
  architectures: `${API_BASE_URL}/architectures`,
  pipelines: `${API_BASE_URL}/pipelines`,
};

// API Functions (for future implementation)
const apiService = {
  getRecentArchitectures: async (): Promise<RecentArchitecture[]> => {
    // TODO: Replace with actual API call
    return [
      { id: "1", name: "Angies-Clothing", lastModified: "2 hours ago" },
      { id: "2", name: "Kerma Datacenter", lastModified: "1 day ago" },
      { id: "3", name: "Johansons", lastModified: "3 days ago" },
    ];
  },
  createPipeline: async (_pipelineData: any) => {},
};

type Props = { userId: string | null; apiKey: string | null; name: string | null };

export default function DashboardClient({ userId, apiKey, name }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [recentArchitectures, setRecentArchitectures] = useState<RecentArchitecture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);
    loadRecentArchitectures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRecentArchitectures = async () => {
    try {
      const architectures = await apiService.getRecentArchitectures();
      setRecentArchitectures(architectures);
    } catch (error) {
      console.error("Failed to load recent architectures:", error);
      setRecentArchitectures([
        { id: "1", name: "Angies-Clothing", lastModified: "2 hours ago" },
        { id: "2", name: "Kerma Datacenter", lastModified: "1 day ago" },
        { id: "3", name: "Johansons", lastModified: "3 days ago" },
      ]);
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
          <h1 className="mb-2 text-2xl font-semibold tracking-tight">Good Evening {name}</h1>
          <p className="mb-6 text-sm text-gray-500">Build, explore, and manage your pipelines with ease.</p>

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
              <h2 className="text-xl font-semibold text-gray-900">Create your next pipeline</h2>
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
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Architectures</h2>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-lg bg-gray-100 p-3">
                  <div className="mb-2 h-4 rounded bg-gray-200" />
                  <div className="h-3 w-20 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {recentArchitectures.map((arch) => (
                <Link
                  key={arch.id}
                  href={`/workplace?architecture=${arch.id}`}
                  className="block rounded-lg border border-transparent bg-gray-50 p-3 transition-all duration-200 hover:border-orange-200 hover:bg-orange-50"
                >
                  <h3 className="mb-1 font-medium text-gray-800">{arch.name}</h3>
                  <p className="text-sm text-gray-500">{arch.lastModified}</p>
                </Link>
              ))}
            </div>
          )}
          <Link
            href="/architectures"
            className="mt-4 inline-flex items-center text-sm font-medium text-orange-600 transition-colors duration-200 hover:text-orange-700"
          >
            View All
            <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </aside>
    </div>
  );
}
