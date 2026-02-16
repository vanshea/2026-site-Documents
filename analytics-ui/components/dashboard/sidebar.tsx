"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/overview", label: "Overview" },
  { href: "/realtime", label: "Realtime" },
  { href: "/acquisition", label: "Acquisition" },
  { href: "/engagement", label: "Engagement" },
  { href: "/events", label: "Events" },
  { href: "/conversions", label: "Conversions" }
];

export function Sidebar() {
  const pathname = usePathname();
  const normalizedPath = pathname.startsWith("/analytics")
    ? pathname.replace(/^\/analytics/, "") || "/"
    : pathname;

  return (
    <aside className="w-full border-b border-border bg-panel p-4 md:h-screen md:w-64 md:border-b-0 md:border-r md:p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-inkSoft">Vanshea Creative</p>
      <h1 className="mt-2 text-xl font-semibold text-ink">Analytics</h1>
      <nav className="mt-6 flex flex-wrap gap-2 md:flex-col">
        {NAV_ITEMS.map((item) => {
          const active = normalizedPath === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-accent text-white"
                  : "text-ink hover:bg-accentSoft hover:text-accent"
              }`.trim()}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-6 flex flex-wrap gap-2 text-xs text-inkSoft md:mt-10">
        <a
          href="/logout"
          className="rounded-md border border-border bg-white px-3 py-1.5 font-medium hover:border-accent hover:text-accent"
        >
          Logout
        </a>
      </div>
    </aside>
  );
}
