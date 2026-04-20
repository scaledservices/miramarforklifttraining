import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Users, ShoppingCart, DollarSign, TrendingUp, Settings, Pencil, Check, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import AdminLayout from "./AdminLayout";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface DashboardMetrics {
  metrics: {
    totalUsers: number;
    totalOrders: number;
    totalRevenue: number;
  };
}

interface ProfitabilityData {
  currentSplit: { platformPercent: number; partnerPercent: number };
  totals: { revenue: number; platformEarnings: number; partnerEarnings: number };
  mtd: { revenue: number; platformEarnings: number; partnerEarnings: number };
  recentTransactions: Array<{
    id: number;
    date: string;
    orderNumber: string;
    customerName: string;
    amount: number;
    platformEarnings: number;
    partnerEarnings: number;
  }>;
  revenueTrend: Array<{ date: string; revenue: number }>;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin" || user?.role === "admin";

  const { data, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/admin/dashboard"],
  });

  const { data: profitData, isLoading: profitLoading } = useQuery<ProfitabilityData>({
    queryKey: ["/api/admin/profitability"],
    enabled: isSuperAdmin,
  });

  const metrics = data?.metrics;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold" data-testid="text-admin-dashboard-title">
          Dashboard
        </h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Users"
            value={metrics?.totalUsers}
            icon={<Users className="h-4 w-4 text-muted-foreground" />}
            isLoading={isLoading}
            testId="card-metric-users"
          />
          <MetricCard
            title="Total Orders"
            value={metrics?.totalOrders}
            icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
            isLoading={isLoading}
            testId="card-metric-orders"
          />
          <MetricCard
            title="Total Revenue"
            value={metrics?.totalRevenue != null ? `$${metrics.totalRevenue.toFixed(2)}` : undefined}
            icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
            isLoading={isLoading}
            testId="card-metric-revenue"
          />
          <MetricCard
            title="Completion Rate"
            value="--"
            icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
            isLoading={isLoading}
            testId="card-metric-completion"
          />
        </div>

        {isSuperAdmin && (
          <>
            <Separator />
            <h2 className="text-xl font-bold" data-testid="text-profitability-title">
              Profitability
            </h2>

            {profitLoading ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
            ) : profitData ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <MetricCard
                    title="Platform Earnings"
                    value={`$${profitData.totals.platformEarnings.toFixed(2)}`}
                    icon={<DollarSign className="h-4 w-4 text-green-600" />}
                    isLoading={false}
                    testId="card-metric-platform-earnings"
                  />
                  <MetricCard
                    title="Partner Payouts"
                    value={`$${profitData.totals.partnerEarnings.toFixed(2)}`}
                    icon={<DollarSign className="h-4 w-4 text-blue-600" />}
                    isLoading={false}
                    testId="card-metric-partner-payouts"
                  />
                  <MetricCard
                    title="MTD Revenue"
                    value={`$${profitData.mtd.revenue.toFixed(2)}`}
                    icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
                    isLoading={false}
                    testId="card-metric-mtd-revenue"
                  />
                  <MetricCard
                    title="MTD Platform"
                    value={`$${profitData.mtd.platformEarnings.toFixed(2)}`}
                    icon={<TrendingUp className="h-4 w-4 text-green-600" />}
                    isLoading={false}
                    testId="card-metric-mtd-platform"
                  />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <ProfitSplitCard currentSplit={profitData.currentSplit} />
                  <RevenueChart data={profitData.revenueTrend} />
                </div>

                <TransactionTable transactions={profitData.recentTransactions} />
              </>
            ) : null}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function ProfitSplitCard({ currentSplit }: { currentSplit: { platformPercent: number; partnerPercent: number } }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [platformPct, setPlatformPct] = useState(String(currentSplit.platformPercent));

  const updateSplit = useMutation({
    mutationFn: async (newPlatformPct: number) => {
      await apiRequest("PUT", "/api/admin/settings", {
        key: "profit_split",
        value: { platformPercent: newPlatformPct, partnerPercent: 100 - newPlatformPct },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/profitability"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      setEditing(false);
      toast({ title: "Profit split updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update", description: err.message, variant: "destructive" });
    },
  });

  function handleSave() {
    const val = Number(platformPct);
    if (isNaN(val) || val < 0 || val > 100) {
      toast({ title: "Invalid percentage", description: "Must be 0-100", variant: "destructive" });
      return;
    }
    updateSplit.mutate(val);
  }

  return (
    <Card data-testid="card-profit-split">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Profit Split Configuration</CardTitle>
        <Settings className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        {editing ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm w-20">Platform:</span>
              <Input
                type="number"
                min="0"
                max="100"
                value={platformPct}
                onChange={(e) => setPlatformPct(e.target.value)}
                className="w-20"
                data-testid="input-platform-percent"
              />
              <span className="text-sm">%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm w-20">Partner:</span>
              <span className="text-sm font-medium">{100 - (Number(platformPct) || 0)}%</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={updateSplit.isPending} data-testid="button-save-split">
                <Check className="h-3 w-3 mr-1" />Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setEditing(false); setPlatformPct(String(currentSplit.platformPercent)); }} data-testid="button-cancel-split">
                <X className="h-3 w-3 mr-1" />Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Platform</span>
              <span className="text-2xl font-bold" data-testid="text-platform-percent">{currentSplit.platformPercent}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Partner</span>
              <span className="text-2xl font-bold" data-testid="text-partner-percent">{currentSplit.partnerPercent}%</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)} data-testid="button-edit-split">
              <Pencil className="h-3 w-3 mr-1" />Edit Split
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RevenueChart({ data }: { data: Array<{ date: string; revenue: number }> }) {
  return (
    <Card data-testid="card-revenue-chart">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Revenue Trend (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
            No revenue data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, "Revenue"]} labelFormatter={(l) => `Date: ${l}`} />
              <Bar dataKey="revenue" fill="hsl(25, 90%, 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function TransactionTable({ transactions }: { transactions: ProfitabilityData["recentTransactions"] }) {
  return (
    <Card data-testid="card-transaction-earnings">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Recent Transaction Earnings</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No transactions yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Order</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Customer</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Gross</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Platform</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Partner</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr key={txn.id} className="border-b last:border-0" data-testid={`row-transaction-${txn.id}`}>
                    <td className="py-2">{new Date(txn.date).toLocaleDateString()}</td>
                    <td className="py-2 font-mono text-xs">{txn.orderNumber}</td>
                    <td className="py-2">{txn.customerName}</td>
                    <td className="py-2 text-right font-medium">${txn.amount.toFixed(2)}</td>
                    <td className="py-2 text-right text-green-600">${txn.platformEarnings.toFixed(2)}</td>
                    <td className="py-2 text-right text-blue-600">${txn.partnerEarnings.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricCard({
  title,
  value,
  icon,
  isLoading,
  testId,
}: {
  title: string;
  value?: string | number;
  icon: React.ReactNode;
  isLoading: boolean;
  testId: string;
}) {
  return (
    <Card data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold" data-testid={`${testId}-value`}>
            {value ?? 0}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
