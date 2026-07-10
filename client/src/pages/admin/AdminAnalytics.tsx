import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp, TrendingDown, Users, Eye, MousePointerClick,
  DollarSign, MapPin, Globe, Smartphone, Monitor,
} from "lucide-react";

interface OverviewData {
  days: number;
  totalViews: number;
  uniqueSessions: number;
  conversionRate: number;
  totalRevenue: number;
  byDay: { day: string; views: number; sessions: number }[];
  topPages: { path: string; views: number; unique_visitors: number }[];
  sources: { source: string; views: number; sessions: number }[];
  events: { event_type: string; count: number }[];
  cityPages: { path: string; views: number; visitors: number }[];
}

interface FunnelData {
  days: number;
  funnel: {
    source: string;
    visitors: number;
    clicked_cta: number;
    started_conversion: number;
    converted: number;
    revenue: number;
  }[];
}

const SOURCE_LABELS: Record<string, string> = {
  google: "Google",
  bing: "Bing",
  yahoo: "Yahoo",
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  reddit: "Reddit",
  twitter: "Twitter/X",
  tiktok: "TikTok",
  youtube: "YouTube",
  yelp: "Yelp",
  direct: "Direct",
  internal: "Internal",
  other: "Other",
};

const EVENT_LABELS: Record<string, string> = {
  cta_click: "CTA Clicks",
  quote_submit: "Quote Submissions",
  booking_started: "Bookings Started",
  booking_completed: "Bookings Completed",
  checkout_start: "Checkout Started",
  purchase: "Purchases",
  lead_submit: "Leads Submitted",
};

function Sparkline({ data, className = "" }: { data: number[]; className?: string }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w = 100;
  const h = 28;
  const step = data.length > 1 ? w / (data.length - 1) : w;
  const points = data.map((v, i) => `${i * step},${h - (v / max) * h}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function MetricCard({
  label, value, icon: Icon, trend, sparkline, color = "text-foreground",
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  trend?: number;
  sparkline?: number[];
  color?: string;
}) {
  return (
    <Card data-testid="card-metric">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground font-medium">{label}</span>
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className={`text-2xl font-bold tabular-nums ${color}`}>{value}</div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-1 text-xs">
            {trend >= 0 ? (
              <TrendingUp className="w-3 h-3 text-brand-green" />
            ) : (
              <TrendingDown className="w-3 h-3 text-destructive" />
            )}
            <span className={trend >= 0 ? "text-brand-green" : "text-destructive"}>
              {Math.abs(trend).toFixed(1)}%
            </span>
            <span className="text-muted-foreground">vs prev</span>
          </div>
        )}
        {sparkline && sparkline.length > 1 && (
          <Sparkline data={sparkline} className="w-full h-7 mt-2 text-brand-green opacity-70" />
        )}
      </CardContent>
    </Card>
  );
}

function BarChart({ data, label }: { data: { label: string; value: number }[]; label: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="space-y-1.5">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-2 text-xs">
          <span className="w-24 text-muted-foreground truncate text-right">{d.label}</span>
          <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden">
            <div
              className="h-full bg-brand-green/80 rounded-full transition-all"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
          <span className="w-12 text-right tabular-nums font-medium">{d.value.toLocaleString()}</span>
        </div>
      ))}
      {!data.length && <p className="text-xs text-muted-foreground py-2">No {label} yet</p>}
    </div>
  );
}

export default function AdminAnalytics() {
  const { t } = useTranslation();
  const [days, setDays] = useState(30);

  const { data: overview, isLoading } = useQuery<OverviewData>({
    queryKey: ["/api/admin/analytics/overview", days],
    queryFn: async () => {
      const res = await fetch(`/api/admin/analytics/overview?days=${days}`);
      if (!res.ok) throw new Error("Failed to load analytics");
      return res.json();
    },
  });

  const { data: funnel } = useQuery<FunnelData>({
    queryKey: ["/api/admin/analytics/funnel", days],
    queryFn: async () => {
      const res = await fetch(`/api/admin/analytics/funnel?days=${days}`);
      if (!res.ok) throw new Error("Failed to load funnel");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const sparklineData = overview?.byDay?.map((d: any) => d.views) || [];

  return (
    <div className="space-y-6" data-testid="admin-analytics">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Traffic & Analytics</h1>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                days === d ? "bg-accent text-accent-foreground" : "bg-muted hover:bg-muted/80"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Page Views"
          value={(overview?.totalViews || 0).toLocaleString()}
          icon={Eye}
          sparkline={sparklineData}
        />
        <MetricCard
          label="Unique Visitors"
          value={(overview?.uniqueSessions || 0).toLocaleString()}
          icon={Users}
        />
        <MetricCard
          label="Conversion Rate"
          value={`${overview?.conversionRate || 0}%`}
          icon={MousePointerClick}
          color="text-brand-green"
        />
        <MetricCard
          label="Revenue Tracked"
          value={`$${Number(overview?.totalRevenue || 0).toLocaleString()}`}
          icon={DollarSign}
          color="text-brand-orange"
        />
      </div>

      <Tabs defaultValue="traffic" className="w-full">
        <TabsList>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="pages">Top Pages</TabsTrigger>
          <TabsTrigger value="cities">City Pages</TabsTrigger>
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        {/* Traffic by day + sources */}
        <TabsContent value="traffic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Traffic Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overview?.byDay && overview.byDay.length > 0 ? (
                <div className="flex items-end gap-1 h-40">
                  {overview.byDay.map((d: any) => {
                    const maxViews = Math.max(...overview.byDay.map((dd: any) => dd.views), 1);
                    const h = (d.views / maxViews) * 100;
                    return (
                      <div
                        key={d.day}
                        className="flex-1 bg-brand-green/60 hover:bg-brand-green rounded-t-sm transition-colors min-w-[2px]"
                        style={{ height: `${h}%` }}
                        title={`${d.day?.substring(0, 10)}: ${d.views} views`}
                      />
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No traffic data yet. Data appears as visitors browse the site.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" /> Traffic Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                data={(overview?.sources || []).map((s: any) => ({
                  label: SOURCE_LABELS[s.source] || s.source,
                  value: s.views,
                }))}
                label="traffic sources"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top pages */}
        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Pages by Views</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b">
                  <div className="col-span-6">Page</div>
                  <div className="col-span-3 text-right">Views</div>
                  <div className="col-span-3 text-right">Unique</div>
                </div>
                {(overview?.topPages || []).map((p: any) => (
                  <div key={p.path} className="grid grid-cols-12 gap-2 text-sm py-1.5 hover:bg-muted/50 rounded">
                    <div className="col-span-6 truncate text-foreground">{p.path}</div>
                    <div className="col-span-3 text-right tabular-nums">{p.views}</div>
                    <div className="col-span-3 text-right tabular-nums text-muted-foreground">{p.unique_visitors}</div>
                  </div>
                ))}
                {!overview?.topPages?.length && (
                  <p className="text-sm text-muted-foreground py-4">No page data yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* City pages */}
        <TabsContent value="cities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" /> City Page Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b">
                  <div className="col-span-6">City Page</div>
                  <div className="col-span-3 text-right">Views</div>
                  <div className="col-span-3 text-right">Visitors</div>
                </div>
                {(overview?.cityPages || []).map((c: any) => {
                  const cityName = c.path.replace("/service-areas/", "");
                  return (
                    <div key={c.path} className="grid grid-cols-12 gap-2 text-sm py-1.5 hover:bg-muted/50 rounded">
                      <div className="col-span-6 truncate capitalize text-foreground">{cityName}</div>
                      <div className="col-span-3 text-right tabular-nums">{c.views}</div>
                      <div className="col-span-3 text-right tabular-nums text-muted-foreground">{c.visitors}</div>
                    </div>
                  );
                })}
                {!overview?.cityPages?.length && (
                  <p className="text-sm text-muted-foreground py-4">No city page traffic yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversion funnel */}
        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel by Source</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-6 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b">
                  <div>Source</div>
                  <div className="text-right">Visitors</div>
                  <div className="text-right">Clicked CTA</div>
                  <div className="text-right">Started</div>
                  <div className="text-right">Converted</div>
                  <div className="text-right">Revenue</div>
                </div>
                {(funnel?.funnel || []).map((f: any) => (
                  <div key={f.source} className="grid grid-cols-6 gap-2 text-sm py-1.5 hover:bg-muted/50 rounded">
                    <div className="font-medium">{SOURCE_LABELS[f.source] || f.source}</div>
                    <div className="text-right tabular-nums">{f.visitors}</div>
                    <div className="text-right tabular-nums text-muted-foreground">{f.clicked_cta}</div>
                    <div className="text-right tabular-nums text-muted-foreground">{f.started_conversion}</div>
                    <div className="text-right tabular-nums text-brand-green font-medium">{f.converted}</div>
                    <div className="text-right tabular-nums text-brand-orange">${Number(f.revenue).toLocaleString()}</div>
                  </div>
                ))}
                {!funnel?.funnel?.length && (
                  <p className="text-sm text-muted-foreground py-4">No funnel data yet. Data appears as visitors interact with the site.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(overview?.events || []).map((e: any) => (
                  <div key={e.event_type} className="bg-muted/50 rounded-lg p-3 text-center">
                    <div className="text-xs text-muted-foreground mb-1">
                      {EVENT_LABELS[e.event_type] || e.event_type}
                    </div>
                    <div className="text-xl font-bold tabular-nums">{e.count}</div>
                  </div>
                ))}
                {!overview?.events?.length && (
                  <p className="text-sm text-muted-foreground py-4">No events recorded yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
