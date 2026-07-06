import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, CheckCircle, MapPin, Users, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { type TodayBooking, productLabel, formatMoney } from "./types";

interface Props {
  booking: TodayBooking;
  onConfirm: (id: number) => void;
  onComplete: (id: number) => void;
  confirmPending: boolean;
  completePending: boolean;
}

export default function TodaySessionCard({ booking, onConfirm, onComplete, confirmPending, completePending }: Props) {
  const b = booking;
  return (
    <Card className="border-l-4 border-l-primary" data-testid={`card-today-session-${b.id}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-lg font-bold">
              {b.startTime} – {b.endTime}
            </div>
            <div className="font-semibold">{b.contactName}</div>
            <div className="text-sm text-muted-foreground">{productLabel(b.productSlug)}</div>
          </div>
          <Badge
            variant="secondary"
            className={
              b.status === "pending"
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            }
          >
            {b.status === "pending" ? "Needs confirmation" : "Confirmed"}
          </Badge>
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>
              {b.areaName} · {b.address}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 shrink-0" />
            <span>
              {b.participantCount} {b.participantCount === 1 ? "person" : "people"} · {formatMoney(b.total)}
              {b.balanceDue > 0.01 && (
                <span className="text-brand-orange font-medium"> · {formatMoney(b.balanceDue)} due</span>
              )}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button asChild size="lg" variant="outline" className="flex-1">
            <a href={`tel:${b.contactPhone}`} data-testid={`link-call-session-${b.id}`}>
              <Phone className="h-4 w-4 mr-1" />
              Call
            </a>
          </Button>
          {b.status === "pending" ? (
            <Button
              size="lg"
              className="flex-1"
              onClick={() => onConfirm(b.id)}
              disabled={confirmPending}
              data-testid={`button-confirm-session-${b.id}`}
            >
              {confirmPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
              Confirm
            </Button>
          ) : (
            <Button
              size="lg"
              className="flex-1"
              onClick={() => onComplete(b.id)}
              disabled={completePending}
              data-testid={`button-complete-session-${b.id}`}
            >
              {completePending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
              Complete
            </Button>
          )}
          <Button asChild size="lg" variant="ghost">
            <Link href="/admin/bookings" data-testid={`link-session-detail-${b.id}`}>
              Details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
