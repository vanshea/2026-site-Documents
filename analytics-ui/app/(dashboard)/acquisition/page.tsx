"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { BarChartBlock } from "@/components/charts/bar-chart";
import { DataTable } from "@/components/ui/data-table";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { useAnalyticsData } from "@/hooks/use-analytics";
import { formatPercent } from "@/lib/format";
import { useQueryState, withExtraQuery } from "@/lib/query";
import type { AcquisitionResponse, AcquisitionRow } from "@/lib/types";

function applyDrillFilter(
  row: AcquisitionRow,
  dimension: "sourceMedium" | "campaign",
  setQuery: ReturnType<typeof useQueryState>["setQuery"]
) {
  if (dimension === "campaign") {
    setQuery({ campaign: row.campaign || row.key }, { replace: true });
    return;
  }

  setQuery(
    {
      source: row.source || "",
      medium: row.medium || ""
    },
    { replace: true }
  );
}

export default function AcquisitionPage() {
  const { query, setQuery } = useQueryState();
  const dimension = query.get("dimension") === "campaign" ? "campaign" : "sourceMedium";

  const requestQuery = withExtraQuery(query, { dimension });
  const { data, loading, error } = useAnalyticsData<AcquisitionResponse>(
    "/api/analytics/acquisition",
    requestQuery
  );

  return (
    <DashboardShell
      title="Acquisition"
      subtitle="Source/medium and campaign performance with first-touch comparison"
    >
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setQuery({ dimension: "sourceMedium" }, { replace: true })}
          className={`rounded-md border px-3 py-1.5 text-sm ${
            dimension === "sourceMedium"
              ? "border-accent bg-accent text-white"
              : "border-border bg-white text-ink"
          }`.trim()}
        >
          Source / Medium
        </button>
        <button
          type="button"
          onClick={() => setQuery({ dimension: "campaign" }, { replace: true })}
          className={`rounded-md border px-3 py-1.5 text-sm ${
            dimension === "campaign"
              ? "border-accent bg-accent text-white"
              : "border-border bg-white text-ink"
          }`.trim()}
        >
          Campaign
        </button>
      </div>

      {loading && <LoadingState label="Loading acquisition analytics..." />}
      {error && !loading && <ErrorState message={error} />}
      {!loading && !error && data && (
        <>
          <section className="grid gap-4 xl:grid-cols-2">
            <BarChartBlock
              title="Session-based"
              subtitle="Click bars or rows to drill into pages and case studies"
              data={data.sessionBased[dimension].slice(0, 10).map((row) => ({
                dimension: row.key,
                sessions: row.sessions
              }))}
              xKey="dimension"
              yKey="sessions"
            />
            <BarChartBlock
              title="First-touch"
              subtitle="How first acquisition source compares"
              data={data.firstTouch[dimension].slice(0, 10).map((row) => ({
                dimension: row.key,
                sessions: row.sessions
              }))}
              xKey="dimension"
              yKey="sessions"
              color="#346d8c"
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <DataTable
              title="Session-based table"
              subtitle="Sortable, searchable, exportable"
              rows={data.sessionBased[dimension]}
              rowKey={(row) => `session-${row.key}`}
              exportName="acquisition-session-based.csv"
              onRowClick={(row) => applyDrillFilter(row, dimension, setQuery)}
              columns={[
                { key: "key", label: dimension === "campaign" ? "Campaign" : "Source / Medium" },
                { key: "sessions", label: "Sessions" },
                { key: "users", label: "Users" },
                { key: "conversions", label: "Conversions" },
                {
                  key: "conversionRate",
                  label: "Conversion rate",
                  render: (row) => formatPercent(row.conversionRate),
                  sortValue: (row) => row.conversionRate,
                  exportValue: (row) => row.conversionRate.toFixed(2)
                }
              ]}
            />

            <DataTable
              title="First-touch table"
              subtitle="Compare attribution perspective"
              rows={data.firstTouch[dimension]}
              rowKey={(row) => `first-${row.key}`}
              exportName="acquisition-first-touch.csv"
              columns={[
                { key: "key", label: dimension === "campaign" ? "Campaign" : "Source / Medium" },
                { key: "sessions", label: "Sessions" },
                { key: "users", label: "Users" },
                { key: "conversions", label: "Conversions" },
                {
                  key: "conversionRate",
                  label: "Conversion rate",
                  render: (row) => formatPercent(row.conversionRate),
                  sortValue: (row) => row.conversionRate,
                  exportValue: (row) => row.conversionRate.toFixed(2)
                }
              ]}
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <DataTable
              title="Drill-down pages"
              subtitle="Driven by your current source/campaign filters"
              rows={data.drilldown.topPages}
              rowKey={(row) => row.pagePath}
              exportName="acquisition-drill-pages.csv"
              onRowClick={(row) => setQuery({ page_path: row.pagePath }, { replace: true })}
              columns={[
                { key: "pagePath", label: "Page" },
                { key: "events", label: "Events" },
                { key: "sessions", label: "Sessions" }
              ]}
            />

            <DataTable
              title="Drill-down case studies"
              subtitle="Which case studies each source sends traffic to"
              rows={data.drilldown.topCaseStudies}
              rowKey={(row) => row.slug}
              exportName="acquisition-drill-case-studies.csv"
              onRowClick={(row) => setQuery({ case_study_slug: row.slug }, { replace: true })}
              columns={[
                { key: "slug", label: "Slug" },
                { key: "title", label: "Title" },
                { key: "sessions", label: "Sessions" },
                { key: "conversions", label: "Conversions" }
              ]}
            />
          </section>
        </>
      )}
    </DashboardShell>
  );
}
