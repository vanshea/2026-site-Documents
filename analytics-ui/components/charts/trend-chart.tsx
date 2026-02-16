"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { Card } from "@/components/ui/card";

type Series = {
  key: string;
  label: string;
  color: string;
};

type TrendChartProps = {
  title: string;
  subtitle?: string;
  data: Record<string, string | number>[];
  series: Series[];
  height?: number;
};

export function TrendChart({
  title,
  subtitle,
  data,
  series,
  height = 280
}: TrendChartProps) {
  return (
    <Card>
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
        {subtitle && <p className="text-sm text-inkSoft">{subtitle}</p>}
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#dde4df" strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fill: "#516069", fontSize: 12 }} />
            <YAxis tick={{ fill: "#516069", fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {series.map((item) => (
              <Line
                key={item.key}
                type="monotone"
                dataKey={item.key}
                name={item.label}
                stroke={item.color}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
