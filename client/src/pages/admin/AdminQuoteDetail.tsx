import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft, Building2, User, FileText, MapPin, DollarSign,
  Loader2, Calendar, Link2, ExternalLink,
} from "lucide-react";
import {
  VALID_QUOTE_TRANSITIONS,
  QUOTE_STATUS_LABELS,
  TERMINAL_QUOTE_STATUSES,
  type QuoteStatus,
} from "@shared/config/quote-states";
import { getAllLocations } from "@shared/config/locations";

interface QuoteDetail {
  id: number;
  companyId: number | null;
  contactId: number | null;
  originatingLeadId: number | null;
  linkedTrainingEventId: number | null;
  status: QuoteStatus;
  title: string;
  participantCount: number | null;
  locationType: string | null;
  locationSlug: string | null;
  onsiteStreet: string | null;
  onsiteCity: string | null;
  onsiteState: string | null;
  onsiteZip: string | null;
  equipmentTypes: string[];
  subtotal: number;
  total: number;
  pricingNotes: string | null;
  internalNotes: string | null;
  validUntil: string | null;
  sentAt: string | null;
  approvedAt: string | null;
  declinedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const statusColorMap: Record<QuoteStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  approved: "bg-emerald-100 text-emerald-700",
  declined: "bg-red-100 text-red-700",
  expired: "bg-amber-100 text-amber-700",
  converted: "bg-violet-100 text-violet-700",
  canceled: "bg-zinc-100 text-zinc-700",
};

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((cents ?? 0) / 100);
}

function formatDateTime(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

export default function AdminQuoteDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { toast } = useToast();
  const allLocations = getAllLocations();

  const [editingNotes, setEditingNotes] = useState(false);
  const [internalNotesValue, setInternalNotesValue] = useState("");
  const [pricingNotesValue, setPricingNotesValue] = useState("");
  const [convertOpen, setConvertOpen] = useState(false);
  const [convertStart, setConvertStart] = useState("");
  const [convertEnd, setConvertEnd] = useState("");
  const [convertTz, setConvertTz] = useState("America/Los_Angeles");

  const { data, isLoading } = useQuery<{
    quote: QuoteDetail;
    company: { id: number; name: string } | null;
    contact: { id: number; firstName: string; lastName: string; email: string } | null;
    lead: { id: number; contactName: string } | null;
    trainingEvent: { id: number; title: string; status: string } | null;
  }>({
    queryKey: ["/api/admin/quotes", id],
  });

  const quote = data?.quote;
  const company = data?.company;
  const contact = data?.contact;
  const lead = data?.lead;
  const trainingEvent = data?.trainingEvent;

  const isTerminal = quote ? TERMINAL_QUOTE_STATUSES.includes(quote.status) : false;
  const allowedTransitions = quote
    ? (VALID_QUOTE_TRANSITIONS[quote.status] ?? []).filter((s) => s !== "converted")
    : [];

  const statusMutation = useMutation({
    mutationFn: (status: QuoteStatus) =>
      apiRequest("PATCH", `/api/admin/quotes/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes"] });
      toast({ title: "Status updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest("PATCH", `/api/admin/quotes/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes", id] });
      toast({ title: "Quote updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const convertMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/admin/quotes/${id}/convert`, {
      scheduledStart: convertStart || null,
      scheduledEnd: convertEnd || null,
      timezone: convertStart || convertEnd ? convertTz : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/training-events"] });
      toast({ title: "Quote converted to training event" });
      setConvertOpen(false);
    },
    onError: async (e: Error) => {
      toast({ title: "Convert failed", description: e.message, variant: "destructive" });
    },
  });

  const handleSaveNotes = () => {
    updateMutation.mutate({ internalNotes: internalNotesValue, pricingNotes: pricingNotesValue });
    setEditingNotes(false);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (!quote) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Quote Not Found</h2>
          <Link href="/admin/quotes">
            <Button variant="outline">Back to Quotes</Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="admin-quote-detail">
        <div className="flex items-center gap-4">
          <Link href="/admin/quotes">
            <Button variant="ghost" size="icon" data-testid="button-back-quotes">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold" data-testid="text-quote-title">{quote.title}</h1>
              <Badge className={statusColorMap[quote.status]} data-testid="badge-quote-status">
                {QUOTE_STATUS_LABELS[quote.status]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Quote #{quote.id} &middot; Created {formatDateTime(quote.createdAt)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="border rounded-lg p-5 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Pricing
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Subtotal</Label>
                  <p className="font-medium" data-testid="text-quote-subtotal">{formatMoney(quote.subtotal)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Total</Label>
                  <p className="text-lg font-bold" data-testid="text-quote-total">{formatMoney(quote.total)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Participants</Label>
                  <p className="font-medium">{quote.participantCount ?? "—"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Valid Until</Label>
                  <p className="font-medium">{formatDateTime(quote.validUntil)}</p>
                </div>
                {quote.equipmentTypes.length > 0 && (
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Equipment Types</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {quote.equipmentTypes.map((e) => (
                        <Badge key={e} variant="outline" className="text-xs">{e}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border rounded-lg p-5 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Location
              </h2>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <p className="font-medium capitalize" data-testid="text-quote-location-type">
                    {quote.locationType === "facility" ? "Facility" : quote.locationType === "customer_onsite" ? "Customer On-Site" : "—"}
                  </p>
                </div>
                {quote.locationType === "facility" && quote.locationSlug && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Facility</Label>
                    <p className="font-medium">
                      {allLocations.find((l) => l.slug === quote.locationSlug)?.displayName ?? quote.locationSlug}
                    </p>
                  </div>
                )}
                {quote.locationType === "customer_onsite" && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Address</Label>
                    <p className="font-medium" data-testid="text-quote-onsite-address">
                      {[quote.onsiteStreet, quote.onsiteCity, quote.onsiteState, quote.onsiteZip].filter(Boolean).join(", ") || "Not provided"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="border rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Notes
                </h2>
                {!isTerminal && !editingNotes && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setInternalNotesValue(quote.internalNotes ?? "");
                      setPricingNotesValue(quote.pricingNotes ?? "");
                      setEditingNotes(true);
                    }}
                    data-testid="button-edit-quote-notes"
                  >
                    Edit
                  </Button>
                )}
              </div>
              {editingNotes ? (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Pricing Notes (visible on quote)</Label>
                    <Textarea
                      value={pricingNotesValue}
                      onChange={(e) => setPricingNotesValue(e.target.value)}
                      rows={3}
                      data-testid="textarea-pricing-notes"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Internal Notes (admin only)</Label>
                    <Textarea
                      value={internalNotesValue}
                      onChange={(e) => setInternalNotesValue(e.target.value)}
                      rows={3}
                      data-testid="textarea-internal-notes"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveNotes} disabled={updateMutation.isPending} data-testid="button-save-quote-notes">
                      {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingNotes(false)} data-testid="button-cancel-quote-notes">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">Pricing Notes</Label>
                    <p className="whitespace-pre-wrap text-muted-foreground" data-testid="text-pricing-notes">
                      {quote.pricingNotes || "—"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Internal Notes</Label>
                    <p className="whitespace-pre-wrap text-muted-foreground" data-testid="text-internal-notes">
                      {quote.internalNotes || "—"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="border rounded-lg p-5 space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Lifecycle
              </h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Sent:</span> {formatDateTime(quote.sentAt)}</div>
                <div><span className="text-muted-foreground">Approved:</span> {formatDateTime(quote.approvedAt)}</div>
                <div><span className="text-muted-foreground">Declined:</span> {formatDateTime(quote.declinedAt)}</div>
                <div><span className="text-muted-foreground">Updated:</span> {formatDateTime(quote.updatedAt)}</div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {!isTerminal && allowedTransitions.length > 0 && (
              <div className="border rounded-lg p-5 space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Update Status</h2>
                <div className="grid gap-2">
                  {allowedTransitions.map((s) => (
                    <Button
                      key={s}
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      disabled={statusMutation.isPending}
                      onClick={() => statusMutation.mutate(s)}
                      data-testid={`button-quote-status-${s}`}
                    >
                      {statusMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Mark as {QUOTE_STATUS_LABELS[s]}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {quote.status === "approved" && !quote.linkedTrainingEventId && (
              <div className="border rounded-lg p-5 space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Convert</h2>
                <p className="text-xs text-muted-foreground">
                  Create a training event linked to this quote. Schedule fields are optional.
                </p>
                <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" data-testid="button-open-convert">
                      <Link2 className="h-4 w-4 mr-2" />
                      Convert to Training Event
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Convert Quote to Training Event</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <Label>Scheduled Start</Label>
                        <Input
                          type="datetime-local"
                          value={convertStart}
                          onChange={(e) => setConvertStart(e.target.value)}
                          data-testid="input-convert-start"
                        />
                      </div>
                      <div>
                        <Label>Scheduled End</Label>
                        <Input
                          type="datetime-local"
                          value={convertEnd}
                          onChange={(e) => setConvertEnd(e.target.value)}
                          data-testid="input-convert-end"
                        />
                      </div>
                      <div>
                        <Label>Timezone</Label>
                        <Input
                          value={convertTz}
                          onChange={(e) => setConvertTz(e.target.value)}
                          placeholder="America/Los_Angeles"
                          data-testid="input-convert-tz"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setConvertOpen(false)}>Cancel</Button>
                      <Button
                        onClick={() => convertMutation.mutate()}
                        disabled={convertMutation.isPending}
                        data-testid="button-confirm-convert"
                      >
                        {convertMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Convert
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            <div className="border rounded-lg p-5 space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Linked Records</h2>

              {company && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Company</Label>
                  <Link href={`/admin/companies/${company.id}`}>
                    <div className="flex items-center gap-2 text-sm text-primary hover:underline cursor-pointer" data-testid="link-quote-company">
                      <Building2 className="h-4 w-4" />
                      {company.name}
                    </div>
                  </Link>
                </div>
              )}

              {contact && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Contact</Label>
                  <div className="text-sm" data-testid="text-quote-contact">
                    <User className="h-4 w-4 inline mr-1" />
                    {contact.firstName} {contact.lastName}
                  </div>
                </div>
              )}

              {lead && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Originating Lead</Label>
                  <Link href={`/admin/onsite-requests/${lead.id}`}>
                    <div className="flex items-center gap-2 text-sm text-primary hover:underline cursor-pointer" data-testid="link-quote-lead">
                      #{lead.id} — {lead.contactName}
                    </div>
                  </Link>
                </div>
              )}

              {trainingEvent && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Training Event</Label>
                  <Link href={`/admin/training-events/${trainingEvent.id}`}>
                    <div className="flex items-center gap-2 text-sm text-primary hover:underline cursor-pointer" data-testid="link-quote-training-event">
                      <ExternalLink className="h-4 w-4" />
                      #{trainingEvent.id} — {trainingEvent.title}
                    </div>
                  </Link>
                </div>
              )}

              {!company && !contact && !lead && !trainingEvent && (
                <p className="text-sm text-muted-foreground">No linked records</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
