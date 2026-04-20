import { useState, useRef, useEffect, useMemo } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Lock, ArrowLeft, AlertCircle, Loader2, CreditCard } from "lucide-react";
import CheckoutInlineAuth from "@/components/checkout/CheckoutInlineAuth";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useTranslation } from "react-i18next";

function StripePaymentForm({
  clientSecret,
  orderId,
  totalPrice,
  isTeamOrder,
  onSuccess,
  onError,
  refundAccepted,
}: {
  clientSecret: string;
  orderId: number;
  totalPrice: number;
  isTeamOrder: boolean;
  onSuccess: (orderId: number, isTeam: boolean) => void;
  onError: (error: string) => void;
  refundAccepted: boolean;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const { t } = useTranslation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + `/order-confirmation/${orderId}`,
        },
        redirect: "if_required",
      });

      if (error) {
        onError(error.message || t("checkout.paymentFailed"));
        setProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        await apiRequest("POST", `/api/orders/${orderId}/pay`, {
          paymentIntentId: paymentIntent.id,
        });
        onSuccess(orderId, isTeamOrder);
      }
    } catch (err: any) {
      onError(err.message || t("checkout.paymentFailed"));
    }
    setProcessing(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <Button
        type="submit"
        size="lg"
        className="w-full mt-6 bg-accent text-accent-foreground border-accent-border"
        disabled={!stripe || !elements || processing || !refundAccepted}
        data-testid="button-place-order"
      >
        {processing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            {t("checkout.processing")}
          </>
        ) : (
          t("checkout.payAmount", { amount: totalPrice.toFixed(2) })
        )}
      </Button>
    </form>
  );
}

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const { user, isAuthenticated, isLoading: authLoading, refetchUser } = useAuth();
  const [, navigate] = useLocation();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();

  const [refundAccepted, setRefundAccepted] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const initRef = useRef(false);

  const { data: stripeConfig } = useQuery<{ configured: boolean; publishableKey?: string; demoMode?: boolean }>({
    queryKey: ["/api/stripe/config"],
  });

  useEffect(() => {
    if (stripeConfig?.configured && stripeConfig.publishableKey && !stripePromise) {
      setStripePromise(loadStripe(stripeConfig.publishableKey));
      setIsDemoMode(false);
    } else if (stripeConfig && !stripeConfig.configured) {
      setIsDemoMode(true);
    }
  }, [stripeConfig]);

  useEffect(() => {
    if (!isAuthenticated || items.length === 0 || initRef.current || clientSecret) return;
    if (!stripeConfig) return;

    initRef.current = true;
    const hasTeamProduct = items.some((i) => i.isTeamProduct);

    const i18nLocale = i18n.language?.startsWith("es") ? "es" : "en";
    const slugLocale = items.some((i) => i.courseSlug?.includes("montacargas") || i.courseSlug?.includes("certificacion")) ? "es" : null;
    const pathLocale = window.location.pathname.startsWith("/es") ? "es" : null;
    const detectedLocale = pathLocale || slugLocale || i18nLocale;

    apiRequest("POST", "/api/create-payment-intent", {
      items: items.map((i) => ({ courseSlug: i.courseSlug, quantity: i.quantity })),
      refundPolicyAccepted: true,
      isTeamPurchase: hasTeamProduct,
      locale: detectedLocale,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setPaymentError(data.error);
          return;
        }
        setOrderId(data.orderId);
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else if (data.demoMode) {
          setIsDemoMode(true);
          setClientSecret(null);
        }
      })
      .catch((err) => {
        setPaymentError(err.message || t("checkout.paymentFailed"));
        initRef.current = false;
      });
  }, [isAuthenticated, items, stripeConfig]);

  const demoPayMutation = useMutation({
    mutationFn: async () => {
      if (!orderId) throw new Error(t("checkout.paymentFailed"));
      const res = await apiRequest("POST", `/api/orders/${orderId}/pay`, {});
      const data = await res.json();
      if (!data.success) throw new Error(data.error || t("checkout.paymentFailed"));
      return data;
    },
    onSuccess: async () => {
      clearCart();
      const hasTeamProduct = items.some((i) => i.isTeamProduct);
      if (hasTeamProduct) await refetchUser();
      navigate(`/order-confirmation/${orderId}`);
    },
    onError: (error: Error) => {
      toast({
        title: t("checkout.paymentFailed"),
        description: error.message || t("checkout.somethingWentWrong"),
        variant: "destructive",
      });
    },
  });

  function handlePaymentSuccess(oid: number, isTeam: boolean) {
    clearCart();
    if (isTeam) refetchUser();
    navigate(`/order-confirmation/${oid}`);
  }

  function handlePaymentError(message: string) {
    toast({
      title: t("checkout.paymentFailed"),
      description: message,
      variant: "destructive",
    });
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
      <h1 className="text-2xl font-bold mb-8" data-testid="text-checkout-title">{t("checkout.title")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {needsAuth && <CheckoutInlineAuth />}

          {paymentError && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
              <CardContent className="p-4 flex items-center gap-2 text-red-700 dark:text-red-400">
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
                  <h2 className="font-bold text-lg">{t("checkout.paymentInfo")}</h2>
                </div>

                {isDemoMode ? (
                  <div className="space-y-4">
                    <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-sm">
                      <p className="font-medium text-yellow-800 dark:text-yellow-400">{t("checkout.demoMode")}</p>
                      <p className="text-yellow-700 dark:text-yellow-500 mt-1">
                        {t("checkout.demoModeDesc")}
                      </p>
                    </div>
                  </div>
                ) : clientSecret && stripePromise ? (
                  <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
                    <StripePaymentForm
                      clientSecret={clientSecret}
                      orderId={orderId!}
                      totalPrice={totalPrice}
                      isTeamOrder={items.some((i) => i.isTeamProduct)}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      refundAccepted={refundAccepted}
                    />
                  </Elements>
                ) : !paymentError ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">{t("checkout.preparingPayment")}</span>
                  </div>
                ) : null}

                {(isDemoMode || (!clientSecret && !paymentError)) && (
                  <p className="text-xs text-muted-foreground mt-4">
                    {isDemoMode
                      ? t("checkout.demoModeNote")
                      : t("checkout.stripeNote")}
                  </p>
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
              <div className="flex justify-between gap-2 font-bold text-lg">
                <span>{t("checkout.total")}</span>
                <span data-testid="text-checkout-total">${totalPrice.toFixed(2)}</span>
              </div>
              {authLoading ? (
                <Button size="lg" className="w-full mt-6" disabled>
                  {t("checkout.loading")}
                </Button>
              ) : needsAuth ? null : isDemoMode ? (
                <>
                  <Button
                    size="lg"
                    className="w-full mt-6 bg-accent text-accent-foreground border-accent-border"
                    disabled={!refundAccepted || demoPayMutation.isPending || !orderId}
                    onClick={() => demoPayMutation.mutate()}
                    data-testid="button-place-order"
                  >
                    {demoPayMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        {t("checkout.processing")}
                      </>
                    ) : (
                      t("checkout.payAmountDemo", { amount: totalPrice.toFixed(2) })
                    )}
                  </Button>
                  <div className="flex items-center justify-center gap-1 mt-3 text-xs text-muted-foreground">
                    <Lock className="w-3 h-3" />
                    <span>{t("checkout.demoCheckout")}</span>
                  </div>
                </>
              ) : !clientSecret ? null : (
                <div className="flex items-center justify-center gap-1 mt-3 text-xs text-muted-foreground">
                  <Lock className="w-3 h-3" />
                  <span>{t("checkout.secureCheckout")}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
