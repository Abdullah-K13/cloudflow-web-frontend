"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import axios from "axios";
import {
  Search,
  Filter,
  ChevronDown,
  ArrowUpDown,
  ExternalLink,
  RefreshCcw,
  Clock,
  Cloud,
  Check,
} from "lucide-react";

export type Deployment = {
  id: string;
  pipelineId: string;
  pipelineName: string;
  env: "dev" | "staging" | "prod" | string;
  cloud: "AWS" | "Azure" | "GCP" | string;
  region: string;
  status: "draft" | "ready" | "deploying" | "deployed" | "failed" | string;
  startedAt: string; // ISO
  durationSec: number;
  commit?: string;
};

// Raw API shape from FastAPI /pipelines
type PipelineApiResponse = {
  id: string;
  name: string;
  env: string;
  cloud: string;
  region?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  // other fields (payload, template_id, etc.) are ignored here
};

type Props = { initialData?: Deployment[] };

const ENVS = ["All", "dev", "staging", "prod"] as const;
const CLOUDS = ["All", "AWS", "Azure", "GCP"] as const;
const STATUSES = ["All", "ready", "deploying", "deployed", "failed"] as const;
const RANGES = ["24h", "7d", "30d", "All"] as const;

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

// --- auth helpers (same pattern as templates / pipelines page) ---

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

export default function ObservabilityClient({ initialData }: Props) {
  const [rows, setRows] = useState<Deployment[]>(
    () => (Array.isArray(initialData) ? initialData : [])
  );

  const [search, setSearch] = useState("");
  const [env, setEnv] = useState<(typeof ENVS)[number]>("All");
  const [cloud, setCloud] = useState<(typeof CLOUDS)[number]>("All");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("All");
  const [range, setRange] = useState<(typeof RANGES)[number]>("24h");
  const [sort, setSort] = useState<"started_desc" | "started_asc">(
    "started_desc"
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔹 Fetch pipelines and map them into Deployment rows
  useEffect(() => {
    const fetchDeployments = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await axios.get<PipelineApiResponse[]>(
          `${API_BASE}/pipelines`,
          {
            headers: {
              ...getAuthHeaders(),
            },
          }
        );

        const deployments: Deployment[] = res.data.map((p) => {
          const name = p.name ?? "Untitled pipeline";
          const env = (p.env ?? "dev") as Deployment["env"];
          const cloud = (p.cloud ?? "AWS") as Deployment["cloud"];
          const region = p.region ?? "";
          const status = (p.status ?? "draft") as Deployment["status"];

          const created = p.created_at ?? p.updated_at ?? new Date().toISOString();
          const updated = p.updated_at ?? created;

          const createdMs = new Date(created).getTime();
          const updatedMs = new Date(updated).getTime();
          const durationSec = Math.max(0, (updatedMs - createdMs) / 1000);

          return {
            id: p.id,
            pipelineId: p.id,
            pipelineName: name,
            env,
            cloud,
            region,
            status,
            startedAt: created,
            durationSec,
          };
        });

        setRows(deployments);
      } catch (err: any) {
        console.error("Failed to load deployments", err);
        const detail =
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Failed to load deployments";
        setError(
          typeof detail === "string" ? detail : "Failed to load deployments"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDeployments();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const now = Date.now();
    const rangeMs =
      range === "24h"
        ? 24 * 60 * 60 * 1000
        : range === "7d"
        ? 7 * 24 * 60 * 60 * 1000
        : range === "30d"
        ? 30 * 24 * 60 * 60 * 1000
        : Infinity;

    const rowsFiltered = rows.filter((d) => {
      const started = new Date(d.startedAt).getTime();
      const inRange = now - started <= rangeMs;

      const matchesSearch =
        !term ||
        d.pipelineName.toLowerCase().includes(term) ||
        d.id.toLowerCase().includes(term) ||
        d.pipelineId.toLowerCase().includes(term) ||
        d.region.toLowerCase().includes(term);

      const matchesEnv =
        env === "All" || d.env.toLowerCase() === env.toLowerCase();
      const matchesCloud =
        cloud === "All" || d.cloud.toLowerCase() === cloud.toLowerCase();
      const matchesStatus =
        status === "All" || d.status.toLowerCase() === status.toLowerCase();

      return inRange && matchesSearch && matchesEnv && matchesCloud && matchesStatus;
    });

    return rowsFiltered.sort((a, b) => {
      const A = new Date(a.startedAt).getTime();
      const B = new Date(b.startedAt).getTime();
      return sort === "started_desc" ? B - A : A - B;
    });
  }, [rows, search, env, cloud, status, range, sort]);

  /* ---------- Filter dropdown component (same file) ---------- */
  function FilterDropdown<T extends string>({
    label,
    value,
    onChange,
    options,
  }: {
    label: string;
    value: T;
    onChange: (v: T) => void;
    options: readonly T[];
  }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close on outside click / Escape
    useEffect(() => {
      const onDocClick = (e: MouseEvent) => {
        if (!ref.current?.contains(e.target as Node)) setOpen(false);
      };
      const onEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false);
      };
      document.addEventListener("mousedown", onDocClick);
      document.addEventListener("keydown", onEsc);
      return () => {
        document.removeEventListener("mousedown", onDocClick);
        document.removeEventListener("keydown", onEsc);
      };
    }, []);

    return (
      <div ref={ref} className="relative">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 transition-all hover:-translate-y-0.5 hover:border-teal-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
        >
          <span className="whitespace-nowrap">{label}:</span>
          <span className="font-semibold text-gray-800">{value}</span>
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {open && (
          <div
            role="listbox"
            className="absolute z-20 mt-2 w-44 origin-top-right rounded-xl border border-gray-200 bg-white p-1 shadow-lg ring-1 ring-black/5 transition-all"
          >
            {options.map((opt) => {
              const selected = opt === value;
              return (
                <button
                  key={String(opt)}
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                    selected
                      ? "bg-orange-50 text-orange-700"
                      : "text-gray-700 hover:bg-teal-50 hover:text-teal-700"
                  }`}
                >
                  <span className="truncate">{String(opt)}</span>
                  {selected && <Check className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Observability
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor deployments across environments. Drill down for logs and history.
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:text-teal-700"
          title="Refresh"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Error / loading */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {loading && !rows.length && (
        <div className="text-sm text-gray-500">Loading deployments…</div>
      )}

      {/* Controls */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white/60 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative w-full sm:max-w-sm">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by pipeline, ID, or region…"
            className="peer w-full rounded-xl border border-gray-200 bg-white px-10 py-2 text-sm outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
          />
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors duration-200 peer-focus:text-orange-600" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white/70 p-2">
          <FilterDropdown
            label="Env"
            value={env}
            onChange={setEnv}
            options={ENVS}
          />
          <FilterDropdown
            label="Cloud"
            value={cloud}
            onChange={setCloud}
            options={CLOUDS}
          />
          <FilterDropdown
            label="Status"
            value={status}
            onChange={setStatus}
            options={STATUSES}
          />
          <FilterDropdown
            label="Range"
            value={range}
            onChange={setRange}
            options={RANGES}
          />

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => {
                setSearch("");
                setEnv("All");
                setCloud("All");
                setStatus("All");
                setRange("24h");
              }}
              className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-all hover:-translate-y-0.5 hover:border-orange-300 hover:text-orange-700"
              title="Reset filters"
            >
              Reset
            </button>

            <button
              onClick={() =>
                setSort((s) =>
                  s === "started_desc" ? "started_asc" : "started_desc"
                )
              }
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-all hover:-translate-y-0.5 hover:border-teal-300 hover:text-teal-700"
              title="Sort by Started"
            >
              <ArrowUpDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  sort === "started_asc" ? "rotate-180" : ""
                }`}
              />
              Started
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50/80 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Pipeline</th>
              <th className="px-4 py-3">Env</th>
              <th className="px-4 py-3">Cloud / Region</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Started</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-sm text-gray-500"
                >
                  No deployments found for the selected filters.
                </td>
              </tr>
            )}

            {filtered.map((d) => {
              const started = new Date(d.startedAt);
              return (
                <tr
                  key={d.id}
                  className="group border-t border-gray-100/80 transition-colors hover:bg-orange-50/40"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Cloud className="h-4 w-4 text-gray-400" />
                      <Link
                        href={`/pipelines/${d.pipelineId}`}
                        className="font-medium text-gray-900 hover:text-orange-700"
                      >
                        {d.pipelineName}
                      </Link>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] uppercase text-gray-500">
                        {d.id}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <Chip tone={envTone(d.env)}>{d.env}</Chip>
                  </td>

                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-700">
                      {d.cloud} <span className="text-gray-400">•</span>{" "}
                      {d.region}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge status={d.status} />
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      {started.toLocaleString()}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-700">
                    {formatDuration(d.durationSec)}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/observability/${d.id}`}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-all hover:-translate-y-0.5 hover:border-orange-300 hover:text-orange-700"
                        title="View details"
                      >
                        Details
                      </Link>
                      <Link
                        href={`/pipelines/${d.pipelineId}/builder`}
                        className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-teal-700"
                        title="Open Builder"
                      >
                        Builder
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ---------- UI bits ---------- */

function Chip({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "gray" | "teal" | "orange" | "red" | "blue";
}) {
  const tones = {
    gray: "bg-gray-100 text-gray-700",
    teal: "bg-teal-100 text-teal-700",
    orange: "bg-orange-100 text-orange-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function envTone(env: string): "gray" | "teal" | "orange" | "red" | "blue" {
  const e = env.toLowerCase();
  if (e === "dev") return "teal";
  if (e === "staging") return "orange";
  if (e === "prod") return "red";
  return "gray";
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const map: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    ready: "bg-teal-100 text-teal-700",
    deploying: "bg-orange-100 text-orange-700",
    deployed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  };
  const cls = map[s] ?? map["draft"];
  const label = s.charAt(0).toUpperCase() + s.slice(1);
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {label}
    </span>
  );
}

function formatDuration(sec: number) {
  if (!sec || sec <= 0) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m ? `${m}m ${s}s` : `${s}s`;
}

/* Unused now, but kept in case you re-use it later */
function FilterPill<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: readonly T[];
}) {
  return (
    <div className="relative">
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:border-teal-300 hover:text-teal-700"
      >
        <Filter className="h-4 w-4" />
        {label}: <span className="font-semibold">{value}</span>
        <ChevronDown className="h-4 w-4" />
      </button>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={String(opt)}
            onClick={() => onChange(opt)}
            className={`rounded-full border px-2 py-0.5 text-xs transition-colors ${
              opt === value
                ? "border-orange-300 bg-orange-50 text-orange-700"
                : "border-gray-200 bg-white text-gray-600 hover:border-orange-300 hover:text-orange-700"
            }`}
          >
            {String(opt)}
          </button>
        ))}
      </div>
    </div>
  );
}
