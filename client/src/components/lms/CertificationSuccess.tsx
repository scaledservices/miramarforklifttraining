import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Award,
  CreditCard,
  FileText,
  Star,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";

interface CertificationSuccessProps {
  certification?: {
    id: number;
    certificateNumber: string;
    pdfUrl?: string | null;
    issuedAt?: string;
    expiresAt?: string | null;
  } | null;
  enrollmentId: number;
}

export default function CertificationSuccess({ certification: propCert, enrollmentId }: CertificationSuccessProps) {
  const { t } = useTranslation();
  const { data } = useQuery<{ certifications: any[] }>({
    queryKey: ["/api/certifications"],
    enabled: !propCert,
  });

  const cert = propCert || data?.certifications?.find((c: any) => c.enrollmentId === enrollmentId);

  return (
    <div className="max-w-2xl mx-auto text-center space-y-8 py-8" data-testid="certification-success">
      <div className="space-y-4">
        <div className="relative inline-block">
          <div className="h-24 w-24 rounded-full bg-accent/20 flex items-center justify-center mx-auto">
            <Award className="h-12 w-12 text-accent" />
          </div>
          <div className="absolute -top-1 -right-1">
            <Star className="h-6 w-6 text-accent fill-accent" />
          </div>
          <div className="absolute -top-2 -left-2">
            <Star className="h-4 w-4 text-accent fill-accent" />
          </div>
          <div className="absolute -bottom-1 right-0">
            <Star className="h-5 w-5 text-accent fill-accent" />
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold" data-testid="text-certified-title">
          {t("certSuccess.title")}
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          {t("certSuccess.subtitle")}
        </p>
      </div>

      {cert && (
        <Card data-testid="card-certificate-info">
          <CardContent className="py-6 space-y-4">
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <span className="font-semibold">{t("certSuccess.certificateVerified")}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Badge variant="secondary" data-testid="badge-cert-number">
                #{cert.certificateNumber}
              </Badge>
              {cert.expiresAt && (
                <p className="text-sm text-muted-foreground" data-testid="text-cert-expiry">
                  {t("certSuccess.validUntil", { date: new Date(cert.expiresAt).toLocaleDateString() })}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {cert && (
          <Link href={`/certifications/${cert.id}`}>
            <Button className="w-full" data-testid="button-view-certification">
              <Award className="h-4 w-4 mr-2" />
              {t("certSuccess.viewCertification")}
            </Button>
          </Link>
        )}

        <Link href="/dashboard">
          <Button variant="outline" className="w-full" data-testid="button-back-dashboard">
            <FileText className="h-4 w-4 mr-2" />
            {t("certSuccess.backToDashboard")}
          </Button>
        </Link>
      </div>

      <Card className="text-left" data-testid="card-wallet-upsell">
        <CardContent className="py-6 flex items-start gap-4">
          <div className="h-10 w-10 rounded-md bg-accent/20 flex items-center justify-center shrink-0">
            <CreditCard className="h-5 w-5 text-accent" />
          </div>
          <div className="space-y-2 flex-1">
            <h3 className="font-semibold">{t("certSuccess.walletCardTitle")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("certSuccess.walletCardDesc")}
            </p>
            {cert && (
              <Link href={`/order-cert-card/${cert.id}`}>
                <Button variant="default" data-testid="button-order-wallet-card">
                  {t("certSuccess.orderWalletCard")}
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="text-left" data-testid="card-instructor-cta">
        <CardContent className="py-6 flex items-start gap-4">
          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-2 flex-1">
            <h3 className="font-semibold">{t("certSuccess.instructorTitle")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("certSuccess.instructorDesc")}
            </p>
            <Link href="/become-an-instructor">
              <Button variant="outline" data-testid="button-become-instructor">
                {t("certSuccess.learnMoreApply")}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground space-y-1">
        <p>{t("certSuccess.employerDocsPrompt")}</p>
        <Link href="/documentation">
          <Button variant="ghost" className="text-sm" data-testid="link-employer-docs">
            {t("certSuccess.viewEmployerDocs")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
