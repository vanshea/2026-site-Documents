import { PropsWithChildren } from "react";
import { GlobalControls } from "@/components/dashboard/global-controls";
import { Sidebar } from "@/components/dashboard/sidebar";

type DashboardShellProps = PropsWithChildren<{
  title: string;
  subtitle: string;
}>;

export function DashboardShell({ title, subtitle, children }: DashboardShellProps) {
  return (
    <div className="md:flex md:min-h-screen">
      <Sidebar />
      <main className="min-w-0 flex-1 p-4 md:p-6">
        <header className="mb-4 rounded-xl border border-border bg-panel p-4 shadow-card md:p-5">
          <h2 className="text-2xl font-semibold text-ink">{title}</h2>
          <p className="mt-1 text-sm text-inkSoft">{subtitle}</p>
        </header>
        <div className="space-y-4">
          <GlobalControls />
          {children}
        </div>
      </main>
    </div>
  );
}
