import { useState } from "react";
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
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

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
  const [payment, setPayment] = useState({ cardNumber: "", exp: "", cvv: "" });

  const { data, isLoading, error } = useQuery<{ certification: any }>({
    queryKey: ["/api/certifications", certId],
    enabled: certId > 0,
  });

  const cert = data?.certification;

  const orderMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/cert-cards", {
        certificationId: certId,
        shippingAddress: shipping,
        shippingMethod,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
      setStep(4);
    },
    onError: (err: Error) => {
      toast({ title: t("orderCertCard.orderFailed"), description: err.message, variant: "destructive" });
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

  const cardPrice = 9.99;
  const shippingCost = shippingMethod === "standard" ? 4.99 : 9.99;
  const total = cardPrice + shippingCost;

  const canProceed = () => {
    if (step === 1) {
      return shipping.name && shipping.address && shipping.city && shipping.state && shipping.zip;
    }
    if (step === 3) {
      return payment.cardNumber && payment.exp && payment.cvv;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 3) {
      orderMutation.mutate();
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
            <div className="space-y-2">
              <Label htmlFor="cardNumber">{t("orderCertCard.cardNumber")}</Label>
              <Input id="cardNumber" placeholder="4242 4242 4242 4242" value={payment.cardNumber} onChange={(e) => setPayment({ ...payment, cardNumber: e.target.value })} data-testid="input-card-number" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exp">{t("orderCertCard.expiration")}</Label>
                <Input id="exp" placeholder="MM/YY" value={payment.exp} onChange={(e) => setPayment({ ...payment, exp: e.target.value })} data-testid="input-card-exp" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv">{t("orderCertCard.cvv")}</Label>
                <Input id="cvv" placeholder="123" value={payment.cvv} onChange={(e) => setPayment({ ...payment, cvv: e.target.value })} data-testid="input-card-cvv" />
              </div>
            </div>
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between gap-2 text-sm">
                <span>{t("orderCertCard.walletCard")}</span>
                <span>$9.99</span>
              </div>
              <div className="flex justify-between gap-2 text-sm">
                <span>{t("orderCertCard.shipping")} ({shippingMethod === "standard" ? t("orderCertCard.standardShipping").toLowerCase() : t("orderCertCard.expeditedShipping").toLowerCase()})</span>
                <span>${shippingCost.toFixed(2)}</span>
              </div>
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
            disabled={!canProceed() || orderMutation.isPending}
            data-testid="button-next-step"
          >
            {step === 3 ? (orderMutation.isPending ? t("orderCertCard.processing") : t("orderCertCard.placeOrder")) : t("orderCertCard.continue")}
            {step < 3 && <ArrowRight className="h-4 w-4 ml-2" />}
          </Button>
        </div>
      )}
    </div>
  );
}
