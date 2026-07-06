import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign } from "lucide-react";
import { formatMoney, type MoneySummary } from "./types";

/**
 * Compact "this week" money card: collected vs outstanding.
 * Self-fetching so any admin page can embed it. Admin-only endpoint —
 * only render inside admin views.
 */
export default function MoneySummaryCard({ className }: { className?: string }) {
  const { data, isLoading, isError } = useQuery<MoneySummary>({
    queryKey: ["/api/admin/money/summary"],
  });

  return (
    <Card className={className} data-testid="card-money-summary">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-green-500" />
          This Week
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-4 w-36" />
          </div>
        ) : isError || !data ? (
          <p className="text-sm text-muted-foreground">Unavailable</p>
        ) : (
          <>
            <p className="text-2xl font-bold" data-testid="text-week-collected">
              {formatMoney(data.week.collected)}
            </p>
            <p className="text-xs text-muted-foreground">
              collected &middot; {formatMoney(data.week.outstanding)} outstanding
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
