"use client";

import { useState } from "react";
import {
  Cloud,
  Folder,
  Play,
  RefreshCw,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";

type TemplateDetail = {
  id: string;
  name: string;
  version: string;
  provider: string; // "aws" | "azure" | "gcp" | etc.
  tags: string[];
  description?: string;
  folder: string;
};

type Props = {
  apiBase: string;
  initialDetail: TemplateDetail;
};

// --- helpers ---

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


const PROVIDER_COLORS: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  aws: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    label: "AWS",
  },
  azure: {
    bg: "bg-sky-100",
    text: "text-sky-700",
    label: "Azure",
  },
  gcp: {
    bg: "bg-teal-100",
    text: "text-teal-700",
    label: "GCP",
  },
};

export default function TemplateDetailClient({ apiBase, initialDetail }: Props) {
  const [variablesDraft, setVariablesDraft] = useState<string>(
    JSON.stringify(
      {
        // starter object you can tweak later
      },
      null,
      2
    )
  );
  const [variablesParsed, setVariablesParsed] = useState<Record<string, any>>(
    {}
  );
  const [deploying, setDeploying] = useState(false);
  const [destroying, setDestroying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const providerKey = initialDetail.provider.toLowerCase();
  const providerStyle =
    PROVIDER_COLORS[providerKey] ??
    ({
      bg: "bg-gray-100",
      text: "text-gray-700",
      label: initialDetail.provider.toUpperCase(),
    } as const);

  function resetVariables() {
    setVariablesDraft("{\n\n}");
    setVariablesParsed({});
    setError(null);
    setMessage(null);
  }

  function syncParsed() {
    try {
      const parsed = variablesDraft.trim()
        ? JSON.parse(variablesDraft)
        : {};
      setVariablesParsed(parsed);
      setError(null);
      return parsed;
    } catch (e: any) {
      setError("Variables JSON is invalid. Please fix it before deploying.");
      throw e;
    }
  }

  async function handleDeploy() {
    try {
      setMessage(null);
      setError(null);
      setDeploying(true);

      const parsed = syncParsed();

      const res = await fetch(`${apiBase}/templates/deploy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          template_id: initialDetail.id,
          variables: parsed,
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Deploy failed (${res.status})`);
      }

      const data = await res.json();
      console.log("Deploy result:", data);
      setMessage("Deployment started / succeeded. Check logs for details.");
    } catch (e: any) {
      console.error(e);
      if (!error) {
        setError(e?.message || "Failed to deploy template.");
      }
    } finally {
      setDeploying(false);
    }
  }

  async function handleDestroy() {
    try {
      setMessage(null);
      setError(null);
      setDestroying(true);

      const parsed = syncParsed();

      const res = await fetch(`${apiBase}/templates/destroy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          template_id: initialDetail.id,
          variables: parsed,
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Destroy failed (${res.status})`);
      }

      const data = await res.json();
      console.log("Destroy result:", data);
      setMessage("Destroy started / succeeded. Check logs for details.");
    } catch (e: any) {
      console.error(e);
      if (!error) {
        setError(e?.message || "Failed to destroy template.");
      }
    } finally {
      setDestroying(false);
    }
  }

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
            <p className="mt-1 text-sm text-gray-600">
              {initialDetail.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {initialDetail.tags.map((tg) => (
              <span
                key={tg}
                className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-700"
              >
                {String(tg).toUpperCase()}
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
            {deploying ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Deploy
          </button>
          <button
            onClick={handleDestroy}
            disabled={destroying}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            {destroying ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            Destroy
          </button>
        </div>
      </div>

      {/* Folder / path info */}
      <div className="rounded-2xl border border-gray-200 bg-white/70 p-4 text-sm text-gray-700 shadow-sm">
        <div className="flex items-center gap-2">
          <Folder className="h-4 w-4 text-gray-500" />
          <span className="font-medium text-gray-800">
            Template folder (backend):
          </span>
        </div>
        <p className="mt-1 break-all text-xs text-gray-500">
          {initialDetail.folder}
        </p>
      </div>

      {/* Variables JSON editor */}
      <div className="rounded-2xl border border-gray-200 bg-white/70 p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">
            Deployment Variables (JSON)
          </h2>
          <button
            type="button"
            onClick={resetVariables}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-teal-300 hover:text-teal-700"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>

        <p className="mb-2 text-xs text-gray-500">
          Provide any variables your Terraform template expects (e.g.{" "}
          <code>project</code>, <code>env</code>, <code>location</code>,{" "}
          <code>resource_prefix</code>, etc.). Leave empty if none are required.
        </p>

        <textarea
          className="font-mono w-full rounded-xl border border-gray-200 bg-white p-3 text-xs outline-none transition focus:border-teal-300 focus:ring-4 focus:ring-teal-100"
          rows={10}
          value={variablesDraft}
          onChange={(e) => {
            setVariablesDraft(e.target.value);
            setError(null);
            setMessage(null);
          }}
        />

        {error && (
          <div className="mt-2 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        {message && !error && (
          <div className="mt-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800">
            {message}
          </div>
        )}
      </div>
    </section>
  );
}
