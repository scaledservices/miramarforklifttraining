import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import SEOHead from "@/components/seo/SEOHead";
import { brand } from "@shared/config/brand";
import { industry } from "@shared/config/industry";
import {
  ShieldCheck,
  ShieldX,
  Calendar,
  Award,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";

interface VerifyResponse {
  valid: boolean;
  certificateNumber: string;
  holderName: string;
  courseName: string;
  issuedAt: string;
  expiresAt: string | null;
  status: string;
}

export default function CertificateVerify() {
  const { t } = useTranslation();
  const params = useParams<{ certificateNumber: string }>();
  const certNumber = params.certificateNumber || "";

  const seoHead = (
    <SEOHead
      title={`${t("certVerify.seoTitle")} | ${brand.name}`}
      description={t("certVerify.seoDescription")}
      noindex
    />
  );

  const { data, isLoading, error } = useQuery<VerifyResponse>({
    queryKey: ["/api/verify", certNumber],
    enabled: !!certNumber,
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  if (isLoading) {
    return (
      <>{seoHead}<div className="max-w-xl mx-auto px-4 py-16 space-y-6" data-testid="loading-verify">
        <Skeleton className="h-32 w-32 rounded-full mx-auto" />
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-40 w-full" />
      </div></>
    );
  }

  if (error || !data) {
    return (
      <>{seoHead}<div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4" data-testid="error-verify">
        <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mx-auto">
          <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold">{t("certVerify.notFoundTitle")}</h1>
        <p className="text-muted-foreground">
          {t("certVerify.notFoundDesc", { number: certNumber }).replace(/<\/?[0-9]+>/g, "")}
        </p>
      </div></>
    );
  }

  const isValid = data.valid;
  const isRevoked = data.status === "revoked";

  return (
    <>{seoHead}<div className="max-w-xl mx-auto px-4 py-16 space-y-8" data-testid="page-verify">
      <div className="text-center space-y-6">
        <div className="relative inline-block">
          <div
            className={`h-28 w-28 rounded-full flex items-center justify-center mx-auto ${
              isValid ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"
            }`}
            data-testid="verify-seal"
          >
            {isValid ? (
              <ShieldCheck className="h-14 w-14 text-green-600 dark:text-green-400" />
            ) : (
              <ShieldX className="h-14 w-14 text-red-600 dark:text-red-400" />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h1
            className={`text-3xl font-bold ${isValid ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}
            data-testid="text-verify-status"
          >
            {isValid ? t("certVerify.verified") : t("certVerify.revoked")}
          </h1>
          {isRevoked && (
            <Badge variant="destructive" className="text-base px-4 py-1" data-testid="badge-revoked">
              {t("certVerify.revokedBadge")}
            </Badge>
          )}
        </div>
      </div>

      <Card data-testid="card-verify-details">
        <CardContent className="py-6 space-y-5">
          <div className="text-center space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("certVerify.holderLabel")}</p>
            <p className="text-xl font-semibold" data-testid="text-holder-name">{data.holderName}</p>
          </div>

          <div className="border-t pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("certVerify.courseLabel")}</p>
                <p className="font-medium text-sm" data-testid="text-course-name">{data.courseName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("certVerify.certNumberLabel")}</p>
                <p className="font-mono text-sm" data-testid="text-cert-number">{data.certificateNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("certVerify.issuedDateLabel")}</p>
                <p className="text-sm" data-testid="text-issued-date">
                  {new Date(data.issuedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("certVerify.expirationLabel")}</p>
                <p className="text-sm" data-testid="text-expiration-date">
                  {data.expiresAt ? new Date(data.expiresAt).toLocaleDateString() : t("certVerify.noExpiration")}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 text-center">
            <div className="flex items-center justify-center gap-2">
              {isValid ? (
                <Badge variant="default" className="bg-green-600 border-green-600" data-testid="badge-valid">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  {t("certVerify.validBadge")}
                </Badge>
              ) : (
                <Badge variant="destructive" data-testid="badge-invalid">
                  <ShieldX className="h-3 w-3 mr-1" />
                  {t("certVerify.invalidBadge")}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-xs text-muted-foreground space-y-1">
        <p>{t("certVerify.verificationProvidedBy", { domain: brand.domain })}</p>
        <p>{t("certVerify.complianceNote", { body: industry.regulatory.body, standard: industry.regulatory.standard })}</p>
      </div>
    </div></>
  );
}
