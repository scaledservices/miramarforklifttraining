import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import AdminLayout from "./AdminLayout";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CalendarClock, Plus, Trash2, Zap, Building2, MapPin, Clock, Users } from "lucide-react";
import type { StandingSession } from "@shared/schema";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type Company = { id: number; name: string };
type ServiceArea = { id: number; name: string };
type OptionsResponse = {
  companies: Company[];
  serviceAreas: ServiceArea[];
};

export default function AdminStandingSessions() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    companyId: "",
    serviceAreaId: "",
    dayOfWeek: "1",
    startTime: "08:00",
    endTime: "12:00",
    defaultParticipantCount: "1",
    productSlugs: "forklift-certification",
  });

  const { data: sessions, isLoading } = useQuery<StandingSession[]>({
    queryKey: ["/api/standing-sessions"],
  });

  const { data: options } = useQuery<OptionsResponse>({
    queryKey: ["/api/standing-sessions/options"],
  });

  const companies = options?.companies || [];
  const serviceAreas = options?.serviceAreas || [];

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/standing-sessions", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/standing-sessions"] });
      setCreateOpen(false);
      toast({ title: t("standingSessions.created") });
    },
    onError: (err: Error) => {
      toast({ title: err.message || t("standingSessions.createError"), variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, unknown> }) => {
      const res = await apiRequest("PATCH", `/api/standing-sessions/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/standing-sessions"] });
      toast({ title: t("standingSessions.updated") });
    },
    onError: (err: Error) => {
      toast({ title: err.message || t("standingSessions.updateError"), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/standing-sessions/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/standing-sessions"] });
      toast({ title: t("standingSessions.deleted") });
    },
    onError: (err: Error) => {
      toast({ title: err.message || t("standingSessions.deleteError"), variant: "destructive" });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/standing-sessions/${id}/generate`, { weeks: 4 });
      return res.json();
    },
    onSuccess: (data: { created: number; skipped: number }) => {
      toast({
        title: t("standingSessions.generated", {
          created: data.created,
          skipped: data.skipped,
        }),
      });
    },
    onError: (err: Error) => {
      toast({ title: err.message || t("standingSessions.generateError"), variant: "destructive" });
    },
  });

  const handleCreate = () => {
    createMutation.mutate({
      companyId: Number(form.companyId),
      serviceAreaId: Number(form.serviceAreaId),
      dayOfWeek: Number(form.dayOfWeek),
      startTime: form.startTime,
      endTime: form.endTime,
      defaultParticipantCount: Number(form.defaultParticipantCount),
      productSlugs: form.productSlugs.split(",").map((s) => s.trim()).filter(Boolean),
    });
  };

  const companyName = (id: number) => companies.find((c) => c.id === id)?.name || `#${id}`;
  const areaName = (id: number) => serviceAreas.find((a) => a.id === id)?.name || `#${id}`;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-admin-standing-sessions-title">
              {t("standingSessions.title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              {t("standingSessions.subtitle")}
            </p>
          </div>
          <Button
            className="bg-accent text-accent-foreground border-accent-border"
            onClick={() => setCreateOpen(true)}
            data-testid="button-add-standing-session"
          >
            <Plus className="w-4 h-4 mr-1" /> {t("standingSessions.addButton")}
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : !sessions || sessions.length === 0 ? (
          <Card>
            <CardContent className="py-14 flex flex-col items-center text-center gap-3">
              <CalendarClock className="w-10 h-10 text-muted-foreground" />
              <h2 className="text-lg font-semibold">{t("standingSessions.emptyTitle")}</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                {t("standingSessions.emptyDescription")}
              </p>
              <Button
                size="lg"
                className="mt-2 bg-accent text-accent-foreground border-accent-border"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1" /> {t("standingSessions.addFirst")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sessions.map((ss) => (
              <Card key={ss.id} data-testid={`card-standing-session-${ss.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{companyName(ss.companyId)}</CardTitle>
                      <Badge variant={ss.status === "active" ? "default" : "secondary"}>
                        {ss.status === "active" ? t("standingSessions.active") : t("standingSessions.paused")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{ss.status === "active" ? t("standingSessions.active") : t("standingSessions.paused")}</span>
                      <Switch
                        checked={ss.status === "active"}
                        onCheckedChange={(checked) =>
                          updateMutation.mutate({ id: ss.id, data: { status: checked ? "active" : "paused" } })
                        }
                        disabled={updateMutation.isPending}
                        data-testid={`switch-active-${ss.id}`}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                    <span className="flex items-center gap-1.5">
                      <CalendarClock className="w-4 h-4 text-muted-foreground" />
                      {t(`standingSessions.day${ss.dayOfWeek}`)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      {ss.startTime} – {ss.endTime}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      {areaName(ss.serviceAreaId)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      {ss.defaultParticipantCount} {t("standingSessions.participants")}
                    </span>
                    {ss.productSlugs.length > 0 && (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Building2 className="w-4 h-4" />
                        {ss.productSlugs.join(", ")}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateMutation.mutate(ss.id)}
                      disabled={generateMutation.isPending || ss.status !== "active"}
                      data-testid={`button-generate-${ss.id}`}
                    >
                      <Zap className="w-4 h-4 mr-1" /> {t("standingSessions.generate")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(ss.id)}
                      disabled={deleteMutation.isPending}
                      className="text-destructive hover:text-destructive"
                      data-testid={`button-delete-${ss.id}`}
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> {t("standingSessions.delete")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("standingSessions.createTitle")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label>{t("standingSessions.fieldCompany")}</Label>
                <Select
                  value={form.companyId}
                  onValueChange={(v) => setForm({ ...form, companyId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("standingSessions.selectCompany")} />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>{t("standingSessions.fieldServiceArea")}</Label>
                <Select
                  value={form.serviceAreaId}
                  onValueChange={(v) => setForm({ ...form, serviceAreaId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("standingSessions.selectArea")} />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceAreas.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>{t("standingSessions.fieldDayOfWeek")}</Label>
                <Select
                  value={form.dayOfWeek}
                  onValueChange={(v) => setForm({ ...form, dayOfWeek: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day, i) => (
                      <SelectItem key={i} value={String(i)}>{t(`standingSessions.day${i}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{t("standingSessions.fieldStartTime")}</Label>
                  <Input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("standingSessions.fieldEndTime")}</Label>
                  <Input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>{t("standingSessions.fieldParticipantCount")}</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.defaultParticipantCount}
                  onChange={(e) => setForm({ ...form, defaultParticipantCount: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t("standingSessions.fieldProductSlugs")}</Label>
                <Input
                  value={form.productSlugs}
                  onChange={(e) => setForm({ ...form, productSlugs: e.target.value })}
                  placeholder="forklift-certification, powered-industrial-truck"
                />
                <p className="text-xs text-muted-foreground">
                  {t("standingSessions.productSlugsHint")}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                {t("standingSessions.cancel")}
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending || !form.companyId || !form.serviceAreaId}
                className="bg-accent text-accent-foreground border-accent-border"
              >
                {createMutation.isPending ? t("standingSessions.saving") : t("standingSessions.create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
