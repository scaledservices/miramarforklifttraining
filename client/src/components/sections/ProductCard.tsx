import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import OptimizedImage from "@/components/ui/optimized-image";
import { ArrowRight, Clock, MapPin, Check } from "lucide-react";
import type { Product } from "@/data/catalog";
import { getProductImage, getProductImageAltKey } from "@/data/catalog";
import { useTranslation } from "react-i18next";
import { useTranslatedProduct } from "@/hooks/useTranslatedProduct";

const ctaKeyMap: Record<string, string> = {
  "Get Certified Now": "ctaLabels.getCertifiedNow",
  "Book Training": "ctaLabels.bookTraining",
  "Book Bundle": "ctaLabels.bookBundle",
  "Register Now": "ctaLabels.registerNow",
  "Order Trainer Kit": "ctaLabels.orderTrainerKit",
  "Order Cards": "ctaLabels.orderCards",
  "Order Kit": "ctaLabels.orderKit",
};

interface ProductCardProps {
  product: Product;
  variant?: "compact" | "full";
  ctaLabelOverride?: string;
  ctaHrefOverride?: string;
}

export default function ProductCard({ product: rawProduct, variant = "compact", ctaLabelOverride, ctaHrefOverride }: ProductCardProps) {
  const { t } = useTranslation();
  const product = useTranslatedProduct(rawProduct);
  const translatedCta = ctaKeyMap[rawProduct.ctaLabel] ? t(ctaKeyMap[rawProduct.ctaLabel]) : rawProduct.ctaLabel;

  const locationLabel = product.location === "san-diego" ? t("productCard.sanDiego")
    : t("productCard.onlineLocation");

  const categoryLabel = product.category === "online" ? t("productCard.online")
    : product.category === "hands-on" ? t("productCard.handsOn")
    : product.category === "trainer" ? t("productCard.trainTheTrainer")
    : t("productCard.business");

  const productImage = getProductImage(rawProduct);
  const altKey = getProductImageAltKey(rawProduct);
  const productImageAlt = altKey ? t(altKey) : (rawProduct.imageAlt || product.title);

  if (variant === "full") {
    return (
      <Card className="border-border overflow-hidden" data-testid={`product-card-${product.id}`}>
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-48 lg:w-56 shrink-0">
              <OptimizedImage
                src={productImage}
                alt={productImageAlt}
                className="w-full h-40 md:h-full object-cover"
                loading="lazy"
                data-testid={`img-product-${product.id}`}
              />
            </div>
            <div className="flex-1 p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Badge variant="secondary" className="text-xs">{categoryLabel}</Badge>
                    <Badge variant="outline" className="text-xs">
                      <MapPin className="w-3 h-3 mr-1" />
                      {locationLabel}
                    </Badge>
                    {product.duration && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {product.duration}
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-lg font-bold mb-2">{product.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{product.shortDescription}</p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-4">
                    {product.includes.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Check className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col items-end justify-between md:min-w-[180px]">
                  <div className="text-right mb-4">
                    {product.originalPrice && (
                      <div className="text-sm text-muted-foreground line-through">${product.originalPrice}</div>
                    )}
                    <div className="text-2xl font-bold">
                      {typeof product.price === "number" ? `$${product.price}` : t("productCard.customPricing")}
                      {product.priceLabel && <span className="text-sm font-normal text-muted-foreground ml-1">{product.priceLabel}</span>}
                    </div>
                    {product.price === "call" && (
                      <span className="text-xs text-muted-foreground">{t("productCard.contactForDetails")}</span>
                    )}
                  </div>
                  <Link href={ctaHrefOverride ?? `/p/${product.slug}`}>
                    <Button className="bg-accent text-accent-foreground border-accent-border" data-testid={`button-product-${product.id}`}>
                      {ctaLabelOverride ?? translatedCta}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border hover-elevate flex flex-col overflow-hidden" data-testid={`product-card-${product.id}`}>
      <div className="h-36 overflow-hidden">
        <OptimizedImage
          src={productImage}
          alt={productImageAlt}
          className="w-full h-full object-cover"
          loading="lazy"
          data-testid={`img-product-${product.id}`}
        />
      </div>
      <CardContent className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge variant="secondary" className="text-xs">{categoryLabel}</Badge>
          {product.location !== "online" && (
            <Badge variant="outline" className="text-xs">
              {locationLabel}
            </Badge>
          )}
        </div>
        <h3 className="font-bold text-sm mb-2 line-clamp-2">{product.title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed mb-4 flex-1 line-clamp-3">{product.shortDescription}</p>
        <div className="flex items-center justify-between gap-2 mt-auto">
          <div className="flex flex-col">
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through">${product.originalPrice}</span>
            )}
            <span className="font-bold text-lg">
              {typeof product.price === "number" ? `$${product.price}` : t("productCard.call")}
              {product.priceLabel && <span className="text-xs font-normal text-muted-foreground ml-1">{product.priceLabel}</span>}
            </span>
          </div>
          <Link href={`/p/${product.slug}`}>
            <Button size="sm" variant="outline" data-testid={`button-product-${product.id}`}>
              {t("productCard.details")}
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
