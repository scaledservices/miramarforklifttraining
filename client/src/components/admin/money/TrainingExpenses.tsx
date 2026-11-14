import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Receipt, Plus, Check, X } from "lucide-react";
import { formatMoney } from "./types";
import { EXPENSE_LABELS } from "./MonthlyStatement";
import { productLabel } from "@/components/admin/today/types";

interface TrainingRow {
  kind: "booking" | "training_event";
  bookingId: number | null;
  trainingEventId: number | null;
  orderId: number | null;
  reference: string;
  date: string;
  title: string;
  customer: string | null;
  city: string | null;
  participants: number | null;
  expenses: { checkedIn: boolean; noExpenses: boolean; total: number; count: number };
}

const CATEGORIES = ["travel", "lodging", "meals", "equipment_rental", "materials", "parking_tolls", "other"] as const;

function invalidateMoney() {
  queryClient.invalidateQueries({ predicate: (q) => String(q.queryKey[0] ?? "").startsWith("/api/admin/money/statement") });
  queryClient.invalidateQueries({ queryKey: ["/api/admin/expenses/trainings?days=30"] });
}

function AddExpenseRow({ t, onDone }: { t: TrainingRow; onDone: () => void }) {
  const [category, setCategory] = useState<string>("travel");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const save = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/expenses", {
      bookingId: t.bookingId ?? undefined,
      trainingEventId: t.trainingEventId ?? undefined,
      orderId: t.orderId ?? undefined,
      category,
      amount: Number(amount),
      description: note || null,
    }),
    onSuccess: () => { invalidateMoney(); onDone(); },
  });
  const valid = Number(amount) > 0;
  return (
    <div className="flex flex-wrap items-center gap-2 pt-2" data-testid={`form-expense-${t.reference}`}>
      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
        <SelectContent>
          {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{EXPENSE_LABELS[c]}</SelectItem>)}
        </SelectContent>
      </Select>
      <Input className="h-8 w-24" inputMode="decimal" placeholder="$0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <Input className="h-8 flex-1 min-w-[10rem]" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      <Button size="sm" className="h-8" disabled={!valid || save.isPending} onClick={() => save.mutate()}>
        <Check className="h-4 w-4 mr-1" />Save
      </Button>
      <Button size="sm" variant="ghost" className="h-8" onClick={onDone}><X className="h-4 w-4" /></Button>
    </div>
  );
}

export default function TrainingExpenses() {
  const [openRef, setOpenRef] = useState<string | null>(null);
  const { data, isLoading } = useQuery<{ trainings: TrainingRow[] }>({
    queryKey: ["/api/admin/expenses/trainings?days=30"],
  });
  const markNone = useMutation({
    mutationFn: (t: TrainingRow) => apiRequest("POST", "/api/admin/expenses", {
      bookingId: t.bookingId ?? undefined,
      trainingEventId: t.trainingEventId ?? undefined,
      orderId: t.orderId ?? undefined,
      category: "none",
      amount: 0,
      description: "No expenses",
    }),
    onSuccess: invalidateMoney,
  });

  const trainings = data?.trainings ?? [];
  const waiting = trainings.filter((t) => !t.expenses.checkedIn).length;

  return (
    <Card data-testid="card-training-expenses">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Receipt className="h-5 w-5 text-amber-600" />
          Training Expenses
          {waiting > 0 && <Badge variant="secondary" className="text-xs">{waiting} waiting</Badge>}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Travel, lodging and other costs for each training in the last 30 days. They are reimbursed to Alberto and
          come off new-customer revenue before it is split. The assistant also asks Alberto about these on WhatsApp.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : trainings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No trainings in the last 30 days.</p>
        ) : (
          trainings.map((t) => (
            <div key={t.reference} className="rounded-md border px-3 py-2" data-testid={`row-training-${t.reference}`}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-sm font-medium whitespace-nowrap">
                  {new Date(`${t.date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <span className="text-sm">{t.kind === "booking" ? productLabel(t.title) : t.title}</span>
                <span className="text-xs text-muted-foreground">
                  {[t.customer, t.city, t.participants ? `${t.participants} people` : null].filter(Boolean).join(" · ")}
                </span>
                <span className="ml-auto flex items-center gap-2">
                  {t.expenses.noExpenses ? (
                    <Badge variant="outline" className="text-xs">No expenses</Badge>
                  ) : t.expenses.checkedIn ? (
                    <Badge variant="secondary" className="text-xs">{formatMoney(t.expenses.total)}</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-amber-700 border-amber-300">Waiting on Alberto</Badge>
                  )}
                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setOpenRef(openRef === t.reference ? null : t.reference)}>
                    <Plus className="h-4 w-4 mr-1" />Add
                  </Button>
                  {!t.expenses.checkedIn && (
                    <Button size="sm" variant="ghost" className="h-7 px-2" disabled={markNone.isPending} onClick={() => markNone.mutate(t)}>
                      None
                    </Button>
                  )}
                </span>
              </div>
              {openRef === t.reference && <AddExpenseRow t={t} onDone={() => setOpenRef(null)} />}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
