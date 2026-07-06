import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { brand } from "@shared/config/brand";
import { industry } from "@shared/config/industry";
import SEOHead from "@/components/seo/SEOHead";
import { organizationSchema, breadcrumbSchema, faqSchema } from "@/components/seo/StructuredData";
import { useCurrentLocale } from "@/hooks/useLocaleLocation";
import OptimizedImage from "@/components/ui/optimized-image";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Award, Clock, MapPin, Wrench, Users,
  ArrowRight, CheckCircle, Building2, RefreshCw, Phone,
} from "lucide-react";

const CITY_LINKS = [
  { city: "San Diego", slug: "san-diego", stateAbbrev: "CA" },
  { city: "Las Vegas", slug: "las-vegas", stateAbbrev: "NV" },
  { city: "Fresno", slug: "fresno", stateAbbrev: "CA" },
];

export default function SpanishLanding() {
  const { t } = useTranslation();
  const locale = useCurrentLocale();

  const faqs = [
    {
      question: "¿Cuánto cuesta la certificacion de montacargas?",
      answer:
        "La certificacion practica en nuestras instalaciones cuesta desde $200 por persona. La certificacion en linea cuesta $59.99. Para capacitacion en sitio para su equipo, ofrecemos descuentos por volumen a partir de 5 operadores. Llame al (858) 901-0149 para obtener una cotizacion personalizada.",
    },
    {
      question: "¿Cuanto tarda la certificacion de montacargas?",
      answer:
        "La capacitacion practica presencial se completa en un solo dia, y usted sale con su tarjeta de certificacion el mismo dia. La certificacion en linea se completa en aproximadamente 2 horas a su propio ritmo.",
    },
    {
      question: "¿Es valida la certificacion para OSHA?",
      answer:
        "Si. Nuestros programas cumplen con el estandar 29 CFR 1910.178 de OSHA sobre vehiculos industriales motorizados. La certificacion es reconocida por OSHA y valida por 3 anos en todo Estados Unidos.",
    },
    {
      question: "¿Pueden capacitar a mi equipo en nuestras instalaciones?",
      answer:
        "Si. Viajamos a su lugar de trabajo con todo el equipo y materiales necesarios. Capacitamos a sus operadores en el equipo que usan cada dia. Ofrecemos capacitacion en sitio en San Diego, Las Vegas, Fresno y areas cercanas.",
    },
    {
      question: "¿Cada cuando necesito renovar mi certificacion?",
      answer:
        "OSHA requiere que los operadores de montacargas sean evaluados cada 3 anos. Si su certificacion ha expirado, puede renovarla en linea en aproximadamente 2 horas. Si cambio de equipo o de trabajo, necesita una nueva evaluacion.",
    },
  ];

  const faqJsonLd = faqSchema(faqs, "es");

  const breadcrumbs = breadcrumbSchema(
    [
      { name: "Inicio", url: "/" },
      { name: "Certificacion de Montacargas", url: "/certificacion-montacargas" },
    ],
    "es"
  );

  const buyerPaths = [
    {
      icon: Building2,
      title: t("spanishLanding.buyerPath1Title"),
      desc: t("spanishLanding.buyerPath1Desc"),
      features: [
        t("spanishLanding.buyerPath1F1"),
        t("spanishLanding.buyerPath1F2"),
        t("spanishLanding.buyerPath1F3"),
      ],
      popular: true,
      testId: "spanish-card-b2b",
    },
    {
      icon: Users,
      title: t("spanishLanding.buyerPath2Title"),
      desc: t("spanishLanding.buyerPath2Desc"),
      features: [
        t("spanishLanding.buyerPath2F1"),
        t("spanishLanding.buyerPath2F2"),
        t("spanishLanding.buyerPath2F3"),
      ],
      popular: false,
      testId: "spanish-card-self",
    },
    {
      icon: RefreshCw,
      title: t("spanishLanding.buyerPath3Title"),
      desc: t("spanishLanding.buyerPath3Desc"),
      features: [
        t("spanishLanding.buyerPath3F1"),
        t("spanishLanding.buyerPath3F2"),
        t("spanishLanding.buyerPath3F3"),
      ],
      popular: false,
      testId: "spanish-card-renew",
    },
  ];

  return (
    <>
      <SEOHead
        title={t("spanishLanding.seoTitle")}
        description={t("spanishLanding.seoDescription")}
        canonical="/certificacion-montacargas"
        jsonLd={[organizationSchema("es"), breadcrumbs, faqJsonLd]}
      />

      {/* Hero */}
      <section className="relative text-white py-20 md:py-28 overflow-hidden" data-testid="spanish-hero">
        <div className="absolute inset-0">
          <OptimizedImage
            src="/images/hero-forklift.jpg"
            alt="Certificacion de montacargas"
            className="w-full h-full object-cover"
            loading="eager"
            fetchpriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(10,22%,14%)]/95 via-[hsl(10,22%,18%)]/85 to-[hsl(10,22%,23%)]/55" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4 bg-white/10 text-white border-white/20">
              <Shield className="w-3 h-3 mr-1" /> {t("spanishLanding.heroBadge")}
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6 drop-shadow-md" data-testid="spanish-hero-title">
              {t("spanishLanding.heroTitle")}
            </h1>
            <p className="text-lg sm:text-xl text-white/80 leading-relaxed mb-8 max-w-2xl">
              {t("spanishLanding.heroSubtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/es/get-certified">
                <Button size="lg" className="bg-accent text-accent-foreground border-accent-border" data-testid="spanish-hero-cta">
                  {t("spanishLanding.heroCta")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <a href={`tel:${brand.support.phoneTel}`}>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" data-testid="spanish-hero-phone">
                  <Phone className="w-4 h-4 mr-2" />
                  {brand.support.phone}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-12 md:py-14 bg-brand-dark text-white" data-testid="spanish-trust">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <Shield className="w-8 h-8 text-accent" />
              <span className="text-sm font-semibold">{t("spanishLanding.trustOsha")}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Clock className="w-8 h-8 text-accent" />
              <span className="text-sm font-semibold">{t("spanishLanding.trustSameDay")}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <MapPin className="w-8 h-8 text-accent" />
              <span className="text-sm font-semibold">{t("spanishLanding.trustLocations")}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Award className="w-8 h-8 text-accent" />
              <span className="text-sm font-semibold">{t("spanishLanding.trustExperience")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Buyer Paths */}
      <section className="py-16 md:py-20 bg-card border-y border-border" data-testid="spanish-buyer-paths">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-brand-orange text-sm font-semibold uppercase tracking-wider">{t("spanishLanding.buyerPathsLabel")}</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4 tracking-tight">{t("spanishLanding.buyerPathsTitle")}</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">{t("spanishLanding.buyerPathsSubtitle")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {buyerPaths.map((card) => (
              <Link key={card.testId} href="/es/get-certified" className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl block">
                <Card
                  className={`group relative overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 h-full ${
                    card.popular
                      ? "border-2 border-accent shadow-md ring-1 ring-accent/20"
                      : "border-border hover:border-primary/40"
                  }`}
                  data-testid={card.testId}
                >
                  <CardContent className={`p-6 flex flex-col h-full ${card.popular ? "pt-10" : ""}`}>
                    {card.popular && (
                      <div className="absolute top-0 left-0 right-0 bg-accent text-accent-foreground text-xs font-semibold text-center py-1.5">
                        {t("spanishLanding.mostPopular")}
                      </div>
                    )}
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                      <card.icon className="w-7 h-7 text-brand-dark" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{card.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-5">{card.desc}</p>
                    <ul className="space-y-2 mb-6 flex-1">
                      {card.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 shrink-0 text-brand-green" />
                          <span className="text-muted-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <div className={`w-full inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                      card.popular
                        ? "bg-accent text-accent-foreground"
                        : "border border-input bg-background hover:bg-accent/5"
                    }`}>
                      {t("spanishLanding.getCertified")} <ArrowRight className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* OSHA Requirements Summary */}
      <section className="py-16 md:py-20 bg-background" data-testid="spanish-osha-section">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-brand-orange text-sm font-semibold uppercase tracking-wider">{t("spanishLanding.oshaLabel")}</span>
            <h2 className="text-3xl font-bold mt-2 mb-4 tracking-tight">{t("spanishLanding.oshaTitle")}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t("spanishLanding.oshaSubtitle")}</p>
          </div>
          <Card className="border-border">
            <CardContent className="p-6 md:p-8 space-y-4">
              {[
                t("spanishLanding.oshaReq1"),
                t("spanishLanding.oshaReq2"),
                t("spanishLanding.oshaReq3"),
                t("spanishLanding.oshaReq4"),
                t("spanishLanding.oshaReq5"),
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

      {/* Pricing Transparency */}
      <section className="py-16 md:py-20 bg-card border-y border-border" data-testid="spanish-pricing-section">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-brand-orange text-sm font-semibold uppercase tracking-wider">{t("spanishLanding.pricingLabel")}</span>
            <h2 className="text-3xl font-bold mt-2 mb-4 tracking-tight">{t("spanishLanding.pricingTitle")}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t("spanishLanding.pricingSubtitle")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border">
              <CardContent className="p-6 text-center">
                <p className="text-sm font-semibold text-brand-dark mb-2">{t("spanishLanding.pricingOnlineTitle")}</p>
                <p className="text-3xl font-bold mb-2">$59.99</p>
                <p className="text-sm text-muted-foreground">{t("spanishLanding.pricingOnlineDesc")}</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-accent shadow-md">
              <CardContent className="p-6 text-center">
                <p className="text-sm font-semibold text-brand-dark mb-2">{t("spanishLanding.pricingInPersonTitle")}</p>
                <p className="text-3xl font-bold mb-2">$200+</p>
                <p className="text-sm text-muted-foreground">{t("spanishLanding.pricingInPersonDesc")}</p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-6 text-center">
                <p className="text-sm font-semibold text-brand-dark mb-2">{t("spanishLanding.pricingOnsiteTitle")}</p>
                <p className="text-3xl font-bold mb-2">{t("spanishLanding.pricingOnsitePrice")}</p>
                <p className="text-sm text-muted-foreground">{t("spanishLanding.pricingOnsiteDesc")}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* City Service Area Links */}
      <section className="py-16 md:py-20 bg-background" data-testid="spanish-city-links">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 tracking-tight">{t("spanishLanding.cityLinksTitle")}</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">{t("spanishLanding.cityLinksSubtitle")}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {CITY_LINKS.map((loc) => (
              <Link
                key={loc.slug}
                href={`/es/certificacion-montacargas-${loc.slug}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-card hover:bg-accent hover:text-accent-foreground hover:border-accent transition-colors text-sm font-semibold"
                data-testid={`spanish-city-link-${loc.slug}`}
              >
                <MapPin className="w-4 h-4" />
                {t("spanishLanding.cityLinkPrefix")} {loc.city}, {loc.stateAbbrev}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-20 bg-card border-y border-border" data-testid="spanish-faq-section">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">{t("spanishLanding.faqTitle")}</h2>
            <p className="text-muted-foreground">{t("spanishLanding.faqSubtitle")}</p>
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

      {/* CTA Band */}
      <section className="bg-gradient-to-r from-brand-dark to-[hsl(10,22%,16%)] py-14 md:py-16" data-testid="spanish-cta-band">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
            {t("spanishLanding.ctaBandTitle")}
          </h2>
          <p className="text-base text-white/80 mb-8 max-w-2xl mx-auto">
            {t("spanishLanding.ctaBandSubtitle")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/es/get-certified">
              <Button
                size="lg"
                className="bg-accent text-accent-foreground border-accent-border"
                data-testid="spanish-cta-band-primary"
              >
                {t("spanishLanding.heroCta")}
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
