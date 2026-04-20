import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EmailEntry {
  id: number;
  to: string;
  subject: string;
  template: string;
  payload: any;
  html: string;
  providerStatus: string | null;
  providerMessageId: string | null;
  lastError: string | null;
  createdAt: string;
}

function statusBadge(status: string | null) {
  switch (status) {
    case "sent":
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" data-testid="badge-status-sent">Sent</Badge>;
    case "failed":
      return <Badge variant="destructive" data-testid="badge-status-failed">Failed</Badge>;
    case "error":
      return <Badge variant="destructive" data-testid="badge-status-error">Error</Badge>;
    case "outbox_only":
      return <Badge variant="secondary" data-testid="badge-status-outbox">Outbox Only</Badge>;
    case "queued":
      return <Badge variant="outline" data-testid="badge-status-queued">Queued</Badge>;
    default:
      return <Badge variant="outline">{status || "Unknown"}</Badge>;
  }
}

export default function AdminEmailOutbox() {
  const [search, setSearch] = useState("");
  const [templateFilter, setTemplateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedEmail, setSelectedEmail] = useState<EmailEntry | null>(null);
  const [showHtml, setShowHtml] = useState(false);

  const { data, isLoading } = useQuery<{ emails: EmailEntry[] }>({
    queryKey: ["/api/admin/email-outbox"],
  });

  const emails = data?.emails ?? [];
  const templates = Array.from(new Set(emails.map((e) => e.template)));
  const statuses = Array.from(new Set(emails.map((e) => e.providerStatus).filter(Boolean)));
  const hasNoProvider = emails.length > 0 && emails.every((e) => e.providerStatus === "outbox_only" || e.providerStatus === "failed");

  const filtered = emails.filter((email) => {
    if (templateFilter !== "all" && email.template !== templateFilter) return false;
    if (statusFilter !== "all" && email.providerStatus !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        email.to.toLowerCase().includes(s) ||
        email.subject.toLowerCase().includes(s) ||
        email.template.toLowerCase().includes(s)
      );
    }
    return true;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold" data-testid="text-admin-email-outbox-title">Email Outbox</h1>

        {hasNoProvider && (
          <Alert data-testid="alert-no-email-provider">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Email provider not fully configured. Emails are saved to the outbox but may not be delivered.
              Set <code className="text-xs bg-muted px-1 py-0.5 rounded">RESEND_API_KEY</code> and verify your sending domain to enable delivery.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search emails..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-email"
            />
          </div>
          <Select value={templateFilter} onValueChange={setTemplateFilter}>
            <SelectTrigger className="w-48" data-testid="select-template-filter">
              <SelectValue placeholder="Filter by template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Templates</SelectItem>
              {templates.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48" data-testid="select-status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statuses.map((s) => (
                <SelectItem key={s!} value={s!}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>To</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Provider ID</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((email) => (
                  <TableRow
                    key={email.id}
                    data-testid={`row-email-${email.id}`}
                    className="cursor-pointer hover-elevate"
                    onClick={() => { setSelectedEmail(email); setShowHtml(false); }}
                  >
                    <TableCell data-testid={`text-email-to-${email.id}`}>{email.to}</TableCell>
                    <TableCell className="max-w-xs truncate" data-testid={`text-email-subject-${email.id}`}>
                      {email.subject}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{email.template}</Badge>
                    </TableCell>
                    <TableCell>{statusBadge(email.providerStatus)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                      {email.providerMessageId || "--"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(email.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No emails found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={!!selectedEmail} onOpenChange={(open) => !open && setSelectedEmail(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="dialog-email-detail">
          <DialogHeader>
            <DialogTitle>Email Detail</DialogTitle>
          </DialogHeader>
          {selectedEmail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">To</p>
                  <p className="font-medium" data-testid="text-detail-to">{selectedEmail.to}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Subject</p>
                  <p className="font-medium" data-testid="text-detail-subject">{selectedEmail.subject}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Template</p>
                  <Badge variant="outline">{selectedEmail.template}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  {statusBadge(selectedEmail.providerStatus)}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Provider Message ID</p>
                  <p className="font-mono text-xs">{selectedEmail.providerMessageId || "--"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="font-medium">{new Date(selectedEmail.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {selectedEmail.lastError && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Error</p>
                  <pre className="bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200 p-3 rounded-md text-xs overflow-x-auto whitespace-pre-wrap break-all" data-testid="text-detail-error">
                    {selectedEmail.lastError}
                  </pre>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs text-muted-foreground">Email Body</p>
                  <button
                    onClick={() => setShowHtml(!showHtml)}
                    className="text-xs text-primary underline"
                    data-testid="button-toggle-html"
                  >
                    {showHtml ? "Show Rendered" : "Show Source"}
                  </button>
                </div>
                {showHtml ? (
                  <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto whitespace-pre-wrap break-all max-h-96" data-testid="text-detail-html-source">
                    {selectedEmail.html}
                  </pre>
                ) : (
                  <div
                    className="border rounded-md p-0 overflow-hidden"
                    data-testid="text-detail-html-rendered"
                  >
                    <iframe
                      srcDoc={selectedEmail.html}
                      className="w-full h-96 border-0"
                      title="Email preview"
                      sandbox=""
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
