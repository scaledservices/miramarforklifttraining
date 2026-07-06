import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { getQueryFn, apiRequest } from "@/lib/queryClient";
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

function RecertCallout({
  certificateNumber,
  expiresAt,
  isExpired,
}: {
  certificateNumber: string;
  expiresAt: Date;
  isExpired: boolean;
}) {
  const { t, i18n } = useTranslation();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const expiryDate = expiresAt.toLocaleDateString(i18n.language === "es" ? "es-US" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!phone.trim() && !email.trim()) {
      setFormError(t("certVerify.recert.reminderContactRequired"));
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest("POST", "/api/certs/recert-interest", {
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        certificateNumber,
      });
      setSubmitted(true);
    } catch {
      setFormError(t("certVerify.recert.reminderError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card
      className="border-2 border-[#FFC326] bg-[#FFC326]/10 overflow-hidden"
      data-testid="card-recert-callout"
    >
      <div className="h-1.5 bg-[#FFC326]" />
      <CardContent className="py-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 shrink-0 rounded-full bg-[#FFC326] flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-black" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold" data-testid="text-recert-title">
              {isExpired
                ? t("certVerify.recert.expiredTitle", { date: expiryDate })
                : t("certVerify.recert.expiresSoonTitle", { date: expiryDate })}
            </h2>
            <p className="text-sm text-muted-foreground">{t("certVerify.recert.desc")}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            asChild
            className="flex-1 bg-[#FFC326] text-black font-semibold border-[#FFC326] hover:bg-[#FFC326]/90"
            data-testid="button-recert-book"
          >
            <Link href="/book-training">{t("certVerify.recert.bookCta")}</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1" data-testid="button-recert-contact">
            <Link href="/contact">{t("certVerify.recert.contactCta")}</Link>
          </Button>
        </div>

        <div className="border-t border-[#FFC326]/40 pt-4">
          {submitted ? (
            <p className="text-sm font-medium text-green-700 dark:text-green-400" data-testid="text-recert-success">
              {t("certVerify.recert.reminderSuccess")}
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3" data-testid="form-recert-interest">
              <p className="text-sm font-semibold">{t("certVerify.recert.reminderTitle")}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("certVerify.recert.reminderName")}
                  autoComplete="name"
                  data-testid="input-recert-name"
                />
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel"
                  placeholder={t("certVerify.recert.reminderPhone")}
                  autoComplete="tel"
                  data-testid="input-recert-phone"
                />
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder={t("certVerify.recert.reminderEmail")}
                  autoComplete="email"
                  data-testid="input-recert-email"
                />
              </div>
              <p className="text-xs text-muted-foreground">{t("certVerify.recert.reminderHint")}</p>
              {formError && (
                <p className="text-sm text-red-600 dark:text-red-400" data-testid="text-recert-error">
                  {formError}
                </p>
              )}
              <Button type="submit" variant="outline" size="sm" disabled={submitting} data-testid="button-recert-submit">
                {submitting ? t("certVerify.recert.reminderSubmitting") : t("certVerify.recert.reminderSubmit")}
              </Button>
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  );
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

  const [, setLocation] = useLocation();
  const [lookupInput, setLookupInput] = useState("");

  const { data, isLoading, error } = useQuery<VerifyResponse>({
    queryKey: ["/api/verify", certNumber],
    enabled: !!certNumber,
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  if (!certNumber) {
    return (
      <>{seoHead}<div className="max-w-xl mx-auto px-4 py-16 space-y-8" data-testid="page-verify-lookup">
        <div className="text-center space-y-4">
          <div className="h-24 w-24 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
            <ShieldCheck className="h-12 w-12 text-brand-dark" />
          </div>
          <h1 className="text-3xl font-bold">{t("certVerify.lookupTitle")}</h1>
          <p className="text-muted-foreground max-w-md mx-auto">{t("certVerify.lookupDesc")}</p>
        </div>
        <Card>
          <CardContent className="py-6">
            <form
              className="flex flex-col sm:flex-row gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                const num = lookupInput.trim();
                if (num) setLocation(`/verify/${encodeURIComponent(num)}`);
              }}
            >
              <Input
                value={lookupInput}
                onChange={(e) => setLookupInput(e.target.value)}
                placeholder={t("certVerify.lookupPlaceholder")}
                className="flex-1 font-mono"
                data-testid="input-cert-number"
              />
              <Button type="submit" className="bg-accent text-accent-foreground border-accent-border" disabled={!lookupInput.trim()} data-testid="button-verify-lookup">
                {t("certVerify.lookupButton")}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-3">{t("certVerify.lookupHint")}</p>
          </CardContent>
        </Card>
      </div></>
    );
  }

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

  const expiresAtDate = data.expiresAt ? new Date(data.expiresAt) : null;
  const daysToExpiry = expiresAtDate
    ? Math.ceil((expiresAtDate.getTime() - Date.now()) / 86_400_000)
    : null;
  const showRecertCallout = !isRevoked && daysToExpiry !== null && daysToExpiry <= 90;
  const isExpired = daysToExpiry !== null && daysToExpiry < 0;

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

      {showRecertCallout && expiresAtDate && (
        <RecertCallout
          certificateNumber={data.certificateNumber}
          expiresAt={expiresAtDate}
          isExpired={isExpired}
        />
      )}

      <div className="text-center text-xs text-muted-foreground space-y-1">
        <p>{t("certVerify.verificationProvidedBy", { domain: brand.domain })}</p>
        <p>{t("certVerify.complianceNote", { body: industry.regulatory.body, standard: industry.regulatory.standard })}</p>
      </div>
    </div></>
  );
}
