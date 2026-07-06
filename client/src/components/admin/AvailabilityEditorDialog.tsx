import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Plus, Trash2, Zap } from "lucide-react";
import type { ServiceArea, AvailabilityRules } from "@shared/schema";
import {
  DAY_LABELS,
  DAY_ORDER,
  DEFAULT_RULES,
  SCHEDULE_TEMPLATES,
  computeBookableDates,
  formatTime,
  friendlyError,
  toISODate,
} from "./availability-utils";

interface AvailabilityEditorDialogProps {
  area: ServiceArea | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AvailabilityEditorDialog({ area, open, onOpenChange }: AvailabilityEditorDialogProps) {
  const { toast } = useToast();
  const [rules, setRules] = useState<AvailabilityRules>(DEFAULT_RULES);

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  useEffect(() => {
    if (!open || !area) return;
    const existing = (area.availabilityRules as AvailabilityRules) || DEFAULT_RULES;
    setRules({
      ...DEFAULT_RULES,
      ...existing,
      blackoutDates: existing.blackoutDates || [],
    });
    const d = new Date();
    setCalYear(d.getFullYear());
    setCalMonth(d.getMonth());
  }, [open, area]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!area) throw new Error("No area selected");
      const res = await apiRequest("PATCH", `/api/service-areas/${area.id}/availability`, {
        availabilityRules: rules,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-areas"] });
      toast({
        title: "Hours saved",
        description: "Tip: use \"Copy hours\" on the area card to apply these to other areas.",
      });
      onOpenChange(false);
    },
    onError: (err: Error) =>
      toast({ title: friendlyError(err, "Could not save hours"), variant: "destructive" }),
  });

  function applyTemplate(templateId: string) {
    const template = SCHEDULE_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    setRules((prev) => ({
      ...prev,
      daysOfWeek: [...template.daysOfWeek],
      timeSlots: template.timeSlots.map((s) => ({ ...s })),
    }));
  }

  function toggleDay(day: number) {
    setRules((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day].sort(),
    }));
  }

  function addTimeSlot() {
    setRules((prev) => ({
      ...prev,
      timeSlots: [...prev.timeSlots, { startTime: "09:00", endTime: "12:00" }],
    }));
  }

  function removeTimeSlot(index: number) {
    setRules((prev) => ({
      ...prev,
      timeSlots: prev.timeSlots.filter((_, i) => i !== index),
    }));
  }

  function updateTimeSlot(index: number, field: "startTime" | "endTime", value: string) {
    setRules((prev) => ({
      ...prev,
      timeSlots: prev.timeSlots.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot)),
    }));
  }

  function toggleBlackout(iso: string) {
    setRules((prev) => {
      const current = prev.blackoutDates || [];
      return {
        ...prev,
        blackoutDates: current.includes(iso)
          ? current.filter((d) => d !== iso)
          : [...current, iso].sort(),
      };
    });
  }

  function prevMonth() {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  }

  // --- Calendar grid for the blackout picker ---
  const firstDayOffset = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const todayIso = toISODate(new Date());
  const monthLabel = new Date(calYear, calMonth).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const blackoutSet = new Set(rules.blackoutDates || []);

  const previewDates = useMemo(() => computeBookableDates(rules, 8), [rules]);

  const hasInvalidSlot = rules.timeSlots.some((s) => s.startTime >= s.endTime);
  const canSave = rules.daysOfWeek.length > 0 && rules.timeSlots.length > 0 && !hasInvalidSlot;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Hours for {area?.name}</DialogTitle>
          <DialogDescription>
            Set when customers can book on-site training here. Pick a quick-fill below or adjust everything by hand.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Template chips */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-brand-orange" /> Quick fill
            </Label>
            <div className="flex flex-wrap gap-2">
              {SCHEDULE_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t.id)}
                  className="rounded-full border px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                  data-testid={`chip-template-${t.id}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Day pills */}
          <div className="space-y-2">
            <Label>Days you train in this area</Label>
            <div className="flex flex-wrap gap-2">
              {DAY_ORDER.map((day) => {
                const selected = rules.daysOfWeek.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    aria-pressed={selected}
                    className={`rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${
                      selected
                        ? "bg-accent text-accent-foreground border-accent-border"
                        : "bg-background text-muted-foreground hover:border-foreground/40"
                    }`}
                    data-testid={`pill-day-${day}`}
                  >
                    {DAY_LABELS[day]}
                  </button>
                );
              })}
            </div>
            {rules.daysOfWeek.length === 0 && (
              <p className="text-xs text-destructive">Pick at least one day.</p>
            )}
          </div>

          {/* Time slots */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Session times (customers pick one)</Label>
              <Button variant="ghost" size="sm" onClick={addTimeSlot} data-testid="button-add-time-slot">
                <Plus className="w-3 h-3 mr-1" /> Add time
              </Button>
            </div>
            {rules.timeSlots.map((slot, i) => (
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
                {rules.timeSlots.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTimeSlot(i)}
                    data-testid={`button-remove-slot-${i}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            {hasInvalidSlot && (
              <p className="text-xs text-destructive">Each session must end after it starts.</p>
            )}
          </div>

          {/* Plain-language numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="seats-per-session">Seats per session</Label>
              <Input
                id="seats-per-session"
                type="number"
                min={1}
                max={100}
                value={rules.maxParticipants}
                onChange={(e) => setRules((prev) => ({ ...prev, maxParticipants: Number(e.target.value) }))}
                data-testid="input-max-participants"
              />
              <p className="text-xs text-muted-foreground">Most trainees you can take at once.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-time-days">Minimum notice</Label>
              <Input
                id="lead-time-days"
                type="number"
                min={0}
                max={30}
                value={rules.leadTimeDays}
                onChange={(e) => setRules((prev) => ({ ...prev, leadTimeDays: Number(e.target.value) }))}
                data-testid="input-lead-time"
              />
              <p className="text-xs text-muted-foreground">
                Customers must book at least this many days ahead.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="window-days">Booking window</Label>
              <Input
                id="window-days"
                type="number"
                min={7}
                max={365}
                value={rules.windowDays}
                onChange={(e) => setRules((prev) => ({ ...prev, windowDays: Number(e.target.value) }))}
                data-testid="input-window-days"
              />
              <p className="text-xs text-muted-foreground">Show dates up to this many days out.</p>
            </div>
          </div>

          {/* Blackout calendar */}
          <div className="space-y-2">
            <Label>Days off (blackout dates)</Label>
            <p className="text-xs text-muted-foreground">
              Click a day to block it — holidays, vacations, days you're booked elsewhere.
            </p>
            <div className="rounded-md border p-3">
              <div className="flex items-center justify-between mb-2">
                <Button variant="ghost" size="sm" onClick={prevMonth} data-testid="button-blackout-prev-month">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-semibold" data-testid="text-blackout-month">
                  {monthLabel}
                </span>
                <Button variant="ghost" size="sm" onClick={nextMonth} data-testid="button-blackout-next-month">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {DAY_LABELS.map((d) => (
                  <div key={d} className="text-[11px] font-medium text-muted-foreground py-1">
                    {d}
                  </div>
                ))}
                {Array.from({ length: firstDayOffset }).map((_, i) => (
                  <div key={`blank-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const date = new Date(calYear, calMonth, dayNum);
                  const iso = toISODate(date);
                  const isPast = iso < todayIso;
                  const isBlackout = blackoutSet.has(iso);
                  const isTrainingDay = rules.daysOfWeek.includes(date.getDay());
                  return (
                    <button
                      key={iso}
                      type="button"
                      disabled={isPast}
                      onClick={() => toggleBlackout(iso)}
                      className={`h-8 rounded text-sm transition-colors ${
                        isBlackout
                          ? "bg-destructive text-destructive-foreground font-semibold"
                          : isPast
                            ? "text-muted-foreground/40 cursor-not-allowed"
                            : isTrainingDay
                              ? "hover:bg-accent hover:text-accent-foreground font-medium"
                              : "text-muted-foreground hover:bg-muted"
                      }`}
                      data-testid={`blackout-day-${iso}`}
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>
            </div>
            {(rules.blackoutDates || []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(rules.blackoutDates || []).map((date) => (
                  <Badge key={date} variant="secondary" className="gap-1" data-testid={`badge-blackout-${date}`}>
                    {new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                    <button
                      onClick={() => toggleBlackout(date)}
                      className="ml-1 hover:text-destructive"
                      aria-label={`Remove blackout ${date}`}
                      data-testid={`button-remove-blackout-${date}`}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Live preview */}
          <div className="rounded-md bg-muted/50 border p-4 space-y-2" data-testid="panel-preview">
            <p className="text-sm font-semibold">What customers will see</p>
            {previewDates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No bookable dates with these settings. Check the days and session times above.
              </p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">Next {previewDates.length} bookable dates:</p>
                <div className="flex flex-wrap gap-2">
                  {previewDates.map((iso) => (
                    <div
                      key={iso}
                      className="rounded-md border bg-background px-2.5 py-1.5 text-center"
                      data-testid={`chip-preview-${iso}`}
                    >
                      <div className="text-xs font-semibold">
                        {new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {rules.timeSlots
                          .map((s) => `${formatTime(s.startTime)}–${formatTime(s.endTime)}`)
                          .join(" · ")}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <Button
            className="w-full bg-accent text-accent-foreground border-accent-border"
            onClick={() => saveMutation.mutate()}
            disabled={!canSave || saveMutation.isPending}
            data-testid="button-save-rules"
          >
            {saveMutation.isPending ? "Saving..." : "Save Hours"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
