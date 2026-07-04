import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  CreditCard,
  Truck,
  Zap,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  AlertTriangle,
  Package,
  Loader2,
  Lock,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface PaymentConfig {
  configured: boolean;
  provider: string;
  clientKey?: string;
  apiLoginID?: string;
  environment?: string;
  demoMode?: boolean;
}

// Authorize.net Accept.js (v1) — dispatchData API
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

export default function OrderCertCard() {
  const { t } = useTranslation();
  const params = useParams<{ certificationId: string }>();
  const certId = parseInt(params.certificationId || "0");
  const { toast } = useToast();

  const STEPS = [
    t("orderCertCard.stepConfirm"),
    t("orderCertCard.stepShipping"),
    t("orderCertCard.stepMethod"),
    t("orderCertCard.stepPayment"),
    t("orderCertCard.stepDone"),
  ];

  const [step, setStep] = useState(0);
  const [shipping, setShipping] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
  });
  const [shippingMethod, setShippingMethod] = useState<"standard" | "expedited">("standard");
  const [isProcessing, setIsProcessing] = useState(false);
  const [acceptLoaded, setAcceptLoaded] = useState(false);
  const [cardForm, setCardForm] = useState({
    cardNumber: "",
    month: "",
    year: "",
    cardCode: "",
    zip: "",
  });

  // Load Accept.js
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

  const { data, isLoading, error } = useQuery<{ certification: any }>({
    queryKey: ["/api/certifications", certId],
    enabled: certId > 0,
  });

  const cert = data?.certification;

  const cardPrice = 9.99;
  const shippingCost = shippingMethod === "standard" ? 4.99 : 9.99;
  const subtotal = cardPrice + shippingCost;
  const surcharge = paymentConfig?.configured ? Number((subtotal * 0.03).toFixed(2)) : 0;
  const total = Number((subtotal + surcharge).toFixed(2));

  const orderMutation = useMutation({
    mutationFn: async (data: { paymentNonce?: string }) => {
      const payload: Record<string, unknown> = {
        certificationId: certId,
        shippingAddress: shipping,
        shippingMethod,
      };
      if (data.paymentNonce) {
        payload.paymentNonce = data.paymentNonce;
      }
      const res = await apiRequest("POST", "/api/cert-cards", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
      setStep(4);
      setIsProcessing(false);
    },
    onError: (err: Error) => {
      toast({ title: t("orderCertCard.orderFailed"), description: err.message, variant: "destructive" });
      setIsProcessing(false);
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6" data-testid="loading-order-card">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-4" data-testid="error-order-card">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
        <h1 className="text-2xl font-bold">{t("orderCertCard.certNotFound")}</h1>
        <p className="text-muted-foreground">{t("orderCertCard.certNotFoundDesc")}</p>
        <Link href="/dashboard">
          <Button data-testid="button-back-dashboard">{t("certification.backToDashboard")}</Button>
        </Link>
      </div>
    );
  }

  const canProceed = () => {
    if (step === 1) {
      return shipping.name && shipping.address && shipping.city && shipping.state && shipping.zip;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 3) {
      // Payment step — use Accept.js dispatchData if configured, demo mode otherwise
      if (paymentConfig?.configured && paymentConfig.clientKey && paymentConfig.apiLoginID && acceptLoaded && window.Accept) {
        // Basic validation
        const cardNumber = cardForm.cardNumber.replace(/\s/g, "");
        if (!cardNumber || cardNumber.length < 13) {
          toast({ title: "Please enter a valid card number.", variant: "destructive" });
          return;
        }
        if (!cardForm.month || !cardForm.year) {
          toast({ title: "Please enter the card expiration date.", variant: "destructive" });
          return;
        }
        if (!cardForm.cardCode || cardForm.cardCode.length < 3) {
          toast({ title: "Please enter the card CVV code.", variant: "destructive" });
          return;
        }

        setIsProcessing(true);
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

        window.Accept.dispatchData(secureData, (response: AcceptDispatchResponse) => {
          if (response.messages.resultCode === "Ok") {
            const nonce = response.opaqueData.dataValue;
            orderMutation.mutate({ paymentNonce: nonce });
          } else {
            const errMsg = response.messages.message?.[0]?.text || "Payment authorization failed.";
            toast({ title: errMsg, variant: "destructive" });
            setIsProcessing(false);
          }
        });
      } else if (paymentConfig?.demoMode) {
        setIsProcessing(true);
        orderMutation.mutate({});
      } else {
        toast({
          title: t("orderCertCard.paymentNotConfigured", { defaultValue: "Payment is not configured. Please call us to order." }),
          variant: "destructive",
        });
      }
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8" data-testid="page-order-cert-card">
      <div className="flex items-center gap-3 flex-wrap">
        <CreditCard className="h-7 w-7 text-accent" />
        <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-order-title">
          {t("orderCertCard.pageTitle")}
        </h1>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto" data-testid="stepper">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-1">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                i < step ? "bg-green-600 text-white" : i === step ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
              }`}
              data-testid={`step-indicator-${i}`}
            >
              {i < step ? <CheckCircle className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-xs whitespace-nowrap ${i === step ? "font-semibold" : "text-muted-foreground"}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="w-4 h-px bg-border shrink-0" />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <Card data-testid="step-confirm">
          <CardHeader>
            <CardTitle className="text-lg">{t("orderCertCard.confirmTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-md bg-accent/20 flex items-center justify-center shrink-0">
                <Award className="h-6 w-6 text-accent" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold" data-testid="text-cert-number">
                  {t("orderCertCard.certificateNum", { number: cert.certificateNumber })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("orderCertCard.issuedOn", { date: new Date(cert.issuedAt).toLocaleDateString() })}
                </p>
                {cert.expiresAt && (
                  <p className="text-sm text-muted-foreground">
                    {t("orderCertCard.expiresOn", { date: new Date(cert.expiresAt).toLocaleDateString() })}
                  </p>
                )}
                <Badge variant="secondary" data-testid="badge-cert-status">{String(t(`status.${cert.status}`, cert.status))}</Badge>
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">
                {t("orderCertCard.cardDescription")}
              </p>
              <p className="mt-2 font-semibold" data-testid="text-card-price">{t("orderCertCard.cardPrice")}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card data-testid="step-shipping">
          <CardHeader>
            <CardTitle className="text-lg">{t("orderCertCard.shippingAddressTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("orderCertCard.fullName")}</Label>
              <Input id="name" value={shipping.name} onChange={(e) => setShipping({ ...shipping, name: e.target.value })} data-testid="input-shipping-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">{t("orderCertCard.address")}</Label>
              <Input id="address" value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} data-testid="input-shipping-address" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">{t("orderCertCard.city")}</Label>
                <Input id="city" value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} data-testid="input-shipping-city" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">{t("orderCertCard.state")}</Label>
                <Input id="state" value={shipping.state} onChange={(e) => setShipping({ ...shipping, state: e.target.value })} data-testid="input-shipping-state" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zip">{t("orderCertCard.zipCode")}</Label>
                <Input id="zip" value={shipping.zip} onChange={(e) => setShipping({ ...shipping, zip: e.target.value })} data-testid="input-shipping-zip" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">{t("orderCertCard.country")}</Label>
                <Input id="country" value={shipping.country} onChange={(e) => setShipping({ ...shipping, country: e.target.value })} data-testid="input-shipping-country" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card data-testid="step-shipping-method">
          <CardHeader>
            <CardTitle className="text-lg">{t("orderCertCard.shippingMethodTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              type="button"
              className={`w-full text-left p-4 rounded-md border transition-colors ${
                shippingMethod === "standard" ? "border-accent bg-accent/10" : "border-border"
              }`}
              onClick={() => setShippingMethod("standard")}
              data-testid="button-shipping-standard"
            >
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-semibold">{t("orderCertCard.standardShipping")}</p>
                  <p className="text-sm text-muted-foreground">{t("orderCertCard.standardDays")}</p>
                </div>
                <p className="font-semibold">$4.99</p>
              </div>
            </button>
            <button
              type="button"
              className={`w-full text-left p-4 rounded-md border transition-colors ${
                shippingMethod === "expedited" ? "border-accent bg-accent/10" : "border-border"
              }`}
              onClick={() => setShippingMethod("expedited")}
              data-testid="button-shipping-expedited"
            >
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-semibold">{t("orderCertCard.expeditedShipping")}</p>
                  <p className="text-sm text-muted-foreground">{t("orderCertCard.expeditedDays")}</p>
                </div>
                <p className="font-semibold">$9.99</p>
              </div>
            </button>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card data-testid="step-payment">
          <CardHeader>
            <CardTitle className="text-lg">{t("orderCertCard.paymentTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentConfig?.configured ? (
              <>
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
                  <p className="font-medium text-blue-800 dark:text-blue-400 mb-1">
                    {t("orderCertCard.securePayment", { defaultValue: "Secure Card Payment" })}
                  </p>
                  <p className="text-blue-700 dark:text-blue-500">
                    {t("orderCertCard.securePaymentDesc", { defaultValue: "Your card is processed securely through Authorize.net. We never see or store your card details." })}
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">{t("orderCertCard.cardNumber", { defaultValue: "Card Number" })}</Label>
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
                      <Label htmlFor="cardMonth">{t("orderCertCard.cardMonth", { defaultValue: "MM" })}</Label>
                      <Input
                        id="cardMonth"
                        type="text"
                        inputMode="numeric"
                        placeholder="MM"
                        maxLength={2}
                        value={cardForm.month}
                        onChange={(e) => setCardForm({ ...cardForm, month: e.target.value })}
                        disabled={isProcessing}
                        data-testid="input-card-month"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cardYear">{t("orderCertCard.cardYear", { defaultValue: "YY" })}</Label>
                      <Input
                        id="cardYear"
                        type="text"
                        inputMode="numeric"
                        placeholder="YY"
                        maxLength={2}
                        value={cardForm.year}
                        onChange={(e) => setCardForm({ ...cardForm, year: e.target.value })}
                        disabled={isProcessing}
                        data-testid="input-card-year"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cardCode">{t("orderCertCard.cardCode", { defaultValue: "CVV" })}</Label>
                      <Input
                        id="cardCode"
                        type="text"
                        inputMode="numeric"
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
                    <Label htmlFor="cardZip">{t("orderCertCard.cardZip", { defaultValue: "Billing ZIP" })}</Label>
                    <Input
                      id="cardZip"
                      type="text"
                      inputMode="numeric"
                      placeholder="12345"
                      maxLength={10}
                      value={cardForm.zip}
                      onChange={(e) => setCardForm({ ...cardForm, zip: e.target.value })}
                      disabled={isProcessing}
                      data-testid="input-card-zip"
                    />
                  </div>
                </div>
              </>
            ) : paymentConfig?.demoMode ? (
              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-sm">
                <p className="font-medium text-yellow-800 dark:text-yellow-400">
                  {t("orderCertCard.demoMode", { defaultValue: "Demo Mode - No real charges" })}
                </p>
              </div>
            ) : (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
                <p className="text-muted-foreground">
                  {t("orderCertCard.contactToOrder", { defaultValue: "Please call us to complete your card order." })}
                </p>
              </div>
            )}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between gap-2 text-sm">
                <span>{t("orderCertCard.walletCard")}</span>
                <span>$9.99</span>
              </div>
              <div className="flex justify-between gap-2 text-sm">
                <span>{t("orderCertCard.shipping")} ({shippingMethod === "standard" ? t("orderCertCard.standardShipping").toLowerCase() : t("orderCertCard.expeditedShipping").toLowerCase()})</span>
                <span>${shippingCost.toFixed(2)}</span>
              </div>
              {paymentConfig?.configured && surcharge > 0 && (
                <div className="flex justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">{t("orderCertCard.cardFee", { defaultValue: "Card processing fee (3%)" })}</span>
                  <span className="text-orange-600">${surcharge.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between gap-2 font-semibold border-t pt-2">
                <span>{t("orderCertCard.total")}</span>
                <span data-testid="text-total">${total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card data-testid="step-confirmation">
          <CardContent className="py-12 text-center space-y-6">
            <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <Package className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold" data-testid="text-order-confirmed">{t("orderCertCard.orderConfirmed")}</h2>
              <p className="text-muted-foreground">
                {t("orderCertCard.orderConfirmedDesc")}
              </p>
              <p className="font-medium" data-testid="text-shipping-address">
                {shipping.name}, {shipping.address}, {shipping.city}, {shipping.state} {shipping.zip}
              </p>
            </div>
            <div className="flex justify-center gap-3 flex-wrap">
              <Link href={`/certifications/${certId}`}>
                <Button variant="outline" data-testid="button-view-cert">{t("orderCertCard.viewCertification")}</Button>
              </Link>
              <Link href="/dashboard">
                <Button data-testid="button-back-dashboard">{t("certification.backToDashboard")}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {step < 4 && (
        <div className="flex justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            data-testid="button-prev-step"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("orderCertCard.back")}
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed() || isProcessing || (step === 3 && !paymentConfig?.configured && !paymentConfig?.demoMode)}
            data-testid="button-next-step"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {t("orderCertCard.processing")}
              </>
            ) : step === 3 ? (
              <>
                <Lock className="h-4 w-4 mr-2" />
                {t("orderCertCard.placeOrder", { defaultValue: `Pay $${total.toFixed(2)}` })}
              </>
            ) : (
              <>
                {t("orderCertCard.continue")}
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
