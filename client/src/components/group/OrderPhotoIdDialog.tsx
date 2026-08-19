import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import CardPaymentSection from "@/components/checkout/CardPaymentSection";
import { Loader2 } from "lucide-react";

const PHOTO_ID_PRICE = 9.99;
const SHIPPING_RATES = { standard: 4.99, expedited: 9.99 } as const;

interface OrderPhotoIdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: number;
  memberId: number;
  memberName: string;
  certificationId: number;
}

/**
 * Crew admin pays for a member's photo ID (Flow 1). Collects the shipping
 * address + tier, charges the ADMIN's card via CardPaymentSection (Accept.js
 * nonce), then POSTs to /api/groups/:id/photo-id-orders. The member is emailed
 * a photo-upload link on success.
 */
export default function OrderPhotoIdDialog({
  open,
  onOpenChange,
  groupId,
  memberId,
  memberName,
  certificationId,
}: OrderPhotoIdDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const saved = (user as any)?.savedShippingAddress;
  const [shippingMethod, setShippingMethod] = useState<"standard" | "expedited">("standard");
  const [address, setAddress] = useState({
    name: saved?.name || (user as any)?.name || "",
    address: saved?.address || "",
    city: saved?.city || "",
    state: saved?.state || "",
    zip: saved?.zip || "",
  });

  const chargeAmount = Number(((PHOTO_ID_PRICE + SHIPPING_RATES[shippingMethod]) * 1.03).toFixed(2));

  const orderMutation = useMutation({
    mutationFn: async (paymentNonce: string | null) => {
      const res = await apiRequest("POST", `/api/groups/${groupId}/photo-id-orders`, {
        memberId,
        certificationId,
        shippingMethod,
        shippingAddress: address,
        paymentNonce: paymentNonce || undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("teamPhotoId.orderFailed", "Could not place the photo ID order."));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups", groupId, "photo-id-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups", groupId, "certifications"] });
      toast({
        title: t("teamPhotoId.orderPlaced", "Photo ID ordered"),
        description: t("teamPhotoId.orderPlacedDesc", "The member was emailed a link to add their photo."),
      });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    },
  });

  const addressValid =
    address.name.trim() && address.address.trim() && address.city.trim() && address.state.trim() && address.zip.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="dialog-order-photo-id">
        <DialogHeader>
          <DialogTitle>{t("teamPhotoId.orderDialogTitle", "Order a Photo ID")}</DialogTitle>
          <DialogDescription>
            {t("teamPhotoId.orderDialogDesc", "You are ordering a photo ID wallet card for {{name}}. They will be emailed a link to add their photo.", { name: memberName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div>
            <p className="text-sm font-medium mb-2">{t("checkout.shipping.whyTitle", { defaultValue: "Where should we mail the wallet card?" })}</p>
            <div className="space-y-2">
              <div>
                <Label htmlFor="pid-ship-name">{t("orderCertCard.name", { defaultValue: "Full name" })}</Label>
                <Input id="pid-ship-name" value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} data-testid="input-photo-id-ship-name" />
              </div>
              <div>
                <Label htmlFor="pid-ship-address">{t("orderCertCard.address", { defaultValue: "Street address" })}</Label>
                <Input id="pid-ship-address" value={address.address} onChange={(e) => setAddress({ ...address, address: e.target.value })} data-testid="input-photo-id-ship-address" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="pid-ship-city">{t("orderCertCard.city", { defaultValue: "City" })}</Label>
                  <Input id="pid-ship-city" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} data-testid="input-photo-id-ship-city" />
                </div>
                <div>
                  <Label htmlFor="pid-ship-state">{t("orderCertCard.state", { defaultValue: "State" })}</Label>
                  <Input id="pid-ship-state" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} data-testid="input-photo-id-ship-state" />
                </div>
                <div>
                  <Label htmlFor="pid-ship-zip">{t("orderCertCard.zip", { defaultValue: "ZIP" })}</Label>
                  <Input id="pid-ship-zip" value={address.zip} onChange={(e) => setAddress({ ...address, zip: e.target.value })} data-testid="input-photo-id-ship-zip" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">{t("orderCertCard.shippingMethod", { defaultValue: "Shipping speed" })}</p>
            <RadioGroup value={shippingMethod} onValueChange={(v: string) => setShippingMethod(v as "standard" | "expedited")} className="flex gap-4" data-testid="radio-photo-id-shipping">
              <label className="flex items-center gap-2 cursor-pointer">
                <RadioGroupItem value="standard" id="pid-ship-std" />
                <span className="text-sm">{t("orderCertCard.standardShipping", { defaultValue: "Standard" })} ${SHIPPING_RATES.standard.toFixed(2)}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <RadioGroupItem value="expedited" id="pid-ship-exp" />
                <span className="text-sm">{t("orderCertCard.expeditedShipping", { defaultValue: "Expedited" })} ${SHIPPING_RATES.expedited.toFixed(2)}</span>
              </label>
            </RadioGroup>
          </div>

          {!addressValid && (
            <p className="text-sm text-muted-foreground" data-testid="text-address-required">
              {t("teamPhotoId.addressRequired", "Enter the mailing address to continue to payment.")}
            </p>
          )}

          {addressValid && (
            <CardPaymentSection
              chargeAmount={chargeAmount}
              pending={orderMutation.isPending}
              onPay={(nonce) => orderMutation.mutate(nonce)}
              ctaLabel={t("teamPhotoId.payAndOrder", "Pay {{amount}} & Order", { amount: `$${chargeAmount.toFixed(2)}` })}
              fallbackCtaLabel={t("teamPhotoId.placeOrder", "Place Order")}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
