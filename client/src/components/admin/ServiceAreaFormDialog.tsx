import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { ServiceArea } from "@shared/schema";
import { parseZipInput, friendlyError } from "./availability-utils";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

interface ServiceAreaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog edits this area's details instead of creating a new one. */
  area?: ServiceArea | null;
  /** Called with the newly created area so the parent can open the hours editor right away. */
  onCreated?: (area: ServiceArea) => void;
}

export default function ServiceAreaFormDialog({
  open,
  onOpenChange,
  area,
  onCreated,
}: ServiceAreaFormDialogProps) {
  const { toast } = useToast();
  const isEdit = !!area;

  const [name, setName] = useState("");
  const [state, setState] = useState("CA");
  const [zipText, setZipText] = useState("");
  const [citiesText, setCitiesText] = useState("");

  useEffect(() => {
    if (!open) return;
    if (area) {
      setName(area.name);
      setState(area.state);
      setZipText((area.zipPrefixes || []).join(", "));
      setCitiesText(((area.cities as string[] | null) || []).join(", "));
    } else {
      setName("");
      setState("CA");
      setZipText("");
      setCitiesText("");
    }
  }, [open, area]);

  const zips = useMemo(() => parseZipInput(zipText), [zipText]);
  const cities = useMemo(
    () => citiesText.split(",").map((c) => c.trim()).filter(Boolean),
    [citiesText],
  );

  const canSubmit = name.trim().length > 0 && zips.valid.length > 0 && zips.invalid.length === 0;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = {
        name: name.trim(),
        state,
        zipPrefixes: zips.valid,
        cities,
      };
      const res = area
        ? await apiRequest("PATCH", `/api/admin/service-areas/${area.id}`, body)
        : await apiRequest("POST", "/api/admin/service-areas", body);
      return (await res.json()) as ServiceArea;
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-areas"] });
      onOpenChange(false);
      if (isEdit) {
        toast({ title: "Service area updated" });
      } else {
        toast({ title: `${saved.name} added`, description: "Now set the hours customers can book." });
        onCreated?.(saved);
      }
    },
    onError: (err: Error) =>
      toast({
        title: friendlyError(err, isEdit ? "Could not save changes" : "Could not add service area"),
        variant: "destructive",
      }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${area?.name}` : "Add a Service Area"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the name, state, or ZIP codes for this area."
              : "Tell us where you offer on-site training. You'll set the hours next."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="area-name">City / Area Name</Label>
            <Input
              id="area-name"
              placeholder="e.g. Bakersfield"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="input-area-name"
            />
          </div>

          <div className="space-y-2">
            <Label>State</Label>
            <Select value={state} onValueChange={setState}>
              <SelectTrigger className="w-32" data-testid="select-area-state">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="area-zips">ZIP codes served</Label>
            <Textarea
              id="area-zips"
              placeholder={"93301, 93304, 93306\nTip: a 3-digit prefix like 933 covers every ZIP starting with 933."}
              rows={3}
              value={zipText}
              onChange={(e) => setZipText(e.target.value)}
              data-testid="input-area-zips"
            />
            <p className="text-xs text-muted-foreground">
              Separate with commas, spaces, or new lines. Full 5-digit ZIPs or 3–5 digit prefixes.
            </p>
            {zips.valid.length > 0 && (
              <p className="text-xs font-medium text-brand-green" data-testid="text-zip-match-count">
                Will match {zips.matchCount.toLocaleString()} ZIP code{zips.matchCount === 1 ? "" : "s"} ({zips.valid.length}{" "}
                {zips.valid.length === 1 ? "entry" : "entries"})
              </p>
            )}
            {zips.invalid.length > 0 && (
              <p className="text-xs font-medium text-destructive" data-testid="text-zip-invalid">
                Not valid (fix or remove): {zips.invalid.join(", ")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="area-cities">Cities covered (optional)</Label>
            <Input
              id="area-cities"
              placeholder="Bakersfield, Delano, Shafter"
              value={citiesText}
              onChange={(e) => setCitiesText(e.target.value)}
              data-testid="input-area-cities"
            />
            <p className="text-xs text-muted-foreground">Comma-separated. Shown to customers on the area page.</p>
          </div>

          <Button
            className="w-full bg-accent text-accent-foreground border-accent-border"
            onClick={() => saveMutation.mutate()}
            disabled={!canSubmit || saveMutation.isPending}
            data-testid="button-save-area"
          >
            {saveMutation.isPending
              ? "Saving..."
              : isEdit
                ? "Save Changes"
                : "Add Area & Set Hours"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
