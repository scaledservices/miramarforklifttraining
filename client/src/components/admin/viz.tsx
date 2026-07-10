import { TrendingUp, TrendingDown, Minus, Lightbulb } from "lucide-react";

/**
 * Tiny visualization primitives shared by the admin dashboards.
 *
 * Color rules (validated with the dataviz palette checker):
 * - Data marks use brand green #019E7C; orange #FF7F00 only with visible
 *   value labels next to it (it sits below 3:1 contrast on white alone).
 * - Brown/gold stay UI-only — too light/gray to read as data on white.
 * - Trends never rely on color alone: every chip pairs the color with an
 *   arrow icon and a signed percentage.
 */

export const VIZ_GREEN = "#019E7C";
export const VIZ_ORANGE = "#FF7F00";

/** % change from previous to current; null when there is no meaningful base. */
export function pctChange(current: number, previous: number): number | null {
  if (!isFinite(previous) || Math.abs(previous) < 0.01) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/**
 * Inline SVG sparkline — one series, no axes. Supplementary by design: the
 * number it supports is always printed next to it.
 */
export function Sparkline({
  values,
  width = 96,
  height = 28,
  stroke = VIZ_GREEN,
  label,
  testId,
}: {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  /** Accessible name, e.g. "Daily money collected, last 14 days" */
  label: string;
  testId?: string;
}) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const pad = 2;
  const step = (width - pad * 2) / (values.length - 1);
  const y = (v: number) => height - pad - ((v - min) / range) * (height - pad * 2);
  const points = values.map((v, i) => `${(pad + i * step).toFixed(1)},${y(v).toFixed(1)}`);
  const area = `${pad},${height - pad} ${points.join(" ")} ${width - pad},${height - pad}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
      className="shrink-0"
      data-testid={testId}
    >
      <title>{label}</title>
      <polygon points={area} fill={stroke} opacity={0.12} />
      <polyline points={points.join(" ")} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Up/down indicator vs a previous period. Icon + signed % so it never reads
 * by color alone; `title` explains itself on hover (tooltip-first for ESL).
 */
export function TrendChip({
  current,
  previous,
  compareLabel,
  testId,
}: {
  current: number;
  previous: number;
  /** Plain words for what we compare against, e.g. "vs last week" */
  compareLabel: string;
  testId?: string;
}) {
  const pct = pctChange(current, previous);
  if (pct === null) return null;
  const flat = Math.abs(pct) < 1;
  const up = pct >= 1;
  const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;
  const tone = flat
    ? "text-muted-foreground"
    : up
      ? "text-brand-green"
      : "text-red-600 dark:text-red-400";
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap ${tone}`}
      title={compareLabel}
      data-testid={testId}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {flat ? "—" : `${pct > 0 ? "+" : ""}${Math.round(pct)}%`}
      <span className="font-normal text-muted-foreground">{compareLabel}</span>
    </span>
  );
}

/** Plain-language takeaway printed under a chart or stat. */
export function InsightLine({ children, testId }: { children: React.ReactNode; testId?: string }) {
  return (
    <p className="flex items-start gap-1.5 text-sm text-muted-foreground" data-testid={testId}>
      <Lightbulb className="h-4 w-4 mt-0.5 shrink-0 text-primary" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

/**
 * Horizontal magnitude bars for a small category breakdown. Single hue by
 * design (identity lives in the row labels), right-aligned values.
 */
export function BreakdownBars({
  rows,
  formatValue,
  testIdPrefix,
}: {
  rows: { label: string; value: number }[];
  formatValue: (n: number) => string;
  testIdPrefix: string;
}) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2" data-testid={`${testIdPrefix}-${r.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
          <span className="w-28 shrink-0 truncate text-sm" title={r.label}>{r.label}</span>
          <div className="flex-1 h-4 rounded bg-muted overflow-hidden">
            <div
              className="h-full rounded"
              style={{ width: `${Math.max(2, (r.value / max) * 100)}%`, backgroundColor: VIZ_GREEN }}
            />
          </div>
          <span className="w-20 shrink-0 text-right text-sm font-medium tabular-nums">{formatValue(r.value)}</span>
        </div>
      ))}
    </div>
  );
}
