import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { DollarSign, AlertTriangle, CalendarDays, CalendarRange, Wallet, Sun } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import MonthlyStatement from "@/components/admin/money/MonthlyStatement";
import SplitConfigEditor from "@/components/admin/money/SplitConfigEditor";
import { formatMoney, type MoneySummary, type SplitConfigResponse } from "@/components/admin/money/types";
import { useMoneyInsights } from "@/components/admin/money/useMoneyInsights";
import { productLabel } from "@/components/admin/today/types";
import { Sparkline, TrendChip, InsightLine, BreakdownBars, pctChange, VIZ_GREEN } from "@/components/admin/viz";
import type { Booking } from "@shared/schema";

interface AdminOrder {
  id: number;
  total: string;
  status: "pending" | "paid" | "refunded";
  createdAt: string;
}

function SummaryCard({
  title,
  icon,
  value,
  sub,
  extra,
  hint,
  testId,
}: {
  title: string;
  icon: React.ReactNode;
  value: string;
  sub: string;
  extra?: React.ReactNode;
  hint?: string;
  testId: string;
}) {
  return (
    <Card data-testid={testId} title={hint}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-2">
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          {extra}
        </div>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

const LOCATION_LABELS: [suffix: string, label: string][] = [
  ["san-diego", "San Diego"],
  ["las-vegas", "Las Vegas"],
  ["fresno", "Fresno"],
];

function locationOf(productSlug: string): string {
  const hit = LOCATION_LABELS.find(([suffix]) => productSlug.endsWith(suffix));
  return hit ? hit[1] : "Other";
}

export default function AdminMoney() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const { data: summary, isLoading, isError } = useQuery<MoneySummary>({
    queryKey: ["/api/admin/money/summary"],
  });
  const insights = useMoneyInsights();
  const { data: splitConfig } = useQuery<SplitConfigResponse>({
    queryKey: ["/api/admin/money/split-config"],
  });
  const { data: ordersData } = useQuery<{ orders: AdminOrder[] }>({
    queryKey: ["/api/admin/orders"],
  });
  const { data: bookings } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  // ---- Breakdowns for this month (booked value, grouped from bookings) ----
  const monthBookings = (bookings ?? []).filter(
    (b) => b.sessionDate.startsWith(monthPrefix) && b.status !== "cancelled" && b.status !== "no_show"
  );
  const sumBy = (keyOf: (b: Booking) => string) => {
    const map = new Map<string, number>();
    for (const b of monthBookings) {
      const key = keyOf(b);
      map.set(key, (map.get(key) ?? 0) + Number(b.totalPrice));
    }
    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, z) => z.value - a.value);
  };
  const byLocation = sumBy((b) => locationOf(b.productSlug));
  const byType = sumBy((b) => productLabel(b.productSlug));

  // ---- Online vs onsite: paid orders this month, split by booking linkage ----
  const bookingOrderIds = new Set((bookings ?? []).map((b) => b.orderId).filter((id): id is number => id != null));
  const paidOrdersThisMonth = (ordersData?.orders ?? []).filter(
    (o) => o.status === "paid" && new Date(o.createdAt) >= monthStart
  );
  let onsiteSales = 0;
  let onlineSales = 0;
  for (const o of paidOrdersThisMonth) {
    if (bookingOrderIds.has(o.id)) onsiteSales += Number(o.total);
    else onlineSales += Number(o.total);
  }
  // Onsite first, always — onsite outranks online in everything we present.
  const byChannel = [
    { label: t("adminUx.channelOnsite", { defaultValue: "Onsite / in-person" }), value: onsiteSales },
    { label: t("adminUx.channelOnline", { defaultValue: "Online courses" }), value: onlineSales },
  ];

  const yearSales = (ordersData?.orders ?? [])
    .filter((o) => o.status === "paid" && new Date(o.createdAt) >= yearStart)
    .reduce((sum, o) => sum + Number(o.total), 0);

  // ---- Daily collected, last 30 days (statement-derived, refunds netted) ----
  const daily30 = insights.daily(30);
  const chartData = daily30.map((amount, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (29 - i));
    return { date: `${d.getMonth() + 1}/${d.getDate()}`, amount };
  });
  const bestDay = chartData.reduce((best, d) => (d.amount > best.amount ? d : best), chartData[0] ?? { date: "", amount: 0 });

  const monthPct = pctChange(insights.thisMonth, insights.lastMonth);
  const monthInsight =
    monthPct === null
      ? null
      : Math.abs(monthPct) < 1
        ? t("adminUx.insightMonthFlat", { defaultValue: "This month is tracking about the same as last month." })
        : monthPct > 0
          ? t("adminUx.insightMonthUp", {
              pct: Math.round(monthPct),
              defaultValue: "Collected money this month is up {{pct}}% from last month.",
            })
          : t("adminUx.insightMonthDown", {
              pct: Math.abs(Math.round(monthPct)),
              defaultValue: "Collected money this month is down {{pct}}% from last month.",
            });

  const config = splitConfig?.config;

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="admin-money-page">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-money-title">
            {t("adminUx.moneyTitle", { defaultValue: "Money" })}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("adminUx.moneySubtitle", {
              defaultValue: "Collected payments, outstanding balances, and the monthly revenue split.",
            })}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        ) : isError || !summary ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {t("adminUx.moneyLoadFailed", { defaultValue: "Failed to load money summary." })}
            </p>
          </div>
        ) : (
          <>
            {/* Row 1: the four periods, densest numbers first */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard
                title={t("adminUx.moneyToday", { defaultValue: "Collected Today" })}
                icon={<Sun className="h-4 w-4 text-brand-green" />}
                value={insights.loading ? "—" : formatMoney(insights.today)}
                sub={t("adminUx.moneyTodaySub", { defaultValue: "Payments that came in today" })}
                hint={t("adminUx.moneyTodayHint", { defaultValue: "Card and cash payments recorded today, minus refunds" })}
                testId="card-today-collected"
              />
              <SummaryCard
                title={t("adminUx.moneyWeekCollected", { defaultValue: "Collected This Week" })}
                icon={<DollarSign className="h-4 w-4 text-brand-green" />}
                value={formatMoney(summary.week.collected)}
                sub={`${summary.week.start} → ${summary.week.end}`}
                extra={
                  !insights.loading ? (
                    <TrendChip
                      current={insights.thisWeekSoFar}
                      previous={insights.lastWeekSameSpan}
                      compareLabel={t("adminUx.vsLastWeek", { defaultValue: "vs last week" })}
                      testId="chip-money-week-trend"
                    />
                  ) : undefined
                }
                hint={t("adminUx.moneyWeekHint", { defaultValue: "Trend compares against the same days last week" })}
                testId="card-week-collected"
              />
              <SummaryCard
                title={t("adminUx.moneyMonthCollected", { defaultValue: "Collected This Month" })}
                icon={<DollarSign className="h-4 w-4 text-brand-green" />}
                value={formatMoney(summary.month.collected)}
                sub={`${summary.month.start} → ${summary.month.end}`}
                extra={
                  !insights.loading ? (
                    <TrendChip
                      current={insights.thisMonth}
                      previous={insights.lastMonth}
                      compareLabel={t("adminUx.vsLastMonth", { defaultValue: "vs last month" })}
                      testId="chip-money-month-trend"
                    />
                  ) : undefined
                }
                testId="card-month-collected"
              />
              <SummaryCard
                title={t("adminUx.moneyYearSales", { defaultValue: "Sales This Year" })}
                icon={<CalendarRange className="h-4 w-4 text-brand-green" />}
                value={ordersData ? formatMoney(yearSales) : "—"}
                sub={t("adminUx.moneyYearSub", { year: String(now.getFullYear()), defaultValue: "All paid orders in {{year}}" })}
                testId="card-year-sales"
              />
            </div>

            {/* Row 2: what's still owed + Alberto's cut, side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard
                title={t("adminUx.moneyWeekOutstanding", { defaultValue: "Outstanding This Week" })}
                icon={<CalendarDays className="h-4 w-4 text-brand-orange" />}
                value={formatMoney(summary.week.outstanding)}
                sub={t("adminUx.moneyWeekOutstandingSub", { defaultValue: "Balances due on this week's sessions" })}
                testId="card-week-outstanding"
              />
              <SummaryCard
                title={t("adminUx.moneyMonthOutstanding", { defaultValue: "Outstanding This Month" })}
                icon={<CalendarRange className="h-4 w-4 text-brand-orange" />}
                value={formatMoney(summary.month.outstanding)}
                sub={t("adminUx.moneyTotalOutstanding", {
                  amount: formatMoney(summary.totalOutstanding),
                  defaultValue: "{{amount}} outstanding overall",
                })}
                testId="card-month-outstanding"
              />
              <Card className="sm:col-span-2" data-testid="card-your-cut">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-brand-green" />
                    {t("adminUx.moneyYourCutTitle", { defaultValue: "Your Cut This Month" })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between gap-3">
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold tabular-nums" data-testid="text-your-cut">
                        {insights.loading ? "—" : formatMoney(insights.albertoThisMonth)}
                      </p>
                      {!insights.loading && (
                        <TrendChip
                          current={insights.albertoThisMonth}
                          previous={insights.albertoLastMonth}
                          compareLabel={t("adminUx.vsLastMonth", { defaultValue: "vs last month" })}
                          testId="chip-your-cut-trend"
                        />
                      )}
                    </div>
                    {!insights.loading && (
                      <Sparkline
                        values={insights.daily(30)}
                        width={120}
                        label={t("adminUx.sparkMoney30d", { defaultValue: "Money collected per day, last 30 days" })}
                      />
                    )}
                  </div>
                  {config && (
                    <p className="text-xs text-muted-foreground mt-1" data-testid="text-split-explainer">
                      {t("adminUx.moneySplitExplainer", {
                        returning: config.albertoCommissionPercent,
                        newPct: config.newCustomerCommissionPercent,
                        share: config.newCustomerAlbertoSharePercent,
                        defaultValue:
                          "You get {{returning}}% of returning-customer money. New customers pay {{newPct}}% commission and your share of that is {{share}}%.",
                      })}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Daily collected chart with plain-language takeaway */}
            <Card data-testid="card-daily-collected">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("adminUx.moneyDailyChart", { defaultValue: "Collected Per Day (Last 30 Days)" })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {insights.loading ? (
                  <Skeleton className="h-[200px]" />
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} width={48} />
                      <Tooltip formatter={(v: number) => [formatMoney(v), t("adminUx.moneyCollectedLabel", { defaultValue: "Collected" })]} />
                      <Bar dataKey="amount" fill={VIZ_GREEN} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
                {monthInsight && <InsightLine testId="insight-money-month">{monthInsight}</InsightLine>}
                {!insights.loading && bestDay.amount > 0 && (
                  <InsightLine testId="insight-best-day">
                    {t("adminUx.insightBestDay", {
                      date: bestDay.date,
                      amount: formatMoney(bestDay.amount),
                      defaultValue: "Best day in the last 30 days was {{date}} with {{amount}}.",
                    })}
                  </InsightLine>
                )}
              </CardContent>
            </Card>

            {/* Where the money comes from — tabs keep it on one screen */}
            <Card data-testid="card-money-breakdown">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("adminUx.moneyBreakdownTitle", { defaultValue: "Where This Month's Money Comes From" })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="location">
                  <TabsList className="mb-3">
                    <TabsTrigger value="location" data-testid="tab-breakdown-location">
                      {t("adminUx.tabByLocation", { defaultValue: "By location" })}
                    </TabsTrigger>
                    <TabsTrigger value="type" data-testid="tab-breakdown-type">
                      {t("adminUx.tabByType", { defaultValue: "By training type" })}
                    </TabsTrigger>
                    <TabsTrigger value="channel" data-testid="tab-breakdown-channel">
                      {t("adminUx.tabByChannel", { defaultValue: "Onsite vs online" })}
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="location" className="space-y-3">
                    {byLocation.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {t("adminUx.breakdownEmpty", { defaultValue: "No booked sessions this month yet." })}
                      </p>
                    ) : (
                      <>
                        <BreakdownBars rows={byLocation} formatValue={formatMoney} testIdPrefix="bar-location" />
                        <InsightLine testId="insight-location">
                          {t("adminUx.insightTopLocation", {
                            location: byLocation[0].label,
                            defaultValue: "{{location}} brings in the most booked money this month.",
                          })}
                        </InsightLine>
                      </>
                    )}
                  </TabsContent>
                  <TabsContent value="type" className="space-y-3">
                    {byType.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {t("adminUx.breakdownEmpty", { defaultValue: "No booked sessions this month yet." })}
                      </p>
                    ) : (
                      <>
                        <BreakdownBars rows={byType} formatValue={formatMoney} testIdPrefix="bar-type" />
                        <InsightLine testId="insight-type">
                          {t("adminUx.insightTopType", {
                            type: byType[0].label,
                            defaultValue: "{{type}} is the best seller this month.",
                          })}
                        </InsightLine>
                      </>
                    )}
                  </TabsContent>
                  <TabsContent value="channel" className="space-y-3">
                    {onsiteSales + onlineSales === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {t("adminUx.breakdownEmpty", { defaultValue: "No booked sessions this month yet." })}
                      </p>
                    ) : (
                      <>
                        <BreakdownBars rows={byChannel} formatValue={formatMoney} testIdPrefix="bar-channel" />
                        <InsightLine testId="insight-channel">
                          {onsiteSales >= onlineSales
                            ? t("adminUx.insightChannelOnsite", {
                                defaultValue: "Most paid orders this month are in-person training.",
                              })
                            : t("adminUx.insightChannelOnline", {
                                defaultValue: "Most paid orders this month are online courses.",
                              })}
                        </InsightLine>
                      </>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </>
        )}

        <MonthlyStatement />

        {isSuperAdmin && <SplitConfigEditor />}
      </div>
    </AdminLayout>
  );
}
