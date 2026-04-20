import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import AdminLayout from "./AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Download, Eye, Search, X, Building2 } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

interface AdminOrder {
  id: number;
  orderNumber: string;
  userId: number;
  userName: string;
  userEmail: string;
  total: string;
  status: string;
  createdAt: string;
  companyId: number | null;
  companyName: string | null;
}

export default function AdminOrders() {
  const [viewOrder, setViewOrder] = useState<AdminOrder | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [userFilter, setUserFilter] = useState<number | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
  const [, navigate] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("user");
    if (userId) {
      setUserFilter(parseInt(userId));
    }
  }, []);

  const { data, isLoading } = useQuery<{ orders: AdminOrder[] }>({
    queryKey: ["/api/admin/orders"],
  });

  const refundMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/admin/orders/${id}/refund`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "Refund issued" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const statusVariant = (status: string) => {
    switch (status) {
      case "paid": return "default" as const;
      case "pending": return "secondary" as const;
      case "refunded": return "destructive" as const;
      default: return "outline" as const;
    }
  };

  const orders = data?.orders ?? [];

  const filtered = orders.filter((order) => {
    if (userFilter && order.userId !== userFilter) return false;
    if (statusFilter !== "all" && order.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !order.orderNumber.toLowerCase().includes(q) &&
        !order.userName.toLowerCase().includes(q) &&
        !order.userEmail.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const filteredUserInfo = userFilter
    ? orders.find((o) => o.userId === userFilter)
    : null;

  const clearUserFilter = () => {
    setUserFilter(null);
    navigate("/admin/orders");
  };

  const downloadInvoice = async (orderId: number, orderNumber: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/invoice`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch invoice");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${orderNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Error", description: "Failed to download invoice", variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold" data-testid="text-admin-orders-title">Orders</h1>
        <div className="flex items-center gap-4 flex-wrap">
          {userFilter && (
            <Badge variant="secondary" data-testid="badge-user-filter">
              Filtered by: {filteredUserInfo?.userName || filteredUserInfo?.userEmail || `User #${userFilter}`}
              <Button
                size="icon"
                variant="ghost"
                className="h-4 w-4 ml-1 p-0"
                onClick={clearUserFilter}
                data-testid="button-clear-user-filter"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" data-testid="select-order-status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order #, name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-orders"
            />
          </div>
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
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>{t("adminCompany.company")}</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((order) => (
                  <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                    <TableCell data-testid={`text-order-number-${order.id}`}>
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.userName}</div>
                        <div className="text-xs text-muted-foreground">{order.userEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell data-testid={`text-order-company-${order.id}`}>
                      {order.companyName ? (
                        <Link href={`/admin/companies/${order.companyId}`} className="text-sm text-primary hover:underline flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {order.companyName}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground text-xs">{t("adminCompany.noCompany")}</span>
                      )}
                    </TableCell>
                    <TableCell data-testid={`text-order-total-${order.id}`}>
                      ${parseFloat(order.total).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(order.status)} data-testid={`badge-order-status-${order.id}`}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 flex-wrap">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setViewOrder(order)}
                          data-testid={`button-view-order-${order.id}`}
                        >
                          <Eye />
                        </Button>
                        {order.status === "paid" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => refundMutation.mutate(order.id)}
                            disabled={refundMutation.isPending}
                            data-testid={`button-refund-order-${order.id}`}
                          >
                            <RefreshCw />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => downloadInvoice(order.id, order.orderNumber)}
                          data-testid={`button-invoice-order-${order.id}`}
                        >
                          <Download />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No orders found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={!!viewOrder} onOpenChange={(open) => !open && setViewOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {viewOrder && (
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Order #:</span> {viewOrder.orderNumber}</p>
              <p><span className="font-medium">Customer:</span> {viewOrder.userName} ({viewOrder.userEmail})</p>
              <p><span className="font-medium">Total:</span> ${parseFloat(viewOrder.total).toFixed(2)}</p>
              <p><span className="font-medium">Status:</span> {viewOrder.status}</p>
              <p><span className="font-medium">Created:</span> {new Date(viewOrder.createdAt).toLocaleString()}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOrder(null)} data-testid="button-close-order-detail">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
