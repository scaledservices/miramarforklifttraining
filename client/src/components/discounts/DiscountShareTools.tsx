import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, Download } from "lucide-react";

/**
 * Share tools for a discount code: the booking link with the code embedded,
 * a copy button, and a printable/showable QR code rendered client-side with
 * the `qrcode` package.
 */
export default function DiscountShareTools({ code }: { code: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const shareUrl = `${window.location.origin}/book-training?code=${encodeURIComponent(code)}`;

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(shareUrl, { width: 480, margin: 2, errorCorrectionLevel: "M" })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [shareUrl]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({ title: "Link copied" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Could not copy link", description: shareUrl, variant: "destructive" });
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium">Booking link with code</p>
        <div className="flex gap-2">
          <Input
            readOnly
            value={shareUrl}
            className="font-mono text-xs"
            onFocus={(e) => e.currentTarget.select()}
            data-testid={`input-share-link-${code}`}
          />
          <Button variant="outline" size="icon" className="shrink-0" onClick={handleCopy} data-testid={`button-copy-link-${code}`}>
            {copied ? <Check className="h-4 w-4 text-brand-green" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Customers who open this link get the code applied automatically. The same code also works typed in at checkout.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">QR code (print on flyers or show on your phone)</p>
        {qrDataUrl ? (
          <div className="flex flex-col items-center gap-3">
            <img
              src={qrDataUrl}
              alt={`QR code for discount ${code}`}
              className="w-48 h-48 border rounded-md bg-white p-2"
              data-testid={`img-qr-${code}`}
            />
            <Button asChild variant="outline" size="sm">
              <a href={qrDataUrl} download={`discount-${code}-qr.png`} data-testid={`link-download-qr-${code}`}>
                <Download className="h-4 w-4 mr-2" />
                Download QR image
              </a>
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Generating QR code...</p>
        )}
      </div>
    </div>
  );
}
