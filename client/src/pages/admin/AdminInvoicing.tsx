import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import { DollarSign, FileText, CheckCircle, XCircle } from "lucide-react";

export default function AdminInvoicing() {
  const { t } = useTranslation();
  const { data: creditApps = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/credit"],
    queryFn: async () => {
      const res = await fetch("/api/admin/credit", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });
  const { data: invoices = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/invoices"],
    queryFn: async () => {
      const res = await fetch("/api/admin/invoices", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ companyId }: { companyId: number }) =>
      apiRequest("PATCH", `/api/admin/credit/${companyId}/approve`, { terms: "net30", creditLimitCents: 500000 }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/credit"] }),
  });

  const denyMutation = useMutation({
    mutationFn: (companyId: number) =>
      apiRequest("PATCH", `/api/admin/credit/${companyId}/deny`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/credit"] }),
  });

  const markPaidMutation = useMutation({
    mutationFn: (invoiceId: number) =>
      apiRequest("PATCH", `/api/admin/invoices/${invoiceId}/mark-paid`, { paymentMethod: "manual", paymentNote: "Recorded by admin" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] }),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t("admin.invoicing.title", { defaultValue: "Invoicing & Credit" })}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("admin.invoicing.description", { defaultValue: "Manage company credit and invoices" })}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {t("admin.invoicing.creditApps", { defaultValue: "Credit Applications" })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {creditApps.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("admin.invoicing.noApps", { defaultValue: "No credit applications yet." })}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Terms</TableHead>
                    <TableHead>Limit</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creditApps.map((app: any) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.companyName || `Company #${app.companyId}`}</TableCell>
                      <TableCell>
                        <Badge variant={app.creditStatus === "approved" ? "default" : app.creditStatus === "denied" ? "destructive" : "outline"}>
                          {app.creditStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>{app.terms || "-"}</TableCell>
                      <TableCell>{app.creditLimitCents ? `$${(app.creditLimitCents / 100).toFixed(2)}` : "-"}</TableCell>
                      <TableCell>
                        {app.creditStatus === "pending" && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => approveMutation.mutate({ companyId: app.companyId })}>
                              <CheckCircle className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => denyMutation.mutate(app.companyId)}>
                              <XCircle className="h-4 w-4 mr-1" /> Deny
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t("admin.invoicing.invoices", { defaultValue: "Invoices" })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("admin.invoicing.noInvoices", { defaultValue: "No invoices yet." })}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv: any) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono">{inv.invoiceNumber}</TableCell>
                      <TableCell>{inv.companyName || `Company #${inv.companyId}`}</TableCell>
                      <TableCell>${(inv.amountCents / 100).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={inv.status === "paid" ? "default" : inv.status === "overdue" ? "destructive" : "outline"}>
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{inv.sentAt ? new Date(inv.sentAt).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>
                        {inv.status !== "paid" && (
                          <Button size="sm" variant="outline" onClick={() => markPaidMutation.mutate(inv.id)}>
                            Mark Paid
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
