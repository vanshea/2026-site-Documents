export function LoadingState({ label = "Loading analytics..." }: { label?: string }) {
  return (
    <div className="rounded-xl border border-border bg-panel p-8 text-sm text-inkSoft shadow-card">
      {label}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-warn/40 bg-white p-8 text-sm text-warn shadow-card">
      {message || "Unable to load analytics data."}
    </div>
  );
}
