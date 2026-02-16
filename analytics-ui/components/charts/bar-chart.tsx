"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { Card } from "@/components/ui/card";

type BarChartBlockProps = {
  title: string;
  subtitle?: string;
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
};

export function BarChartBlock({
  title,
  subtitle,
  data,
  xKey,
  yKey,
  color = "#1f6f5f",
  height = 280
}: BarChartBlockProps) {
  return (
    <Card>
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
        {subtitle && <p className="text-sm text-inkSoft">{subtitle}</p>}
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 16 }}>
            <CartesianGrid stroke="#dde4df" strokeDasharray="3 3" />
            <XAxis
              dataKey={xKey}
              tick={{ fill: "#516069", fontSize: 12 }}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={54}
            />
            <YAxis tick={{ fill: "#516069", fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey={yKey} fill={color} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
