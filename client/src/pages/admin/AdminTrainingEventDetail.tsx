import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft, Calendar, MapPin, Users, Building2, User, Clock,
  Loader2, ChevronDown, ChevronUp, FileText, Wrench,
} from "lucide-react";
import { Link } from "wouter";
import {
  TRAINING_EVENT_STATUSES, VALID_EVENT_TRANSITIONS,
  EVENT_STATUS_LABELS, TERMINAL_EVENT_STATUSES,
  type TrainingEventStatus,
} from "@shared/config/training-events";
import { LOCATION_TYPES, getAllLocations } from "@shared/config/locations";

interface TrainingEventDetail {
  id: number;
  originatingLeadId: number | null;
  companyId: number | null;
  primaryContactId: number | null;
  title: string;
  status: TrainingEventStatus;
  locationType: string;
  locationSlug: string | null;
  onsiteStreet: string | null;
  onsiteCity: string | null;
  onsiteState: string | null;
  onsiteZip: string | null;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  timezone: string | null;
  traineeCount: number | null;
  equipmentTypes: string[];
  instructorId: number | null;
  adminNotes: string | null;
  createdByUserId: number | null;
  createdAt: string;
  updatedAt: string;
}

const statusColorMap: Record<TrainingEventStatus, string> = {
  unscheduled: "bg-gray-100 text-gray-700",
  scheduling_in_progress: "bg-blue-100 text-blue-700",
  scheduled: "bg-green-100 text-green-700",
  awaiting_confirmation: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  canceled: "bg-red-100 text-red-700",
};

export default function AdminTrainingEventDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { toast } = useToast();
  const [showSchedule, setShowSchedule] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");

  const allLocations = getAllLocations();

  const { data, isLoading } = useQuery<{
    event: TrainingEventDetail;
    company: { id: number; name: string } | null;
    contact: { id: number; firstName: string; lastName: string; email: string; phone: string } | null;
    lead: { id: number; contactName: string; companyName: string; status: string } | null;
    instructor: { id: number; fullName: string; email: string } | null;
  }>({
    queryKey: ["/api/admin/training-events", id],
  });

  const event = data?.event;
  const company = data?.company;
  const contact = data?.contact;
  const lead = data?.lead;
  const instructor = data?.instructor;

  const isTerminal = event ? TERMINAL_EVENT_STATUSES.includes(event.status) : false;
  const allowedTransitions = event ? (VALID_EVENT_TRANSITIONS[event.status] ?? []) : [];

  const statusMutation = useMutation({
    mutationFn: (status: string) =>
      apiRequest("PATCH", `/api/admin/training-events/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/training-events", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/training-events"] });
      toast({ title: "Status updated" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest("PATCH", `/api/admin/training-events/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/training-events", id] });
      toast({ title: "Event updated" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const handleSaveNotes = () => {
    updateMutation.mutate({ adminNotes: notesValue });
    setEditingNotes(false);
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "Not set";
    return new Date(dateStr).toLocaleString("en-US", {
      weekday: "short", month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit",
    });
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

  if (!event) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Training Event Not Found</h2>
          <Link href="/admin/training-events">
            <Button variant="outline">Back to Events</Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="admin-training-event-detail">
        <div className="flex items-center gap-4">
          <Link href="/admin/training-events">
            <Button variant="ghost" size="icon" data-testid="button-back-events">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold" data-testid="text-event-title">{event.title}</h1>
              <Badge className={statusColorMap[event.status]} data-testid="badge-event-status">
                {EVENT_STATUS_LABELS[event.status]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Event #{event.id} &middot; Created {formatDateTime(event.createdAt)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="border rounded-lg p-5 space-y-4">
              <button
                className="flex items-center justify-between w-full text-left"
                onClick={() => setShowSchedule(!showSchedule)}
                data-testid="button-toggle-schedule"
              >
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Schedule & Details
                </h2>
                {showSchedule ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showSchedule && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Start</Label>
                    <p className="font-medium" data-testid="text-scheduled-start">
                      {formatDateTime(event.scheduledStart)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">End</Label>
                    <p className="font-medium" data-testid="text-scheduled-end">
                      {formatDateTime(event.scheduledEnd)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Timezone</Label>
                    <p className="font-medium">{event.timezone ?? "Not set"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Trainees</Label>
                    <p className="font-medium flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {event.traineeCount ?? "Not set"}
                    </p>
                  </div>
                  {event.equipmentTypes.length > 0 && (
                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground">Equipment Types</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {event.equipmentTypes.map(eq => (
                          <Badge key={eq} variant="outline" className="text-xs">
                            <Wrench className="h-3 w-3 mr-1" />
                            {eq}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {instructor && (
                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground">Instructor</Label>
                      <p className="font-medium">{instructor.fullName} ({instructor.email})</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border rounded-lg p-5 space-y-4">
              <button
                className="flex items-center justify-between w-full text-left"
                onClick={() => setShowLocation(!showLocation)}
                data-testid="button-toggle-location"
              >
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Location
                </h2>
                {showLocation ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showLocation && (
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Type</Label>
                    <p className="font-medium capitalize" data-testid="text-location-type">
                      {event.locationType === "facility" ? "Facility" : "Customer On-Site"}
                    </p>
                  </div>
                  {event.locationType === "facility" && event.locationSlug && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Facility</Label>
                      <p className="font-medium">
                        {allLocations.find(l => l.slug === event.locationSlug)?.address.full ?? event.locationSlug}
                      </p>
                    </div>
                  )}
                  {event.locationType === "customer_onsite" && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Address</Label>
                      <p className="font-medium" data-testid="text-onsite-address">
                        {[event.onsiteStreet, event.onsiteCity, event.onsiteState, event.onsiteZip].filter(Boolean).join(", ") || "Not provided"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Admin Notes
                </h2>
                {!isTerminal && !editingNotes && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setNotesValue(event.adminNotes ?? ""); setEditingNotes(true); }}
                    data-testid="button-edit-notes"
                  >
                    Edit
                  </Button>
                )}
              </div>
              {editingNotes ? (
                <div className="space-y-2">
                  <Textarea
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    rows={4}
                    data-testid="textarea-admin-notes"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveNotes} disabled={updateMutation.isPending} data-testid="button-save-notes">
                      {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingNotes(false)} data-testid="button-cancel-notes">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap" data-testid="text-admin-notes">
                  {event.adminNotes || "No notes added yet."}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {!isTerminal && allowedTransitions.length > 0 && (
              <div className="border rounded-lg p-5 space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Update Status</h2>
                <div className="grid gap-2">
                  {allowedTransitions.map(s => (
                    <Button
                      key={s}
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      disabled={statusMutation.isPending}
                      onClick={() => statusMutation.mutate(s)}
                      data-testid={`button-status-${s}`}
                    >
                      {statusMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      {EVENT_STATUS_LABELS[s]}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="border rounded-lg p-5 space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Linked Records</h2>

              {company && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Company</Label>
                  <Link href={`/admin/companies/${company.id}`}>
                    <div className="flex items-center gap-2 text-sm text-primary hover:underline cursor-pointer" data-testid="link-event-company">
                      <Building2 className="h-4 w-4" />
                      {company.name}
                    </div>
                  </Link>
                </div>
              )}

              {contact && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Primary Contact</Label>
                  <div className="text-sm" data-testid="text-event-contact">
                    <User className="h-4 w-4 inline mr-1" />
                    {contact.firstName} {contact.lastName}
                    <span className="text-muted-foreground ml-2">{contact.email}</span>
                  </div>
                </div>
              )}

              {lead && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Originating Lead</Label>
                  <Link href={`/admin/onsite-requests/${lead.id}`}>
                    <div className="flex items-center gap-2 text-sm text-primary hover:underline cursor-pointer" data-testid="link-event-lead">
                      #{lead.id} — {lead.contactName}
                    </div>
                  </Link>
                </div>
              )}

              {!company && !contact && !lead && (
                <p className="text-sm text-muted-foreground">No linked records</p>
              )}
            </div>

            <div className="border rounded-lg p-5 space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Event Info</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(event.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{new Date(event.updatedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location Type</span>
                  <span className="capitalize">{event.locationType === "facility" ? "Facility" : "On-Site"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
