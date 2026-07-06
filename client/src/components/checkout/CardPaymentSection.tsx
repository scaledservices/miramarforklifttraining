import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "wouter";
import { Loader2, Lock, CreditCard } from "lucide-react";

// Same Accept.js (v1) integration as Checkout.tsx — card data goes directly to
// Authorize.net via Accept.dispatchData; only the opaque nonce reaches our server.

interface AcceptDispatchResponse {
  messages: {
    resultCode: string;
    message: { code: string; text: string }[];
  };
  opaqueData: {
    dataDescriptor: string;
    dataValue: string;
  };
}

interface PaymentConfig {
  configured: boolean;
  demoMode: boolean;
  apiLoginID?: string;
  clientKey?: string;
  environment?: string;
}

interface CardPaymentSectionProps {
  /** Amount to charge now (deposit incl. surcharge), for the button label. */
  chargeAmount: number;
  pending: boolean;
  /** Called with the payment nonce once tokenization succeeds, or null when
   * payments are not configured (demo/staging fallback). */
  onPay: (nonce: string | null) => void;
  ctaLabel: string;
  fallbackCtaLabel: string;
}

export default function CardPaymentSection({ chargeAmount, pending, onPay, ctaLabel, fallbackCtaLabel }: CardPaymentSectionProps) {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [tokenizing, setTokenizing] = useState(false);
  const [cardForm, setCardForm] = useState({ cardNumber: "", month: "", year: "", cardCode: "", zip: "" });

  const { data: paymentConfig } = useQuery<PaymentConfig>({
    queryKey: ["/api/payment/config"],
  });
  const isConfigured = paymentConfig?.configured ?? false;

  // Sandbox credentials only work with the sandbox Accept.js host — load the
  // script once the environment is known.
  const [acceptLoaded, setAcceptLoaded] = useState(false);
  useEffect(() => {
    if (!paymentConfig?.configured) return;
    const host = paymentConfig.environment === "sandbox" ? "https://jstest.authorize.net" : "https://js.authorize.net";
    const src = `${host}/v1/Accept.js`;
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      setAcceptLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.charset = "utf-8";
    script.onload = () => setAcceptLoaded(true);
    document.head.appendChild(script);
  }, [paymentConfig?.configured, paymentConfig?.environment]);

  function handlePay() {
    setError(null);
    if (!policyAccepted) {
      setError(t("booking.policyRequired", { defaultValue: "Please accept the cancellation policy to continue." }));
      return;
    }

    if (!isConfigured) {
      onPay(null);
      return;
    }

    if (!paymentConfig?.clientKey || !paymentConfig?.apiLoginID) {
      setError(t("booking.paymentLoading", { defaultValue: "Payment system is loading. Please try again in a moment." }));
      return;
    }

    const cardNumber = cardForm.cardNumber.replace(/\s/g, "");
    if (!cardNumber || cardNumber.length < 13) {
      setError(t("checkout.invalidCard", { defaultValue: "Please enter a valid card number." }));
      return;
    }
    if (!cardForm.month || !cardForm.year) {
      setError(t("checkout.invalidExpiry", { defaultValue: "Please enter the card expiration date." }));
      return;
    }
    if (!cardForm.cardCode || cardForm.cardCode.length < 3) {
      setError(t("checkout.invalidCvv", { defaultValue: "Please enter the card CVV code." }));
      return;
    }

    setTokenizing(true);

    // Accept.js loads asynchronously after the config query resolves — wait for
    // it (up to ~6s) instead of bouncing the user with a "loading" error.
    const waitForAccept = async (): Promise<boolean> => {
      for (let i = 0; i < 12; i++) {
        if (window.Accept) return true;
        await new Promise((r) => setTimeout(r, 500));
      }
      return false;
    };

    const secureData = {
      cardData: {
        cardNumber,
        month: cardForm.month,
        year: cardForm.year.length === 2 ? `20${cardForm.year}` : cardForm.year,
        cardCode: cardForm.cardCode,
        zip: cardForm.zip || undefined,
      },
      authData: {
        apiLoginID: paymentConfig.apiLoginID,
        clientKey: paymentConfig.clientKey,
      },
    };

    // Accept.js occasionally reports "not loaded correctly" (E_WC_14) when its
    // internal frame isn't ready yet — retry once after a short delay.
    const attempt = (retriesLeft: number) => {
      try {
        window.Accept!.dispatchData(secureData, (response: AcceptDispatchResponse) => {
          if (response.messages.resultCode === "Ok") {
            setTokenizing(false);
            onPay(response.opaqueData.dataValue);
            return;
          }
          const msg = response.messages.message?.[0]?.text || "";
          if (retriesLeft > 0 && /not loaded/i.test(msg)) {
            setTimeout(() => attempt(retriesLeft - 1), 1500);
            return;
          }
          setTokenizing(false);
          setError(msg || t("checkout.paymentFailed", { defaultValue: "Payment authorization failed." }));
        });
      } catch (err: any) {
        setTokenizing(false);
        setError(err.message || t("checkout.paymentFailed", { defaultValue: "Payment initialization failed" }));
      }
    };
    waitForAccept().then((ready) => {
      if (!ready) {
        setTokenizing(false);
        setError(t("booking.paymentLoading", { defaultValue: "Payment system is loading. Please try again in a moment." }));
        return;
      }
      attempt(2);
    });
  }

  const busy = pending || tokenizing;

  return (
    <div className="space-y-4" data-testid="card-payment-section">
      {isConfigured && (
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-brand-dark" />
            {t("booking.paymentTitle", { defaultValue: "Payment" })}
          </h3>
          <div>
            <Label htmlFor="bk-cardNumber">{t("checkout.cardNumber", { defaultValue: "Card Number" })}</Label>
            <Input
              id="bk-cardNumber"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="1234 5678 9012 3456"
              value={cardForm.cardNumber}
              onChange={(e) => setCardForm((f) => ({ ...f, cardNumber: e.target.value }))}
              data-testid="input-booking-card-number"
            />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <Label htmlFor="bk-cardMonth">{t("checkout.cardMonth", { defaultValue: "MM" })}</Label>
              <Input id="bk-cardMonth" inputMode="numeric" autoComplete="cc-exp-month" placeholder="MM" maxLength={2}
                value={cardForm.month} onChange={(e) => setCardForm((f) => ({ ...f, month: e.target.value }))} data-testid="input-booking-card-month" />
            </div>
            <div>
              <Label htmlFor="bk-cardYear">{t("checkout.cardYear", { defaultValue: "YY" })}</Label>
              <Input id="bk-cardYear" inputMode="numeric" autoComplete="cc-exp-year" placeholder="YY" maxLength={2}
                value={cardForm.year} onChange={(e) => setCardForm((f) => ({ ...f, year: e.target.value }))} data-testid="input-booking-card-year" />
            </div>
            <div>
              <Label htmlFor="bk-cardCode">{t("checkout.cardCode", { defaultValue: "CVV" })}</Label>
              <Input id="bk-cardCode" inputMode="numeric" autoComplete="cc-csc" placeholder="123" maxLength={4}
                value={cardForm.cardCode} onChange={(e) => setCardForm((f) => ({ ...f, cardCode: e.target.value }))} data-testid="input-booking-card-cvv" />
            </div>
            <div>
              <Label htmlFor="bk-cardZip">{t("checkout.cardZip", { defaultValue: "ZIP" })}</Label>
              <Input id="bk-cardZip" inputMode="numeric" autoComplete="postal-code" placeholder="92121" maxLength={10}
                value={cardForm.zip} onChange={(e) => setCardForm((f) => ({ ...f, zip: e.target.value }))} data-testid="input-booking-card-zip" />
            </div>
          </div>
        </div>
      )}

      <label className="flex items-start gap-2 text-sm cursor-pointer" data-testid="label-policy-accept">
        <Checkbox checked={policyAccepted} onCheckedChange={(v) => setPolicyAccepted(v === true)} className="mt-0.5" data-testid="checkbox-policy-accept" />
        <span className="text-muted-foreground">
          {t("booking.policyAccept", { defaultValue: "I accept the" })}{" "}
          <Link href="/refund-policy" className="text-brand-orange underline underline-offset-2">
            {t("booking.policyLink", { defaultValue: "cancellation & refund policy" })}
          </Link>
          {" — "}{t("booking.freeReschedule", { defaultValue: "free reschedule up to 24 hours before your session." })}
        </span>
      </label>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-md px-4 py-3" data-testid="text-payment-error">
          {error}
        </div>
      )}

      <Button
        onClick={handlePay}
        disabled={busy}
        className="w-full bg-accent text-accent-foreground border-accent-border h-12 text-base"
        data-testid="button-pay-and-book"
      >
        {busy ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            {t("booking.processing", { defaultValue: "Processing..." })}
          </>
        ) : isConfigured ? (
          ctaLabel
        ) : (
          fallbackCtaLabel
        )}
      </Button>

      {isConfigured && (
        <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
          <Lock className="w-3 h-3 text-brand-green" />
          {t("checkoutTrust.secure")}
        </p>
      )}
    </div>
  );
}
