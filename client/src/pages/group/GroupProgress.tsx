import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Loader2 } from "lucide-react";
import GroupLayout from "./GroupLayout";
import { useTranslation } from "react-i18next";

export default function GroupProgress() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const { data: groupsData, isLoading: groupsLoading } = useQuery<{ groups: any[] }>({
    queryKey: ["/api/groups"],
  });

  const group = groupsData?.groups?.[0];

  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useQuery<{ enrollments: any[] }>({
    queryKey: ["/api/groups", group?.id, "enrollments"],
    enabled: !!group?.id,
  });

  const { data: membersData } = useQuery<{ members: any[] }>({
    queryKey: ["/api/groups", group?.id, "members"],
    enabled: !!group?.id,
  });

  const reminderMutation = useMutation({
    mutationFn: async ({ memberId, courseName, progressPct }: { memberId: number; courseName: string; progressPct: number }) => {
      const res = await apiRequest("POST", `/api/groups/${group.id}/members/${memberId}/remind`, { courseName, progressPct });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups", group?.id, "members"] });
      toast({ title: t("groupProgress.reminderSent"), description: t("groupProgress.reminderSentDesc") });
    },
    onError: (error: Error) => {
      toast({ title: t("groupProgress.reminderError"), description: error.message, variant: "destructive" });
    },
  });

  const allEnrollments = (enrollmentsData?.enrollments || []).filter((e: any) => e.userId);
  const members = membersData?.members || [];

  const canSendReminder = (enrollment: any) => {
    if (enrollment.status === "completed") return false;
    const member = members.find((m: any) => m.userId === enrollment.userId);
    if (!member) return false;
    if (member.lastReminderSentAt) {
      const hoursSince = (Date.now() - new Date(member.lastReminderSentAt).getTime()) / (1000 * 60 * 60);
      if (hoursSince < 24) return false;
    }
    return true;
  };

  const getMemberId = (enrollment: any) => {
    const member = members.find((m: any) => m.userId === enrollment.userId);
    return member?.id;
  };

  const statusVariant = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "active": return "secondary";
      case "revoked": return "destructive";
      default: return "secondary";
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
          <p className="text-muted-foreground">{t("groupProgress.noCrewFound")}</p>
        </div>
      </GroupLayout>
    );
  }

  return (
    <GroupLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">{t("groupProgress.pageTitle")}</h1>
          <p className="text-muted-foreground">{t("groupProgress.pageDesc")}</p>
        </div>

        <Card data-testid="card-progress-table">
          <CardContent className="p-0">
            {enrollmentsLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : allEnrollments.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground" data-testid="text-no-progress">
                {t("groupProgress.noAssigned")}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("groupProgress.thMember")}</TableHead>
                    <TableHead>{t("groupProgress.thCourse")}</TableHead>
                    <TableHead>{t("groupProgress.thProgress")}</TableHead>
                    <TableHead>{t("groupProgress.thStatus")}</TableHead>
                    <TableHead>{t("groupProgress.thLastActivity")}</TableHead>
                    <TableHead>{t("groupProgress.thActions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allEnrollments.map((enrollment: any) => (
                    <TableRow key={enrollment.id} data-testid={`row-progress-${enrollment.id}`}>
                      <TableCell className="font-medium" data-testid={`text-progress-member-${enrollment.id}`}>
                        {enrollment.userName || t("groupProgress.unassigned")}
                      </TableCell>
                      <TableCell data-testid={`text-progress-course-${enrollment.id}`}>
                        {enrollment.courseName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 min-w-[150px]">
                          <Progress value={enrollment.progressPct} className="flex-1" data-testid={`progress-bar-${enrollment.id}`} />
                          <span className="text-sm font-medium w-10 text-right" data-testid={`text-progress-pct-${enrollment.id}`}>
                            {enrollment.progressPct}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusVariant(enrollment.status)}
                          data-testid={`badge-progress-status-${enrollment.id}`}
                        >
                          {String(t(`status.${enrollment.status}`, enrollment.status))}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm" data-testid={`text-last-activity-${enrollment.id}`}>
                        {enrollment.lastActivity
                          ? new Date(enrollment.lastActivity).toLocaleDateString()
                          : t("groupProgress.noActivity")}
                      </TableCell>
                      <TableCell>
                        {canSendReminder(enrollment) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const memberId = getMemberId(enrollment);
                              if (memberId) {
                                reminderMutation.mutate({
                                  memberId,
                                  courseName: enrollment.courseName,
                                  progressPct: enrollment.progressPct || 0,
                                });
                              }
                            }}
                            disabled={reminderMutation.isPending}
                            title={t("groupProgress.sendReminder")}
                            data-testid={`button-remind-${enrollment.id}`}
                          >
                            {reminderMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Bell className="h-4 w-4" />
                            )}
                            <span className="ml-1 hidden sm:inline">{t("groupProgress.remind")}</span>
                          </Button>
                        )}
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
