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
  // Peter 2026-09-07: enriched server-side for the fulfillment queue.
  memberName: string;
  memberEmail: string;
  certificateNumber: string;
  courseTitle: string;
  idPhoto: string | null;
  shippingAddress: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  } | null;
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
                  <TableHead>Photo</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Certificate</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Ship To</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tracking</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cardOrders.map((order) => (
                  <TableRow key={order.id} data-testid={`row-card-order-${order.id}`}>
                    <TableCell>
                      {order.idPhoto ? (
                        <img
                          src={order.idPhoto}
                          alt={order.memberName}
                          className="h-10 w-10 rounded object-cover border"
                          data-testid={`img-photo-${order.id}`}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">
                          No photo
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{order.memberName}</div>
                      <div className="text-xs text-muted-foreground">{order.memberEmail}</div>
                    </TableCell>
                    <TableCell className="text-sm">#{order.certificateNumber}</TableCell>
                    <TableCell className="text-sm">{order.courseTitle}</TableCell>
                    <TableCell className="text-xs">
                      {order.shippingAddress ? (
                        <div>
                          {order.shippingAddress.address && <div>{order.shippingAddress.address}</div>}
                          <div>
                            {[order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.zip].filter(Boolean).join(", ")}
                          </div>
                        </div>
                      ) : "--"}
                    </TableCell>
                    <TableCell>${parseFloat(order.totalAmount).toFixed(2)}</TableCell>
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
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
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
