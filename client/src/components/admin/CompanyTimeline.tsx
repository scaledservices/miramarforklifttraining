import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Phone, Mail, FileText, ShoppingCart, Award, Calendar,
  ClipboardList, DollarSign, MessageSquare, ChevronRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface TimelineItem {
  id: number;
  type: string;
  title: string;
  description?: string;
  date: string;
  amount?: string;
  status?: string;
  link?: string;
}

interface TimelineEvent {
  id: number;
  type: string;
  title: string;
  description?: string;
  date: string;
  amount?: string;
  status?: string;
  link?: string;
}

// Merge and sort all activity types into a single timeline
function buildTimeline(
  requests: any[],
  orders: any[],
  events: any[],
  certs: any[],
  quotes: any[],
  companyCreatedAt: string
): TimelineEvent[] {
  const items: TimelineEvent[] = [];

  // Company created
  items.push({
    id: 0,
    type: "company_created",
    title: "Company added",
    date: companyCreatedAt,
    link: undefined,
  });

  // Training requests
  requests.forEach((r) => {
    items.push({
      id: r.id,
      type: "request",
      title: `Training request: ${r.trainingType}`,
      description: `${r.contactName} · ${r.traineeCount} trainees`,
      date: r.createdAt,
      status: r.status,
      link: `/admin/onsite-requests/${r.id}`,
    });
  });

  // Quotes
  quotes.forEach((q) => {
    items.push({
      id: q.id,
      type: "quote",
      title: `Quote: ${q.title}`,
      description: q.status,
      date: q.createdAt,
      amount: q.total != null ? `$${(q.total / 100).toFixed(2)}` : undefined,
      status: q.status,
      link: `/admin/quotes/${q.id}`,
    });
  });

  // Orders
  orders.forEach((o) => {
    items.push({
      id: o.id,
      type: "order",
      title: `Order ${o.orderNumber}`,
      description: o.status,
      date: o.createdAt,
      amount: `$${parseFloat(o.total).toFixed(2)}`,
      status: o.status,
    });
  });

  // Training events
  events.forEach((e) => {
    items.push({
      id: e.id,
      type: "event",
      title: e.title,
      description: e.status,
      date: e.createdAt,
      status: e.status,
      link: `/admin/training-events/${e.id}`,
    });
  });

  // Certifications
  certs.forEach((c) => {
    items.push({
      id: c.id,
      type: "cert",
      title: `Certificate: ${c.courseName}`,
      description: c.learnerName,
      date: c.issuedAt,
      status: c.status,
      link: `/admin/certifications/${c.id}`,
    });
  });

  return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

const TYPE_ICONS: Record<string, typeof Phone> = {
  company_created: ClipboardList,
  request: ClipboardList,
  quote: FileText,
  order: ShoppingCart,
  event: Calendar,
  cert: Award,
};

const TYPE_COLORS: Record<string, string> = {
  company_created: "bg-muted text-muted-foreground",
  request: "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300",
  quote: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  order: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  event: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  cert: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
};

export default function CompanyTimeline({
  companyId,
  requests,
  orders,
  events,
  certs,
  quotes,
  companyCreatedAt,
}: {
  companyId: number;
  requests: any[];
  orders: any[];
  events: any[];
  certs: any[];
  quotes: any[];
  companyCreatedAt: string;
}) {
  const { t } = useTranslation();

  const timeline = buildTimeline(requests, orders, events, certs, quotes, companyCreatedAt);

  if (timeline.length === 0) {
    return (
      <div className="bg-card border rounded-xl p-6">
        <h2 className="font-semibold flex items-center gap-2 mb-3">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          {t("adminUx.timelineTitle", { defaultValue: "Activity Timeline" })}
        </h2>
        <p className="text-sm text-muted-foreground text-center py-4">
          {t("adminUx.timelineEmpty", { defaultValue: "No activity yet." })}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-xl p-6" data-testid="company-timeline">
      <h2 className="font-semibold flex items-center gap-2 mb-4">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        {t("adminUx.timelineTitle", { defaultValue: "Activity Timeline" })}
        <span className="text-xs text-muted-foreground font-normal">({timeline.length})</span>
      </h2>

      {/* Vertical timeline */}
      <div className="relative space-y-0">
        {timeline.map((item, idx) => {
          const Icon = TYPE_ICONS[item.type] || ClipboardList;
          const colorClass = TYPE_COLORS[item.type] || "bg-muted";
          const isLast = idx === timeline.length - 1;

          return (
            <div
              key={`${item.type}-${item.id}`}
              className="flex gap-3 pb-6 last:pb-0"
              data-testid={`timeline-item-${idx}`}
            >
              {/* Timeline line + dot */}
              <div className="flex flex-col items-center shrink-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{item.title}</p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.amount && (
                      <span className="text-sm font-bold tabular-nums text-brand-orange">{item.amount}</span>
                    )}
                    {item.status && (
                      <Badge variant="outline" className="text-[10px] capitalize">{item.status.replace(/_/g, " ")}</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-muted-foreground">
                    {(() => {
                      try {
                        return formatDistanceToNow(new Date(item.date), { addSuffix: true });
                      } catch {
                        return new Date(item.date).toLocaleDateString();
                      }
                    })()}
                  </p>
                  {item.link && (
                    <Link
                      href={item.link}
                      className="text-xs text-primary hover:underline font-medium flex items-center gap-0.5"
                    >
                      {t("adminUx.timelineView", { defaultValue: "View" })}
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
