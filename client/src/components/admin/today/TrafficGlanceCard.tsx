import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ChevronRight } from "lucide-react";
import { Sparkline, TrendChip } from "@/components/admin/viz";
import { TRAFFIC_CITIES } from "@shared/traffic";

interface Glance {
  today: { visitors: number; views: number; new_visitors: number; quotes: number };
  yesterday: { visitors: number; views: number };
  cities: { city: string; visitors: number }[];
  byDay: { day: string; visitors: number }[];
}

/** Today page: visitors today, vs yesterday, split by office, 14-day trend. */
export default function TrafficGlanceCard() {
  const { t } = useTranslation();
  const L = (k: string, en: string, o?: Record<string, unknown>) => t(`traffic.${k}`, { defaultValue: en, ...o });
  const { data } = useQuery<Glance>({ queryKey: ["/api/admin/traffic/glance"], refetchInterval: 5 * 60 * 1000 });
  const fmt = (n?: number) => new Intl.NumberFormat("en-US").format(n ?? 0);
  return (
    <Card data-testid="card-traffic-glance">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Users className="h-4 w-4 text-brand-green" />
          {L("glanceTitle", "Website visitors today")}
        </div>
        <div className="flex items-end justify-between gap-3">
          <div className="flex items-baseline gap-2 min-w-0">
            <p className="text-2xl font-bold tabular-nums" data-testid="text-visitors-today">{data ? fmt(data.today.visitors) : "-"}</p>
            <span className="text-sm text-muted-foreground">{data ? L("glanceViews", "{{n}} page views", { n: fmt(data.today.views) }) : ""}</span>
            {data && (
              <TrendChip current={data.today.visitors} previous={data.yesterday.visitors}
                compareLabel={L("vsYesterday", "vs yesterday ({{n}})", { n: data.yesterday.visitors })} testId="chip-visitors-trend" />
            )}
          </div>
          {data && data.byDay.length > 1 && (
            <Sparkline values={data.byDay.map((d) => d.visitors)} label={L("spark14", "Visitors per day, last 14 days")} testId="spark-visitors-14d" />
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm" data-testid="glance-cities">
          {TRAFFIC_CITIES.map((c) => (
            <Link key={c.slug} href={`/admin/analytics?preset=today&city=${c.slug}`} className="hover:underline">
              <span className="text-muted-foreground">{c.label}:</span>{" "}
              <span className="font-semibold tabular-nums">{fmt(data?.cities.find((x) => x.city === c.slug)?.visitors)}</span>
            </Link>
          ))}
          {data && data.today.quotes > 0 && (
            <span><span className="text-muted-foreground">{L("glanceQuotes", "Quote requests")}:</span> <span className="font-semibold">{data.today.quotes}</span></span>
          )}
        </div>
        <Button asChild variant="ghost" size="sm" className="mt-2 -ml-2">
          <Link href="/admin/analytics?preset=today" data-testid="link-traffic-glance">
            {L("glanceSeeMore", "See all traffic")}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
