import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useCurrentLocale } from "@/hooks/useLocaleLocation";
import { brand } from "@shared/config/brand";
import { industry } from "@shared/config/industry";
import { getIndustryBySlug, type IndustryData } from "@shared/config/industries";
import SEOHead from "@/components/seo/SEOHead";
import { SITE_URL } from "@/components/seo/siteUrl";
import { faqSchema, breadcrumbSchema } from "@/components/seo/StructuredData";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Shield,
  Award,
  Users,
  Truck,
  ClipboardList,
  ArrowRight,
  Phone,
  Factory,
  Building2,
  Wrench,
  HardHat,
  Package,
  Boxes,
  Ship,
  Trees,
} from "lucide-react";

interface IndustryLandingProps {
  slug: string;
}

const INDUSTRY_ICONS: Record<string, typeof Factory> = {
  warehousing: Boxes,
  logistics: Truck,
  construction: HardHat,
  manufacturing: Factory,
  retail: Package,
  "food-beverage": Boxes,
  "lumber-building-materials": Trees,
  "shipping-ports": Ship,
};

export default function IndustryLanding({ slug }: IndustryLandingProps) {
  const { t } = useTranslation();
  const locale = useCurrentLocale();
  const data: IndustryData | undefined = getIndustryBySlug(slug);

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">{t("industries.notFoundTitle")}</h1>
        <Link href="/industries">
          <Button>{t("industries.backToHub")}</Button>
        </Link>
      </div>
    );
  }

  const isEs = locale === "es";
  const name = isEs ? data.nameEs : data.name;
  const description = isEs ? data.descriptionEs : data.description;
  const heroSubtitle = isEs ? data.heroSubtitleEs : data.heroSubtitle;
  const whyMiramar = isEs ? data.whyMiramarEs : data.whyMiramar;
  const faqs = isEs ? data.faqsEs : data.faqs;

  const BASE_URL = SITE_URL;
  const canonicalPath = `/industries/${slug}`;

  // Industry-specific schema (Service schema with industry audience)
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: isEs
      ? `Certificacion de Montacargas para ${name}`
      : `Forklift Certification for ${name}`,
    description,
    provider: {
      "@type": "Organization",
      name: brand.name,
      telephone: brand.support.phoneE164,
      url: BASE_URL,
    },
    serviceType: "Forklift Certification and Training",
    areaServed: [
      { "@type": "City", name: "San Diego", addressRegion: "CA" },
      { "@type": "City", name: "Las Vegas", addressRegion: "NV" },
      { "@type": "City", name: "Fresno", addressRegion: "CA" },
    ],
    audience: {
      "@type": "BusinessAudience",
      name,
    },
    url: `${BASE_URL}${canonicalPath}`,
  };

  const breadcrumbs = breadcrumbSchema(
    [
      { name: t("industries.breadcrumbHome"), url: "/" },
      { name: t("industries.breadcrumbHub"), url: "/industries" },
      { name, url: canonicalPath },
    ],
    locale
  );

  const faqJsonLd = faqSchema(faqs, locale);

  const seoTitle = isEs
    ? `Certificacion de Montacargas para ${name} | San Diego, Las Vegas y Fresno`
    : `Forklift Certification for ${name} in San Diego, Las Vegas & Fresno`;

  const Icon = INDUSTRY_ICONS[slug] || Factory;

  return (
    <>
      <SEOHead
        title={seoTitle}
        description={description}
        canonical={canonicalPath}
        jsonLd={[serviceSchema, breadcrumbs, faqJsonLd]}
      />

      {/* Hero */}
      <section className="relative text-white py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(10,22%,14%)]/95 via-[hsl(10,22%,18%)]/85 to-[hsl(10,22%,23%)]/60" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4 bg-white/10 text-white border-white/20">
              <Icon className="w-3 h-3 mr-1" /> {t("industries.heroBadge", { name })}
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6 drop-shadow-md">
              {isEs
                ? `Certificacion de Montacargas para ${name} en San Diego, Las Vegas y Fresno`
                : `Forklift Certification for ${name} in San Diego, Las Vegas & Fresno`}
            </h1>
            <p className="text-lg sm:text-xl text-white/80 leading-relaxed mb-8 max-w-2xl">
              {heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/get-certified">
                <Button size="lg" className="bg-accent text-accent-foreground border-accent-border" data-testid="industry-hero-primary-cta">
                  {t("industries.ctaCertify")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <a href={`tel:${brand.support.phoneTel}`}>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" data-testid="industry-hero-phone-cta">
                  <Phone className="w-4 h-4 mr-2" />
                  {brand.support.phone}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* OSHA Requirements */}
      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div>
              <span className="text-brand-orange text-sm font-semibold uppercase tracking-wider">
                {t("industries.oshaTag", { body: industry.regulatory.body })}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-2 mb-4">
                {t("industries.oshaHeading", { name })}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                {t("industries.oshaIntro", { name, body: industry.regulatory.body, standard: industry.regulatory.standard })}
              </p>
              <ul className="space-y-3">
                {data.oshaConcerns.map((concern, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-brand-dark shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground leading-relaxed">{concern}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Common Equipment */}
            <div className="bg-card border border-border rounded-lg p-6 md:p-8">
              <h2 className="text-2xl font-bold tracking-tight mb-4">
                {t("industries.equipmentHeading", { name })}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                {t("industries.equipmentIntro", { name })}
              </p>
              <div className="space-y-3">
                {data.equipment.map((eq, i) => (
                  <div key={i} className="flex items-center gap-3 bg-muted/50 rounded-lg px-4 py-3">
                    <Wrench className="w-5 h-5 text-brand-dark shrink-0" />
                    <span className="text-sm font-medium">{eq}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Miramar */}
      <section className="py-16 md:py-20 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-brand-orange text-sm font-semibold uppercase tracking-wider">
              {t("industries.whyMiramarTag")}
            </span>
            <h2 className="text-3xl font-bold mt-2 mb-4 tracking-tight">
              {t("industries.whyMiramarHeading", { brand: brand.name, name })}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t("industries.whyMiramarSubtitle", { name })}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {whyMiramar.map((reason, i) => {
              const icons = [
                <Truck key="0" className="w-7 h-7 text-brand-dark" />,
                <Award key="1" className="w-7 h-7 text-brand-dark" />,
                <CheckCircle key="2" className="w-7 h-7 text-brand-dark" />,
                <Users key="3" className="w-7 h-7 text-brand-dark" />,
              ];
              return (
                <Card key={i} className="border-border">
                  <CardContent className="p-6 flex items-start gap-5">
                    <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                      {icons[i % icons.length]}
                    </div>
                    <div>
                      <p className="text-sm leading-relaxed font-medium">{reason}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-3">
                <Shield className="w-7 h-7 text-brand-dark" />
              </div>
              <p className="font-bold text-sm">{t("industries.trustOsha", { body: industry.regulatory.body })}</p>
            </div>
            <div>
              <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-7 h-7 text-brand-dark" />
              </div>
              <p className="font-bold text-sm">{t("industries.trustSameDay")}</p>
            </div>
            <div>
              <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-3">
                <Truck className="w-7 h-7 text-brand-dark" />
              </div>
              <p className="font-bold text-sm">{t("industries.trustOnsite")}</p>
            </div>
            <div>
              <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-3">
                <Award className="w-7 h-7 text-brand-dark" />
              </div>
              <p className="font-bold text-sm">{t("industries.trustExperienced")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20 bg-card border-y border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              {t("industries.faqHeading", { name })}
            </h2>
            <p className="text-muted-foreground">
              {t("industries.faqSubtitle")}
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
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

      {/* Other Industries */}
      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold tracking-tight mb-3">{t("industries.otherIndustriesHeading")}</h2>
            <p className="text-muted-foreground">{t("industries.otherIndustriesSubtitle")}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/industries">
              <Button variant="ghost" className="gap-2" data-testid="link-industries-hub">
                <Building2 className="w-4 h-4" />
                {t("industries.viewAllIndustries")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Band */}
      <section className="bg-gradient-to-r from-brand-dark to-[hsl(10,22%,16%)] py-14 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
            {t("industries.ctaBandTitle", { name })}
          </h2>
          <p className="text-base text-white/80 mb-8 max-w-2xl mx-auto">
            {t("industries.ctaBandSubtitle")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/get-certified">
              <Button
                size="lg"
                className="bg-accent text-accent-foreground border-accent-border"
                data-testid="industry-cta-band-primary"
              >
                {t("industries.ctaCertify")}
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
