"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type QueryPatch = Record<string, string | number | boolean | null | undefined>;

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function defaultDateRange(days = 30): { from: string; to: string } {
  const now = new Date();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const start = new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  return {
    from: toDateString(start),
    to: toDateString(end)
  };
}

export function useQueryState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const queryString = searchParams.toString();

  const query = useMemo(() => {
    const current = new URLSearchParams(queryString);
    if (!current.get("from") || !current.get("to")) {
      const fallback = defaultDateRange(30);
      current.set("from", fallback.from);
      current.set("to", fallback.to);
    }
    return current;
  }, [queryString]);

  const setQuery = (patch: QueryPatch, options?: { replace?: boolean }) => {
    const next = new URLSearchParams(query.toString());

    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === null || value === "") {
        next.delete(key);
        continue;
      }

      if (typeof value === "boolean") {
        next.set(key, value ? "1" : "0");
      } else {
        next.set(key, String(value));
      }
    }

    const target = `${pathname}?${next.toString()}`;
    if (options?.replace) {
      router.replace(target);
    } else {
      router.push(target);
    }
  };

  return {
    query,
    setQuery
  };
}

export function withExtraQuery(
  query: URLSearchParams,
  patch: QueryPatch,
  removeKeys: string[] = []
): string {
  const next = new URLSearchParams(query.toString());

  for (const key of removeKeys) {
    next.delete(key);
  }

  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined || value === null || value === "") {
      next.delete(key);
      continue;
    }

    if (typeof value === "boolean") {
      next.set(key, value ? "1" : "0");
    } else {
      next.set(key, String(value));
    }
  }

  return next.toString();
}

export function boolParam(query: URLSearchParams, key: string): boolean {
  return query.get(key) === "1" || query.get(key) === "true";
}
