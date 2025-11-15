// src/app/components/pipelines-client.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus, Search, Filter, ChevronDown, ExternalLink, Cloud, ArrowUpDown,
} from "lucide-react";
import type { Pipeline } from "@/app/actions/data_actions";

type Props = { initialData?: Pipeline[] }; // <- optional

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
const statuses = ["All", "draft", "ready", "deploying", "deployed", "failed"] as const;

export default function PipelinesClient({ initialData }: Props) {
  const base: Pipeline[] = Array.isArray(initialData) ? initialData : []; // <- guard

  const [search, setSearch] = useState("");
  const [cloud, setCloud] = useState<(typeof clouds)[number]>("All");
  const [env, setEnv] = useState<(typeof envs)[number]>("All");
  const [status, setStatus] = useState<(typeof statuses)[number]>("All");
  const [sort, setSort] = useState<"updated_desc" | "updated_asc">("updated_desc");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    const rows = base.filter((p) => {
      const name = getName(p);
      const id = String(getId(p));
      const matchesSearch = !term || name.toLowerCase().includes(term) || id.toLowerCase().includes(term);

      const matchesCloud = cloud === "All" || (getCloud(p) ?? "").toLowerCase() === cloud.toLowerCase();
      const matchesEnv = env === "All" || (getEnv(p) ?? "").toLowerCase() === env.toLowerCase();
      const matchesStatus = status === "All" || (getStatus(p) ?? "").toLowerCase() === status.toLowerCase();

      return matchesSearch && matchesCloud && matchesEnv && matchesStatus;
    });

    return rows.sort((a, b) => {
      const da = getUpdatedAt(a).getTime();
      const db = getUpdatedAt(b).getTime();
      const A = isNaN(da) ? 0 : da;
      const B = isNaN(db) ? 0 : db;
      return sort === "updated_desc" ? B - A : A - B;
    });
  }, [base, search, cloud, env, status, sort]);

  return (
    <section className="space-y-6 pl-10 pr-10">
      {/* Header / Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Pipelines</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create, filter, and manage your infrastructure pipelines.
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
          <FilterPill label="Cloud" value={cloud} onChange={setCloud} options={clouds} />
          <FilterPill label="Env" value={env} onChange={setEnv} options={envs} />
          <FilterPill label="Status" value={status} onChange={setStatus} options={statuses} />

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
                setSort((s) => (s === "updated_desc" ? "updated_asc" : "updated_desc"))
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
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                  No pipelines match your filters. Try adjusting them or{" "}
                  <Link href="/pipelines/new" className="text-orange-600 hover:text-orange-700">
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
                      <Link
                        href={`/pipelines/${id}`}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-all hover:-translate-y-0.5 hover:border-orange-300 hover:text-orange-700"
                        title="View Summary"
                      >
                        Summary
                      </Link>
                      <Link
                        href={`/pipelines/${id}/builder`}
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

/* ---------- UI bits (chips, filters, status) ---------- */

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
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{label}</span>
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
      {/* Simple popover */}
      <div className="invisible absolute z-10 mt-2 w-36 translate-y-1 rounded-xl border border-gray-200 bg-white p-1 text-sm opacity-0 shadow-lg transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
        {/* Using a group wrapper would allow hover-open; to keep it clickless here,
            keep the control simple: we just render inline pills below */}
      </div>
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
