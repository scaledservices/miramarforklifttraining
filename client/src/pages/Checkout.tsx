import { useTranslation } from "react-i18next";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Phone, Mail, ShoppingCart, ArrowLeft } from "lucide-react";
import { brand } from "@shared/config/brand";
import { trackCheckoutContact } from "@/lib/analytics";
import { useEffect } from "react";

export default function Checkout() {
  const { t } = useTranslation();
  const { items, totalPrice, clearCart } = useCart();

  useEffect(() => {
    if (items.length > 0) trackCheckoutContact();
  }, [items.length]);

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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/cart" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-6">
        <ArrowLeft className="w-3.5 h-3.5" />
        {t("checkout.backToCart")}
      </Link>

      <h1 className="text-2xl font-bold mb-2" data-testid="text-checkout-title">{t("checkout.title")}</h1>

      <Card className="mb-6">
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
          <div className="flex justify-between gap-2 font-bold text-lg mt-4 pt-4 border-t">
            <span>{t("checkout.total")}</span>
            <span data-testid="text-checkout-total">${totalPrice.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="p-6 text-center space-y-4">
          <h2 className="font-bold text-lg text-foreground">
            {t("checkout.contactToEnrollTitle", { defaultValue: "Enroll by Phone or Email" })}
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {t("checkout.contactToEnrollDesc", { defaultValue: "Online checkout is being upgraded. To enroll now, call us or send an email with the courses you need. We will get you set up right away." })}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <a href={`tel:${brand.support.phoneTel}`}>
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white" data-testid="button-checkout-call">
                <Phone className="w-4 h-4 mr-2" />
                {brand.support.phone}
              </Button>
            </a>
            <a href={`mailto:${brand.support.infoEmail}?subject=Course%20Enrollment%20Request`}>
              <Button size="lg" variant="outline" data-testid="button-checkout-email">
                <Mail className="w-4 h-4 mr-2" />
                {brand.support.infoEmail}
              </Button>
            </a>
          </div>
          <div className="pt-2">
            <Link href="/request-quote">
              <Button variant="outline" size="sm" data-testid="button-checkout-request-quote">
                {t("checkout.requestQuoteInstead", { defaultValue: "Or request a training quote" })}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 text-center">
        <Button variant="ghost" size="sm" onClick={clearCart} data-testid="button-clear-cart-checkout">
          {t("cart.clearCart")}
        </Button>
      </div>
    </div>
  );
}
