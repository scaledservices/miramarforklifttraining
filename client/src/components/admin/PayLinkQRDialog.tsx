import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check } from "lucide-react";

interface PayLinkQRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: number;
  customerName: string;
  amountDue: number;
}

/**
 * Shows a large, high-contrast QR code for the pay-balance link so the
 * operator can hold up their phone at a job site and let the customer
 * scan and pay on their own device.
 *
 * URL shape matches the balance-due email (see sendBalanceDueEmail in
 * server/email.ts): {siteUrl}/en/pay-balance/{bookingId} — no token,
 * the customer signs in on the PayBalance page.
 */
export default function PayLinkQRDialog({
  open,
  onOpenChange,
  bookingId,
  customerName,
  amountDue,
}: PayLinkQRDialogProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const payUrl = `${window.location.origin}/en/pay-balance/${bookingId}`;

  useEffect(() => {
    if (!open) {
      setCopied(false);
      return;
    }
    let cancelled = false;
    setQrDataUrl(null);
    QRCode.toDataURL(payUrl, {
      width: 640,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#FFFFFF" },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) toast({ title: "Could not generate QR code", variant: "destructive" });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, payUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(payUrl);
      setCopied(true);
      toast({ title: "Link copied" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Could not copy — select the link text instead", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="dialog-pay-link-qr">
        <DialogHeader>
          <DialogTitle>Scan to Pay Balance</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-center space-y-0.5">
            <div className="font-semibold text-lg" data-testid="text-qr-customer-name">
              {customerName}
            </div>
            <div className="text-2xl font-bold text-brand-orange" data-testid="text-qr-amount-due">
              ${amountDue.toFixed(2)} due
            </div>
          </div>

          {/* White box behind the QR at all times — must stay readable in dark mode and direct sunlight */}
          <div className="rounded-xl bg-white p-4 border">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR code for pay-balance link: ${payUrl}`}
                className="w-full h-auto"
                data-testid="img-pay-link-qr"
              />
            ) : (
              <Skeleton className="w-full aspect-square" />
            )}
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Have the customer scan this with their phone camera to pay online.
          </p>

          <div className="flex items-center gap-2">
            <code
              className="flex-1 rounded-md bg-muted px-3 py-2 text-xs break-all select-all"
              data-testid="text-pay-link-url"
            >
              {payUrl}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="shrink-0"
              data-testid="button-copy-pay-link"
            >
              {copied ? <Check className="h-4 w-4 mr-1 text-brand-green" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
