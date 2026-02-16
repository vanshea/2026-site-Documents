"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { BarChartBlock } from "@/components/charts/bar-chart";
import { TrendChart } from "@/components/charts/trend-chart";
import { DataTable } from "@/components/ui/data-table";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { useAnalyticsData } from "@/hooks/use-analytics";
import { formatDecimal, formatDuration, formatPercent } from "@/lib/format";
import { useQueryState } from "@/lib/query";
import type { OverviewResponse } from "@/lib/types";

export default function OverviewPage() {
  const { query, setQuery } = useQueryState();
  const { data, loading, error } = useAnalyticsData<OverviewResponse>(
    "/api/analytics/overview",
    query.toString()
  );

  return (
    <DashboardShell
      title="Overview"
      subtitle="KPI snapshot, trends, top acquisition channels, and high-intent case studies"
    >
      {loading && <LoadingState />}
      {error && !loading && <ErrorState message={error} />}
      {!loading && !error && data && (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <KpiCard
              label="Users"
              value={data.kpis.users.current}
              delta={data.kpis.users.deltaPercent}
            />
            <KpiCard
              label="Sessions"
              value={data.kpis.sessions.current}
              delta={data.kpis.sessions.deltaPercent}
            />
            <KpiCard
              label="Pageviews"
              value={data.kpis.pageviews.current}
              delta={data.kpis.pageviews.deltaPercent}
            />
            <KpiCard
              label="Conversions"
              value={data.kpis.conversions.current}
              delta={data.kpis.conversions.deltaPercent}
            />
            <Card>
              <p className="text-xs uppercase tracking-wide text-inkSoft">Engagement rate</p>
              <p className="mt-2 text-2xl font-semibold text-ink">
                {formatPercent(data.kpis.engagementRate.current)}
              </p>
              <p className="mt-2 text-sm text-inkSoft">
                Δ {formatDecimal(data.kpis.engagementRate.deltaPercent, 1)}%
              </p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-wide text-inkSoft">Avg engagement time</p>
              <p className="mt-2 text-2xl font-semibold text-ink">
                {formatDuration(data.kpis.avgEngagementTime.current)}
              </p>
              <p className="mt-2 text-sm text-inkSoft">
                Δ {formatDecimal(data.kpis.avgEngagementTime.deltaPercent, 1)}%
              </p>
            </Card>
          </section>

          <TrendChart
            title="Trend"
            subtitle="Daily users, sessions, pageviews, and conversions"
            data={data.trend}
            series={[
              { key: "users", label: "Users", color: "#1f6f5f" },
              { key: "sessions", label: "Sessions", color: "#346d8c" },
              { key: "pageviews", label: "Pageviews", color: "#b8742b" },
              { key: "conversions", label: "Conversions", color: "#9f3a31" }
            ]}
          />

          <section className="grid gap-4 xl:grid-cols-2">
            <BarChartBlock
              title="Top acquisition sources"
              subtitle="Session-based source / medium"
              data={data.topSources.map((row) => ({
                sourceMedium: `${row.source} / ${row.medium}`,
                sessions: row.sessions
              }))}
              xKey="sourceMedium"
              yKey="sessions"
            />

            <DataTable
              title="Top case studies"
              subtitle="Ranked by deep scroll + conversion intent"
              rows={data.topCaseStudies}
              rowKey={(row) => row.slug}
              exportName="overview-top-case-studies.csv"
              onRowClick={(row) => setQuery({ case_study_slug: row.slug }, { replace: true })}
              columns={[
                { key: "slug", label: "Slug" },
                { key: "views", label: "Views" },
                {
                  key: "deepScrollRate",
                  label: "Deep scroll rate",
                  render: (row) => formatPercent(row.deepScrollRate),
                  sortValue: (row) => row.deepScrollRate,
                  exportValue: (row) => row.deepScrollRate.toFixed(2)
                },
                { key: "resumeClicks", label: "Resume" },
                { key: "contactClicks", label: "Contact" }
              ]}
            />
          </section>

          <DataTable
            title="Acquisition source details"
            subtitle="Click row to apply source/medium filter globally"
            rows={data.topSources}
            rowKey={(row) => `${row.source}-${row.medium}`}
            exportName="overview-source-details.csv"
            onRowClick={(row) =>
              setQuery(
                {
                  source: row.source,
                  medium: row.medium
                },
                { replace: true }
              )
            }
            columns={[
              { key: "source", label: "Source" },
              { key: "medium", label: "Medium" },
              { key: "sessions", label: "Sessions" }
            ]}
          />
        </>
      )}
    </DashboardShell>
  );
}
