import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import AdminLayout from "./AdminLayout";
import MoneySummaryCard from "@/components/admin/money/MoneySummaryCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  Sun,
  Phone,
  CheckCircle,
  AlertCircle,
  DollarSign,
  CalendarDays,
  UserPlus,
  ChevronRight,
  Loader2,
} from "lucide-react";
import TodaySessionCard from "@/components/admin/today/TodaySessionCard";
import {
  type TodayData,
  type TodayBooking,
  type TodayLead,
  productLabel,
  formatMoney,
  formatDay,
} from "@/components/admin/today/types";

function SectionTitle({ icon: Icon, children, count }: { icon: any; children: React.ReactNode; count?: number }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-5 w-5 text-primary" />
      <h2 className="text-lg font-bold">{children}</h2>
      {count !== undefined && count > 0 && (
        <Badge variant="secondary" className="bg-primary/15 text-foreground">
          {count}
        </Badge>
      )}
    </div>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4 text-sm text-muted-foreground text-center">{children}</CardContent>
    </Card>
  );
}

export default function AdminToday() {
  const { toast } = useToast();

  const { data, isLoading } = useQuery<TodayData>({
    queryKey: ["/api/admin/today"],
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/today"] });
    queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
  };

  const confirmMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/bookings/${id}/confirm`),
    onSuccess: () => {
      invalidate();
      toast({ title: "Booking confirmed — customer notified by email" });
    },
    onError: () => toast({ title: "Failed to confirm booking", variant: "destructive" }),
  });

  const completeMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/bookings/${id}/complete`),
    onSuccess: () => {
      invalidate();
      toast({ title: "Training marked complete" });
    },
    onError: () => toast({ title: "Failed to complete booking", variant: "destructive" }),
  });

  if (isLoading || !data) {
    return (
      <AdminLayout>
        <div className="space-y-4 max-w-2xl mx-auto">
          <Skeleton className="h-8 w-48" />
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      </AdminLayout>
    );
  }

  // Today's pending sessions already show a Confirm button up top — keep the
  // needs-action list to everything else so nothing appears twice.
  const awaiting = data.awaitingConfirmation.filter((b) => b.sessionDate !== data.date);
  const needsActionCount = awaiting.length + data.unpaidBalances.length;

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-2xl mx-auto pb-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-admin-today-title">
            Today
          </h1>
          <p className="text-muted-foreground">{formatDay(data.date, { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>

        <MoneySummaryCard />

        {/* Today's sessions */}
        <section className="space-y-3">
          <SectionTitle icon={Sun} count={data.todaySessions.length}>
            Today's Sessions
          </SectionTitle>
          {data.todaySessions.length === 0 ? (
            <EmptyNote>No training sessions scheduled today.</EmptyNote>
          ) : (
            data.todaySessions.map((b) => (
              <TodaySessionCard
                key={b.id}
                booking={b}
                onConfirm={(id) => confirmMutation.mutate(id)}
                onComplete={(id) => completeMutation.mutate(id)}
                confirmPending={confirmMutation.isPending}
                completePending={completeMutation.isPending}
              />
            ))
          )}
        </section>

        {/* Needs action */}
        <section className="space-y-3">
          <SectionTitle icon={AlertCircle} count={needsActionCount}>
            Needs Action
          </SectionTitle>

          {needsActionCount === 0 ? (
            <EmptyNote>Nothing waiting on you. Nice.</EmptyNote>
          ) : (
            <>
              {awaiting.map((b) => (
                <AwaitingRow
                  key={`await-${b.id}`}
                  booking={b}
                  onConfirm={(id) => confirmMutation.mutate(id)}
                  pending={confirmMutation.isPending}
                />
              ))}
              {data.unpaidBalances.map((b) => (
                <UnpaidRow key={`unpaid-${b.id}`} booking={b} />
              ))}
            </>
          )}
        </section>

        {/* This week */}
        <section className="space-y-3">
          <SectionTitle icon={CalendarDays}>This Week</SectionTitle>
          {data.week.length === 0 ? (
            <EmptyNote>No sessions booked in the next 7 days.</EmptyNote>
          ) : (
            <Card>
              <CardContent className="p-0 divide-y">
                {data.week.map((day) => (
                  <div key={day.date} className="p-4" data-testid={`row-week-${day.date}`}>
                    <div className="font-semibold">
                      {day.date === data.date ? "Today" : formatDay(day.date, { weekday: "long", month: "short", day: "numeric" })}
                    </div>
                    <div className="mt-1 space-y-1">
                      {day.groups.map((g) => (
                        <div key={g.areaName} className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">{g.areaName}</span>
                          {" — "}
                          {g.participants} {g.participants === 1 ? "person" : "people"}, {formatMoney(g.revenue)}
                          {g.bookingCount > 1 && ` (${g.bookingCount} sessions)`}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          <Button asChild variant="outline" className="w-full">
            <Link href="/admin/bookings" data-testid="link-all-bookings">
              All bookings
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </section>

        {/* New leads */}
        <section className="space-y-3">
          <SectionTitle icon={UserPlus} count={data.newLeads.length}>
            New Leads (last 7 days)
          </SectionTitle>
          {data.newLeads.length === 0 ? (
            <EmptyNote>No new leads this week.</EmptyNote>
          ) : (
            data.newLeads.map((lead) => <LeadRow key={`${lead.type}-${lead.id}`} lead={lead} />)
          )}
          <Button asChild variant="outline" className="w-full">
            <Link href="/admin/onsite-requests" data-testid="link-all-requests">
              All onsite requests
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </section>
      </div>
    </AdminLayout>
  );
}

function AwaitingRow({
  booking: b,
  onConfirm,
  pending,
}: {
  booking: TodayBooking;
  onConfirm: (id: number) => void;
  pending: boolean;
}) {
  return (
    <Card className="border-l-4 border-l-yellow-400" data-testid={`card-awaiting-${b.id}`}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold">{b.contactName}</span>
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            Needs confirmation
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          {formatDay(b.sessionDate)} · {b.startTime} · {b.areaName} · {b.participantCount}{" "}
          {b.participantCount === 1 ? "person" : "people"} · {formatMoney(b.total)}
        </div>
        <div className="text-xs text-muted-foreground">{productLabel(b.productSlug)}</div>
        <div className="flex gap-2 pt-1">
          <Button asChild size="lg" variant="outline" className="flex-1">
            <a href={`tel:${b.contactPhone}`} data-testid={`link-call-awaiting-${b.id}`}>
              <Phone className="h-4 w-4 mr-1" />
              Call
            </a>
          </Button>
          <Button
            size="lg"
            className="flex-1"
            onClick={() => onConfirm(b.id)}
            disabled={pending}
            data-testid={`button-confirm-awaiting-${b.id}`}
          >
            {pending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
            Confirm
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function UnpaidRow({ booking: b }: { booking: TodayBooking }) {
  return (
    <Card className="border-l-4 border-l-brand-orange" data-testid={`card-unpaid-${b.id}`}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold">{b.contactName}</span>
          <span className="font-bold text-brand-orange whitespace-nowrap">
            {formatMoney(b.balanceDue)} due
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          {formatDay(b.sessionDate)} · {b.areaName} · paid {formatMoney(b.paid)} of {formatMoney(b.total)}
        </div>
        <div className="flex gap-2 pt-1">
          <Button asChild size="lg" variant="outline" className="flex-1">
            <a href={`tel:${b.contactPhone}`} data-testid={`link-call-unpaid-${b.id}`}>
              <Phone className="h-4 w-4 mr-1" />
              Call
            </a>
          </Button>
          <Button asChild size="lg" variant="outline" className="flex-1">
            <Link href="/admin/bookings" data-testid={`link-collect-${b.id}`}>
              <DollarSign className="h-4 w-4 mr-1" />
              Collect
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LeadRow({ lead }: { lead: TodayLead }) {
  const viewHref = lead.type === "onsite_request" ? `/admin/onsite-requests/${lead.id}` : "/admin/leads";
  return (
    <Card data-testid={`card-lead-${lead.type}-${lead.id}`}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="font-semibold">{lead.name}</span>
            {lead.company && <span className="text-sm text-muted-foreground"> · {lead.company}</span>}
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {new Date(lead.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        </div>
        {lead.detail && <div className="text-sm text-muted-foreground">{lead.detail}</div>}
        <div className="flex gap-2 pt-1">
          {lead.phone && (
            <Button asChild size="lg" variant="outline" className="flex-1">
              <a href={`tel:${lead.phone}`} data-testid={`link-call-lead-${lead.type}-${lead.id}`}>
                <Phone className="h-4 w-4 mr-1" />
                Call
              </a>
            </Button>
          )}
          <Button asChild size="lg" variant="outline" className="flex-1">
            <Link href={viewHref} data-testid={`link-view-lead-${lead.type}-${lead.id}`}>
              View
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
