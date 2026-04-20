import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, RotateCcw, RefreshCw, Trash2, Loader2, BookOpen, Users, CheckCircle2, XCircle } from "lucide-react";
import { useState, useCallback } from "react";
import GroupLayout from "./GroupLayout";

type BulkInviteResult = {
  name: string;
  email: string;
  success: boolean;
  error?: string;
};

function parseBulkInput(text: string): { name: string; email: string }[] {
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  const results: { name: string; email: string }[] = [];

  for (const line of lines) {
    const angleMatch = line.match(/^(.+?)\s*<([^>]+@[^>]+)>$/);
    if (angleMatch) {
      results.push({ name: angleMatch[1].trim(), email: angleMatch[2].trim() });
      continue;
    }

    const commaMatch = line.match(/^(.+?)\s*,\s*(\S+@\S+)$/);
    if (commaMatch) {
      results.push({ name: commaMatch[1].trim(), email: commaMatch[2].trim() });
      continue;
    }

    const tabMatch = line.match(/^(.+?)\t+(\S+@\S+)$/);
    if (tabMatch) {
      results.push({ name: tabMatch[1].trim(), email: tabMatch[2].trim() });
      continue;
    }
  }

  return results;
}

export default function GroupMembers() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [selectedSeat, setSelectedSeat] = useState("");
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkResults, setBulkResults] = useState<BulkInviteResult[] | null>(null);
  const [bulkProgress, setBulkProgress] = useState({ sent: 0, total: 0 });

  const { data: groupsData, isLoading: groupsLoading } = useQuery<{ groups: any[] }>({
    queryKey: ["/api/groups"],
  });

  const group = groupsData?.groups?.[0];

  const { data: membersData, isLoading: membersLoading } = useQuery<{ members: any[] }>({
    queryKey: ["/api/groups", group?.id, "members"],
    enabled: !!group?.id,
  });

  const { data: enrollmentsData } = useQuery<{ enrollments: any[] }>({
    queryKey: ["/api/groups", group?.id, "enrollments"],
    enabled: !!group?.id,
  });

  const allEnrollments = enrollmentsData?.enrollments || [];
  const unassignedSeats = allEnrollments.filter((e: any) => !e.userId);
  const assignedSeats = allEnrollments.filter((e: any) => e.userId);

  const uniqueUnassignedCourses = (() => {
    const seen = new Set<number>();
    return unassignedSeats.filter((seat: any) => {
      if (seen.has(seat.courseId)) return false;
      seen.add(seat.courseId);
      return true;
    });
  })();

  function getAvailableCoursesForMember(memberId: number, memberUserId: number) {
    const memberCourseIds = new Set(
      assignedSeats
        .filter((s: any) => s.userId === memberUserId)
        .map((s: any) => s.courseId)
    );
    return uniqueUnassignedCourses.filter((seat: any) => !memberCourseIds.has(seat.courseId));
  }

  function getSeatForCourse(courseId: number): any {
    return unassignedSeats.find((s: any) => s.courseId === courseId);
  }

  function statusBadge(trainingStatus: string, progressPct: number) {
    switch (trainingStatus) {
      case "completed":
        return <Badge variant="default" className="bg-green-600">{t("groupMembers.statusCompleted")}</Badge>;
      case "in_progress":
        return <Badge variant="secondary">{t("groupMembers.statusInProgress", { pct: progressPct })}</Badge>;
      case "active":
        return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">{t("groupMembers.statusActive")}</Badge>;
      case "revoked":
        return <Badge variant="destructive">{t("groupMembers.statusRevoked")}</Badge>;
      default:
        return <Badge variant="outline">{t("groupMembers.statusInvited")}</Badge>;
    }
  }

  const inviteMutation = useMutation({
    mutationFn: async (data: { email: string; name: string; enrollmentId?: number }) => {
      const res = await apiRequest("POST", `/api/groups/${group.id}/invite`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups", group?.id, "members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups", group?.id, "enrollments"] });
      toast({ title: t("groupMembers.invitationSent"), description: t("groupMembers.invitationSentDesc") });
      setNewEmail("");
      setNewName("");
      setSelectedSeat("");
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const resendMutation = useMutation({
    mutationFn: async ({ memberId, email }: { memberId: number; email: string }) => {
      const res = await apiRequest("POST", `/api/groups/${group.id}/members/${memberId}/resend`);
      return { ...await res.json(), email };
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups", group?.id, "members"] });
      toast({ title: t("groupMembers.inviteResent"), description: t("groupMembers.inviteResentDesc", { email: data.email }) });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const reissueMutation = useMutation({
    mutationFn: async ({ memberId, email }: { memberId: number; email: string }) => {
      const res = await apiRequest("POST", `/api/groups/${group.id}/members/${memberId}/reissue`);
      return { ...await res.json(), email };
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups", group?.id, "members"] });
      toast({ title: t("groupMembers.inviteReissued"), description: t("groupMembers.inviteReissuedDesc", { email: data.email }) });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const [assignPopoverOpen, setAssignPopoverOpen] = useState<Record<number, boolean>>({});

  const assignSeatMutation = useMutation({
    mutationFn: async ({ enrollmentId, userId }: { enrollmentId: number; userId: number }) => {
      const res = await apiRequest("POST", `/api/groups/${group.id}/assign-seat`, { enrollmentId, userId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups", group?.id, "enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups", group?.id, "members"] });
      setAssignPopoverOpen({});
      toast({ title: t("groupMembers.seatAssigned"), description: t("groupMembers.seatAssignedDesc") });
    },
    onError: (error: Error) => {
      toast({ title: t("groupMembers.assignmentFailed"), description: error.message, variant: "destructive" });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (memberId: number) => {
      const res = await apiRequest("DELETE", `/api/groups/${group.id}/members/${memberId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups", group?.id, "members"] });
      toast({ title: t("groupMembers.memberRemoved"), description: t("groupMembers.memberRemovedDesc") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newName.trim()) return;
    const payload: { email: string; name: string; enrollmentId?: number } = {
      email: newEmail.trim(),
      name: newName.trim(),
    };
    if (selectedSeat && selectedSeat !== "none") {
      payload.enrollmentId = parseInt(selectedSeat);
    }
    inviteMutation.mutate(payload);
  };

  const handleBulkInvite = useCallback(async () => {
    const parsed = parseBulkInput(bulkText);
    if (parsed.length === 0) {
      toast({ title: t("groupMembers.noValidEntries"), description: t("groupMembers.noValidEntriesDesc"), variant: "destructive" });
      return;
    }

    setBulkSending(true);
    setBulkResults(null);
    setBulkProgress({ sent: 0, total: parsed.length });

    const results: BulkInviteResult[] = [];

    for (let i = 0; i < parsed.length; i++) {
      const { name, email } = parsed[i];
      try {
        const res = await apiRequest("POST", `/api/groups/${group.id}/invite`, { email, name });
        if (!res.ok) {
          const data = await res.json();
          results.push({ name, email, success: false, error: data.error || t("common.error") });
        } else {
          results.push({ name, email, success: true });
        }
      } catch (err: any) {
        results.push({ name, email, success: false, error: err.message || t("groupMembers.networkError") });
      }
      setBulkProgress({ sent: i + 1, total: parsed.length });
    }

    setBulkResults(results);
    setBulkSending(false);

    queryClient.invalidateQueries({ queryKey: ["/api/groups", group?.id, "members"] });
    queryClient.invalidateQueries({ queryKey: ["/api/groups", group?.id, "enrollments"] });

    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    if (failed === 0) {
      toast({ title: t("groupMembers.allInvitesSent"), description: t("groupMembers.allInvitesSentDesc", { count: succeeded }) });
    } else {
      toast({ title: t("groupMembers.bulkInviteCompleted"), description: t("groupMembers.bulkInviteCompletedDesc", { succeeded, failed }), variant: failed > 0 && succeeded === 0 ? "destructive" : "default" });
    }
  }, [bulkText, group, toast, t]);

  const handleBulkDialogClose = () => {
    if (!bulkSending) {
      setBulkDialogOpen(false);
      setBulkText("");
      setBulkResults(null);
      setBulkProgress({ sent: 0, total: 0 });
    }
  };

  const parsedPreview = bulkText.trim() ? parseBulkInput(bulkText) : [];

  const members = membersData?.members || [];

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
          <p className="text-muted-foreground">{t("groupMembers.noCrewFound")}</p>
        </div>
      </GroupLayout>
    );
  }

  return (
    <GroupLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">{t("group.members")}</h1>
          <p className="text-muted-foreground">{t("group.membersDesc")}</p>
        </div>

        <Card data-testid="card-invite-member">
          <CardHeader>
            <CardTitle className="text-lg">{t("groupMembers.addMember")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="flex items-end gap-3 flex-wrap" data-testid="form-invite">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-1 block">{t("groupMembers.nameLabel")}</label>
                <Input
                  placeholder={t("groupMembers.namePlaceholder")}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  data-testid="input-member-name"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-1 block">{t("groupMembers.emailLabel")}</label>
                <Input
                  type="email"
                  placeholder={t("groupMembers.emailPlaceholder")}
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  data-testid="input-member-email"
                />
              </div>
              {unassignedSeats.length > 0 && (
                <div className="min-w-[200px]">
                  <label className="text-sm font-medium mb-1 block">{t("groupMembers.assignTrainingSeat")}</label>
                  <Select value={selectedSeat} onValueChange={setSelectedSeat}>
                    <SelectTrigger data-testid="select-seat-preassign">
                      <SelectValue placeholder={t("common.optional")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("groupMembers.noPreAssignment")}</SelectItem>
                      {uniqueUnassignedCourses.map((seat: any) => (
                        <SelectItem key={seat.courseId} value={String(seat.id)} data-testid={`option-seat-${seat.id}`}>
                          {seat.courseName || t("groupMembers.seatNumber", { id: seat.id })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button type="submit" disabled={inviteMutation.isPending} data-testid="button-invite-member">
                {inviteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                <span className="ml-1">{t("groupMembers.invite")}</span>
              </Button>
              <Button type="button" variant="outline" onClick={() => setBulkDialogOpen(true)} data-testid="button-bulk-invite">
                <Users className="h-4 w-4" />
                <span className="ml-1">{t("groupMembers.bulkInvite")}</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card data-testid="card-members-table">
          <CardContent className="p-0">
            {membersLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : members.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground" data-testid="text-no-members">
                {t("groupMembers.noMembersYet")}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("groupMembers.nameLabel")}</TableHead>
                    <TableHead>{t("groupMembers.emailLabel")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead>{t("groupMembers.training")}</TableHead>
                    <TableHead>{t("groupMembers.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member: any) => (
                    <TableRow key={member.id} data-testid={`row-member-${member.id}`}>
                      <TableCell className="font-medium" data-testid={`text-member-name-${member.id}`}>{member.name}</TableCell>
                      <TableCell data-testid={`text-member-email-${member.id}`}>{member.email}</TableCell>
                      <TableCell data-testid={`badge-member-status-${member.id}`}>
                        {statusBadge(member.trainingStatus || (member.acceptedAt ? "active" : "invited"), member.progressPct || 0)}
                      </TableCell>
                      <TableCell data-testid={`text-member-training-${member.id}`}>
                        {member.courseName ? (
                          <div className="space-y-1">
                            <span className="text-sm">{member.courseName}</span>
                            {member.trainingStatus === "in_progress" && (
                              <Progress value={member.progressPct || 0} className="h-1.5 w-24" />
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 flex-wrap">
                          {member.acceptedAt && member.userId && unassignedSeats.length > 0 && (() => {
                            const available = getAvailableCoursesForMember(member.id, member.userId);
                            if (available.length === 0) return null;
                            return (
                              <Popover
                                open={assignPopoverOpen[member.id] || false}
                                onOpenChange={(open) => setAssignPopoverOpen(prev => ({ ...prev, [member.id]: open }))}
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    title={t("groupMembers.assignSeatTitle")}
                                    data-testid={`button-assign-seat-${member.id}`}
                                  >
                                    <BookOpen className="h-4 w-4 mr-1" />
                                    {t("groupMembers.assignSeat")}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-3" align="end">
                                  <p className="text-sm font-medium mb-2">{t("groupMembers.selectCourseToAssign")}</p>
                                  <div className="space-y-1">
                                    {available.map((courseSeat: any) => {
                                      const seatToAssign = getSeatForCourse(courseSeat.courseId);
                                      return (
                                        <Button
                                          key={courseSeat.courseId}
                                          variant="ghost"
                                          className="w-full justify-start text-sm"
                                          disabled={assignSeatMutation.isPending}
                                          onClick={() => assignSeatMutation.mutate({ enrollmentId: seatToAssign.id, userId: member.userId })}
                                          data-testid={`button-assign-seat-${member.id}-${seatToAssign.id}`}
                                        >
                                          {assignSeatMutation.isPending ? (
                                            <Loader2 className="h-3 w-3 animate-spin mr-2" />
                                          ) : (
                                            <BookOpen className="h-3 w-3 mr-2" />
                                          )}
                                          {courseSeat.courseName || t("dashboard.courseNumber", { id: courseSeat.courseId })}
                                        </Button>
                                      );
                                    })}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            );
                          })()}
                          {!member.acceptedAt && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => resendMutation.mutate({ memberId: member.id, email: member.email })}
                                disabled={resendMutation.isPending}
                                title={t("groupMembers.resendInvite")}
                                data-testid={`button-resend-${member.id}`}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => reissueMutation.mutate({ memberId: member.id, email: member.email })}
                                disabled={reissueMutation.isPending}
                                title={t("groupMembers.reissueInvite")}
                                data-testid={`button-reissue-${member.id}`}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeMutation.mutate(member.id)}
                            disabled={removeMutation.isPending}
                            title={t("groupMembers.removeMember")}
                            data-testid={`button-remove-${member.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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
        <Dialog open={bulkDialogOpen} onOpenChange={(open) => { if (!open) handleBulkDialogClose(); else setBulkDialogOpen(true); }}>
          <DialogContent className="max-w-lg" data-testid="dialog-bulk-invite">
            <DialogHeader>
              <DialogTitle>{t("groupMembers.bulkInviteMembers")}</DialogTitle>
              <DialogDescription>
                {t("groupMembers.bulkInviteDesc")}
              </DialogDescription>
            </DialogHeader>

            {!bulkResults ? (
              <div className="space-y-4">
                <Textarea
                  placeholder={t("groupMembers.bulkPlaceholder")}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  rows={8}
                  disabled={bulkSending}
                  data-testid="textarea-bulk-invite"
                />

                {parsedPreview.length > 0 && !bulkSending && (
                  <div className="text-sm text-muted-foreground" data-testid="text-bulk-preview">
                    {t("groupMembers.validEntriesDetected", { count: parsedPreview.length })}
                  </div>
                )}

                {bulkText.trim() && parsedPreview.length === 0 && !bulkSending && (
                  <div className="text-sm text-destructive" data-testid="text-bulk-parse-error">
                    {t("groupMembers.noValidEntriesDesc")}
                  </div>
                )}

                {bulkSending && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("groupMembers.sendingInvites", { sent: bulkProgress.sent, total: bulkProgress.total })}
                    </div>
                    <Progress value={(bulkProgress.sent / bulkProgress.total) * 100} className="h-2" />
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleBulkDialogClose} disabled={bulkSending} data-testid="button-bulk-cancel">
                    {t("common.cancel")}
                  </Button>
                  <Button
                    onClick={handleBulkInvite}
                    disabled={bulkSending || parsedPreview.length === 0}
                    data-testid="button-bulk-send"
                  >
                    {bulkSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    <span className="ml-1">
                      {bulkSending ? t("groupMembers.sending") : t("groupMembers.sendInvites", { count: parsedPreview.length })}
                    </span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm" data-testid="text-bulk-summary">
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    {t("groupMembers.succeeded", { count: bulkResults.filter(r => r.success).length })}
                  </span>
                  {bulkResults.filter(r => !r.success).length > 0 && (
                    <span className="flex items-center gap-1 text-destructive">
                      <XCircle className="h-4 w-4" />
                      {t("groupMembers.failed", { count: bulkResults.filter(r => !r.success).length })}
                    </span>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1">
                  {bulkResults.map((result, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-sm py-1"
                      data-testid={`bulk-result-${idx}`}
                    >
                      {result.success ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive shrink-0" />
                      )}
                      <span className="font-medium">{result.name}</span>
                      <span className="text-muted-foreground">{result.email}</span>
                      {result.error && (
                        <span className="text-destructive text-xs ml-auto">{result.error}</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleBulkDialogClose} data-testid="button-bulk-done">
                    {t("groupMembers.done")}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </GroupLayout>
  );
}
