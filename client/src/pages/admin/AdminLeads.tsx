import { Fragment, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ChevronRight, ChevronDown, Phone, Mail, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ONSITE_STATUSES, STATUS_LABELS, TERMINAL_STATUSES } from "@shared/config/onsite-states";
import {
  onsiteToUnified,
  contactToUnified,
  SOURCE_LABELS,
  SOURCE_BADGE_STYLES,
  type OnsiteLead,
  type ContactSubmission,
  type UnifiedLead,
  type LeadSourceKind,
} from "@/components/admin/leads/lead-types";
import LeadCard from "@/components/admin/leads/LeadCard";
import LeadStatusControl from "@/components/admin/leads/LeadStatusControl";

type SourceFilter = "all" | LeadSourceKind;

export default function AdminLeads() {
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const onsiteQuery = useQuery<{ leads: OnsiteLead[] }>({
    queryKey: ["/api/admin/leads"],
  });

  const contactQuery = useQuery<{ submissions: ContactSubmission[] }>({
    queryKey: ["/api/admin/contact-submissions"],
  });

  const isLoading = onsiteQuery.isLoading || contactQuery.isLoading;

  const allLeads = useMemo<UnifiedLead[]>(() => {
    const onsite = (onsiteQuery.data?.leads ?? []).map(onsiteToUnified);
    const contact = (contactQuery.data?.submissions ?? []).map(contactToUnified);
    return [...onsite, ...contact].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [onsiteQuery.data, contactQuery.data]);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PATCH", `/api/admin/onsite-requests/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/onsite-requests"] });
      toast({ title: "Status updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update status", description: err.message, variant: "destructive" });
    },
  });

  const handleStatusChange = (id: number, status: string) => statusMutation.mutate({ id, status });

  const filtered = useMemo(() => {
    let result = allLeads;
    if (sourceFilter !== "all") {
      result = result.filter((l) => l.sourceKind === sourceFilter);
    }
    if (statusFilter !== "all") {
      // Contact-form inquiries have no pipeline status; they only show under "All".
      result = result.filter((l) => l.status === statusFilter);
    }
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(s) ||
          (l.company || "").toLowerCase().includes(s) ||
          l.email.toLowerCase().includes(s) ||
          (l.phone || "").toLowerCase().includes(s) ||
          (l.city || "").toLowerCase().includes(s) ||
          (l.message || "").toLowerCase().includes(s)
      );
    }
    return result;
  }, [allLeads, sourceFilter, statusFilter, search]);

  const openCount = allLeads.filter(
    (l) => l.sourceKind === "contact" || (l.status && !TERMINAL_STATUSES.includes(l.status))
  ).length;
  const newCount = allLeads.filter(
    (l) => l.sourceKind === "contact" || l.status === "new_lead"
  ).length;
  const overdueCount = allLeads.filter((l) => l.isOverdue).length;

  function handleRowClick(lead: UnifiedLead) {
    if (lead.detailPath) {
      navigate(lead.detailPath);
    } else if (lead.message) {
      setExpandedKey((k) => (k === lead.key ? null : lead.key));
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-admin-leads-title">Leads</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
            <p className="text-sm text-muted-foreground" data-testid="text-open-leads">
              {openCount} open lead{openCount !== 1 ? "s" : ""}
            </p>
            {newCount > 0 && (
              <p className="text-sm text-blue-600 dark:text-blue-400" data-testid="text-new-leads">
                {newCount} new
              </p>
            )}
            {overdueCount > 0 && (
              <p className="text-sm text-red-600 dark:text-red-400" data-testid="text-overdue-leads">
                {overdueCount} overdue
              </p>
            )}
          </div>
        </div>

        <Tabs value={sourceFilter} onValueChange={(v) => setSourceFilter(v as SourceFilter)} data-testid="tabs-source-filter">
          <TabsList className="h-auto gap-1 flex-wrap">
            <TabsTrigger value="all">All Sources</TabsTrigger>
            <TabsTrigger value="onsite">Onsite Requests</TabsTrigger>
            <TabsTrigger value="contact">Contact Form</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-leads"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]" data-testid="select-status-filter">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {ONSITE_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 md:h-12 w-full" />
            ))}
          </div>
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="space-y-3 md:hidden" data-testid="list-leads-mobile">
              {filtered.map((lead) => (
                <LeadCard
                  key={lead.key}
                  lead={lead}
                  onStatusChange={handleStatusChange}
                  statusUpdating={statusMutation.isPending}
                />
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-muted-foreground py-10">
                  {allLeads.length === 0 ? "No leads yet." : "No leads match your filters."}
                </p>
              )}
            </div>

            {/* Desktop: table */}
            <div className="border rounded-md hidden md:block" data-testid="table-leads-desktop">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact / Company</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((lead) => (
                    <Fragment key={lead.key}>
                      <TableRow
                        data-testid={`row-lead-${lead.key}`}
                        className={`cursor-pointer hover:bg-muted/50 ${lead.isOverdue ? "bg-red-50/50 dark:bg-red-950/20" : ""}`}
                        onClick={() => handleRowClick(lead)}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium flex items-center gap-1.5" data-testid={`text-lead-name-${lead.key}`}>
                              {lead.isOverdue && <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />}
                              {lead.name}
                            </p>
                            {lead.company && <p className="text-xs text-muted-foreground">{lead.company}</p>}
                            <p className="text-xs text-muted-foreground">{lead.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs font-normal ${SOURCE_BADGE_STYLES[lead.sourceKind]}`}>
                            {SOURCE_LABELS[lead.sourceKind]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[220px]">
                          {lead.sourceKind === "onsite" ? (
                            <span className="block truncate">
                              {[
                                lead.trainingType,
                                lead.traineeCount ? `${lead.traineeCount} trainees` : null,
                                lead.city && lead.state ? `${lead.city}, ${lead.state}` : null,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          ) : (
                            <span className="block truncate">
                              {lead.trainingType ? `${lead.trainingType} · ` : ""}
                              {lead.message}
                            </span>
                          )}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <LeadStatusControl
                            lead={lead}
                            onStatusChange={handleStatusChange}
                            disabled={statusMutation.isPending}
                          />
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-1">
                            {lead.phone && (
                              <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                                <a href={`tel:${lead.phone}`} title={`Call ${lead.phone}`} data-testid={`link-call-${lead.key}`}>
                                  <Phone className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                              <a href={`mailto:${lead.email}`} title={`Email ${lead.email}`} data-testid={`link-email-${lead.key}`}>
                                <Mail className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {lead.detailPath ? (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          ) : lead.message ? (
                            <ChevronDown
                              className={`h-4 w-4 text-muted-foreground transition-transform ${expandedKey === lead.key ? "rotate-180" : ""}`}
                            />
                          ) : null}
                        </TableCell>
                      </TableRow>
                      {expandedKey === lead.key && lead.message && (
                        <TableRow data-testid={`row-lead-message-${lead.key}`}>
                          <TableCell colSpan={7} className="bg-muted/30">
                            <p className="text-sm whitespace-pre-wrap max-w-3xl" data-testid={`text-lead-message-${lead.key}`}>
                              {lead.message}
                            </p>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                        {allLeads.length === 0 ? "No leads yet." : "No leads match your filters."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
