export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

export function formatDecimal(value: number, digits = 1): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(Number(value || 0));
}

export function formatPercent(value: number, digits = 1): string {
  return `${formatDecimal(value, digits)}%`;
}

export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}m ${secs.toString().padStart(2, "0")}s`;
}

export function deltaClass(deltaPercent: number): string {
  if (deltaPercent > 0) return "text-accent";
  if (deltaPercent < 0) return "text-warn";
  return "text-inkSoft";
}

export function deltaLabel(deltaPercent: number): string {
  const sign = deltaPercent > 0 ? "+" : "";
  return `${sign}${formatDecimal(deltaPercent, 1)}%`;
}
