"use client";

import { useMemo, useState } from "react";

type Column<T> = {
  key: string;
  label: string;
  sortable?: boolean;
  className?: string;
  render?: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  exportValue?: (row: T) => string | number;
};

type DataTableProps<T> = {
  title?: string;
  subtitle?: string;
  columns: Array<Column<T>>;
  rows: T[];
  rowKey: (row: T, index: number) => string;
  searchable?: boolean;
  searchPlaceholder?: string;
  exportName?: string;
  onRowClick?: (row: T) => void;
};

function toSearchable(row: unknown): string {
  return JSON.stringify(row ?? {}).toLowerCase();
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function DataTable<T>({
  title,
  subtitle,
  columns,
  rows,
  rowKey,
  searchable = true,
  searchPlaceholder = "Search...",
  exportName,
  onRowClick
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState(columns[0]?.key || "");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) => toSearchable(row).includes(query));
  }, [rows, search]);

  const sortedRows = useMemo(() => {
    const column = columns.find((item) => item.key === sortKey);
    if (!column || column.sortable === false) return filteredRows;

    return [...filteredRows].sort((left, right) => {
      const leftValue = column.sortValue
        ? column.sortValue(left)
        : (left as Record<string, unknown>)[column.key];
      const rightValue = column.sortValue
        ? column.sortValue(right)
        : (right as Record<string, unknown>)[column.key];

      if (leftValue === rightValue) return 0;
      if (leftValue === undefined || leftValue === null) return 1;
      if (rightValue === undefined || rightValue === null) return -1;

      if (typeof leftValue === "number" && typeof rightValue === "number") {
        return sortDirection === "asc" ? leftValue - rightValue : rightValue - leftValue;
      }

      const comparison = String(leftValue).localeCompare(String(rightValue));
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredRows, columns, sortDirection, sortKey]);

  const downloadCsv = () => {
    const header = columns.map((column) => csvEscape(column.label)).join(",");
    const lines = sortedRows.map((row) =>
      columns
        .map((column) => {
          const value = column.exportValue
            ? column.exportValue(row)
            : (row as Record<string, unknown>)[column.key];
          return csvEscape(String(value ?? ""));
        })
        .join(",")
    );

    const blob = new Blob([`${header}\n${lines.join("\n")}`], {
      type: "text/csv;charset=utf-8"
    });

    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = exportName || "report.csv";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(href);
  };

  const onSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDirection("desc");
  };

  return (
    <section className="rounded-xl border border-border bg-panel p-4 shadow-card md:p-5">
      {(title || subtitle || searchable || exportName) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            {title && <h3 className="text-lg font-semibold text-ink">{title}</h3>}
            {subtitle && <p className="text-sm text-inkSoft">{subtitle}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {searchable && (
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 rounded-md border border-border bg-white px-3 text-sm text-ink outline-none ring-accent/30 focus:ring"
              />
            )}
            {exportName && (
              <button
                type="button"
                onClick={downloadCsv}
                className="h-9 rounded-md border border-border bg-white px-3 text-sm font-medium text-ink hover:border-accent hover:text-accent"
              >
                Export visible CSV
              </button>
            )}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-inkSoft">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-2 py-2 font-semibold ${column.className || ""}`.trim()}
                >
                  {column.sortable === false ? (
                    column.label
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSort(column.key)}
                      className="inline-flex items-center gap-1 hover:text-accent"
                    >
                      {column.label}
                      {sortKey === column.key ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, index) => (
              <tr
                key={rowKey(row, index)}
                className={`border-b border-border/70 ${onRowClick ? "cursor-pointer hover:bg-accentSoft/40" : ""}`.trim()}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((column) => (
                  <td key={column.key} className={`px-2 py-2 ${column.className || ""}`.trim()}>
                    {column.render
                      ? column.render(row)
                      : String((row as Record<string, unknown>)[column.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
