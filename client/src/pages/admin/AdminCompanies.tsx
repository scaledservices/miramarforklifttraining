import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, ChevronRight, Building2, Map as MapIcon, List } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import MapView from "@/components/admin/MapView";

interface Company {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  billingCity: string | null;
  billingState: string | null;
  industry: string | null;
  employeeCount: number | null;
  assignedRepId: number | null;
  repName: string | null;
  requestCount: number;
  primaryContact: { firstName: string; lastName: string; email: string | null } | null;
  notes: string | null;
  createdAt: string;
}

export default function AdminCompanies() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newIndustry, setNewIndustry] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ companies: Company[] }>({
    queryKey: ["/api/admin/companies"],
  });

  const companies = data?.companies ?? [];

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, string | undefined>) =>
      apiRequest("POST", "/api/admin/companies", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies"] });
      toast({ title: t("adminUx.companyCreated", { defaultValue: "Company created" }) });
      setShowCreate(false);
      setNewName(""); setNewPhone(""); setNewEmail("");
      setNewCity(""); setNewState(""); setNewIndustry("");
    },
    onError: (err: Error) => {
      toast({ title: t("adminUx.companyCreateFailed", { defaultValue: "Failed to create company" }), description: err.message, variant: "destructive" });
    },
  });

  const filtered = useMemo(() => {
    if (!search) return companies;
    const s = search.toLowerCase();
    return companies.filter(c =>
      c.name.toLowerCase().includes(s) ||
      (c.email || "").toLowerCase().includes(s) ||
      (c.phone || "").toLowerCase().includes(s) ||
      (c.billingCity || "").toLowerCase().includes(s) ||
      (c.industry || "").toLowerCase().includes(s) ||
      (c.repName || "").toLowerCase().includes(s)
    );
  }, [companies, search]);

  function handleCreate() {
    if (!newName.trim()) return;
    createMutation.mutate({
      name: newName.trim(),
      phone: newPhone || undefined,
      email: newEmail || undefined,
      billingCity: newCity || undefined,
      billingState: newState || undefined,
      industry: newIndustry || undefined,
    });
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-admin-companies-title">
              {t("adminUx.companiesTitle", { defaultValue: "Companies" })}
            </h1>
            <p className="text-sm text-muted-foreground">
              {companies.length} {t("adminUx.companiesCount", { defaultValue: "company accounts" })}
            </p>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-company">
                <Plus className="h-4 w-4 mr-1" />
                {t("adminUx.companiesAdd", { defaultValue: "Add Company" })}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("adminUx.companiesNew", { defaultValue: "New Company" })}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>{t("adminUx.companiesName", { defaultValue: "Company Name" })} *</Label>
                  <Input value={newName} onChange={e => setNewName(e.target.value)} data-testid="input-company-name" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{t("adminUx.companiesPhone", { defaultValue: "Phone" })}</Label>
                    <Input value={newPhone} onChange={e => setNewPhone(e.target.value)} data-testid="input-company-phone" />
                  </div>
                  <div>
                    <Label>{t("adminUx.companiesEmail", { defaultValue: "Email" })}</Label>
                    <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} data-testid="input-company-email" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{t("adminUx.companiesCity", { defaultValue: "City" })}</Label>
                    <Input value={newCity} onChange={e => setNewCity(e.target.value)} data-testid="input-company-city" />
                  </div>
                  <div>
                    <Label>{t("adminUx.companiesState", { defaultValue: "State" })}</Label>
                    <Input value={newState} onChange={e => setNewState(e.target.value)} data-testid="input-company-state" />
                  </div>
                </div>
                <div>
                  <Label>{t("adminUx.companiesIndustry", { defaultValue: "Industry" })}</Label>
                  <Input value={newIndustry} onChange={e => setNewIndustry(e.target.value)} data-testid="input-company-industry" />
                </div>
                <Button onClick={handleCreate} disabled={!newName.trim() || createMutation.isPending} className="w-full" data-testid="button-submit-company">
                  {createMutation.isPending ? t("common.loading", { defaultValue: "Loading..." }) : t("adminUx.companiesCreate", { defaultValue: "Create Company" })}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search + view toggle */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("adminUx.companiesSearch", { defaultValue: "Search companies..." })}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-companies"
            />
          </div>
          <div className="flex gap-1 bg-muted rounded-md p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === "list" ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="button-view-list"
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">{t("adminUx.companiesViewList", { defaultValue: "List" })}</span>
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === "map" ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="button-view-map"
            >
              <MapIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{t("adminUx.companiesViewMap", { defaultValue: "Map" })}</span>
            </button>
          </div>
        </div>

        {/* Map view */}
        {viewMode === "map" && (
          <div className="space-y-3">
            {isLoading ? (
              <Skeleton className="h-[400px] w-full rounded-xl" />
            ) : (
              <MapView companies={filtered} height={450} />
            )}
            {/* Company list below map for reference */}
            {filtered.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.slice(0, 12).map((company) => (
                  <CompanyMiniCard key={company.id} company={company} onClick={() => navigate(`/admin/companies/${company.id}`)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* List view */}
        {viewMode === "list" && (
          <>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : filtered.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {companies.length === 0
                      ? t("adminUx.companiesEmpty", { defaultValue: "No companies yet. Add your first company account." })
                      : t("adminUx.companiesNoMatch", { defaultValue: "No companies match your search." })}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Desktop: table */}
                <div className="hidden md:block border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("adminUx.companiesColCompany", { defaultValue: "Company" })}</TableHead>
                        <TableHead>{t("adminUx.companiesColContact", { defaultValue: "Primary Contact" })}</TableHead>
                        <TableHead>{t("adminUx.companiesColLocation", { defaultValue: "Location" })}</TableHead>
                        <TableHead>{t("adminUx.companiesColIndustry", { defaultValue: "Industry" })}</TableHead>
                        <TableHead>{t("adminUx.companiesColRep", { defaultValue: "Assigned Rep" })}</TableHead>
                        <TableHead>{t("adminUx.companiesColRequests", { defaultValue: "Requests" })}</TableHead>
                        <TableHead>{t("adminUx.companiesColCreated", { defaultValue: "Created" })}</TableHead>
                        <TableHead className="w-8"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((company) => (
                        <TableRow
                          key={company.id}
                          data-testid={`row-company-${company.id}`}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/admin/companies/${company.id}`)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <span className="font-medium" data-testid={`text-company-name-${company.id}`}>{company.name}</span>
                                {company.email && <p className="text-xs text-muted-foreground">{company.email}</p>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {company.primaryContact ? (
                              <div>
                                <p className="font-medium">{company.primaryContact.firstName} {company.primaryContact.lastName}</p>
                                {company.primaryContact.email && <p className="text-xs text-muted-foreground">{company.primaryContact.email}</p>}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {company.billingCity && company.billingState
                              ? `${company.billingCity}, ${company.billingState}`
                              : company.billingCity || company.billingState || "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {company.industry ? <Badge variant="secondary">{company.industry}</Badge> : "—"}
                          </TableCell>
                          <TableCell className="text-sm" data-testid={`text-company-rep-${company.id}`}>
                            {company.repName || <span className="text-muted-foreground">{t("adminUx.companiesUnassigned", { defaultValue: "Unassigned" })}</span>}
                          </TableCell>
                          <TableCell className="text-sm" data-testid={`text-company-requests-${company.id}`}>
                            {company.requestCount > 0 ? (
                              <Badge variant="secondary">{company.requestCount}</Badge>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(company.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile: card list */}
                <div className="md:hidden space-y-3">
                  {filtered.map((company) => (
                    <CompanyMiniCard
                      key={company.id}
                      company={company}
                      onClick={() => navigate(`/admin/companies/${company.id}`)}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function CompanyMiniCard({ company, onClick }: { company: Company; onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
      data-testid={`card-company-${company.id}`}
    >
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium truncate" data-testid={`text-card-company-name-${company.id}`}>
              {company.name}
            </span>
          </div>
          {company.requestCount > 0 && (
            <Badge variant="secondary" className="shrink-0">{company.requestCount}</Badge>
          )}
        </div>
        {company.primaryContact && (
          <p className="text-sm text-muted-foreground truncate">
            {company.primaryContact.firstName} {company.primaryContact.lastName}
          </p>
        )}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {company.billingCity && <span>{company.billingCity}{company.billingState ? `, ${company.billingState}` : ""}</span>}
          {company.industry && <Badge variant="outline" className="text-[10px]">{company.industry}</Badge>}
        </div>
        {company.repName && (
          <p className="text-xs text-muted-foreground">
            {t("adminUx.companiesColRep", { defaultValue: "Assigned Rep" })}: {company.repName}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
