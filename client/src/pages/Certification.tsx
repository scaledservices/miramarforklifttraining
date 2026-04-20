import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  Award,
  Download,
  CreditCard,
  Calendar,
  Hash,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Loader2,
  GraduationCap,
} from "lucide-react";
import EmployerDocs from "@/components/lms/EmployerDocs";
import { queryClient } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";

export default function Certification() {
  const { t } = useTranslation();
  const params = useParams<{ id: string }>();
  const certId = parseInt(params.id || "0");
  const [downloading, setDownloading] = useState(false);

  function statusBadge(status: string) {
    switch (status) {
      case "issued":
        return <Badge variant="default" className="bg-green-600 border-green-600" data-testid="badge-status-issued"><ShieldCheck className="h-3 w-3 mr-1" />{t("certification.statusIssued")}</Badge>;
      case "revoked":
        return <Badge variant="destructive" data-testid="badge-status-revoked"><AlertTriangle className="h-3 w-3 mr-1" />{t("certification.statusRevoked")}</Badge>;
      case "reissued":
        return <Badge variant="secondary" data-testid="badge-status-reissued"><RefreshCw className="h-3 w-3 mr-1" />{t("certification.statusReissued")}</Badge>;
      default:
        return <Badge variant="secondary" data-testid="badge-status-unknown">{status}</Badge>;
    }
  }

  const { data, isLoading, error } = useQuery<{ certification: any }>({
    queryKey: ["/api/certifications", certId],
    enabled: certId > 0,
    refetchInterval: (query) => {
      const cert = query.state.data?.certification;
      if (cert && !cert.pdfUrl) {
        return 3000;
      }
      return false;
    },
  });

  const cert = data?.certification;

  useEffect(() => {
    if (cert?.pdfUrl) {
      queryClient.invalidateQueries({ queryKey: ["/api/certifications", certId] });
    }
  }, [cert?.pdfUrl, certId]);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6" data-testid="loading-certification">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center space-y-4" data-testid="error-certification">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
        <h1 className="text-2xl font-bold">{t("certification.notFoundTitle")}</h1>
        <p className="text-muted-foreground">{t("certification.notFoundDesc")}</p>
        <Link href="/dashboard">
          <Button data-testid="button-back-dashboard">{t("certification.backToDashboard")}</Button>
        </Link>
      </div>
    );
  }

  const pdfReady = !!cert.pdfUrl;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/certifications/${certId}/download`, { credentials: "include" });
      if (!res.ok) throw new Error("Download not available");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificate-${cert.certificateNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8" data-testid="page-certification">
      <div className="flex items-start gap-4 flex-wrap">
        <div className="h-14 w-14 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
          <Award className="h-7 w-7 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-certification-title">
            {t("certification.pageTitle")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("certification.pageSubtitle")}</p>
        </div>
        {statusBadge(cert.status)}
      </div>

      <Card data-testid="card-certification-details">
        <CardHeader>
          <CardTitle className="text-lg">{t("certification.detailsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("certification.certNumberLabel")}</p>
                <p className="font-mono font-semibold" data-testid="text-cert-number">{cert.certificateNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("certification.issuedDateLabel")}</p>
                <p className="font-semibold" data-testid="text-issued-date">
                  {new Date(cert.issuedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("certification.expirationDateLabel")}</p>
                <p className="font-semibold" data-testid="text-expiration-date">
                  {cert.expiresAt ? new Date(cert.expiresAt).toLocaleDateString() : t("certification.noExpiration")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("certification.statusLabel")}</p>
                <div data-testid="text-cert-status">{statusBadge(cert.status)}</div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-wrap gap-3">
            <Button
              onClick={handleDownload}
              disabled={!pdfReady || downloading}
              data-testid="button-download-pdf"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {!pdfReady ? t("certification.pdfGenerating") : downloading ? t("certification.downloading") : t("certification.downloadPdf")}
            </Button>
            <Link href="/dashboard">
              <Button variant="outline" data-testid="button-back-dashboard">
                {t("certification.backToDashboard")}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-wallet-upsell">
        <CardContent className="py-6 flex items-start gap-4">
          <div className="h-10 w-10 rounded-md bg-accent/20 flex items-center justify-center shrink-0">
            <CreditCard className="h-5 w-5 text-accent" />
          </div>
          <div className="space-y-2 flex-1">
            <h3 className="font-semibold">{t("certification.walletCardTitle")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("certification.walletCardDesc")}
            </p>
            <Link href={`/order-cert-card/${certId}`}>
              <Button data-testid="button-order-wallet-card">
                {t("certification.orderPhysicalCard")}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-instructor-cta">
        <CardContent className="py-6 flex items-start gap-4">
          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-2 flex-1">
            <h3 className="font-semibold">{t("certification.instructorTitle")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("certification.instructorDesc")}
            </p>
            <Link href="/become-an-instructor">
              <Button variant="outline" data-testid="button-become-instructor">
                {t("certification.learnMoreApply")}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <EmployerDocs />
    </div>
  );
}
