import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { catalog } from "@/data/catalog";
import type { ServiceArea } from "@shared/schema";
import { programsForArea, autoPrice, AREA_FACILITY } from "@shared/manual-booking";
import { leadToBookingDefaults, programForLead, type LeadForBooking } from "@shared/lead-prefill";

interface NewBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** On-site request to book (meeting 2026-10-26): prefills the form, and the
   * server marks the request scheduled once the booking is created. */
  fromLead?: (LeadForBooking & { id: number }) | null;
  onCreated?: (booking: { id: number; bookingNumber: string }) => void;
}

/**
 * Admin manual booking (Alberto 2026-07-28, #6): record a phone/in-person
 * booking so the calendar and trainer availability stay accurate. No online
 * payment is captured - the office collects by its normal channel and
 * reconciles via the booking finance tools.
 */
export default function NewBookingDialog({ open, onOpenChange, fromLead, onCreated }: NewBookingDialogProps) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    serviceAreaId: "",
    productSlug: "",
    // "facility" = at our training site; "onsite" = trainer goes to the
    // customer's address (meeting 2026-10-14: match the onsite location list).
    where: "facility" as "facility" | "onsite",
    // true once Alberto types a price himself (discounts); stops auto-fill.
    priceEdited: false,
    sessionDate: "",
    startTime: "09:00",
    endTime: "13:00",
    participantCount: "1",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    customerAddress: "",
    customerCity: "",
    customerState: "",
    customerZip: "",
    specialRequests: "",
    totalPrice: "",
    status: "confirmed",
    // Office-collected payment (meeting 2026-10-13): phone/walk-in customers
    // often pay by check. "unpaid" = record it later from the booking.
    paymentStatus: "unpaid" as "unpaid" | "paid",
    paymentMethod: "check",
    paymentAmount: "",
    paymentReference: "",
  });

  const { data: serviceAreas } = useQuery<ServiceArea[]>({ queryKey: ["/api/service-areas"] });

  // Prefill once per opening from the on-site request.
  const prefilledFor = useRef<number | null>(null);
  useEffect(() => {
    if (!open) { prefilledFor.current = null; return; }
    if (!fromLead || !serviceAreas || prefilledFor.current === fromLead.id) return;
    prefilledFor.current = fromLead.id;
    const d = leadToBookingDefaults(fromLead);
    const area = serviceAreas.find((a) => a.slug === d.areaSlug);
    const list = programsForArea(catalog as any, area?.slug);
    const program = programForLead(list, fromLead);
    setForm((f) => ({
      ...f,
      serviceAreaId: area ? String(area.id) : "",
      productSlug: program?.slug ?? "",
      where: d.where,
      priceEdited: false,
      sessionDate: d.sessionDate,
      participantCount: d.participantCount,
      contactName: d.contactName,
      contactPhone: d.contactPhone,
      contactEmail: d.contactEmail,
      customerAddress: d.customerAddress,
      customerCity: d.customerCity,
      customerState: d.customerState,
      customerZip: d.customerZip,
      specialRequests: d.specialRequests,
      totalPrice: autoPrice((program as any)?.price, d.participantCount),
    }));
  }, [open, fromLead, serviceAreas]);

  const selectedArea = useMemo(
    () => serviceAreas?.find((a) => String(a.id) === form.serviceAreaId),
    [serviceAreas, form.serviceAreaId]
  );
  const timeSlots = (selectedArea?.availabilityRules as any)?.timeSlots ?? [];

  // Only the programs offered at the chosen location (no duplicates across
  // cities), price filled in from the program x participants.
  const programs = useMemo(
    () => programsForArea(catalog as any, selectedArea?.slug),
    [selectedArea?.slug],
  );

  function pickArea(id: string) {
    const area = serviceAreas?.find((a) => String(a.id) === id);
    const list = programsForArea(catalog as any, area?.slug);
    const keep = list.find((p) => p.slug === form.productSlug) ?? list[0];
    set({
      serviceAreaId: id,
      productSlug: keep?.slug ?? "",
      ...(form.priceEdited ? {} : { totalPrice: autoPrice(keep?.price, form.participantCount) }),
    });
  }
  function pickProgram(slug: string) {
    const p = programs.find((x) => x.slug === slug);
    set({ productSlug: slug, ...(form.priceEdited ? {} : { totalPrice: autoPrice(p?.price, form.participantCount) }) });
  }
  function pickCount(count: string) {
    const p = programs.find((x) => x.slug === form.productSlug);
    set({ participantCount: count, ...(form.priceEdited ? {} : { totalPrice: autoPrice(p?.price, count) }) });
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/bookings", {
        serviceAreaId: Number(form.serviceAreaId),
        productSlug: form.productSlug,
        sessionDate: form.sessionDate,
        startTime: form.startTime,
        endTime: form.endTime,
        participantCount: Number(form.participantCount),
        contactName: form.contactName,
        contactPhone: form.contactPhone,
        contactEmail: form.contactEmail,
        customerAddress: form.customerAddress,
        customerCity: form.customerCity,
        customerState: form.customerState,
        customerZip: form.customerZip,
        specialRequests: [
          form.where === "onsite" ? "ONSITE: training at the customer's location (address above)." : "",
          form.specialRequests,
        ].filter(Boolean).join("\n") || undefined,
        totalPrice: form.totalPrice || "0",
        status: form.status,
        originatingLeadId: fromLead?.id,
        payment: form.paymentStatus === "paid"
          ? {
              method: form.paymentMethod,
              amount: Number(form.paymentAmount || form.totalPrice || 0),
              reference: form.paymentReference || undefined,
            }
          : undefined,
      });
      return res.json();
    },
    onSuccess: (b) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      if (fromLead) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/onsite-requests"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/leads", String(fromLead.id), "activities"] });
      }
      onCreated?.(b);
      toast({
        title: `Booking ${b.bookingNumber} created`,
        description: form.paymentStatus === "paid" ? "Payment recorded." : undefined,
      });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({ title: "Could not create booking", description: err.message, variant: "destructive" });
    },
  });

  const paymentAmount = Number(form.paymentAmount || form.totalPrice || 0);
  const paymentOk = form.paymentStatus === "unpaid" || (paymentAmount > 0 && paymentAmount <= Number(form.totalPrice || 0) + 0.01);
  const onsiteAddressOk = form.where === "facility" || (form.customerAddress && form.customerCity && form.customerState && form.customerZip);
  const canSubmit =
    form.serviceAreaId && form.productSlug && onsiteAddressOk && form.sessionDate && form.contactName && form.contactPhone && form.contactEmail && Number(form.participantCount) > 0 && paymentOk;

  function set(patch: Partial<typeof form>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{fromLead ? "New booking from quote request" : "New booking (manual)"}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-1">
          For phone / in-person bookings. Updates the calendar and trainer availability automatically. No card is charged here: if the customer paid by check or cash, record it below.
        </p>

        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Location *</Label>
              <Select value={form.serviceAreaId} onValueChange={pickArea}>
                <SelectTrigger data-testid="select-nb-area"><SelectValue placeholder="Choose location" /></SelectTrigger>
                <SelectContent>
                  {(serviceAreas ?? []).filter((a) => AREA_FACILITY[a.slug]).map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Where *</Label>
              <Select value={form.where} onValueChange={(v) => set({ where: v as "facility" | "onsite" })}>
                <SelectTrigger data-testid="select-nb-where"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="facility">At our {selectedArea?.name ?? ""} facility</SelectItem>
                  <SelectItem value="onsite">At the customer's location</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Program *</Label>
            <Select value={form.productSlug} onValueChange={pickProgram} disabled={!selectedArea}>
              <SelectTrigger data-testid="select-nb-product">
                <SelectValue placeholder={selectedArea ? "Choose program" : "Choose a location first"} />
              </SelectTrigger>
              <SelectContent>
                {programs.map((p) => (
                  <SelectItem key={p.slug} value={p.slug}>{p.title} · ${p.price}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5 col-span-1">
              <Label>Date *</Label>
              <Input type="date" value={form.sessionDate} onChange={(e) => set({ sessionDate: e.target.value })} data-testid="input-nb-date" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Time slot *</Label>
              {timeSlots.length > 0 ? (
                <Select value={`${form.startTime}-${form.endTime}`} onValueChange={(v) => { const [s, e] = v.split("-"); set({ startTime: s, endTime: e }); }}>
                  <SelectTrigger data-testid="select-nb-slot"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((s: any) => (
                      <SelectItem key={`${s.startTime}-${s.endTime}`} value={`${s.startTime}-${s.endTime}`}>{s.startTime} - {s.endTime}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Start (09:00)" value={form.startTime} onChange={(e) => set({ startTime: e.target.value })} data-testid="input-nb-start" />
                  <Input placeholder="End (13:00)" value={form.endTime} onChange={(e) => set({ endTime: e.target.value })} data-testid="input-nb-end" />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Participants *</Label>
              <Input type="number" min={1} value={form.participantCount} onChange={(e) => pickCount(e.target.value)} data-testid="input-nb-count" />
            </div>
            <div className="space-y-1.5">
              <Label>Total price ($)</Label>
              <Input type="number" min={0} step="0.01" placeholder="0.00" value={form.totalPrice} onChange={(e) => set({ totalPrice: e.target.value, priceEdited: true })} data-testid="input-nb-price" />
              <p className="text-xs text-muted-foreground">{form.priceEdited ? "Custom price" : "From program price; edit for a discount"}</p>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set({ status: v })}>
                <SelectTrigger data-testid="select-nb-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Contact name *</Label>
              <Input value={form.contactName} onChange={(e) => set({ contactName: e.target.value })} data-testid="input-nb-name" />
            </div>
            <div className="space-y-1.5">
              <Label>Contact phone *</Label>
              <Input type="tel" value={form.contactPhone} onChange={(e) => set({ contactPhone: e.target.value })} data-testid="input-nb-phone" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Contact email *</Label>
            <Input type="email" value={form.contactEmail} onChange={(e) => set({ contactEmail: e.target.value })} data-testid="input-nb-email" />
          </div>

          <div className="space-y-1.5">
            <Label>
              {form.where === "onsite" ? "Training address *" : "Customer address"}{" "}
              <span className="text-muted-foreground font-normal">{form.where === "onsite" ? "(where the trainer goes)" : "(optional)"}</span>
            </Label>
            <Input placeholder="Street" value={form.customerAddress} onChange={(e) => set({ customerAddress: e.target.value })} data-testid="input-nb-address" />
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Input placeholder="City" value={form.customerCity} onChange={(e) => set({ customerCity: e.target.value })} data-testid="input-nb-city" />
              <Input placeholder="State" value={form.customerState} onChange={(e) => set({ customerState: e.target.value })} data-testid="input-nb-state" />
              <Input placeholder="ZIP" value={form.customerZip} onChange={(e) => set({ customerZip: e.target.value })} data-testid="input-nb-zip" />
            </div>
          </div>

          {/* Payment collected by the office (check / cash / card reader). */}
          <div className="space-y-3 rounded-md border p-3" data-testid="section-nb-payment">
            <Label>Payment</Label>
            <Select value={form.paymentStatus} onValueChange={(v) => set({ paymentStatus: v as "unpaid" | "paid" })}>
              <SelectTrigger data-testid="select-nb-payment-status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unpaid">Not paid yet (record it later)</SelectItem>
                <SelectItem value="paid">Paid now</SelectItem>
              </SelectContent>
            </Select>
            {form.paymentStatus === "paid" && (
              <div className="grid grid-cols-3 gap-2">
                <Select value={form.paymentMethod} onValueChange={(v) => set({ paymentMethod: v })}>
                  <SelectTrigger data-testid="select-nb-payment-method"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card_reader">Card reader</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number" min={0} step="0.01"
                  placeholder={form.totalPrice ? `$${Number(form.totalPrice).toFixed(2)}` : "Amount"}
                  value={form.paymentAmount}
                  onChange={(e) => set({ paymentAmount: e.target.value })}
                  data-testid="input-nb-payment-amount"
                />
                <Input
                  placeholder={form.paymentMethod === "check" ? "Check #" : "Reference"}
                  value={form.paymentReference}
                  onChange={(e) => set({ paymentReference: e.target.value })}
                  data-testid="input-nb-payment-reference"
                />
              </div>
            )}
            {form.paymentStatus === "paid" && !paymentOk && (
              <p className="text-xs text-destructive" data-testid="text-nb-payment-error">
                {Number(form.totalPrice || 0) > 0 ? "Payment can't be more than the total price." : "Enter the total price first."}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={2} value={form.specialRequests} onChange={(e) => set({ specialRequests: e.target.value })} data-testid="textarea-nb-notes" />
          </div>

          <Button className="w-full" disabled={!canSubmit || createMutation.isPending} onClick={() => createMutation.mutate()} data-testid="button-nb-submit">
            {createMutation.isPending ? (<><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating...</>) : "Create booking"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
