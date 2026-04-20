import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Loader2, Link2 } from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";
import { getAllLocations } from "@shared/config/locations";

interface LeadData {
  id: number;
  companyName: string | null;
  contactName: string;
  traineeCount: number;
  equipmentTypes: string[];
  trainingAddress: string;
  city: string;
  state: string;
  zip: string;
  notes: string | null;
  requestedLocationSlug: string | null;
  requestedLocationType: string | null;
  companyId: number | null;
  contactId: number | null;
  preferredDate1: string | null;
}

export default function AdminTrainingEventCreate() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const { toast } = useToast();
  const allLocations = getAllLocations();

  const params = new URLSearchParams(searchString);
  const fromLeadId = params.get("fromLead");

  const { data: leadResponse } = useQuery<{ request: LeadData }>({
    queryKey: ["/api/admin/onsite-requests", fromLeadId],
    enabled: !!fromLeadId,
  });
  const leadData = leadResponse?.request;

  const [initialized, setInitialized] = useState(false);
  const [title, setTitle] = useState("");
  const [locationType, setLocationType] = useState<string>("facility");
  const [locationSlug, setLocationSlug] = useState<string>("san-diego");
  const [onsiteStreet, setOnsiteStreet] = useState("");
  const [onsiteCity, setOnsiteCity] = useState("");
  const [onsiteState, setOnsiteState] = useState("");
  const [onsiteZip, setOnsiteZip] = useState("");
  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");
  const [timezone, setTimezone] = useState("America/Los_Angeles");
  const [traineeCount, setTraineeCount] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [equipmentTypes, setEquipmentTypes] = useState<string[]>([]);

  useEffect(() => {
    if (leadData && !initialized) {
      setInitialized(true);
      const companyLabel = leadData.companyName || leadData.contactName;
      setTitle(`Forklift Training - ${companyLabel}`);

      if (leadData.requestedLocationType === "customer_onsite") {
        setLocationType("customer_onsite");
        if (leadData.trainingAddress) setOnsiteStreet(leadData.trainingAddress);
        if (leadData.city) setOnsiteCity(leadData.city);
        if (leadData.state) setOnsiteState(leadData.state);
        if (leadData.zip) setOnsiteZip(leadData.zip);
      } else {
        setLocationType("facility");
        setLocationSlug(leadData.requestedLocationSlug || "san-diego");
      }

      if (leadData.traineeCount) setTraineeCount(String(leadData.traineeCount));
      if (leadData.equipmentTypes?.length) setEquipmentTypes(leadData.equipmentTypes);
      if (leadData.notes) setAdminNotes(`Lead notes: ${leadData.notes}`);

      if (leadData.preferredDate1) {
        try {
          const d = new Date(leadData.preferredDate1);
          if (!isNaN(d.getTime())) {
            const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
            setScheduledStart(local.toISOString().slice(0, 16));
          }
        } catch {}
      }
    }
  }, [leadData, initialized]);

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest("POST", "/api/admin/training-events", payload),
    onSuccess: async (response: Response) => {
      const data = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/training-events"] });
      if (fromLeadId) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/training-events", "lead", fromLeadId] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/leads", fromLeadId, "activities"] });
      }
      toast({ title: "Training event created" });
      navigate(`/admin/training-events/${data.event.id}`);
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }

    const payload: Record<string, unknown> = {
      title: title.trim(),
      locationType,
    };

    if (fromLeadId) payload.originatingLeadId = parseInt(fromLeadId);
    if (leadData?.companyId) payload.companyId = leadData.companyId;
    if (leadData?.contactId) payload.primaryContactId = leadData.contactId;

    if (locationType === "facility") {
      payload.locationSlug = locationSlug;
    } else {
      if (onsiteStreet) payload.onsiteStreet = onsiteStreet;
      if (onsiteCity) payload.onsiteCity = onsiteCity;
      if (onsiteState) payload.onsiteState = onsiteState;
      if (onsiteZip) payload.onsiteZip = onsiteZip;
    }

    if (scheduledStart) {
      payload.scheduledStart = new Date(scheduledStart).toISOString();
      payload.timezone = timezone;
    }
    if (scheduledEnd) {
      payload.scheduledEnd = new Date(scheduledEnd).toISOString();
      payload.timezone = timezone;
    }
    if (traineeCount) payload.traineeCount = parseInt(traineeCount);
    if (equipmentTypes.length > 0) payload.equipmentTypes = equipmentTypes;
    if (adminNotes.trim()) payload.adminNotes = adminNotes.trim();

    createMutation.mutate(payload);
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl space-y-6" data-testid="admin-training-event-create">
        <div className="flex items-center gap-4">
          <Link href={fromLeadId ? `/admin/onsite-requests/${fromLeadId}` : "/admin/training-events"}>
            <Button variant="ghost" size="icon" data-testid="button-back-events">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Create Training Event</h1>
            {leadData && (
              <div className="flex items-center gap-2 mt-1">
                <Link2 className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  From Lead #{fromLeadId}: {leadData.contactName}
                  {leadData.companyName && ` (${leadData.companyName})`}
                </span>
              </div>
            )}
          </div>
        </div>

        {leadData && (
          <div className="bg-muted/50 border rounded-lg p-4 text-sm space-y-1" data-testid="lead-prefill-banner">
            <p className="font-medium flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Prefilled from Lead</Badge>
            </p>
            <p className="text-muted-foreground">
              Fields below have been populated from the lead request. Review and adjust before creating the event.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border rounded-lg p-5 space-y-4">
            <h2 className="font-semibold">Event Details</h2>

            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Forklift Training - Acme Corp"
                data-testid="input-event-title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="traineeCount">Number of Trainees</Label>
                <Input
                  id="traineeCount"
                  type="number"
                  min="1"
                  value={traineeCount}
                  onChange={e => setTraineeCount(e.target.value)}
                  placeholder="e.g. 12"
                  data-testid="input-trainee-count"
                />
              </div>
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger id="timezone" data-testid="select-timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Los_Angeles">Pacific (LA)</SelectItem>
                    <SelectItem value="America/Denver">Mountain (Denver)</SelectItem>
                    <SelectItem value="America/Chicago">Central (Chicago)</SelectItem>
                    <SelectItem value="America/New_York">Eastern (NY)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {equipmentTypes.length > 0 && (
              <div>
                <Label>Equipment Types</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {equipmentTypes.map(eq => (
                    <Badge key={eq} variant="outline" className="text-xs">{eq}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border rounded-lg p-5 space-y-4">
            <h2 className="font-semibold">Location</h2>

            <div>
              <Label>Location Type</Label>
              <Select value={locationType} onValueChange={setLocationType}>
                <SelectTrigger data-testid="select-location-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facility">Facility</SelectItem>
                  <SelectItem value="customer_onsite">Customer On-Site</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {locationType === "facility" ? (
              <div>
                <Label>Facility</Label>
                <Select value={locationSlug} onValueChange={setLocationSlug}>
                  <SelectTrigger data-testid="select-facility">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allLocations.map(l => (
                      <SelectItem key={l.slug} value={l.slug}>
                        {l.displayName} {!l.active ? "(Inactive)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Street Address</Label>
                  <Input value={onsiteStreet} onChange={e => setOnsiteStreet(e.target.value)} placeholder="123 Main St" data-testid="input-onsite-street" />
                </div>
                <div>
                  <Label>City</Label>
                  <Input value={onsiteCity} onChange={e => setOnsiteCity(e.target.value)} placeholder="San Diego" data-testid="input-onsite-city" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>State</Label>
                    <Input value={onsiteState} onChange={e => setOnsiteState(e.target.value)} placeholder="CA" data-testid="input-onsite-state" />
                  </div>
                  <div>
                    <Label>ZIP</Label>
                    <Input value={onsiteZip} onChange={e => setOnsiteZip(e.target.value)} placeholder="92121" data-testid="input-onsite-zip" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border rounded-lg p-5 space-y-4">
            <h2 className="font-semibold">Schedule (Optional)</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start">Start Date/Time</Label>
                <Input
                  id="start"
                  type="datetime-local"
                  value={scheduledStart}
                  onChange={e => setScheduledStart(e.target.value)}
                  data-testid="input-scheduled-start"
                />
              </div>
              <div>
                <Label htmlFor="end">End Date/Time</Label>
                <Input
                  id="end"
                  type="datetime-local"
                  value={scheduledEnd}
                  onChange={e => setScheduledEnd(e.target.value)}
                  data-testid="input-scheduled-end"
                />
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-5 space-y-4">
            <h2 className="font-semibold">Notes</h2>
            <Textarea
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              placeholder="Internal notes about this training event..."
              rows={3}
              data-testid="textarea-admin-notes"
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={createMutation.isPending} data-testid="button-create-event">
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Training Event
            </Button>
            <Link href={fromLeadId ? `/admin/onsite-requests/${fromLeadId}` : "/admin/training-events"}>
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
