import { Card } from "@/components/ui/card";
import { deltaClass, deltaLabel, formatNumber } from "@/lib/format";

type KpiCardProps = {
  label: string;
  value: number;
  delta: number;
  suffix?: string;
};

export function KpiCard({ label, value, delta, suffix = "" }: KpiCardProps) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-wide text-inkSoft">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">
        {formatNumber(value)}
        {suffix}
      </p>
      <p className={`mt-2 text-sm font-medium ${deltaClass(delta)}`}>{deltaLabel(delta)}</p>
    </Card>
  );
}
