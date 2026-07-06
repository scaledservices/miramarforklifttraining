import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check } from "lucide-react";
import { getFeaturedProducts, formatPrice } from "@/data/catalog";
import { useTranslation } from "react-i18next";
import { useTranslatedProducts } from "@/hooks/useTranslatedProduct";

const ctaKeyMap: Record<string, string> = {
  "Get Certified Now": "ctaLabels.getCertifiedNow",
  "Book Training": "ctaLabels.bookTraining",
  "Book Bundle": "ctaLabels.bookBundle",
  "Register Now": "ctaLabels.registerNow",
  "Order Trainer Kit": "ctaLabels.orderTrainerKit",
  "Order Cards": "ctaLabels.orderCards",
  "Order Kit": "ctaLabels.orderKit",
};

// NOTE: This component is currently unused — it is not imported anywhere in
// the app. Kept for potential future use on landing/marketing pages. If you
// are removing unused code, verify with the team first as it may be wired up
// as part of an A/B test or planned page redesign.
export default function PricingPreview() {
  const { t } = useTranslation();
  const featured = useTranslatedProducts(getFeaturedProducts());

  return (
    <section className="py-16 md:py-20 bg-background" data-testid="pricing-preview">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-brand-orange text-sm font-semibold uppercase tracking-wider">{t("pricing.sectionLabel")}</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mt-2 mb-4 tracking-tight">
            {t("pricing.title")}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("pricing.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((product) => (
            <Card key={product.id} className="border-border flex flex-col" data-testid={`pricing-card-${product.id}`}>
              <CardContent className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {product.category === "online" ? t("trainingPrograms.onlineTraining") :
                     product.category === "hands-on" ? t("trainingPrograms.handsOnTraining") :
                     product.category === "trainer" ? t("trainingPrograms.trainTheTrainer") : t("trainingPrograms.businessProducts")}
                  </Badge>
                  {product.location !== "online" && (
                    <Badge variant="outline" className="text-xs">
                      {product.location === "san-diego" ? t("footerLocations.sanDiego") : ""}
                    </Badge>
                  )}
                </div>

                <h3 className="font-bold text-sm mb-2 line-clamp-2">{product.title}</h3>
                <p className="text-xs text-muted-foreground mb-4 flex-1 line-clamp-3">{product.shortDescription}</p>

                <div className="mb-4">
                  {product.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through mr-2">${product.originalPrice}</span>
                  )}
                  <span className="text-2xl font-bold">
                    {typeof product.price === "number" ? `$${product.price}` : t("pricing.custom")}
                  </span>
                  {product.priceLabel && (
                    <span className="text-xs text-muted-foreground ml-1">{product.priceLabel}</span>
                  )}
                  {product.price === "call" && (
                    <span className="text-xs text-muted-foreground ml-1">{t("cta.contactUs")}</span>
                  )}
                </div>

                <ul className="space-y-1.5 mb-5">
                  {product.includes.slice(0, 3).map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Check className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Link href={`/p/${product.slug}`}>
                  <Button variant="outline" size="sm" className="w-full" data-testid={`button-pricing-${product.id}`}>
                    {ctaKeyMap[product.ctaLabel] ? t(ctaKeyMap[product.ctaLabel]) : product.ctaLabel}
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link href="/training-programs">
            <Button variant="ghost" data-testid="button-view-all-pricing">
              {t("cta.viewAllPrograms")}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
