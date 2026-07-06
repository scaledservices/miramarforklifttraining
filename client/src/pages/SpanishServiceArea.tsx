import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { brand } from "@shared/config/brand";
import { industry } from "@shared/config/industry";
import SEOHead from "@/components/seo/SEOHead";
import { SITE_URL } from "@/components/seo/siteUrl";
import { organizationSchema, breadcrumbSchema, faqSchema } from "@/components/seo/StructuredData";
import { useCurrentLocale } from "@/hooks/useLocaleLocation";
import OptimizedImage from "@/components/ui/optimized-image";
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
  Building2,
  ArrowRight,
  Phone,
} from "lucide-react";

interface SpanishServiceAreaProps {
  city: string;
}

const CITY_DATA: Record<string, {
  city: string;
  state: string;
  stateAbbrev: string;
  slug: string;
  address: string;
  phone: string;
  hours: string;
  heroImage: string;
  nearbyAreas: string[];
}> = {
  "san-diego": {
    city: "San Diego",
    state: "California",
    stateAbbrev: "CA",
    slug: "san-diego",
    address: "6365 Marindustry Dr #A, San Diego, CA 92121",
    phone: brand.support.phone,
    hours: "Lunes a Viernes: 7:00 AM - 5:00 PM",
    heroImage: "/images/san-diego.jpg",
    nearbyAreas: ["Chula Vista", "Escondido", "El Cajon", "Oceanside", "Carlsbad", "Temecula", "National City", "Santee"],
  },
  "las-vegas": {
    city: "Las Vegas",
    state: "Nevada",
    stateAbbrev: "NV",
    slug: "las-vegas",
    address: "3301 Martin Ave Suite A, Las Vegas, NV 89118",
    phone: brand.support.phone,
    hours: "Lunes a Viernes: 7:00 AM - 5:00 PM",
    heroImage: "/images/las-vegas.jpg",
    nearbyAreas: ["Henderson", "North Las Vegas", "Spring Valley", "Summerlin", "Enterprise", "Boulder City", "Paradise", "Sunrise Manor"],
  },
  "fresno": {
    city: "Fresno",
    state: "California",
    stateAbbrev: "CA",
    slug: "fresno",
    address: "3515 N. Sabre Drive, Fresno, CA 93727",
    phone: brand.support.phone,
    hours: "Con cita previa - Llame para programar",
    heroImage: "/images/fresno-city.jpg",
    nearbyAreas: ["Clovis", "Madera", "Visalia", "Selma", "Sanger", "Kingsburg", "Hanford", "Tulare"],
  },
};

export default function SpanishServiceArea({ city: slug }: SpanishServiceAreaProps) {
  const { t } = useTranslation();
  const locale = useCurrentLocale();
  const data = CITY_DATA[slug];

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Ciudad no encontrada</h1>
        <Link href="/es/certificacion-montacargas">
          <Button>Volver a la pagina de certificacion</Button>
        </Link>
      </div>
    );
  }

  const canonicalPath = `/certificacion-montacargas-${slug}`;
  const BASE_URL = SITE_URL;

  const faqs = [
    {
      question: t("spanishServiceArea.faq1Q", { city: data.city }),
      answer: t("spanishServiceArea.faq1A", { city: data.city, body: industry.regulatory.body }),
    },
    {
      question: t("spanishServiceArea.faq2Q", { city: data.city }),
      answer: t("spanishServiceArea.faq2A", { city: data.city }),
    },
    {
      question: t("spanishServiceArea.faq3Q", { city: data.city }),
      answer: t("spanishServiceArea.faq3A", { city: data.city, body: industry.regulatory.body }),
    },
    {
      question: t("spanishServiceArea.faq4Q", { city: data.city }),
      answer: t("spanishServiceArea.faq4A"),
    },
  ];

  const faqJsonLd = faqSchema(faqs, "es");

  const breadcrumbs = breadcrumbSchema(
    [
      { name: "Inicio", url: "/" },
      { name: "Certificacion de Montacargas", url: "/certificacion-montacargas" },
      { name: data.city, url: canonicalPath },
    ],
    "es"
  );

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${BASE_URL}/es${canonicalPath}#business`,
    name: `${brand.name} - ${data.city}`,
    description: t("spanishServiceArea.schemaDescription", { city: data.city, state: data.state, body: industry.regulatory.body }),
    url: `${BASE_URL}/es${canonicalPath}`,
    telephone: brand.support.phoneE164,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: data.address.split(",")[0],
      addressLocality: data.city,
      addressRegion: data.stateAbbrev,
      addressCountry: "US",
    },
    areaServed: {
      "@type": "City",
      name: data.city,
      addressRegion: data.stateAbbrev,
    },
    serviceType: t("spanishServiceArea.serviceType"),
    inLanguage: "es",
    parentOrganization: {
      "@type": "Organization",
      name: brand.name,
      url: BASE_URL,
    },
  };

  return (
    <>
      <SEOHead
        title={t("spanishServiceArea.seoTitle", { city: data.city, stateAbbrev: data.stateAbbrev })}
        description={t("spanishServiceArea.seoDescription", { city: data.city, body: industry.regulatory.body })}
        canonical={canonicalPath}
        jsonLd={[localBusinessSchema, breadcrumbs, faqJsonLd]}
      />

      {/* Hero */}
      <section className="relative text-white py-20 md:py-28 overflow-hidden" data-testid="spanish-service-hero">
        <div className="absolute inset-0">
          <OptimizedImage src={data.heroImage} alt="" className="w-full h-full object-cover" loading="eager" fetchpriority="high" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(10,22%,14%)]/95 via-[hsl(10,22%,18%)]/85 to-[hsl(10,22%,23%)]/60" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4 bg-white/10 text-white border-white/20">
              <MapPin className="w-3 h-3 mr-1" /> {data.city}, {data.stateAbbrev}
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6 drop-shadow-md" data-testid="spanish-service-title">
              {t("spanishServiceArea.heroTitle", { city: data.city })}
            </h1>
            <p className="text-lg sm:text-xl text-white/80 leading-relaxed mb-8 max-w-2xl">
              {t("spanishServiceArea.heroSubtitle", { city: data.city, body: industry.regulatory.body })}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/es/get-certified">
                <Button size="lg" className="bg-accent text-accent-foreground border-accent-border" data-testid="spanish-service-cta">
                  {t("spanishServiceArea.ctaButton")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <a href={`tel:${brand.support.phoneTel}`}>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" data-testid="spanish-service-phone">
                  <Phone className="w-4 h-4 mr-2" />
                  {brand.support.phone}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Intro + Info Sidebar */}
      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-10">
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-4">
                  {t("spanishServiceArea.introHeading", { city: data.city })}
                </h2>
                <p className="text-muted-foreground leading-relaxed text-base">
                  {t("spanishServiceArea.introText", { city: data.city, state: data.state, body: industry.regulatory.body })}
                </p>
              </div>

              {/* Industries Served */}
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-4">
                  {t("spanishServiceArea.industriesHeading", { city: data.city })}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(t("spanishServiceArea.industriesList", { returnObjects: true }) as string[]).map((ind) => (
                    <div key={ind} className="flex items-start gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-brand-dark shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{ind}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Why Choose Us */}
              <div className="bg-card border border-border rounded-lg p-6 md:p-8">
                <h2 className="text-2xl font-bold tracking-tight mb-4">
                  {t("spanishServiceArea.whyUsTitle", { city: data.city })}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t("spanishServiceArea.whyUsText", { city: data.city, body: industry.regulatory.body })}
                </p>
              </div>
            </div>

            {/* Sidebar */}
            <div>
              <Card className="border-border sticky top-20" data-testid="spanish-service-info-card">
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-brand-dark shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{t("spanishServiceArea.addressLabel")}</p>
                      <p className="text-sm text-muted-foreground">{data.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-brand-dark shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{t("spanishServiceArea.phoneLabel")}</p>
                      <a href={`tel:${brand.support.phoneTel}`} className="text-sm text-brand-orange font-medium hover:underline">{data.phone}</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-brand-dark shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{t("spanishServiceArea.hoursLabel")}</p>
                      <p className="text-sm text-muted-foreground">{data.hours}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-brand-dark shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{t("spanishServiceArea.languagesLabel")}</p>
                      <p className="text-sm text-muted-foreground">{t("spanishServiceArea.languagesList")}</p>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-brand-green" />
                      <span>{t("spanishServiceArea.checkOsha", { body: industry.regulatory.body })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-brand-green" />
                      <span>{t("spanishServiceArea.checkSameDay")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-brand-green" />
                      <span>{t("spanishServiceArea.checkOnsite")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-brand-green" />
                      <span>{t("spanishServiceArea.checkBilingual")}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link href="/es/get-certified">
                      <Button className="w-full bg-accent text-accent-foreground">
                        {t("spanishServiceArea.ctaButton")}
                      </Button>
                    </Link>
                    <a href={`tel:${brand.support.phoneTel}`}>
                      <Button variant="outline" className="w-full">
                        {t("spanishServiceArea.callButton", { phone: brand.support.phone })}
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* OSHA Requirements */}
      <section className="py-16 md:py-20 bg-card border-y border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4 tracking-tight">
              {t("spanishServiceArea.oshaTitle", { city: data.city })}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t("spanishServiceArea.oshaSubtitle", { body: industry.regulatory.body })}
            </p>
          </div>
          <Card className="border-border">
            <CardContent className="p-6 md:p-8 space-y-4">
              {[
                t("spanishServiceArea.oshaReq1", { body: industry.regulatory.body }),
                t("spanishServiceArea.oshaReq2"),
                t("spanishServiceArea.oshaReq3"),
                t("spanishServiceArea.oshaReq4"),
                t("spanishServiceArea.oshaReq5"),
              ].map((req, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                  <p className="text-muted-foreground leading-relaxed">{req}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Areas Served */}
      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight mb-3">
              {t("spanishServiceArea.areasNearTitle", { city: data.city })}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t("spanishServiceArea.areasNearSubtitle", { city: data.city, state: data.state })}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
            {data.nearbyAreas.map((area_name) => (
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
              {t("spanishServiceArea.faqTitle", { city: data.city })}
            </h2>
            <p className="text-muted-foreground">
              {t("spanishServiceArea.faqSubtitle")}
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

      {/* Other Cities */}
      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold tracking-tight mb-3">{t("spanishServiceArea.otherCitiesTitle")}</h2>
            <p className="text-muted-foreground">{t("spanishServiceArea.otherCitiesSubtitle")}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {Object.values(CITY_DATA)
              .filter((c) => c.slug !== slug)
              .map((c) => (
                <Link key={c.slug} href={`/es/certificacion-montacargas-${c.slug}`}>
                  <Button variant="outline" className="gap-2" data-testid={`spanish-other-city-${c.slug}`}>
                    <MapPin className="w-4 h-4 text-brand-dark" />
                    {c.city}, {c.stateAbbrev}
                  </Button>
                </Link>
              ))}
            <Link href="/es/certificacion-montacargas">
              <Button variant="ghost" className="gap-2">
                <Shield className="w-4 h-4" />
                {t("spanishServiceArea.allCitiesLink")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Band */}
      <section className="bg-gradient-to-r from-brand-dark to-[hsl(10,22%,16%)] py-14 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
            {t("spanishServiceArea.ctaBandTitle", { city: data.city })}
          </h2>
          <p className="text-base text-white/80 mb-8 max-w-2xl mx-auto">
            {t("spanishServiceArea.ctaBandSubtitle", { city: data.city })}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/es/get-certified">
              <Button
                size="lg"
                className="bg-accent text-accent-foreground border-accent-border"
                data-testid="spanish-service-cta-band-primary"
              >
                {t("spanishServiceArea.ctaButton")}
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
