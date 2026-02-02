"use client";

import { useEffect, useState } from "react";
import {
  Cloud,
  Folder,
  Play,
  RefreshCw,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";

// ---------------------------
// Types
// ---------------------------
type VariableSchema = {
  type: string;            // "string" | "number" | "boolean"
  required: boolean;
  description?: string;
};

type TemplateDetail = {
  id: string;
  name: string;
  version: string;
  provider: string;
  tags: string[];
  description?: string;
  folder: string;
  variables: Record<string, VariableSchema>;
};

type Props = {
  apiBase: string;
  initialDetail: TemplateDetail;
};

// ---------------------------
// Helpers
// ---------------------------
function classNames(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}



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

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const cookieToken = getCookie("access_token");
  const localToken = localStorage.getItem("access_token");
  const token = cookieToken || localToken;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

const PROVIDER_COLORS: Record<string, any> = {
  aws: { bg: "bg-orange-100", text: "text-orange-700", label: "AWS" },
  azure: { bg: "bg-sky-100", text: "text-sky-700", label: "Azure" },
  gcp: { bg: "bg-teal-100", text: "text-teal-700", label: "GCP" },
};

// ---------------------------
// MAIN COMPONENT
// ---------------------------
export default function TemplateDetailClient({ apiBase, initialDetail }: Props) {
  const providerKey = initialDetail.provider.toLowerCase();
  const providerStyle =
    PROVIDER_COLORS[providerKey] ??
    ({ bg: "bg-gray-100", text: "text-gray-700", label: initialDetail.provider } as const);

  // Build variable form state from backend schema
  const initialVars = Object.fromEntries(
    Object.keys(initialDetail.variables).map((key) => [key, ""])
  );

  const [vars, setVars] = useState<Record<string, any>>(initialVars);
  const [deploying, setDeploying] = useState(false);
  const [destroying, setDestroying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // ---------------------------
  // Validation
  // ---------------------------
  function validate() {
    const missing: string[] = [];

    for (const [key, schema] of Object.entries(initialDetail.variables)) {
      if (schema.required && (!vars[key] || vars[key].trim() === "")) {
        missing.push(key);
      }
    }

    if (missing.length > 0) {
      setError(`Missing required fields: ${missing.join(", ")}`);
      return false;
    }

    setError(null);
    return true;
  }

  // ---------------------------
  // Handlers
  // ---------------------------
async function handleDeploy() {
  if (!validate()) return;

  try {
    setMessage(null);
    setError(null);
    setDeploying(true);

    const payload = {
      template_id: initialDetail.id,
      variables: vars,
    };

    console.log("Deploy payload:", payload);

    const res = await fetch(`${apiBase}/templates/deploy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      // 👇 this is the important part
      let msg = `Deploy failed (${res.status})`;
      try {
        const data = await res.json();
        console.error("Deploy error body:", data);
        msg = (data as any)?.detail || msg;
      } catch {
        const text = await res.text();
        console.error("Deploy error text:", text);
        msg = text || msg;
      }
      throw new Error(msg);
    }

    const data = await res.json();
    console.log("Deploy result:", data);
    setMessage("Deployment started successfully!");
  } catch (e: any) {
    setError(e.message || "Failed to deploy");
  } finally {
    setDeploying(false);
  }
}



  async function handleDestroy() {
    if (!validate()) return;

    try {
      setMessage(null);
      setError(null);
      setDestroying(true);

      const res = await fetch(`${apiBase}/templates/destroy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          template_id: initialDetail.id,
          variables: vars,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Destroy failed (${res.status})`);
      }

      const data = await res.json();
      setMessage("Destroy operation started");
    } catch (e: any) {
      setError(e.message || "Failed to destroy");
    } finally {
      setDestroying(false);
    }
  }

  function resetVariables() {
    setVars(initialVars);
    setError(null);
    setMessage(null);
  }

  // ---------------------------
  // UI
  // ---------------------------
  return (
    <section className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 inline-flex items-center gap-2">
            <span
              className={classNames(
                "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
                providerStyle.bg,
                providerStyle.text
              )}
            >
              <Cloud className="h-3.5 w-3.5" />
              {providerStyle.label}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
              v{initialDetail.version}
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            {initialDetail.name}
          </h1>

          {initialDetail.description && (
            <p className="mt-1 text-sm text-gray-600">{initialDetail.description}</p>
          )}

          <div className="mt-2 flex flex-wrap gap-1.5">
            {initialDetail.tags.map((tg) => (
              <span
                key={tg}
                className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-700"
              >
                {tg.toUpperCase()}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <button
            onClick={handleDeploy}
            disabled={deploying}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-60"
          >
            {deploying ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Deploy
          </button>

          <button
            onClick={handleDestroy}
            disabled={destroying}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            {destroying ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            Destroy
          </button>
        </div>
      </div>

      {/* Folder */}
      <div className="rounded-2xl border border-gray-200 bg-white/70 p-4 text-sm shadow-sm">
        <div className="flex items-center gap-2">
          <Folder className="h-4 w-4 text-gray-500" />
          <span className="font-medium">Template folder:</span>
        </div>
        <p className="mt-1 text-xs text-gray-500 break-all">{initialDetail.folder}</p>
      </div>

      {/* Dynamic Variables */}
      <div className="rounded-2xl border border-gray-200 bg-white/70 p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Template Variables</h2>

          <button
            onClick={resetVariables}
            className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-teal-300 hover:text-teal-700"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>

        {/* Variables Form */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Object.entries(initialDetail.variables).map(([key, schema]) => (
            <div key={key}>
              <label className="text-xs font-medium text-gray-700">
                {key}
                {schema.required && <span className="text-red-500">*</span>}
              </label>

              <input
                type={schema.type === "number" ? "number" : "text"}
                placeholder={schema.description}
                value={vars[key] || ""}
                onChange={(e) => setVars({ ...vars, [key]: e.target.value })}
  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-300 text-black"
              />

              {schema.description && (
                <p className="mt-1 text-xs text-gray-500">{schema.description}</p>
              )}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Message */}
        {message && !error && (
          <div className="mt-3 rounded-xl border px-3 py-2 text-xs text-gray-800 bg-white">
            {message}
          </div>
        )}
      </div>
    </section>
  );
}
