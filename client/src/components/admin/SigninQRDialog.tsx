import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check } from "lucide-react";

interface SigninQRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingNumber: string;
  sessionLabel: string;
}

/**
 * On-site digital sign-in QR (Alberto meeting 2026-07-28). The trainer holds
 * this up (or opens the link on an iPad at the door) so trainees self-register
 * on their own phones - replacing the paper sign-in sheet and capturing each
 * trainee's name into booking_attendees for the marketing database.
 *
 * URL shape: {origin}/signin/{bookingNumber} -> the public BookingSignIn page.
 */
export default function SigninQRDialog({ open, onOpenChange, bookingNumber, sessionLabel }: SigninQRDialogProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const signinUrl = `${window.location.origin}/signin/${bookingNumber}`;

  useEffect(() => {
    if (!open) {
      setCopied(false);
      return;
    }
    let cancelled = false;
    setQrDataUrl(null);
    QRCode.toDataURL(signinUrl, {
      width: 640,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#FFFFFF" },
    })
      .then((url) => { if (!cancelled) setQrDataUrl(url); })
      .catch(() => { if (!cancelled) setQrDataUrl(null); });
    return () => { cancelled = true; };
  }, [open, signinUrl]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(signinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast({ title: "Copy failed - long-press the link instead", variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Class sign-in QR</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{sessionLabel}</p>
        <div className="flex items-center justify-center rounded-lg border bg-white p-4">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={`Sign-in QR for ${bookingNumber}`} className="w-full max-w-[280px] h-auto" data-testid="img-signin-qr" />
          ) : (
            <Skeleton className="w-[280px] h-[280px]" />
          )}
        </div>
        <p className="text-xs text-muted-foreground break-all text-center">{signinUrl}</p>
        <Button variant="outline" onClick={copyLink} data-testid="button-copy-signin-link">
          {copied ? (<><Check className="w-4 h-4 mr-2" />Copied</>) : (<><Copy className="w-4 h-4 mr-2" />Copy sign-in link</>)}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
