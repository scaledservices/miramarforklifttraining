import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ChevronRight, ArrowUpDown, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { VALID_TRANSITIONS, STATUS_LABELS, TERMINAL_STATUSES, type OnsiteStatus } from "@shared/config/onsite-states";
import { getLocation, getAllLocations } from "@shared/config/locations";

interface Lead {
  id: number;
  companyName: string | null;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  traineeCount: number;
  trainingType: string;
  equipmentTypes: string[];
  status: OnsiteStatus;
  assignedRepId: number | null;
  repName: string | null;
  leadSource: string | null;
  requestedLocationSlug: string | null;
  requestedLocationType: string | null;
  nextActionType: string | null;
  nextActionDate: string | null;
  lastActivityAt: string | null;
  daysSinceActivity: number;
  isOverdue: boolean;
  companyData: { id: number; name: string } | null;
  instructorAssignments: { instructorName: string; status: string }[];
  createdAt: string;
  updatedAt: string;
}

interface Rep {
  id: number;
  name: string;
  email: string;
}

type SortField = "submitted" | "activity" | "status" | "trainees" | "location";

const allLocations = getAllLocations();

const STATUS_BADGE_STYLES: Record<string, { bg: string }> = {
  new_lead: { bg: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  contacted: { bg: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200" },
  quoted: { bg: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  quote_accepted: { bg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
  quote_declined: { bg: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  scheduled: { bg: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200" },
  confirmed: { bg: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  completed: { bg: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200" },
  invoiced: { bg: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  unresponsive: { bg: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200" },
  cancelled: { bg: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
};

const NEXT_ACTION_LABELS: Record<string, string> = {
  call_back: "Call Back",
  send_quote: "Send Quote",
  follow_up: "Follow Up",
  schedule_training: "Schedule",
  send_info: "Send Info",
  other: "Other",
};

function activityColor(days: number) {
  if (days <= 1) return "text-green-600 dark:text-green-400";
  if (days <= 3) return "text-foreground";
  if (days <= 7) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function locationLabel(slug: string | null): string {
  if (!slug) return "—";
  const loc = getLocation(slug);
  return loc?.displayName ?? slug;
}

export default function AdminLeads() {
  const [search, setSearch] = useState("");
  const [queueMode, setQueueMode] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [leadSourceFilter, setLeadSourceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [sortField, setSortField] = useState<SortField>("activity");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ leads: Lead[] }>({
    queryKey: ["/api/admin/leads", queueMode, statusFilter, locationFilter, leadSourceFilter, sortBy],
    queryFn: () => {
      const params = new URLSearchParams();
      if (queueMode !== "all") params.set("queueMode", queueMode);
      if (statusFilter !== "all") params.set("pipelineStage", statusFilter);
      if (locationFilter !== "all") params.set("location", locationFilter);
      if (leadSourceFilter !== "all") params.set("leadSource", leadSourceFilter);
      if (sortBy !== "newest") params.set("sortBy", sortBy);
      const qs = params.toString();
      const url = qs ? `/api/admin/leads?${qs}` : "/api/admin/leads";
      return fetch(url, { credentials: "include" }).then(r => r.json());
    },
  });

  const { data: repsData } = useQuery<{ reps: Rep[] }>({
    queryKey: ["/api/admin/reps"],
  });

  const leads = data?.leads ?? [];
  const reps = repsData?.reps ?? [];

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PATCH", `/api/admin/onsite-requests/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads"] });
      toast({ title: "Status updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update status", description: err.message, variant: "destructive" });
    },
  });

  const repMutation = useMutation({
    mutationFn: ({ id, repId }: { id: number; repId: number }) =>
      apiRequest("PATCH", `/api/admin/onsite-requests/${id}/assign-rep`, { repId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads"] });
      toast({ title: "Rep assigned" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to assign rep", description: err.message, variant: "destructive" });
    },
  });

  const filtered = useMemo(() => {
    let result = leads;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(r =>
        r.contactName.toLowerCase().includes(s) ||
        r.email.toLowerCase().includes(s) ||
        (r.companyName || "").toLowerCase().includes(s) ||
        r.phone.toLowerCase().includes(s) ||
        r.city.toLowerCase().includes(s)
      );
    }
    if (sortBy === "newest") {
      result = [...result].sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        switch (sortField) {
          case "submitted": return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          case "activity": return dir * (a.daysSinceActivity - b.daysSinceActivity);
          case "status": return dir * a.status.localeCompare(b.status);
          case "trainees": return dir * (a.traineeCount - b.traineeCount);
          case "location": return dir * (`${a.state},${a.city}`).localeCompare(`${b.state},${b.city}`);
          default: return 0;
        }
      });
    }
    return result;
  }, [leads, search, sortField, sortDir, sortBy]);

  const activeCount = leads.filter(l => !TERMINAL_STATUSES.includes(l.status)).length;
  const unassignedCount = leads.filter(l => !l.assignedRepId && !TERMINAL_STATUSES.includes(l.status)).length;
  const overdueCount = leads.filter(l => l.isOverdue).length;

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  }

  const SortIcon = ({ field }: { field: SortField }) => (
    <ArrowUpDown
      className={`inline h-3.5 w-3.5 ml-1 cursor-pointer ${sortField === field ? "text-foreground" : "text-muted-foreground/40"}`}
      onClick={(e) => { e.stopPropagation(); toggleSort(field); }}
    />
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-admin-leads-title">Lead Pipeline</h1>
          <div className="flex gap-4 mt-1">
            <p className="text-sm text-muted-foreground" data-testid="text-active-leads">
              {activeCount} active lead{activeCount !== 1 ? "s" : ""}
            </p>
            {unassignedCount > 0 && (
              <p className="text-sm text-orange-600 dark:text-orange-400" data-testid="text-unassigned-leads">
                {unassignedCount} unassigned
              </p>
            )}
            {overdueCount > 0 && (
              <p className="text-sm text-red-600 dark:text-red-400" data-testid="text-overdue-leads">
                {overdueCount} overdue
              </p>
            )}
          </div>
        </div>

        <Tabs value={queueMode} onValueChange={setQueueMode} data-testid="tabs-queue-mode">
          <TabsList className="h-auto gap-1">
            <TabsTrigger value="all">All Leads</TabsTrigger>
            <TabsTrigger value="my_leads">My Leads</TabsTrigger>
            <TabsTrigger value="unassigned">Unassigned</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
            <TabsTrigger value="new">New</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-leads"
            />
          </div>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-[160px]" data-testid="select-location-filter">
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {allLocations.map(loc => (
                <SelectItem key={loc.slug} value={loc.slug}>{loc.displayName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
              <SelectValue placeholder="All Stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              <SelectItem value="new_lead">New Lead</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="quoted">Quoted</SelectItem>
              <SelectItem value="quote_accepted">Accepted</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="invoiced">Invoiced</SelectItem>
            </SelectContent>
          </Select>
          <Select value={leadSourceFilter} onValueChange={setLeadSourceFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-source-filter">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="organic">Organic</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
              <SelectItem value="direct">Direct</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="rep_sourced">Rep Sourced</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]" data-testid="select-sort">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest_untouched">Oldest Untouched</SelectItem>
              <SelectItem value="overdue_first">Overdue First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact / Company</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("location")}>
                    Location <SortIcon field="location" />
                  </TableHead>
                  <TableHead>Market</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("status")}>
                    Status <SortIcon field="status" />
                  </TableHead>
                  <TableHead>Rep</TableHead>
                  <TableHead>Next Action</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("activity")}>
                    Idle <SortIcon field="activity" />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("submitted")}>
                    Created <SortIcon field="submitted" />
                  </TableHead>
                  <TableHead className="w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((lead) => {
                  const validNext = VALID_TRANSITIONS[lead.status] ?? [];
                  return (
                    <TableRow
                      key={lead.id}
                      data-testid={`row-lead-${lead.id}`}
                      className={`cursor-pointer hover:bg-muted/50 ${lead.isOverdue ? "bg-red-50/50 dark:bg-red-950/20" : ""}`}
                      onClick={() => navigate(`/admin/onsite-requests/${lead.id}`)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium" data-testid={`text-lead-name-${lead.id}`}>{lead.contactName}</p>
                          {lead.companyName && <p className="text-xs text-muted-foreground">{lead.companyName}</p>}
                          <p className="text-xs text-muted-foreground">{lead.trainingType} · {lead.traineeCount} trainees</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground" data-testid={`text-lead-location-${lead.id}`}>
                        {lead.city}, {lead.state}
                      </TableCell>
                      <TableCell className="text-sm" data-testid={`text-lead-market-${lead.id}`}>
                        {lead.requestedLocationSlug ? (
                          <Badge variant="outline" className="text-xs font-normal">
                            {locationLabel(lead.requestedLocationSlug)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {validNext.length > 0 ? (
                          <Select
                            value={lead.status}
                            onValueChange={(val) => statusMutation.mutate({ id: lead.id, status: val })}
                          >
                            <SelectTrigger className="w-[140px] h-8 text-xs" data-testid={`select-lead-status-${lead.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={lead.status}>{STATUS_LABELS[lead.status]}</SelectItem>
                              {validNext.map(s => (
                                <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={STATUS_BADGE_STYLES[lead.status]?.bg || ""}>
                            {STATUS_LABELS[lead.status]}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={lead.assignedRepId?.toString() || "none"}
                          onValueChange={(val) => {
                            if (val !== "none") repMutation.mutate({ id: lead.id, repId: parseInt(val) });
                          }}
                        >
                          <SelectTrigger className="w-[130px] h-8 text-xs" data-testid={`select-lead-rep-${lead.id}`}>
                            <SelectValue placeholder="Assign rep" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              <span className="text-muted-foreground">Unassigned</span>
                            </SelectItem>
                            {reps.map(r => (
                              <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {lead.nextActionType ? (
                          <div className="text-xs">
                            <div className="flex items-center gap-1">
                              {lead.isOverdue && <AlertCircle className="h-3 w-3 text-red-500" />}
                              <span className={lead.isOverdue ? "text-red-600 dark:text-red-400 font-medium" : ""}>
                                {NEXT_ACTION_LABELS[lead.nextActionType] || lead.nextActionType}
                              </span>
                            </div>
                            {lead.nextActionDate && (
                              <span className="text-muted-foreground">
                                {new Date(lead.nextActionDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm font-medium ${activityColor(lead.daysSinceActivity)}`} data-testid={`text-lead-idle-${lead.id}`}>
                          {lead.daysSinceActivity}d
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                      {leads.length === 0 ? "No leads yet." : "No leads match your filters."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
