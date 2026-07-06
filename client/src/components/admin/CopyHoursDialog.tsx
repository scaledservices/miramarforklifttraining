import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { ServiceArea, AvailabilityRules } from "@shared/schema";
import { friendlyError, summarizeDays, summarizeSlots } from "./availability-utils";

interface CopyHoursDialogProps {
  sourceArea: ServiceArea | null;
  allAreas: ServiceArea[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CopyHoursDialog({ sourceArea, allAreas, open, onOpenChange }: CopyHoursDialogProps) {
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    if (open) setSelectedIds([]);
  }, [open, sourceArea]);

  const otherAreas = allAreas.filter((a) => a.id !== sourceArea?.id);
  const sourceRules = sourceArea?.availabilityRules as AvailabilityRules | undefined;

  const copyMutation = useMutation({
    mutationFn: async () => {
      if (!sourceRules) throw new Error("No hours to copy");
      await Promise.all(
        selectedIds.map((id) =>
          apiRequest("PATCH", `/api/service-areas/${id}/availability`, {
            availabilityRules: sourceRules,
          }),
        ),
      );
      return selectedIds.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-areas"] });
      toast({ title: `Hours copied to ${count} area${count === 1 ? "" : "s"}` });
      onOpenChange(false);
    },
    onError: (err: Error) =>
      toast({ title: friendlyError(err, "Could not copy hours"), variant: "destructive" }),
  });

  function toggleArea(id: number) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Copy hours from {sourceArea?.name}</DialogTitle>
          <DialogDescription>
            {sourceRules
              ? `${summarizeDays(sourceRules.daysOfWeek)} · ${summarizeSlots(sourceRules)} — pick the areas that should use the same schedule.`
              : "Pick the areas that should use the same schedule."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {otherAreas.length === 0 ? (
            <p className="text-sm text-muted-foreground">No other areas yet. Add another service area first.</p>
          ) : (
            <div className="space-y-2">
              {otherAreas.map((a) => (
                <label
                  key={a.id}
                  className="flex items-center gap-2.5 rounded-md border p-2.5 text-sm cursor-pointer hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedIds.includes(a.id)}
                    onCheckedChange={() => toggleArea(a.id)}
                    data-testid={`checkbox-copy-target-${a.id}`}
                  />
                  <span className="font-medium">{a.name}</span>
                  <span className="text-muted-foreground text-xs ml-auto">{a.state}</span>
                </label>
              ))}
            </div>
          )}
          <Button
            className="w-full bg-accent text-accent-foreground border-accent-border"
            onClick={() => copyMutation.mutate()}
            disabled={selectedIds.length === 0 || copyMutation.isPending}
            data-testid="button-confirm-copy-hours"
          >
            {copyMutation.isPending
              ? "Copying..."
              : selectedIds.length === 0
                ? "Select areas above"
                : `Copy to ${selectedIds.length} area${selectedIds.length === 1 ? "" : "s"}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
