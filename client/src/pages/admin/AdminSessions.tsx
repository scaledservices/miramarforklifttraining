import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Calendar, CalendarOff, Clock, Copy, MapPin, Pencil, Plus, Users } from "lucide-react";
import type { ServiceArea, AvailabilityRules } from "@shared/schema";
import ServiceAreaFormDialog from "@/components/admin/ServiceAreaFormDialog";
import AvailabilityEditorDialog from "@/components/admin/AvailabilityEditorDialog";
import CopyHoursDialog from "@/components/admin/CopyHoursDialog";
import {
  DEFAULT_RULES,
  friendlyError,
  leadTimeText,
  summarizeDays,
  summarizeSlots,
} from "@/components/admin/availability-utils";

export default function AdminSessions() {
  const { toast } = useToast();

  const [addOpen, setAddOpen] = useState(false);
  const [detailsArea, setDetailsArea] = useState<ServiceArea | null>(null);
  const [hoursArea, setHoursArea] = useState<ServiceArea | null>(null);
  const [copyArea, setCopyArea] = useState<ServiceArea | null>(null);

  const { data: serviceAreas, isLoading } = useQuery<ServiceArea[]>({
    queryKey: ["/api/service-areas"],
  });
  const areas = serviceAreas || [];

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/service-areas/${id}`, { isActive });
      return res.json();
    },
    onSuccess: (_data, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-areas"] });
      toast({ title: isActive ? "Area turned on — customers can book" : "Area turned off — hidden from customers" });
    },
    onError: (err: Error) =>
      toast({ title: friendlyError(err, "Could not update area"), variant: "destructive" }),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-admin-sessions-title">
              Service Areas & Hours
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Each area is a place you drive to for on-site training. Set the days and times once —
              the booking calendar fills itself in automatically.
            </p>
          </div>
          <Button
            className="bg-accent text-accent-foreground border-accent-border"
            onClick={() => setAddOpen(true)}
            data-testid="button-add-service-area"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Service Area
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : areas.length === 0 ? (
          <Card>
            <CardContent className="py-14 flex flex-col items-center text-center gap-3">
              <MapPin className="w-10 h-10 text-muted-foreground" />
              <h2 className="text-lg font-semibold">No service areas yet</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                A service area is a city or region where you offer on-site training — like San Diego
                or Las Vegas. Add one, pick the days and times you work there, and customers can
                start booking.
              </p>
              <Button
                size="lg"
                className="mt-2 bg-accent text-accent-foreground border-accent-border"
                onClick={() => setAddOpen(true)}
                data-testid="button-add-first-area"
              >
                <Plus className="w-4 h-4 mr-1" /> Add your first service area
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {areas.map((area) => {
              const rules = (area.availabilityRules as AvailabilityRules) || DEFAULT_RULES;
              const blackoutCount = rules.blackoutDates?.length || 0;
              const zipCount = area.zipPrefixes?.length || 0;
              return (
                <Card key={area.id} data-testid={`card-area-rules-${area.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{area.name}</CardTitle>
                        <Badge variant="outline">{area.state}</Badge>
                        <Badge variant={area.isActive ? "default" : "secondary"}>
                          {area.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{area.isActive ? "Taking bookings" : "Paused"}</span>
                        <Switch
                          checked={area.isActive}
                          onCheckedChange={(checked) =>
                            toggleActiveMutation.mutate({ id: area.id, isActive: checked })
                          }
                          disabled={toggleActiveMutation.isPending}
                          data-testid={`switch-active-${area.id}`}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {summarizeDays(rules.daysOfWeek)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        {summarizeSlots(rules)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        {rules.maxParticipants} seats/session
                      </span>
                      <span className="text-muted-foreground">{leadTimeText(rules.leadTimeDays)}</span>
                      {blackoutCount > 0 && (
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <CalendarOff className="w-4 h-4" />
                          {blackoutCount} day{blackoutCount === 1 ? "" : "s"} off
                        </span>
                      )}
                    </div>
                    {zipCount > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Serves {zipCount} ZIP {zipCount === 1 ? "code/prefix" : "codes/prefixes"}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setHoursArea(area)}
                        data-testid={`button-edit-rules-${area.id}`}
                      >
                        <Clock className="w-4 h-4 mr-1" /> Edit Hours
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCopyArea(area)}
                        disabled={areas.length < 2}
                        data-testid={`button-copy-hours-${area.id}`}
                      >
                        <Copy className="w-4 h-4 mr-1" /> Copy Hours To...
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDetailsArea(area)}
                        data-testid={`button-edit-details-${area.id}`}
                      >
                        <Pencil className="w-4 h-4 mr-1" /> Edit Name & ZIPs
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add new area */}
        <ServiceAreaFormDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          onCreated={(created) => setHoursArea(created)}
        />

        {/* Edit area details */}
        <ServiceAreaFormDialog
          open={detailsArea !== null}
          onOpenChange={(open) => !open && setDetailsArea(null)}
          area={detailsArea}
        />

        {/* Hours editor */}
        <AvailabilityEditorDialog
          area={hoursArea}
          open={hoursArea !== null}
          onOpenChange={(open) => !open && setHoursArea(null)}
        />

        {/* Copy hours */}
        <CopyHoursDialog
          sourceArea={copyArea}
          allAreas={areas}
          open={copyArea !== null}
          onOpenChange={(open) => !open && setCopyArea(null)}
        />
      </div>
    </AdminLayout>
  );
}
