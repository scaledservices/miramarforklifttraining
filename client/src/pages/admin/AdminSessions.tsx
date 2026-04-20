import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Settings, Clock, Calendar, Plus, Trash2 } from "lucide-react";
import type { ServiceArea, AvailabilityRules } from "@shared/schema";

const DAYS_OF_WEEK = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

const DEFAULT_RULES: AvailabilityRules = {
  daysOfWeek: [1, 3, 5],
  timeSlots: [
    { startTime: "09:00", endTime: "12:00" },
    { startTime: "13:00", endTime: "16:00" },
  ],
  maxParticipants: 10,
  leadTimeDays: 2,
  windowDays: 90,
  blackoutDates: [],
};

export default function AdminSessions() {
  const [editingAreaId, setEditingAreaId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: serviceAreas, isLoading } = useQuery<ServiceArea[]>({
    queryKey: ["/api/service-areas"],
  });

  const [editRules, setEditRules] = useState<AvailabilityRules>(DEFAULT_RULES);
  const [newBlackout, setNewBlackout] = useState("");

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingAreaId) throw new Error("No area selected");
      const res = await apiRequest("PATCH", `/api/service-areas/${editingAreaId}/availability`, {
        availabilityRules: editRules,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-areas"] });
      toast({ title: "Availability rules updated" });
      setEditingAreaId(null);
    },
    onError: (err: Error) => toast({ title: err.message || "Failed to update", variant: "destructive" }),
  });

  function openEditDialog(area: ServiceArea) {
    const rules = (area.availabilityRules as AvailabilityRules) || DEFAULT_RULES;
    setEditRules({
      ...DEFAULT_RULES,
      ...rules,
      blackoutDates: rules.blackoutDates || [],
    });
    setEditingAreaId(area.id);
  }

  function toggleDay(day: number) {
    setEditRules((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day].sort(),
    }));
  }

  function addTimeSlot() {
    setEditRules((prev) => ({
      ...prev,
      timeSlots: [...prev.timeSlots, { startTime: "09:00", endTime: "12:00" }],
    }));
  }

  function removeTimeSlot(index: number) {
    setEditRules((prev) => ({
      ...prev,
      timeSlots: prev.timeSlots.filter((_, i) => i !== index),
    }));
  }

  function updateTimeSlot(index: number, field: "startTime" | "endTime", value: string) {
    setEditRules((prev) => ({
      ...prev,
      timeSlots: prev.timeSlots.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot)),
    }));
  }

  function addBlackoutDate() {
    if (!newBlackout) return;
    setEditRules((prev) => ({
      ...prev,
      blackoutDates: [...(prev.blackoutDates || []), newBlackout].sort(),
    }));
    setNewBlackout("");
  }

  function removeBlackout(date: string) {
    setEditRules((prev) => ({
      ...prev,
      blackoutDates: (prev.blackoutDates || []).filter((d) => d !== date),
    }));
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold" data-testid="text-admin-sessions-title">
            Availability Rules
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure when on-site training is available for each service area. Slots are generated dynamically — no need to create individual sessions.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4">
            {(serviceAreas || []).map((area) => {
              const rules = (area.availabilityRules as AvailabilityRules) || DEFAULT_RULES;
              return (
                <Card key={area.id} data-testid={`card-area-rules-${area.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{area.name}</CardTitle>
                      <Badge variant={area.isActive ? "default" : "secondary"}>
                        {area.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {rules.daysOfWeek
                            .map((d) => DAYS_OF_WEEK.find((dw) => dw.value === d)?.label)
                            .join(", ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {rules.timeSlots.map((s) => `${s.startTime}–${s.endTime}`).join(", ")}
                        </span>
                      </div>
                      <div className="text-muted-foreground">
                        Max {rules.maxParticipants} per slot • {rules.leadTimeDays}d lead • {rules.windowDays}d window
                      </div>
                      {rules.blackoutDates && rules.blackoutDates.length > 0 && (
                        <div className="text-muted-foreground">
                          {rules.blackoutDates.length} blackout date(s)
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => openEditDialog(area)}
                      data-testid={`button-edit-rules-${area.id}`}
                    >
                      <Settings className="w-4 h-4 mr-1" /> Edit Rules
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={editingAreaId !== null} onOpenChange={(open) => !open && setEditingAreaId(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Edit Availability — {serviceAreas?.find((a) => a.id === editingAreaId)?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Available Days</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((d) => (
                    <label key={d.value} className="flex items-center gap-1.5 text-sm">
                      <Checkbox
                        checked={editRules.daysOfWeek.includes(d.value)}
                        onCheckedChange={() => toggleDay(d.value)}
                        data-testid={`checkbox-day-${d.value}`}
                      />
                      {d.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Time Slots</Label>
                  <Button variant="ghost" size="sm" onClick={addTimeSlot} data-testid="button-add-time-slot">
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </Button>
                </div>
                {editRules.timeSlots.map((slot, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateTimeSlot(i, "startTime", e.target.value)}
                      className="w-28"
                      data-testid={`input-slot-start-${i}`}
                    />
                    <span className="text-muted-foreground">to</span>
                    <Input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateTimeSlot(i, "endTime", e.target.value)}
                      className="w-28"
                      data-testid={`input-slot-end-${i}`}
                    />
                    {editRules.timeSlots.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeTimeSlot(i)} data-testid={`button-remove-slot-${i}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Max Participants</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={editRules.maxParticipants}
                    onChange={(e) => setEditRules((prev) => ({ ...prev, maxParticipants: Number(e.target.value) }))}
                    data-testid="input-max-participants"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lead Time (days)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    value={editRules.leadTimeDays}
                    onChange={(e) => setEditRules((prev) => ({ ...prev, leadTimeDays: Number(e.target.value) }))}
                    data-testid="input-lead-time"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Window (days)</Label>
                  <Input
                    type="number"
                    min={7}
                    max={365}
                    value={editRules.windowDays}
                    onChange={(e) => setEditRules((prev) => ({ ...prev, windowDays: Number(e.target.value) }))}
                    data-testid="input-window-days"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Blackout Dates</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={newBlackout}
                    onChange={(e) => setNewBlackout(e.target.value)}
                    data-testid="input-blackout-date"
                  />
                  <Button variant="outline" size="sm" onClick={addBlackoutDate} data-testid="button-add-blackout">
                    Add
                  </Button>
                </div>
                {(editRules.blackoutDates || []).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(editRules.blackoutDates || []).map((date) => (
                      <Badge key={date} variant="secondary" className="gap-1">
                        {date}
                        <button onClick={() => removeBlackout(date)} className="ml-1 hover:text-destructive">×</button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Button
                className="w-full"
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending || editRules.timeSlots.length === 0 || editRules.daysOfWeek.length === 0}
                data-testid="button-save-rules"
              >
                {updateMutation.isPending ? "Saving..." : "Save Rules"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
