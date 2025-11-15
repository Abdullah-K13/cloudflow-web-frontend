"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, DollarSign, Play, RefreshCw, Server, Cloud, Shield, FileUp, RotateCcw, AlertTriangle } from "lucide-react";

type ProviderCode = "aws" | "gcp" | "azure";

type TemplateVersion = {
  id: string;
  provider: ProviderCode;
  version: string;
  status: "published" | "draft" | "archived";
  artifact: "terraform" | "pulumi" | "cdktf";
  default_variables: Record<string, any>;
  plan_schema: any; // JSON Schema (subset)
  features?: { title: string; description?: string }[];
  outputs?: { key: string; label: string; description?: string }[];
  preview_image_url?: string | null;
  last_updated?: string | null;
};

type TemplateDetail = {
  id: string; // uuid string
  slug: string;
  name: string;
  summary?: string | null;
  long_description?: string | null;
  tags: string[];
  category?: string | null;
  subcategory?: string | null;
  versions: TemplateVersion[];
};

type EstimateLine = {
  service: string;
  metric: string;
  quantity: number;
  unit_price: string;
  line_total: string;
  notes?: string | null;
};

type EstimateResponse = {
  currency: string;
  monthly_total: string;
  lines: EstimateLine[];
};

const PROVIDER_LABEL: Record<ProviderCode, string> = {
  aws: "AWS",
  gcp: "GCP",
  azure: "Azure",
};

const DEFAULT_REGION: Record<ProviderCode, string> = {
  aws: "us-east-1",
  gcp: "us-central1",
  azure: "eastus",
};

function classNames(...xs: (string | false | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

function toStringValue(v: any) {
  if (v === null || v === undefined) return "";
  return typeof v === "string" ? v : String(v);
}

function coerceByType(raw: string, type?: string) {
  if (type === "boolean") return raw === "true";
  if (type === "number" || type === "integer") {
    if (raw === "" || raw === undefined || raw === null) return undefined;
    const n = Number(raw);
    return Number.isNaN(n) ? undefined : (type === "integer" ? Math.trunc(n) : n);
  }
  return raw; // string or unknown => keep as string
}

/** Infer a very small JSON-schema from default_variables so we can render inputs even when plan_schema is empty. */
function inferSchemaFromDefaults(defaults: Record<string, any> | undefined) {
  const properties: Record<string, any> = {};
  if (!defaults) return { type: "object", properties };
  for (const [k, v] of Object.entries(defaults)) {
    const t =
      typeof v === "number"
        ? "number"
        : typeof v === "boolean"
        ? "boolean"
        : "string";
    properties[k] = { type: t, default: v };
  }
  return { type: "object", properties };
}

function VariablesForm({
  schema,
  draftValues,
  onDraftChange,
  onCommit, // commit to typed vars on blur
}: {
  schema: any;
  draftValues: Record<string, string>;
  onDraftChange: (k: string, v: string) => void;
  onCommit: (k: string, type?: string) => void;
}) {
  const props = schema?.properties ?? {};
  const keys = Object.keys(props);

  if (!keys.length) {
    return <p className="text-sm text-gray-500">No configurable variables for this template.</p>;
  }

 return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {keys.map((key) => {
        const def = props[key] || {};
        const label = key.replace(/_/g, " ");
        const type = def.type as string | undefined;
        const desc = def.description as string | undefined;
        const ex = Array.isArray(def.examples) && def.examples.length ? def.examples[0] : undefined;
        const placeholder =
          (def.default !== undefined ? String(def.default) : undefined) ?? (ex ? String(ex) : "");

        if (type === "boolean") {
          const checked = (draftValues[key] ?? "").toLowerCase() === "true";
          return (
            <label
              key={key}
              className="group flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2"
              title={desc || label}
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-teal-600"
                checked={checked}
                onChange={(e) => {
                  onDraftChange(key, String(e.target.checked));
                  onCommit(key, "boolean");
                }}
              />
              <div className="text-sm">
                <div className="font-medium text-gray-800 flex items-center gap-1">
                  {label}
                  {desc && (
                    <span
                      className="inline-block text-xs text-gray-400"
                      title={desc}
                      aria-label={`Info about ${label}`}
                    >
                      ⓘ
                    </span>
                  )}
                </div>
                {desc && <div className="text-xs text-gray-500">{desc}</div>}
              </div>
            </label>
          );
        }

        return (
          <div key={key} className="space-y-1">
            <label
              className="text-xs font-medium text-gray-600 flex items-center gap-1"
              title={desc || label}
            >
              {label}
              {desc && (
                <span
                  className="inline-block text-[10px] text-gray-400"
                  title={desc}
                  aria-label={`Info about ${label}`}
                >
                  ⓘ
                </span>
              )}
            </label>
            <input
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-teal-300 focus:ring-4 focus:ring-teal-100"
              type={type === "number" || type === "integer" ? "text" : "text"}
              value={draftValues[key] ?? ""}
              placeholder={placeholder}
              onChange={(e) => onDraftChange(key, e.target.value)}
              onBlur={() => onCommit(key, type)}
            />
            {/* helper line: enums / examples */}
            {(Array.isArray(def.enum) && def.enum.length) || ex ? (
              <div className="text-[11px] text-gray-500">
                {Array.isArray(def.enum) && def.enum.length ? (
                  <>Allowed: {def.enum.map((v: any) => String(v)).join(", ")}</>
                ) : ex ? (
                  <>Example: {String(ex)}</>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default function TemplateDetailClient({
  apiBase,
  initialDetail,
}: {
  apiBase: string;
  initialDetail: TemplateDetail;
}) {
  const [activeProvider, setActiveProvider] = useState<ProviderCode | null>(null);
  const [version, setVersion] = useState<TemplateVersion | null>(null);
  const [regionCode, setRegionCode] = useState<string>("");
  const [vars, setVars] = useState<Record<string, any>>({});
  const [estimating, setEstimating] = useState(false);
  const [estimate, setEstimate] = useState<EstimateResponse | null>(null);
  const [deploying, setDeploying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [draftVars, setDraftVars] = useState<Record<string, string>>({});

function onDraftChange(k: string, v: string) {
  setDraftVars((cur) => ({ ...cur, [k]: v }));
}

function commitOne(k: string, type?: string) {
  setVars((cur) => ({ ...cur, [k]: coerceByType(draftVars[k], type) }));
}


  // Published versions grouped by provider
  const versionsByProvider = useMemo(() => {
    const map = new Map<ProviderCode, TemplateVersion[]>();
    (initialDetail.versions || []).forEach((v) => {
      if (v.status === "published") {
        const arr = map.get(v.provider as ProviderCode) ?? [];
        arr.push(v);
        map.set(v.provider as ProviderCode, arr);
      }
    });
    return map;
  }, [initialDetail.versions]);

  // Pick initial provider
  useEffect(() => {
    const providers = Array.from(versionsByProvider.keys());
    const first = (["aws", "gcp", "azure"] as ProviderCode[]).find((p) => providers.includes(p));
    setActiveProvider(first ?? providers[0] ?? null);
  }, [versionsByProvider]);

  // When provider changes, select version + seed defaults
 useEffect(() => {
  if (!activeProvider) return;
  const vs = versionsByProvider.get(activeProvider) ?? [];
  const v = vs[0] ?? null;
  setVersion(v);

  const defaultRegion =
    (v?.default_variables?.region as string) ||
    (v?.default_variables?.location as string) ||
    DEFAULT_REGION[activeProvider];
  setRegionCode(defaultRegion);

  const defaults = { ...(v?.default_variables ?? {}) };
  if (activeProvider === "gcp") defaults.location = defaultRegion;
  else defaults.region = defaultRegion;

  setVars(defaults);

  const dv: Record<string, string> = {};
  Object.entries(defaults).forEach(([k, val]) => (dv[k] = toStringValue(val)));
  setDraftVars(dv);

  setEstimate(null);
  setErrors([]);
}, [activeProvider, versionsByProvider]);

useEffect(() => {
  if (!version) return;
  setDraftVars((cur) => {
    const next = { ...cur };
    if (activeProvider === "gcp") next.location = toStringValue(regionCode);
    else next.region = toStringValue(regionCode);
    return next;
  });
  setVars((cur) => {
    const next = { ...cur };
    if (activeProvider === "gcp") next.location = regionCode;
    else next.region = regionCode;
    return next;
  });
}, [regionCode, version, activeProvider]);

  // Keep region input and variables in sync (region for AWS/Azure, location for GCP)
  useEffect(() => {
    if (!version) return;
    setVars((cur) => {
      const updated = { ...cur };
      if (activeProvider === "gcp") {
        updated.location = regionCode;
      } else {
        updated.region = regionCode;
      }
      return updated;
    });
  }, [regionCode, version, activeProvider]);

  const servicesList = useMemo(() => {
    if (!estimate) return [];
    const uniq = new Set<string>();
    estimate.lines.forEach((l) => uniq.add(l.service));
    return Array.from(uniq);
  }, [estimate]);

  function updateVar(k: string, v: any) {
    setVars((cur) => ({ ...cur, [k]: v }));
  }

  function resetVars() {
  if (!version) return;
  const defaults = { ...(version.default_variables ?? {}) };
  const defaultRegion =
    (version.default_variables?.region as string) ||
    (version.default_variables?.location as string) ||
    (activeProvider ? DEFAULT_REGION[activeProvider] : "us-east-1");

  if (activeProvider === "gcp") defaults.location = defaultRegion;
  else defaults.region = defaultRegion;

  setVars(defaults);
  const dv: Record<string, string> = {};
  Object.entries(defaults).forEach(([k, val]) => (dv[k] = toStringValue(val)));
  setDraftVars(dv);

  setRegionCode(defaultRegion);
  setErrors([]);
  setEstimate(null);
}


  // Build effective schema (explicit plan_schema OR inferred from defaults)
  const effectiveSchema = useMemo(() => {
    const hasProps = !!version?.plan_schema?.properties && Object.keys(version?.plan_schema?.properties || {}).length > 0;
    return hasProps ? version!.plan_schema : inferSchemaFromDefaults(version?.default_variables);
  }, [version]);

  // Minimal client-side validation using schema.required
  function validate(): string[] {
    const req: string[] = Array.isArray(effectiveSchema?.required) ? effectiveSchema.required : [];
    const missing = req.filter((k) => {
      const v = (vars as any)[k];
      return v === null || v === undefined || v === "";
    });
    return missing.map((k) => `Missing required variable: ${k}`);
  }

  async function runEstimate() {
    if (!version) return;
    setEstimating(true);
    setMessage(null);
    setErrors([]);
    const errs = validate();
    if (errs.length) {
      setErrors(errs);
      setEstimating(false);
      return;
    }
    try {
      const res = await fetch(`${apiBase}/api/estimate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_version_id: version.id,
          region_code: regionCode,
          variables: vars,
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Estimate failed (${res.status})`);
      }
      const data = (await res.json()) as EstimateResponse;
      setEstimate(data);
    } catch (e: any) {
      setMessage(e?.message || "Failed to estimate.");
    } finally {
      setEstimating(false);
    }
  }

  async function deploy() {
    if (!version) return;
    setDeploying(true);
    setMessage(null);
    setErrors([]);
    const errs = validate();
    if (errs.length) {
      setErrors(errs);
      setDeploying(false);
      return;
    }

    try {
      // If you wire uploads: send files to /api/uploads, get back URLs,
      // then add: vars.code_artifact = uploadedUrl (example).
      const res = await fetch(`${apiBase}/api/deployments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: 1, // TODO: replace with real authenticated client id
          template_version_id: version.id,
          region_code: regionCode,
          variables: vars, // <-- user-edited variables sent here
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Deploy failed (${res.status})`);
      }
      const data = await res.json();
      setMessage(
        data.status === "succeeded"
          ? "Deployed successfully! 🎉"
          : `Deployment ${data.status}.`
      );
    } catch (e: any) {
      setMessage(e?.message || "Failed to deploy.");
    } finally {
      setDeploying(false);
    }
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{initialDetail.name}</h1>
          {initialDetail.summary && <p className="mt-1 text-sm text-gray-600">{initialDetail.summary}</p>}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {initialDetail.tags.map((tg) => (
              <span
                key={tg}
                className={classNames(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                  tg === "aws"
                    ? "bg-orange-100 text-orange-700"
                    : tg === "serverless"
                    ? "bg-teal-100 text-teal-700"
                    : tg === "data"
                    ? "bg-gray-100 text-gray-700"
                    : "bg-gray-100 text-gray-700"
                )}
              >
                {String(tg).toUpperCase()}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={runEstimate}
            disabled={!version || estimating}
            className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-white px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50 disabled:opacity-60"
            title="Estimate monthly cost"
          >
            {estimating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
            Estimate
          </button>
          <button
            onClick={deploy}
            disabled={!version || deploying}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-60"
            title="Deploy"
          >
            {deploying ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Deploy
          </button>
        </div>
      </div>

      {/* Provider selector */}
      <div className="rounded-2xl border border-gray-200 bg-white/70 p-4 shadow-sm">
        <div className="text-sm font-semibold text-slate-700 mb-2">Cloud Provider</div>
        <div className="grid grid-cols-3 rounded-xl overflow-hidden border border-gray-200">
          {(["aws", "gcp", "azure"] as ProviderCode[]).map((p) => {
            const enabled = (initialDetail.versions || []).some((v) => v.provider === p && v.status === "published");
            const active = activeProvider === p;
            return (
              <button
                key={p}
                disabled={!enabled}
                onClick={() => setActiveProvider(p)}
                className={classNames(
                  "px-3 py-2 text-sm font-medium transition-colors",
                  enabled
                    ? active
                      ? p === "aws"
                        ? "bg-orange-500/90 text-white"
                        : p === "gcp"
                        ? "bg-teal-600/90 text-white"
                        : "bg-sky-600/90 text-white"
                      : "bg-white text-slate-700 hover:bg-slate-50"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                )}
              >
                {PROVIDER_LABEL[p]}
              </button>
            );
          })}
        </div>

        {/* Region + meta */}
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Region</label>
            <input
              value={regionCode}
              onChange={(e) => setRegionCode(e.target.value)}
              placeholder={activeProvider ? DEFAULT_REGION[activeProvider] : "region"}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Artifact</label>
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm">
              <Cloud className="h-4 w-4 text-teal-600" />
              <span>{version?.artifact.toUpperCase() || "—"}</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Version</label>
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm">
              <Shield className="h-4 w-4 text-orange-600" />
              <span>{version?.version || "—"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Variables */}
      <div className="rounded-2xl border border-gray-200 bg-white/70 p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Template Variables</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetVars}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:border-teal-300 hover:text-teal-700"
              title="Reset to defaults"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
            {/* Optional file upload (wire to your /api/uploads and set vars.code_artifact from the response) */}
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:border-teal-300 hover:text-teal-700">
              <FileUp className="h-4 w-4" />
              Upload files
              <input
                type="file"
                className="hidden"
                multiple
                onChange={async (e) => {
                  // Example wire-up (pseudo)
                  // const form = new FormData();
                  // for (const f of Array.from(e.target.files ?? [])) form.append("files", f);
                  // const r = await fetch(`${apiBase}/api/uploads`, { method: "POST", body: form });
                  // const { url } = await r.json();
                  // setVars((cur) => ({ ...cur, code_artifact: url }));
                }}
              />
            </label>
          </div>
        </div>

        {/* Validation messages */}
        {!!errors.length && (
          <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <div>
              {errors.map((e, i) => (
                <div key={i}>{e}</div>
              ))}
            </div>
          </div>
        )}

       <VariablesForm
  schema={effectiveSchema}
  draftValues={draftVars}
  onDraftChange={onDraftChange}
  onCommit={commitOne}
/>


      </div>

      {/* Estimate + Services breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white/70 p-4 shadow-sm lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <Server className="h-4 w-4 text-teal-600" />
            <h3 className="text-sm font-semibold text-slate-700">Cost Breakdown</h3>
          </div>

          {!estimate && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
              Click <span className="font-medium text-teal-700">Estimate</span> to preview monthly costs.
            </div>
          )}

          {estimate && (
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="px-4 py-2">Service</th>
                    <th className="px-4 py-2">Metric</th>
                    <th className="px-4 py-2 text-right">Qty</th>
                    <th className="px-4 py-2 text-right">Unit</th>
                    <th className="px-4 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {estimate.lines.map((l, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-4 py-2">{l.service}</td>
                      <td className="px-4 py-2 text-gray-600">{l.metric}</td>
                      <td className="px-4 py-2 text-right">{Number(l.quantity).toLocaleString()}</td>
                      <td className="px-4 py-2 text-right">
                        {Number(l.unit_price).toLocaleString(undefined, { style: "currency", currency: estimate.currency })}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {Number(l.line_total).toLocaleString(undefined, { style: "currency", currency: estimate.currency })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-4 py-2 font-medium" colSpan={4}>Estimated monthly total</td>
                    <td className="px-4 py-2 text-right font-semibold text-teal-700">
                      {Number(estimate.monthly_total).toLocaleString(undefined, { style: "currency", currency: estimate.currency })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white/70 p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Services</h3>
          {!estimate && <p className="text-sm text-gray-500">Run an estimate to see the services used by this template.</p>}
          {!!estimate && (
            <ul className="space-y-2">
              {servicesList.map((svc) => (
                <li key={svc} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2">
                  <span className="text-sm text-gray-800">{svc}</span>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </li>
              ))}
            </ul>
          )}

          {version?.features?.length ? (
            <>
              <h3 className="mt-4 mb-1 text-sm font-semibold text-slate-700">Features</h3>
              <ul className="space-y-2">
                {version.features.map((f, i) => (
                  <li key={i} className="rounded-xl border border-gray-200 bg-white px-3 py-2">
                    <div className="text-sm font-medium text-gray-800">{f.title}</div>
                    {f.description && <div className="text-xs text-gray-600">{f.description}</div>}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      </div>

      {initialDetail.long_description && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-1 text-sm font-semibold text-slate-700">About this template</h3>
          <p className="text-sm text-gray-700">{initialDetail.long_description}</p>
        </div>
      )}

      {!!message && (
        <div className="rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-800">{message}</div>
      )}
    </section>
  );
}
