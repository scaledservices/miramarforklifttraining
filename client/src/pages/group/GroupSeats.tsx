import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Loader2, UserMinus, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import GroupLayout from "./GroupLayout";
import { useTranslation } from "react-i18next";

export default function GroupSeats() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [assignSelections, setAssignSelections] = useState<Record<number, string>>({});
  const [confirmUnassign, setConfirmUnassign] = useState<number | null>(null);

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

  const assignMutation = useMutation({
    mutationFn: async ({ enrollmentId, userId }: { enrollmentId: number; userId: number }) => {
      const res = await apiRequest("POST", `/api/groups/${group.id}/assign-seat`, { enrollmentId, userId });
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups", group?.id, "enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups", group?.id, "members"] });
      setAssignSelections((prev) => {
        const next = { ...prev };
        delete next[variables.enrollmentId];
        return next;
      });
      toast({ title: t("groupSeats.seatAssigned"), description: t("groupSeats.seatAssignedDesc") });
    },
    onError: (error: Error) => {
      toast({ title: t("groupSeats.assignmentFailed"), description: error.message, variant: "destructive" });
    },
  });

  const unassignMutation = useMutation({
    mutationFn: async (enrollmentId: number) => {
      const res = await apiRequest("POST", `/api/groups/${group.id}/unassign-seat`, { enrollmentId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups", group?.id, "enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups", group?.id, "members"] });
      setConfirmUnassign(null);
      toast({ title: t("groupSeats.seatUnassigned"), description: t("groupSeats.seatUnassignedDesc") });
    },
    onError: (error: Error) => {
      toast({ title: t("groupSeats.unassignFailed"), description: error.message, variant: "destructive" });
      setConfirmUnassign(null);
    },
  });

  const allSeats = enrollmentsData?.enrollments || [];
  const unassignedSeats = allSeats.filter((e: any) => !e.userId);
  const assignedSeats = allSeats.filter((e: any) => e.userId);
  const acceptedMembers = (membersData?.members || []).filter((m: any) => m.acceptedAt && m.userId);

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
          <p className="text-muted-foreground">{t("groupSeats.noCrewFound")}</p>
        </div>
      </GroupLayout>
    );
  }

  return (
    <GroupLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">{t("groupSeats.pageTitle")}</h1>
          <p className="text-muted-foreground">{t("groupSeats.pageDesc")}</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="secondary" data-testid="badge-unassigned-count">
            <BookOpen className="h-3 w-3 mr-1" />
            {t("groupSeats.unassignedSeats", { count: unassignedSeats.length, plural: unassignedSeats.length !== 1 ? "s" : "" })}
          </Badge>
          <Badge variant="secondary" data-testid="badge-assigned-count">
            {t("groupSeats.assignedSeatsCount", { count: assignedSeats.length, plural: assignedSeats.length !== 1 ? "s" : "" })}
          </Badge>
          <Badge variant="secondary" data-testid="badge-accepted-members">
            {t("groupSeats.eligibleMembers", { count: acceptedMembers.length, plural: acceptedMembers.length !== 1 ? "s" : "" })}
          </Badge>
        </div>

        <Card data-testid="card-seats-table">
          <CardContent className="p-0">
            {enrollmentsLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : unassignedSeats.length === 0 && assignedSeats.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground" data-testid="text-no-seats">
                {t("groupSeats.noSeats")}
              </div>
            ) : (
              <>
                {unassignedSeats.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-muted/50 border-b">
                      <span className="text-sm font-medium">{t("groupSeats.unassignedSection")}</span>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("groupSeats.thCourse")}</TableHead>
                          <TableHead>{t("groupSeats.thStatus")}</TableHead>
                          <TableHead>{t("groupSeats.thEnrolled")}</TableHead>
                          <TableHead>{t("groupSeats.thAssignTo")}</TableHead>
                          <TableHead>{t("groupSeats.thAction")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {unassignedSeats.map((seat: any) => (
                          <TableRow key={seat.id} data-testid={`row-seat-${seat.id}`}>
                            <TableCell className="font-medium" data-testid={`text-seat-course-${seat.id}`}>
                              {seat.courseName}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" data-testid={`badge-seat-status-${seat.id}`}>{t("groupSeats.badgeUnassigned")}</Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {seat.enrolledAt ? new Date(seat.enrolledAt).toLocaleDateString() : "-"}
                            </TableCell>
                            <TableCell>
                              <Select
                                value={assignSelections[seat.id] || ""}
                                onValueChange={(val) => setAssignSelections((prev) => ({ ...prev, [seat.id]: val }))}
                              >
                                <SelectTrigger className="w-[200px]" data-testid={`select-assign-${seat.id}`}>
                                  <SelectValue placeholder={t("groupSeats.selectMember")} />
                                </SelectTrigger>
                                <SelectContent>
                                  {(() => {
                                    const membersWithCourse = new Set(
                                      assignedSeats
                                        .filter((s: any) => s.courseId === seat.courseId)
                                        .map((s: any) => s.userId)
                                    );
                                    const eligible = acceptedMembers.filter((m: any) => !membersWithCourse.has(m.userId));
                                    if (eligible.length === 0) {
                                      return <SelectItem value="none" disabled>{t("groupSeats.noEligibleMembers")}</SelectItem>;
                                    }
                                    return eligible.map((m: any) => (
                                      <SelectItem key={m.userId} value={String(m.userId)} data-testid={`option-member-${m.userId}`}>
                                        {m.name}
                                      </SelectItem>
                                    ));
                                  })()}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                disabled={!assignSelections[seat.id] || assignMutation.isPending}
                                onClick={() => {
                                  const userId = parseInt(assignSelections[seat.id]);
                                  if (userId) assignMutation.mutate({ enrollmentId: seat.id, userId });
                                }}
                                data-testid={`button-assign-${seat.id}`}
                              >
                                {assignMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("groupSeats.assign")}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {assignedSeats.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-muted/50 border-b border-t">
                      <span className="text-sm font-medium">{t("groupSeats.assignedSection")}</span>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("groupSeats.thCourse")}</TableHead>
                          <TableHead>{t("groupSeats.thAssignedTo")}</TableHead>
                          <TableHead>{t("groupSeats.thStatus")}</TableHead>
                          <TableHead>{t("groupSeats.thProgress")}</TableHead>
                          <TableHead>{t("groupSeats.thAction")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assignedSeats.map((seat: any) => (
                          <TableRow key={seat.id} data-testid={`row-assigned-seat-${seat.id}`}>
                            <TableCell className="font-medium">{seat.courseName}</TableCell>
                            <TableCell>{seat.userName || t("groupSeats.unknown")}</TableCell>
                            <TableCell>
                              <Badge variant="default">{String(t(`status.${seat.status}`, seat.status))}</Badge>
                            </TableCell>
                            <TableCell className="text-sm">{seat.progressPct || 0}%</TableCell>
                            <TableCell>
                              {confirmUnassign === seat.id ? (
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => unassignMutation.mutate(seat.id)}
                                    disabled={unassignMutation.isPending}
                                    data-testid={`button-confirm-unassign-${seat.id}`}
                                  >
                                    {unassignMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : t("groupSeats.confirm")}
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => setConfirmUnassign(null)} data-testid={`button-cancel-unassign-${seat.id}`}>
                                    {t("groupSeats.cancel")}
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setConfirmUnassign(seat.id)}
                                  title={t("groupSeats.unassignSeat")}
                                  data-testid={`button-unassign-${seat.id}`}
                                >
                                  <UserMinus className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {unassignedSeats.length === 0 && (
                  <div className="p-6 text-center border-t" data-testid="cta-buy-more-seats">
                    <p className="text-muted-foreground mb-3">{t("groupSeats.allAssigned")}</p>
                    <Link href="/p/online-forklift-operator-training?seats=5">
                      <Button data-testid="button-buy-more-seats">
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {t("groupSeats.purchaseAdditional")}
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </GroupLayout>
  );
}
