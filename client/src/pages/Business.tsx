import Hero from "@/components/sections/Hero";
import CTABand from "@/components/sections/CTABand";
import { useTranslation } from "react-i18next";
import SEOHead from "@/components/seo/SEOHead";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { catalog, getBulkPrice, type Product } from "@/data/catalog";
import { useState, useMemo, useCallback } from "react";
import {
  ArrowRight,
  Check,
  Shield,
  Users,
  Monitor,
  Wrench,
  Minus,
  Plus,
  MapPin,
  Clock,
  Globe,
  Square,
  CheckSquare,
} from "lucide-react";

const onlineProduct = catalog.find(
  (p) => p.slug === "online-forklift-operator-training"
)!;

const locationKeys: Record<string, string> = {
  "san-diego": "guidedSelector.sanDiego",
};

function scrollToOnsite() {
  document.getElementById("onsite-track")?.scrollIntoView({ behavior: "smooth" });
}

export default function Business() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [seats, setSeats] = useState(5);
  const [selectedOnsiteProducts, setSelectedOnsiteProducts] = useState<Product[]>([]);

  const toggleOnsiteProduct = useCallback((product: Product) => {
    setSelectedOnsiteProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      return exists ? prev.filter((p) => p.id !== product.id) : [...prev, product];
    });
  }, []);

  const perSeat = getBulkPrice(onlineProduct, seats);
  const total = perSeat * seats;

  const handsOnByLocation = useMemo(() => {
    const products = catalog.filter((p) => p.category === "hands-on");
    const grouped: Record<string, Product[]> = {};
    for (const p of products) {
      if (!grouped[p.location]) grouped[p.location] = [];
      grouped[p.location].push(p);
    }
    return grouped;
  }, []);

  return (
    <>
      <SEOHead
        title={t("seo.business.title")}
        description={t("seo.business.description")}
        canonical="/business"
      />
      <Hero
        image="/images/business-team.jpg"
        imageAlt={t("productImages.businessTeam")}
        title={t("businessPage.heroTitle")}
        subtitle={t("businessPage.heroSubtitle")}
        primaryCta={{
          label: t("businessPage.heroPrimaryCta"),
          href: `/p/online-forklift-operator-training?seats=${seats}`,
        }}
      />

      <div className="bg-background py-2 flex justify-center">
        <Button
          variant="ghost"
          onClick={scrollToOnsite}
          className="text-muted-foreground"
          data-testid="button-scroll-onsite"
        >
          {t("businessPage.heroSecondaryCta")}
          <ArrowRight className="w-4 h-4 ml-2 rotate-90" />
        </Button>
      </div>

      <section className="py-16 md:py-20 bg-background" data-testid="section-online-track">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <Monitor className="w-4 h-4" />
              {t("businessPage.recommendedLabel")}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              {t("businessPage.onlineTrackTitle")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("businessPage.onlineTrackSubtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <Card className="border-primary/20 shadow-md" data-testid="card-bulk-pricing">
              <CardContent className="p-6 sm:p-8">
                <h3 className="font-bold text-lg mb-1">{t("businessPage.volumePricingTitle")}</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {t("businessPage.volumePricingDesc")}
                </p>

                <table className="w-full rounded-lg border border-border overflow-hidden text-sm" aria-label={t("businessPage.volumePricingTitle")}>
                  <thead className="sr-only">
                    <tr>
                      <th>{t("businessPage.teamSize")}</th>
                      <th>{t("common.seat")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {onlineProduct.bulkPricing!.map((tier, i) => {
                      const isActive =
                        seats >= tier.minSeats &&
                        (i === onlineProduct.bulkPricing!.length - 1 ||
                          seats < onlineProduct.bulkPricing![i + 1].minSeats);
                      return (
                        <tr
                          key={tier.label}
                          className={`${
                            isActive
                              ? "bg-primary/10 font-semibold"
                              : i % 2 === 0
                                ? "bg-card"
                                : "bg-muted/30"
                          }`}
                          data-testid={`tier-row-${tier.minSeats}`}
                        >
                          <td className="px-4 py-3">{tier.label}</td>
                          <td className="px-4 py-3 text-right">
                            ${tier.pricePerSeat.toFixed(2)}{" "}
                            <span className="text-muted-foreground font-normal">
                              / {t("common.seat")}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-sm font-medium">{t("businessPage.teamSize")}</span>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSeats(Math.max(1, seats - 1))}
                      aria-label={t("businessPage.decreaseSeats")}
                      data-testid="button-decrease-seats"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-10 text-center font-bold text-lg" data-testid="text-seat-count">
                      {seats}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSeats(seats + 1)}
                      aria-label={t("businessPage.increaseSeats")}
                      data-testid="button-increase-seats"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 flex items-end justify-between border-t border-border pt-4" aria-live="polite">
                  <div>
                    <p className="text-sm text-muted-foreground" data-testid="text-per-seat-price">
                      {seats} {seats === 1 ? t("common.seat") : t("common.seats")} × $
                      {perSeat.toFixed(2)}
                    </p>
                    <p className="text-2xl font-bold" data-testid="text-total-price">${total.toFixed(2)}</p>
                  </div>
                  <Button
                    size="lg"
                    className="bg-accent text-accent-foreground border-accent-border"
                    onClick={() =>
                      navigate(
                        `/p/online-forklift-operator-training?seats=${seats}`
                      )
                    }
                    data-testid="button-buy-online-training"
                  >
                    {t("cta.buyNow")}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div>
              <h3 className="font-bold text-lg mb-4">{t("businessPage.whyOnlineTitle")}</h3>
              <ul className="space-y-4">
                {[
                  {
                    icon: Globe,
                    title: t("businessPage.benefit1Title"),
                    desc: t("businessPage.benefit1Desc"),
                  },
                  {
                    icon: Clock,
                    title: t("businessPage.benefit2Title"),
                    desc: t("businessPage.benefit2Desc"),
                  },
                  {
                    icon: Users,
                    title: t("businessPage.benefit3Title"),
                    desc: t("businessPage.benefit3Desc"),
                  },
                  {
                    icon: Shield,
                    title: t("businessPage.benefit4Title"),
                    desc: t("businessPage.benefit4Desc"),
                  },
                ].map((b) => (
                  <li key={b.title} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <b.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{b.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex flex-wrap gap-3">
                {[
                  t("businessPage.featureTag1"),
                  t("businessPage.featureTag2"),
                  t("businessPage.featureTag3"),
                  t("businessPage.featureTag4"),
                ].map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 bg-muted/50 border border-border rounded-full px-3 py-1 text-xs"
                  >
                    <Check className="w-3 h-3 text-accent" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-sm mb-1">{t("businessPage.trustCompliance")}</h3>
              <p className="text-xs text-muted-foreground">
                {t("businessPage.trustComplianceDesc")}
              </p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-sm mb-1">{t("businessPage.trustTeam")}</h3>
              <p className="text-xs text-muted-foreground">{t("businessPage.trustTeamDesc")}</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Monitor className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-sm mb-1">{t("businessPage.trustScalable")}</h3>
              <p className="text-xs text-muted-foreground">
                {t("businessPage.trustScalableDesc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="onsite-track"
        className="py-16 md:py-20 bg-background"
        data-testid="section-onsite-track"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-muted text-muted-foreground rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <Wrench className="w-4 h-4" />
              {t("businessPage.onsiteLabel")}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              {t("businessPage.onsiteTrackTitle")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("businessPage.onsiteTrackSubtitle")}
            </p>
          </div>

          {Object.entries(handsOnByLocation).map(([loc, products]) => (
            <div key={loc} className="mb-10 last:mb-0">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg">
                  {locationKeys[loc] ? t(locationKeys[loc]) : loc}
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {products.map((p) => {
                  const isSelected = selectedOnsiteProducts.some((sp) => sp.id === p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleOnsiteProduct(p)}
                      className={`flex items-start gap-3 text-left rounded-lg border p-4 transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border bg-card hover:border-primary/40"
                      }`}
                      aria-pressed={isSelected}
                      data-testid={`product-select-${p.id}`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-primary" />
                        ) : (
                          <Square className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug">{p.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {typeof p.price === "number"
                            ? `$${p.price} ${t("bookTraining.perPerson")}`
                            : t("businessPage.callForPrice")}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-6" aria-live="polite">
            <div className="text-sm text-muted-foreground" data-testid="text-onsite-selection-count">
              {selectedOnsiteProducts.length > 0
                ? t("businessPage.selectedCount", { count: selectedOnsiteProducts.length })
                : t("businessPage.selectPrompt")}
            </div>
            <div className="flex gap-3">
              <Link href="/contact">
                <Button variant="outline" data-testid="button-request-onsite">
                  {t("businessPage.requestOnsiteQuote")}
                </Button>
              </Link>
              <Button
                className="bg-accent text-accent-foreground border-accent-border"
                disabled={selectedOnsiteProducts.length === 0}
                onClick={() => {
                  const slugs = selectedOnsiteProducts.map((p) => p.slug).join(",");
                  navigate(`/book-training?products=${encodeURIComponent(slugs)}`);
                }}
                data-testid="button-continue-booking"
              >
                {t("businessPage.continueToBooking")}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            {t("businessPage.needCustomOnsite")}
          </p>
        </div>
      </section>

      {/* Testimonials hidden until real reviews are collected per senior review Section B.8 */}

      <CTABand
        title={t("businessPage.ctaTitle")}
        subtitle={t("businessPage.ctaSubtitle")}
        primaryCta={{
          label: t("businessPage.ctaPrimary"),
          href: `/p/online-forklift-operator-training?seats=${seats}`,
        }}
        secondaryCta={{
          label: t("businessPage.ctaSecondary"),
          href: "/contact",
        }}
      />
    </>
  );
}
