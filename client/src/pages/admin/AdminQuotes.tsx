import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import AdminLayout from "./AdminLayout";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ChevronRight, Plus, Building2, Link2, FileText } from "lucide-react";
import {
  QUOTE_STATUSES,
  QUOTE_STATUS_LABELS,
  type QuoteStatus,
} from "@shared/config/quote-states";

interface QuoteRow {
  id: number;
  title: string;
  status: QuoteStatus;
  companyId: number | null;
  companyName: string | null;
  contactId: number | null;
  contactName: string | null;
  originatingLeadId: number | null;
  linkedTrainingEventId: number | null;
  total: number;
  validUntil: string | null;
  createdAt: string;
}

type QueueTab = "active" | "draft" | "sent" | "approved" | "converted" | "lost" | "all";

const QUEUE_TABS: { key: QueueTab; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "draft", label: "Draft" },
  { key: "sent", label: "Sent" },
  { key: "approved", label: "Approved" },
  { key: "converted", label: "Converted" },
  { key: "lost", label: "Lost" },
  { key: "all", label: "All" },
];

const statusColorMap: Record<QuoteStatus, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  declined: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  expired: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  converted: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  canceled: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

function filterByQueue(rows: QuoteRow[], queue: QueueTab): QuoteRow[] {
  switch (queue) {
    case "active":
      return rows.filter((r) => r.status === "draft" || r.status === "sent" || r.status === "approved");
    case "lost":
      return rows.filter((r) => r.status === "declined" || r.status === "expired" || r.status === "canceled");
    case "all":
      return rows;
    default:
      return rows.filter((r) => r.status === queue);
  }
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((cents ?? 0) / 100);
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminQuotes() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [activeQueue, setActiveQueue] = useState<QueueTab>("active");

  const { data, isLoading } = useQuery<{ quotes: QuoteRow[] }>({
    queryKey: ["/api/admin/quotes"],
  });

  const allQuotes = data?.quotes ?? [];
  const queued = filterByQueue(allQuotes, activeQueue);
  const filtered = search
    ? queued.filter((q) =>
        q.title.toLowerCase().includes(search.toLowerCase()) ||
        String(q.id).includes(search) ||
        (q.companyName ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : queued;

  const counts: Record<QueueTab, number> = {
    active: filterByQueue(allQuotes, "active").length,
    draft: filterByQueue(allQuotes, "draft").length,
    sent: filterByQueue(allQuotes, "sent").length,
    approved: filterByQueue(allQuotes, "approved").length,
    converted: filterByQueue(allQuotes, "converted").length,
    lost: filterByQueue(allQuotes, "lost").length,
    all: allQuotes.length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="admin-quotes-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-quotes-title">Quotes</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Customer-facing quotes that can be approved and converted to training events
            </p>
          </div>
          <Link href="/admin/quotes/new">
            <Button data-testid="button-create-quote">
              <Plus className="h-4 w-4 mr-2" />
              New Quote
            </Button>
          </Link>
        </div>

        <div className="flex flex-wrap gap-1 border-b pb-1" data-testid="queue-tabs">
          {QUEUE_TABS.map((tab) => (
            <button
              key={tab.key}
              className={`px-3 py-2 text-sm rounded-t-md transition-colors ${
                activeQueue === tab.key
                  ? "bg-brand-dark text-white font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              onClick={() => setActiveQueue(tab.key)}
              data-testid={`tab-queue-${tab.key}`}
            >
              {tab.label}
              <span className="ml-1.5 text-xs opacity-70">({counts[tab.key]})</span>
            </button>
          ))}
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, ID, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-quotes"
          />
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quote</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No quotes in this queue
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((q) => (
                  <TableRow
                    key={q.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/admin/quotes/${q.id}`)}
                    data-testid={`row-quote-${q.id}`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium" data-testid={`text-quote-title-${q.id}`}>{q.title}</span>
                        <span className="text-xs text-muted-foreground">#{q.id}</span>
                        {q.linkedTrainingEventId && <Link2 className="h-3 w-3 text-primary ml-1" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColorMap[q.status]} data-testid={`badge-quote-status-${q.id}`}>
                        {QUOTE_STATUS_LABELS[q.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {q.companyName ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate max-w-[160px]">{q.companyName}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell><span className="text-sm font-medium">{formatMoney(q.total)}</span></TableCell>
                    <TableCell><span className="text-sm">{formatDate(q.validUntil)}</span></TableCell>
                    <TableCell><span className="text-sm">{formatDate(q.createdAt)}</span></TableCell>
                    <TableCell><ChevronRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
