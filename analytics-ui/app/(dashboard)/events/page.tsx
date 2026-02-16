"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { TrendChart } from "@/components/charts/trend-chart";
import { DataTable } from "@/components/ui/data-table";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { useAnalyticsData } from "@/hooks/use-analytics";
import { useQueryState } from "@/lib/query";
import type { EventsResponse } from "@/lib/types";

export default function EventsPage() {
  const { query, setQuery } = useQueryState();
  const { data, loading, error } = useAnalyticsData<EventsResponse>(
    "/api/analytics/events",
    query.toString()
  );

  return (
    <DashboardShell
      title="Events"
      subtitle="Event-level analysis with trend and parameter drill-down"
    >
      {loading && <LoadingState label="Loading event analytics..." />}
      {error && !loading && <ErrorState message={error} />}
      {!loading && !error && data && (
        <>
          <DataTable
            title="Event list"
            subtitle="Click any event for detail"
            rows={data.counts}
            rowKey={(row) => row.eventName}
            exportName="events-summary.csv"
            onRowClick={(row) => setQuery({ type: row.eventName }, { replace: true })}
            columns={[
              { key: "eventName", label: "Event" },
              { key: "count", label: "Count" },
              { key: "uniqueUsers", label: "Unique users" }
            ]}
          />

          <TrendChart
            title={data.type ? `Trend for ${data.type}` : "Trend for all events"}
            subtitle="Daily event volume"
            data={data.trend}
            series={[{ key: "count", label: "Events", color: "#1f6f5f" }]}
          />

          {data.type && data.detail && (
            <section className="grid gap-4 xl:grid-cols-2">
              <DataTable
                title="Parameter breakdown"
                subtitle={`Top values for ${data.type}`}
                rows={data.detail.parameters}
                rowKey={(row, index) => `${row.parameter}-${row.value}-${index}`}
                exportName={`events-${data.type}-parameters.csv`}
                columns={[
                  { key: "parameter", label: "Parameter" },
                  { key: "value", label: "Value" },
                  { key: "count", label: "Count" }
                ]}
              />

              <DataTable
                title="Recent occurrences"
                subtitle="Latest matching events"
                rows={data.detail.recent}
                rowKey={(row) => row.id}
                exportName={`events-${data.type}-recent.csv`}
                columns={[
                  {
                    key: "at",
                    label: "Time",
                    render: (row) => new Date(row.at).toLocaleString(),
                    sortValue: (row) => new Date(row.at).getTime(),
                    exportValue: (row) => row.at
                  },
                  { key: "pagePath", label: "Page" },
                  { key: "slug", label: "Slug" },
                  { key: "location", label: "Location" },
                  { key: "method", label: "Method" }
                ]}
              />
            </section>
          )}
        </>
      )}
    </DashboardShell>
  );
}
