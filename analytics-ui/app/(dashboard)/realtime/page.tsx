"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DataTable } from "@/components/ui/data-table";
import { Card } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { useAnalyticsData } from "@/hooks/use-analytics";
import { formatNumber } from "@/lib/format";
import { useQueryState, withExtraQuery } from "@/lib/query";
import type { RealtimeResponse } from "@/lib/types";

export default function RealtimePage() {
  const { query, setQuery } = useQueryState();
  const minutes = query.get("minutes") || "30";

  const requestQuery = withExtraQuery(query, { minutes });

  const { data, loading, error } = useAnalyticsData<RealtimeResponse>(
    "/api/analytics/realtime",
    requestQuery,
    { refreshMs: 10000 }
  );

  return (
    <DashboardShell
      title="Realtime"
      subtitle="Last 30-minute activity with active users, top pages, and event stream"
    >
      <div className="flex flex-wrap items-center gap-2">
        {[15, 30, 60].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setQuery({ minutes: value }, { replace: true })}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              minutes === String(value)
                ? "border-accent bg-accent text-white"
                : "border-border bg-white text-ink"
            }`.trim()}
          >
            Last {value} min
          </button>
        ))}
      </div>

      {loading && <LoadingState label="Loading realtime analytics..." />}
      {error && !loading && <ErrorState message={error} />}
      {!loading && !error && data && (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <Card>
              <p className="text-xs uppercase tracking-wide text-inkSoft">Active users</p>
              <p className="mt-2 text-3xl font-semibold text-ink">{formatNumber(data.activeUsers)}</p>
              <p className="mt-1 text-sm text-inkSoft">Rolling {data.minutes} minutes</p>
            </Card>
            <Card className="md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-inkSoft">Top pages now</p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {data.topPages.slice(0, 6).map((row) => (
                  <button
                    type="button"
                    key={row.pagePath}
                    onClick={() => setQuery({ page_path: row.pagePath }, { replace: true })}
                    className="flex items-center justify-between rounded-md border border-border bg-white px-3 py-2 text-left text-sm text-ink hover:border-accent"
                  >
                    <span className="truncate">{row.pagePath}</span>
                    <span className="text-inkSoft">{row.events}</span>
                  </button>
                ))}
              </div>
            </Card>
          </section>

          <DataTable
            title="Live event feed"
            subtitle="Polling every 10 seconds"
            rows={data.liveFeed}
            rowKey={(row) => row.id}
            exportName="realtime-feed.csv"
            columns={[
              {
                key: "at",
                label: "Time",
                render: (row) => new Date(row.at).toLocaleTimeString(),
                sortValue: (row) => new Date(row.at).getTime(),
                exportValue: (row) => row.at
              },
              { key: "eventName", label: "Event" },
              { key: "pagePath", label: "Page" },
              { key: "slug", label: "Slug" },
              { key: "location", label: "Location" }
            ]}
          />
        </>
      )}
    </DashboardShell>
  );
}
