import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

interface AuditLogEntry {
  id: number;
  actorUserId: number | null;
  actorName: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: any;
  createdAt: string;
}

export default function AdminAuditLog() {
  const [actionFilter, setActionFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const { data, isLoading } = useQuery<{ logs: AuditLogEntry[] }>({
    queryKey: ["/api/admin/audit-logs"],
  });

  const logs = data?.logs ?? [];

  const actions = Array.from(new Set(logs.map((l) => l.action)));

  const filtered = logs.filter((log) => {
    if (actionFilter !== "all" && log.action !== actionFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        log.action.toLowerCase().includes(s) ||
        log.entity.toLowerCase().includes(s) ||
        (log.entityId && log.entityId.toLowerCase().includes(s)) ||
        String(log.actorUserId).includes(s)
      );
    }
    return true;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold" data-testid="text-admin-audit-log-title">Audit Log</h1>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-audit"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-48" data-testid="select-audit-action-filter">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {actions.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
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
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Entity ID</TableHead>
                  <TableHead>Metadata</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((log) => (
                  <TableRow
                    key={log.id}
                    data-testid={`row-audit-${log.id}`}
                    className="cursor-pointer hover-elevate"
                    onClick={() => setSelectedLog(log)}
                  >
                    <TableCell data-testid={`text-audit-actor-${log.id}`}>
                      {log.actorName || "System"}
                    </TableCell>
                    <TableCell data-testid={`text-audit-action-${log.id}`}>
                      {log.action}
                    </TableCell>
                    <TableCell>{log.entity}</TableCell>
                    <TableCell>{log.entityId ?? "--"}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {log.metadata ? JSON.stringify(log.metadata) : "--"}
                    </TableCell>
                    <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" data-testid="dialog-audit-detail">
          <DialogHeader>
            <DialogTitle>Audit Log Detail</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Log ID</p>
                  <p className="font-medium" data-testid="text-detail-id">{selectedLog.id}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Timestamp</p>
                  <p className="font-medium" data-testid="text-detail-timestamp">
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Actor</p>
                  <p className="font-medium" data-testid="text-detail-actor">
                    {selectedLog.actorName || "System"}
                    {selectedLog.actorUserId != null && (
                      <span className="text-muted-foreground text-xs ml-1">(ID: {selectedLog.actorUserId})</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Action</p>
                  <Badge variant="secondary" data-testid="badge-detail-action">{selectedLog.action}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Entity</p>
                  <p className="font-medium" data-testid="text-detail-entity">{selectedLog.entity}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Entity ID</p>
                  <p className="font-medium" data-testid="text-detail-entity-id">{selectedLog.entityId ?? "--"}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Metadata</p>
                <pre
                  className="bg-muted p-3 rounded-md text-xs overflow-x-auto whitespace-pre-wrap break-all"
                  data-testid="text-detail-metadata"
                >
                  {selectedLog.metadata
                    ? JSON.stringify(selectedLog.metadata, null, 2)
                    : "No metadata"}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
