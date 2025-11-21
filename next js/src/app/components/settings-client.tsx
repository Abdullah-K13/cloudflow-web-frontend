"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Users, Crown,
  Key, Copy, Eye, EyeOff, Trash2, Plus,
  CreditCard,
  Shield, Cloud, TestTube, LockKeyhole,
  Loader2,
} from "lucide-react";
import { apiClient } from "@/lib/services/apiClient";

/** Minimal helpers */
const mask = (s: string) => "•".repeat(Math.max(16, s.length));
const today = () => new Date().toISOString().slice(0, 10);

type Member = { name: string; email: string; role: "Admin" | "Editor" | "Viewer"; avatar: string };

export default function SettingsClientBasic() {
  /** flash notice */
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const flash = (text: string, kind: "ok" | "err" = "ok") => {
    setNotice({ kind, text });
    setTimeout(() => setNotice(null), 2200);
  };

  /** tabs */
  type Tab = "profile" |  "api-keys" | "billing" | "credentials";
  // Check URL hash for initial tab (e.g., /settings#credentials)
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (hash === "credentials" || hash === "profile" || hash === "api-keys" || hash === "billing") {
        return hash as Tab;
      }
    }
    return "profile";
  });

  // Update tab when hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash === "credentials" || hash === "profile" || hash === "api-keys" || hash === "billing") {
        setTab(hash as Tab);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    // Also check on mount in case hash is already set
    handleHashChange();
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  /** profile */
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  /** org */
  const [orgName, setOrgName] = useState("CloudFlow Technologies");
  const [members, setMembers] = useState<Member[]>([
    { name: "John Doe",  email: "john.doe@company.com",  role: "Admin",  avatar: "JD" },
    { name: "Jane Smith", email: "jane.smith@company.com", role: "Editor", avatar: "JS" },
    { name: "Mike Johnson", email: "mike.johnson@company.com", role: "Viewer", avatar: "MJ" },
  ]);

  /** keys */
  const [keys, setKeys] = useState(
    [
      { id: "1", name: "Production API Key", key: "cf_prod_1234567890abcdef", created: "2025-01-15", lastUsed: "2025-08-12" },
      { id: "2", name: "Development API Key", key: "cf_dev_abcdef1234567890", created: "2025-01-10", lastUsed: "2025-08-15" },
    ] as { id: string; name: string; key: string; created: string; lastUsed: string }[]
  );
  const [reveal, setReveal] = useState<Record<string, boolean>>({});

  /** billing */
  const [billingCompany, setBillingCompany] = useState("CloudFlow Technologies");
  const [billingCountry, setBillingCountry] = useState("us");
  const [billingAddress, setBillingAddress] = useState("123 Main Street");
  const [emailReceipts, setEmailReceipts] = useState(true);

  /** credentials */
  const [provider, setProvider] = useState<"aws" | "azure" | "gcp">("aws");
  // aws
  const [awsAccessKey, setAwsAccessKey] = useState("");
  const [awsSecretKey, setAwsSecretKey] = useState("");
  const [awsRegion, setAwsRegion] = useState("us-east-1");
  // azure
  const [azureClientId, setAzureClientId] = useState("");
  const [azureSecret, setAzureSecret] = useState("");
  const [azureTenant, setAzureTenant] = useState("");
  // gcp
  const [gcpProjectId, setGcpProjectId] = useState("");
  const [gcpJson, setGcpJson] = useState("");

  // Fetch current user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoadingUser(true);
        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
        if (!token) {
          setLoadingUser(false);
          return;
        }

        const API_BASE = 
          typeof window === "undefined"
            ? process.env.API_BASE_URL || "http://127.0.0.1:8000"
            : process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

        const res = await fetch(`${API_BASE}/auth/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const userData = await res.json();
          setEmail(userData.email || "");
          setRole(userData.role || "");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserData();
  }, []);

  /** actions */
  const save = (section: string) => flash(`Saved ${section}.`);

  const saveProfile = async () => {
    try {
      setSavingProfile(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      if (!token) {
        flash("Please log in to update your profile", "err");
        setSavingProfile(false);
        return;
      }

      const API_BASE = 
        typeof window === "undefined"
          ? process.env.API_BASE_URL || "http://127.0.0.1:8000"
          : process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

      // Build update payload - only include fields that have changed
      const updatePayload: { email?: string; password?: string; role?: string } = {};
      
      if (email.trim()) {
        updatePayload.email = email.trim();
      }
      
      if (newPassword.trim()) {
        if (newPassword.length < 8) {
          flash("Password must be at least 8 characters", "err");
          setSavingProfile(false);
          return;
        }
        updatePayload.password = newPassword.trim();
      }
      
      if (role.trim()) {
        updatePayload.role = role.trim();
      }

      // Don't send empty payload
      if (Object.keys(updatePayload).length === 0) {
        flash("No changes to save", "err");
        setSavingProfile(false);
        return;
      }

      const res = await fetch(`${API_BASE}/auth/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(updatePayload),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(error.detail || `Failed to update profile: ${res.statusText}`);
      }

      const data = await res.json();
      flash("Profile updated successfully!", "ok");
      
      // Clear password field after successful save
      setNewPassword("");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      flash(error?.message || "Failed to update profile. Please try again.", "err");
    } finally {
      setSavingProfile(false);
    }
  };
  const copy = async (v: string, label = "Copied") => {
    try {
      await navigator.clipboard.writeText(v);
      flash(label);
    } catch {
      flash("Copy failed", "err");
    }
  };
  const generateKey = () => {
    const id = crypto.randomUUID();
    const rand = Math.random().toString(36).slice(2, 10);
    const key = `cf_${rand}_${Date.now()}`;
    setKeys((k) => [{ id, name: "New API Key", key, created: today(), lastUsed: "—" }, ...k]);
    flash("New API key generated");
  };
  const testConnection = () => {
    // stubbed: wire to your API later
    flash(`Verified ${provider.toUpperCase()} credentials.`);
  };

  /** Save cloud credentials */
  const [savingCredentials, setSavingCredentials] = useState(false);
  const saveCloudCredentials = async () => {
    try {
      setSavingCredentials(true);
      
      // Build the request body according to the API format
      // Format: { aws: {...} | null, gcp: {...} | null, azure: {...} | null }
      const body: {
        aws: { access_key_id: string; secret_access_key: string; region: string } | null;
        gcp: any | null;
        azure: { client_id: string; client_secret: string; tenant_id: string } | null;
      } = {
        aws: null,
        gcp: null,
        azure: null,
      };

      // Only include credentials for the current provider if they have values
      if (provider === "aws") {
        if (!awsAccessKey || !awsSecretKey || !awsRegion) {
          flash("Please fill in all AWS credential fields", "err");
          setSavingCredentials(false);
          return;
        }
        body.aws = {
          access_key_id: awsAccessKey.trim(),
          secret_access_key: awsSecretKey.trim(),
          region: awsRegion.trim(),
        };
      } else if (provider === "gcp") {
        if (!gcpProjectId || !gcpJson) {
          flash("Please fill in both Project ID and Service Account JSON", "err");
          setSavingCredentials(false);
          return;
        }
        try {
          // Parse and validate JSON
          const parsed = JSON.parse(gcpJson.trim());
          // Store as dict with project_id and the parsed service account JSON
          body.gcp = {
            project_id: gcpProjectId.trim(),
            service_account_json: parsed,
          };
        } catch (e) {
          flash("Invalid JSON format for GCP service account. Please check your JSON syntax.", "err");
          setSavingCredentials(false);
          return;
        }
      } else if (provider === "azure") {
        if (!azureClientId || !azureSecret || !azureTenant) {
          flash("Please fill in all Azure credential fields", "err");
          setSavingCredentials(false);
          return;
        }
        body.azure = {
          client_id: azureClientId.trim(),
          client_secret: azureSecret.trim(),
          tenant_id: azureTenant.trim(),
        };
      }

      // Make API call
      await apiClient.post("/auth/cloud-credentials", body);
      
      flash("Cloud credentials saved successfully", "ok");
      
    } catch (error: any) {
      console.error("Failed to save cloud credentials:", error);
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Failed to save cloud credentials";
      flash(errorMsg, "err");
    } finally {
      setSavingCredentials(false);
    }
  };

  /** UI bits */
  const TabBtn = ({ v, children }: { v: Tab; children: React.ReactNode }) => (
    <button
      onClick={() => setTab(v)}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all ${
        tab === v
          ? "bg-orange-50 text-orange-700"
          : "text-gray-700 hover:bg-teal-50 hover:text-teal-700"
      }`}
    >
      {children}
    </button>
  );

  function ProviderChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
        active
          ? "border-orange-300 bg-orange-50 text-orange-700"
          : "border-gray-200 bg-white text-gray-700 hover:border-teal-300 hover:text-teal-700"
      }`}
    >
      <Cloud className="h-4 w-4" />
      {label}
    </button>
  );
}

  return (
    <section className="space-y-6">
      {/* header */}
      <div>
        <div className="mb-2 flex items-center gap-3">
          <SettingsIcon className="h-7 w-7 text-orange-600" />
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Settings</h1>
        </div>
        <p className="text-sm text-gray-500">
          Manage your account, organization, keys, billing, and cloud connections.
        </p>
      </div>

      {/* notice */}
      {notice && (
        <div
          className={`rounded-xl border px-4 py-2 text-sm ${
            notice.kind === "ok"
              ? "border-teal-200 bg-teal-50 text-teal-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* tabs */}
      <div className="rounded-xl border border-gray-200 bg-white/70 p-2 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <TabBtn v="profile"><Users className="h-4 w-4" /> Profile</TabBtn>
          {/* <TabBtn v="organization"><Shield className="h-4 w-4" /> Organization</TabBtn> */}
          <TabBtn v="api-keys"><Key className="h-4 w-4" /> API Keys</TabBtn>
          <TabBtn v="billing"><CreditCard className="h-4 w-4" /> Billing</TabBtn>
          <TabBtn v="credentials"><Cloud className="h-4 w-4" /> Cloud Credentials</TabBtn>
        </div>
      </div>

      {/* panel */}
      <div className="space-y-6">
        {/* PROFILE */}
        {tab === "profile" && (
          <Card>
            <CardHead
              title="Profile"
              desc="Update personal info and password"
            />
            <div className="space-y-6 p-6">
              {loadingUser ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
                </div>
              ) : (
                <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email" full>
                  <input
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                  />
                </Field>
                    <Field label="Role" full>
                      <input
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors"
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="Enter role (e.g., Data Engineer, Admin)"
                      />
                    </Field>
              </div>

              <Divider />

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-800">Change Password</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="New password">
                  <input
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors"
                    type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password (leave empty to keep current)"
                  />
                </Field>
                      <div className="flex items-end">
                        <p className="text-xs text-gray-500">
                          Leave empty to keep your current password. Minimum 8 characters.
                        </p>
                      </div>
                    </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                      className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={saveProfile}
                      disabled={savingProfile}
                    >
                      {savingProfile ? (
                        <span className="flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Saving...
                        </span>
                      ) : (
                        "Save changes"
                      )}
                </button>
              </div>
                </>
              )}
            </div>
          </Card>
        )}

        {/* ORGANIZATION
        {tab === "organization" && (
          <Card>
            <CardHead title="Organization" desc="Team, roles, and permissions" />
            <div className="space-y-6 p-6">
              <Field label="Organization name" full>
                <input className="input" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
              </Field>

              <Divider />

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-800">Team members</h3>
                <button
                  className="btn-teal"
                  onClick={() => {
                    const name = prompt("Member name?");
                    const email = name ? prompt("Member email?") : null;
                    if (!name || !email) return;
                    setMembers((arr) => [...arr, { name, email, role: "Viewer", avatar: (name.split(" ").map(s=>s[0]).join("") || "U").slice(0,2).toUpperCase() }]);
                    flash("Invitation created");
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Invite
                </button>
              </div>

              <div className="space-y-3">
                {members.map((m, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                        {m.avatar}
                      </div>
                      <div>
                        <p className="font-medium">{m.name}</p>
                        <p className="text-xs text-gray-500">{m.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${
                        m.role === "Admin" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"
                      }`}>
                        {m.role === "Admin" && <Crown className="mr-1 inline h-3 w-3" />}
                        {m.role}
                      </span>
                      <select
                        className="select"
                        value={m.role}
                        onChange={(e) => {
                          const role = e.target.value as Member["role"];
                          setMembers((arr) => arr.map((x, idx) => (idx === i ? { ...x, role } : x)));
                        }}
                      >
                        <option>Admin</option>
                        <option>Editor</option>
                        <option>Viewer</option>
                      </select>
                      <button
                        className="icon-btn"
                        onClick={() => setMembers((arr) => arr.filter((_, idx) => idx !== i))}
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button className="btn-primary" onClick={() => save("organization")}>Save changes</button>
              </div>
            </div>
          </Card>
        )} */}

        {/* API KEYS */}
        {tab === "api-keys" && (
          <Card>
            <CardHead title="API Keys" desc="Create, rotate, and revoke keys" />
            <div className="space-y-6 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-800">Your keys</h3>
                  <p className="text-xs text-gray-500">Rotate regularly and keep them secret.</p>
                </div>
                <button className="btn-teal" onClick={generateKey}>
                  <Plus className="h-4 w-4" />
                  Generate key
                </button>
              </div>

              <div className="space-y-4">
                {keys.map((k) => (
                  <div key={k.id} className="space-y-2 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{k.name}</p>
                        <p className="text-xs text-gray-500">
                          Created: {k.created} • Last used: {k.lastUsed}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="icon-btn"
                          onClick={() => setReveal((r) => ({ ...r, [k.id]: !r[k.id] }))}
                          title={reveal[k.id] ? "Hide" : "Show"}
                        >
                          {reveal[k.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button className="icon-btn" onClick={() => copy(k.key, "API key copied")} title="Copy">
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          className="icon-btn"
                          onClick={() => {
                            if (confirm("Delete this API key? Apps using it will stop working.")) {
                              setKeys((arr) => arr.filter((x) => x.id !== k.id));
                              flash("API key deleted");
                            }
                          }}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="rounded bg-gray-50 p-2 font-mono text-sm">
                      {reveal[k.id] ? k.key : mask(k.key)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* BILLING */}
        {tab === "billing" && (
          <Card>
            <CardHead title="Billing" desc="Plan & payment details" />
            <div className="space-y-6 p-6">
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-orange-700">Pro Plan</h3>
                    <p className="text-sm text-orange-700/80">Advanced features for growing teams</p>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-orange-800">$29</span>
                      <span className="text-sm text-orange-700/80">/month</span>
                    </div>
                  </div>
                  <span className="rounded-full bg-orange-600 px-3 py-1 text-xs font-medium text-white">Current plan</span>
                </div>
              </div>

              <Divider />

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-800">Payment method</h3>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded bg-teal-600 text-white">
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">•••• •••• •••• 4242</p>
                        <p className="text-xs text-gray-500">Expires 12/25</p>
                      </div>
                    </div>
                    <button className="btn-outline">Update</button>
                  </div>
                </div>
              </div>

              <Divider />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Company">
                  <input className="input" value={billingCompany} onChange={(e) => setBillingCompany(e.target.value)} />
                </Field>
                <Field label="Country">
                  <select className="select" value={billingCountry} onChange={(e) => setBillingCountry(e.target.value)}>
                    <option value="us">United States</option>
                    <option value="ca">Canada</option>
                    <option value="uk">United Kingdom</option>
                  </select>
                </Field>
                <Field label="Address" full>
                  <input className="input" value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} />
                </Field>
              </div>

              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={emailReceipts}
                  onChange={(e) => setEmailReceipts(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">Email me receipts and billing updates</span>
              </label>

              <div className="flex justify-end">
                <button className="btn-primary" onClick={() => save("billing")}>Save changes</button>
              </div>
            </div>
          </Card>
        )}

        {/* CREDENTIALS */}
        {tab === "credentials" && (
          <>
            <Card>
              <CardHead title="Cloud Credentials" desc="Connect your provider accounts securely" />
              <div className="space-y-6 p-6">
                {/* provider chips */}
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white/70 p-2">
                  <ProviderChip active={provider === "aws"} onClick={() => setProvider("aws")} label="AWS" />
                  <ProviderChip active={provider === "azure"} onClick={() => setProvider("azure")} label="Azure" />
                  <ProviderChip active={provider === "gcp"} onClick={() => setProvider("gcp")} label="GCP" />
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      onClick={testConnection}
                    >
                      <TestTube className="h-4 w-4" />
                      Test connection
                    </button>
                    <button
                      className="inline-flex items-center gap-2 rounded-lg border border-orange-300 bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:border-orange-400 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={saveCloudCredentials}
                      disabled={savingCredentials}
                    >
                      {savingCredentials ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save credentials"
                      )}
                    </button>
                  </div>
                </div>

                {/* forms */}
                {provider === "aws" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Access Key ID">
                      <input
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors"
                        value={awsAccessKey}
                        onChange={(e) => setAwsAccessKey(e.target.value)}
                        placeholder="AKIA..."
                      />
                    </Field>
                    <Field label="Secret Access Key">
                      <input
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors"
                        type="password"
                        value={awsSecretKey}
                        onChange={(e) => setAwsSecretKey(e.target.value)}
                        placeholder="Enter secret access key"
                      />
                    </Field>
                    <Field label="Default Region" full>
                      <input
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors"
                        value={awsRegion}
                        onChange={(e) => setAwsRegion(e.target.value)}
                        placeholder="us-east-1"
                      />
                    </Field>
                    <p className="col-span-full rounded-lg border border-orange-200 bg-orange-50 p-3 text-xs text-orange-800">
                      <LockKeyhole className="mr-1 inline h-4 w-4" />
                      Keys are encrypted at rest. Prefer scoped IAM users with least privilege.
                    </p>
                  </div>
                )}

                {provider === "azure" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Client ID">
                      <input
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors"
                        value={azureClientId}
                        onChange={(e) => setAzureClientId(e.target.value)}
                        placeholder="Enter client ID"
                      />
                    </Field>
                    <Field label="Client Secret">
                      <input
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors"
                        type="password"
                        value={azureSecret}
                        onChange={(e) => setAzureSecret(e.target.value)}
                        placeholder="Enter client secret"
                      />
                    </Field>
                    <Field label="Tenant ID" full>
                      <input
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors"
                        value={azureTenant}
                        onChange={(e) => setAzureTenant(e.target.value)}
                        placeholder="Enter tenant ID"
                      />
                    </Field>
                  </div>
                )}

                {provider === "gcp" && (
                  <div className="grid gap-4">
                    <Field label="Project ID">
                      <input
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors"
                        value={gcpProjectId}
                        onChange={(e) => setGcpProjectId(e.target.value)}
                        placeholder="Enter project ID"
                      />
                    </Field>
                    <Field label="Service Account JSON">
                      <textarea
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors min-h-[120px] font-mono text-xs"
                        value={gcpJson}
                        onChange={(e) => setGcpJson(e.target.value)}
                        placeholder='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
                      />
                    </Field>
                  </div>
                )}
              </div>
            </Card>

            {/* Danger zone */}
            <Card>
              <CardHead title="Danger Zone" desc="Irreversible operations" />
              <div className="p-6">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium text-gray-900">Delete workspace</p>
                    <p className="text-xs text-gray-500">This will permanently remove this workspace and its data.</p>
                  </div>
                  <button
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                    onClick={() => {
                      if (confirm("Delete this workspace? This cannot be undone.")) {
                        flash("Workspace deleted");
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </section>
  );
}

/* ——— tiny primitives (no external components) ——— */

function Card({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">{children}</div>;
}
function CardHead({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="border-b border-gray-100 bg-gray-50/60 px-6 py-4">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {desc && <p className="text-sm text-gray-500">{desc}</p>}
    </div>
  );
}
function Divider() {
  return <div className="h-px w-full bg-gray-200" />;
}
function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`${full ? "sm:col-span-2" : ""} space-y-1`}>
      <span className="text-sm text-gray-700">{label}</span>
      <div>{children}</div>
    </label>
  );
}

/* styles for inputs and buttons */
declare global {
  interface HTMLElementTagNameMap {
    // Tailwind only; no real typings needed
  }
}
