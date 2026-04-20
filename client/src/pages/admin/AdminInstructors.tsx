import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Search, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Users, CheckCircle2, XCircle } from "lucide-react";
import { useLocation } from "wouter";

interface OnboardingChecklist {
  identityVerified: boolean;
  experienceReviewed: boolean;
  interviewCompleted: boolean;
  insuranceCollected: boolean;
  agreementSigned: boolean;
  taxInfoCollected: boolean;
  backgroundCheckComplete: boolean;
  readyForAssignment: boolean;
}

interface Instructor {
  id: number;
  applicationId: number | null;
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  zip: string;
  travelRadius: number | null;
  equipmentClasses: string[];
  languages: string[];
  active: boolean;
  internalNotes: string | null;
  onboardingChecklist: OnboardingChecklist;
  createdAt: string;
  updatedAt: string;
}

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY"
];

type SortField = "name" | "date" | "state";
type SortOrder = "asc" | "desc";

function onboardingProgress(checklist: OnboardingChecklist): { done: number; total: number } {
  const items = Object.values(checklist);
  return { done: items.filter(Boolean).length, total: items.length };
}

export default function AdminInstructors() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (activeFilter !== "all") params.set("active", activeFilter);
    if (stateFilter !== "all") params.set("state", stateFilter);
    if (search) params.set("search", search);
    params.set("sort_by", sortBy);
    params.set("sort_order", sortOrder);
    return params.toString();
  };

  const qs = buildQueryString();

  const { data, isLoading } = useQuery<{ instructors: Instructor[] }>({
    queryKey: ["/api/admin/instructors", qs],
    queryFn: () => fetch(`/api/admin/instructors?${qs}`, { credentials: "include" }).then((r) => r.json()),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      apiRequest("PATCH", `/api/admin/instructors/${id}`, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/instructors"] });
      toast({ title: "Instructor updated", description: "Status changed successfully." });
    },
    onError: () => {
      toast({ title: "Update failed", description: "Something went wrong.", variant: "destructive" });
    },
  });

  const instructors = data?.instructors ?? [];

  const toggleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortOrder("asc"); }
  };

  const sortIcon = (field: SortField) => {
    if (sortBy !== field) return <ArrowUpDown className="h-3.5 w-3.5 ml-1 text-muted-foreground" />;
    return sortOrder === "asc" ? <ArrowUp className="h-3.5 w-3.5 ml-1" /> : <ArrowDown className="h-3.5 w-3.5 ml-1" />;
  };

  const activeCount = instructors.filter((i) => i.active).length;
  const inactiveCount = instructors.filter((i) => !i.active).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-admin-instructors-title">
            <Users className="h-6 w-6" />
            Instructor Directory
          </h1>
          <p className="text-sm text-muted-foreground mt-1" data-testid="text-instructor-counts">
            {activeCount} active, {inactiveCount} inactive
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search instructors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-instructors"
            />
          </div>
          <Select value={activeFilter} onValueChange={setActiveFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-active-filter">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="w-[120px]" data-testid="select-state-filter">
              <SelectValue placeholder="All States" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {US_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("name")} data-testid="header-sort-name">
                    <span className="flex items-center">Name{sortIcon("name")}</span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("state")} data-testid="header-sort-state">
                    <span className="flex items-center">Location{sortIcon("state")}</span>
                  </TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Onboarding</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("date")} data-testid="header-sort-date">
                    <span className="flex items-center">Added{sortIcon("date")}</span>
                  </TableHead>
                  <TableHead className="w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instructors.map((inst) => {
                  const progress = onboardingProgress(inst.onboardingChecklist);
                  return (
                    <TableRow key={inst.id} data-testid={`row-instructor-${inst.id}`} className="cursor-pointer hover:bg-muted/50">
                      <TableCell onClick={() => navigate(`/admin/instructors/${inst.id}`)}>
                        <div>
                          <p className="font-medium" data-testid={`text-instructor-name-${inst.id}`}>{inst.fullName}</p>
                          <p className="text-xs text-muted-foreground">{inst.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm" onClick={() => navigate(`/admin/instructors/${inst.id}`)}>
                        {inst.city}, {inst.state}
                      </TableCell>
                      <TableCell onClick={() => navigate(`/admin/instructors/${inst.id}`)}>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {inst.equipmentClasses.slice(0, 2).map((eq) => (
                            <Badge key={eq} variant="secondary" className="text-[10px]">{eq}</Badge>
                          ))}
                          {inst.equipmentClasses.length > 2 && (
                            <Badge variant="outline" className="text-[10px]">+{inst.equipmentClasses.length - 2}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell onClick={() => navigate(`/admin/instructors/${inst.id}`)}>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${progress.done === progress.total ? "bg-emerald-500" : "bg-blue-500"}`}
                              style={{ width: `${(progress.done / progress.total) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{progress.done}/{progress.total}</span>
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          {inst.active ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                          <Switch
                            checked={inst.active}
                            onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: inst.id, active: checked })}
                            data-testid={`switch-active-${inst.id}`}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground" onClick={() => navigate(`/admin/instructors/${inst.id}`)}>
                        {new Date(inst.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell onClick={() => navigate(`/admin/instructors/${inst.id}`)}>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {instructors.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      {search || activeFilter !== "all" || stateFilter !== "all"
                        ? "No instructors match your filters."
                        : "No instructors yet. Approve applications to create instructor records."}
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
