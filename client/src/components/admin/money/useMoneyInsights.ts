import { useQuery } from "@tanstack/react-query";
import type { MonthlyStatementData } from "./types";

/**
 * Day-level money numbers derived from the current + previous month
 * statements (GET /api/admin/money/statement). Refund line items already
 * carry negative amounts, so a plain sum per day is net collected.
 */

export interface MoneyInsights {
  loading: boolean;
  /** Net collected today */
  today: number;
  /** Net collected Monday → today */
  thisWeekSoFar: number;
  /** Net collected over the same weekday span last week (Mon → same weekday) */
  lastWeekSameSpan: number;
  /** Full previous week Mon–Sun */
  lastWeekTotal: number;
  thisMonth: number;
  lastMonth: number;
  albertoThisMonth: number;
  albertoLastMonth: number;
  /** Net collected per day, oldest → newest */
  daily: (days: number) => number[];
}

function localDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function monthParam(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Monday of the week containing d (local time). */
function mondayOf(d: Date): Date {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = out.getDay(); // 0 = Sunday
  out.setDate(out.getDate() - ((dow + 6) % 7));
  return out;
}

export function useMoneyInsights(): MoneyInsights {
  const now = new Date();
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const cur = useQuery<MonthlyStatementData>({
    queryKey: [`/api/admin/money/statement?month=${monthParam(now)}`],
  });
  const prev = useQuery<MonthlyStatementData>({
    queryKey: [`/api/admin/money/statement?month=${monthParam(prevMonthDate)}`],
  });

  const byDay = new Map<string, number>();
  for (const q of [cur.data, prev.data]) {
    for (const item of q?.lineItems ?? []) {
      const day = localDay(new Date(item.date));
      byDay.set(day, (byDay.get(day) ?? 0) + item.amount);
    }
  }

  const sumRange = (from: Date, toInclusive: Date): number => {
    let total = 0;
    const d = new Date(from);
    while (d <= toInclusive) {
      total += byDay.get(localDay(d)) ?? 0;
      d.setDate(d.getDate() + 1);
    }
    return total;
  };

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monday = mondayOf(now);
  const lastMonday = new Date(monday);
  lastMonday.setDate(lastMonday.getDate() - 7);
  const lastSunday = new Date(monday);
  lastSunday.setDate(lastSunday.getDate() - 1);
  const lastWeekSameDay = new Date(todayStart);
  lastWeekSameDay.setDate(lastWeekSameDay.getDate() - 7);

  const daily = (days: number): number[] => {
    const out: number[] = [];
    const d = new Date(todayStart);
    d.setDate(d.getDate() - (days - 1));
    while (d <= todayStart) {
      out.push(byDay.get(localDay(d)) ?? 0);
      d.setDate(d.getDate() + 1);
    }
    return out;
  };

  return {
    loading: cur.isLoading || prev.isLoading,
    today: byDay.get(localDay(now)) ?? 0,
    thisWeekSoFar: sumRange(monday, todayStart),
    lastWeekSameSpan: sumRange(lastMonday, lastWeekSameDay),
    lastWeekTotal: sumRange(lastMonday, lastSunday),
    thisMonth: cur.data?.totals.revenue ?? 0,
    lastMonth: prev.data?.totals.revenue ?? 0,
    albertoThisMonth: cur.data?.totals.alberto ?? 0,
    albertoLastMonth: prev.data?.totals.alberto ?? 0,
    daily,
  };
}
