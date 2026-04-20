import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar as CalendarIcon,
  List,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  MapPin,
  Phone,
  Mail,
  Users,
  FileText,
} from "lucide-react";
import type { Booking, ServiceArea } from "@shared/schema";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function AdminBookings() {
  const [view, setView] = useState<"calendar" | "list">("list");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const { toast } = useToast();

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const { data: serviceAreas } = useQuery<ServiceArea[]>({
    queryKey: ["/api/service-areas"],
  });

  const confirmMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/bookings/${id}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({ title: "Booking confirmed" });
      setSelectedBooking(null);
    },
    onError: () => toast({ title: "Failed to confirm booking", variant: "destructive" }),
  });

  const completeMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/bookings/${id}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({ title: "Booking marked complete" });
      setSelectedBooking(null);
    },
    onError: () => toast({ title: "Failed to complete booking", variant: "destructive" }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/bookings/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({ title: "Booking cancelled" });
      setSelectedBooking(null);
    },
    onError: () => toast({ title: "Failed to cancel booking", variant: "destructive" }),
  });

  const filtered = (bookings || []).filter((b) =>
    statusFilter === "all" ? true : b.status === statusFilter
  );

  const handleViewDetail = async (booking: Booking) => {
    try {
      const res = await apiRequest("GET", `/api/bookings/${booking.id}`);
      const detail = await res.json();
      setSelectedBooking(detail);
    } catch {
      setSelectedBooking({ ...booking });
    }
  };

  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const bookingsByDate: Record<string, Booking[]> = {};
  (bookings || []).forEach((b) => {
    const created = new Date(b.createdAt);
    const dateStr = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}-${String(created.getDate()).padStart(2, "0")}`;
    if (!bookingsByDate[dateStr]) bookingsByDate[dateStr] = [];
    bookingsByDate[dateStr].push(b);
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold" data-testid="text-admin-bookings-title">
            Bookings
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant={view === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("list")}
              data-testid="button-view-list"
            >
              <List className="h-4 w-4 mr-1" />
              List
            </Button>
            <Button
              variant={view === "calendar" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("calendar")}
              data-testid="button-view-calendar"
            >
              <CalendarIcon className="h-4 w-4 mr-1" />
              Calendar
            </Button>
          </div>
        </div>

        {view === "list" && (
          <div className="flex flex-wrap gap-3 items-center">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : view === "list" ? (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="table-bookings">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left p-3 font-medium">Booking #</th>
                      <th className="text-left p-3 font-medium">Contact</th>
                      <th className="text-left p-3 font-medium">Location</th>
                      <th className="text-left p-3 font-medium">Participants</th>
                      <th className="text-left p-3 font-medium">Total</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Created</th>
                      <th className="text-left p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-muted-foreground">
                          No bookings found
                        </td>
                      </tr>
                    ) : (
                      filtered.map((booking) => (
                        <tr key={booking.id} className="border-b" data-testid={`row-booking-${booking.id}`}>
                          <td className="p-3 font-mono text-xs" data-testid={`text-booking-number-${booking.id}`}>
                            {booking.bookingNumber}
                          </td>
                          <td className="p-3">
                            <div data-testid={`text-booking-contact-${booking.id}`}>{booking.contactName}</div>
                            <div className="text-xs text-muted-foreground">{booking.contactEmail}</div>
                          </td>
                          <td className="p-3">
                            <div className="text-xs">{booking.customerCity}, {booking.customerState}</div>
                          </td>
                          <td className="p-3" data-testid={`text-booking-participants-${booking.id}`}>
                            {booking.participantCount}
                          </td>
                          <td className="p-3" data-testid={`text-booking-total-${booking.id}`}>
                            ${Number(booking.totalPrice).toFixed(2)}
                          </td>
                          <td className="p-3">
                            <Badge
                              variant="secondary"
                              className={statusColors[booking.status] || ""}
                              data-testid={`badge-booking-status-${booking.id}`}
                            >
                              {booking.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">
                            {new Date(booking.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewDetail(booking)}
                              data-testid={`button-view-booking-${booking.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <Button variant="ghost" size="icon" onClick={() => setCalendarMonth(new Date(year, month - 1, 1))} data-testid="button-calendar-prev">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-lg" data-testid="text-calendar-month">
                {calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setCalendarMonth(new Date(year, month + 1, 1))} data-testid="button-calendar-next">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-px bg-muted rounded-md overflow-visible">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="p-2 text-xs font-medium text-center text-muted-foreground bg-background">
                    {d}
                  </div>
                ))}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[80px] bg-background" />
                ))}
                {calendarDays.map((day) => {
                  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const dayBookings = bookingsByDate[dateStr] || [];
                  return (
                    <div key={day} className="min-h-[80px] p-1 bg-background" data-testid={`calendar-day-${dateStr}`}>
                      <div className="text-xs font-medium mb-1">{day}</div>
                      {dayBookings.slice(0, 3).map((b) => (
                        <div
                          key={b.id}
                          className={`text-[10px] px-1 rounded mb-0.5 cursor-pointer truncate ${statusColors[b.status] || "bg-muted"}`}
                          onClick={() => handleViewDetail(b)}
                          data-testid={`calendar-booking-${b.id}`}
                        >
                          {b.contactName}
                        </div>
                      ))}
                      {dayBookings.length > 3 && (
                        <div className="text-[10px] text-muted-foreground">+{dayBookings.length - 3} more</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle data-testid="text-booking-detail-title">
                Booking {selectedBooking?.bookingNumber}
              </DialogTitle>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={statusColors[selectedBooking.status] || ""} data-testid="badge-detail-status">
                    {selectedBooking.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Created {new Date(selectedBooking.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span data-testid="text-detail-participants">{selectedBooking.participantCount} participants</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span data-testid="text-detail-total">${Number(selectedBooking.totalPrice).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span data-testid="text-detail-phone">{selectedBooking.contactPhone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span data-testid="text-detail-email">{selectedBooking.contactEmail}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-sm">
                  <div className="font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Training Location
                  </div>
                  <div className="text-muted-foreground" data-testid="text-detail-address">
                    {selectedBooking.customerAddress}<br />
                    {selectedBooking.customerCity}, {selectedBooking.customerState} {selectedBooking.customerZip}
                  </div>
                </div>

                {selectedBooking.specialRequests && (
                  <div className="space-y-1 text-sm">
                    <div className="font-medium">Special Requests</div>
                    <div className="text-muted-foreground" data-testid="text-detail-requests">
                      {selectedBooking.specialRequests}
                    </div>
                  </div>
                )}

                <div className="space-y-1 text-sm">
                  <div className="font-medium">Session Details</div>
                  <div className="text-muted-foreground" data-testid="text-detail-session">
                    Date: {selectedBooking.sessionDate}<br />
                    Time: {selectedBooking.startTime} - {selectedBooking.endTime}<br />
                    Product: {selectedBooking.productSlug}
                  </div>
                </div>

                {selectedBooking.orderId && (
                  <div className="text-sm">
                    <span className="font-medium">Linked Order: </span>
                    <span className="text-muted-foreground" data-testid="text-detail-order">#{selectedBooking.orderId}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedBooking.status === "pending" && (
                    <Button
                      size="sm"
                      onClick={() => confirmMutation.mutate(selectedBooking.id)}
                      disabled={confirmMutation.isPending}
                      data-testid="button-confirm-booking"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Confirm
                    </Button>
                  )}
                  {selectedBooking.status === "confirmed" && (
                    <Button
                      size="sm"
                      onClick={() => completeMutation.mutate(selectedBooking.id)}
                      disabled={completeMutation.isPending}
                      data-testid="button-complete-booking"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mark Complete
                    </Button>
                  )}
                  {(selectedBooking.status === "pending" || selectedBooking.status === "confirmed") && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cancelMutation.mutate(selectedBooking.id)}
                      disabled={cancelMutation.isPending}
                      data-testid="button-cancel-booking"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
