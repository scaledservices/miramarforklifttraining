import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useCurrentLocale } from "@/hooks/useLocaleLocation";
import { brand } from "@shared/config/brand";
import { industry } from "@shared/config/industry";
import SEOHead from "@/components/seo/SEOHead";
import { SITE_URL } from "@/components/seo/siteUrl";
import OptimizedImage from "@/components/ui/optimized-image";
import { faqSchema, breadcrumbSchema } from "@/components/seo/StructuredData";
import { getServiceAreaCity, getAllServiceAreaCities } from "@/data/serviceAreas";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  MapPin,
  Clock,
  Shield,
  Award,
  Users,
  Truck,
  ClipboardList,
  Building2,
  ArrowRight,
  Phone,
} from "lucide-react";

interface ServiceAreaPageProps {
  city: string;
}

export default function ServiceAreaPage({ city: slug }: ServiceAreaPageProps) {
  const { t } = useTranslation();
  const locale = useCurrentLocale();
  const area = getServiceAreaCity(slug, locale);

  if (!area) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">{t("serviceAreas.notFoundTitle")}</h1>
        <Link href="/">
          <Button>{t("serviceAreas.backToHome")}</Button>
        </Link>
      </div>
    );
  }

  const BASE_URL = SITE_URL;
  const canonicalPath = `/service-areas/${slug}`;

  // LocalBusiness schema with serviceArea — NOT physical NAP
  const localBusinessWithServiceArea = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: brand.name,
    description: t("serviceAreas.schemaDescription", { city: area.city, state: area.state, body: industry.regulatory.body }),
    url: `${BASE_URL}${canonicalPath}`,
    telephone: brand.support.phoneE164,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: brand.address.street,
      addressLocality: brand.address.city,
      addressRegion: brand.address.state,
      postalCode: brand.address.zip,
      addressCountry: "US",
    },
    areaServed: {
      "@type": "City",
      name: area.city,
      addressRegion: area.stateAbbrev,
    },
    serviceType: "Onsite Forklift Training",
    hasOfferingCatalog: {
      "@type": "OfferCatalog",
      name: "Onsite Forklift Certification Programs",
      itemListElement: area.whatsIncluded.map((item) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: item.title,
          description: item.description,
        },
      })),
    },
  };

  const breadcrumbs = breadcrumbSchema(
    [
      { name: t("serviceAreas.breadcrumbHome"), url: "/" },
      { name: t("serviceAreas.breadcrumbHub"), url: "/service-areas" },
      { name: area.city, url: canonicalPath },
    ],
    locale
  );

  const faqs = faqSchema(area.faqs, locale);

  return (
    <>
      <SEOHead
        title={area.seo.title}
        description={area.seo.description}
        canonical={canonicalPath}
        jsonLd={[localBusinessWithServiceArea, breadcrumbs, faqs]}
      />

      {/* Hero */}
      <section className="relative text-white py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0">
          <OptimizedImage src="/images/hero-forklift.jpg" alt="" className="w-full h-full object-cover" loading="eager" fetchpriority="high" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(10,22%,14%)]/95 via-[hsl(10,22%,18%)]/85 to-[hsl(10,22%,23%)]/60" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4 bg-white/10 text-white border-white/20">
              <MapPin className="w-3 h-3 mr-1" /> {area.region}
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6 drop-shadow-md">
              {area.heroHeadline}
            </h1>
            <p className="text-lg sm:text-xl text-white/80 leading-relaxed mb-8 max-w-2xl">
              {area.heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/book-training">
                <Button size="lg" className="bg-accent text-accent-foreground border-accent-border" data-testid="hero-primary-cta">
                  {t("serviceAreas.bookCta")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <a href={`tel:${brand.support.phoneTel}`}>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" data-testid="hero-phone-cta">
                  <Phone className="w-4 h-4 mr-2" />
                  {brand.support.phone}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Intro + Service Area Description */}
      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-10">
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-4">
                  {t("serviceAreas.introHeading", { city: area.city })}
                </h2>
                <p className="text-muted-foreground leading-relaxed text-base">
                  {area.intro}
                </p>
              </div>

              {/* Industries Served */}
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-4">
                  {t("serviceAreas.industriesHeading", { city: area.city })}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {area.industriesServed.map((ind) => (
                    <div key={ind} className="flex items-start gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-brand-dark shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{ind}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Why Onsite */}
              <div className="bg-card border border-border rounded-lg p-6 md:p-8">
                <h2 className="text-2xl font-bold tracking-tight mb-4">
                  {area.whyOnsite.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {area.whyOnsite.description}
                </p>
              </div>
            </div>

            {/* Sidebar: Service Area + Quick Info */}
            <div>
              <Card className="border-border sticky top-20" data-testid="service-area-info-card">
                <CardContent className="p-0">
                  <div className="relative h-40 rounded-t-lg overflow-hidden">
                    <OptimizedImage src="/images/training-class.jpg" alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/85 via-brand-dark/20 to-transparent" />
                    <div className="absolute bottom-3 left-4">
                      <h3 className="font-bold text-lg text-white drop-shadow-md">{brand.name}</h3>
                      <p className="text-sm text-white/80">{t("serviceAreas.sidebarCaption", { city: area.city, state: area.stateAbbrev })}</p>
                    </div>
                  </div>
                </CardContent>
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-brand-dark shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{t("serviceAreas.serviceAreaLabel")}</p>
                      <p className="text-sm text-muted-foreground">{area.city}, {area.state}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-brand-dark shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{t("serviceAreas.phoneLabel")}</p>
                      <a href={`tel:${brand.support.phoneTel}`} className="text-sm text-brand-orange font-medium hover:underline">{brand.support.phone}</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-brand-dark shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{t("serviceAreas.schedulingLabel")}</p>
                      <p className="text-sm text-muted-foreground">{t("serviceAreas.schedulingHours")}<br />{t("serviceAreas.schedulingFlexible")}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-brand-dark shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{t("serviceAreas.languagesLabel")}</p>
                      <p className="text-sm text-muted-foreground">{t("serviceAreas.languagesList")}</p>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-brand-green" />
                      <span>{t("serviceAreas.checkOshaAligned", { body: industry.regulatory.body })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-brand-green" />
                      <span>{t("serviceAreas.checkSameDay")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-brand-green" />
                      <span>{t("serviceAreas.checkYourEquipment")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-brand-green" />
                      <span>{t("serviceAreas.checkVolumeDiscounts")}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link href="/book-training">
                      <Button className="w-full bg-accent text-accent-foreground" data-testid="button-request-quote">
                        {t("serviceAreas.bookCta")}
                      </Button>
                    </Link>
                    <a href={`tel:${brand.support.phoneTel}`}>
                      <Button variant="outline" className="w-full" data-testid="button-call">
                        {t("serviceAreas.callButton", { phone: brand.support.phone })}
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 md:py-20 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-brand-orange text-sm font-semibold uppercase tracking-wider">{t("serviceAreas.includedTag")}</span>
            <h2 className="text-3xl font-bold mt-2 mb-4 tracking-tight">
              {t("serviceAreas.includedHeading", { city: area.city })}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t("serviceAreas.includedSubtitle", { body: industry.regulatory.body })}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {area.whatsIncluded.map((item) => {
              const icons = [
                <ClipboardList key="0" className="w-7 h-7 text-brand-dark" />,
                <Truck key="1" className="w-7 h-7 text-brand-dark" />,
                <Shield key="2" className="w-7 h-7 text-brand-dark" />,
                <Award key="3" className="w-7 h-7 text-brand-dark" />,
                <CheckCircle key="4" className="w-7 h-7 text-brand-dark" />,
                <Users key="5" className="w-7 h-7 text-brand-dark" />,
              ];
              const idx = area.whatsIncluded.indexOf(item);
              return (
                <Card key={item.title} className="border-border">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center mb-5">
                      {icons[idx % icons.length]}
                    </div>
                    <h3 className="font-bold text-base mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Areas Served */}
      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight mb-3">
              {t("serviceAreas.areasNearHeading", { city: area.city })}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t("serviceAreas.areasNearSubtitle", { region: area.region })}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
            {area.nearbyAreas.map((area_name) => (
              <Badge
                key={area_name}
                variant="secondary"
                className="px-4 py-2 text-sm bg-muted text-muted-foreground border border-border"
              >
                <MapPin className="w-3 h-3 mr-1.5 text-brand-dark" />
                {area_name}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20 bg-card border-y border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              {t("serviceAreas.faqHeading", { city: area.city })}
            </h2>
            <p className="text-muted-foreground">
              {t("serviceAreas.faqSubtitle")}
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {area.faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-left text-sm font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Other Service Areas */}
      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold tracking-tight mb-3">{t("serviceAreas.otherAreasHeading")}</h2>
            <p className="text-muted-foreground">{t("serviceAreas.otherAreasSubtitle")}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {getAllServiceAreaCities(locale)
              .filter((c) => c.slug !== slug)
              .map((c) => (
                <Link key={c.slug} href={`/service-areas/${c.slug}`}>
                  <Button variant="outline" className="gap-2" data-testid={`link-service-area-${c.slug}`}>
                    <MapPin className="w-4 h-4 text-brand-dark" />
                    {c.city}, {c.stateAbbrev}
                  </Button>
                </Link>
              ))}
            <Link href="/locations">
              <Button variant="ghost" className="gap-2">
                <Building2 className="w-4 h-4" />
                {t("serviceAreas.viewFacilities")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Band */}
      <section className="bg-gradient-to-r from-brand-dark to-[hsl(10,22%,16%)] py-14 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
            {area.ctaTitle}
          </h2>
          <p className="text-base text-white/80 mb-8 max-w-2xl mx-auto">
            {area.ctaSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/book-training">
              <Button
                size="lg"
                className="bg-accent text-accent-foreground border-accent-border"
                data-testid="cta-band-primary"
              >
                {t("serviceAreas.bookCta")}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <a href={`tel:${brand.support.phoneTel}`}>
              <Button size="lg" variant="outline" className="border-white/30 text-white bg-white/5">
                <Phone className="w-4 h-4 mr-2" />
                {brand.support.phone}
              </Button>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
