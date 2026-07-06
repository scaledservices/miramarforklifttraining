import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import SEOHead from "@/components/seo/SEOHead";
import CheckoutInlineAuth from "@/components/checkout/CheckoutInlineAuth";
import CardPaymentSection from "@/components/checkout/CardPaymentSection";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { brand } from "@shared/config/brand";
import { CheckCircle, AlertTriangle } from "lucide-react";

interface BalanceInfo {
  bookingNumber: string;
  sessionDate: string;
  total: number;
  paid: number;
  balanceDue: number;
}

export default function PayBalance() {
  const { t } = useTranslation();
  const params = useParams<{ bookingId: string }>();
  const bookingId = Number(params.bookingId);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [paidResult, setPaidResult] = useState<{ amountCharged: number } | null>(null);

  const { data: balance, isLoading, error } = useQuery<BalanceInfo>({
    queryKey: ["/api/bookings", bookingId, "balance"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isAuthenticated && Number.isFinite(bookingId),
  });

  const payMutation = useMutation({
    mutationFn: async (nonce: string | null) => {
      const res = await apiRequest("POST", `/api/bookings/${bookingId}/pay-balance`, {
        paymentNonce: nonce,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.success) setPaidResult({ amountCharged: data.amountCharged });
    },
  });

  const seoHead = (
    <SEOHead title={`${t("payBalance.seoTitle", { defaultValue: "Pay Training Balance" })} | ${brand.name}`} description="" noindex />
  );

  if (paidResult) {
    return (
      <>{seoHead}<div className="max-w-lg mx-auto px-4 py-20 text-center space-y-6" data-testid="page-balance-paid">
        <CheckCircle className="h-20 w-20 text-brand-green mx-auto" />
        <h1 className="text-3xl font-bold">{t("payBalance.paidTitle", { defaultValue: "Balance Paid — Thank You!" })}</h1>
        <p className="text-muted-foreground">
          {t("payBalance.paidDesc", { defaultValue: "We charged" })} <span className="font-bold">${paidResult.amountCharged.toFixed(2)}</span>.{" "}
          {t("payBalance.paidDesc2", { defaultValue: "A receipt is on its way to your email. Your booking is fully paid." })}
        </p>
        <Button asChild className="bg-accent text-accent-foreground border-accent-border">
          <Link href="/dashboard">{t("nav.dashboard")}</Link>
        </Button>
      </div></>
    );
  }

  return (
    <>{seoHead}<div className="max-w-lg mx-auto px-4 py-14 space-y-6" data-testid="page-pay-balance">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">{t("payBalance.title", { defaultValue: "Pay Your Training Balance" })}</h1>
        <p className="text-muted-foreground">{t("payBalance.subtitle", { defaultValue: "Secure online payment for the remaining balance on your booking." })}</p>
      </div>

      {authLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : !isAuthenticated ? (
        <CheckoutInlineAuth />
      ) : isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : error || !balance ? (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">{t("payBalance.notFound", { defaultValue: "We couldn't find this booking on your account. Make sure you're signed in with the email you used to book, or call us at" })} <a href={`tel:${brand.support.phoneTel}`} className="text-brand-orange font-medium">{brand.support.phone}</a>.</p>
          </CardContent>
        </Card>
      ) : balance.balanceDue <= 0.01 ? (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <CheckCircle className="h-10 w-10 text-brand-green mx-auto" />
            <p className="font-medium">{t("payBalance.nothingDue", { defaultValue: "This booking is fully paid — nothing due!" })}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-6 space-y-2 text-sm" data-testid="balance-summary">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("payBalance.bookingLabel", { defaultValue: "Booking" })}</span>
                <span className="font-mono font-medium">{balance.bookingNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("booking.trainingTotal")}</span>
                <span className="font-medium">${balance.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("payBalance.paidSoFar", { defaultValue: "Paid so far" })}</span>
                <span className="font-medium text-brand-green">${balance.paid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base border-t pt-2 mt-2">
                <span className="font-semibold">{t("payBalance.balanceDue", { defaultValue: "Balance due" })}</span>
                <span className="font-bold" data-testid="text-balance-amount">${balance.balanceDue.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                {t("payBalance.surchargeNote", { defaultValue: "A 3% card processing fee is added to online card payments." })}
              </p>
            </CardContent>
          </Card>

          <CardPaymentSection
            chargeAmount={Number((balance.balanceDue * 1.03).toFixed(2))}
            pending={payMutation.isPending}
            onPay={(nonce) => payMutation.mutate(nonce)}
            ctaLabel={t("payBalance.payCta", { amount: (balance.balanceDue * 1.03).toFixed(2), defaultValue: `Pay $${(balance.balanceDue * 1.03).toFixed(2)}` })}
            fallbackCtaLabel={t("payBalance.payCtaFallback", { defaultValue: "Confirm Payment" })}
          />

          {payMutation.isError && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-md px-4 py-3" data-testid="text-pay-error">
              {(payMutation.error as Error)?.message || t("checkout.paymentFailed", { defaultValue: "Payment failed. Please try again or call us." })}
            </div>
          )}
        </>
      )}
    </div></>
  );
}
