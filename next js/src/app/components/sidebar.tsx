// Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Home,
  LayoutDashboard,
  GitBranch,
  Activity,
  Layers,
  Settings,
  HelpCircle,
} from "lucide-react";

type Accent = "teal" | "orange";

type LinkItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
  accent: Accent;
};

const mainNav: LinkItem[] = [
  { href: "/dash", label: "Dashboard", Icon: LayoutDashboard, accent: "teal" },
  { href: "/data/projects/", label: "Pipelines", Icon: GitBranch, accent: "teal" },
  { href: "/observability", label: "Observability", Icon: Activity, accent: "teal" },
  { href: "/templates/", label: "Templates", Icon: Layers, accent: "teal" },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="fixed left-0 top-0 z-10 flex h-screen w-16 flex-col items-center justify-between border-r border-gray-200 bg-white py-4 shadow-sm">
      {/* Top */}
      <nav className="flex w-full flex-col items-center gap-5">
        {/* External Home */}
        <IconLink href="http://localhost:8080" label="Home" accent="teal" external>
          <Home className="h-5 w-5" />
        </IconLink>

        <Divider />

        {mainNav.map(({ href, label, Icon, accent }) => (
          <IconLink key={href} href={href} label={label} accent={accent} active={isActive(href)}>
            <Icon className="h-5 w-5" />
          </IconLink>
        ))}
      </nav>

      {/* Bottom */}
      <nav className="flex w-full flex-col items-center gap-5 pb-4">
        <a
  href="http://localhost:8080/help"
  target="_blank" // optional: opens in a new tab
  rel="noopener noreferrer"
  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
    isActive("/help") ? "bg-orange-100 text-orange-600" : "text-gray-700"
  } hover:bg-gray-100`}
>
  <HelpCircle className="h-5 w-5" />
  {/* Help */}
</a>

        <Divider />

        <IconLink href="/settings" label="Settings" accent="orange" active={isActive("/settings")}>
          <Settings className="h-5 w-5" />
        </IconLink>
      </nav>
    </aside>
  );
}

function IconLink({
  href,
  label,
  children,
  accent = "teal",
  external = false,
  active = false,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  accent?: Accent;
  external?: boolean;
  active?: boolean;
}) {
  const base =
    "group relative grid place-items-center h-10 w-10 rounded-xl text-gray-500 transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2";
  const tone =
    accent === "teal"
      ? "hover:bg-teal-50 hover:text-teal-700 focus-visible:ring-teal-400"
      : "hover:bg-orange-50 hover:text-orange-700 focus-visible:ring-orange-400";
  const activeStyles =
    accent === "teal"
      ? "bg-teal-100 text-teal-700 shadow-inner"
      : "bg-orange-100 text-orange-700 shadow-inner";

  const className = `${base} ${tone} ${active ? activeStyles : ""}`;

  const content = (
    <>
      <span className="transition-transform duration-200 group-hover:scale-110">{children}</span>
      {/* Tooltip */}
      <span className="pointer-events-none absolute left-12 whitespace-nowrap rounded-md bg-black px-2 py-1 text-xs text-white opacity-0 shadow transition-all duration-150 group-hover:opacity-100">
        {label}
      </span>
      {/* Active indicator */}
      {active && (
        <span
          className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1.5 rounded-r-full ${
            accent === "teal" ? "bg-teal-600" : "bg-orange-600"
          }`}
        />
      )}
    </>
  );

  if (external || /^https?:\/\//.test(href)) {
    return (
      <a href={href} aria-label={label} className={className} title={label}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} aria-label={label} className={className} title={label}>
      {content}
    </Link>
  );
}

function Divider() {
  return <div className="h-px w-8 bg-gray-200" />;
}
