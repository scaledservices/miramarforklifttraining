import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import AdminLayout from "./AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Download, Ban, RefreshCw, Building2 } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import CertificateCard from "@/components/admin/certificates/CertificateCard";

export interface AdminCert {
  id: number;
  certificateNumber: string;
  userId: number;
  courseId: number;
  enrollmentId: number;
  status: string;
  pdfUrl: string | null;
  issuedAt: string;
  expiresAt: string | null;
  userName: string;
  userEmail: string;
  courseName: string;
  companyId: number | null;
  companyName: string | null;
}

export default function AdminCertificates() {
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data, isLoading } = useQuery<{ certifications: AdminCert[] }>({
    queryKey: ["/api/admin/certifications"],
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/admin/certifications/${id}/revoke`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/certifications"] });
      toast({ title: "Certificate revoked" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const reissueMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/admin/certifications/${id}/reissue`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/certifications"] });
      toast({ title: "Certificate reissued" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const certs = data?.certifications ?? [];

  const statusVariant = (status: string) => {
    switch (status) {
      case "issued": return "default" as const;
      case "revoked": return "destructive" as const;
      case "reissued": return "secondary" as const;
      default: return "outline" as const;
    }
  };

  const downloadCert = async (certId: number, certNumber: string) => {
    try {
      const res = await fetch(`/api/certifications/${certId}/download`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to download certificate");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificate-${certNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Error", description: "Failed to download certificate", variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold" data-testid="text-admin-certificates-title">Certificates</h1>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="space-y-3 md:hidden" data-testid="list-certs-mobile">
              {certs.map((cert) => (
                <CertificateCard
                  key={cert.id}
                  cert={cert}
                  statusVariant={statusVariant}
                  onDownload={downloadCert}
                  onRevoke={(id) => revokeMutation.mutate(id)}
                  onReissue={(id) => reissueMutation.mutate(id)}
                  revoking={revokeMutation.isPending}
                  reissuing={reissueMutation.isPending}
                />
              ))}
              {certs.length === 0 && (
                <p className="text-center text-muted-foreground py-10">No certificates found</p>
              )}
            </div>

            {/* Desktop: table */}
            <div className="border rounded-md hidden md:block" data-testid="table-certs-desktop">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cert #</TableHead>
                  <TableHead>Learner</TableHead>
                  <TableHead>{t("adminCompany.company")}</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certs.map((cert) => (
                  <TableRow key={cert.id} data-testid={`row-cert-${cert.id}`}>
                    <TableCell data-testid={`text-cert-number-${cert.id}`}>
                      {cert.certificateNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{cert.userName}</div>
                        <div className="text-xs text-muted-foreground">{cert.userEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell data-testid={`text-cert-company-${cert.id}`}>
                      {cert.companyName ? (
                        <Link href={`/admin/companies/${cert.companyId}`} className="text-sm text-primary hover:underline flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {cert.companyName}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground text-xs">{t("adminCompany.noCompany")}</span>
                      )}
                    </TableCell>
                    <TableCell>{cert.courseName}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(cert.status)} data-testid={`badge-cert-status-${cert.id}`}>
                        {cert.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(cert.issuedAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 flex-wrap">
                        {cert.pdfUrl && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => downloadCert(cert.id, cert.certificateNumber)}
                            data-testid={`button-download-cert-${cert.id}`}
                          >
                            <Download />
                          </Button>
                        )}
                        {cert.status === "issued" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => revokeMutation.mutate(cert.id)}
                            disabled={revokeMutation.isPending}
                            data-testid={`button-revoke-cert-${cert.id}`}
                          >
                            <Ban />
                          </Button>
                        )}
                        {cert.status === "revoked" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => reissueMutation.mutate(cert.id)}
                            disabled={reissueMutation.isPending}
                            data-testid={`button-reissue-cert-${cert.id}`}
                          >
                            <RefreshCw />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {certs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No certificates found
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
