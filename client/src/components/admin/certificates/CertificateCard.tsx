import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Ban, Building2, Download, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import type { AdminCert } from "@/pages/admin/AdminCertificates";

interface Props {
  cert: AdminCert;
  statusVariant: (status: string) => "default" | "destructive" | "secondary" | "outline";
  onDownload: (certId: number, certNumber: string) => void;
  onRevoke: (id: number) => void;
  onReissue: (id: number) => void;
  revoking?: boolean;
  reissuing?: boolean;
}

/** Mobile-first card for one certificate with big tap targets for the row actions. */
export default function CertificateCard({
  cert,
  statusVariant,
  onDownload,
  onRevoke,
  onReissue,
  revoking,
  reissuing,
}: Props) {
  const { t } = useTranslation();

  return (
    <Card data-testid={`card-cert-${cert.id}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium truncate" data-testid={`text-cert-number-${cert.id}`}>
              {cert.certificateNumber}
            </p>
            <p className="text-sm truncate">{cert.userName}</p>
            <p className="text-xs text-muted-foreground truncate">{cert.userEmail}</p>
          </div>
          <Badge
            variant={statusVariant(cert.status)}
            className="shrink-0"
            data-testid={`badge-cert-status-${cert.id}`}
          >
            {cert.status}
          </Badge>
        </div>

        <div className="text-sm space-y-1">
          <p className="text-muted-foreground">{cert.courseName}</p>
          <div data-testid={`text-cert-company-${cert.id}`}>
            {cert.companyName ? (
              <Link
                href={`/admin/companies/${cert.companyId}`}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <Building2 className="h-3 w-3" />
                {cert.companyName}
              </Link>
            ) : (
              <span className="text-muted-foreground text-xs">{t("adminCompany.noCompany")}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Issued {new Date(cert.issuedAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex gap-2">
          {cert.pdfUrl && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onDownload(cert.id, cert.certificateNumber)}
              data-testid={`button-download-cert-${cert.id}`}
            >
              <Download className="h-4 w-4 mr-1.5" /> Download
            </Button>
          )}
          {cert.status === "issued" && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onRevoke(cert.id)}
              disabled={revoking}
              data-testid={`button-revoke-cert-${cert.id}`}
            >
              <Ban className="h-4 w-4 mr-1.5" /> Revoke
            </Button>
          )}
          {cert.status === "revoked" && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onReissue(cert.id)}
              disabled={reissuing}
              data-testid={`button-reissue-cert-${cert.id}`}
            >
              <RefreshCw className="h-4 w-4 mr-1.5" /> Reissue
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
