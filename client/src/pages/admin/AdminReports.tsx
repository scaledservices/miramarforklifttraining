import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import MoneySummaryCard from "@/components/admin/money/MoneySummaryCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Award, DollarSign, Building2, MapPin,
  TrendingUp, Users, AlertTriangle, Loader2, Link2,
} from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

interface CertsByCompany {
  companyId: number | null;
  companyName: string;
  count: number;
}

interface ExpiringCert {
  id: number;
  certificateNumber: string;
  userId: number;
  courseId: number;
  expiresAt: string;
  companyId: number | null;
  companyName: string | null;
  learnerName: string;
  courseName: string;
}

interface RevenueByCompany {
  companyId: number | null;
  companyName: string;
  revenue: number;
  orderCount: number;
}

interface RepPerformance {
  repId: number | null;
  repName: string;
  leadCount: number;
  ownedLeads: number;
}

interface RevenueByMarket {
  market: string;
  revenue: number;
  orderCount: number;
}

interface ReportsData {
  certsByCompany: CertsByCompany[];
  expiringCertifications: ExpiringCert[];
  revenueByCompany: RevenueByCompany[];
  volume: { onsite: number; facility: number };
  conversionRates: {
    leadToScheduled: number;
    scheduledToCompleted: number;
    totalLeads: number;
    scheduledFromLeads: number;
    totalScheduledOrDone: number;
    totalCompleted: number;
  };
  repPerformance: RepPerformance[];
  revenueByMarket: RevenueByMarket[];
}

export default function AdminReports() {
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data, isLoading } = useQuery<ReportsData>({
    queryKey: ["/api/admin/reports"],
  });

  const backfillLeadsMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/backfill/leads-to-companies"),
    onSuccess: async (response: Response) => {
      const result = await response.json();
      const desc = `${result.linked} / ${result.orphanedLeads} ${t("adminReports.leadsLinked")}${result.skipped ? ` (${result.skipped} ${t("adminReports.skippedAmbiguous")})` : ""}`;
      toast({ title: t("adminReports.backfillComplete"), description: desc });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const backfillOrdersMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/backfill/orders-to-companies"),
    onSuccess: async (response: Response) => {
      const result = await response.json();
      const desc = `${result.linked} / ${result.orphanedOrders} ${t("adminReports.ordersLinked")}${result.skipped ? ` (${result.skipped} ${t("adminReports.skippedAmbiguous")})` : ""}`;
      toast({ title: t("adminReports.backfillComplete"), description: desc });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const backfillCertsMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/backfill/certs-to-companies"),
    onSuccess: async (response: Response) => {
      const result = await response.json();
      toast({ title: t("adminReports.backfillComplete"), description: `${result.linked} / ${result.orphanedCerts} ${t("adminReports.certsLinked")}` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const isBackfilling = backfillLeadsMutation.isPending || backfillOrdersMutation.isPending || backfillCertsMutation.isPending;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Failed to load reports data.</p>
        </div>
      </AdminLayout>
    );
  }

  const report = data;
  const totalVolume = report.volume.onsite + report.volume.facility;

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="admin-reports-page">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-reports-title">{t("adminReports.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("adminReports.description")}</p>
        </div>

        <MoneySummaryCard />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card data-testid="card-conversion-lead">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                {t("adminReports.leadToScheduled")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold" data-testid="text-lead-conversion">{report.conversionRates.leadToScheduled}%</p>
              <p className="text-xs text-muted-foreground">
                {report.conversionRates.scheduledFromLeads} / {report.conversionRates.totalLeads} {t("adminReports.leads")}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-conversion-scheduled">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                {t("adminReports.scheduledToCompleted")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold" data-testid="text-scheduled-conversion">{report.conversionRates.scheduledToCompleted}%</p>
              <p className="text-xs text-muted-foreground">
                {report.conversionRates.totalCompleted} / {report.conversionRates.totalScheduledOrDone} {t("adminReports.events")}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-volume-onsite">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-amber-500" />
                {t("adminReports.onsiteVolume")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold" data-testid="text-onsite-volume">{report.volume.onsite}</p>
              <p className="text-xs text-muted-foreground">
                {totalVolume > 0 ? ((report.volume.onsite / totalVolume) * 100).toFixed(0) : 0}% {t("adminReports.ofTotal")}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-volume-facility">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4 text-purple-500" />
                {t("adminReports.facilityVolume")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold" data-testid="text-facility-volume">{report.volume.facility}</p>
              <p className="text-xs text-muted-foreground">
                {totalVolume > 0 ? ((report.volume.facility / totalVolume) * 100).toFixed(0) : 0}% {t("adminReports.ofTotal")}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="card-revenue-by-company">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                {t("adminReports.revenueByCompany")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {report.revenueByCompany.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("adminReports.noData")}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("adminReports.company")}</TableHead>
                      <TableHead className="text-right">{t("adminReports.revenue")}</TableHead>
                      <TableHead className="text-right">{t("adminReports.orders")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.revenueByCompany.map((row) => (
                      <TableRow key={row.companyId} data-testid={`row-revenue-${row.companyId}`}>
                        <TableCell>
                          <Link href={`/admin/companies/${row.companyId}`} className="text-primary hover:underline text-sm">
                            {row.companyName}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right font-medium">${row.revenue.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{row.orderCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-certs-by-company">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                {t("adminReports.certsByCompany")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {report.certsByCompany.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("adminReports.noData")}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("adminReports.company")}</TableHead>
                      <TableHead className="text-right">{t("adminReports.certifications")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.certsByCompany.map((row) => (
                      <TableRow key={row.companyId} data-testid={`row-certs-${row.companyId}`}>
                        <TableCell>
                          <Link href={`/admin/companies/${row.companyId}`} className="text-primary hover:underline text-sm">
                            {row.companyName}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right font-medium">{row.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <Card data-testid="card-expiring-certs">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              {t("adminReports.expiringCertifications")}
              {report.expiringCertifications.length > 0 && (
                <Badge variant="outline" className="ml-2 text-orange-600 border-orange-300">
                  {report.expiringCertifications.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.expiringCertifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("adminReports.noExpiringCerts")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("adminReports.certNumber")}</TableHead>
                    <TableHead>{t("adminReports.learner")}</TableHead>
                    <TableHead>{t("adminReports.course")}</TableHead>
                    <TableHead>{t("adminReports.company")}</TableHead>
                    <TableHead>{t("adminReports.expiresAt")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.expiringCertifications.map((cert) => (
                    <TableRow key={cert.id} data-testid={`row-expiring-${cert.id}`}>
                      <TableCell className="font-mono text-xs">{cert.certificateNumber}</TableCell>
                      <TableCell className="text-sm">{cert.learnerName}</TableCell>
                      <TableCell className="text-sm">{cert.courseName}</TableCell>
                      <TableCell>
                        {cert.companyName ? (
                          <Link href={`/admin/companies/${cert.companyId}`} className="text-primary hover:underline text-sm">
                            {cert.companyName}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">
                          {new Date(cert.expiresAt).toLocaleDateString()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-rep-performance">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" />
              {t("adminReports.repPerformance")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.repPerformance.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("adminReports.noData")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("adminReports.rep")}</TableHead>
                    <TableHead className="text-right">{t("adminReports.sourcedLeads")}</TableHead>
                    <TableHead className="text-right">{t("adminReports.ownedLeads")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.repPerformance.map((row) => (
                    <TableRow key={row.repId} data-testid={`row-rep-${row.repId}`}>
                      <TableCell className="font-medium text-sm">{row.repName}</TableCell>
                      <TableCell className="text-right">{row.leadCount}</TableCell>
                      <TableCell className="text-right">{row.ownedLeads}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-revenue-by-market">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-5 w-5 text-teal-500" />
              {t("adminReports.revenueByMarket")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.revenueByMarket.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("adminReports.noData")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("adminReports.market")}</TableHead>
                    <TableHead className="text-right">{t("adminReports.revenue")}</TableHead>
                    <TableHead className="text-right">{t("adminReports.orders")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.revenueByMarket.map((row) => (
                    <TableRow key={row.market} data-testid={`row-market-${row.market}`}>
                      <TableCell className="font-medium text-sm capitalize">
                        {row.market === "customer_onsite" ? t("adminReports.onsiteMarket") : t("adminReports.facilityMarket")}
                      </TableCell>
                      <TableCell className="text-right font-medium">${row.revenue.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{row.orderCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-backfill-utilities">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="h-5 w-5 text-slate-500" />
              {t("adminReports.backfillUtilities")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t("adminReports.backfillDescription")}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => backfillLeadsMutation.mutate()}
                disabled={isBackfilling}
                data-testid="button-backfill-leads"
              >
                {backfillLeadsMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {t("adminReports.backfillLeads")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => backfillOrdersMutation.mutate()}
                disabled={isBackfilling}
                data-testid="button-backfill-orders"
              >
                {backfillOrdersMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {t("adminReports.backfillOrders")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => backfillCertsMutation.mutate()}
                disabled={isBackfilling}
                data-testid="button-backfill-certs"
              >
                {backfillCertsMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {t("adminReports.backfillCerts")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
