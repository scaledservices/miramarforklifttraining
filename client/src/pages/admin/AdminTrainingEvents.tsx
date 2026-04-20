import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronRight, Plus, Calendar, MapPin, Building2, Users, Link2, AlertCircle } from "lucide-react";
import { useLocation, Link } from "wouter";
import { TRAINING_EVENT_STATUSES, EVENT_STATUS_LABELS, type TrainingEventStatus } from "@shared/config/training-events";
import { getAllLocations } from "@shared/config/locations";
import { STATUS_LABELS, type OnsiteStatus } from "@shared/config/onsite-states";

interface TrainingEvent {
  id: number;
  title: string;
  status: TrainingEventStatus;
  locationType: string;
  locationSlug: string | null;
  onsiteCity: string | null;
  onsiteState: string | null;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  traineeCount: number | null;
  companyId: number | null;
  companyName: string | null;
  contactName: string | null;
  instructorName: string | null;
  originatingLeadId: number | null;
  instructorId: number | null;
  createdAt: string;
}

interface LeadNeedingScheduling {
  id: number;
  contactName: string;
  companyName: string | null;
  status: string;
  traineeCount: number;
  requestedLocationSlug: string | null;
  requestedLocationType: string | null;
  preferredDate1: string | null;
  createdAt: string;
}

type QueueTab = "upcoming" | "unscheduled" | "awaiting_confirmation" | "completed" | "canceled" | "all";

const QUEUE_TABS: { key: QueueTab; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "unscheduled", label: "Unscheduled Events" },
  { key: "awaiting_confirmation", label: "Awaiting Confirmation" },
  { key: "completed", label: "Completed" },
  { key: "canceled", label: "Canceled" },
  { key: "all", label: "All Events" },
];

const statusColorMap: Record<TrainingEventStatus, string> = {
  unscheduled: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  scheduling_in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  scheduled: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  awaiting_confirmation: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  canceled: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

function filterEventsByQueue(events: TrainingEvent[], queue: QueueTab): TrainingEvent[] {
  const now = new Date();
  switch (queue) {
    case "upcoming":
      return events.filter(e =>
        (e.status === "scheduled" || e.status === "awaiting_confirmation" || e.status === "scheduling_in_progress") &&
        (!e.scheduledStart || new Date(e.scheduledStart) >= now)
      );
    case "unscheduled":
      return events.filter(e => e.status === "unscheduled");
    case "awaiting_confirmation":
      return events.filter(e => e.status === "awaiting_confirmation");
    case "completed":
      return events.filter(e => e.status === "completed");
    case "canceled":
      return events.filter(e => e.status === "canceled");
    case "all":
    default:
      return events;
  }
}

export default function AdminTrainingEvents() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [activeQueue, setActiveQueue] = useState<QueueTab>("upcoming");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [showLeadsNeeding, setShowLeadsNeeding] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const allLocations = getAllLocations();

  const queryParams = new URLSearchParams();
  if (locationFilter !== "all") queryParams.set("locationSlug", locationFilter);
  if (dateFrom) queryParams.set("dateFrom", dateFrom);
  if (dateTo) queryParams.set("dateTo", dateTo);

  const { data, isLoading } = useQuery<{ events: TrainingEvent[] }>({
    queryKey: ["/api/admin/training-events", locationFilter, dateFrom, dateTo],
    queryFn: () => fetch(`/api/admin/training-events?${queryParams.toString()}`, { credentials: "include" }).then(r => r.json()),
  });

  const { data: leadsData, isLoading: leadsLoading } = useQuery<{ leads: LeadNeedingScheduling[] }>({
    queryKey: ["/api/admin/training-events/leads-needing-scheduling"],
  });

  const allEvents = data?.events ?? [];
  const leadsNeeding = leadsData?.leads ?? [];

  const queuedEvents = filterEventsByQueue(allEvents, activeQueue);

  const filtered = search
    ? queuedEvents.filter(e =>
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        String(e.id).includes(search)
      )
    : queuedEvents;

  const queueCounts: Record<QueueTab, number> = {
    upcoming: filterEventsByQueue(allEvents, "upcoming").length,
    unscheduled: filterEventsByQueue(allEvents, "unscheduled").length,
    awaiting_confirmation: filterEventsByQueue(allEvents, "awaiting_confirmation").length,
    completed: filterEventsByQueue(allEvents, "completed").length,
    canceled: filterEventsByQueue(allEvents, "canceled").length,
    all: allEvents.length,
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric", minute: "2-digit",
    });
  };

  const locationLabel = (e: TrainingEvent) => {
    if (e.locationType === "facility") {
      const loc = allLocations.find(l => l.slug === e.locationSlug);
      return loc?.displayName ?? e.locationSlug ?? "Facility";
    }
    if (e.onsiteCity && e.onsiteState) return `${e.onsiteCity}, ${e.onsiteState}`;
    return "Customer On-Site";
  };

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="admin-training-events-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-training-events-title">Scheduling Console</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage training event fulfillment and scheduling pipeline</p>
          </div>
          <Link href="/admin/training-events/new">
            <Button data-testid="button-create-training-event">
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </Button>
          </Link>
        </div>

        {leadsNeeding.length > 0 && (
          <div className="border border-amber-200 dark:border-amber-800 rounded-lg bg-amber-50/50 dark:bg-amber-950/20" data-testid="leads-needing-scheduling-section">
            <button
              className="w-full flex items-center justify-between p-4 text-left"
              onClick={() => setShowLeadsNeeding(!showLeadsNeeding)}
              data-testid="button-toggle-leads-needing"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <span className="font-semibold text-sm">Leads Needing Scheduling</span>
                <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 dark:text-amber-300">
                  {leadsNeeding.length}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">{showLeadsNeeding ? "Hide" : "Show"}</span>
            </button>
            {showLeadsNeeding && (
              <div className="px-4 pb-4">
                <p className="text-xs text-muted-foreground mb-3">
                  Active CRM leads that do not yet have a linked training event. These are not the same as unscheduled training events.
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lead</TableHead>
                      <TableHead>CRM Status</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Trainees</TableHead>
                      <TableHead>Requested Date</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leadsLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 6 }).map((_, j) => (
                            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      leadsNeeding.map(lead => (
                        <TableRow key={lead.id} data-testid={`row-lead-needing-${lead.id}`}>
                          <TableCell>
                            <div>
                              <span className="font-medium text-sm">{lead.contactName}</span>
                              {lead.companyName && (
                                <span className="text-xs text-muted-foreground ml-1">({lead.companyName})</span>
                              )}
                              <span className="text-xs text-muted-foreground ml-1">#{lead.id}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs capitalize">
                              {STATUS_LABELS[lead.status as OnsiteStatus] || lead.status.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm capitalize">
                              {lead.requestedLocationType === "customer_onsite" ? "On-Site" :
                                allLocations.find(l => l.slug === lead.requestedLocationSlug)?.displayName ?? "Facility"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{lead.traineeCount}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{lead.preferredDate1 ? formatDate(lead.preferredDate1) : "—"}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Link href={`/admin/training-events/new?fromLead=${lead.id}`}>
                                <Button variant="outline" size="sm" className="text-xs" data-testid={`button-convert-lead-${lead.id}`}>
                                  <Plus className="h-3 w-3 mr-1" />
                                  Create Event
                                </Button>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-1 border-b pb-1" data-testid="queue-tabs">
          {QUEUE_TABS.map(tab => (
            <button
              key={tab.key}
              className={`px-3 py-2 text-sm rounded-t-md transition-colors ${
                activeQueue === tab.key
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              onClick={() => setActiveQueue(tab.key)}
              data-testid={`tab-queue-${tab.key}`}
            >
              {tab.label}
              <span className="ml-1.5 text-xs opacity-70">({queueCounts[tab.key]})</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-events"
            />
          </div>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-[200px]" data-testid="select-location-filter">
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {allLocations.map(l => (
                <SelectItem key={l.slug} value={l.slug}>{l.displayName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[150px] h-9"
                data-testid="input-date-from"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[150px] h-9"
                data-testid="input-date-to"
              />
            </div>
            {(dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-4"
                onClick={() => { setDateFrom(""); setDateTo(""); }}
                data-testid="button-reset-dates"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date / Time</TableHead>
                <TableHead>Trainees</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No training events in this queue
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(event => (
                  <TableRow
                    key={event.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/admin/training-events/${event.id}`)}
                    data-testid={`row-training-event-${event.id}`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-medium" data-testid={`text-event-title-${event.id}`}>{event.title}</span>
                        <span className="text-xs text-muted-foreground">#{event.id}</span>
                        {event.originatingLeadId && (
                          <Link2 className="h-3 w-3 text-primary ml-1" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColorMap[event.status]} data-testid={`badge-event-status-${event.id}`}>
                        {EVENT_STATUS_LABELS[event.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {event.companyName ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate max-w-[150px]">{event.companyName}</span>
                        </div>
                      ) : event.companyId ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate max-w-[120px] text-muted-foreground">#{event.companyId}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {locationLabel(event)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs capitalize">{event.locationType === "facility" ? "Facility" : "On-Site"}</span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {event.scheduledStart ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span>{formatDate(event.scheduledStart)}</span>
                            <span className="text-muted-foreground">{formatTime(event.scheduledStart)}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not scheduled</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        {event.traineeCount ? (
                          <>
                            <Users className="h-3 w-3 text-muted-foreground" />
                            {event.traineeCount}
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
