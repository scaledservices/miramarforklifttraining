import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import AdminLayout from "./AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Truck, Package } from "lucide-react";

interface CardOrder {
  id: number;
  userId: number;
  certificationId: number;
  quantity: number;
  shippingMethod: string;
  shippingCost: string;
  totalAmount: string;
  status: string;
  trackingNumber: string | null;
  carrier: string | null;
  createdAt: string;
}

export default function AdminCardOrders() {
  const { toast } = useToast();
  const [trackingDialog, setTrackingDialog] = useState<CardOrder | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");

  const { data, isLoading } = useQuery<{ cardOrders: CardOrder[] }>({
    queryKey: ["/api/admin/card-orders"],
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/admin/card-orders/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/card-orders"] });
      toast({ title: "Status updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const trackingMutation = useMutation({
    mutationFn: async ({ id, trackingNumber, carrier }: { id: number; trackingNumber: string; carrier: string }) => {
      await apiRequest("PATCH", `/api/admin/card-orders/${id}/tracking`, { trackingNumber, carrier });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/card-orders"] });
      setTrackingDialog(null);
      toast({ title: "Tracking updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const cardOrders = data?.cardOrders ?? [];

  const statusVariant = (status: string) => {
    switch (status) {
      case "shipped": case "delivered": return "default" as const;
      case "processing": case "paid": return "secondary" as const;
      case "canceled": case "refunded": return "destructive" as const;
      default: return "outline" as const;
    }
  };

  const statuses = ["pending_payment", "paid", "processing", "shipped", "delivered", "canceled", "refunded"];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold" data-testid="text-admin-card-orders-title">Card Orders</h1>
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
                  <TableHead>ID</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Shipping</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tracking</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cardOrders.map((order) => (
                  <TableRow key={order.id} data-testid={`row-card-order-${order.id}`}>
                    <TableCell>{order.id}</TableCell>
                    <TableCell>{order.userId}</TableCell>
                    <TableCell>{order.quantity}</TableCell>
                    <TableCell>${parseFloat(order.totalAmount).toFixed(2)}</TableCell>
                    <TableCell>{order.shippingMethod}</TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(status) => statusMutation.mutate({ id: order.id, status })}
                      >
                        <SelectTrigger className="w-36" data-testid={`select-card-status-${order.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statuses.map((s) => (
                            <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell data-testid={`text-tracking-${order.id}`}>
                      {order.trackingNumber ? `${order.carrier}: ${order.trackingNumber}` : "--"}
                    </TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setTrackingDialog(order);
                          setTrackingNumber(order.trackingNumber || "");
                          setCarrier(order.carrier || "");
                        }}
                        data-testid={`button-tracking-${order.id}`}
                      >
                        <Truck />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {cardOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      No card orders found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={!!trackingDialog} onOpenChange={(open) => !open && setTrackingDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Tracking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tracking Number</Label>
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                data-testid="input-tracking-number"
              />
            </div>
            <div className="space-y-2">
              <Label>Carrier</Label>
              <Input
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                placeholder="USPS, UPS, FedEx..."
                data-testid="input-carrier"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrackingDialog(null)} data-testid="button-cancel-tracking">
              Cancel
            </Button>
            <Button
              onClick={() =>
                trackingDialog &&
                trackingMutation.mutate({
                  id: trackingDialog.id,
                  trackingNumber,
                  carrier,
                })
              }
              disabled={trackingMutation.isPending}
              data-testid="button-save-tracking"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
