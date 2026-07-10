import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Circle,
  MapPin,
  Users,
  Clock,
  Award,
  Loader2,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { type TodayBooking, productLabel, formatMoney, formatDay } from "./types";

interface Props {
  booking: TodayBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful completion so the parent can refresh feeds. */
  onCompleted: () => void;
}

/**
 * One-screen training fulfillment: review the session, mark it complete, and
 * the server issues certificates + sends the completion email in the same
 * call (bookings PATCH /complete auto-issues certs). Feels like finishing a
 * checklist, not hopping between Bookings → Certificates → Money.
 */
export default function FulfillTrainingSheet({ booking, open, onOpenChange, onCompleted }: Props) {
  const { t } = useTranslation();
  const [done, setDone] = useState(false);

  // Reset the success state when a new booking is opened.
  useEffect(() => {
    if (open) setDone(false);
  }, [open, booking?.id]);

  const completeMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/bookings/${id}/complete`),
    onSuccess: () => {
      setDone(true);
      onCompleted();
    },
  });

  if (!booking) return null;
  const b = booking;
  const paidInFull = b.balanceDue <= 0.01;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] overflow-y-auto rounded-t-2xl sm:max-w-lg sm:mx-auto pb-[calc(env(safe-area-inset-bottom)+1rem)]"
        data-testid="sheet-fulfill-training"
      >
        <SheetHeader className="text-left">
          <SheetTitle>{t("adminUx.fulfillTitle", { defaultValue: "Finish This Training" })}</SheetTitle>
          <SheetDescription>
            {b.contactName} · {formatDay(b.sessionDate)} · {b.startTime}–{b.endTime}
          </SheetDescription>
        </SheetHeader>

        {done ? (
          <div className="py-8 text-center space-y-4" data-testid="fulfill-success">
            <CheckCircle className="h-14 w-14 text-brand-green mx-auto" />
            <div>
              <p className="text-lg font-bold">{t("adminUx.fulfillDoneTitle", { defaultValue: "All done!" })}</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                {t("adminUx.fulfillDoneDesc", {
                  count: b.participantCount,
                  defaultValue:
                    "Training is complete. Certificates were created for {{count}} people and the customer got a confirmation email.",
                })}
              </p>
            </div>
            <div className="flex flex-col gap-2 max-w-xs mx-auto">
              <Button asChild size="lg" data-testid="link-fulfill-certificates">
                <Link href="/admin/certificates">
                  <Award className="h-4 w-4 mr-2" />
                  {t("adminUx.fulfillViewCerts", { defaultValue: "See Certificates" })}
                </Link>
              </Button>
              <Button variant="outline" size="lg" onClick={() => onOpenChange(false)} data-testid="button-fulfill-close">
                {t("adminUx.fulfillClose", { defaultValue: "Close" })}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {/* Session facts */}
            <div className="rounded-xl border bg-card p-4 space-y-2 text-sm">
              <div className="font-semibold">{productLabel(b.productSlug)}</div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                {b.areaName} · {b.address}
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-4 w-4 shrink-0" />
                {b.participantCount} {b.participantCount === 1
                  ? t("adminUx.person", { defaultValue: "person" })
                  : t("adminUx.people", { defaultValue: "people" })}
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0" />
                {b.startTime} – {b.endTime}
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-3">
              <ChecklistRow
                ok
                label={t("adminUx.fulfillStepConfirmed", { defaultValue: "Booking confirmed" })}
              />
              <ChecklistRow
                ok={paidInFull}
                label={
                  paidInFull
                    ? t("adminUx.fulfillStepPaid", { total: formatMoney(b.total), defaultValue: "Paid in full ({{total}})" })
                    : t("adminUx.fulfillStepBalance", {
                        due: formatMoney(b.balanceDue),
                        defaultValue: "{{due}} still due — collect before finishing",
                      })
                }
                warn={!paidInFull}
              />
              <ChecklistRow
                ok={false}
                label={t("adminUx.fulfillStepComplete", {
                  count: b.participantCount,
                  defaultValue: "Mark complete — creates {{count}} certificates and emails the customer",
                })}
              />
            </div>

            {completeMutation.isError && (
              <p className="text-sm text-destructive" data-testid="text-fulfill-error">
                {t("adminUx.fulfillError", { defaultValue: "Something went wrong. Try again or check the booking page." })}
              </p>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <Button
                size="lg"
                className="h-12 text-base"
                onClick={() => completeMutation.mutate(b.id)}
                disabled={completeMutation.isPending}
                data-testid={`button-fulfill-complete-${b.id}`}
              >
                {completeMutation.isPending ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-5 w-5 mr-2" />
                )}
                {t("adminUx.fulfillCta", { defaultValue: "Complete & Issue Certificates" })}
              </Button>
              <Button asChild variant="ghost" size="sm" data-testid={`link-fulfill-booking-${b.id}`}>
                <Link href="/admin/bookings">
                  {t("adminUx.fulfillOpenBooking", { defaultValue: "Open full booking" })}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ChecklistRow({ ok, warn, label }: { ok: boolean; warn?: boolean; label: string }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      {ok ? (
        <CheckCircle className="h-5 w-5 text-brand-green shrink-0" />
      ) : warn ? (
        <AlertTriangle className="h-5 w-5 text-brand-orange shrink-0" />
      ) : (
        <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
      )}
      <span className={warn ? "text-brand-orange font-medium" : ""}>{label}</span>
    </div>
  );
}
