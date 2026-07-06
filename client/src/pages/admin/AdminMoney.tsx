import { useQuery } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { DollarSign, AlertTriangle, CalendarDays, CalendarRange } from "lucide-react";
import MonthlyStatement from "@/components/admin/money/MonthlyStatement";
import SplitConfigEditor from "@/components/admin/money/SplitConfigEditor";
import { formatMoney, type MoneySummary } from "@/components/admin/money/types";

function SummaryCard({
  title,
  icon,
  value,
  sub,
  testId,
}: {
  title: string;
  icon: React.ReactNode;
  value: string;
  sub: string;
  testId: string;
}) {
  return (
    <Card data-testid={testId}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

export default function AdminMoney() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const { data: summary, isLoading, isError } = useQuery<MoneySummary>({
    queryKey: ["/api/admin/money/summary"],
  });

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="admin-money-page">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-money-title">Money</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Collected payments, outstanding balances, and the monthly revenue split.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        ) : isError || !summary ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Failed to load money summary.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              title="Collected This Week"
              icon={<DollarSign className="h-4 w-4 text-green-500" />}
              value={formatMoney(summary.week.collected)}
              sub={`${summary.week.start} to ${summary.week.end}`}
              testId="card-week-collected"
            />
            <SummaryCard
              title="Outstanding This Week"
              icon={<CalendarDays className="h-4 w-4 text-orange-500" />}
              value={formatMoney(summary.week.outstanding)}
              sub="Balances due on this week's sessions"
              testId="card-week-outstanding"
            />
            <SummaryCard
              title="Collected This Month"
              icon={<DollarSign className="h-4 w-4 text-green-500" />}
              value={formatMoney(summary.month.collected)}
              sub={`${summary.month.start} to ${summary.month.end}`}
              testId="card-month-collected"
            />
            <SummaryCard
              title="Outstanding This Month"
              icon={<CalendarRange className="h-4 w-4 text-orange-500" />}
              value={formatMoney(summary.month.outstanding)}
              sub={`${formatMoney(summary.totalOutstanding)} outstanding overall`}
              testId="card-month-outstanding"
            />
          </div>
        )}

        <MonthlyStatement />

        {isSuperAdmin && <SplitConfigEditor />}
      </div>
    </AdminLayout>
  );
}
