import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import type { BookingAttendee } from "@shared/schema";

interface AttendeeNamesFormProps {
  bookingId: number;
  participantCount: number;
}

interface AttendeesResponse {
  bookingId: number;
  participantCount: number;
  attendees: BookingAttendee[];
  openSeats: number;
}

interface DraftRow {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

/**
 * Optional per-seat attendee names (Alberto meeting 2026-07-28). The manager
 * buying a multi-seat booking often doesn't know the final trainee names at
 * purchase, so entry is OPTIONAL and can be done/edited any time after
 * booking. Saved to booking_attendees; trainees can also self-register via
 * the on-site QR sign-in (source="signin").
 */
export default function AttendeeNamesForm({ bookingId, participantCount }: AttendeeNamesFormProps) {
  const { toast } = useToast();
  const [rows, setRows] = useState<DraftRow[]>([]);

  const { data, isLoading } = useQuery<AttendeesResponse>({
    queryKey: ["/api/bookings", bookingId, "attendees"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/bookings/${bookingId}/attendees`);
      return res.json();
    },
  });

  const saved = data?.attendees ?? [];
  const openSeats = data?.openSeats ?? Math.max(0, participantCount - saved.length);

  const saveMutation = useMutation({
    mutationFn: async (attendees: DraftRow[]) => {
      const res = await apiRequest("POST", `/api/bookings/${bookingId}/attendees`, { attendees });
      return res.json();
    },
    onSuccess: (d) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings", bookingId, "attendees"] });
      setRows([]);
      toast({ title: d.added ? `Saved ${d.added} attendee${d.added === 1 ? "" : "s"}` : "Saved" });
    },
    onError: (err: Error) => {
      toast({ title: "Could not save attendees", description: err.message, variant: "destructive" });
    },
  });

  function addRow() {
    if (rows.length >= openSeats) return;
    setRows([...rows, { firstName: "", lastName: "", email: "", phone: "" }]);
  }
  function updateRow(i: number, patch: Partial<DraftRow>) {
    setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function removeRow(i: number) {
    setRows(rows.filter((_, idx) => idx !== i));
  }
  function handleSave() {
    const filled = rows.filter((r) => r.firstName.trim() || r.lastName.trim());
    if (filled.length === 0) return;
    saveMutation.mutate(filled);
  }

  return (
    <div className="text-left space-y-4" data-testid="attendee-names-form">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-accent" />
        <h3 className="font-semibold text-foreground">Who's attending? <span className="text-muted-foreground font-normal text-sm">(optional)</span></h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Add names now or later - trainees can also sign themselves in on the day with the class QR code.
      </p>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" />Loading...</div>
      ) : (
        <>
          {saved.length > 0 && (
            <ul className="space-y-1.5">
              {saved.map((a) => (
                <li key={a.id} className="flex items-center gap-2 text-sm rounded-md border bg-muted/40 px-3 py-2" data-testid={`attendee-saved-${a.id}`}>
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <span className="font-medium">{[a.firstName, a.lastName].filter(Boolean).join(" ") || "Unnamed"}</span>
                  {a.email && <span className="text-muted-foreground truncate">· {a.email}</span>}
                  {a.source === "signin" && <span className="ml-auto text-xs text-muted-foreground shrink-0">signed in</span>}
                </li>
              ))}
            </ul>
          )}

          {openSeats > 0 && (
            <div className="space-y-3">
              {rows.map((r, i) => (
                <div key={i} className="grid grid-cols-2 gap-2 items-start rounded-md border p-3">
                  <Input placeholder="First name" value={r.firstName} onChange={(e) => updateRow(i, { firstName: e.target.value })} data-testid={`input-attendee-first-${i}`} />
                  <div className="flex gap-2">
                    <Input placeholder="Last name" value={r.lastName} onChange={(e) => updateRow(i, { lastName: e.target.value })} data-testid={`input-attendee-last-${i}`} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(i)} aria-label="Remove" data-testid={`button-remove-attendee-${i}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <Input placeholder="Email (optional)" type="email" value={r.email} onChange={(e) => updateRow(i, { email: e.target.value })} className="col-span-2" data-testid={`input-attendee-email-${i}`} />
                </div>
              ))}

              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={addRow} disabled={rows.length >= openSeats} data-testid="button-add-attendee">
                  <Plus className="w-4 h-4 mr-1" />Add attendee ({openSeats - rows.length} seat{openSeats - rows.length === 1 ? "" : "s"} left)
                </Button>
                {rows.length > 0 && (
                  <Button type="button" size="sm" onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-attendees">
                    {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                    Save names
                  </Button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
