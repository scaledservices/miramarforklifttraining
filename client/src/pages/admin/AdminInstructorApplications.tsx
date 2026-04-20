import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Search, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Filter, X, CheckSquare, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

type AppStatus = "applied" | "reviewing" | "approved" | "rejected" | "archived";

interface InstructorApp {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  zip: string;
  yearsExperience: number;
  equipmentTypes: string[];
  availability: string;
  willingToTravel: boolean;
  travelRadius: number | null;
  status: AppStatus;
  createdAt: string;
  updatedAt: string;
}

function statusBadge(status: AppStatus) {
  switch (status) {
    case "applied":
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Applied</Badge>;
    case "reviewing":
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Reviewing</Badge>;
    case "approved":
      return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">Approved</Badge>;
    case "rejected":
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Rejected</Badge>;
    case "archived":
      return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">Archived</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY"
];

const EQUIPMENT_TYPES = [
  "Sit-Down Counterbalance",
  "Stand-Up Reach Truck",
  "Order Picker",
  "Pallet Jack (Electric)",
  "Rough Terrain",
  "Telehandler",
  "Narrow Aisle",
];

type SortField = "date" | "status" | "experience";
type SortOrder = "asc" | "desc";

export default function AdminInstructorApplications() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [equipmentFilter, setEquipmentFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("");
  const [minYears, setMinYears] = useState("all");
  const [willingToTravel, setWillingToTravel] = useState("all");
  const [sortBy, setSortBy] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (stateFilter !== "all") params.set("state", stateFilter);
    if (cityFilter) params.set("city", cityFilter);
    if (equipmentFilter !== "all") params.set("equipment", equipmentFilter);
    if (minYears !== "all") params.set("min_years", minYears);
    if (willingToTravel !== "all") params.set("willing_to_travel", willingToTravel);
    if (search) params.set("search", search);
    params.set("sort_by", sortBy);
    params.set("sort_order", sortOrder);
    return params.toString();
  };

  const queryString = buildQueryString();

  useEffect(() => {
    setSelectedIds(new Set());
  }, [queryString]);

  const { data, isLoading } = useQuery<{ applications: InstructorApp[] }>({
    queryKey: ["/api/admin/instructor-applications", queryString],
    queryFn: () => {
      const url = `/api/admin/instructor-applications${queryString ? `?${queryString}` : ""}`;
      return fetch(url, { credentials: "include" }).then((r) => r.json());
    },
  });

  const bulkMutation = useMutation({
    mutationFn: (payload: { action: string; ids: number[] }) =>
      apiRequest("POST", "/api/admin/instructor-applications/bulk-action", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/instructor-applications"] });
      setSelectedIds(new Set());
      toast({ title: "Bulk action complete", description: "Applications updated successfully." });
    },
    onError: () => {
      toast({ title: "Bulk action failed", description: "Something went wrong.", variant: "destructive" });
    },
  });

  const applications = data?.applications ?? [];
  const appliedCount = applications.filter((a) => a.status === "applied").length;

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const sortIcon = (field: SortField) => {
    if (sortBy !== field) return <ArrowUpDown className="h-3.5 w-3.5 ml-1 text-muted-foreground" />;
    return sortOrder === "asc"
      ? <ArrowUp className="h-3.5 w-3.5 ml-1" />
      : <ArrowDown className="h-3.5 w-3.5 ml-1" />;
  };

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === applications.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(applications.map((a) => a.id)));
  };

  const handleBulkAction = (action: string) => {
    if (selectedIds.size === 0) return;
    if (action === "approved" || action === "rejected" || action === "archived") {
      if (!window.confirm(`Are you sure you want to ${action} ${selectedIds.size} application(s)?`)) return;
    }
    bulkMutation.mutate({ action, ids: Array.from(selectedIds) });
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setStateFilter("all");
    setCityFilter("");
    setEquipmentFilter("all");
    setMinYears("all");
    setWillingToTravel("all");
    setSearch("");
  };

  const hasActiveFilters = statusFilter !== "all" || stateFilter !== "all" || cityFilter !== "" || equipmentFilter !== "all" || minYears !== "all" || willingToTravel !== "all" || search !== "";

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-admin-instructor-apps-title">
              Instructor Applications
            </h1>
            {appliedCount > 0 && (
              <p className="text-sm text-muted-foreground mt-1" data-testid="text-pending-count">
                {appliedCount} new application{appliedCount !== 1 ? "s" : ""} awaiting review
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-applications"
            />
          </div>
          <Button
            variant={showFilters ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            data-testid="button-toggle-filters"
          >
            <Filter className="h-4 w-4 mr-1" />
            Filters
            {hasActiveFilters && <Badge className="ml-1.5 h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full">!</Badge>}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="button-clear-filters">
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="bg-card border rounded-lg p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" data-testid="filter-panel">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">State</label>
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger data-testid="select-filter-state"><SelectValue placeholder="All States" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {US_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">City</label>
              <Input
                placeholder="Filter by city..."
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="h-9"
                data-testid="input-filter-city"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Equipment</label>
              <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
                <SelectTrigger data-testid="select-filter-equipment"><SelectValue placeholder="All Equipment" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Equipment</SelectItem>
                  {EQUIPMENT_TYPES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Min Years Exp</label>
              <Select value={minYears} onValueChange={setMinYears}>
                <SelectTrigger data-testid="select-filter-min-years"><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  <SelectItem value="1">1+</SelectItem>
                  <SelectItem value="3">3+</SelectItem>
                  <SelectItem value="5">5+</SelectItem>
                  <SelectItem value="10">10+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Willing to Travel</label>
              <Select value={willingToTravel} onValueChange={setWillingToTravel}>
                <SelectTrigger data-testid="select-filter-travel"><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <Tabs value={statusFilter} onValueChange={setStatusFilter} data-testid="tabs-status-filter">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="applied">Applied</TabsTrigger>
            <TabsTrigger value="reviewing">Reviewing</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
        </Tabs>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 bg-muted/50 border rounded-lg p-3 flex-wrap" data-testid="bulk-action-bar">
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{selectedIds.size} selected</span>
            <div className="flex-1" />
            <Button size="sm" variant="outline" onClick={() => handleBulkAction("reviewing")} disabled={bulkMutation.isPending} data-testid="button-bulk-reviewing">
              Move to Reviewing
            </Button>
            <Button size="sm" variant="outline" className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-700 dark:hover:bg-emerald-950" onClick={() => handleBulkAction("approved")} disabled={bulkMutation.isPending} data-testid="button-bulk-approve">
              Approve
            </Button>
            <Button size="sm" variant="outline" className="text-red-700 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-950" onClick={() => handleBulkAction("rejected")} disabled={bulkMutation.isPending} data-testid="button-bulk-reject">
              Reject
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkAction("archived")} disabled={bulkMutation.isPending} data-testid="button-bulk-archive">
              Archive
            </Button>
            {bulkMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        )}

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
                  <TableHead className="w-10">
                    <Checkbox
                      checked={applications.length > 0 && selectedIds.size === applications.length}
                      onCheckedChange={toggleSelectAll}
                      data-testid="checkbox-select-all"
                    />
                  </TableHead>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("experience")} data-testid="header-sort-experience">
                    <span className="flex items-center">Experience{sortIcon("experience")}</span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("status")} data-testid="header-sort-status">
                    <span className="flex items-center">Status{sortIcon("status")}</span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("date")} data-testid="header-sort-date">
                    <span className="flex items-center">Applied{sortIcon("date")}</span>
                  </TableHead>
                  <TableHead className="w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id} data-testid={`row-application-${app.id}`} className="cursor-pointer hover:bg-muted/50">
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selectedIds.has(app.id)} onCheckedChange={() => toggleSelect(app.id)} data-testid={`checkbox-app-${app.id}`} />
                    </TableCell>
                    <TableCell onClick={() => navigate(`/admin/instructor-applications/${app.id}`)}>
                      <div>
                        <p className="font-medium" data-testid={`text-app-name-${app.id}`}>{app.fullName}</p>
                        <p className="text-xs text-muted-foreground">{app.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm" onClick={() => navigate(`/admin/instructor-applications/${app.id}`)}>{app.city}, {app.state}</TableCell>
                    <TableCell className="text-sm" data-testid={`text-app-experience-${app.id}`} onClick={() => navigate(`/admin/instructor-applications/${app.id}`)}>
                      {app.yearsExperience} yr{app.yearsExperience !== 1 ? "s" : ""}
                      {app.willingToTravel && <span className="text-xs text-muted-foreground ml-1" title="Willing to travel">&#x2708;</span>}
                    </TableCell>
                    <TableCell onClick={() => navigate(`/admin/instructor-applications/${app.id}`)}>{statusBadge(app.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground" onClick={() => navigate(`/admin/instructor-applications/${app.id}`)}>{new Date(app.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell onClick={() => navigate(`/admin/instructor-applications/${app.id}`)}><ChevronRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                  </TableRow>
                ))}
                {applications.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      {hasActiveFilters ? "No applications match your filters." : "No instructor applications yet."}
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
