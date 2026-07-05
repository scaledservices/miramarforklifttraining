import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, ArrowLeft, AlertCircle, Loader2, CreditCard, Lock, Phone, Mail } from "lucide-react";
import CheckoutInlineAuth from "@/components/checkout/CheckoutInlineAuth";
import { useTranslation } from "react-i18next";
import { brand } from "@shared/config/brand";
import { trackCheckoutContact } from "@/lib/analytics";

interface PaymentConfig {
  configured: boolean;
  provider: string;
  clientKey?: string;
  apiLoginID?: string;
  environment?: string;
  demoMode?: boolean;
}

// Authorize.net Accept.js (v1) integration — uses Accept.dispatchData to send
// card data directly to Authorize.net and receive an opaque payment nonce.
// Card data never touches our server (SAQ-A-EP scope).
declare global {
  interface Window {
    Accept?: {
      dispatchData: (secureData: AcceptSecureData, responseHandler: (response: AcceptDispatchResponse) => void) => void;
    };
  }
}

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

interface AcceptSecureData {
  cardData: {
    cardNumber: string;
    month: string;
    year: string;
    cardCode: string;
    zip?: string;
  };
  authData: {
    apiLoginID: string;
    clientKey: string;
  };
}

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const { user, isAuthenticated, isLoading: authLoading, refetchUser } = useAuth();
  const [, navigate] = useLocation();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();

  const [refundAccepted, setRefundAccepted] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardForm, setCardForm] = useState({
    cardNumber: "",
    month: "",
    year: "",
    cardCode: "",
    zip: "",
  });

  // Load Accept.js script (v1 — provides Accept.dispatchData)
  const [acceptLoaded, setAcceptLoaded] = useState(false);
  useEffect(() => {
    const existing = document.querySelector('script[src*="Accept.js"]');
    if (existing) {
      setAcceptLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://js.authorize.net/v1/Accept.js";
    script.async = true;
    script.charset = "utf-8";
    script.onload = () => setAcceptLoaded(true);
    document.head.appendChild(script);
  }, []);

  const { data: paymentConfig } = useQuery<PaymentConfig>({
    queryKey: ["/api/payment/config"],
  });

  const isConfigured = paymentConfig?.configured ?? false;
  const isDemoMode = paymentConfig?.demoMode ?? false;

  // Calculate 3% card surcharge
  const surcharge = isConfigured ? Number((totalPrice * 0.03).toFixed(2)) : 0;
  const totalWithSurcharge = Number((totalPrice + surcharge).toFixed(2));

  useEffect(() => {
    if (items.length > 0) trackCheckoutContact();
  }, [items.length]);

  const chargeMutation = useMutation({
    mutationFn: async (data: { paymentNonce?: string; isCardPayment: boolean }) => {
      const payload: Record<string, unknown> = {
        items: items.map((i) => ({ courseSlug: i.courseSlug, quantity: i.quantity })),
        refundPolicyAccepted: refundAccepted,
        isTeamPurchase: items.some((i) => i.isTeamProduct),
        locale: i18n.language?.startsWith("es") ? "es" : "en",
        isCardPayment: data.isCardPayment,
      };
      if (data.paymentNonce) {
        payload.paymentNonce = data.paymentNonce;
      }
      const res = await apiRequest("POST", "/api/authorize-net/charge", payload);
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.success) {
        clearCart();
        const hasTeamProduct = items.some((i) => i.isTeamProduct);
        if (hasTeamProduct) refetchUser();
        navigate(`/order-confirmation/${data.orderId}`);
      } else {
        setPaymentError(data.error || t("checkout.paymentFailed"));
        setIsProcessing(false);
      }
    },
    onError: (error: any) => {
      setPaymentError(error.message || t("checkout.paymentFailed"));
      setIsProcessing(false);
    },
  });

  function handleCardPayment() {
    if (!refundAccepted) {
      toast({
        title: t("checkout.refundPolicyRequired", { defaultValue: "Please accept the refund policy" }),
        variant: "destructive",
      });
      return;
    }

    if (!paymentConfig?.clientKey || !paymentConfig?.apiLoginID || !acceptLoaded || !window.Accept) {
      setPaymentError("Payment system is loading. Please try again in a moment.");
      return;
    }

    // Basic validation
    const cardNumber = cardForm.cardNumber.replace(/\s/g, "");
    if (!cardNumber || cardNumber.length < 13) {
      setPaymentError("Please enter a valid card number.");
      return;
    }
    if (!cardForm.month || !cardForm.year) {
      setPaymentError("Please enter the card expiration date.");
      return;
    }
    if (!cardForm.cardCode || cardForm.cardCode.length < 3) {
      setPaymentError("Please enter the card CVV code.");
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    const secureData: AcceptSecureData = {
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

    try {
      window.Accept.dispatchData(secureData, (response: AcceptDispatchResponse) => {
        if (response.messages.resultCode === "Ok") {
          const nonce = response.opaqueData.dataValue;
          chargeMutation.mutate({
            paymentNonce: nonce,
            isCardPayment: true,
          });
        } else {
          const errMsg = response.messages.message?.[0]?.text || "Payment authorization failed.";
          setPaymentError(errMsg);
          setIsProcessing(false);
        }
      });
    } catch (err: any) {
      setPaymentError(err.message || "Payment initialization failed");
      setIsProcessing(false);
    }
  }

  function handleDemoPayment() {
    if (!refundAccepted) {
      toast({
        title: t("checkout.refundPolicyRequired", { defaultValue: "Please accept the refund policy" }),
        variant: "destructive",
      });
      return;
    }
    setIsProcessing(true);
    setPaymentError(null);
    chargeMutation.mutate({ isCardPayment: true });
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-6" />
        <h1 className="text-2xl font-bold mb-2">{t("checkout.emptyCartTitle")}</h1>
        <p className="text-muted-foreground mb-8">{t("checkout.emptyCartDesc")}</p>
        <Link href="/training-programs">
          <Button data-testid="button-browse-checkout">{t("checkout.browsePrograms")}</Button>
        </Link>
      </div>
    );
  }

  const needsAuth = !authLoading && !isAuthenticated;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/cart" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-6">
        <ArrowLeft className="w-3.5 h-3.5" />
        {t("checkout.backToCart")}
      </Link>
      <h1 className="text-3xl font-bold mb-8" data-testid="text-checkout-title">{t("checkout.title")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {needsAuth && <CheckoutInlineAuth />}

          {paymentError && (
            <Card className="border-destructive/40 bg-destructive/10">
              <CardContent className="p-4 flex items-center gap-2 text-destructive">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="text-sm">{paymentError}</span>
              </CardContent>
            </Card>
          )}

          {!needsAuth && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-5 h-5 text-accent" />
                  <h2 className="font-bold text-lg">{t("checkout.paymentInfo", { defaultValue: "Payment" })}</h2>
                </div>

                {isConfigured ? (
                  <div className="space-y-4">
                    <div className="bg-primary/10 border border-primary/40 rounded-lg p-4 text-sm">
                      <p className="font-medium text-foreground mb-1">
                        {t("checkout.securePayment", { defaultValue: "Secure Card Payment" })}
                      </p>
                      <p className="text-muted-foreground">
                        {t("checkout.securePaymentDesc", { defaultValue: "Your card information is processed securely through Authorize.net. We never see or store your card details." })}
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">{t("checkout.cardNumber", { defaultValue: "Card Number" })}</Label>
                        <Input
                          id="cardNumber"
                          type="text"
                          inputMode="numeric"
                          autoComplete="cc-number"
                          placeholder="1234 5678 9012 3456"
                          value={cardForm.cardNumber}
                          onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value })}
                          disabled={isProcessing}
                          data-testid="input-card-number"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="cardMonth">{t("checkout.cardMonth", { defaultValue: "MM" })}</Label>
                          <Input
                            id="cardMonth"
                            type="text"
                            inputMode="numeric"
                            autoComplete="cc-exp-month"
                            placeholder="MM"
                            maxLength={2}
                            value={cardForm.month}
                            onChange={(e) => setCardForm({ ...cardForm, month: e.target.value })}
                            disabled={isProcessing}
                            data-testid="input-card-month"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cardYear">{t("checkout.cardYear", { defaultValue: "YY" })}</Label>
                          <Input
                            id="cardYear"
                            type="text"
                            inputMode="numeric"
                            autoComplete="cc-exp-year"
                            placeholder="YY"
                            maxLength={2}
                            value={cardForm.year}
                            onChange={(e) => setCardForm({ ...cardForm, year: e.target.value })}
                            disabled={isProcessing}
                            data-testid="input-card-year"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cardCode">{t("checkout.cardCode", { defaultValue: "CVV" })}</Label>
                          <Input
                            id="cardCode"
                            type="text"
                            inputMode="numeric"
                            autoComplete="cc-csc"
                            placeholder="123"
                            maxLength={4}
                            value={cardForm.cardCode}
                            onChange={(e) => setCardForm({ ...cardForm, cardCode: e.target.value })}
                            disabled={isProcessing}
                            data-testid="input-card-code"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cardZip">{t("checkout.cardZip", { defaultValue: "Billing ZIP" })}</Label>
                        <Input
                          id="cardZip"
                          type="text"
                          inputMode="numeric"
                          autoComplete="postal-code"
                          placeholder="12345"
                          maxLength={10}
                          value={cardForm.zip}
                          onChange={(e) => setCardForm({ ...cardForm, zip: e.target.value })}
                          disabled={isProcessing}
                          data-testid="input-card-zip"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("checkout.cardFeeNote", { defaultValue: "Includes 3% card processing fee" })}</span>
                      <span className="font-medium text-muted-foreground">+${surcharge.toFixed(2)}</span>
                    </div>
                    <Button
                      size="lg"
                      className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                      disabled={!refundAccepted || isProcessing || !acceptLoaded}
                      onClick={handleCardPayment}
                      data-testid="button-pay-card"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          {t("checkout.processing")}
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          {t("checkout.payAmount", { amount: totalWithSurcharge.toFixed(2), defaultValue: `Pay $${totalWithSurcharge.toFixed(2)}` })}
                        </>
                      )}
                    </Button>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                        <Lock className="w-3 h-3 text-brand-green" />
                        <span>{t("checkoutTrust.secure")}</span>
                      </div>
                      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                        <CreditCard className="w-3 h-3 text-brand-green" />
                        <span>{t("checkoutTrust.sameDay")}</span>
                      </div>
                    </div>
                  </div>
                ) : isDemoMode ? (
                  <div className="space-y-4">
                    <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-sm">
                      <p className="font-medium text-yellow-800 dark:text-yellow-400">{t("checkout.demoMode", { defaultValue: "Demo Mode" })}</p>
                      <p className="text-yellow-700 dark:text-yellow-500 mt-1">
                        {t("checkout.demoModeDesc", { defaultValue: "Payment is in demo mode. No real charges will be made." })}
                      </p>
                    </div>
                    <Button
                      size="lg"
                      className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                      disabled={!refundAccepted || isProcessing}
                      onClick={handleDemoPayment}
                      data-testid="button-place-order"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          {t("checkout.processing")}
                        </>
                      ) : (
                        t("checkout.payAmountDemo", { amount: totalPrice.toFixed(2), defaultValue: `Pay $${totalPrice.toFixed(2)} (Demo)` })
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 text-center py-4">
                    <div className="bg-primary/10 border border-primary/40 rounded-lg p-4">
                      <p className="font-medium text-foreground mb-1">
                        {t("checkout.contactToEnrollTitle", { defaultValue: "Enroll by Phone or Email" })}
                      </p>
                      <p className="text-sm text-muted-foreground mb-3">
                        {t("checkout.contactToEnrollDesc", { defaultValue: "Online checkout is being upgraded. Call us or send an email with the courses you need." })}
                      </p>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <a href={`tel:${brand.support.phoneTel}`}>
                          <Button size="sm" className="bg-accent text-accent-foreground border-accent-border">
                            <Phone className="w-4 h-4 mr-2" />
                            {brand.support.phone}
                          </Button>
                        </a>
                        <a href={`mailto:${brand.support.infoEmail}`}>
                          <Button size="sm" variant="outline">
                            <Mail className="w-4 h-4 mr-2" />
                            {brand.support.infoEmail}
                          </Button>
                        </a>
                      </div>
                    </div>
                    <Link href="/request-quote">
                      <Button variant="outline" size="sm" data-testid="button-checkout-request-quote">
                        {t("checkout.requestQuoteInstead", { defaultValue: "Or request a training quote" })}
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-6">
              <h2 className="font-bold text-lg mb-4">{t("checkout.refundPolicyTitle")}</h2>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="refundPolicy"
                  checked={refundAccepted}
                  onCheckedChange={(checked) => setRefundAccepted(checked === true)}
                  data-testid="checkbox-refund-policy"
                />
                <Label htmlFor="refundPolicy" className="text-sm leading-relaxed cursor-pointer">
                  {t("checkout.refundCheckbox")}
                </Label>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardContent className="p-6">
              <h2 className="font-bold text-lg mb-4">{t("checkout.orderSummary")}</h2>
              <div className="space-y-2 text-sm">
                {items.map((item) => (
                  <div key={item.courseSlug} className="flex justify-between gap-2">
                    <span className="text-muted-foreground">{item.title} x{item.quantity} {item.quantity === 1 ? t("checkout.seatSingular") : t("checkout.seatPlural")}</span>
                    <span className="font-medium shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">{t("checkout.subtotal", { defaultValue: "Subtotal" })}</span>
                  <span className="font-medium">${totalPrice.toFixed(2)}</span>
                </div>
                {isConfigured && surcharge > 0 && (
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">{t("checkout.cardFee", { defaultValue: "Card processing fee (3%)" })}</span>
                    <span className="font-medium text-muted-foreground">${surcharge.toFixed(2)}</span>
                  </div>
                )}
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between gap-2 font-bold text-lg">
                <span>{t("checkout.total")}</span>
                <span data-testid="text-checkout-total">${(isConfigured ? totalWithSurcharge : totalPrice).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
