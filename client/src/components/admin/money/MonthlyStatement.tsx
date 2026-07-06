import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, ChevronDown, ChevronUp, UserPlus } from "lucide-react";
import { formatMoney, type MonthlyStatementData } from "./types";

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const PARTY_COLORS: Record<string, string> = {
  alberto: "text-amber-600",
  scaled: "text-blue-600",
  miramar: "text-green-600",
};

export default function MonthlyStatement() {
  const [month, setMonth] = useState(currentMonth());
  const [showLineItems, setShowLineItems] = useState(false);

  const { data, isLoading, isError } = useQuery<MonthlyStatementData>({
    queryKey: [`/api/admin/money/statement?month=${month}`],
  });

  return (
    <Card data-testid="card-monthly-statement">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Monthly Statement
          </CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="statement-month" className="text-sm text-muted-foreground whitespace-nowrap">
              Month
            </Label>
            <Input
              id="statement-month"
              type="month"
              value={month}
              onChange={(e) => e.target.value && setMonth(e.target.value)}
              className="w-44"
              data-testid="input-statement-month"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : isError || !data ? (
          <p className="text-sm text-muted-foreground py-4">Failed to load statement.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(["alberto", "scaled", "miramar"] as const).map((key) => (
                <div key={key} className="rounded-lg border p-4" data-testid={`statement-party-${key}`}>
                  <p className="text-sm text-muted-foreground">{data.parties[key].name}</p>
                  <p className={`text-2xl font-bold ${PARTY_COLORS[key]}`}>
                    {formatMoney(data.parties[key].total)}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
              <span>
                Revenue: <span className="font-medium text-foreground">{formatMoney(data.totals.revenue)}</span>
              </span>
              <span>
                New customers: <span className="font-medium text-foreground">{formatMoney(data.totals.newCustomerRevenue)}</span>
              </span>
              <span>
                Returning: <span className="font-medium text-foreground">{formatMoney(data.totals.returningRevenue)}</span>
              </span>
            </div>

            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLineItems((v) => !v)}
                data-testid="button-toggle-line-items"
              >
                {showLineItems ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                {showLineItems ? "Hide" : "Show"} line items ({data.lineItems.length})
              </Button>
            </div>

            {showLineItems && (
              data.lineItems.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No payments in this month.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Alberto</TableHead>
                        <TableHead className="text-right">Scaled</TableHead>
                        <TableHead className="text-right">Miramar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.lineItems.map((item) => (
                        <TableRow key={item.paymentId} data-testid={`row-line-item-${item.paymentId}`}>
                          <TableCell className="whitespace-nowrap">
                            {new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{item.orderNumber}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <span className="whitespace-nowrap">{item.customerName}</span>
                              {item.isNewCustomer && (
                                <Badge variant="secondary" className="text-xs whitespace-nowrap">
                                  <UserPlus className="h-3 w-3 mr-1" />
                                  New
                                </Badge>
                              )}
                              {item.isRefund && (
                                <Badge variant="destructive" className="text-xs">Refund</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap font-medium">
                            {formatMoney(item.amount)}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">{formatMoney(item.split.alberto)}</TableCell>
                          <TableCell className="text-right whitespace-nowrap">{formatMoney(item.split.scaled)}</TableCell>
                          <TableCell className="text-right whitespace-nowrap">{formatMoney(item.split.miramar)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )
            )}

            <p className="text-xs text-muted-foreground">{data.newCustomerRule} Card surcharges are excluded.</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
