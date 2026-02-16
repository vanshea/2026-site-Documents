"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { TrendChart } from "@/components/charts/trend-chart";
import { DataTable } from "@/components/ui/data-table";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { useAnalyticsData } from "@/hooks/use-analytics";
import { formatPercent } from "@/lib/format";
import { useQueryState, withExtraQuery } from "@/lib/query";
import type { ConversionsResponse, FunnelResponse } from "@/lib/types";

export default function ConversionsPage() {
  const { query } = useQueryState();

  const conversions = useAnalyticsData<ConversionsResponse>(
    "/api/analytics/conversions",
    query.toString()
  );

  const funnelHome = useAnalyticsData<FunnelResponse>(
    "/api/analytics/funnels",
    withExtraQuery(query, { funnel: "home_to_contact" })
  );

  const funnelCase = useAnalyticsData<FunnelResponse>(
    "/api/analytics/funnels",
    withExtraQuery(query, { funnel: "case_to_resume" })
  );

  const loading = conversions.loading || funnelHome.loading || funnelCase.loading;
  const error = conversions.error || funnelHome.error || funnelCase.error;

  return (
    <DashboardShell
      title="Conversions + Funnels"
      subtitle="Key conversion events and path drop-off analysis"
    >
      {loading && <LoadingState label="Loading conversion analytics..." />}
      {error && !loading && <ErrorState message={error} />}
      {!loading && !error && conversions.data && funnelHome.data && funnelCase.data && (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <KpiCard
              label="Resume downloads"
              value={conversions.data.counts.click_resume_download.current}
              delta={conversions.data.counts.click_resume_download.deltaPercent}
            />
            <KpiCard
              label="Contact clicks"
              value={conversions.data.counts.click_contact.current}
              delta={conversions.data.counts.click_contact.deltaPercent}
            />
            <KpiCard
              label="Form submits"
              value={conversions.data.counts.submit_contact_form.current}
              delta={conversions.data.counts.submit_contact_form.deltaPercent}
            />
          </section>

          <TrendChart
            title="Conversion trend"
            subtitle="Daily conversion event counts"
            data={conversions.data.trend}
            series={[
              {
                key: "click_resume_download",
                label: "Resume download",
                color: "#1f6f5f"
              },
              {
                key: "click_contact",
                label: "Contact click",
                color: "#346d8c"
              },
              {
                key: "submit_contact_form",
                label: "Form submit",
                color: "#9f3a31"
              }
            ]}
          />

          <section className="grid gap-4 xl:grid-cols-2">
            <Card>
              <h3 className="text-lg font-semibold text-ink">Home → Case Study → Contact</h3>
              <p className="mt-1 text-sm text-inkSoft">
                Overall conversion: {formatPercent(funnelHome.data.overallConversionRate)}
              </p>
              <div className="mt-3">
                <DataTable
                  rows={funnelHome.data.steps}
                  rowKey={(row) => row.step}
                  exportName="funnel-home-to-contact.csv"
                  columns={[
                    { key: "step", label: "Step" },
                    { key: "sessions", label: "Sessions" },
                    { key: "dropOff", label: "Drop-off" },
                    {
                      key: "conversionRate",
                      label: "Step conversion",
                      render: (row) => formatPercent(row.conversionRate),
                      sortValue: (row) => row.conversionRate,
                      exportValue: (row) => row.conversionRate.toFixed(2)
                    }
                  ]}
                />
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-ink">Case Study → Resume Download</h3>
              <p className="mt-1 text-sm text-inkSoft">
                Overall conversion: {formatPercent(funnelCase.data.overallConversionRate)}
              </p>
              <div className="mt-3">
                <DataTable
                  rows={funnelCase.data.steps}
                  rowKey={(row) => row.step}
                  exportName="funnel-case-to-resume.csv"
                  columns={[
                    { key: "step", label: "Step" },
                    { key: "sessions", label: "Sessions" },
                    { key: "dropOff", label: "Drop-off" },
                    {
                      key: "conversionRate",
                      label: "Step conversion",
                      render: (row) => formatPercent(row.conversionRate),
                      sortValue: (row) => row.conversionRate,
                      exportValue: (row) => row.conversionRate.toFixed(2)
                    }
                  ]}
                />
              </div>
            </Card>
          </section>
        </>
      )}
    </DashboardShell>
  );
}
