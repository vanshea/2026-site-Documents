"use client";

import { useEffect, useMemo, useState } from "react";

type Options = {
  refreshMs?: number;
};

type State<T> = {
  data: T | null;
  loading: boolean;
  error: string;
};

export function useAnalyticsData<T>(
  endpoint: string,
  queryString: string,
  options: Options = {}
): State<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const url = useMemo(() => {
    return queryString ? `${endpoint}?${queryString}` : endpoint;
  }, [endpoint, queryString]);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    const run = async () => {
      try {
        if (!active) return;
        if (!data) {
          setLoading(true);
        }

        const response = await fetch(url, {
          credentials: "include",
          cache: "no-store"
        });

        if (!response.ok) {
          const body = await response.text();
          throw new Error(body || `Request failed (${response.status})`);
        }

        const json = (await response.json()) as T;

        if (active) {
          setData(json);
          setError("");
          setLoading(false);
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Request failed");
        setLoading(false);
      }
    };

    void run();

    if (options.refreshMs && options.refreshMs > 0) {
      timer = setInterval(() => {
        void run();
      }, options.refreshMs);
    }

    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, [url, options.refreshMs]);

  return {
    data,
    loading,
    error
  };
}
