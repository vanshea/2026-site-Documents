"use client";

import { ChangeEvent, useMemo } from "react";
import { boolParam, defaultDateRange, useQueryState } from "@/lib/query";

function isPreset(from: string, to: string, days: number): boolean {
  const fallback = defaultDateRange(days);
  return fallback.from === from && fallback.to === to;
}

export function GlobalControls() {
  const { query, setQuery } = useQueryState();

  const from = query.get("from") || defaultDateRange(30).from;
  const to = query.get("to") || defaultDateRange(30).to;
  const compare = boolParam(query, "compare");

  const preset = useMemo(() => {
    if (isPreset(from, to, 7)) return "7";
    if (isPreset(from, to, 30)) return "30";
    if (isPreset(from, to, 90)) return "90";
    return "custom";
  }, [from, to]);

  const onPresetChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value === "custom") return;

    const fallback = defaultDateRange(Number(value));
    setQuery(
      {
        from: fallback.from,
        to: fallback.to
      },
      { replace: true }
    );
  };

  const onDateChange = (key: "from" | "to") => (event: ChangeEvent<HTMLInputElement>) => {
    setQuery({ [key]: event.target.value }, { replace: true });
  };

  const onFieldChange = (key: string) => (event: ChangeEvent<HTMLInputElement>) => {
    setQuery({ [key]: event.target.value }, { replace: true });
  };

  return (
    <section className="rounded-xl border border-border bg-panel p-4 shadow-card md:p-5">
      <div className="grid gap-3 md:grid-cols-6">
        <label className="text-xs font-medium text-inkSoft">
          Preset
          <select
            value={preset}
            onChange={onPresetChange}
            className="mt-1 h-9 w-full rounded-md border border-border bg-white px-2 text-sm text-ink"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="custom">Custom</option>
          </select>
        </label>

        <label className="text-xs font-medium text-inkSoft">
          From
          <input
            type="date"
            value={from}
            onChange={onDateChange("from")}
            className="mt-1 h-9 w-full rounded-md border border-border bg-white px-2 text-sm text-ink"
          />
        </label>

        <label className="text-xs font-medium text-inkSoft">
          To
          <input
            type="date"
            value={to}
            onChange={onDateChange("to")}
            className="mt-1 h-9 w-full rounded-md border border-border bg-white px-2 text-sm text-ink"
          />
        </label>

        <label className="text-xs font-medium text-inkSoft">
          Search (page/slug)
          <input
            type="text"
            value={query.get("q") || ""}
            onChange={onFieldChange("q")}
            placeholder="/case-studies or slug"
            className="mt-1 h-9 w-full rounded-md border border-border bg-white px-2 text-sm text-ink"
          />
        </label>

        <label className="text-xs font-medium text-inkSoft">
          Source
          <input
            type="text"
            value={query.get("source") || ""}
            onChange={onFieldChange("source")}
            placeholder="google"
            className="mt-1 h-9 w-full rounded-md border border-border bg-white px-2 text-sm text-ink"
          />
        </label>

        <label className="text-xs font-medium text-inkSoft">
          Medium
          <input
            type="text"
            value={query.get("medium") || ""}
            onChange={onFieldChange("medium")}
            placeholder="organic"
            className="mt-1 h-9 w-full rounded-md border border-border bg-white px-2 text-sm text-ink"
          />
        </label>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-4">
        <label className="text-xs font-medium text-inkSoft">
          Campaign
          <input
            type="text"
            value={query.get("campaign") || ""}
            onChange={onFieldChange("campaign")}
            placeholder="spring_launch"
            className="mt-1 h-9 w-full rounded-md border border-border bg-white px-2 text-sm text-ink"
          />
        </label>

        <label className="text-xs font-medium text-inkSoft">
          Device
          <input
            type="text"
            value={query.get("device") || ""}
            onChange={onFieldChange("device")}
            placeholder="desktop|mobile|tablet"
            className="mt-1 h-9 w-full rounded-md border border-border bg-white px-2 text-sm text-ink"
          />
        </label>

        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => setQuery({ compare: compare ? "0" : "1" }, { replace: true })}
            className={`h-9 rounded-md border px-3 text-sm font-medium ${
              compare
                ? "border-accent bg-accent text-white"
                : "border-border bg-white text-ink"
            }`.trim()}
          >
            Compare previous period
          </button>
          <button
            type="button"
            onClick={() =>
              setQuery(
                {
                  q: null,
                  source: null,
                  medium: null,
                  campaign: null,
                  device: null,
                  referrer: null,
                  country: null,
                  page_path: null,
                  case_study_slug: null
                },
                { replace: true }
              )
            }
            className="h-9 rounded-md border border-border bg-white px-3 text-sm font-medium text-ink hover:border-accent hover:text-accent"
          >
            Clear filters
          </button>
        </div>

        <div className="flex items-end">
          <a
            href={`/api/analytics/export.csv?${query.toString()}&report=events`}
            className="h-9 rounded-md border border-border bg-white px-3 py-2 text-sm font-medium text-ink hover:border-accent hover:text-accent"
          >
            Export current (events)
          </a>
        </div>
      </div>
    </section>
  );
}
