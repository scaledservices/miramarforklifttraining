import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IdCard, Truck, Upload, ShoppingCart, Bell } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

/**
 * Group-admin per-member photo-ID status (wallet-card spec 2.3). Lists each
 * certified member of the admin's group with their card status and the one
 * action that status allows. Data: GET /api/groups/:id/photo-id-status.
 */

type MemberPhotoStatus = {
  userId: number;
  name: string;
  email: string;
  certifications: {
    certificationId: number;
    courseTitle: string;
    status: "not_ordered" | "photo_needed" | "ordered" | "shipped";
    entitlementId?: number;
    cardOrderId?: number;
    trackingNumber?: string | null;
    carrier?: string | null;
  }[];
};

export default function TeamPhotoIdStatus({ groupId }: { groupId: number }) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ members: MemberPhotoStatus[] }>({
    queryKey: ["/api/groups", groupId, "photo-id-status"],
    enabled: !!groupId,
  });

  const remindMutation = useMutation({
    mutationFn: async ({ memberId }: { memberId: number }) => {
      const res = await apiRequest("POST", `/api/groups/${groupId}/members/${memberId}/remind`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t("teamPhotoId.remind") });
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <Card data-testid="team-photo-id-loading">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <IdCard className="h-5 w-5" />
            {t("teamPhotoId.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  const members = data?.members ?? [];
  const actionable = members.filter((m) => m.certifications.length > 0);
  if (actionable.length === 0) return null;

  const statusBadge = (status: MemberPhotoStatus["certifications"][number]["status"]) => {
    switch (status) {
      case "shipped":
        return <Badge className="bg-green-600 text-white" data-testid="badge-photo-shipped">{t("teamPhotoId.statusShipped")}</Badge>;
      case "ordered":
        return <Badge variant="secondary" data-testid="badge-photo-ordered">{t("teamPhotoId.statusOrdered")}</Badge>;
      case "photo_needed":
        return <Badge className="bg-amber-500 text-white" data-testid="badge-photo-needed">{t("teamPhotoId.statusPhotoNeeded")}</Badge>;
      default:
        return <Badge variant="outline" data-testid="badge-photo-not-ordered">{t("teamPhotoId.statusNotOrdered")}</Badge>;
    }
  };

  return (
    <Card data-testid="team-photo-id-status">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <IdCard className="h-5 w-5" />
          {t("teamPhotoId.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {actionable.map((member) => (
          <div key={member.userId} className="space-y-2" data-testid={`member-photo-row-${member.userId}`}>
            <p className="font-medium text-sm">{member.name}</p>
            {member.certifications.map((cert) => (
              <div
                key={cert.certificationId}
                className="flex items-center justify-between gap-3 rounded-md border p-3 flex-wrap"
                data-testid={`cert-photo-row-${cert.certificationId}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {statusBadge(cert.status)}
                  <span className="text-sm truncate">{cert.courseTitle}</span>
                  {cert.status === "shipped" && cert.trackingNumber && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Truck className="h-3 w-3" />
                      {cert.carrier ? `${cert.carrier} ` : ""}{cert.trackingNumber}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {cert.status === "not_ordered" && (
                    <Link href={`/order-cert-card/${cert.certificationId}`}>
                      <Button size="sm" variant="outline" data-testid={`button-order-photo-${cert.certificationId}`}>
                        <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                        {t("teamPhotoId.orderFor")}
                      </Button>
                    </Link>
                  )}
                  {cert.status === "photo_needed" && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => remindMutation.mutate({ memberId: member.userId })}
                        disabled={remindMutation.isPending}
                        data-testid={`button-remind-photo-${cert.certificationId}`}
                      >
                        <Bell className="h-3.5 w-3.5 mr-1.5" />
                        {t("teamPhotoId.remind")}
                      </Button>
                      <Link href={`/order-cert-card/${cert.certificationId}?entitlement=${cert.entitlementId}`}>
                        <Button size="sm" variant="outline" data-testid={`button-upload-photo-${cert.certificationId}`}>
                          <Upload className="h-3.5 w-3.5 mr-1.5" />
                          {t("teamPhotoId.uploadFor")}
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
