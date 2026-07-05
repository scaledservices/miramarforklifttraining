import { useState, useEffect } from "react";
import { useParams, useLocation, useSearch } from "wouter";
import { useTranslation } from "react-i18next";
import { getProductBySlug, formatPrice, catalog, getBulkPrice, getBulkTotal, getProductImage, getProductImageAltKey } from "@/data/catalog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ArrowLeft, Check, Clock, MapPin, ExternalLink, Globe, Calendar, Wrench, ShoppingCart, Minus, Plus, Users } from "lucide-react";
import { Link } from "wouter";
import OptimizedImage from "@/components/ui/optimized-image";
import CTABand from "@/components/sections/CTABand";
import ProductCard from "@/components/sections/ProductCard";
import SEOHead from "@/components/seo/SEOHead";
import { courseSchema } from "@/components/seo/StructuredData";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useCurrentLocale } from "@/hooks/useLocaleLocation";
import { industry } from "@shared/config/industry";
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

export default function ProductDetail() {
  const { t } = useTranslation();
  const locale = useCurrentLocale();
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const { addItem } = useCart();
  const { toast } = useToast();
  const rawProduct = getProductBySlug(slug || "");
  const product = useTranslatedProduct(rawProduct!);

  const searchParams = new URLSearchParams(searchString);
  const initialSeats = Math.max(1, Math.min(100, parseInt(searchParams.get("seats") || "1") || 1));
  const [seats, setSeats] = useState(initialSeats);

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const s = parseInt(params.get("seats") || "1") || 1;
    setSeats(Math.max(1, Math.min(100, s)));
  }, [searchString]);

  if (!rawProduct) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">{t("productDetail.notFoundTitle")}</h1>
        <p className="text-muted-foreground mb-8">{t("productDetail.notFoundDesc")}</p>
        <Link href="/training-programs">
          <Button data-testid="button-back-programs">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("productDetail.viewAllPrograms")}
          </Button>
        </Link>
      </div>
    );
  }

  const locationLabel = product.location === "san-diego" ? t("productCard.sanDiego")
    : t("productCard.onlineLocation");

  const categoryLabel = product.category === "online" ? t("productCard.online")
    : product.category === "hands-on" ? t("productCard.handsOn")
    : product.category === "trainer" ? t("productCard.trainTheTrainer")
    : t("productCard.business");

  const relatedProducts = catalog
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  const categoryImage = getProductImage(rawProduct!);
  const altKey = getProductImageAltKey(rawProduct!);
  const categoryImageAlt = altKey ? t(altKey) : (rawProduct!.imageAlt || product.title);

  const hasBulkPricing = product.bulkPricing && product.bulkPricing.length > 0;
  const currentPricePerSeat = hasBulkPricing ? getBulkPrice(product, seats) : (typeof product.price === "number" ? product.price : 0);
  const totalPrice = hasBulkPricing ? getBulkTotal(product, seats) : currentPricePerSeat * seats;
  const isCrewPurchase = seats > 1;

  const seatLabel = seats === 1 ? t("productDetail.seat") : t("productDetail.seats");

  const handleBuyNow = () => {
    addItem({
      courseSlug: product.courseSlug!,
      productSlug: product.slug,
      title: product.title,
      price: currentPricePerSeat,
      isTeamProduct: isCrewPurchase,
      quantity: seats,
    });
    navigate("/checkout");
  };

  const handleAddToCart = () => {
    addItem({
      courseSlug: product.courseSlug!,
      productSlug: product.slug,
      title: product.title,
      price: currentPricePerSeat,
      isTeamProduct: isCrewPurchase,
      quantity: seats,
    });
    toast({
      title: t("productDetail.addedToCart"),
      description: t("productDetail.addedToCartDesc", { title: product.title, seats, seatLabel }),
    });
  };

  const dayNames = [t("productDetail.monday"), t("productDetail.wednesday"), t("productDetail.friday")];

  return (
    <>
      <SEOHead
        title={product.metaTitle}
        description={product.metaDescription}
        canonical={`/p/${product.slug}`}
        jsonLd={[courseSchema({
          name: product.title,
          description: product.shortDescription,
          url: `/p/${product.slug}`,
          price: typeof product.price === "number" ? product.price : undefined,
          duration: product.duration,
          image: categoryImage,
          locale,
        })]}
      />
      <section className="relative overflow-hidden py-10 md:py-14">
        <div className="absolute inset-0">
          <OptimizedImage src={categoryImage} alt={categoryImageAlt} className="w-full h-full object-cover" loading="eager" fetchpriority="high" />
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(10,22%,15%)]/95 via-[hsl(10,22%,18%)]/85 to-[hsl(10,22%,21%)]/70" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/training-programs" className="inline-flex items-center gap-1 text-sm text-white/70 mb-4" data-testid="link-back">
            <ArrowLeft className="w-3.5 h-3.5" />
            {t("productDetail.allPrograms")}
          </Link>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Badge className="bg-white/15 text-white border-white/20">{categoryLabel}</Badge>
            <Badge className="bg-white/15 text-white border-white/20">
              <MapPin className="w-3 h-3 mr-1" />
              {locationLabel}
            </Badge>
            <Badge className="bg-white/15 text-white border-white/20">
              <Clock className="w-3 h-3 mr-1" />
              {product.duration}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight drop-shadow-md">
            {product.title}
          </h1>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold mb-4">{t("productDetail.aboutThisProgram")}</h2>
              <p className="text-muted-foreground leading-relaxed mb-8">{product.longDescription}</p>

              <h2 className="text-xl font-bold mb-4">{t("productDetail.whatIsIncluded")}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {product.includes.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>

              {hasBulkPricing && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold mb-4">{t("productDetail.volumePricing")}</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {product.bulkPricing!.map((tier) => {
                      const isActive = seats >= tier.minSeats && (
                        !product.bulkPricing!.find(t => t.minSeats > tier.minSeats && seats >= t.minSeats)
                      );
                      return (
                        <button
                          key={tier.minSeats}
                          onClick={() => setSeats(tier.minSeats)}
                          className={`rounded-lg border p-4 text-center transition-all ${
                            isActive
                              ? "border-accent bg-accent/10 ring-2 ring-accent/30"
                              : "border-border hover:border-accent/50"
                          }`}
                          data-testid={`tier-${tier.minSeats}`}
                        >
                          <div className="text-xs text-muted-foreground mb-1">{tier.label}</div>
                          <div className="text-lg font-bold">${tier.pricePerSeat}</div>
                          <div className="text-xs text-muted-foreground">{t("productDetail.perSeat")}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <Card className="border-border sticky top-20" data-testid="product-purchase-card">
                <CardContent className="p-6">
                  {hasBulkPricing && typeof product.price === "number" && (
                    <>
                      <div className="mb-4">
                        <label className="text-sm font-medium mb-2 block">{t("productDetail.numberOfSeats")}</label>
                        <div className="flex items-center gap-3">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-10 w-10"
                            onClick={() => setSeats(Math.max(1, seats - 1))}
                            disabled={seats <= 1}
                            data-testid="button-seats-minus"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={seats}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1;
                              setSeats(Math.max(1, Math.min(100, val)));
                            }}
                            className="h-10 w-20 text-center border border-border rounded-md text-lg font-bold bg-background"
                            data-testid="input-seats"
                          />
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-10 w-10"
                            onClick={() => setSeats(Math.min(100, seats + 1))}
                            disabled={seats >= 100}
                            data-testid="button-seats-plus"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mb-4 p-3 rounded-lg bg-muted/50">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">{seats} {seatLabel} × ${currentPricePerSeat.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-2xl font-bold" data-testid="text-total-price">${totalPrice.toFixed(2)}</span>
                          {product.originalPrice && seats === 1 && (
                            <span className="text-sm text-muted-foreground line-through">${product.originalPrice}</span>
                          )}
                        </div>
                        {currentPricePerSeat < (product.bulkPricing![0]?.pricePerSeat || 0) && (
                          <div className="text-xs text-green-600 font-medium mt-1" data-testid="text-savings">
                            {t("productDetail.savingVolume", { amount: ((product.bulkPricing![0].pricePerSeat - currentPricePerSeat) * seats).toFixed(2) })}
                          </div>
                        )}
                      </div>

                      {product.courseSlug && (
                        <div className="mb-3">
                          <Button
                            size="lg"
                            className="w-full bg-accent text-accent-foreground border-accent-border"
                            onClick={handleBuyNow}
                            data-testid="button-buy-now"
                          >
                            {isCrewPurchase ? (
                              <>
                                <Users className="w-4 h-4 mr-2" />
                                {t("productDetail.trainYourCrew", { total: totalPrice.toFixed(2) })}
                              </>
                            ) : (
                              <>
                                {t("productDetail.getCertified", { total: totalPrice.toFixed(2) })}
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </>
                  )}

                  {!hasBulkPricing && (
                    <div className="mb-4">
                      {product.originalPrice && (
                        <div className="text-lg text-muted-foreground line-through">${product.originalPrice}</div>
                      )}
                      <div className="text-3xl font-bold mb-1">
                        {typeof product.price === "number" ? `$${product.price}` : t("productDetail.customPricing")}
                        {product.priceLabel && <span className="text-base font-normal text-muted-foreground ml-1">{product.priceLabel}</span>}
                      </div>
                      {product.price === "call" && (
                        <p className="text-sm text-muted-foreground">{t("productDetail.contactForPricing")}</p>
                      )}
                      {typeof product.price === "number" && !product.priceLabel && (
                        <p className="text-sm text-muted-foreground">{t("productDetail.perPerson")}</p>
                      )}
                    </div>
                  )}

                  {!hasBulkPricing && typeof product.price === "number" && product.courseSlug && (
                    <div className="mb-3">
                      <Button
                        size="lg"
                        className="w-full bg-accent text-accent-foreground border-accent-border"
                        onClick={() => {
                          addItem({
                            courseSlug: product.courseSlug!,
                            productSlug: product.slug,
                            title: product.title,
                            price: product.price as number,
                            isTeamProduct: product.category === "business",
                          });
                          navigate("/checkout");
                        }}
                        data-testid="button-buy-now"
                      >
                        {t("productDetail.buyNow")}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}

                  {product.category === "hands-on" && typeof product.price === "number" && !product.courseSlug && (
                    <Link href="/request-onsite-training">
                      <Button size="lg" className="w-full bg-accent text-accent-foreground border-accent-border mb-3" data-testid="button-request-onsite-training">
                        {t("productDetail.requestOnsiteTraining")}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  )}

                  {product.price === "call" && (
                    <Link href="/contact">
                      <Button size="lg" className="w-full bg-accent text-accent-foreground border-accent-border mb-3" data-testid="button-contact-pricing">
                        {ctaKeyMap[product.ctaLabel] ? t(ctaKeyMap[product.ctaLabel]) : product.ctaLabel}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  )}

                  <Link href="/contact">
                    <Button variant="outline" size="lg" className="w-full" data-testid="button-contact-product">
                      {t("productDetail.haveQuestions")}
                    </Button>
                  </Link>

                  <div className="mt-6 pt-6 border-t border-border space-y-3">
                    {product.address && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                        <span>{product.address}</span>
                      </div>
                    )}
                    {product.classSchedule && product.classSchedule.length > 0 && (
                      <div className="flex items-start gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium">{t("productDetail.classTimes")}</span>
                          <div className="text-muted-foreground mt-0.5">
                            {dayNames.map((day) => (
                              <div key={day}>{day}: 9:00 AM & 1:00 PM</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {product.languages && product.languages.length > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="w-4 h-4 text-accent" />
                        <span>{product.languages.join(", ")}</span>
                      </div>
                    )}
                    {product.equipmentCovered && product.equipmentCovered.length > 0 && (
                      <div className="flex items-start gap-2 text-sm">
                        <Wrench className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium">{t("productDetail.equipment")}</span>
                          <ul className="text-muted-foreground mt-0.5 space-y-0.5">
                            {product.equipmentCovered.map((eq) => (
                              <li key={eq}>{eq}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-accent" />
                      <span>{t("productDetail.bodyCompliant", { body: industry.regulatory.body })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-accent" />
                      <span>{t("productDetail.certUponCompletion")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="py-12 md:py-16 bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold mb-6">{t("productDetail.relatedPrograms")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <CTABand
        title={t("productDetail.ctaTitle")}
        subtitle={t("productDetail.ctaSubtitle")}
        primaryCta={{ label: t("productDetail.contactUs"), href: "/contact" }}
        secondaryCta={{ label: t("productDetail.viewPrograms"), href: "/training-programs" }}
      />
    </>
  );
}
