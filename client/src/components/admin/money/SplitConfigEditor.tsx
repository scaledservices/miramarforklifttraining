import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings2, Loader2 } from "lucide-react";
import type { RevenueSplitConfig, SplitConfigResponse } from "./types";

interface FieldDef {
  key: keyof RevenueSplitConfig;
  label: string;
  help: string;
}

const FIELDS: FieldDef[] = [
  {
    key: "albertoCommissionPercent",
    label: "Alberto commission (returning customers)",
    help: "Percent of returning-customer revenue paid to Alberto. Miramar keeps the rest.",
  },
  {
    key: "newCustomerCommissionPercent",
    label: "New-customer commission pool",
    help: "Percent of new-customer revenue set aside as commission, shared between Alberto and Scaled Services.",
  },
  {
    key: "newCustomerAlbertoSharePercent",
    label: "Alberto's share of that pool",
    help: "Alberto's percent of the new-customer commission pool. Scaled Services gets the remainder.",
  },
];

export default function SplitConfigEditor() {
  const { toast } = useToast();
  const [values, setValues] = useState<Record<keyof RevenueSplitConfig, string> | null>(null);

  const { data, isLoading } = useQuery<SplitConfigResponse>({
    queryKey: ["/api/admin/money/split-config"],
  });

  useEffect(() => {
    if (data && !values) {
      setValues({
        albertoCommissionPercent: String(data.config.albertoCommissionPercent),
        newCustomerCommissionPercent: String(data.config.newCustomerCommissionPercent),
        newCustomerAlbertoSharePercent: String(data.config.newCustomerAlbertoSharePercent),
      });
    }
  }, [data, values]);

  const saveMutation = useMutation({
    mutationFn: (config: RevenueSplitConfig) =>
      apiRequest("PUT", "/api/admin/money/split-config", config),
    onSuccess: () => {
      toast({ title: "Split config saved", description: "Revenue split percentages updated." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/money/split-config"] });
      queryClient.invalidateQueries({
        predicate: (q) => typeof q.queryKey[0] === "string" && q.queryKey[0].startsWith("/api/admin/money/statement"),
      });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const parsed = values
    ? {
        albertoCommissionPercent: Number(values.albertoCommissionPercent),
        newCustomerCommissionPercent: Number(values.newCustomerCommissionPercent),
        newCustomerAlbertoSharePercent: Number(values.newCustomerAlbertoSharePercent),
      }
    : null;

  const invalid = !parsed || Object.values(parsed).some((n) => !Number.isFinite(n) || n < 0 || n > 100);

  return (
    <Card data-testid="card-split-config">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-purple-500" />
          Revenue Split Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading || !values ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {FIELDS.map((field) => (
              <div key={field.key} className="space-y-1">
                <Label htmlFor={`split-${field.key}`}>{field.label}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id={`split-${field.key}`}
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    className="w-28"
                    value={values[field.key]}
                    onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                    data-testid={`input-${field.key}`}
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground">{field.help}</p>
              </div>
            ))}

            {parsed && !invalid && (
              <p className="text-xs text-muted-foreground border rounded-md p-3">
                On $100 from a new customer: Alberto gets $
                {((parsed.newCustomerCommissionPercent * parsed.newCustomerAlbertoSharePercent) / 100).toFixed(2)},
                Scaled Services gets $
                {((parsed.newCustomerCommissionPercent * (100 - parsed.newCustomerAlbertoSharePercent)) / 100).toFixed(2)},
                Miramar keeps ${(100 - parsed.newCustomerCommissionPercent).toFixed(2)}. On $100 from a returning
                customer: Alberto gets ${parsed.albertoCommissionPercent.toFixed(2)}, Miramar keeps $
                {(100 - parsed.albertoCommissionPercent).toFixed(2)}.
              </p>
            )}

            <div className="flex items-center gap-3">
              <Button
                onClick={() => parsed && saveMutation.mutate(parsed)}
                disabled={invalid || saveMutation.isPending}
                data-testid="button-save-split-config"
              >
                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Split Config
              </Button>
              {invalid && <p className="text-xs text-destructive">Each value must be between 0 and 100.</p>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
