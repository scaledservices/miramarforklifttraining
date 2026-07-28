import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useSearch } from "wouter";
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
  Image as ImageIcon,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCardNumber, digitsOnly } from "@/lib/inputFormat";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

/**
 * Read a user-selected photo and downscale it to a small JPEG data URL so
 * the order payload stays well under the server's JSON body limit.
 */
function processPhotoFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("invalid file type"));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const maxDim = 480;
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      let dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      // Guard the JSON body limit: retry at a lower quality if needed.
      if (dataUrl.length > 90_000) {
        dataUrl = canvas.toDataURL("image/jpeg", 0.6);
      }
      resolve(dataUrl);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("could not load image"));
    };
    img.src = url;
  });
}

interface PaymentConfig {
  configured: boolean;
  provider: string;
  clientKey?: string;
  apiLoginID?: string;
  environment?: string;
  demoMode?: boolean;
}

interface PhotoIdEntitlement {
  id: number;
  orderId: number;
  enrollmentId: number | null;
  purchasedByUserId: number;
  shippingMethod: "standard" | "expedited";
  shippingAddress: { name: string; address: string; city: string; state: string; zip: string; country?: string };
  amount: string;
  status: "awaiting_photo" | "fulfilled" | "refunded";
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

type Address = { name: string; address: string; city: string; state: string; zip: string; country: string };
const EMPTY_ADDRESS: Address = { name: "", address: "", city: "", state: "", zip: "", country: "US" };

export default function OrderCertCard() {
  const { t } = useTranslation();
  const params = useParams<{ certificationId: string }>();
  const certId = parseInt(params.certificationId || "0");
  const searchString = useSearch();
  const entitlementIdParam = parseInt(new URLSearchParams(searchString).get("entitlement") || "0");
  const { toast } = useToast();

  // Prepaid branch (spec 2.1): arriving with ?entitlement=N means the card
  // was paid at course checkout. No payment step; the photo consumes the
  // entitlement and creates the fulfillment row.
  const [prepaidEntitlement, setPrepaidEntitlement] = useState<PhotoIdEntitlement | null>(null);

  const STEPS = prepaidEntitlement
    ? [t("orderCertCard.stepPhoto"), t("orderCertCard.stepDone")]
    : [t("orderCertCard.stepPhoto"), t("orderCertCard.stepReview"), t("orderCertCard.stepDone")];

  const [step, setStep] = useState(0);
  const [shipping, setShipping] = useState<Address>(EMPTY_ADDRESS);
  const [shippingPrefilled, setShippingPrefilled] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<"standard" | "expedited">("standard");
  const [isProcessing, setIsProcessing] = useState(false);
  const [acceptLoaded, setAcceptLoaded] = useState(false);
  const [cardForm, setCardForm] = useState({
    cardNumber: "",
    month: "",
    year: "",
    cardCode: "",
  });

  // Billing address: same as shipping by default, with a separate form when
  // the customer unchecks the box (Alberto demo feedback, 2026-07-13).
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billing, setBilling] = useState<Address>(EMPTY_ADDRESS);
  const effectiveBilling = billingSameAsShipping ? shipping : billing;

  // Photo upload is STEP 1 and REQUIRED (spec 2.1) — you cannot proceed
  // without it. Downscaled data URL, same processing as before.
  const [idPhoto, setIdPhoto] = useState<string | null>(null);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setIdPhoto(await processPhotoFile(file));
    } catch {
      toast({ title: t("orderCertCard.photoInvalid"), variant: "destructive" });
    }
  };

  const { data: paymentConfig } = useQuery<PaymentConfig>({
    queryKey: ["/api/payment/config"],
  });

  // Load Accept.js (v1) from the host matching the configured environment —
  // sandbox credentials only tokenize against jstest.authorize.net.
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

  const { data, isLoading, error } = useQuery<{
    certification: any;
    existingCardOrder: { id: number; status: string; createdAt: string } | null;
  }>({
    queryKey: ["/api/certifications", certId],
    enabled: certId > 0,
  });

  const cert = data?.certification;
  // Prevention over error: if the server says an active card order already
  // exists for this cert, render an "already ordered" state instead of the
  // payment wizard (never let the user reach the 409 after entering card details).
  const existingCardOrder = data?.existingCardOrder ?? null;

  // Claimable prepaid entitlements for this cert (Chunk 2 fulfillment).
  const { data: entitlementsData } = useQuery<{ entitlements: PhotoIdEntitlement[] }>({
    queryKey: ["/api/photo-id/entitlements", certId],
    enabled: certId > 0,
  });

  // Resolve the entitlement to use: explicit ?entitlement= param wins;
  // otherwise auto-pick the single claimable row so a member following a
  // dashboard prompt lands straight in the prepaid flow.
  useEffect(() => {
    const list = entitlementsData?.entitlements ?? [];
    if (entitlementIdParam > 0) {
      const found = list.find((e) => e.id === entitlementIdParam);
      if (found) setPrepaidEntitlement(found);
    } else if (list.length === 1) {
      setPrepaidEntitlement(list[0]);
    }
  }, [entitlementsData, entitlementIdParam]);

  // Prefill shipping from the saved profile address (spec 3.3) — default,
  // not a lock. Entitlement address wins over the profile address.
  const { data: meData } = useQuery<{ user: any }>({ queryKey: ["/api/auth/me"] });
  useEffect(() => {
    if (shippingPrefilled) return;
    const fromEntitlement = prepaidEntitlement?.shippingAddress;
    const fromProfile = meData?.user?.savedShippingAddress;
    const saved = fromEntitlement || fromProfile;
    if (saved && typeof saved === "object" && saved.name) {
      setShipping({
        name: saved.name || "",
        address: saved.address || "",
        city: saved.city || "",
        state: saved.state || "",
        zip: saved.zip || "",
        country: saved.country || "US",
      });
      setShippingPrefilled(true);
    }
  }, [meData, prepaidEntitlement, shippingPrefilled]);

  // Prepaid: shipping method comes from the entitlement (paid at checkout).
  useEffect(() => {
    if (prepaidEntitlement) setShippingMethod(prepaidEntitlement.shippingMethod);
  }, [prepaidEntitlement]);

  const cardPrice = 9.99;
  const shippingCost = shippingMethod === "standard" ? 4.99 : 9.99;
  const subtotal = cardPrice + shippingCost;
  const surcharge = paymentConfig?.configured ? Number((subtotal * 0.03).toFixed(2)) : 0;
  const total = Number((subtotal + surcharge).toFixed(2));

  // Pay-now path (no prepaid entitlement) — POST /api/cert-cards, unchanged.
  const orderMutation = useMutation({
    mutationFn: async (data: { paymentNonce?: string }) => {
      const payload: Record<string, unknown> = {
        certificationId: certId,
        shippingAddress: shipping,
        billingAddress: effectiveBilling,
        shippingMethod,
      };
      if (idPhoto) {
        payload.idPhoto = idPhoto;
      }
      if (data.paymentNonce) {
        payload.paymentNonce = data.paymentNonce;
      }
      const res = await apiRequest("POST", "/api/cert-cards", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
      setStep(prepaidEntitlement ? 1 : 2);
      setIsProcessing(false);
    },
    onError: (err: Error) => {
      toast({ title: t("orderCertCard.orderFailed"), description: err.message, variant: "destructive" });
      setIsProcessing(false);
    },
  });

  // Prepaid path: photo consumes the entitlement, no charge (spec 2.1).
  const prepaidMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/photo-id/${prepaidEntitlement!.id}/photo`, {
        certificationId: certId,
        idPhoto,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/photo-id/entitlements"] });
      setStep(1);
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

  // Already ordered: an active card order exists for this cert. Show the
  // existing order state and a way back, instead of the payment wizard.
  if (existingCardOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-4" data-testid="already-ordered-card">
        <Package className="h-12 w-12 text-accent mx-auto" />
        <h1 className="text-2xl font-bold" data-testid="text-already-ordered-title">
          {t("orderCertCard.alreadyOrderedTitle", { defaultValue: "Card already ordered" })}
        </h1>
        <p className="text-muted-foreground" data-testid="text-already-ordered-desc">
          {t("orderCertCard.alreadyOrderedDesc", {
            defaultValue: "You already have an active card order for this certification. Its current status is shown below.",
          })}
        </p>
        <div className="inline-flex items-center gap-2">
          <Badge variant="secondary" className="capitalize" data-testid="badge-existing-order-status">
            {existingCardOrder.status.replace(/_/g, " ")}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {t("orderCertCard.orderNumber", { defaultValue: "Order" })} #{existingCardOrder.id}
          </span>
        </div>
        <div className="pt-2">
          <Link href={`/certifications/${certId}`}>
            <Button data-testid="button-view-certification">{t("orderCertCard.viewCertification", { defaultValue: "View certification" })}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const photoStepIndex = 0;
  const reviewStepIndex = 1; // pay-now mode only
  const doneStepIndex = prepaidEntitlement ? 1 : 2;

  const canProceed = () => {
    if (step === photoStepIndex) {
      // Photo is REQUIRED (spec 2.1) — no Continue without it.
      return !!idPhoto;
    }
    if (step === reviewStepIndex && !prepaidEntitlement) {
      const shippingOk = shipping.name && shipping.address && shipping.city && shipping.state && shipping.zip;
      if (!shippingOk) return false;
      if (!billingSameAsShipping) {
        return !!(billing.name && billing.address && billing.city && billing.state && billing.zip);
      }
    }
    return true;
  };

  const handleNext = () => {
    if (prepaidEntitlement && step === photoStepIndex) {
      // Prepaid: photo step IS the submit step.
      setIsProcessing(true);
      prepaidMutation.mutate();
      return;
    }
    if (!prepaidEntitlement && step === reviewStepIndex) {
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
            zip: effectiveBilling.zip || undefined,
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

      {step === photoStepIndex && (
        <Card data-testid="step-photo">
          <CardHeader>
            <CardTitle className="text-lg">{t("orderCertCard.photoTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Certificate context (was old step 0) */}
            <div className="flex items-start gap-4 pb-2 border-b">
              <div className="h-12 w-12 rounded-md bg-accent/20 flex items-center justify-center shrink-0">
                <Award className="h-6 w-6 text-accent" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold" data-testid="text-cert-number">
                  {t("orderCertCard.certificateNum", { number: cert.certificateNumber })}
                </p>
                <Badge variant="secondary" data-testid="badge-cert-status">{String(t(`status.${cert.status}`, cert.status))}</Badge>
              </div>
            </div>

            {prepaidEntitlement && (
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-sm" data-testid="banner-prepaid">
                <p className="font-medium text-green-800 dark:text-green-400">
                  {t("orderCertCard.prepaidTitle")}
                </p>
              </div>
            )}

            <div className="space-y-3" data-testid="section-id-photo">
              <p className="text-sm text-muted-foreground">{t("orderCertCard.photoRequired")}</p>
              {idPhoto ? (
                <div className="flex items-center gap-4">
                  <img
                    src={idPhoto}
                    alt={t("orderCertCard.photoTitle")}
                    className="h-24 w-24 rounded-md object-cover border"
                    data-testid="img-id-photo-preview"
                  />
                  <div className="flex flex-col gap-2">
                    <Button asChild variant="outline" size="sm">
                      <label className="cursor-pointer" data-testid="button-change-photo">
                        {t("orderCertCard.photoChange")}
                        <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} data-testid="input-id-photo" />
                      </label>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setIdPhoto(null)} data-testid="button-remove-photo">
                      {t("orderCertCard.photoRemove")}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button asChild variant="outline">
                  <label className="cursor-pointer" data-testid="button-upload-photo">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    {t("orderCertCard.photoButton")}
                    <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} data-testid="input-id-photo" />
                  </label>
                </Button>
              )}
              <p className="text-xs text-muted-foreground" data-testid="text-photo-guidance">
                {t("orderCertCard.photoGuidance")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {step === reviewStepIndex && !prepaidEntitlement && (
        <Card data-testid="step-review">
          <CardHeader>
            <CardTitle className="text-lg">{t("orderCertCard.reviewTitle", { defaultValue: "Review and pay" })}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Shipping address (prefilled from the saved profile, editable) */}
            <div className="space-y-3" data-testid="section-shipping-address">
              <p className="font-medium">{t("orderCertCard.shippingAddressTitle")}</p>
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
            </div>

            {/* Shipping tier folds into review as a compact radio (spec 2.2) */}
            <div className="space-y-2" data-testid="section-shipping-method">
              <p className="font-medium">{t("orderCertCard.shippingMethodTitle")}</p>
              <button
                type="button"
                className={`w-full text-left p-3 rounded-md border transition-colors ${
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
                className={`w-full text-left p-3 rounded-md border transition-colors ${
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
            </div>

            {/* Payment */}
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
                {/* Billing address — defaults to the shipping address */}
                <div className="space-y-3" data-testid="section-billing-address">
                  <p className="font-medium">{t("orderCertCard.billingAddressTitle")}</p>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="billingSame"
                      checked={billingSameAsShipping}
                      onCheckedChange={(checked) => setBillingSameAsShipping(checked === true)}
                      data-testid="checkbox-billing-same"
                    />
                    <Label htmlFor="billingSame" className="font-normal cursor-pointer">
                      {t("orderCertCard.billingSameAsShipping")}
                    </Label>
                  </div>
                  {!billingSameAsShipping && (
                    <div className="space-y-3 border rounded-md p-4 bg-muted/30">
                      <div className="space-y-2">
                        <Label htmlFor="billingName">{t("orderCertCard.fullName")}</Label>
                        <Input id="billingName" value={billing.name} onChange={(e) => setBilling({ ...billing, name: e.target.value })} disabled={isProcessing} data-testid="input-billing-name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="billingAddress">{t("orderCertCard.address")}</Label>
                        <Input id="billingAddress" value={billing.address} onChange={(e) => setBilling({ ...billing, address: e.target.value })} disabled={isProcessing} data-testid="input-billing-address" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="billingCity">{t("orderCertCard.city")}</Label>
                          <Input id="billingCity" value={billing.city} onChange={(e) => setBilling({ ...billing, city: e.target.value })} disabled={isProcessing} data-testid="input-billing-city" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="billingState">{t("orderCertCard.state")}</Label>
                          <Input id="billingState" value={billing.state} onChange={(e) => setBilling({ ...billing, state: e.target.value })} disabled={isProcessing} data-testid="input-billing-state" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="billingZip">{t("orderCertCard.zipCode")}</Label>
                          <Input id="billingZip" inputMode="numeric" maxLength={10} value={billing.zip} onChange={(e) => setBilling({ ...billing, zip: e.target.value })} disabled={isProcessing} data-testid="input-billing-zip" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="billingCountry">{t("orderCertCard.country")}</Label>
                          <Input id="billingCountry" value={billing.country} onChange={(e) => setBilling({ ...billing, country: e.target.value })} disabled={isProcessing} data-testid="input-billing-country" />
                        </div>
                      </div>
                    </div>
                  )}
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
                      onChange={(e) => setCardForm({ ...cardForm, cardNumber: formatCardNumber(e.target.value) })}
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
                        onChange={(e) => setCardForm({ ...cardForm, month: digitsOnly(e.target.value).slice(0, 2) })}
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
                        onChange={(e) => setCardForm({ ...cardForm, year: digitsOnly(e.target.value).slice(0, 2) })}
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
                        onChange={(e) => setCardForm({ ...cardForm, cardCode: digitsOnly(e.target.value).slice(0, 4) })}
                        disabled={isProcessing}
                        data-testid="input-card-code"
                      />
                    </div>
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

      {step === doneStepIndex && (
        <Card data-testid="step-confirmation">
          <CardContent className="py-12 text-center space-y-6">
            <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <Package className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold" data-testid="text-order-confirmed">{t("orderCertCard.orderConfirmed")}</h2>
              <p className="text-muted-foreground">
                {prepaidEntitlement ? t("orderCertCard.photoReceived", { defaultValue: "Photo received. Your card is queued for printing and will ship to:" }) : t("orderCertCard.orderConfirmedDesc")}
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

      {step < doneStepIndex && (
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
            disabled={!canProceed() || isProcessing || (step === reviewStepIndex && !prepaidEntitlement && !paymentConfig?.configured && !paymentConfig?.demoMode)}
            data-testid="button-next-step"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {t("orderCertCard.processing")}
              </>
            ) : prepaidEntitlement && step === photoStepIndex ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                {t("orderCertCard.submitPhoto", { defaultValue: "Submit photo" })}
              </>
            ) : step === reviewStepIndex ? (
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
