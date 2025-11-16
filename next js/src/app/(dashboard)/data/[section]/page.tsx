"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import {
  Plus,
  Search,
  Filter,
  ChevronDown,
  Cloud,
  ArrowUpDown,
  Edit3,
  Trash2,
  AlertTriangle,
  X,
  FileText,
  Loader2,
} from "lucide-react";
import type { Pipeline } from "@/src/app/actions/data_actions";

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
  payload?: any;
  template_id?: string | null;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

// --- auth helpers (same idea as Templates page) ---

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

type Props = { initialData?: Pipeline[] };

// Safer getters
const getName = (p: Pipeline) =>
  ((p as any)?.name ?? (p as any)?.title ?? "Untitled") as string;

const getId = (p: Pipeline) =>
  ((p as any)?.id ?? (p as any)?._id ?? "") as string | number;

const getCloud = (p: Pipeline) =>
  ((p as any)?.cloud ?? (p as any)?.provider ?? "AWS") as string;

const getEnv = (p: Pipeline) =>
  ((p as any)?.env ?? (p as any)?.environment ?? "dev") as string;

const getStatus = (p: Pipeline) =>
  ((p as any)?.status ?? "draft") as string;

const getUpdatedAt = (p: Pipeline) => {
  const raw =
    (p as any)?.updatedAt ??
    (p as any)?.updated_at ??
    (p as any)?.updated ??
    0;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? new Date(0) : d;
};

const clouds = ["All", "AWS", "Azure", "GCP"] as const;
const envs = ["All", "dev", "staging", "prod"] as const;
const statuses = [
  "All",
  "draft",
  "ready",
  "deploying",
  "deployed",
  "failed",
] as const;

export default function PipelinesClient({ initialData }: Props) {
  const [rows, setRows] = useState<Pipeline[]>(
    () => (Array.isArray(initialData) ? initialData : [])
  );

  const [search, setSearch] = useState("");
  const [cloud, setCloud] = useState<(typeof clouds)[number]>("All");
  const [env, setEnv] = useState<(typeof envs)[number]>("All");
  const [status, setStatus] = useState<(typeof statuses)[number]>("All");
  const [sort, setSort] =
    useState<"updated_desc" | "updated_asc">("updated_desc");

  const [isDeletingId, setIsDeletingId] = useState<
    string | number | null
  >(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // delete confirm modal
  const [confirmTarget, setConfirmTarget] = useState<{
    id: string | number;
    name: string;
  } | null>(null);

  // summary modal
  const [summaryTarget, setSummaryTarget] = useState<{
    id: string | number;
    name: string;
  } | null>(null);
  const [summaryData, setSummaryData] =
    useState<PipelineApiResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // 🔹 Fetch pipelines from FastAPI using cookie-based auth
  useEffect(() => {
    const fetchPipelines = async () => {
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

        const mapped: Pipeline[] = res.data as any;
        setRows(mapped);
      } catch (err: any) {
        console.error("Failed to load pipelines", err);
        const detail =
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Failed to load pipelines";
        setError(
          typeof detail === "string" ? detail : "Failed to load pipelines"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPipelines();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    const filteredRows = rows.filter((p) => {
      const name = getName(p);
      const id = String(getId(p));
      const matchesSearch =
        !term ||
        name.toLowerCase().includes(term) ||
        id.toLowerCase().includes(term);

      const matchesCloud =
        cloud === "All" ||
        (getCloud(p) ?? "").toLowerCase() === cloud.toLowerCase();
      const matchesEnv =
        env === "All" ||
        (getEnv(p) ?? "").toLowerCase() === env.toLowerCase();
      const matchesStatus =
        status === "All" ||
        (getStatus(p) ?? "").toLowerCase() === status.toLowerCase();

      return matchesSearch && matchesCloud && matchesEnv && matchesStatus;
    });

    return filteredRows.sort((a, b) => {
      const da = getUpdatedAt(a).getTime();
      const db = getUpdatedAt(b).getTime();
      const A = isNaN(da) ? 0 : da;
      const B = isNaN(db) ? 0 : db;
      return sort === "updated_desc" ? B - A : A - B;
    });
  }, [rows, search, cloud, env, status, sort]);

  // ---------- DELETE PIPELINE ----------

  const performDelete = async () => {
    if (!confirmTarget) return;
    const { id } = confirmTarget;

    try {
      setIsDeletingId(id);

      const res = await axios.delete(`${API_BASE}/pipelines/${id}`, {
        headers: {
          ...getAuthHeaders(),
        },
      });

      if (res.status !== 204 && res.status !== 200) {
        throw new Error(`Failed with status ${res.status}`);
      }

      setRows((prev) => prev.filter((p) => getId(p) !== id));
      setConfirmTarget(null);
    } catch (err) {
      console.error("Delete pipeline error:", err);
      setError("Failed to delete pipeline");
    } finally {
      setIsDeletingId(null);
    }
  };

  // ---------- SUMMARY PIPELINE ----------

  const openSummary = async (id: string | number, name: string) => {
    setSummaryTarget({ id, name: name || "Untitled" });
    setSummaryData(null);
    setSummaryError(null);
    setSummaryLoading(true);

    try {
      const res = await axios.get<PipelineApiResponse>(
        `${API_BASE}/pipelines/${id}`,
        {
          headers: {
            ...getAuthHeaders(),
          },
        }
      );
      setSummaryData(res.data);
    } catch (err: any) {
      console.error("Failed to load pipeline summary", err);
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Failed to load pipeline summary";
      setSummaryError(
        typeof detail === "string" ? detail : "Failed to load pipeline summary"
      );
    } finally {
      setSummaryLoading(false);
    }
  };

  const closeSummary = () => {
    setSummaryTarget(null);
    setSummaryData(null);
    setSummaryError(null);
  };

  return (
    <section className="space-y-6 pl-10 pr-10">
      {/* Header / Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Pipelines
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Create, filter, and manage your infrastructure pipelines.
          </p>
        </div>

        <Link
          href="/workplace"
          className="group inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-orange-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200"
        >
          <Plus className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
          New Pipeline
        </Link>
      </div>

      {/* Error + loading */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {loading && !rows.length && (
        <div className="px-4 py-3 text-sm text-gray-500">
          Loading pipelines…
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white/60 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative w-full sm:max-w-sm">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or ID…"
            className="peer w-full rounded-xl border border-gray-200 bg-white px-10 py-2 text-sm outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
          />
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors duration-200 peer-focus:text-orange-600" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <FilterPill
            label="Cloud"
            value={cloud}
            onChange={setCloud}
            options={clouds}
          />
          <FilterPill
            label="Env"
            value={env}
            onChange={setEnv}
            options={envs}
          />
          <FilterPill
            label="Status"
            value={status}
            onChange={setStatus}
            options={statuses}
          />

          <button
            onClick={() => {
              setSearch("");
              setCloud("All");
              setEnv("All");
              setStatus("All");
            }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:border-orange-300 hover:text-orange-700"
          >
            Reset
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() =>
                setSort((s) =>
                  s === "updated_desc" ? "updated_asc" : "updated_desc"
                )
              }
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:border-teal-300 hover:text-teal-700"
              title="Sort by Updated"
            >
              <ArrowUpDown className="h-4 w-4" />
              Updated
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50/80 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Cloud</th>
              <th className="px-4 py-3">Environment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-sm text-gray-500"
                >
                  No pipelines match your filters. Try adjusting them or{" "}
                  <Link
                    href="/pipelines/new"
                    className="text-orange-600 hover:text-orange-700"
                  >
                    create a new pipeline
                  </Link>
                  .
                </td>
              </tr>
            )}

            {filtered.map((p) => {
              const id = getId(p);
              const name = getName(p);
              const cloud = getCloud(p);
              const env = getEnv(p);
              const status = getStatus(p);
              const updated = getUpdatedAt(p);

              return (
                <tr
                  key={id}
                  className="group border-t border-gray-100/80 transition-colors hover:bg-orange-50/40"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Cloud className="h-4 w-4 text-gray-400" />
                      <Link
                        href={`/pipelines/${id}`}
                        className="font-medium text-gray-900 hover:text-orange-700"
                      >
                        {name}
                      </Link>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] uppercase text-gray-500">
                        {id}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <Chip tone="teal">{cloud}</Chip>
                  </td>

                  <td className="px-4 py-3">
                    <Chip tone="gray">{env}</Chip>
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge status={status} />
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-600">
                    {updated.toLocaleString()}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {/* Quick summary modal */}
                      <button
                        onClick={() => openSummary(id, name)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-300 hover:text-teal-700"
                        title="Quick summary"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Summary
                      </button>

                      {/* Update = open canvas/builder */}
                      <Link
                        href={`/pipelines/${id}/builder`}
                        className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-teal-700"
                        title="Update pipeline"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Update
                      </Link>

                      {/* Delete */}
                      <button
                        onClick={() =>
                          setConfirmTarget({ id, name: name || "Untitled" })
                        }
                        disabled={isDeletingId === id}
                        className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        title="Delete pipeline"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Confirm delete modal */}
      {confirmTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl ring-1 ring-black/5">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-red-50 p-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-semibold text-gray-900">
                  Delete pipeline?
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  This will permanently remove{" "}
                  <span className="font-medium text-gray-900">
                    {confirmTarget.name}
                  </span>{" "}
                  and its configuration. This action cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setConfirmTarget(null)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setConfirmTarget(null)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-gray-300 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={performDelete}
                disabled={isDeletingId === confirmTarget.id}
                className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isDeletingId === confirmTarget.id ? (
                  "Deleting…"
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary modal */}
      {summaryTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl ring-1 ring-black/5">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-teal-50 p-2">
                <FileText className="h-5 w-5 text-teal-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-semibold text-gray-900">
                  Pipeline summary
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Quick overview for{" "}
                  <span className="font-medium text-gray-900">
                    {summaryTarget.name}
                  </span>
                  .
                </p>
              </div>
              <button
                onClick={closeSummary}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 border-t border-gray-100 pt-4 text-sm">
              {summaryLoading && (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading summary…
                </div>
              )}

              {!summaryLoading && summaryError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {summaryError}
                </div>
              )}

              {!summaryLoading && summaryData && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <SummaryItem label="Name" value={summaryData.name} />
                    <SummaryItem label="ID" value={summaryData.id} />
                    <SummaryItem label="Env" value={summaryData.env} />
                    <SummaryItem label="Cloud" value={summaryData.cloud} />
                    <SummaryItem
                      label="Region"
                      value={summaryData.region || "—"}
                    />
                    <SummaryItem
                      label="Status"
                      value={summaryData.status || "draft"}
                    />
                    <SummaryItem
                      label="Template"
                      value={summaryData.template_id || "—"}
                    />
                    <SummaryItem
                      label="Created"
                      value={
                        summaryData.created_at
                          ? new Date(
                              summaryData.created_at
                            ).toLocaleString()
                          : "—"
                      }
                    />
                    <SummaryItem
                      label="Updated"
                      value={
                        summaryData.updated_at || summaryData.updatedAt
                          ? new Date(
                              (summaryData.updated_at ||
                                summaryData.updatedAt)!
                            ).toLocaleString()
                          : "—"
                      }
                    />
                  </div>

                  {summaryData.payload && (
                    <div className="mt-2">
                      <div className="text-xs font-semibold text-gray-700 mb-1">
                        Payload (preview)
                      </div>
                      <pre className="max-h-40 overflow-auto rounded-lg bg-gray-50 p-2 text-xs text-gray-700">
                        {JSON.stringify(summaryData.payload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Link
                href={`/pipelines/${summaryTarget.id}`}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-gray-300 hover:text-gray-900"
              >
                Open full page
              </Link>
              <button
                onClick={closeSummary}
                className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------- UI bits (chips, filters, status, summary item) ---------- */

function Chip({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "gray" | "teal" | "orange";
}) {
  const tones = {
    gray: "bg-gray-100 text-gray-700",
    teal: "bg-teal-100 text-teal-700",
    orange: "bg-orange-100 text-orange-700",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
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
        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:border-teal-300 hover:text-teal-700"
        type="button"
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

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <div className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
        {label}
      </div>
      <div className="text-sm text-gray-900 break-words">{value || "—"}</div>
    </div>
  );
}
