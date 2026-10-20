import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Trash2, Loader2, CheckCircle2, Pencil, X } from "lucide-react";
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
 *
 * Peter 2026-09-07: added edit + delete for saved attendees (not just add).
 */
export default function AttendeeNamesForm({ bookingId, participantCount }: AttendeeNamesFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<DraftRow>({ firstName: "", lastName: "", email: "", phone: "" });

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
      toast({ title: d.added ? t("attendeeNames.savedCount", { count: d.added }) : t("attendeeNames.saved") });
    },
    onError: (err: Error) => {
      toast({ title: t("attendeeNames.saveFailed"), description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data: patch }: { id: number; data: Partial<DraftRow> }) => {
      const res = await apiRequest("PATCH", `/api/bookings/${bookingId}/attendees/${id}`, patch);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings", bookingId, "attendees"] });
      setEditingId(null);
      toast({ title: t("attendeeNames.updated") });
    },
    onError: (err: Error) => {
      toast({ title: t("attendeeNames.updateFailed"), description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/bookings/${bookingId}/attendees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings", bookingId, "attendees"] });
      toast({ title: t("attendeeNames.removed") });
    },
    onError: (err: Error) => {
      toast({ title: t("attendeeNames.removeFailed"), description: err.message, variant: "destructive" });
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
    // 2026-09-03 (Alberto): BOTH first and last name are required - the name
    // collected here is what gets printed on the certification license, and
    // crew members tend to enter just a first name ("George") when allowed.
    const filled = rows.filter((r) => r.firstName.trim() || r.lastName.trim());
    if (filled.length === 0) return;
    const incomplete = filled.some((r) => !r.firstName.trim() || !r.lastName.trim());
    if (incomplete) {
      toast({
        title: t("attendeeNames.nameRequiredTitle"),
        description: t("attendeeNames.nameRequiredDesc"),
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate(filled);
  }

  function startEdit(a: BookingAttendee) {
    setEditingId(a.id);
    setEditRow({
      firstName: a.firstName || "",
      lastName: a.lastName || "",
      email: a.email || "",
      phone: a.phone || "",
    });
  }

  function handleUpdate() {
    if (!editingId) return;
    if (!editRow.firstName.trim() || !editRow.lastName.trim()) {
      toast({
        title: t("attendeeNames.nameRequiredTitle"),
        description: t("attendeeNames.nameRequiredDesc"),
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate({ id: editingId, data: editRow });
  }

  function handleDelete(id: number) {
    if (!confirm(t("attendeeNames.confirmRemove"))) return;
    deleteMutation.mutate(id);
  }

  return (
    <div className="text-left space-y-4" data-testid="attendee-names-form">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-accent" />
        <h3 className="font-semibold text-foreground">{t("attendeeNames.heading")}</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        {t("attendeeNames.intro")}
      </p>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" />{t("attendeeNames.loading")}</div>
      ) : (
        <>
          {saved.length > 0 && (
            <ul className="space-y-1.5">
              {saved.map((a) => (
                <li key={a.id} className="rounded-md border bg-muted/40 px-3 py-2" data-testid={`attendee-saved-${a.id}`}>
                  {editingId === a.id ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder={t("attendeeNames.firstNamePlaceholder")} value={editRow.firstName} onChange={(e) => setEditRow({ ...editRow, firstName: e.target.value })} data-testid={`edit-attendee-first-${a.id}`} />
                        <Input placeholder={t("attendeeNames.lastNamePlaceholder")} value={editRow.lastName} onChange={(e) => setEditRow({ ...editRow, lastName: e.target.value })} data-testid={`edit-attendee-last-${a.id}`} />
                      </div>
                      <Input placeholder={t("attendeeNames.emailPlaceholder")} type="email" value={editRow.email} onChange={(e) => setEditRow({ ...editRow, email: e.target.value })} data-testid={`edit-attendee-email-${a.id}`} />
                      <div className="flex gap-2">
                        <Button type="button" size="sm" onClick={handleUpdate} disabled={updateMutation.isPending} data-testid={`button-save-edit-${a.id}`}>
                          {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                          {t("attendeeNames.save")}
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setEditingId(null)} data-testid={`button-cancel-edit-${a.id}`}>
                          <X className="w-4 h-4 mr-1" />{t("attendeeNames.cancel")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      <span className="font-medium">{[a.firstName, a.lastName].filter(Boolean).join(" ") || t("attendeeNames.unnamed")}</span>
                      {a.email && <span className="text-muted-foreground truncate">· {a.email}</span>}
                      {a.source === "signin" && <span className="text-xs text-muted-foreground shrink-0">{t("attendeeNames.signedIn")}</span>}
                      <div className="ml-auto flex gap-1">
                        <Button type="button" variant="ghost" size="icon" onClick={() => startEdit(a)} aria-label={t("attendeeNames.edit")} data-testid={`button-edit-attendee-${a.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleDelete(a.id)} disabled={deleteMutation.isPending} aria-label={t("attendeeNames.remove")} data-testid={`button-delete-attendee-${a.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          {openSeats > 0 && (
            <div className="space-y-3">
              {rows.map((r, i) => (
                <div key={i} className="grid grid-cols-2 gap-2 items-start rounded-md border p-3">
                  <Input placeholder={t("attendeeNames.firstNamePlaceholder")} value={r.firstName} onChange={(e) => updateRow(i, { firstName: e.target.value })} data-testid={`input-attendee-first-${i}`} />
                  <div className="flex gap-2">
                    <Input placeholder={t("attendeeNames.lastNamePlaceholder")} value={r.lastName} onChange={(e) => updateRow(i, { lastName: e.target.value })} data-testid={`input-attendee-last-${i}`} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(i)} aria-label={t("attendeeNames.remove")} data-testid={`button-remove-attendee-${i}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <Input placeholder={t("attendeeNames.emailPlaceholder")} type="email" value={r.email} onChange={(e) => updateRow(i, { email: e.target.value })} className="col-span-2" data-testid={`input-attendee-email-${i}`} />
                </div>
              ))}

              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={addRow} disabled={rows.length >= openSeats} data-testid="button-add-attendee">
                  <Plus className="w-4 h-4 mr-1" />{t("attendeeNames.addAttendee", { count: openSeats - rows.length })}
                </Button>
                {rows.length > 0 && (
                  <Button type="button" size="sm" onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-attendees">
                    {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                    {t("attendeeNames.saveNames")}
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
