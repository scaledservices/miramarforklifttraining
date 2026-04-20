import { useTranslation } from "react-i18next";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight, ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function Cart() {
  const { t } = useTranslation();
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-6" />
        <h1 className="text-2xl font-bold mb-2" data-testid="text-empty-cart">{t("cart.empty")}</h1>
        <p className="text-muted-foreground mb-8">{t("cart.emptyDesc")}</p>
        <Link href="/training-programs">
          <Button data-testid="button-browse-programs">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("cta.browsePrograms")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <h1 className="text-2xl font-bold" data-testid="text-cart-title">{t("cart.title")}</h1>
        <Button variant="ghost" size="sm" onClick={clearCart} data-testid="button-clear-cart">
          <Trash2 className="w-4 h-4 mr-2" />
          {t("cart.clearCart")}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.courseSlug} data-testid={`card-cart-item-${item.courseSlug}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm leading-snug" data-testid={`text-item-title-${item.courseSlug}`}>
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1" data-testid={`text-item-price-${item.courseSlug}`}>
                      ${item.price.toFixed(2)} {t("common.each")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => updateQuantity(item.courseSlug, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        data-testid={`button-decrease-${item.courseSlug}`}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium" data-testid={`text-quantity-${item.courseSlug}`}>
                        {item.quantity}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => updateQuantity(item.courseSlug, item.quantity + 1)}
                        data-testid={`button-increase-${item.courseSlug}`}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <span className="font-semibold text-sm w-20 text-right" data-testid={`text-item-subtotal-${item.courseSlug}`}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeItem(item.courseSlug)}
                      data-testid={`button-remove-${item.courseSlug}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardContent className="p-6">
              <h2 className="font-bold text-lg mb-4">{t("cart.orderSummary")}</h2>
              <div className="space-y-2 text-sm">
                {items.map((item) => (
                  <div key={item.courseSlug} className="flex justify-between gap-2">
                    <span className="text-muted-foreground">{item.title} x{item.quantity} {item.quantity === 1 ? t("common.seat") : t("common.seats")}</span>
                    <span className="font-medium shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between gap-2 font-bold text-lg">
                <span>{t("common.total")}</span>
                <span data-testid="text-cart-total">${totalPrice.toFixed(2)}</span>
              </div>
              <Link href="/checkout">
                <Button size="lg" className="w-full mt-6 bg-accent text-accent-foreground border-accent-border" data-testid="button-checkout">
                  {t("cart.checkout")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/training-programs">
                <Button variant="outline" size="lg" className="w-full mt-3" data-testid="button-continue-shopping">
                  {t("cart.continueShopping")}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
