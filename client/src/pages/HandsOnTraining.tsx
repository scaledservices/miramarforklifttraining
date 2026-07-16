import { useState } from "react";
import Hero from "@/components/sections/Hero";
import CTABand from "@/components/sections/CTABand";
import ProductCard from "@/components/sections/ProductCard";
import { useTranslation } from "react-i18next";
import SEOHead from "@/components/seo/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { getProductsByCategory } from "@/data/catalog";
import { getActiveLocations } from "@shared/config/locations";
import { MapPin, Users, CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import AvailabilityChecker from "@/components/booking/AvailabilityChecker";
import { industry } from "@shared/config/industry";

export default function HandsOnTraining() {
  const { t } = useTranslation();

  // One facility at a time: the customer picks a location and only that
  // location's details and programs are shown (Alberto demo feedback,
  // 2026-07-13) — never the combined list of every location.
  const facilities = getActiveLocations();
  const [selectedSlug, setSelectedSlug] = useState(facilities[0]?.slug ?? "san-diego");
  const selectedFacility = facilities.find((f) => f.slug === selectedSlug);

  const products = getProductsByCategory("hands-on").filter(
    (p) => p.location === selectedSlug
  );

  return (
    <>
      <SEOHead
        title={t("seo.handsOnTraining.title")}
        description={t("seo.handsOnTraining.description", { body: industry.regulatory.body })}
        canonical="/hands-on-training"
      />
      <Hero
        image="/images/training-class.jpg"
        imageAlt={t("productImages.trainingClass")}
        title={t("handsOnPage.heroTitle")}
        subtitle={t("handsOnPage.heroSubtitle")}
        primaryCta={{ label: t("handsOnPage.requestOnSite"), href: "/request-onsite-training" }}
        secondaryCta={{ label: t("handsOnPage.checkAvailability"), href: "#availability" }}
      />

      <section id="availability" className="py-12 bg-card border-b">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="text-xl font-bold mb-2">{t("handsOnPage.checkYourArea")}</h2>
          <p className="text-sm text-muted-foreground mb-6">{t("handsOnPage.checkYourAreaDesc")}</p>
          <AvailabilityChecker />
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight mb-2">{t("handsOnPage.serviceAreas")}</h2>
            <p className="text-muted-foreground text-sm">{t("handsOnPage.serviceAreasDesc")}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {facilities.map((facility) => {
              const isSelected = facility.slug === selectedSlug;
              return (
                <div
                  key={facility.slug}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedSlug(facility.slug)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedSlug(facility.slug);
                    }
                  }}
                  className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl"
                  data-testid={`card-region-${facility.slug}`}
                >
                  <Card
                    className={`transition-all cursor-pointer h-full ${
                      isSelected
                        ? "border-2 border-accent shadow-md ring-1 ring-accent/20"
                        : "border-border hover:shadow-md hover:border-primary/40"
                    }`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className={`w-4 h-4 ${isSelected ? "text-brand-orange" : "text-accent"}`} />
                        <h3 className="font-semibold">{facility.displayName}</h3>
                        {isSelected && <CheckCircle className="w-4 h-4 text-brand-green ml-auto" />}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{facility.address.full}</p>
                      <Link
                        href={`/locations/${facility.slug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm text-orange-600 font-medium flex items-center gap-1 hover:underline"
                        data-testid={`link-region-details-${facility.slug}`}
                      >
                        {t("handsOnPage.viewDetails")} <ArrowRight className="w-3 h-3" />
                      </Link>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>

          {selectedFacility && (
            <div className="max-w-2xl mx-auto text-center bg-accent/10 border border-accent rounded-lg px-5 py-3 mb-6" data-testid="selected-facility-address">
              <p className="text-sm font-semibold text-foreground">
                {t("handsOnPage.selectedFacilityLabel", { location: selectedFacility.displayName })}
              </p>
              <p className="text-sm text-muted-foreground">{selectedFacility.address.full}</p>
            </div>
          )}
        </div>
      </section>

      <section className="py-16 md:py-20 bg-background border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight mb-1">{t("handsOnPage.availablePrograms")}</h2>
            <p className="text-muted-foreground text-sm">
              {t("handsOnPage.availableProgramsForLocation", { location: selectedFacility?.displayName ?? "" })}
            </p>
          </div>

          <div className="space-y-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} variant="full" ctaLabelOverride={t("handsOnPage.requestOnSiteTraining")} ctaHrefOverride="/request-onsite-training" />
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-card border-t">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-1">{t("handsOnPage.atYourFacility")}</h3>
              <p className="text-sm text-muted-foreground">{t("handsOnPage.atYourFacilityDesc")}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-1">{t("handsOnPage.flexibleGroups")}</h3>
              <p className="text-sm text-muted-foreground">{t("handsOnPage.flexibleGroupsDesc")}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-1">{t("handsOnPage.sameDayCert")}</h3>
              <p className="text-sm text-muted-foreground">{t("handsOnPage.sameDayCertDesc", { body: industry.regulatory.body })}</p>
            </div>
          </div>
        </div>
      </section>

      <CTABand
        title={t("handsOnPage.ctaTitle")}
        subtitle={t("handsOnPage.ctaSubtitle", { body: industry.regulatory.body })}
        primaryCta={{ label: t("handsOnPage.startOnline"), href: "/online-forklift-certification" }}
        secondaryCta={{ label: t("cta.contactUs"), href: "/contact" }}
      />
    </>
  );
}
