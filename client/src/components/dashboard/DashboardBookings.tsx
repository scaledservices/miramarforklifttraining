import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, MapPin, Users, ChevronLeft, ChevronRight } from "lucide-react";
import AttendeeNamesForm from "@/components/booking/AttendeeNamesForm";
import type { Booking, ServiceArea } from "@shared/schema";

/**
 * Customer-dashboard "Your upcoming training" section (Alberto 2026-07-28,
 * item #7): a mini calendar of the customer's booked hands-on sessions plus
 * per-booking seat reservation tracking (how many seats are named vs open).
 * Sits above the online-course enrollment cards on Dashboard.
 */
export default function DashboardBookings() {
  const [calMonth, setCalMonth] = useState(() => new Date());

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });
  const { data: areas } = useQuery<ServiceArea[]>({
    queryKey: ["/api/service-areas"],
  });

  const upcoming = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return (bookings ?? [])
      .filter((b) => b.status !== "cancelled" && new Date(`${b.sessionDate}T12:00:00`) >= today)
      .sort((a, b) => a.sessionDate.localeCompare(b.sessionDate));
  }, [bookings]);

  const bookedDates = useMemo(() => new Set(upcoming.map((b) => b.sessionDate)), [upcoming]);

  function areaName(id: number) {
    return areas?.find((a) => a.id === id)?.name ?? "Training";
  }

  // --- mini calendar grid ---
  const year = calMonth.getFullYear();
  const month = calMonth.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = calMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }

  function fmtDate(d: string) {
    return new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  if (isLoading) {
    return (
      <div className="mb-8"><Skeleton className="h-6 w-48 mb-3" /><Skeleton className="h-32 w-full" /></div>
    );
  }

  if (upcoming.length === 0) return null;

  return (
    <section className="mb-10" data-testid="dashboard-bookings">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <CalendarDays className="w-5 h-5 text-accent" />
        Your upcoming training
      </h2>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Mini calendar */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">{monthLabel}</CardTitle>
            <div className="flex gap-1">
              <button onClick={() => setCalMonth(new Date(year, month - 1, 1))} className="p-1 rounded hover:bg-muted" aria-label="Previous month" data-testid="button-cal-prev"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setCalMonth(new Date(year, month + 1, 1))} className="p-1 rounded hover:bg-muted" aria-label="Next month" data-testid="button-cal-next"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-1">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i}>{d}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((iso, i) => {
                if (!iso) return <span key={i} />;
                const isBooked = bookedDates.has(iso);
                const day = Number(iso.split("-")[2]);
                return (
                  <span
                    key={i}
                    data-testid={isBooked ? `cal-booked-${iso}` : undefined}
                    className={`aspect-square flex items-center justify-center rounded-md text-xs ${
                      isBooked ? "bg-accent text-accent-foreground font-bold" : "text-foreground/70"
                    }`}
                  >
                    {day}
                  </span>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Booking cards with seat tracking */}
        <div className="lg:col-span-2 space-y-4">
          {upcoming.map((b) => (
            <Card key={b.id} data-testid={`dashboard-booking-${b.id}`}>
              <CardContent className="p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground">{fmtDate(b.sessionDate)} · {b.startTime}-{b.endTime}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" />{areaName(b.serviceAreaId)} · {b.productSlug}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 flex items-center gap-1">
                    <Users className="w-3 h-3" />{b.participantCount} seat{b.participantCount === 1 ? "" : "s"}
                  </Badge>
                </div>
                <AttendeeNamesForm bookingId={b.id} participantCount={b.participantCount} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
