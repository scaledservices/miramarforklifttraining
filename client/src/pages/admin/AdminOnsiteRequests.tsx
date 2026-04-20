import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronRight, UserCheck, UserX, ArrowUpDown, Filter, X } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

interface OnsiteRequest {
  id: number;
  companyName: string | null;
  contactName: string;
  email: string;
  phone: string;
  trainingAddress: string;
  city: string;
  state: string;
  zip: string;
  traineeCount: number;
  preferredDate1: string | null;
  preferredDate2: string | null;
  preferredDate3: string | null;
  equipmentTypes: string[];
  trainingType: string;
  notes: string | null;
  status: "new_lead" | "contacted" | "quoted" | "quote_accepted" | "quote_declined" | "scheduled" | "confirmed" | "completed" | "invoiced" | "unresponsive" | "cancelled";
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Assignment {
  id: number;
  requestId: number;
  instructorId: number;
  status: string;
  instructorName: string;
}

type SortField = "submitted" | "preferredDate" | "status" | "trainees" | "location";
type SortDir = "asc" | "desc";

const STATUS_BADGE_STYLES: Record<string, { bg: string; label: string }> = {
  new_lead: { bg: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", label: "New Lead" },
  contacted: { bg: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200", label: "Contacted" },
  quoted: { bg: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", label: "Quoted" },
  quote_accepted: { bg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200", label: "Quote Accepted" },
  quote_declined: { bg: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", label: "Quote Declined" },
  scheduled: { bg: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200", label: "Scheduled" },
  confirmed: { bg: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", label: "Confirmed" },
  completed: { bg: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200", label: "Completed" },
  invoiced: { bg: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", label: "Invoiced" },
  unresponsive: { bg: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200", label: "Unresponsive" },
  cancelled: { bg: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", label: "Cancelled" },
};

function statusBadge(status: OnsiteRequest["status"]) {
  const style = STATUS_BADGE_STYLES[status];
  if (!style) return <Badge variant="outline">{status}</Badge>;
  return <Badge className={style.bg}>{style.label}</Badge>;
}

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
];

export default function AdminOnsiteRequests() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("");
  const [equipmentFilter, setEquipmentFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sortField, setSortField] = useState<SortField>("submitted");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [, navigate] = useLocation();

  const { data, isLoading } = useQuery<{ requests: OnsiteRequest[] }>({
    queryKey: ["/api/admin/onsite-requests", statusFilter],
    queryFn: () => {
      const url = statusFilter === "all"
        ? "/api/admin/onsite-requests"
        : `/api/admin/onsite-requests?status=${statusFilter}`;
      return fetch(url, { credentials: "include" }).then((r) => r.json());
    },
  });

  const requests = data?.requests ?? [];

  const { data: summaryData } = useQuery<{ summary: Record<string, Assignment[]> }>({
    queryKey: ["/api/admin/onsite-requests/assignment-summary"],
    queryFn: () => fetch("/api/admin/onsite-requests/assignment-summary", { credentials: "include" }).then(r => r.json()),
    enabled: requests.length > 0,
  });

  const assignmentMap: Record<number, Assignment[]> = {};
  if (summaryData?.summary) {
    for (const [key, val] of Object.entries(summaryData.summary)) {
      assignmentMap[Number(key)] = val;
    }
  }

  const allEquipmentTypes = useMemo(() => {
    const set = new Set<string>();
    requests.forEach(r => r.equipmentTypes.forEach(e => set.add(e)));
    return Array.from(set).sort();
  }, [requests]);

  const hasAdvancedFilters = stateFilter !== "all" || cityFilter !== "" || equipmentFilter !== "all" || dateFrom !== "" || dateTo !== "";

  const filtered = useMemo(() => {
    let result = requests;

    if (search) {
      const s = search.toLowerCase();
      result = result.filter((r) =>
        r.contactName.toLowerCase().includes(s) ||
        r.email.toLowerCase().includes(s) ||
        (r.companyName || "").toLowerCase().includes(s) ||
        r.trainingType.toLowerCase().includes(s) ||
        r.city.toLowerCase().includes(s) ||
        r.state.toLowerCase().includes(s) ||
        r.phone.toLowerCase().includes(s)
      );
    }

    if (stateFilter !== "all") {
      result = result.filter(r => r.state.toUpperCase() === stateFilter);
    }
    if (cityFilter) {
      result = result.filter(r => r.city.toLowerCase().includes(cityFilter.toLowerCase()));
    }
    if (equipmentFilter !== "all") {
      result = result.filter(r => r.equipmentTypes.some(e => e.toLowerCase() === equipmentFilter.toLowerCase()));
    }
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      result = result.filter(r => new Date(r.createdAt).getTime() >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime() + 86400000;
      result = result.filter(r => new Date(r.createdAt).getTime() < to);
    }

    result = [...result].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortField) {
        case "submitted":
          return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        case "preferredDate": {
          const da = a.preferredDate1 ? new Date(a.preferredDate1).getTime() : 0;
          const db = b.preferredDate1 ? new Date(b.preferredDate1).getTime() : 0;
          return dir * (da - db);
        }
        case "status":
          return dir * a.status.localeCompare(b.status);
        case "trainees":
          return dir * (a.traineeCount - b.traineeCount);
        case "location":
          return dir * (`${a.state},${a.city}`).localeCompare(`${b.state},${b.city}`);
        default:
          return 0;
      }
    });

    return result;
  }, [requests, search, stateFilter, cityFilter, equipmentFilter, dateFrom, dateTo, sortField, sortDir]);

  const newLeadCount = requests.filter((r) => r.status === "new_lead").length;
  const unassignedScheduledCount = requests.filter(r => {
    if (r.status !== "scheduled" && r.status !== "confirmed") return false;
    const assignments = assignmentMap[r.id] ?? [];
    return !assignments.some(a => a.status !== "cancelled");
  }).length;

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  function clearAdvancedFilters() {
    setStateFilter("all");
    setCityFilter("");
    setEquipmentFilter("all");
    setDateFrom("");
    setDateTo("");
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-admin-onsite-requests-title">
              On-Site Training Requests
            </h1>
            <div className="flex gap-4 mt-1">
              {newLeadCount > 0 && (
                <p className="text-sm text-muted-foreground" data-testid="text-new-count">
                  {newLeadCount} new lead{newLeadCount !== 1 ? "s" : ""} awaiting review
                </p>
              )}
              {unassignedScheduledCount > 0 && (
                <p className="text-sm text-orange-600 dark:text-orange-400" data-testid="text-unassigned-count">
                  {unassignedScheduledCount} scheduled request{unassignedScheduledCount !== 1 ? "s" : ""} need instructor assignment
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-requests"
            />
          </div>
          <Button
            variant={showAdvanced ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            data-testid="button-toggle-filters"
          >
            <Filter className="h-4 w-4 mr-1" />
            Filters
            {hasAdvancedFilters && <Badge className="ml-1.5 h-5 w-5 p-0 flex items-center justify-center text-[10px]" variant="default">!</Badge>}
          </Button>
          {hasAdvancedFilters && (
            <Button variant="ghost" size="sm" onClick={clearAdvancedFilters} data-testid="button-clear-filters">
              <X className="h-3.5 w-3.5 mr-1" /> Clear filters
            </Button>
          )}
        </div>

        {showAdvanced && (
          <div className="flex flex-wrap items-end gap-3 p-4 border rounded-lg bg-muted/30" data-testid="panel-advanced-filters">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">State</label>
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger className="w-[120px]" data-testid="select-state-filter">
                  <SelectValue placeholder="All states" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All states</SelectItem>
                  {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">City</label>
              <Input
                placeholder="Filter by city..."
                value={cityFilter}
                onChange={e => setCityFilter(e.target.value)}
                className="w-[160px]"
                data-testid="input-city-filter"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Equipment</label>
              <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-equipment-filter">
                  <SelectValue placeholder="All equipment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All equipment</SelectItem>
                  {allEquipmentTypes.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Submitted From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="w-[160px]"
                data-testid="input-date-from"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Submitted To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="w-[160px]"
                data-testid="input-date-to"
              />
            </div>
          </div>
        )}

        <Tabs value={statusFilter} onValueChange={setStatusFilter} data-testid="tabs-status-filter">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="new_lead">New Lead</TabsTrigger>
            <TabsTrigger value="contacted">Contacted</TabsTrigger>
            <TabsTrigger value="quoted">Quoted</TabsTrigger>
            <TabsTrigger value="quote_accepted">Accepted</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="invoiced">Invoiced</TabsTrigger>
            <TabsTrigger value="unresponsive">Unresponsive</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact / Company</TableHead>
                  <TableHead>Training Type</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("trainees")}>
                    Trainees <SortIcon field="trainees" />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("location")}>
                    Location <SortIcon field="location" />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("status")}>
                    Status <SortIcon field="status" />
                  </TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("submitted")}>
                    Submitted <SortIcon field="submitted" />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("preferredDate")}>
                    Requested Date <SortIcon field="preferredDate" />
                  </TableHead>
                  <TableHead className="w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((req) => {
                  const assignments = assignmentMap[req.id] ?? [];
                  const activeAssignments = assignments.filter(a => a.status !== "cancelled");
                  const hasInstructor = activeAssignments.length > 0;

                  return (
                    <TableRow
                      key={req.id}
                      data-testid={`row-request-${req.id}`}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/admin/onsite-requests/${req.id}`)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium" data-testid={`text-request-name-${req.id}`}>{req.contactName}</p>
                          {req.companyName && (
                            <p className="text-xs text-muted-foreground">{req.companyName}</p>
                          )}
                          <p className="text-xs text-muted-foreground">{req.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{req.trainingType}</TableCell>
                      <TableCell className="text-sm" data-testid={`text-request-trainees-${req.id}`}>{req.traineeCount}</TableCell>
                      <TableCell className="text-sm max-w-[160px] truncate">{req.city}, {req.state}</TableCell>
                      <TableCell>{statusBadge(req.status)}</TableCell>
                      <TableCell>
                        {hasInstructor ? (
                          <div className="flex flex-col gap-0.5" data-testid={`badge-assigned-${req.id}`}>
                            <div className="flex items-center gap-1.5">
                              <UserCheck className="h-4 w-4 text-emerald-500" />
                              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                                {activeAssignments[0].instructorName}
                              </span>
                            </div>
                            <Badge variant="outline" className="text-[10px] w-fit capitalize">
                              {activeAssignments[0].status}
                            </Badge>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5" data-testid={`badge-unassigned-${req.id}`}>
                            <UserX className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Unassigned</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {req.preferredDate1
                          ? new Date(req.preferredDate1).toLocaleDateString()
                          : <span className="text-muted-foreground/50">—</span>}
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
                      {requests.length === 0 ? "No on-site training requests yet." : "No requests match your filters."}
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
