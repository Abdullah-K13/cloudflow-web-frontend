// src/pages/ConnectCloud.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Cloud, KeyRound, ShieldCheck } from "lucide-react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type SignUpState = {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  organization?: string;
  usageType: string;
};

type Provider = "aws" | "gcp" | "azure";

export default function ConnectCloud() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const base = (state || {}) as Partial<SignUpState>;
  const [provider, setProvider] = useState<Provider>("aws");

  // AWS
  const [awsAccessKeyId, setAwsAccessKeyId] = useState("");
  const [awsSecretAccessKey, setAwsSecretAccessKey] = useState("");

  // GCP
  const [gcpKeyId, setGcpKeyId] = useState("");
  const [gcpSecret, setGcpSecret] = useState("");

  // Azure
  const [azureClientId, setAzureClientId] = useState("");
  const [azureClientSecret, setAzureClientSecret] = useState("");

  // Redirect back if user opened page directly
  useEffect(() => {
    if (!base?.email || !base?.name || !base?.password || !base?.usageType) {
      navigate("/signup");
    }
  }, [base?.email, base?.name, base?.password, base?.usageType, navigate]);

  const canSubmit = useMemo(() => {
    if (!base?.email || !base?.name || !base?.password || !base?.usageType) return false;
    if (provider === "aws") return awsAccessKeyId.trim() !== "" && awsSecretAccessKey.trim() !== "";
    if (provider === "gcp") return gcpKeyId.trim() !== "" && gcpSecret.trim() !== "";
    if (provider === "azure") return azureClientId.trim() !== "" && azureClientSecret.trim() !== "";
    return false;
  }, [
    base?.email,
    base?.name,
    base?.password,
    base?.usageType,
    provider,
    awsAccessKeyId,
    awsSecretAccessKey,
    gcpKeyId,
    gcpSecret,
    azureClientId,
    azureClientSecret,
  ]);

  const setCookie = (name: string, value: string, days = 7) => {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
      value
    )}; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    // The backend contract provided accepts only AWS keys.
    // For GCP/Azure we still collect credentials but we’ll send empty AWS fields (backend can ignore
    // or you can extend API later). You’ll still get the API key back to proceed.
    const payload = {
      name: base.name!,
      email: base.email!,
      password: base.password!,
      usage_type: base.usageType!,
      aws_access_key_id: provider === "aws" ? awsAccessKeyId : "",
      aws_secret_access_key: provider === "aws" ? awsSecretAccessKey : "",
      cloud_type: provider,
      // If your backend supports, you can include extras:
      // gcp_access_key_id: provider === "gcp" ? gcpKeyId : undefined,
      // gcp_secret_access_key: provider === "gcp" ? gcpSecret : undefined,
      // azure_client_id: provider === "azure" ? azureClientId : undefined,
      // azure_client_secret: provider === "azure" ? azureClientSecret : undefined,
      // provider,
    };

    try {
      const res = await fetch("http://localhost:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `Request failed (${res.status})`);
      }

      const data = await res.json();
      console.log("Registration successful:", data);
      // Assuming the API returns { api_key: "..." } or similar
      const apiKey: string = data.api_key || data.token || data.key;

      // Store cookies (adjust names as you prefer)
      setCookie("api_key", apiKey);
      setCookie("name", base.name!);
      setCookie("email", base.email!);
      setCookie("usage_type", base.usageType!);
      setCookie("cloud_type", provider);

      // (Optional) store masked provider creds for UX continuity (avoid secrets if you prefer)
      if (provider === "aws") {
        setCookie("cf_has_aws", "1");
      } else if (provider === "gcp") {
        setCookie("cf_has_gcp", "1");
      } else if (provider === "azure") {
        setCookie("cf_has_azure", "1");
      }

      // Redirect to Next.js dashboard
      window.location.href = "http://localhost:3000";
    } catch (err: any) {
      alert(err?.message || "Something went wrong while creating your account.");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <Card className="shadow-custom border border-teal-500/20 rounded-2xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center ring-1 ring-teal-500/30">
                  <Cloud className="h-6 w-6 text-teal-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Connect your cloud</CardTitle>
              <CardDescription className="text-gray-600">
                Pick a provider and enter credentials to finalize sign-up
              </CardDescription>
            </CardHeader>

            <CardContent>
              {/* Summary bubble */}
              <div className="mb-5 rounded-xl bg-orange-50/70 border border-orange-200 p-3 text-sm text-gray-800">
                <div className="font-medium text-orange-800">You’re signing up as</div>
                <div className="mt-1">
                  <span className="text-teal-700">{base.name}</span> • <span>{base.email}</span> •{" "}
                  <span className="uppercase tracking-wide text-orange-700">{base.usageType}</span>
                </div>
              </div>

              <form onSubmit={handleRegister} className="space-y-5">
                {/* Provider Selector */}
                <div className="space-y-2">
                  <Label className="text-gray-700">Cloud provider</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {(["aws", "gcp", "azure"] as Provider[]).map((p) => {
                      const active = provider === p;
                      return (
                        <button
                          type="button"
                          key={p}
                          onClick={() => setProvider(p)}
                          className={[
                            "rounded-xl px-3 py-2 border text-sm transition-all",
                            active
                              ? "border-orange-400 bg-orange-50 text-orange-800 shadow-sm"
                              : "border-teal-400/50 bg-white hover:border-orange-300",
                          ].join(" ")}
                        >
                          {p.toUpperCase()}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Provider-specific fields */}
                {provider === "aws" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="awsKeyId">AWS Access Key ID</Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-3 h-4 w-4 text-teal-600" />
                        <Input
                          id="awsKeyId"
                          placeholder="AKIA..."
                          className="pl-10 border-teal-500/60 focus:border-orange-500 focus:ring-orange-200/70"
                          value={awsAccessKeyId}
                          onChange={(e) => setAwsAccessKeyId(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="awsSecret">AWS Secret Access Key</Label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-teal-600" />
                        <Input
                          id="awsSecret"
                          type="password"
                          placeholder="••••••••••••••••"
                          className="pl-10 border-teal-500/60 focus:border-orange-500 focus:ring-orange-200/70"
                          value={awsSecretAccessKey}
                          onChange={(e) => setAwsSecretAccessKey(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                {provider === "gcp" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="gcpKeyId">GCP Access Key ID</Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-3 h-4 w-4 text-teal-600" />
                        <Input
                          id="gcpKeyId"
                          placeholder="GCP key id"
                          className="pl-10 border-teal-500/60 focus:border-orange-500 focus:ring-orange-200/70"
                          value={gcpKeyId}
                          onChange={(e) => setGcpKeyId(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gcpSecret">GCP Secret</Label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-teal-600" />
                        <Input
                          id="gcpSecret"
                          type="password"
                          placeholder="••••••••••••••••"
                          className="pl-10 border-teal-500/60 focus:border-orange-500 focus:ring-orange-200/70"
                          value={gcpSecret}
                          onChange={(e) => setGcpSecret(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <p className="text-xs text-gray-500">
                      Note: current API accepts only AWS keys. We’ll finalize your account now and you
                      can link GCP inside the dashboard.
                    </p>
                  </>
                )}

                {provider === "azure" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="azureClientId">Azure Client ID</Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-3 h-4 w-4 text-teal-600" />
                        <Input
                          id="azureClientId"
                          placeholder="Azure Client ID"
                          className="pl-10 border-teal-500/60 focus:border-orange-500 focus:ring-orange-200/70"
                          value={azureClientId}
                          onChange={(e) => setAzureClientId(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="azureClientSecret">Azure Client Secret</Label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-teal-600" />
                        <Input
                          id="azureClientSecret"
                          type="password"
                          placeholder="••••••••••••••••"
                          className="pl-10 border-teal-500/60 focus:border-orange-500 focus:ring-orange-200/70"
                          value={azureClientSecret}
                          onChange={(e) => setAzureClientSecret(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <p className="text-xs text-gray-500">
                      Note: current API accepts only AWS keys. We’ll finalize your account now and you
                      can link Azure inside the dashboard.
                    </p>
                  </>
                )}

                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className={[
                    "w-full rounded-xl",
                    "bg-orange-500 hover:bg-orange-600 text-white",
                    "focus:ring-4 focus:ring-orange-200/70",
                  ].join(" ")}
                >
                  Finish & Get API Key
                </Button>

                <div className="text-center text-xs text-gray-500">
                  <span>Wrong info?</span>{" "}
                  <Link to="/signup" className="text-teal-700 hover:underline">
                    Go back
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
