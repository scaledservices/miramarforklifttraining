import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, ChevronRight, Building2 } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  const [search, setSearch] = useState("");
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
      toast({ title: "Company created" });
      setShowCreate(false);
      setNewName(""); setNewPhone(""); setNewEmail("");
      setNewCity(""); setNewState(""); setNewIndustry("");
    },
    onError: (err: Error) => {
      toast({ title: "Failed to create company", description: err.message, variant: "destructive" });
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-admin-companies-title">Companies</h1>
            <p className="text-sm text-muted-foreground">{companies.length} company account{companies.length !== 1 ? "s" : ""}</p>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-company">
                <Plus className="h-4 w-4 mr-1" />
                Add Company
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Company</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Company Name *</Label>
                  <Input value={newName} onChange={e => setNewName(e.target.value)} data-testid="input-company-name" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Phone</Label>
                    <Input value={newPhone} onChange={e => setNewPhone(e.target.value)} data-testid="input-company-phone" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} data-testid="input-company-email" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>City</Label>
                    <Input value={newCity} onChange={e => setNewCity(e.target.value)} data-testid="input-company-city" />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input value={newState} onChange={e => setNewState(e.target.value)} data-testid="input-company-state" />
                  </div>
                </div>
                <div>
                  <Label>Industry</Label>
                  <Input value={newIndustry} onChange={e => setNewIndustry(e.target.value)} data-testid="input-company-industry" />
                </div>
                <Button onClick={handleCreate} disabled={!newName.trim() || createMutation.isPending} className="w-full" data-testid="button-submit-company">
                  {createMutation.isPending ? "Creating..." : "Create Company"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-companies"
          />
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
                  <TableHead>Company</TableHead>
                  <TableHead>Primary Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Assigned Rep</TableHead>
                  <TableHead>Requests</TableHead>
                  <TableHead>Created</TableHead>
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
                      {company.repName || <span className="text-muted-foreground">Unassigned</span>}
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
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                      {companies.length === 0 ? "No companies yet. Add your first company account." : "No companies match your search."}
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
