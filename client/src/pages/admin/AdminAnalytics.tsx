import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { useTranslation } from "react-i18next";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Users, UserPlus, Repeat, Eye, FileText, CalendarCheck, ShoppingCart, MapPin, Globe,
  Smartphone, Monitor, Tablet, X, ArrowRight, LogIn, Megaphone, Info,
} from "lucide-react";
import { TrendChip, InsightLine, VIZ_GREEN } from "@/components/admin/viz";
import { TRAFFIC_CITIES } from "@shared/traffic";

// ─── Types ────────────────────────────────────────────────────────

interface Kpis {
  visitors: number; new_visitors: number; returning_visitors: number; sessions: number; views: number;
  single_page_sessions: number; avg_seconds: number; quotes: number; bookings_started: number;
  bookings: number; purchases: number; revenue: number;
}
interface Summary {
  range: { from: string; to: string };
  previousRange: { from: string; to: string };
  current: Kpis;
  previous: Kpis;
  byDay: { day: string; visitors: number; views: number; new_visitors: number }[];
  cities: { city: string; visitors: number; sessions: number; quotes: number; bookings_started: number; bookings: number; purchases: number }[];
  sources: { source: string; visitors: number; sessions: number; conversions: number }[];
  topPages: { path: string; views: number; visitors: number }[];
  landingPages: { path: string; sessions: number; visitors: number; left_after_one: number }[];
  regions: { region: string; country: string; visitors: number }[];
  geoCities: { city: string; region: string; visitors: number }[];
  devices: { device: string; visitors: number }[];
  campaigns: { campaign: string; utm_source: string; utm_medium: string; visitors: number }[];
  events: { event_type: string; count: number; sessions: number }[];
}
interface VisitRow {
  session_id: string; visitor: string; started: string; ended: string; views: number; landing: string;
  source: string; referrer: string | null; is_new: boolean; country: string | null; region: string | null;
  geo_city: string | null; device: string; utm_source: string | null; utm_campaign: string | null;
  cities: string[]; quoted: boolean; booked: boolean; purchased: boolean;
}
interface Journey {
  views: { id: number; path: string; created_at: string; referrer: string | null; referrer_source: string; locale: string;
    country: string | null; region: string | null; city: string | null; device: string | null; user_agent: string | null;
    utm_source: string | null; utm_medium: string | null; utm_campaign: string | null }[];
  events: { event_type: string; path: string; created_at: string; revenue: string | null }[];
  otherVisits: { session_id: string; started: string; views: number; landing: string }[];
}

const FILTER_KEYS = ["city", "source", "page", "landing", "region", "geoCity", "device", "visitorType", "campaign"] as const;
type FilterKey = (typeof FILTER_KEYS)[number];

const CITY_LABEL: Record<string, string> = Object.fromEntries([
  ...TRAFFIC_CITIES.map((c) => [c.slug, c.label] as const),
  ["other", "Other pages"] as const,
]);

// ─── Small helpers ────────────────────────────────────────────────

const fmt = (n: number | undefined | null) => new Intl.NumberFormat("en-US").format(n ?? 0);
const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);
const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : "0%");
const ptTime = (iso: string) =>
  new Date(iso.endsWith("Z") ? iso : `${iso}Z`).toLocaleString("en-US", {
    timeZone: "America/Los_Angeles", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
const shortDay = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const duration = (a: string, b: string) => {
  const s = Math.max(0, Math.round((Date.parse(b) - Date.parse(a)) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m ${s % 60}s` : `${Math.floor(m / 60)}h ${m % 60}m`;
};
const place = (city?: string | null, region?: string | null, country?: string | null) =>
  [city, region, country && country !== "US" ? country : null].filter(Boolean).join(", ") || "Unknown";

function useLabels() {
  const { t } = useTranslation();
  const L = (key: string, en: string, opts?: Record<string, unknown>) => t(`traffic.${key}`, { defaultValue: en, ...opts });
  const source = (s: string | null | undefined) => {
    const map: Record<string, string> = {
      direct: L("srcDirect", "Direct (typed in or bookmark)"),
      google: "Google", bing: "Bing", yahoo: "Yahoo", duckduckgo: "DuckDuckGo",
      ai_assistant: L("srcAi", "AI assistants (ChatGPT, Gemini...)"),
      internal: L("srcInternal", "Within this site"),
      "miramarforklift.com": "miramarforklift.com",
      facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn", reddit: "Reddit",
      twitter: "X / Twitter", tiktok: "TikTok", youtube: "YouTube", yelp: "Yelp",
      other: L("srcOther", "Other websites"),
    };
    return map[s || "direct"] || s || "Unknown";
  };
  const city = (c: string) => (c === "other" ? L("cityOther", "Other pages") : CITY_LABEL[c] || c);
  const device = (d: string) =>
    d === "mobile" ? L("devMobile", "Phone") : d === "tablet" ? L("devTablet", "Tablet") : L("devDesktop", "Computer");
  const event = (e: string) =>
    ({
      quote_started: L("evQuoteStarted", "Started a quote request"),
      quote_submitted: L("evQuoteSubmitted", "Sent a quote request"),
      lead_submit: L("evLeadSubmit", "Lead captured"),
      booking_started: L("evBookingStarted", "Started booking"),
      booking_step_reached: L("evBookingStep", "Booking step"),
      booking_completed: L("evBookingCompleted", "Completed a booking"),
      checkout_contact: L("evCheckout", "Reached checkout"),
      purchase: L("evPurchase", "Purchased"),
      cta_click: L("evCta", "Clicked a button"),
    })[e] || e;
  return { L, source, city, device, event };
}

// ─── Page ─────────────────────────────────────────────────────────

export default function AdminAnalytics() {
  const { L, source, city, device, event } = useLabels();
  const search = useSearch();
  const [, navigate] = useLocation();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const preset = params.get("preset") || (params.get("from") ? "" : "launch");
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const filters = useMemo(() => {
    const f: Partial<Record<FilterKey, string>> = {};
    for (const k of FILTER_KEYS) {
      const v = params.get(k);
      if (v) f[k] = v;
    }
    return f;
  }, [params]);

  const [openSession, setOpenSession] = useState<string | null>(null);
  const [customFrom, setCustomFrom] = useState(from);
  const [customTo, setCustomTo] = useState(to);

  /** Push a new URL so the browser Back button undoes a drill-down. */
  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(search);
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    navigate(`/admin/analytics${qs ? `?${qs}` : ""}`);
  };
  const drill = (k: FilterKey, v: string) => update({ [k]: v });
  const setPreset = (p: string) => update({ preset: p, from: null, to: null });

  const qs = useMemo(() => {
    const q = new URLSearchParams();
    if (preset) q.set("preset", preset);
    if (!preset && from) q.set("from", from);
    if (!preset && to) q.set("to", to);
    for (const [k, v] of Object.entries(filters)) if (v) q.set(k, v);
    return q.toString();
  }, [preset, from, to, filters]);

  const { data, isLoading, isError } = useQuery<Summary>({
    queryKey: [`/api/admin/traffic/summary?${qs}`],
  });
  const { data: visits, isLoading: visitsLoading } = useQuery<{ sessions: VisitRow[] }>({
    queryKey: [`/api/admin/traffic/sessions?${qs}&limit=200`],
  });

  const c = data?.current;
  const p = data?.previous;
  const compare = L("vsPrevious", "vs previous {{n}} days", {
    n: data ? Math.round((Date.parse(data.range.to) - Date.parse(data.range.from)) / 86400000) + 1 : 0,
  });

  const filterLabel = (k: FilterKey, v: string) => {
    switch (k) {
      case "city": return `${L("fOffice", "Office")}: ${city(v)}`;
      case "source": return `${L("fSource", "Came from")}: ${source(v)}`;
      case "page": return `${L("fPage", "Viewed")}: ${v}`;
      case "landing": return `${L("fLanding", "Landed on")}: ${v}`;
      case "region": return `${L("fRegion", "State")}: ${v}`;
      case "geoCity": return `${L("fGeoCity", "City")}: ${v}`;
      case "device": return `${L("fDevice", "Device")}: ${device(v)}`;
      case "visitorType": return v === "new" ? L("fNew", "New visitors") : L("fReturning", "Returning visitors");
      case "campaign": return `${L("fCampaign", "Campaign")}: ${v}`;
    }
  };

  const presets: [string, string][] = [
    ["today", L("pToday", "Today")],
    ["yesterday", L("pYesterday", "Yesterday")],
    ["7d", L("p7", "Last 7 days")],
    ["30d", L("p30", "Last 30 days")],
    ["launch", L("pLaunch", "Since launch")],
  ];

  const cityRows = useMemo(() => {
    const order = [...TRAFFIC_CITIES.map((x) => x.slug), "other"];
    return order.map((slug) => data?.cities.find((r) => r.city === slug) || {
      city: slug, visitors: 0, sessions: 0, quotes: 0, bookings_started: 0, bookings: 0, purchases: 0,
    });
  }, [data]);

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="admin-traffic">
        {/* Header + range */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{L("title", "Website Traffic")}</h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
              <Info className="h-4 w-4 shrink-0" />
              {L("subtitle", "Real visitors since the new site launched on Oct 26. Bots, staff, and admin pages are not counted. Times are Pacific.")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2" data-testid="traffic-range">
            {presets.map(([k, label]) => (
              <Button key={k} size="sm" variant={preset === k ? "default" : "outline"} onClick={() => setPreset(k)} data-testid={`range-${k}`}>
                {label}
              </Button>
            ))}
            <div className="flex items-center gap-1">
              <Input type="date" className="h-9 w-36" value={customFrom} min="2026-10-26" onChange={(e) => setCustomFrom(e.target.value)} data-testid="range-from" />
              <span className="text-muted-foreground">-</span>
              <Input type="date" className="h-9 w-36" value={customTo} min="2026-10-26" onChange={(e) => setCustomTo(e.target.value)} data-testid="range-to" />
              <Button size="sm" variant={!preset ? "default" : "outline"} disabled={!customFrom}
                onClick={() => update({ preset: null, from: customFrom, to: customTo || customFrom })} data-testid="range-apply">
                {L("apply", "Apply")}
              </Button>
            </div>
          </div>
        </div>

        {data && (
          <p className="text-sm text-muted-foreground" data-testid="traffic-range-label">
            {data.range.from === data.range.to ? shortDay(data.range.from) : `${shortDay(data.range.from)} - ${shortDay(data.range.to)}`}
          </p>
        )}

        {/* Active filters */}
        {Object.keys(filters).length > 0 && (
          <div className="flex flex-wrap items-center gap-2" data-testid="traffic-filters">
            <span className="text-sm text-muted-foreground">{L("showingOnly", "Showing only:")}</span>
            {Object.entries(filters).map(([k, v]) => (
              <Badge key={k} variant="secondary" className="gap-1 pr-1 text-sm">
                {filterLabel(k as FilterKey, v!)}
                <button className="rounded hover:bg-muted p-0.5" onClick={() => update({ [k]: null })} aria-label="Remove filter" data-testid={`filter-remove-${k}`}>
                  <X className="h-3.5 w-3.5" />
                </button>
              </Badge>
            ))}
            <Button size="sm" variant="ghost" onClick={() => update(Object.fromEntries(FILTER_KEYS.map((k) => [k, null])))} data-testid="filter-clear">
              {L("clearAll", "Clear all")}
            </Button>
          </div>
        )}

        {isError && <p className="text-destructive">{L("loadError", "Could not load traffic. Refresh to try again.")}</p>}

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          <Kpi icon={Users} label={L("kVisitors", "Visitors")} value={c?.visitors} prev={p?.visitors} compare={compare} loading={isLoading} testId="kpi-visitors" />
          <Kpi icon={UserPlus} label={L("kNew", "New visitors")} value={c?.new_visitors} prev={p?.new_visitors} compare={compare} loading={isLoading}
            onClick={() => drill("visitorType", "new")} testId="kpi-new" />
          <Kpi icon={Repeat} label={L("kReturning", "Returning")} value={c?.returning_visitors} prev={p?.returning_visitors} compare={compare} loading={isLoading}
            onClick={() => drill("visitorType", "returning")} testId="kpi-returning" />
          <Kpi icon={Eye} label={L("kViews", "Page views")} value={c?.views} prev={p?.views} compare={compare} loading={isLoading} testId="kpi-views"
            hint={c && c.sessions ? L("perVisit", "{{n}} pages per visit", { n: (c.views / c.sessions).toFixed(1) }) : undefined} />
          <Kpi icon={FileText} label={L("kQuotes", "Quote requests")} value={c?.quotes} prev={p?.quotes} compare={compare} loading={isLoading} testId="kpi-quotes"
            hint={c ? pct(c.quotes, c.sessions) + " " + L("ofVisits", "of visits") : undefined} />
          <Kpi icon={CalendarCheck} label={L("kBookings", "Bookings")} value={c?.bookings} prev={p?.bookings} compare={compare} loading={isLoading} testId="kpi-bookings"
            hint={c && c.bookings_started ? L("started", "{{n}} started", { n: c.bookings_started }) : undefined} />
          <Kpi icon={ShoppingCart} label={L("kPurchases", "Online purchases")} value={c?.purchases} prev={p?.purchases} compare={compare} loading={isLoading} testId="kpi-purchases"
            hint={c && c.revenue ? money(c.revenue) : undefined} />
        </div>

        {c && c.visitors > 0 && (
          <InsightLine testId="traffic-insight">
            {L("insight", "{{v}} people visited. {{n}} were new. {{s}} of visits left after one page. Average visit (more than one page): {{t}}.", {
              v: fmt(c.visitors), n: fmt(c.new_visitors), s: pct(c.single_page_sessions, c.sessions),
              t: c.avg_seconds >= 60 ? `${Math.round(c.avg_seconds / 60)} min` : `${Math.round(c.avg_seconds)} sec`,
            })}
          </InsightLine>
        )}

        {/* Per day */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{L("perDay", "Visitors per day")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-40 w-full" /> : (
              <DayBars rows={data?.byDay || []} range={data?.range} onPick={(d) => update({ preset: null, from: d, to: d })} L={L} />
            )}
          </CardContent>
        </Card>

        {/* Offices */}
        <div>
          <h2 className="text-base font-semibold mb-2 flex items-center gap-2"><MapPin className="h-4 w-4" />{L("byOffice", "By office")}</h2>
          <p className="text-sm text-muted-foreground mb-3">{L("byOfficeHint", "Visitors who looked at a city's location page or its training pages. One person can count in more than one city.")}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {cityRows.map((r) => (
              <button key={r.city} onClick={() => drill("city", r.city)} className="text-left" data-testid={`office-${r.city}`}>
                <Card className={`h-full transition hover:border-primary ${filters.city === r.city ? "border-primary" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{city(r.city)}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-3xl font-bold tabular-nums mt-1">{isLoading ? "-" : fmt(r.visitors)}</div>
                    <div className="text-xs text-muted-foreground">{L("visitors", "visitors")}</div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <Mini label={L("mQuotes", "Quotes")} value={r.quotes} />
                      <Mini label={L("mBookings", "Bookings")} value={r.bookings} />
                      <Mini label={L("mPurchases", "Purchases")} value={r.purchases} />
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        </div>

        {/* Sources / Locations / Devices */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <ListCard title={L("sources", "Where visitors came from")} icon={Globe} loading={isLoading} testId="card-sources"
            rows={(data?.sources || []).map((r) => ({ key: r.source, label: source(r.source), value: r.visitors, sub: r.conversions ? L("conv", "{{n}} converted", { n: r.conversions }) : undefined, onClick: () => drill("source", r.source) }))}
            empty={L("none", "No visits in this range yet.")} />
          <ListCard title={L("locations", "Visitor locations (state)")} icon={MapPin} loading={isLoading} testId="card-regions"
            rows={(data?.regions || []).map((r) => ({ key: r.region + r.country, label: r.region === "Unknown" ? L("unknownLoc", "Unknown (before tracking)") : place(null, r.region, r.country), value: r.visitors, onClick: () => drill("region", r.region) }))}
            empty={L("none", "No visits in this range yet.")} />
          <ListCard title={L("devices", "Devices")} icon={Smartphone} loading={isLoading} testId="card-devices"
            rows={(data?.devices || []).map((r) => ({ key: r.device, label: device(r.device), value: r.visitors, icon: r.device === "mobile" ? Smartphone : r.device === "tablet" ? Tablet : Monitor, onClick: () => drill("device", r.device) }))}
            empty={L("none", "No visits in this range yet.")} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <ListCard title={L("topPages", "Most viewed pages")} icon={Eye} loading={isLoading} testId="card-pages" mono
            rows={(data?.topPages || []).slice(0, 15).map((r) => ({ key: r.path, label: r.path, value: r.views, sub: L("byN", "{{n}} visitors", { n: r.visitors }), onClick: () => drill("page", r.path) }))}
            empty={L("none", "No visits in this range yet.")} />
          <ListCard title={L("landing", "First page of a visit")} icon={LogIn} loading={isLoading} testId="card-landing" mono
            rows={(data?.landingPages || []).slice(0, 15).map((r) => ({ key: r.path, label: r.path, value: r.sessions, sub: L("leftN", "{{p}} left right away", { p: pct(r.left_after_one, r.sessions) }), onClick: () => drill("landing", r.path) }))}
            empty={L("none", "No visits in this range yet.")} />
          <ListCard title={L("cities", "Visitor cities")} icon={MapPin} loading={isLoading} testId="card-geo-cities"
            rows={(data?.geoCities || []).slice(0, 15).map((r) => ({ key: r.city + r.region, label: r.city === "Unknown" ? L("unknownLoc", "Unknown (before tracking)") : place(r.city, r.region), value: r.visitors, onClick: () => drill("geoCity", r.city) }))}
            empty={L("none", "No visits in this range yet.")} />
        </div>

        {(data?.campaigns?.length ?? 0) > 0 && (
          <ListCard title={L("campaigns", "Campaigns (tagged links)")} icon={Megaphone} loading={false} testId="card-campaigns"
            rows={data!.campaigns.map((r) => ({ key: r.campaign, label: r.campaign, value: r.visitors, sub: [r.utm_source, r.utm_medium].filter(Boolean).join(" / "), onClick: () => drill("campaign", r.campaign) }))}
            empty="" />
        )}

        {/* Visits */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{L("visits", "Visits")}</CardTitle>
            <p className="text-sm text-muted-foreground">{L("visitsHint", "Newest first. Click a visit to see every page that person viewed.")}</p>
          </CardHeader>
          <CardContent className="p-0">
            {visitsLoading ? <div className="p-4"><Skeleton className="h-40 w-full" /></div> : (visits?.sessions.length ?? 0) === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">{L("none", "No visits in this range yet.")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="table-visits">
                  <thead className="text-left text-muted-foreground border-b">
                    <tr>
                      <th className="px-4 py-2 font-medium">{L("colWhen", "When")}</th>
                      <th className="px-4 py-2 font-medium">{L("colWho", "Visitor")}</th>
                      <th className="px-4 py-2 font-medium">{L("colFrom", "From")}</th>
                      <th className="px-4 py-2 font-medium">{L("colWhere", "Location")}</th>
                      <th className="px-4 py-2 font-medium">{L("colLanding", "First page")}</th>
                      <th className="px-4 py-2 font-medium text-right">{L("colPages", "Pages")}</th>
                      <th className="px-4 py-2 font-medium">{L("colOutcome", "Outcome")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visits!.sessions.map((v) => (
                      <tr key={v.session_id} className="border-b last:border-0 hover:bg-muted/50 cursor-pointer" onClick={() => setOpenSession(v.session_id)} data-testid={`visit-${v.session_id}`}>
                        <td className="px-4 py-2 whitespace-nowrap">{ptTime(v.started)}</td>
                        <td className="px-4 py-2">
                          <Badge variant={v.is_new ? "secondary" : "outline"}>{v.is_new ? L("new", "New") : L("returning", "Returning")}</Badge>
                          <span className="ml-2 text-muted-foreground">{device(v.device)}</span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">{source(v.source)}{v.utm_campaign ? ` · ${v.utm_campaign}` : ""}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{v.region ? place(v.geo_city, v.region, v.country) : L("unknownShort", "Unknown")}</td>
                        <td className="px-4 py-2 font-mono text-xs max-w-[16rem] truncate" title={v.landing}>{v.landing}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{v.views}</td>
                        <td className="px-4 py-2 space-x-1 whitespace-nowrap">
                          {v.quoted && <Badge className="bg-brand-green/15 text-brand-green border-0">{L("mQuote", "Quote")}</Badge>}
                          {v.booked && <Badge className="bg-brand-green/15 text-brand-green border-0">{L("mBooked", "Booked")}</Badge>}
                          {v.purchased && <Badge className="bg-brand-green/15 text-brand-green border-0">{L("mBought", "Bought")}</Badge>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          {L("geoCredit", "Visitor locations are estimated from internet address and can be off by a city.")}{" "}
          <a href="https://db-ip.com" target="_blank" rel="noreferrer" className="underline">IP Geolocation by DB-IP</a>
        </p>
      </div>

      <Sheet open={!!openSession} onOpenChange={(o) => !o && setOpenSession(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto" data-testid="visit-journey">
          <SheetHeader>
            <SheetTitle>{L("journey", "Visit details")}</SheetTitle>
          </SheetHeader>
          {openSession && <JourneyView sid={openSession} onOpen={setOpenSession} labels={{ L, source, device, event }} />}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}

// ─── Pieces ───────────────────────────────────────────────────────

function Kpi({ icon: Icon, label, value, prev, compare, loading, onClick, hint, testId }: {
  icon: typeof Users; label: string; value?: number; prev?: number; compare: string; loading: boolean;
  onClick?: () => void; hint?: string; testId: string;
}) {
  const body = (
    <Card className={`h-full ${onClick ? "transition hover:border-primary" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</div>
        <div className="text-2xl font-bold tabular-nums mt-1" data-testid={`${testId}-value`}>{loading ? "-" : fmt(value)}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
        {!loading && value !== undefined && prev !== undefined && (
          <div className="mt-1"><TrendChip current={value} previous={prev} compareLabel={compare} /></div>
        )}
      </CardContent>
    </Card>
  );
  return onClick ? <button className="text-left" onClick={onClick} data-testid={testId}>{body}</button> : <div data-testid={testId}>{body}</div>;
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="font-semibold tabular-nums text-sm">{fmt(value)}</div>
      <div className="text-muted-foreground">{label}</div>
    </div>
  );
}

function ListCard({ title, icon: Icon, rows, loading, empty, testId, mono }: {
  title: string; icon: typeof Users; loading: boolean; empty: string; testId: string; mono?: boolean;
  rows: { key: string; label: string; value: number; sub?: string; icon?: typeof Users; onClick?: () => void }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <Card data-testid={testId}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2"><Icon className="h-4 w-4" />{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {loading ? <Skeleton className="h-32 w-full" /> : rows.length === 0 ? <p className="text-sm text-muted-foreground">{empty}</p> : rows.map((r) => (
          <button key={r.key} onClick={r.onClick} className="w-full text-left rounded px-2 py-1.5 hover:bg-muted/60" data-testid={`${testId}-row`}>
            <div className="flex items-center justify-between gap-2">
              <span className={`truncate text-sm flex items-center gap-1.5 ${mono ? "font-mono text-xs" : ""}`} title={r.label}>
                {r.icon && <r.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}{r.label}
              </span>
              <span className="text-sm font-semibold tabular-nums">{fmt(r.value)}</span>
            </div>
            <div className="mt-1 h-1.5 rounded bg-muted overflow-hidden">
              <div className="h-full rounded" style={{ width: `${Math.max(3, (r.value / max) * 100)}%`, backgroundColor: VIZ_GREEN }} />
            </div>
            {r.sub && <div className="text-xs text-muted-foreground mt-0.5">{r.sub}</div>}
          </button>
        ))}
      </CardContent>
    </Card>
  );
}

function DayBars({ rows, range, onPick, L }: {
  rows: Summary["byDay"]; range?: { from: string; to: string }; onPick: (d: string) => void;
  L: (k: string, en: string, o?: Record<string, unknown>) => string;
}) {
  // Fill missing days with zero so gaps are visible.
  const days: { day: string; visitors: number; new_visitors: number; views: number }[] = [];
  if (range) {
    for (let t = Date.parse(`${range.from}T12:00:00Z`); t <= Date.parse(`${range.to}T12:00:00Z`); t += 86400000) {
      const d = new Date(t).toISOString().slice(0, 10);
      const r = rows.find((x) => x.day === d);
      days.push({ day: d, visitors: r?.visitors ?? 0, new_visitors: r?.new_visitors ?? 0, views: r?.views ?? 0 });
    }
  }
  if (days.length === 0) return <p className="text-sm text-muted-foreground">{L("none", "No visits in this range yet.")}</p>;
  const max = Math.max(1, ...days.map((d) => d.visitors));
  return (
    <div>
      <div className="flex items-end gap-1 h-40" data-testid="day-bars">
        {days.map((d) => (
          <button key={d.day} onClick={() => onPick(d.day)} className="group flex-1 flex flex-col items-center justify-end h-full min-w-0"
            title={`${shortDay(d.day)}: ${d.visitors} visitors (${d.new_visitors} new), ${d.views} page views`} data-testid={`day-${d.day}`}>
            <span className="text-[10px] tabular-nums text-muted-foreground mb-0.5">{d.visitors || ""}</span>
            <div className="w-full rounded-t group-hover:opacity-80" style={{ height: `${(d.visitors / max) * 85}%`, minHeight: d.visitors ? 4 : 1, backgroundColor: d.visitors ? VIZ_GREEN : "hsl(var(--muted))" }} />
          </button>
        ))}
      </div>
      <div className="flex gap-1 mt-1">
        {days.map((d, i) => (
          <span key={d.day} className="flex-1 text-center text-[10px] text-muted-foreground truncate">
            {days.length <= 14 || i % Math.ceil(days.length / 10) === 0 ? shortDay(d.day) : ""}
          </span>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-2">{L("pickDay", "Click a day to see only that day.")}</p>
    </div>
  );
}

function JourneyView({ sid, onOpen, labels }: {
  sid: string; onOpen: (s: string) => void;
  labels: { L: (k: string, en: string, o?: Record<string, unknown>) => string; source: (s: string) => string; device: (d: string) => string; event: (e: string) => string };
}) {
  const { L, source, device, event } = labels;
  const { data, isLoading } = useQuery<Journey>({ queryKey: [`/api/admin/traffic/sessions/${encodeURIComponent(sid)}`] });
  if (isLoading || !data) return <Skeleton className="h-64 w-full mt-4" />;
  const first = data.views[0];
  const last = data.views[data.views.length - 1];
  const timeline = [
    ...data.views.map((v) => ({ at: v.created_at, kind: "view" as const, text: v.path })),
    ...data.events.filter((e) => e.event_type !== "booking_step_reached").map((e) => ({
      at: e.created_at, kind: "event" as const,
      text: `${event(e.event_type)}${e.revenue ? ` (${money(Number(e.revenue))})` : ""}`,
    })),
  ].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  return (
    <div className="space-y-4 mt-4 text-sm">
      {first && (
        <div className="grid grid-cols-2 gap-3">
          <Info2 label={L("jWhen", "Started")} value={ptTime(first.created_at)} />
          <Info2 label={L("jLength", "Length")} value={last ? duration(first.created_at, last.created_at) : "-"} />
          <Info2 label={L("jFrom", "Came from")} value={`${source(first.referrer_source)}${first.utm_campaign ? ` · ${first.utm_campaign}` : ""}`} />
          <Info2 label={L("jWhere", "Location")} value={place(first.city, first.region, first.country)} />
          <Info2 label={L("jDevice", "Device")} value={device(first.device || "desktop")} />
          <Info2 label={L("jLang", "Language")} value={first.locale === "es" ? "Español" : "English"} />
          {first.referrer && <div className="col-span-2"><Info2 label={L("jRef", "Referring page")} value={first.referrer} /></div>}
        </div>
      )}
      <div>
        <h3 className="font-semibold mb-2">{L("jPath", "What they did")}</h3>
        <ol className="space-y-2 border-l pl-4">
          {timeline.map((x, i) => (
            <li key={i} className="relative">
              <span className={`absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ${x.kind === "event" ? "bg-brand-green" : "bg-muted-foreground/50"}`} />
              <div className={x.kind === "event" ? "font-semibold text-brand-green" : "font-mono text-xs break-all"}>{x.text}</div>
              <div className="text-xs text-muted-foreground">{ptTime(x.at)}</div>
            </li>
          ))}
        </ol>
      </div>
      {data.otherVisits.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">{L("jOther", "Other visits by this person")}</h3>
          <div className="space-y-1">
            {data.otherVisits.map((o) => (
              <button key={o.session_id} onClick={() => onOpen(o.session_id)} className="w-full text-left rounded px-2 py-1.5 hover:bg-muted/60">
                <span>{ptTime(o.started)}</span>
                <span className="text-muted-foreground"> · {L("pagesN", "{{n}} pages", { n: o.views })} · </span>
                <span className="font-mono text-xs">{o.landing}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Info2({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="break-words">{value}</div>
    </div>
  );
}
