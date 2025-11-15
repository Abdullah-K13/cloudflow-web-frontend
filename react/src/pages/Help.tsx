import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  LifeBuoy,
  MessageCircle,
  Book,
  FileQuestion,
  Headphones,
  Keyboard as KeyboardIcon,
  Mail,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Bug,
  Shield,
  Rocket,
  Settings,
  CreditCard,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const Help = () => {
  const [query, setQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<string | null>("faq-1");

  const categories = [
    {
      title: "Getting Started",
      icon: Rocket,
      color: "text-orange-600",
      items: [
        { label: "Create your first pipeline", to: "/docs/first-project" },
        { label: "Using templates", to: "/templates" },
        { label: "Workspace & Builder basics", to: "/docs/concepts" },
      ],
    },
    {
      title: "Pipelines & Deployments",
      icon: LifeBuoy,
      color: "text-teal-600",
      items: [
        { label: "Plan & Apply", to: "/docs/tutorials/multi-cloud" },
        { label: "Observability & logs", to: "/docs/tutorials/data-pipeline" },
        { label: "Rollback & destroy", to: "/docs/quickstart" },
      ],
    },
    {
      title: "Accounts & Billing",
      icon: CreditCard,
      color: "text-teal-700",
      items: [
        { label: "Manage subscription", to: "/docs/config/billing" },
        { label: "Team & roles", to: "/docs/config/teams" },
        { label: "Invoices & receipts", to: "/docs/config/billing" },
      ],
    },
    {
      title: "Security & Access",
      icon: Shield,
      color: "text-orange-700",
      items: [
        { label: "API keys & auth", to: "/docs/config/auth" },
        { label: "SSO & access control", to: "/docs/security/access" },
        { label: "Audit logs", to: "/docs/security/audit" },
      ],
    },
    {
      title: "Integrations",
      icon: Settings,
      color: "text-gray-700",
      items: [
        { label: "AWS / Azure / GCP", to: "/docs/integrations/aws" },
        { label: "GitHub Actions", to: "/docs/integrations/github" },
        { label: "Webhooks", to: "/docs/api/webhooks" },
      ],
    },
    {
      title: "API & Terraform",
      icon: Book,
      color: "text-gray-800",
      items: [
        { label: "Export Terraform", to: "/docs/terraform" },
        { label: "REST API", to: "/docs/api/rest" },
        { label: "GraphQL API", to: "/docs/api/graphql" },
      ],
    },
  ];

  const faqs = [
    {
      id: "faq-1",
      q: "Why can’t I deploy from the Builder?",
      a: "Check that your cloud credentials are configured in Settings → Cloud Credentials and your API key is valid. Then run Plan before Apply to surface validation errors.",
    },
    {
      id: "faq-2",
      q: "How do templates work with existing infrastructure?",
      a: "You can start from a template, then customize resources in the Builder. For existing infra, import via Terraform state or attach resources as external data sources.",
    },
    {
      id: "faq-3",
      q: "Where can I see deployment logs and status?",
      a: "Go to Observability → select a deployment. You’ll see plan/apply logs, resource changes, timings, and links back to the pipeline.",
    },
    {
      id: "faq-4",
      q: "How do I invite teammates?",
      a: "Open Settings → Team Management. Assign roles (Admin/Editor/Viewer) per workspace to control access.",
    },
  ];

  const resources = [
    { title: "Documentation", to: "/docs/quickstart", icon: Book },
    { title: "Template Library", to: "/templates", icon: FileQuestion },
    { title: "Open a Ticket", to: "/support", icon: MessageCircle },
    { title: "Email Support", to: "mailto:support@cloudflow.example", icon: Mail, external: true },
  ];

  const shortcuts = [
    { key: "⌘ /", desc: "Toggle command palette" },
    { key: "⌘ S", desc: "Save pipeline draft" },
    { key: "⌘ P", desc: "Run Plan" },
    { key: "⌘ ⏎", desc: "Apply deployment" },
    { key: "⌘ Z", desc: "Undo (builder canvas)" },
    { key: "⌘ ⇧ Z", desc: "Redo (builder canvas)" },
  ];

  const filteredCategories =
    query.trim().length === 0
      ? categories
      : categories
          .map((c) => ({
            ...c,
            items: c.items.filter((i) =>
              i.label.toLowerCase().includes(query.trim().toLowerCase())
            ),
          }))
          .filter((c) => c.items.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero / Search */}
      <div className="bg-card border-b border-border py-8">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-3 text-4xl font-bold text-foreground">Help Center</h1>
            <p className="mb-6 text-lg text-muted-foreground">
              Get answers fast, explore guides, or contact support.
            </p>
            <div className="relative mx-auto max-w-xl">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search help articles…"
                className="pl-10"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {/* Quick Actions */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">Status: All systems normal</Badge>
              <Badge variant="outline" className="border-teal-200 text-teal-700">Avg. response: ~2h</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto flex gap-8 px-4 py-8">
        {/* Left: Categories & Results */}
        <div className="flex-1 space-y-6">
          {/* Category Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {filteredCategories.map((cat, idx) => (
              <Card
                key={idx}
                className="border-border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <cat.icon className={`h-5 w-5 ${cat.color}`} />
                      <CardTitle className="text-base">{cat.title}</CardTitle>
                    </div>
                    <Badge variant="secondary">{cat.items.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-1">
                    {cat.items.map((i, k) => (
                      <li key={k}>
                        <Link
                          to={i.to}
                          className="group flex items-center justify-between rounded-md p-2 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                        >
                          <span>{i.label}</span>
                          <ExternalLink className="h-3.5 w-3.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
            {filteredCategories.length === 0 && (
              <Card className="border-dashed border-border">
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  No results. Try a different search.
                </CardContent>
              </Card>
            )}
          </div>

          {/* Troubleshooting / Tips */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bug className="h-5 w-5 text-orange-600" />
                Troubleshooting Tips
              </CardTitle>
              <CardDescription>Quick fixes for common hiccups</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="mb-1 font-medium text-foreground">Can’t deploy?</p>
                <p className="text-sm text-muted-foreground">
                  Verify credentials in Settings → Cloud, run <span className="font-mono">Plan</span> first,
                  and check Observability for logs.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="mb-1 font-medium text-foreground">Template errors?</p>
                <p className="text-sm text-muted-foreground">
                  Start from a minimal template and add services incrementally. Use cost estimator before apply.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: FAQ, Shortcuts, Contact */}
        <aside className="w-full max-w-md space-y-6">
          {/* FAQ */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileQuestion className="h-5 w-5 text-teal-600" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription>Short answers to popular questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {faqs.map((f) => {
                const open = openFaq === f.id;
                return (
                  <div key={f.id} className="rounded-lg border border-border">
                    <button
                      onClick={() => setOpenFaq(open ? null : f.id)}
                      className="flex w-full items-center justify-between rounded-lg bg-card p-3 text-left transition-colors hover:bg-muted/60"
                    >
                      <span className="text-sm font-medium text-foreground">{f.q}</span>
                      {open ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    {open && (
                      <div className="p-3 pt-0">
                        <Separator className="my-2" />
                        <p className="text-sm text-muted-foreground">{f.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Keyboard Shortcuts */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <KeyboardIcon className="h-5 w-5 text-orange-600" />
                Keyboard Shortcuts
              </CardTitle>
              <CardDescription>Move faster in the Builder</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2">
                {shortcuts.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm"
                  >
                    <span className="text-gray-700">{s.desc}</span>
                    <span className="rounded-md border border-gray-200 bg-white px-2 py-0.5 font-mono text-xs text-gray-700">
                      {s.key}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contact Support */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Headphones className="h-5 w-5 text-teal-600" />
                Contact Support
              </CardTitle>
              <CardDescription>We usually reply within a few hours</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                to="/support"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-orange-700 hover:shadow-md"
              >
                <MessageCircle className="h-4 w-4" />
                Open a Ticket
              </Link>
              <a
                href="mailto:support@cloudflow.example"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:text-teal-700"
              >
                <Mail className="h-4 w-4" />
                Email Support
              </a>

              <Separator />

              {/* Helpful links */}
              <div className="grid gap-2">
                {resources.map((r, i) => {
                  const Icon = r.icon;
                  const linkProps = r.external
                    ? { href: r.to as string, target: "_blank", rel: "noreferrer" }
                    : { href: r.to as string };
                  const Component: any = r.external ? "a" : Link;
                  return (
                    <Component
                      key={i}
                      {...linkProps}
                      className="group flex items-center justify-between rounded-md p-2 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Icon className="h-4 w-4 text-gray-500" />
                        {r.title}
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
                    </Component>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </aside>
      </main>

      <Footer />
    </div>
  );
};

export default Help;
