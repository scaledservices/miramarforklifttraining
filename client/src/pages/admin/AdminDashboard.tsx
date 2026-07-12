import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Settings,
  Pencil,
  Check,
  X,
  Globe,
  Target,
  Award,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import AdminLayout from "./AdminLayout";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { InsightLine, TrendChip, pctChange, VIZ_GREEN } from "@/components/admin/viz";
import { formatMoney } from "@/components/admin/money/types";
import type { OnsiteLead } from "@/components/admin/leads/lead-types";

interface DashboardMetrics {
  metrics: {
    totalUsers: number;
    totalOrders: number;
    totalRevenue: number;
  };
}

interface ProfitabilityData {
  currentSplit: { platformPercent: number; partnerPercent: number };
  totals: { revenue: number; platformEarnings: number; partnerEarnings: number };
  mtd: { revenue: number; platformEarnings: number; partnerEarnings: number };
  recentTransactions: Array<{
    id: number;
    date: string;
    orderNumber: string;
    customerName: string;
    amount: number;
    platformEarnings: number;
    partnerEarnings: number;
  }>;
  revenueTrend: Array<{ date: string; revenue: number }>;
}

interface DashOrder {
  id: number;
  orderNumber: string;
  total: string;
  status: string;
  createdAt: string;
  userName: string;
}

interface DashCert {
  id: number;
  certificateNumber: string;
  userName: string;
  courseName: string;
  issuedAt: string | null;
}

interface SeoHealthLite {
  total: number;
  published: number;
  missingTitle: number;
  missingMeta: number;
  missingH1: number;
  duplicateCanonicals: number;
  duplicateMetas: number;
  thinContent: number;
  duplicateTitles: Array<{ title: string; slugs: string[] }>;
  templateCounts: Record<string, number>;
}

const WON_STATUSES = ["quote_accepted", "scheduled", "confirmed", "completed", "invoiced"];
const LOST_STATUSES = ["quote_declined", "unresponsive", "cancelled"];

const SOURCE_LABELS: Record<string, string> = {
  organic: "Organic search",
  paid: "Ads",
  direct: "Direct",
  referral: "Referral",
  rep_sourced: "Rep sourced",
  unknown: "Unknown",
};

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin" || user?.role === "admin";

  const { data, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/admin/dashboard"],
  });

  const { data: profitData, isLoading: profitLoading } = useQuery<ProfitabilityData>({
    queryKey: ["/api/admin/profitability"],
    enabled: isSuperAdmin,
  });

  const { data: leadsData } = useQuery<{ leads: OnsiteLead[] }>({
    queryKey: ["/api/admin/leads"],
    enabled: isSuperAdmin,
  });
  const { data: seo } = useQuery<SeoHealthLite>({
    queryKey: ["/api/admin/seo-health"],
    enabled: isSuperAdmin,
  });
  const { data: ordersData } = useQuery<{ orders: DashOrder[] }>({
    queryKey: ["/api/admin/orders"],
    enabled: isSuperAdmin,
  });
  const { data: certsData } = useQuery<{ certifications: DashCert[] }>({
    queryKey: ["/api/admin/certifications"],
    enabled: isSuperAdmin,
  });

  const metrics = data?.metrics;

  // Revenue takeaway: last 7 days of the trend vs the 7 before them.
  const trend = profitData?.revenueTrend ?? [];
  const last7 = trend.slice(-7).reduce((s, d) => s + d.revenue, 0);
  const prior7 = trend.slice(-14, -7).reduce((s, d) => s + d.revenue, 0);
  const revenuePct = pctChange(last7, prior7);

  // Pipeline summary from the raw lead list.
  const leads = leadsData?.leads ?? [];
  const stageCounts = {
    new: leads.filter((l) => l.status === "new_lead").length,
    contacted: leads.filter((l) => l.status === "contacted").length,
    quoted: leads.filter((l) => l.status === "quoted").length,
    won: leads.filter((l) => WON_STATUSES.includes(l.status)).length,
    lost: leads.filter((l) => LOST_STATUSES.includes(l.status)).length,
  };
  const decidedLeads = stageCounts.won + stageCounts.lost;
  const conversionRate = decidedLeads > 0 ? Math.round((stageCounts.won / decidedLeads) * 100) : null;

  // Leads by source, with per-source win rate.
  const bySource = Object.entries(
    leads.reduce<Record<string, { total: number; won: number }>>((acc, l) => {
      const key = l.leadSource || "unknown";
      acc[key] = acc[key] || { total: 0, won: 0 };
      acc[key].total += 1;
      if (WON_STATUSES.includes(l.status)) acc[key].won += 1;
      return acc;
    }, {})
  ).sort(([, a], [, z]) => z.total - a.total);

  // Recent activity: newest orders, leads, and certificates in one feed.
  const activity: { key: string; icon: typeof ShoppingCart; text: string; when: string }[] = [
    ...(ordersData?.orders ?? [])
      .filter((o) => o.status === "paid")
      .slice(0, 15)
      .map((o) => ({
        key: `order-${o.id}`,
        icon: ShoppingCart,
        text: `${t("adminUx.activityOrder", { defaultValue: "Payment" })} · ${o.userName} · ${formatMoney(Number(o.total))}`,
        when: o.createdAt,
      })),
    ...leads.slice(0, 15).map((l) => ({
      key: `lead-${l.id}`,
      icon: Target,
      text: `${t("adminUx.activityLead", { defaultValue: "New lead" })} · ${l.contactName}${l.companyName ? ` (${l.companyName})` : ""}`,
      when: l.createdAt,
    })),
    ...(certsData?.certifications ?? [])
      .filter((c) => c.issuedAt)
      .slice(0, 15)
      .map((c) => ({
        key: `cert-${c.id}`,
        icon: Award,
        text: `${t("adminUx.activityCert", { defaultValue: "Certificate issued" })} · ${c.userName} · ${c.courseName}`,
        when: c.issuedAt!,
      })),
  ]
    .sort((a, z) => new Date(z.when).getTime() - new Date(a.when).getTime())
    .slice(0, 10);

  const seoIssues = seo
    ? seo.missingTitle + seo.missingMeta + seo.missingH1 + seo.duplicateCanonicals + seo.duplicateMetas + seo.thinContent + (seo.duplicateTitles?.length || 0)
    : 0;
  const cityPages = seo?.templateCounts
    ? Object.entries(seo.templateCounts)
        .filter(([key]) => key.toLowerCase().includes("city"))
        .reduce((s, [, n]) => s + n, 0)
    : 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold" data-testid="text-admin-dashboard-title">
          Dashboard
        </h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/admin/users" className="block" data-testid="link-dashboard-users">
            <MetricCard
              title={t("adminUx.dashboardTotalUsers", { defaultValue: "Total Users" })}
              value={metrics?.totalUsers}
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
              isLoading={isLoading}
              testId="card-metric-users"
            />
          </Link>
          <Link href="/admin/orders" className="block" data-testid="link-dashboard-orders">
            <MetricCard
              title={t("adminUx.dashboardTotalOrders", { defaultValue: "Total Orders" })}
              value={metrics?.totalOrders}
              icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
              isLoading={isLoading}
              testId="card-metric-orders"
            />
          </Link>
          <Link href="/admin/money" className="block" data-testid="link-dashboard-revenue">
            <MetricCard
              title={t("adminUx.dashboardTotalRevenue", { defaultValue: "Total Revenue" })}
              value={metrics?.totalRevenue != null ? `$${metrics.totalRevenue.toFixed(2)}` : undefined}
              icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
              isLoading={isLoading}
              testId="card-metric-revenue"
            />
          </Link>
          <MetricCard
            title={t("adminUx.dashboardGrowthRate", { defaultValue: "Growth (7d)" })}
            value={revenuePct !== null ? `${revenuePct > 0 ? "+" : ""}${revenuePct.toFixed(1)}%` : "—"}
            icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
            isLoading={profitLoading}
            testId="card-metric-growth"
          />
        </div>

        {isSuperAdmin && (
          <>
            <Separator />
            <h2 className="text-xl font-bold" data-testid="text-profitability-title">
              Profitability
            </h2>

            {profitLoading ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
            ) : profitData ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <MetricCard
                    title="Platform Earnings"
                    value={`$${profitData.totals.platformEarnings.toFixed(2)}`}
                    icon={<DollarSign className="h-4 w-4 text-green-600" />}
                    isLoading={false}
                    testId="card-metric-platform-earnings"
                  />
                  <MetricCard
                    title="Partner Payouts"
                    value={`$${profitData.totals.partnerEarnings.toFixed(2)}`}
                    icon={<DollarSign className="h-4 w-4 text-blue-600" />}
                    isLoading={false}
                    testId="card-metric-partner-payouts"
                  />
                  <MetricCard
                    title="MTD Revenue"
                    value={`$${profitData.mtd.revenue.toFixed(2)}`}
                    icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
                    isLoading={false}
                    testId="card-metric-mtd-revenue"
                  />
                  <MetricCard
                    title="MTD Platform"
                    value={`$${profitData.mtd.platformEarnings.toFixed(2)}`}
                    icon={<TrendingUp className="h-4 w-4 text-green-600" />}
                    isLoading={false}
                    testId="card-metric-mtd-platform"
                  />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <ProfitSplitCard currentSplit={profitData.currentSplit} />
                  <RevenueChart
                    data={profitData.revenueTrend}
                    insight={
                      revenuePct !== null ? (
                        <InsightLine testId="insight-revenue-week">
                          {Math.abs(revenuePct) < 1
                            ? t("adminUx.insightRevenueFlat", {
                                defaultValue: "Revenue this week is about the same as the week before.",
                              })
                            : revenuePct > 0
                              ? t("adminUx.insightRevenueUp", {
                                  pct: Math.round(revenuePct),
                                  amount: formatMoney(last7),
                                  defaultValue: "Last 7 days brought in {{amount}} — up {{pct}}% from the week before.",
                                })
                              : t("adminUx.insightRevenueDown", {
                                  pct: Math.abs(Math.round(revenuePct)),
                                  amount: formatMoney(last7),
                                  defaultValue: "Last 7 days brought in {{amount}} — down {{pct}}% from the week before.",
                                })}
                        </InsightLine>
                      ) : null
                    }
                    trendChip={
                      revenuePct !== null ? (
                        <TrendChip
                          current={last7}
                          previous={prior7}
                          compareLabel={t("adminUx.vsPriorWeek", { defaultValue: "vs prior 7 days" })}
                          testId="chip-revenue-trend"
                        />
                      ) : null
                    }
                  />
                </div>

                <TransactionTable transactions={profitData.recentTransactions} />
              </>
            ) : null}

            <Separator />
            <h2 className="text-xl font-bold" data-testid="text-business-pulse-title">
              {t("adminUx.businessPulseTitle", { defaultValue: "Business Pulse" })}
            </h2>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Lead pipeline summary */}
              <Card data-testid="card-pipeline-summary">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t("adminUx.pipelineSummaryTitle", { defaultValue: "Lead Pipeline" })}
                  </CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-1.5 text-sm" data-testid="row-pipeline-stages">
                    {(
                      [
                        ["new", t("adminUx.stageNew", { defaultValue: "New" }), stageCounts.new],
                        ["contacted", t("adminUx.stageContacted", { defaultValue: "Contacted" }), stageCounts.contacted],
                        ["quoted", t("adminUx.stageQuoted", { defaultValue: "Quoted" }), stageCounts.quoted],
                        ["won", t("adminUx.stageWon", { defaultValue: "Won" }), stageCounts.won],
                      ] as const
                    ).map(([key, label, count], i) => (
                      <span key={key} className="inline-flex items-center gap-1.5">
                        {i > 0 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60" aria-hidden="true" />}
                        <Badge variant="secondary" className="gap-1" data-testid={`chip-stage-${key}`}>
                          {label} <span className="font-bold tabular-nums">{count}</span>
                        </Badge>
                      </span>
                    ))}
                    <Badge variant="outline" className="gap-1 text-muted-foreground" data-testid="chip-stage-lost">
                      {t("adminUx.stageLost", { defaultValue: "Lost" })}{" "}
                      <span className="font-bold tabular-nums">{stageCounts.lost}</span>
                    </Badge>
                  </div>
                  {conversionRate !== null && (
                    <InsightLine testId="insight-conversion">
                      {t("adminUx.insightConversion", {
                        pct: conversionRate,
                        defaultValue: "{{pct}}% of decided leads become customers.",
                      })}
                    </InsightLine>
                  )}
                  <Button asChild variant="ghost" size="sm" className="-ml-2">
                    <Link href="/admin/leads" data-testid="link-pipeline-full">
                      {t("adminUx.pipelineSeeAll", { defaultValue: "Open full pipeline" })}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* SEO health summary */}
              <Card data-testid="card-seo-summary">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t("adminUx.seoSummaryTitle", { defaultValue: "SEO Health" })}
                  </CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="space-y-3">
                  {seo ? (
                    <>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <p className="text-2xl font-bold tabular-nums" data-testid="text-seo-published">{seo.published}</p>
                          <p className="text-[11px] text-muted-foreground leading-tight">
                            {t("adminUx.seoPublished", { defaultValue: "Pages live" })}
                          </p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold tabular-nums" data-testid="text-seo-city-pages">{cityPages}</p>
                          <p className="text-[11px] text-muted-foreground leading-tight">
                            {t("adminUx.seoCityPages", { defaultValue: "City pages" })}
                          </p>
                        </div>
                        <div>
                          <p
                            className={`text-2xl font-bold tabular-nums ${seoIssues > 0 ? "text-brand-orange" : "text-brand-green"}`}
                            data-testid="text-seo-issues"
                          >
                            {seoIssues}
                          </p>
                          <p className="text-[11px] text-muted-foreground leading-tight">
                            {t("adminUx.seoIssues", { defaultValue: "Issues found" })}
                          </p>
                        </div>
                      </div>
                      <InsightLine testId="insight-seo">
                        {seoIssues === 0
                          ? t("adminUx.insightSeoClean", {
                              count: seo.published,
                              defaultValue: "All {{count}} live pages pass the content checks.",
                            })
                          : t("adminUx.insightSeoIssues", {
                              count: seoIssues,
                              defaultValue: "{{count}} pages need attention — titles, descriptions, or thin content.",
                            })}
                      </InsightLine>
                      <Button asChild variant="ghost" size="sm" className="-ml-2">
                        <Link href="/admin/seo-health" data-testid="link-seo-full">
                          {t("adminUx.seoSeeAll", { defaultValue: "Open SEO dashboard" })}
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <Skeleton className="h-24" />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* New vs Existing customer split */}
            <Card data-testid="card-customer-split" className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("adminUx.customerSplitTitle", { defaultValue: "New vs Existing Customers" })}
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {(() => {
                  const paidOrders = (ordersData?.orders ?? []).filter((o) => o.status === "paid");
                  if (paidOrders.length === 0) {
                    return (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        {t("adminUx.customerSplitEmpty", { defaultValue: "No paid orders yet." })}
                      </p>
                    );
                  }
                  // Group by user, first order = new, rest = existing
                  const byUser = new Map<string, DashOrder[]>();
                  for (const o of paidOrders) {
                    const key = String(o.userName);
                    if (!byUser.has(key)) byUser.set(key, []);
                    byUser.get(key)!.push(o);
                  }
                  let newCustomers = 0;
                  let existingCustomers = 0;
                  for (const [, userOrders] of Array.from(byUser.entries())) {
                    const sorted = userOrders.sort((a: DashOrder, b: DashOrder) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                    // First order is "new", rest are "existing"
                    newCustomers++;
                    existingCustomers += sorted.length - 1;
                  }
                  const total = newCustomers + existingCustomers;
                  const newPct = total > 0 ? Math.round((newCustomers / total) * 100) : 0;
                  const existPct = 100 - newPct;
                  return (
                    <div className="space-y-3">
                      {/* Stacked bar */}
                      <div className="flex h-8 rounded-lg overflow-hidden">
                        <div
                          className="flex items-center justify-center text-xs font-bold text-white"
                          style={{ width: `${Math.max(newPct, 5)}%`, backgroundColor: VIZ_GREEN }}
                          data-testid="bar-new-customers"
                        >
                          {newPct}%
                        </div>
                        <div
                          className="flex items-center justify-center text-xs font-bold text-white"
                          style={{ width: `${Math.max(existPct, 5)}%`, backgroundColor: "#3b82f6" }}
                          data-testid="bar-existing-customers"
                        >
                          {existPct}%
                        </div>
                      </div>
                      {/* Legend + numbers */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: VIZ_GREEN }} />
                          <div>
                            <p className="text-sm font-bold">{newCustomers}</p>
                            <p className="text-xs text-muted-foreground">
                              {t("adminUx.customerSplitNew", { defaultValue: "New customers" })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-blue-500" />
                          <div>
                            <p className="text-sm font-bold">{existingCustomers}</p>
                            <p className="text-xs text-muted-foreground">
                              {t("adminUx.customerSplitExisting", { defaultValue: "Returning customers" })}
                            </p>
                          </div>
                        </div>
                      </div>
                      <InsightLine testId="insight-customer-split">
                        {newPct >= 50
                          ? t("adminUx.insightNewHeavy", { pct: newPct, defaultValue: "{{pct}}% of orders are from new customers — growth is strong." })
                          : t("adminUx.insightReturningHeavy", { pct: existPct, defaultValue: "{{pct}}% of orders are from returning customers — loyalty is strong." })}
                      </InsightLine>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Leads by source */}
              <Card data-testid="card-lead-sources">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t("adminUx.leadSourcesTitle", { defaultValue: "Leads by Source" })}
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {bySource.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      {t("adminUx.leadSourcesEmpty", { defaultValue: "No leads yet." })}
                    </p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-1.5 font-medium text-muted-foreground">
                            {t("adminUx.colSource", { defaultValue: "Source" })}
                          </th>
                          <th className="text-right py-1.5 font-medium text-muted-foreground">
                            {t("adminUx.colLeads", { defaultValue: "Leads" })}
                          </th>
                          <th className="text-right py-1.5 font-medium text-muted-foreground">
                            {t("adminUx.colWon", { defaultValue: "Won" })}
                          </th>
                          <th className="text-right py-1.5 font-medium text-muted-foreground">
                            {t("adminUx.colWinRate", { defaultValue: "Win rate" })}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {bySource.map(([source, s]) => (
                          <tr key={source} className="border-b last:border-0" data-testid={`row-source-${source}`}>
                            <td className="py-1.5">{SOURCE_LABELS[source] ?? source}</td>
                            <td className="py-1.5 text-right tabular-nums">{s.total}</td>
                            <td className="py-1.5 text-right tabular-nums">{s.won}</td>
                            <td className="py-1.5 text-right tabular-nums">
                              {s.total > 0 ? `${Math.round((s.won / s.total) * 100)}%` : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>

              {/* Recent activity */}
              <Card data-testid="card-activity-feed">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t("adminUx.activityTitle", { defaultValue: "Recent Activity" })}
                  </CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {activity.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      {t("adminUx.activityEmpty", { defaultValue: "Nothing yet — new bookings, leads, and certificates show up here." })}
                    </p>
                  ) : (
                    <ul className="divide-y">
                      {activity.map((item) => (
                        <li key={item.key} className="flex items-center gap-2 py-2" data-testid={`activity-${item.key}`}>
                          <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                          <span className="flex-1 min-w-0 truncate text-sm" title={item.text}>{item.text}</span>
                          <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(item.when).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function ProfitSplitCard({ currentSplit }: { currentSplit: { platformPercent: number; partnerPercent: number } }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [platformPct, setPlatformPct] = useState(String(currentSplit.platformPercent));

  const updateSplit = useMutation({
    mutationFn: async (newPlatformPct: number) => {
      await apiRequest("PUT", "/api/admin/settings", {
        key: "profit_split",
        value: { platformPercent: newPlatformPct, partnerPercent: 100 - newPlatformPct },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/profitability"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      setEditing(false);
      toast({ title: "Profit split updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update", description: err.message, variant: "destructive" });
    },
  });

  function handleSave() {
    const val = Number(platformPct);
    if (isNaN(val) || val < 0 || val > 100) {
      toast({ title: "Invalid percentage", description: "Must be 0-100", variant: "destructive" });
      return;
    }
    updateSplit.mutate(val);
  }

  return (
    <Card data-testid="card-profit-split">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Profit Split Configuration</CardTitle>
        <Settings className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        {editing ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm w-20">Platform:</span>
              <Input
                type="number"
                min="0"
                max="100"
                value={platformPct}
                onChange={(e) => setPlatformPct(e.target.value)}
                className="w-20"
                data-testid="input-platform-percent"
              />
              <span className="text-sm">%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm w-20">Partner:</span>
              <span className="text-sm font-medium">{100 - (Number(platformPct) || 0)}%</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={updateSplit.isPending} data-testid="button-save-split">
                <Check className="h-3 w-3 mr-1" />Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setEditing(false); setPlatformPct(String(currentSplit.platformPercent)); }} data-testid="button-cancel-split">
                <X className="h-3 w-3 mr-1" />Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Platform</span>
              <span className="text-2xl font-bold" data-testid="text-platform-percent">{currentSplit.platformPercent}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Partner</span>
              <span className="text-2xl font-bold" data-testid="text-partner-percent">{currentSplit.partnerPercent}%</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)} data-testid="button-edit-split">
              <Pencil className="h-3 w-3 mr-1" />Edit Split
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RevenueChart({
  data,
  insight,
  trendChip,
}: {
  data: Array<{ date: string; revenue: number }>;
  insight?: React.ReactNode;
  trendChip?: React.ReactNode;
}) {
  return (
    <Card data-testid="card-revenue-chart">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Revenue Trend (Last 30 Days)</CardTitle>
        {trendChip}
      </CardHeader>
      <CardContent className="space-y-3">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
            No revenue data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, "Revenue"]} labelFormatter={(l) => `Date: ${l}`} />
              <Bar dataKey="revenue" fill="#019E7C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
        {insight}
      </CardContent>
    </Card>
  );
}

function TransactionTable({ transactions }: { transactions: ProfitabilityData["recentTransactions"] }) {
  return (
    <Card data-testid="card-transaction-earnings">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Recent Transaction Earnings</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No transactions yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Order</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Customer</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Gross</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Platform</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Partner</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr key={txn.id} className="border-b last:border-0" data-testid={`row-transaction-${txn.id}`}>
                    <td className="py-2">{new Date(txn.date).toLocaleDateString()}</td>
                    <td className="py-2 font-mono text-xs">{txn.orderNumber}</td>
                    <td className="py-2">{txn.customerName}</td>
                    <td className="py-2 text-right font-medium">${txn.amount.toFixed(2)}</td>
                    <td className="py-2 text-right text-green-600">${txn.platformEarnings.toFixed(2)}</td>
                    <td className="py-2 text-right text-blue-600">${txn.partnerEarnings.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricCard({
  title,
  value,
  icon,
  isLoading,
  testId,
}: {
  title: string;
  value?: string | number;
  icon: React.ReactNode;
  isLoading: boolean;
  testId: string;
}) {
  return (
    <Card data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold" data-testid={`${testId}-value`}>
            {value ?? 0}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
