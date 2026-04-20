import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import GroupLayout from "./GroupLayout";
import { useTranslation } from "react-i18next";

export default function GroupCertifications() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const { data: groupsData, isLoading: groupsLoading } = useQuery<{ groups: any[] }>({
    queryKey: ["/api/groups"],
  });

  const group = groupsData?.groups?.[0];

  const { data: certsData, isLoading: certsLoading } = useQuery<{ certifications: any[] }>({
    queryKey: ["/api/groups", group?.id, "certifications"],
    enabled: !!group?.id,
  });

  const certifications = certsData?.certifications || [];

  const statusVariant = (status: string) => {
    switch (status) {
      case "issued": return "default";
      case "revoked": return "destructive";
      case "reissued": return "secondary";
      default: return "secondary";
    }
  };

  const handleDownload = async (certId: number, certNumber: string) => {
    try {
      const res = await fetch(`/api/certifications/${certId}/download`, { credentials: "include" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: t("groupCertsExtra.downloadFailed") }));
        toast({ title: t("groupCerts.downloadUnavailable"), description: data.error || t("groupCertsExtra.pdfNotAvailable"), variant: "destructive" });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificate-${certNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: t("groupCerts.error"), description: t("groupCerts.downloadFailed"), variant: "destructive" });
    }
  };

  if (groupsLoading) {
    return (
      <GroupLayout>
        <div className="space-y-6 p-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </GroupLayout>
    );
  }

  if (!group) {
    return (
      <GroupLayout>
        <div className="flex items-center justify-center min-h-[400px]" data-testid="no-group-message">
          <p className="text-muted-foreground">{t("groupCerts.noCrewFound")}</p>
        </div>
      </GroupLayout>
    );
  }

  return (
    <GroupLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">{t("groupCerts.pageTitle")}</h1>
          <p className="text-muted-foreground">{t("groupCerts.pageDesc")}</p>
        </div>

        <Card data-testid="card-certifications-table">
          <CardContent className="p-0">
            {certsLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : certifications.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground" data-testid="text-no-certifications">
                {t("groupCerts.noCerts")}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("groupCerts.thMember")}</TableHead>
                    <TableHead>{t("groupCerts.thCourse")}</TableHead>
                    <TableHead>{t("groupCerts.thCertNumber")}</TableHead>
                    <TableHead>{t("groupCerts.thIssuedDate")}</TableHead>
                    <TableHead>{t("groupCerts.thStatus")}</TableHead>
                    <TableHead>{t("groupCerts.thActions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certifications.map((cert: any) => (
                    <TableRow key={cert.id} data-testid={`row-cert-${cert.id}`}>
                      <TableCell className="font-medium" data-testid={`text-cert-member-${cert.id}`}>
                        {cert.userName}
                      </TableCell>
                      <TableCell data-testid={`text-cert-course-${cert.id}`}>
                        {cert.courseName}
                      </TableCell>
                      <TableCell className="font-mono text-sm" data-testid={`text-cert-number-${cert.id}`}>
                        {cert.certificateNumber}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm" data-testid={`text-cert-date-${cert.id}`}>
                        {cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusVariant(cert.status)}
                          data-testid={`badge-cert-status-${cert.id}`}
                        >
                          {String(t(`status.${cert.status}`, cert.status))}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 flex-wrap">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownload(cert.id, cert.certificateNumber)}
                            title={t("groupCerts.downloadPdf")}
                            data-testid={`button-download-${cert.id}`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toast({ title: t("groupCerts.walletCardTitle"), description: t("groupCerts.walletCardDesc") })}
                            title={t("groupCerts.orderWalletCard")}
                            data-testid={`button-wallet-card-${cert.id}`}
                          >
                            <CreditCard className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </GroupLayout>
  );
}
