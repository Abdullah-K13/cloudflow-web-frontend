"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, ChevronDown, ChevronRight, Database, Workflow, Plus } from "lucide-react";

type ServiceKey = "s3" | "lambda" | "sqs" | "sns" | "dynamodb";

interface SelectedNode {
  id: string;
  type: string; // e.g. "s3", "lambda", ...
}

interface LeftPanelProps {
  projectName?: string;
  pipelines?: string[];
  datasets?: string[];
  /** kept for compatibility but ignored (panel no longer collapses) */
  isCollapsed?: boolean;
  onToggle?: () => void;
  canvasNodes?: { id: string; type: string }[];

}

const API_URL = "http://localhost:8000/estimate-cost";
const API_KEY_COOKIE = "api_key"; // change if your cookie name is different
const SUPPORTED: ServiceKey[] = ["s3", "lambda", "sqs", "sns", "dynamodb"];

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[2]) : null;
}

function normalizeService(type: string): ServiceKey | null {
  const t = (type || "").toLowerCase();
  if (SUPPORTED.includes(t as ServiceKey)) return t as ServiceKey;
  // common aliases from node labels
  if (t.includes("s3")) return "s3";
  if (t.includes("lambda")) return "lambda";
  if (t.includes("sqs")) return "sqs";
  if (t.includes("sns")) return "sns";
  if (t.includes("dynamo")) return "dynamodb";
  return null;
  
}


function currency(n: number): string {
  if (isNaN(n)) return "$11";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

type CostItem = {
  service: ServiceKey;
  unitCost: number; // cost for one node of this service (per month)
  count: number;    // how many nodes of this service are selected
  total: number;    // unitCost * count
  ok: boolean;
  error?: string;
};

export default function LeftPanel({
  projectName = "My Project",
  pipelines = ["Data Pipeline 1", "Analytics Pipeline", "ETL Process"],
  datasets = ["Customer_Orders", "Former_market_list", "Jan_last_sort", "Random"],
  // selectedNodes = [],
    canvasNodes = [],                       

}: LeftPanelProps) {
  const canvasServiceCounts = useMemo(() => {
  const map = new Map<ServiceKey, number>();
  for (const n of (canvasNodes ?? [])) {
    const svc = normalizeService(n.type);
    if (!svc) continue;
    map.set(svc, (map.get(svc) ?? 0) + 1);
  }
  return map;
}, [canvasNodes]);
useEffect(() => {
    console.log("LP canvasNodes:", canvasNodes);
    console.log("LP counts:", Array.from(canvasServiceCounts.entries()));
  }, [canvasNodes, canvasServiceCounts]);


  const [unitCostCache, setUnitCostCache] = useState<Partial<Record<ServiceKey, number>>>({});

  const [openPipelines, setOpenPipelines] = useState(true);
  const [openDatasets, setOpenDatasets] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [width, setWidth] = useState(272);
  const [isResizing, setIsResizing] = useState(false);
  const [q, setQ] = useState("");

  const contentRef = useRef<HTMLDivElement>(null);
  const [spot, setSpot] = useState<{ x: number; y: number }>({ x: -9999, y: -9999 });

  useEffect(() => setMounted(true), []);


  // --- resizer
  const onResizeStart = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(230, Math.min(540, e.clientX - 64));
      setWidth(newWidth);
    };
    const up = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
    }
    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
  }, [isResizing]);

  // --- search
  const norm = (s: string) => s.toLowerCase().replace(/\s|[_-]+/g, "");
  const filteredPipelines = useMemo(() => pipelines.filter(p => norm(p).includes(norm(q))), [pipelines, q]);
  const filteredDatasets  = useMemo(() => datasets.filter(d => norm(d).includes(norm(q))), [datasets, q]);

  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ===================== COST FETCHING =====================

  const [costItems, setCostItems] = useState<CostItem[] | null>(null);
  const [costLoading, setCostLoading] = useState(false);

  // derive selected services & counts from selected nodes
  const selectedServiceCounts = useMemo(() => {
    const map = new Map<ServiceKey, number>();
    for (const n of canvasNodes) {
      const svc = normalizeService(n.type);
      if (!svc) continue;
      map.set(svc, (map.get(svc) ?? 0) + 1);
    }
    return map; // service -> count
  }, [canvasNodes]);

useEffect(() => {
  let cancelled = false;
  const controller = new AbortController();

  // helper: build display items from a given cache snapshot
  const buildItems = (cache: Partial<Record<ServiceKey, number>>): CostItem[] => {
    return Array.from(canvasServiceCounts.entries()).map(([service, count]) => {
      const unit = Number(cache[service] ?? 0);
      return { service, unitCost: unit, count, total: unit * count, ok: true };
    });
  };

  const present = Array.from(canvasServiceCounts.keys());              // services on canvas
  const missing = present.filter((svc) => unitCostCache[svc] == null); // services we don't have priced yet

  // nothing on canvas
  if (present.length === 0) {
    setCostItems([]);
    setCostLoading(false);
    return () => {};
  }

  // all services already in cache → recompute totals, no API calls
  if (missing.length === 0) {
    setCostItems(buildItems(unitCostCache));
    setCostLoading(false);
    return () => {};
  }

  // fetch only the missing services
  setCostLoading(true);
  (async () => {
    try {
      const apiKey = getCookie(API_KEY_COOKIE);
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (apiKey) headers["x-api-key"] = apiKey;

      const results = await Promise.allSettled(
        missing.map(async (service) => {
          const res = await fetch(API_URL, {
            method: "POST",
            headers,
            body: JSON.stringify({ service, region: "ap-southeast-2" }),
            signal: controller.signal,
            credentials: "include",
          });
          if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
          const json = await res.json();
          return [service, Number(json?.estimated_monthly_usd ?? 0)] as const;
        })
      );

      // merge into cache
      const additions: Partial<Record<ServiceKey, number>> = {};
      results.forEach((r, i) => {
        const svc = missing[i];
        additions[svc] = r.status === "fulfilled" ? r.value[1] : 0; // fallback 0 on error
      });

      if (cancelled) return;
      setUnitCostCache((prev) => {
        const merged = { ...prev, ...additions };
        setCostItems(buildItems(merged)); // recompute with new cache
        setCostLoading(false);
        return merged;
      });
    } catch (e) {
      if (!cancelled) {
        console.warn("Cost fetch error", e);
        // still show whatever we have cached
        setCostItems(buildItems(unitCostCache));
        setCostLoading(false);
      }
    }
  })();

  return () => {
    cancelled = true;
    controller.abort();
  };
}, [canvasServiceCounts, unitCostCache]);

  const totalCost = useMemo(() => {
    if (!costItems) return 0;
    return costItems.reduce((sum, it) => sum + (it.ok ? it.total : 0), 0);
  }, [costItems]);

  if (!mounted) return null;

  return (
    <div
      className="relative z-10 bg-white/90 backdrop-blur-sm border-r border-slate-100 shadow-sm flex flex-col overflow-hidden"
      style={{ width }}
    >
      {/* resize handle */}
      <div className="absolute top-0 right-0 w-1 h-full cursor-ew-resize group" onMouseDown={onResizeStart}>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-16 rounded-full bg-gradient-to-b from-orange-400/70 to-teal-400/70 opacity-0 group-hover:opacity-100 transition" />
      </div>

      {/* header */}
      <div className="sticky top-0 bg-gradient-to-r from-white/85 via-white/75 to-white/65 backdrop-blur border-b border-slate-100">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-[15px] font-semibold text-slate-900 truncate">{projectName}</h2>
          <div className="w-6" />
        </div>

        {/* search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              type="text"
              placeholder="Search (⌘/Ctrl K)…"
              className="w-full pl-10 pr-12 py-2.5 rounded-2xl bg-white/90 text-black placeholder-slate-400 shadow-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            />
            <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 ring-1 ring-slate-200">
              ⌘K
            </kbd>
          </div>
          {q && (
            <div className="mt-1 text-xs text-slate-500">
              {filteredPipelines.length + filteredDatasets.length} result
              {(filteredPipelines.length + filteredDatasets.length) === 1 ? "" : "s"}
            </div>
          )}
        </div>
      </div>

      {/* content with subtle spotlight */}
      <div
        ref={contentRef}
        onMouseMove={(e) => {
          const rect = contentRef.current?.getBoundingClientRect();
          if (!rect) return;
          setSpot({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }}
        onMouseLeave={() => setSpot({ x: -9999, y: -9999 })}
        className="relative flex-1 px-3 py-4 overflow-y-auto space-y-6"
      >
        <div
          className="pointer-events-none absolute -inset-16 opacity-70"
          style={{
            background: `radial-gradient(240px 160px at ${spot.x}px ${spot.y}px,
              rgba(251,146,60,0.08), rgba(20,184,166,0.06) 35%, transparent 60%)`,
          }}
        />

        {/* quick actions */}
        <div className="flex items-center gap-2 px-2">
          <QuickChip color="orange" icon={<Plus className="w-3.5 h-3.5" />}>New pipeline</QuickChip>
          <QuickChip color="teal"   icon={<Database className="w-3.5 h-3.5" />}>Import dataset</QuickChip>
        </div>

        {/* sections */}
        <Section
          icon={<Workflow className="w-4 h-4 text-slate-600" />}
          title="Pipelines"
          count={pipelines.length}
          open={openPipelines}
          onToggle={() => setOpenPipelines(v => !v)}
        >
          <List>
            {(openPipelines ? filteredPipelines : []).map((item, i) => (
              <Row key={i} label={item} leftAdornment={<Dot className="bg-blue-500" />} />
            ))}
            {openPipelines && filteredPipelines.length === 0 && <EmptyRow label="No matching pipelines" />}
          </List>
        </Section>

        <Section
          icon={<Database className="w-4 h-4 text-slate-600" />}
          title="Datasets"
          count={datasets.length}
          open={openDatasets}
          onToggle={() => setOpenDatasets(v => !v)}
        >
          <List>
            {(openDatasets ? filteredDatasets : []).map((item, i) => (
              <Row key={i} label={item} leftAdornment={<Database className="w-3.5 h-3.5 text-slate-400" />} />
            ))}
            {openDatasets && filteredDatasets.length === 0 && <EmptyRow label="No matching datasets" />}
          </List>
        </Section>

        <GhostButton label="APIs" hint="Coming soon" />
      </div>

      {/* ============== COST CARD: dynamic from /estimate-cost ============== */}
      <div className="p-3 border-t border-slate-100 bg-white/80">
        <div className="rounded-3xl ring-1 ring-slate-200 bg-gradient-to-br from-white via-white to-teal-50/40 p-4 shadow-sm">
          <div className="flex items-center mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
            <h3 className="text-sm font-semibold text-slate-900">Cost Analysis</h3>
          </div>

          <div className="space-y-2 text-sm min-h-[48px]">
            {costLoading && (
              <>
                <SkeletonLine />
                <SkeletonLine />
                <SkeletonLine />
              </>
            )}

            {!costLoading && costItems && costItems.length === 0 && (
              <div className="text-slate-500 text-xs">Select nodes in the canvas to see estimated monthly cost.</div>
            )}

            {!costLoading && costItems && costItems.length > 0 && (
              <>
                {costItems.map((it) => (
                  <CostLine
                    key={it.service}
                    label={`${it.service.toUpperCase()} ${it.count > 1 ? `× ${it.count}` : ""}`.trim()}
                    value={it.ok ? currency(it.total) : "—"}
                  />
                ))}

                <div className="pt-2 mt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">Total</span>
                    <span className="text-orange-600 font-semibold">{currency(totalCost)}</span>
                  </div>
                </div>

                <div className="h-10 mt-1">
                  {/* tiny sparkline (orange stroke, teal fill) */}
                  <svg viewBox="0 0 120 30" className="w-full h-full">
                    <defs>
                      <linearGradient id="costFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="rgba(20,184,166,0.35)" />
                        <stop offset="100%" stopColor="rgba(20,184,166,0.0)" />
                      </linearGradient>
                    </defs>
                    <path d="M0,20 C20,10 30,25 45,14 C60,5 75,18 90,10 C105,4 115,12 120,8" fill="none" stroke="rgb(251,146,60)" strokeWidth="2" />
                    <path d="M0,30 L0,20 C20,10 30,25 45,14 C60,5 75,18 90,10 C105,4 115,12 120,8 L120,30 Z" fill="url(#costFill)" />
                  </svg>
                </div>
                <div className="text-xs text-slate-500">Est. monthly cost • Fetched from API</div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= sub components ================= */

function QuickChip({ icon, children, color = "orange" }: { icon: React.ReactNode; children: React.ReactNode; color?: "orange" | "teal"; }) {
  const theme =
    color === "teal"
      ? "ring-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100"
      : "ring-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100";
  return (
    <button className={`group flex items-center gap-1.5 text-[11.5px] px-2.5 py-1.5 rounded-full ring-1 transition ${theme}`}>
      <span className="opacity-80">{icon}</span>
      <span className="font-medium">{children}</span>
    </button>
  );
}

function Section({ icon, title, count, open, onToggle, children }:{
  icon: React.ReactNode; title: string; count?: number; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white/70 shadow-sm overflow-hidden">
      <button onClick={onToggle} className="w-full px-3 py-2.5 flex items-center hover:bg-slate-50/70 transition" aria-expanded={open}>
        <span className={`mr-2 transition-transform ${open ? "rotate-0" : "-rotate-90"}`}>
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </span>
        <span className="mr-2">{icon}</span>
        <span className="font-medium text-slate-900">{title}</span>
        {typeof count === "number" && (
          <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 ring-1 ring-orange-200">
            {count}
          </span>
        )}
      </button>
      <div className={`px-2 pb-2 overflow-hidden transition-all ${open ? "max-h-[640px]" : "max-h-0"}`}>{children}</div>
    </div>
  );
}

function List({ children }: { children: React.ReactNode }) {
  return <div className="mt-1 space-y-1.5">{children}</div>;
}

function Row({ leftAdornment, label }: { leftAdornment?: React.ReactNode; label: string }) {
  return (
    <div className="group relative flex items-center gap-3 px-2.5 py-2 rounded-2xl cursor-pointer transition">
      <div className="absolute inset-0 rounded-2xl ring-1 ring-transparent group-hover:ring-teal-200 bg-transparent group-hover:bg-teal-50/70 transition" />
      <div className="relative">{leftAdornment}</div>
      <span className="relative z-[1] flex-1 truncate text-[13.5px] text-slate-700 group-hover:text-slate-900">{label}</span>
      <div className="relative z-[1] w-1.5 h-1.5 rounded-full bg-slate-300 opacity-0 group-hover:opacity-100 transition" />
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return (
    <div className="px-2.5 py-2 rounded-2xl bg-slate-50 text-[12px] text-slate-500 ring-1 ring-slate-100">{label}</div>
  );
}

function Dot({ className = "" }: { className?: string }) {
  return <div className={`w-2 h-2 rounded-full ${className}`} />;
}

function GhostButton({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="opacity-85">
      <div className="flex items-center w-full px-2 py-2 rounded-2xl hover:bg-slate-50/70 transition">
        <ChevronRight className="w-4 h-4 mr-2 text-slate-400" />
        <div className="w-4 h-4 mr-2 rounded bg-slate-200" />
        <span className="font-medium text-slate-700">{label}</span>
        {hint && <span className="ml-auto text-xs text-slate-500">{hint}</span>}
      </div>
    </div>
  );
}

function CostLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-slate-700">
      <span className="truncate">{label}</span>
      <span className="font-medium text-emerald-600">{value}</span>
    </div>
  );
}

function SkeletonLine() {
  return <div className="h-3 w-full bg-slate-200/60 rounded-xl animate-pulse" />;
}
