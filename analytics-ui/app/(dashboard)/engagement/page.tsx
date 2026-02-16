"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { BarChartBlock } from "@/components/charts/bar-chart";
import { DataTable } from "@/components/ui/data-table";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { useAnalyticsData } from "@/hooks/use-analytics";
import { formatDuration, formatPercent } from "@/lib/format";
import { useQueryState } from "@/lib/query";
import type { EngagementCaseResponse, EngagementPageResponse } from "@/lib/types";

export default function EngagementPage() {
  const { query, setQuery } = useQueryState();

  const pages = useAnalyticsData<EngagementPageResponse>(
    "/api/analytics/engagement/pages",
    query.toString()
  );
  const caseStudies = useAnalyticsData<EngagementCaseResponse>(
    "/api/analytics/engagement/case-studies",
    query.toString()
  );

  const loading = pages.loading || caseStudies.loading;
  const error = pages.error || caseStudies.error;

  return (
    <DashboardShell
      title="Engagement"
      subtitle="Page performance, deep scroll completion, exits, and case-study depth"
    >
      {loading && <LoadingState label="Loading engagement analytics..." />}
      {error && !loading && <ErrorState message={error} />}
      {!loading && !error && pages.data && caseStudies.data && (
        <>
          <section className="grid gap-4 xl:grid-cols-2">
            <BarChartBlock
              title="Top pages by views"
              subtitle="Current filtered date range"
              data={pages.data.rows.slice(0, 10).map((row) => ({
                pagePath: row.pagePath,
                views: row.views
              }))}
              xKey="pagePath"
              yKey="views"
            />
            <BarChartBlock
              title="Case studies by deep scroll rate"
              subtitle="75%+ scroll completion"
              data={caseStudies.data.rows.slice(0, 10).map((row) => ({
                slug: row.slug,
                deepScrollRate: Number(row.deepScrollRate.toFixed(2))
              }))}
              xKey="slug"
              yKey="deepScrollRate"
              color="#346d8c"
            />
          </section>

          <DataTable
            title="Pages report"
            subtitle="Views, engagement time, exits, and scroll completion"
            rows={pages.data.rows}
            rowKey={(row) => row.pagePath}
            exportName="engagement-pages.csv"
            onRowClick={(row) => setQuery({ page_path: row.pagePath }, { replace: true })}
            columns={[
              { key: "pagePath", label: "Page path" },
              { key: "views", label: "Views" },
              {
                key: "avgEngagementTime",
                label: "Avg engagement",
                render: (row) => formatDuration(row.avgEngagementTime),
                sortValue: (row) => row.avgEngagementTime,
                exportValue: (row) => row.avgEngagementTime.toFixed(2)
              },
              {
                key: "exitRate",
                label: "Exit rate",
                render: (row) => formatPercent(row.exitRate),
                sortValue: (row) => row.exitRate,
                exportValue: (row) => row.exitRate.toFixed(2)
              },
              {
                key: "scrollCompletionRate",
                label: "Scroll completion",
                render: (row) => formatPercent(row.scrollCompletionRate),
                sortValue: (row) => row.scrollCompletionRate,
                exportValue: (row) => row.scrollCompletionRate.toFixed(2)
              }
            ]}
          />

          <DataTable
            title="Case studies report"
            subtitle="Deep scroll, resume clicks, and contact clicks"
            rows={caseStudies.data.rows}
            rowKey={(row) => row.slug}
            exportName="engagement-case-studies.csv"
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
              { key: "resumeClicks", label: "Resume clicks" },
              { key: "contactClicks", label: "Contact clicks" }
            ]}
          />
        </>
      )}
    </DashboardShell>
  );
}
