import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Users,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Plus,
  Upload,
  Archive,
  Download,
  ChevronLeft,
} from "lucide-react";

interface Employee {
  id: number;
  companyId: number;
  userId: number | null;
  name: string;
  email: string | null;
  phone: string | null;
  roleTitle: string | null;
  status: string;
  createdAt: string;
}

interface Certification {
  id: number;
  userId: number;
  certificateNumber: string;
  status: string;
  issuedAt: string | null;
  expiresAt: string | null;
}

const EXPIRING_SOON_DAYS = 60;

export default function ComplianceDashboard() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    phone: "",
    roleTitle: "",
  });
  const [importText, setImportText] = useState("");

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const isGroupAdmin = user?.role === "group_admin";

  // Discover company ID for group_admin (same pattern as AuditBinder)
  const { data: groupsData } = useQuery<{ groups: any[] }>({
    queryKey: ["/api/groups"],
    enabled: isGroupAdmin,
  });
  const group = groupsData?.groups?.[0];

  const { data: groupCertsData } = useQuery<{ certifications: any[] }>({
    queryKey: ["/api/groups", group?.id, "certifications"],
    enabled: isGroupAdmin && !!group?.id,
  });

  const discoveredCompanyId = useMemo(() => {
    if (!isGroupAdmin) return null;
    const certs = groupCertsData?.certifications || [];
    const certWithCompany = certs.find((c: any) => c.companyId);
    return certWithCompany?.companyId ?? null;
  }, [isGroupAdmin, groupCertsData]);

  // Fetch roster
  const { data: rosterData, isLoading: rosterLoading } = useQuery<{
    employees: Employee[];
  }>({
    queryKey: ["/api/roster"],
  });

  // Fetch certifications for the company
  const { data: companyCertsData } = useQuery<{
    certifications: Certification[];
  }>({
    queryKey: [
      "/api/audit-binder",
      discoveredCompanyId,
    ],
    enabled: isGroupAdmin && !!discoveredCompanyId,
  });

  const employees = rosterData?.employees || [];
  const certifications = companyCertsData?.certifications || [];

  // Match employees to certifications by userId or email
  const certByUserId = useMemo(() => {
    const map = new Map<number, Certification>();
    for (const cert of certifications) {
      // keep the latest cert
      if (!map.has(cert.userId) || (cert.status === "issued")) {
        map.set(cert.userId, cert);
      }
    }
    return map;
  }, [certifications]);

  const getCertStatus = (emp: Employee) => {
    if (!emp.userId) return "none";
    const cert = certByUserId.get(emp.userId);
    if (!cert) return "none";
    if (cert.status === "revoked") return "expired";
    if (!cert.expiresAt) return "certified";
    const expiry = new Date(cert.expiresAt);
    const now = new Date();
    const diffDays = Math.floor(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays < 0) return "expired";
    if (diffDays <= EXPIRING_SOON_DAYS) return "expiring";
    return "certified";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "certified":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            {t("compliance.certified")}
          </Badge>
        );
      case "expiring":
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
            <Clock className="h-3 w-3 mr-1" />
            {t("compliance.expiringSoon")}
          </Badge>
        );
      case "expired":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            {t("compliance.expired")}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100">
            <AlertCircle className="h-3 w-3 mr-1" />
            {t("compliance.notCertified")}
          </Badge>
        );
    }
  };

  const activeEmployees = employees.filter((e) => e.status === "active");

  // Summary stats
  const summary = useMemo(() => {
    const total = activeEmployees.length;
    let certified = 0,
      expiring = 0,
      expired = 0,
      none = 0;
    for (const emp of activeEmployees) {
      const status = getCertStatus(emp);
      switch (status) {
        case "certified":
          certified++;
          break;
        case "expiring":
          expiring++;
          break;
        case "expired":
          expired++;
          break;
        default:
          none++;
      }
    }
    return { total, certified, expiring, expired, none };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEmployees, certifications]);

  // Add employee mutation
  const addMutation = useMutation({
    mutationFn: async (data: typeof newEmployee) => {
      return apiRequest("POST", "/api/roster", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roster"] });
      toast({ title: t("compliance.employeeAdded") });
      setAddDialogOpen(false);
      setNewEmployee({ name: "", email: "", phone: "", roleTitle: "" });
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  // Bulk import mutation
  const importMutation = useMutation({
    mutationFn: async (text: string) => {
      return apiRequest("POST", "/api/roster/bulk", { text });
    },
    onSuccess: async (res) => {
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/roster"] });
      toast({ title: t("compliance.imported", { count: data.imported }) });
      setImportDialogOpen(false);
      setImportText("");
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  // Archive mutation (single)
  const archiveMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("PATCH", `/api/roster/${id}/archive`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roster"] });
      toast({ title: t("compliance.employeeArchived") });
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  // Bulk archive mutation
  const bulkArchiveMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      return apiRequest("PATCH", "/api/roster/bulk/archive", { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roster"] });
      toast({ title: t("compliance.bulkArchived") });
      setSelectedIds([]);
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const allSelected =
    activeEmployees.length > 0 &&
    selectedIds.length === activeEmployees.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(activeEmployees.map((e) => e.id));
    }
  };

  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const summaryCards = [
    {
      label: t("compliance.totalEmployees"),
      value: summary.total,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: t("compliance.certified"),
      value: summary.certified,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: t("compliance.expiringSoon"),
      value: summary.expiring,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: t("compliance.expired"),
      value: summary.expired,
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: t("compliance.notCertified"),
      value: summary.none,
      icon: AlertCircle,
      color: "text-gray-600",
      bg: "bg-gray-50",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/group">
              <Button variant="ghost" size="sm" className="mb-2 gap-1">
                <ChevronLeft className="h-4 w-4" />
                {t("compliance.backToCrew")}
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-[#4f3b3b]">
              {t("compliance.title")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("compliance.subtitle")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setImportDialogOpen(true)}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {t("compliance.importCsv")}
            </Button>
            <Button
              onClick={() => setAddDialogOpen(true)}
              className="gap-2 bg-[#FFC326] text-black hover:bg-[#e6af1f]"
            >
              <Plus className="h-4 w-4" />
              {t("compliance.addEmployee")}
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {rosterLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-12 w-full" />
                  </CardContent>
                </Card>
              ))
            : summaryCards.map((card) => (
                <Card key={card.label}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${card.bg}`}>
                        <card.icon className={`h-5 w-5 ${card.color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{card.value}</p>
                        <p className="text-xs text-muted-foreground">
                          {card.label}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>

        {/* Audit Binder Link */}
        <Card className="mb-6 border-[#FFC326] bg-amber-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-[#4f3b3b]" />
              <div>
                <p className="font-semibold text-[#4f3b3b]">
                  {t("compliance.auditBinder")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("compliance.auditBinderDesc")}
                </p>
              </div>
            </div>
            <Link
              href={
                discoveredCompanyId
                  ? `/audit-binder/${discoveredCompanyId}`
                  : "/audit-binder"
              }
            >
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                {t("compliance.downloadBinder")}
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Employee Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("compliance.employeeTable")}</CardTitle>
              {selectedIds.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bulkArchiveMutation.mutate(selectedIds)}
                  className="gap-2"
                >
                  <Archive className="h-4 w-4" />
                  {t("compliance.archiveSelected", { count: selectedIds.length })}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {rosterLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : activeEmployees.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{t("compliance.noEmployees")}</p>
                <Button
                  onClick={() => setAddDialogOpen(true)}
                  className="mt-4 gap-2 bg-[#FFC326] text-black hover:bg-[#e6af1f]"
                >
                  <Plus className="h-4 w-4" />
                  {t("compliance.addFirstEmployee")}
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>{t("compliance.name")}</TableHead>
                    <TableHead>{t("compliance.role")}</TableHead>
                    <TableHead>{t("compliance.certStatus")}</TableHead>
                    <TableHead>{t("compliance.certNumber")}</TableHead>
                    <TableHead>{t("compliance.expiryDate")}</TableHead>
                    <TableHead className="text-right">
                      {t("compliance.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeEmployees.map((emp) => {
                    const status = getCertStatus(emp);
                    const cert = emp.userId
                      ? certByUserId.get(emp.userId)
                      : undefined;
                    return (
                      <TableRow key={emp.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(emp.id)}
                            onCheckedChange={() => toggleSelect(emp.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{emp.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {emp.roleTitle || "—"}
                        </TableCell>
                        <TableCell>{getStatusBadge(status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {cert?.certificateNumber || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {cert?.expiresAt
                            ? new Date(cert.expiresAt).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => archiveMutation.mutate(emp.id)}
                            className="text-muted-foreground hover:text-red-600"
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Employee Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("compliance.addEmployee")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">
                {t("compliance.name")} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={newEmployee.name}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, name: e.target.value })
                }
                placeholder={t("form.placeholderName")}
              />
            </div>
            <div>
              <Label htmlFor="email">{t("compliance.email")}</Label>
              <Input
                id="email"
                type="email"
                value={newEmployee.email}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, email: e.target.value })
                }
                placeholder={t("form.placeholderEmail")}
              />
            </div>
            <div>
              <Label htmlFor="phone">{t("compliance.phone")}</Label>
              <Input
                id="phone"
                value={newEmployee.phone}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, phone: e.target.value })
                }
                placeholder={t("form.placeholderPhone")}
              />
            </div>
            <div>
              <Label htmlFor="roleTitle">{t("compliance.roleTitle")}</Label>
              <Input
                id="roleTitle"
                value={newEmployee.roleTitle}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, roleTitle: e.target.value })
                }
                placeholder={t("compliance.roleTitlePlaceholder")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => addMutation.mutate(newEmployee)}
              disabled={!newEmployee.name || addMutation.isPending}
              className="bg-[#FFC326] text-black hover:bg-[#e6af1f]"
            >
              {addMutation.isPending ? t("common.loading") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import CSV Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("compliance.importCsv")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
              <p className="font-medium mb-1">
                {t("compliance.importHelpTitle")}
              </p>
              <p>{t("compliance.importHelpText")}</p>
              <pre className="mt-2 text-xs bg-white p-2 rounded border">
                name,email,phone,roleTitle{"\n"}
                John Smith,john@company.com,555-1234,Forklift Operator{"\n"}
                Jane Doe,jane@company.com,555-5678,Warehouse Lead
              </pre>
            </div>
            <div>
              <Label htmlFor="importText">
                {t("compliance.pasteData")}
              </Label>
              <Textarea
                id="importText"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={8}
                placeholder="John Smith,john@company.com,555-1234,Forklift Operator"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setImportDialogOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => importMutation.mutate(importText)}
              disabled={!importText.trim() || importMutation.isPending}
              className="bg-[#FFC326] text-black hover:bg-[#e6af1f]"
            >
              {importMutation.isPending
                ? t("common.loading")
                : t("compliance.import")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
