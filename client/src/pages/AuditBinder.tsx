import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, ArrowLeft, FileText, AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";

interface Company {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  billingCity: string | null;
  billingState: string | null;
}

interface CertificationRecord {
  id: number;
  certificateNumber: string;
  userId: number;
  employeeName: string;
  employeeEmail: string;
  courseId: number;
  courseName: string;
  status: string;
  complianceStatus: "active" | "expiring_soon" | "expired" | "revoked";
  issuedAt: string | null;
  expiresAt: string | null;
}

interface TrainingEvent {
  id: number;
  title: string | null;
  status: string;
  scheduledStart: string | null;
  location: string | null;
}

interface AuditData {
  company: Company;
  certifications: CertificationRecord[];
  trainingEvents: TrainingEvent[];
  summary: {
    total: number;
    active: number;
    expiringSoon: number;
    expired: number;
    revoked: number;
  };
  generatedAt: string;
}

export default function AuditBinder() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const params = useParams<{ companyId?: string }>();

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const isGroupAdmin = user?.role === "group_admin";

  // For group_admin: discover their company from their group members' certifications
  const { data: groupsData } = useQuery<{ groups: any[] }>({
    queryKey: ["/api/groups"],
    enabled: isGroupAdmin && !params.companyId,
  });

  const group = groupsData?.groups?.[0];

  const { data: groupCertsData } = useQuery<{ certifications: any[] }>({
    queryKey: ["/api/groups", group?.id, "certifications"],
    enabled: isGroupAdmin && !params.companyId && !!group?.id,
  });

  // Auto-discover companyId from group certifications
  const discoveredCompanyId = useMemo(() => {
    if (!isGroupAdmin || params.companyId) return null;
    const certs = groupCertsData?.certifications || [];
    const certWithCompany = certs.find((c: any) => c.companyId);
    return certWithCompany?.companyId ?? null;
  }, [isGroupAdmin, params.companyId, groupCertsData]);

  const effectiveCompanyId = params.companyId
    ? parseInt(params.companyId)
    : isAdmin
      ? null // admin needs to pick
      : discoveredCompanyId;

  const { data: auditData, isLoading } = useQuery<AuditData>({
    queryKey: ["/api/audit-binder", effectiveCompanyId],
    enabled: !!effectiveCompanyId,
  });

  // For admin: show a simple company input if no companyId
  const [companyInput, setCompanyInput] = useState("");

  // Admin companies list for selection
  const { data: companiesData } = useQuery<{ companies: Company[] }>({
    queryKey: ["/api/admin/companies"],
    enabled: isAdmin && !params.companyId && !effectiveCompanyId,
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (isAdmin && !effectiveCompanyId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("auditBinder.backToAdmin")}
              </Button>
            </Link>
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t("auditBinder.title")}</h1>
            <p className="text-muted-foreground mt-1">{t("auditBinder.selectCompany")}</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>{t("auditBinder.selectCompany")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(companiesData?.companies || []).map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    {c.billingCity && <p className="text-sm text-muted-foreground">{c.billingCity}, {c.billingState}</p>}
                  </div>
                  <Button size="sm" onClick={() => navigate(`/audit-binder/${c.id}`)}>
                    {t("auditBinder.view")}
                  </Button>
                </div>
              ))}
              {companiesData?.companies?.length === 0 && (
                <p className="text-muted-foreground text-center py-4">{t("auditBinder.noCompanies")}</p>
              )}
              <div className="flex items-center gap-2 pt-2 border-t">
                <input
                  type="number"
                  placeholder={t("auditBinder.enterCompanyId")}
                  value={companyInput}
                  onChange={(e) => setCompanyInput(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                />
                <Button onClick={() => companyInput && navigate(`/audit-binder/${companyInput}`)}>
                  {t("auditBinder.go")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading || !effectiveCompanyId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!auditData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t("auditBinder.noData")}</p>
      </div>
    );
  }

  const handleDownloadPdf = async () => {
    try {
      const res = await fetch(`/api/audit-binder/${effectiveCompanyId}/pdf`, { credentials: "include" });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: t("auditBinder.downloadFailed") }));
        toast({ title: t("auditBinder.downloadFailed"), description: errData.error, variant: "destructive" });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-binder-${auditData.company.name.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: t("auditBinder.downloadStarted"), description: auditData.company.name });
    } catch {
      toast({ title: t("auditBinder.downloadFailed"), variant: "destructive" });
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700 border-green-300"><CheckCircle className="h-3 w-3 mr-1" />{t("auditBinder.active")}</Badge>;
      case "expiring_soon":
        return <Badge className="bg-orange-100 text-orange-700 border-orange-300"><Clock className="h-3 w-3 mr-1" />{t("auditBinder.expiringSoon")}</Badge>;
      case "expired":
        return <Badge className="bg-red-100 text-red-700 border-red-300"><XCircle className="h-3 w-3 mr-1" />{t("auditBinder.expired")}</Badge>;
      case "revoked":
        return <Badge className="bg-red-100 text-red-700 border-red-300"><XCircle className="h-3 w-3 mr-1" />{t("auditBinder.revoked")}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  const summaryCards = [
    { label: t("auditBinder.total"), value: auditData.summary.total, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
    { label: t("auditBinder.active"), value: auditData.summary.active, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
    { label: t("auditBinder.expiringSoon"), value: auditData.summary.expiringSoon, icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50" },
    { label: t("auditBinder.expired"), value: auditData.summary.expired, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            {isAdmin ? (
              <Link to="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t("auditBinder.backToAdmin")}
                </Button>
              </Link>
            ) : (
              <Link to="/group">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t("auditBinder.backToGroup")}
                </Button>
              </Link>
            )}
          </div>
          <Button onClick={handleDownloadPdf} size="sm" className="bg-primary text-primary-foreground">
            <Download className="h-4 w-4 mr-2" />
            {t("auditBinder.downloadPdf")}
          </Button>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold">{t("auditBinder.title")}</h1>
          <p className="text-muted-foreground mt-1">{auditData.company.name}</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summaryCards.map((card) => (
            <Card key={card.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Certifications table */}
        <Card>
          <CardHeader>
            <CardTitle>{t("auditBinder.certRecords")}</CardTitle>
          </CardHeader>
          <CardContent>
            {auditData.certifications.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t("auditBinder.noCerts")}</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("auditBinder.employee")}</TableHead>
                      <TableHead>{t("auditBinder.certNumber")}</TableHead>
                      <TableHead>{t("auditBinder.course")}</TableHead>
                      <TableHead>{t("auditBinder.issued")}</TableHead>
                      <TableHead>{t("auditBinder.expires")}</TableHead>
                      <TableHead>{t("auditBinder.status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditData.certifications.map((cert) => (
                      <TableRow key={cert.id}>
                        <TableCell className="font-medium">{cert.employeeName}</TableCell>
                        <TableCell className="font-mono text-sm">{cert.certificateNumber}</TableCell>
                        <TableCell>{cert.courseName}</TableCell>
                        <TableCell className="text-sm">{formatDate(cert.issuedAt)}</TableCell>
                        <TableCell className="text-sm">{formatDate(cert.expiresAt)}</TableCell>
                        <TableCell>{statusBadge(cert.complianceStatus)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Training history */}
        {auditData.trainingEvents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("auditBinder.trainingHistory")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("auditBinder.event")}</TableHead>
                      <TableHead>{t("auditBinder.date")}</TableHead>
                      <TableHead>{t("auditBinder.location")}</TableHead>
                      <TableHead>{t("auditBinder.status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditData.trainingEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.title || "—"}</TableCell>
                        <TableCell className="text-sm">{formatDate(event.scheduledStart)}</TableCell>
                        <TableCell>{event.location || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{event.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-muted-foreground text-center pb-4">
          {t("auditBinder.generatedOn")}: {formatDate(auditData.generatedAt)}
        </p>
      </div>
    </div>
  );
}
