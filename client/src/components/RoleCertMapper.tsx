import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Award, AlertCircle } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { ROLE_CERT_MAPPINGS } from "@shared/config/cert-roles";

// ── Types ────────────────────────────────────────────────────────────

interface RoleCertMapping {
  key: string;
  nameKey: string;
  descriptionKey: string;
  recommendedCerts: string[];
}

interface RoleCertsResponse {
  roles: RoleCertMapping[];
}

interface RoleCertDetailResponse {
  role: RoleCertMapping;
  recommendedCerts: string[];
}

// ── Component ────────────────────────────────────────────────────────

/**
 * RoleCertMapper — role selector dropdown + recommended certifications display.
 *
 * Can be embedded in the compliance dashboard or used standalone.
 * Fetches role mappings from /api/role-certs and lets the user pick a role
 * to see which certifications are recommended.
 */
export function RoleCertMapper() {
  const { t } = useTranslation();
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);

  // Fetch all role mappings for the dropdown.
  const { data: rolesData, isLoading: rolesLoading } = useQuery<RoleCertsResponse>({
    queryKey: ["/api/role-certs"],
    queryFn: async () => {
      const res = await fetch("/api/role-certs", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch role mappings");
      return res.json();
    },
  });

  // Fetch recommended certs when a role is selected.
  const { data: certData, isLoading: certsLoading } = useQuery<RoleCertDetailResponse>({
    queryKey: ["/api/role-certs", selectedRole],
    enabled: !!selectedRole,
    queryFn: async () => {
      const res = await fetch(`/api/role-certs/${selectedRole}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch recommended certs");
      return res.json();
    },
  });

  const roles = rolesData?.roles ?? ROLE_CERT_MAPPINGS;
  const displayCerts = certData?.recommendedCerts ?? selectedCerts;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          {t("roleCerts.title")}
        </CardTitle>
        <CardDescription>{t("roleCerts.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Role selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            {t("roleCerts.selectRoleLabel")}
          </label>
          {rolesLoading ? (
            <Skeleton className="h-9 w-full" />
          ) : (
            <Select
              value={selectedRole}
              onValueChange={(value) => {
                setSelectedRole(value);
                // Eagerly show certs from the cached list before the query resolves.
                const role = roles.find((r) => r.key === value);
                setSelectedCerts(role?.recommendedCerts ?? []);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("roleCerts.selectRolePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.key} value={role.key}>
                    {t(role.nameKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Recommended certs display */}
        {selectedRole && (
          <div className="space-y-3">
            {/* Role description */}
            <p className="text-sm text-muted-foreground">
              {t(roles.find((r) => r.key === selectedRole)?.descriptionKey ?? "")}
            </p>

            {/* Cert badges */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                {t("roleCerts.recommendedCertsLabel")}
              </h4>
              {certsLoading && displayCerts.length === 0 ? (
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-32" />
                </div>
              ) : displayCerts.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {displayCerts.map((certSlug) => (
                    <Badge key={certSlug} variant="secondary" className="text-sm py-1">
                      {t(`roleCerts.certs.${certSlug}`, certSlug)}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  {t("roleCerts.noCerts")}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RoleCertMapper;
