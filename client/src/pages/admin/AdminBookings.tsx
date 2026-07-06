import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { queryClient, apiRequest } from "@/lib/queryClient";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Eye,
  MapPin,
  Phone,
  Mail,
  Users,
  Search,
  DollarSign,
  Send,
  CalendarClock,
  UserX,
  Loader2,
  QrCode,
  Camera,
  Trash2,
  Share2,
  Link2,
} from "lucide-react";
import PayLinkQRDialog from "@/components/admin/PayLinkQRDialog";
import type { Booking, ServiceArea, BookingPhoto } from "@shared/schema";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  no_show: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

const statusLabels: Record<string, string> = {
  pending: "Needs confirmation",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};

interface BookingFinance {
  bookingId: number;
  orderId: number | null;
  total: number;
  paid: number;
  balanceDue: number;
  payments: { id: number; provider: string; status: string; amount: number; createdAt: string }[];
}

function formatSession(b: Booking): string {
  if (!b.sessionDate) return "—";
  const d = new Date(`${b.sessionDate}T12:00:00`);
  return `${d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · ${b.startTime}`;
}

export default function AdminBookings() {
  const [view, setView] = useState<"calendar" | "list">("list");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [recordOpen, setRecordOpen] = useState(false);
  const [recordForm, setRecordForm] = useState({ method: "cash", amount: "", note: "" });
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleForm, setRescheduleForm] = useState({ sessionDate: "", startTime: "", endTime: "" });
  const [completePromptOpen, setCompletePromptOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [photoLightbox, setPhotoLightbox] = useState<BookingPhoto | null>(null);
  const [captionInputs, setCaptionInputs] = useState<Record<number, string>>({});
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const { data: serviceAreas } = useQuery<ServiceArea[]>({
    queryKey: ["/api/service-areas"],
  });

  const { data: finance, isLoading: financeLoading } = useQuery<BookingFinance>({
    queryKey: ["/api/admin/bookings", selectedBooking?.id, "finance"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/bookings/${selectedBooking!.id}/finance`);
      return res.json();
    },
    enabled: !!selectedBooking?.id,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
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
      setCompletePromptOpen(false);
      setSelectedBooking(null);
    },
    onError: () => toast({ title: "Failed to complete booking", variant: "destructive" }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/bookings/${id}/cancel`),
    onSuccess: () => {
      invalidate();
      toast({ title: "Booking cancelled" });
      setSelectedBooking(null);
    },
    onError: () => toast({ title: "Failed to cancel booking", variant: "destructive" }),
  });

  const noShowMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/admin/bookings/${id}/no-show`),
    onSuccess: () => {
      invalidate();
      toast({ title: "Marked as no-show" });
      setSelectedBooking(null);
    },
    onError: () => toast({ title: "Failed to update booking", variant: "destructive" }),
  });

  const recordBalanceMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/bookings/${selectedBooking!.id}/record-balance`, {
        method: recordForm.method,
        amount: Number(recordForm.amount),
        note: recordForm.note || undefined,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      invalidate();
      toast({
        title: "Payment recorded",
        description: data.balanceDue > 0 ? `Remaining balance: $${data.balanceDue.toFixed(2)}` : "Balance fully paid",
      });
      setRecordOpen(false);
      setRecordForm({ method: "cash", amount: "", note: "" });
    },
    onError: (err: Error) => toast({ title: err.message || "Failed to record payment", variant: "destructive" }),
  });

  const sendLinkMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/admin/bookings/${selectedBooking!.id}/send-balance-link`),
    onSuccess: () => toast({ title: "Payment link emailed to customer" }),
    onError: (err: Error) => toast({ title: err.message || "Failed to send link", variant: "destructive" }),
  });

  const rescheduleMutation = useMutation({
    mutationFn: () =>
      apiRequest("PATCH", `/api/admin/bookings/${selectedBooking!.id}/reschedule`, rescheduleForm),
    onSuccess: () => {
      invalidate();
      toast({ title: "Booking rescheduled" });
      setRescheduleOpen(false);
      setSelectedBooking(null);
    },
    onError: (err: Error) => toast({ title: err.message || "Failed to reschedule", variant: "destructive" }),
  });

  // --- Photos ---
  const photosQueryKey = ["/api/bookings", selectedBooking?.id, "photos"];

  const { data: photos, isLoading: photosLoading } = useQuery<BookingPhoto[]>({
    queryKey: photosQueryKey,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/bookings/${selectedBooking!.id}/photos`);
      return res.json();
    },
    enabled: !!selectedBooking?.id,
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch(`/api/admin/bookings/${selectedBooking!.id}/photos`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Upload failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: photosQueryKey });
      toast({ title: t("admin.bookings.photos.uploadSuccess") });
    },
    onError: (err: Error) => toast({ title: err.message || t("admin.bookings.photos.uploadError"), variant: "destructive" }),
  });

  const updateCaptionMutation = useMutation({
    mutationFn: async ({ photoId, caption }: { photoId: number; caption: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/bookings/${selectedBooking!.id}/photos/${photoId}`, { caption });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: photosQueryKey });
      toast({ title: t("admin.bookings.photos.captionSaved") });
    },
    onError: (err: Error) => toast({ title: err.message || t("admin.bookings.photos.captionError"), variant: "destructive" }),
  });

  const deletePhotoMutation = useMutation({
    mutationFn: async (photoId: number) => {
      await apiRequest("DELETE", `/api/admin/bookings/${selectedBooking!.id}/photos/${photoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: photosQueryKey });
      toast({ title: t("admin.bookings.photos.deleted") });
    },
    onError: (err: Error) => toast({ title: err.message || t("admin.bookings.photos.deleteError"), variant: "destructive" }),
  });

  const handleShareLink = () => {
    if (!selectedBooking) return;
    const shareUrl = `${window.location.origin}/bookings/${selectedBooking.id}/photos`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShareLinkCopied(true);
      toast({ title: t("admin.bookings.photos.shareLinkCopied") });
      setTimeout(() => setShareLinkCopied(false), 3000);
    });
  };

  const searchLower = search.trim().toLowerCase();
  const filtered = (bookings || [])
    .filter((b) => (statusFilter === "all" ? true : b.status === statusFilter))
    .filter((b) =>
      !searchLower
        ? true
        : [b.contactName, b.contactEmail, b.contactPhone, b.bookingNumber, b.customerCity]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(searchLower))
    )
    // Upcoming sessions first, then most recent past
    .sort((a, b) => (b.sessionDate || "").localeCompare(a.sessionDate || ""));

  const handleViewDetail = async (booking: Booking) => {
    try {
      const res = await apiRequest("GET", `/api/bookings/${booking.id}`);
      const detail = await res.json();
      setSelectedBooking(detail);
    } catch {
      setSelectedBooking({ ...booking });
    }
  };

  function handleMarkComplete() {
    if (finance && finance.balanceDue > 0.01) {
      setCompletePromptOpen(true);
    } else {
      completeMutation.mutate(selectedBooking!.id);
    }
  }

  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  // Calendar is keyed on the TRAINING SESSION date — this is a schedule, not an intake log.
  const bookingsByDate: Record<string, Booking[]> = {};
  (bookings || []).forEach((b) => {
    if (!b.sessionDate || b.status === "cancelled") return;
    if (!bookingsByDate[b.sessionDate]) bookingsByDate[b.sessionDate] = [];
    bookingsByDate[b.sessionDate].push(b);
  });

  const todayStr = new Date().toISOString().slice(0, 10);

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
              Schedule
            </Button>
          </div>
        </div>

        {view === "list" && (
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, phone, email, booking #"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-booking-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44" data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Needs confirmation</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="no_show">No-show</SelectItem>
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
          <>
            {/* Mobile: card list */}
            <div className="space-y-3 md:hidden">
              {filtered.length === 0 ? (
                <Card><CardContent className="p-6 text-center text-muted-foreground">No bookings found</CardContent></Card>
              ) : (
                filtered.map((booking) => (
                  <Card key={booking.id} data-testid={`card-booking-${booking.id}`}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{booking.contactName}</span>
                        <Badge variant="secondary" className={statusColors[booking.status] || ""}>
                          {statusLabels[booking.status] || booking.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatSession(booking)} · {booking.participantCount} people · ${Number(booking.totalPrice).toFixed(2)}
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button asChild size="sm" variant="outline" className="flex-1">
                          <a href={`tel:${booking.contactPhone}`}><Phone className="h-4 w-4 mr-1" />Call</a>
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => handleViewDetail(booking)}>
                          <Eye className="h-4 w-4 mr-1" />Details
                        </Button>
                        {booking.status === "pending" && (
                          <Button size="sm" className="flex-1" onClick={() => confirmMutation.mutate(booking.id)} disabled={confirmMutation.isPending}>
                            <CheckCircle className="h-4 w-4 mr-1" />Confirm
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Desktop: table */}
            <Card className="hidden md:block">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" data-testid="table-bookings">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="text-left p-3 font-medium">Session</th>
                        <th className="text-left p-3 font-medium">Contact</th>
                        <th className="text-left p-3 font-medium">Location</th>
                        <th className="text-left p-3 font-medium">People</th>
                        <th className="text-left p-3 font-medium">Total</th>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="text-left p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-muted-foreground">
                            No bookings found
                          </td>
                        </tr>
                      ) : (
                        filtered.map((booking) => (
                          <tr key={booking.id} className="border-b" data-testid={`row-booking-${booking.id}`}>
                            <td className="p-3 whitespace-nowrap" data-testid={`text-booking-session-${booking.id}`}>
                              <div className={booking.sessionDate === todayStr ? "font-bold text-brand-orange" : "font-medium"}>
                                {formatSession(booking)}
                              </div>
                              <div className="text-xs text-muted-foreground font-mono">{booking.bookingNumber}</div>
                            </td>
                            <td className="p-3">
                              <div data-testid={`text-booking-contact-${booking.id}`}>{booking.contactName}</div>
                              <div className="text-xs space-x-2">
                                <a href={`tel:${booking.contactPhone}`} className="text-brand-orange hover:underline">{booking.contactPhone}</a>
                                <a href={`mailto:${booking.contactEmail}`} className="text-muted-foreground hover:underline">{booking.contactEmail}</a>
                              </div>
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
                                {statusLabels[booking.status] || booking.status}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1">
                                {booking.status === "pending" && (
                                  <Button
                                    size="sm"
                                    onClick={() => confirmMutation.mutate(booking.id)}
                                    disabled={confirmMutation.isPending}
                                    data-testid={`button-quick-confirm-${booking.id}`}
                                  >
                                    Confirm
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewDetail(booking)}
                                  data-testid={`button-view-booking-${booking.id}`}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <Button variant="ghost" size="icon" onClick={() => setCalendarMonth(new Date(year, month - 1, 1))} data-testid="button-calendar-prev">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-lg" data-testid="text-calendar-month">
                {calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                <span className="block text-xs font-normal text-muted-foreground text-center">Training sessions by date</span>
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
                  const isToday = dateStr === todayStr;
                  return (
                    <div key={day} className={`min-h-[80px] p-1 bg-background ${isToday ? "ring-2 ring-accent ring-inset" : ""}`} data-testid={`calendar-day-${dateStr}`}>
                      <div className={`text-xs mb-1 ${isToday ? "font-bold text-brand-orange" : "font-medium"}`}>{day}</div>
                      {dayBookings.slice(0, 3).map((b) => (
                        <div
                          key={b.id}
                          className={`text-[11px] px-1 py-0.5 rounded mb-0.5 cursor-pointer truncate ${statusColors[b.status] || "bg-muted"}`}
                          onClick={() => handleViewDetail(b)}
                          data-testid={`calendar-booking-${b.id}`}
                        >
                          {b.startTime} {b.contactName} ({b.participantCount})
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

        {/* Detail dialog */}
        <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="text-booking-detail-title">
                Booking {selectedBooking?.bookingNumber}
              </DialogTitle>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={statusColors[selectedBooking.status] || ""} data-testid="badge-detail-status">
                    {statusLabels[selectedBooking.status] || selectedBooking.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatSession(selectedBooking)}
                  </span>
                </div>

                {/* Money */}
                <div className="rounded-lg border bg-muted/30 p-4 space-y-1.5 text-sm" data-testid="booking-finance">
                  {financeLoading ? (
                    <Skeleton className="h-16 w-full" />
                  ) : finance ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Training total</span>
                        <span className="font-medium">${finance.total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Paid so far</span>
                        <span className="font-medium text-brand-green">${finance.paid.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-base">
                        <span className="font-semibold">Balance due</span>
                        <span className={`font-bold ${finance.balanceDue > 0 ? "text-brand-orange" : "text-brand-green"}`} data-testid="text-balance-due">
                          ${finance.balanceDue.toFixed(2)}
                        </span>
                      </div>
                      {finance.balanceDue > 0.01 && (
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <Button size="sm" className="bg-accent text-accent-foreground border-accent-border" onClick={() => { setRecordForm((f) => ({ ...f, amount: finance.balanceDue.toFixed(2) })); setRecordOpen(true); }} data-testid="button-record-balance">
                            <DollarSign className="h-4 w-4 mr-1" />
                            Record Payment
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => sendLinkMutation.mutate()} disabled={sendLinkMutation.isPending} data-testid="button-send-pay-link">
                            {sendLinkMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                            Email Pay Link
                          </Button>
                          <Button size="sm" variant="outline" className="col-span-2" onClick={() => setQrOpen(true)} data-testid="button-show-qr">
                            <QrCode className="h-4 w-4 mr-1" />
                            Show QR for Customer to Scan and Pay
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-muted-foreground">No payment record linked</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span data-testid="text-detail-participants">{selectedBooking.participantCount} participants</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${selectedBooking.contactPhone}`} className="text-brand-orange hover:underline" data-testid="text-detail-phone">{selectedBooking.contactPhone}</a>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${selectedBooking.contactEmail}`} className="text-brand-orange hover:underline truncate" data-testid="text-detail-email">{selectedBooking.contactEmail}</a>
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

                {/* Photos */}
                <div className="space-y-3" data-testid="booking-photos-section">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm flex items-center gap-2">
                      <Camera className="h-4 w-4 text-muted-foreground" />
                      {t("admin.bookings.photos.title")}
                    </div>
                    {photos && photos.length > 0 && (
                      <Button size="sm" variant="outline" onClick={handleShareLink} data-testid="button-share-photos">
                        {shareLinkCopied ? <Link2 className="h-4 w-4 mr-1" /> : <Share2 className="h-4 w-4 mr-1" />}
                        {t("admin.bookings.photos.shareWithCustomer")}
                      </Button>
                    )}
                  </div>

                  {/* Upload button */}
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <span className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-upload-photo">
                      {uploadPhotoMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                      {t("admin.bookings.photos.upload")}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadPhotoMutation.mutate(file);
                        e.target.value = "";
                      }}
                    />
                  </label>

                  {/* Photo grid */}
                  {photosLoading ? (
                    <Skeleton className="h-24 w-full" />
                  ) : photos && photos.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {photos.map((photo) => (
                        <div key={photo.id} className="relative group rounded-lg overflow-hidden border">
                          <img
                            src={photo.url}
                            alt={photo.caption || "Training photo"}
                            className="w-full h-24 object-cover cursor-pointer"
                            onClick={() => setPhotoLightbox(photo)}
                            data-testid={`img-booking-photo-${photo.id}`}
                          />
                          {photo.caption && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                              {photo.caption}
                            </div>
                          )}
                          <button
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePhotoMutation.mutate(photo.id);
                            }}
                            data-testid={`button-delete-photo-${photo.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("admin.bookings.photos.noPhotos")}</p>
                  )}

                  {/* Caption editor for lightbox photo */}
                  {photoLightbox && (
                    <div className="flex gap-2 items-center">
                      <Input
                        placeholder={t("admin.bookings.photos.captionPlaceholder")}
                        value={captionInputs[photoLightbox.id] ?? photoLightbox.caption ?? ""}
                        onChange={(e) => setCaptionInputs((prev) => ({ ...prev, [photoLightbox.id]: e.target.value }))}
                        className="flex-1"
                        data-testid="input-photo-caption"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          updateCaptionMutation.mutate({
                            photoId: photoLightbox.id,
                            caption: captionInputs[photoLightbox.id] ?? "",
                          });
                        }}
                        disabled={updateCaptionMutation.isPending}
                        data-testid="button-save-caption"
                      >
                        {t("common.save")}
                      </Button>
                    </div>
                  )}
                </div>

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
                      onClick={handleMarkComplete}
                      disabled={completeMutation.isPending}
                      data-testid="button-complete-booking"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mark Complete
                    </Button>
                  )}
                  {(selectedBooking.status === "pending" || selectedBooking.status === "confirmed") && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRescheduleForm({
                            sessionDate: selectedBooking.sessionDate || "",
                            startTime: selectedBooking.startTime || "",
                            endTime: selectedBooking.endTime || "",
                          });
                          setRescheduleOpen(true);
                        }}
                        data-testid="button-reschedule-booking"
                      >
                        <CalendarClock className="h-4 w-4 mr-1" />
                        Reschedule
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => noShowMutation.mutate(selectedBooking.id)}
                        disabled={noShowMutation.isPending}
                        data-testid="button-no-show-booking"
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        No-show
                      </Button>
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
                    </>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Record balance payment */}
        <Dialog open={recordOpen} onOpenChange={setRecordOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Record Balance Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>How was it paid?</Label>
                <Select value={recordForm.method} onValueChange={(v) => setRecordForm((f) => ({ ...f, method: v }))}>
                  <SelectTrigger data-testid="select-payment-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="card_reader">Card reader on site</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount received</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={recordForm.amount}
                  onChange={(e) => setRecordForm((f) => ({ ...f, amount: e.target.value }))}
                  data-testid="input-record-amount"
                />
              </div>
              <div className="space-y-2">
                <Label>Note (optional)</Label>
                <Input
                  placeholder="Check #, who paid, etc."
                  value={recordForm.note}
                  onChange={(e) => setRecordForm((f) => ({ ...f, note: e.target.value }))}
                  data-testid="input-record-note"
                />
              </div>
              <Button
                className="w-full bg-accent text-accent-foreground border-accent-border"
                onClick={() => recordBalanceMutation.mutate()}
                disabled={recordBalanceMutation.isPending || !recordForm.amount}
                data-testid="button-save-payment"
              >
                {recordBalanceMutation.isPending ? "Saving..." : "Save Payment"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reschedule */}
        <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Reschedule Training</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>New date</Label>
                <Input
                  type="date"
                  value={rescheduleForm.sessionDate}
                  onChange={(e) => setRescheduleForm((f) => ({ ...f, sessionDate: e.target.value }))}
                  data-testid="input-reschedule-date"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Start</Label>
                  <Input
                    type="time"
                    value={rescheduleForm.startTime}
                    onChange={(e) => setRescheduleForm((f) => ({ ...f, startTime: e.target.value }))}
                    data-testid="input-reschedule-start"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End</Label>
                  <Input
                    type="time"
                    value={rescheduleForm.endTime}
                    onChange={(e) => setRescheduleForm((f) => ({ ...f, endTime: e.target.value }))}
                    data-testid="input-reschedule-end"
                  />
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => rescheduleMutation.mutate()}
                disabled={rescheduleMutation.isPending || !rescheduleForm.sessionDate || !rescheduleForm.startTime || !rescheduleForm.endTime}
                data-testid="button-save-reschedule"
              >
                {rescheduleMutation.isPending ? "Saving..." : "Reschedule"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Complete with outstanding balance prompt */}
        <Dialog open={completePromptOpen} onOpenChange={setCompletePromptOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Balance still due</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <p>
                This booking still has <span className="font-bold text-brand-orange">${finance?.balanceDue.toFixed(2)}</span> outstanding.
                Collect it before closing out the training.
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  className="bg-accent text-accent-foreground border-accent-border"
                  onClick={() => { setCompletePromptOpen(false); setRecordForm((f) => ({ ...f, amount: finance!.balanceDue.toFixed(2) })); setRecordOpen(true); }}
                  data-testid="button-collect-first"
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  Record payment now
                </Button>
                <Button variant="outline" onClick={() => { setCompletePromptOpen(false); setQrOpen(true); }} data-testid="button-show-qr-first">
                  <QrCode className="h-4 w-4 mr-1" />
                  Show QR so they can pay now
                </Button>
                <Button variant="outline" onClick={() => sendLinkMutation.mutate()} disabled={sendLinkMutation.isPending} data-testid="button-email-link-first">
                  <Send className="h-4 w-4 mr-1" />
                  Email customer a pay link
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => completeMutation.mutate(selectedBooking!.id)}
                  disabled={completeMutation.isPending}
                  data-testid="button-complete-anyway"
                >
                  Mark complete anyway (balance stays due)
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Pay-balance QR code (customer scans on their own phone) */}
        {selectedBooking && finance && (
          <PayLinkQRDialog
            open={qrOpen}
            onOpenChange={setQrOpen}
            bookingId={selectedBooking.id}
            customerName={selectedBooking.contactName}
            amountDue={finance.balanceDue}
          />
        )}

        {/* Photo lightbox */}
        <Dialog open={!!photoLightbox} onOpenChange={() => setPhotoLightbox(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t("admin.bookings.photos.viewPhoto")}</DialogTitle>
            </DialogHeader>
            {photoLightbox && (
              <div className="space-y-3">
                <img
                  src={photoLightbox.url}
                  alt={photoLightbox.caption || "Training photo"}
                  className="w-full rounded-lg max-h-[60vh] object-contain"
                  data-testid="img-lightbox"
                />
                {photoLightbox.caption && (
                  <p className="text-sm text-muted-foreground">{photoLightbox.caption}</p>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
