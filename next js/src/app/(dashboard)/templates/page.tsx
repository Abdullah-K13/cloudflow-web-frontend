// src/app/templates/page.tsx
"use client";

import { useEffect, useState } from "react";
import axios from "axios";

type TemplateSummary = {
  id: string;
  name: string;
  description?: string;
  // add whatever your backend returns
};

type TemplateDetail = {
  id: string;
  name: string;
  description?: string;
  variables_schema?: Record<string, any>;
  // etc...
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [deployLoading, setDeployLoading] = useState(false);
  const [destroyLoading, setDestroyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Example deploy variables (could be a form later)
  const [deployVars, setDeployVars] = useState<Record<string, any>>({});

  const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // 1) GET /templates  → list
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get<TemplateSummary[]>(`${API_BASE}/templates`, {
        headers: {
          ...getAuthHeaders(),
        },
      });

      setTemplates(res.data);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || "Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  // 2) GET /templates/{id} → detail
  const fetchTemplateDetails = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get<TemplateDetail>(`${API_BASE}/templates/${id}`, {
        headers: {
          ...getAuthHeaders(),
        },
      });

      setSelectedTemplate(res.data);
      // You could also initialize deployVars here based on res.data.variables_schema
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || "Failed to load template details");
    } finally {
      setLoading(false);
    }
  };

  // 3) POST /templates/deploy
  const handleDeploy = async () => {
    if (!selectedTemplate) return;
    try {
      setDeployLoading(true);
      setError(null);

      const res = await axios.post(
        `${API_BASE}/templates/deploy`,
        {
          template_id: selectedTemplate.id,
          variables: deployVars,
        },
        {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        }
      );

      console.log("Deploy result:", res.data);
      alert("Deployment started / succeeded (check logs)");
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || "Failed to deploy template");
    } finally {
      setDeployLoading(false);
    }
  };

  // 4) POST /templates/destroy
  const handleDestroy = async () => {
    if (!selectedTemplate) return;
    try {
      setDestroyLoading(true);
      setError(null);

      const res = await axios.post(
        `${API_BASE}/templates/destroy`,
        {
          template_id: selectedTemplate.id,
          variables: deployVars,
        },
        {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        }
      );

      console.log("Destroy result:", res.data);
      alert("Destroy started / succeeded (check logs)");
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || "Failed to destroy template");
    } finally {
      setDestroyLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  if (loading && !templates.length && !selectedTemplate) {
    return <div className="p-4">Loading templates...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Templates</h1>

      {error && <div className="p-3 border border-red-500 text-red-600 rounded">{error}</div>}

      {/* Templates list */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <button
            key={t.id}
            className="border rounded-lg p-4 text-left hover:bg-gray-50"
            onClick={() => fetchTemplateDetails(t.id)}
          >
            <div className="font-medium">{t.name}</div>
            {t.description && (
              <p className="text-sm text-gray-500 mt-1">{t.description}</p>
            )}
          </button>
        ))}
      </div>

      {/* Selected template + actions */}
      {selectedTemplate && (
        <div className="mt-6 border rounded-lg p-4 space-y-3">
          <h2 className="text-xl font-semibold">Selected: {selectedTemplate.name}</h2>
          {selectedTemplate.description && (
            <p className="text-gray-600">{selectedTemplate.description}</p>
          )}

          {/* Super basic deploy vars as JSON (you’ll replace with proper form later) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Deploy Variables (JSON)</label>
            <textarea
              className="w-full border rounded p-2 text-sm font-mono"
              rows={4}
              value={JSON.stringify(deployVars, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value || "{}");
                  setDeployVars(parsed);
                } catch {
                  // ignore invalid JSON while typing
                }
              }}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDeploy}
              disabled={deployLoading}
              className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-60"
            >
              {deployLoading ? "Deploying..." : "Deploy"}
            </button>
            <button
              onClick={handleDestroy}
              disabled={destroyLoading}
              className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-60"
            >
              {destroyLoading ? "Destroying..." : "Destroy"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
