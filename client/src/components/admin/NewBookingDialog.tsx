import { useMemo, useState } from "react";
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

interface NewBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Admin manual booking (Alberto 2026-07-28, #6): record a phone/in-person
 * booking so the calendar and trainer availability stay accurate. No online
 * payment is captured - the office collects by its normal channel and
 * reconciles via the booking finance tools.
 */
export default function NewBookingDialog({ open, onOpenChange }: NewBookingDialogProps) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    serviceAreaId: "",
    productSlug: "standard-forklift-certification",
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
  });

  const { data: serviceAreas } = useQuery<ServiceArea[]>({ queryKey: ["/api/service-areas"] });

  const selectedArea = useMemo(
    () => serviceAreas?.find((a) => String(a.id) === form.serviceAreaId),
    [serviceAreas, form.serviceAreaId]
  );
  const timeSlots = (selectedArea?.availabilityRules as any)?.timeSlots ?? [];

  const handsOnProducts = useMemo(() => catalog.filter((p) => p.category === "hands-on"), []);

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
        specialRequests: form.specialRequests || undefined,
        totalPrice: form.totalPrice || "0",
        status: form.status,
      });
      return res.json();
    },
    onSuccess: (b) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/today"] });
      toast({ title: `Booking ${b.bookingNumber} created` });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({ title: "Could not create booking", description: err.message, variant: "destructive" });
    },
  });

  const canSubmit =
    form.serviceAreaId && form.sessionDate && form.contactName && form.contactPhone && form.contactEmail && Number(form.participantCount) > 0;

  function set(patch: Partial<typeof form>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New booking (manual)</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-1">
          For phone / in-person bookings. Updates the calendar and trainer availability automatically. No online payment is taken here.
        </p>

        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Location *</Label>
              <Select value={form.serviceAreaId} onValueChange={(v) => set({ serviceAreaId: v })}>
                <SelectTrigger data-testid="select-nb-area"><SelectValue placeholder="Choose location" /></SelectTrigger>
                <SelectContent>
                  {(serviceAreas ?? []).map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Program *</Label>
              <Select value={form.productSlug} onValueChange={(v) => set({ productSlug: v })}>
                <SelectTrigger data-testid="select-nb-product"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {handsOnProducts.map((p) => (
                    <SelectItem key={p.slug} value={p.slug}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              <Input type="number" min={1} value={form.participantCount} onChange={(e) => set({ participantCount: e.target.value })} data-testid="input-nb-count" />
            </div>
            <div className="space-y-1.5">
              <Label>Total price ($)</Label>
              <Input type="number" min={0} step="0.01" placeholder="0.00" value={form.totalPrice} onChange={(e) => set({ totalPrice: e.target.value })} data-testid="input-nb-price" />
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
            <Label>Training address <span className="text-muted-foreground font-normal">(if onsite)</span></Label>
            <Input placeholder="Street" value={form.customerAddress} onChange={(e) => set({ customerAddress: e.target.value })} data-testid="input-nb-address" />
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Input placeholder="City" value={form.customerCity} onChange={(e) => set({ customerCity: e.target.value })} data-testid="input-nb-city" />
              <Input placeholder="State" value={form.customerState} onChange={(e) => set({ customerState: e.target.value })} data-testid="input-nb-state" />
              <Input placeholder="ZIP" value={form.customerZip} onChange={(e) => set({ customerZip: e.target.value })} data-testid="input-nb-zip" />
            </div>
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
