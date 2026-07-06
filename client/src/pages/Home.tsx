import { useTranslation } from "react-i18next";
import { brand } from "@shared/config/brand";
import { industry } from "@shared/config/industry";
import SEOHead from "@/components/seo/SEOHead";
import { organizationSchema } from "@/components/seo/StructuredData";
import { useCurrentLocale } from "@/hooks/useLocaleLocation";
import { useRegion } from "@/hooks/useRegion";
import { faqItems } from "@/data/faq";
import FAQSection from "@/components/sections/FAQSection";
import OnlineFirstHero from "@/components/sections/OnlineFirstHero";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import OptimizedImage from "@/components/ui/optimized-image";
import {
  Shield, Award, Clock, MapPin, Wrench, Users,
  ArrowRight, CheckCircle, Building2, Star, RefreshCw, Phone,
} from "lucide-react";

export default function Home() {
  const { t } = useTranslation();
  const locale = useCurrentLocale();
  const { region } = useRegion();
  const showOnlineFirst = !region.isServiceArea;

  const locations = [
    { city: "San Diego", slug: "san-diego" },
    { city: "Las Vegas", slug: "las-vegas" },
    { city: "Fresno", slug: "fresno" },
  ];

  const steps = [
    {
      num: "1",
      icon: Wrench,
      title: t("home.step1Title"),
      desc: t("home.step1Desc"),
    },
    {
      num: "2",
      icon: Clock,
      title: t("home.step2Title"),
      desc: t("home.step2Desc"),
    },
    {
      num: "3",
      icon: Shield,
      title: t("home.step3Title"),
      desc: t("home.step3Desc"),
    },
  ];

  const buyerCards = [
    {
      icon: Building2,
      title: t("home.buyerCardCrewTitle"),
      desc: t("home.buyerCardCrewDesc"),
      features: [t("home.b2bF1"), t("home.b2bF2"), t("home.b2bF3")],
      popular: true,
      testId: "card-b2b",
    },
    {
      icon: Users,
      title: t("home.buyerCardSelfTitle"),
      desc: t("home.buyerCardSelfDesc"),
      features: [t("home.inPersonF1"), t("home.inPersonF2"), t("home.inPersonF3")],
      popular: false,
      testId: "card-in-person",
    },
    {
      icon: RefreshCw,
      title: t("home.buyerCardRenewTitle"),
      desc: t("home.buyerCardRenewDesc"),
      features: [t("home.renewF1"), t("home.renewF2"), t("home.renewF3")],
      popular: false,
      testId: "card-renew",
    },
  ];

  return (
    <>
      <SEOHead
        title={t("seo.home.title", { brand: brand.name, body: industry.regulatory.body })}
        description={t("seo.home.description", { body: industry.regulatory.body })}
        canonical="/"
        jsonLd={[organizationSchema(locale)]}
      />

      {showOnlineFirst ? (
        <OnlineFirstHero />
      ) : (
        <section className="relative overflow-hidden" data-testid="hero-home">
          <div className="absolute inset-0">
            <OptimizedImage
              src="/images/hero-forklift.jpg"
              alt={t("home.heroTitle")}
              className="w-full h-full object-cover"
              loading="eager"
              fetchpriority="high"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[hsl(10,22%,14%)]/95 via-[hsl(10,22%,18%)]/85 to-[hsl(10,22%,23%)]/55" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 lg:py-32">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 mb-6 text-xs font-semibold uppercase tracking-wider bg-white/10 text-white/90 rounded-full backdrop-blur-sm border border-white/10">
                <MapPin className="w-3 h-3 text-accent" />
                {t("home.heroEyebrow")}
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight mb-6 drop-shadow-md" data-testid="text-hero-title">
                {t("home.heroTitle")}
              </h1>
              <p className="text-lg sm:text-xl text-white/85 leading-relaxed mb-8 max-w-2xl drop-shadow-sm">
                {t("home.heroSubtitle")}
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/get-certified">
                  <Button size="lg" className="w-full sm:w-auto bg-accent text-accent-foreground border-accent-border text-base px-8 py-6" data-testid="button-hero-get-certified">
                    <Shield className="h-5 w-5 mr-2" />
                    {t("cta.getCertified")}
                  </Button>
                </Link>
                <a
                  href={`tel:${brand.support.phoneTel}`}
                  className="inline-flex items-center justify-center gap-2 text-base px-6 py-6 text-white/90 hover:text-white font-medium transition-colors"
                  data-testid="link-hero-phone"
                >
                  <Phone className="h-5 w-5 text-accent" />
                  {brand.support.phone}
                </a>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-3 mt-8 text-sm text-white/80">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-accent" />
                  <span>{t("home.trust2")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-accent" />
                  <span>{t("home.trust1")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-accent" />
                  <span>{t("home.trust4")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-accent" />
                  <span>{t("home.trust3")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="py-16 md:py-20 bg-background" data-testid="how-it-works-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-brand-orange text-sm font-semibold uppercase tracking-wider">{t("home.howItWorksLabel")}</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4 tracking-tight" data-testid="text-how-it-works-title">{t("home.howItWorksTitle")}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step) => (
              <div key={step.num} className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-5">
                  <div className="w-16 h-16 rounded-full bg-brand-dark flex items-center justify-center">
                    <step.icon className="w-7 h-7 text-accent" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-accent text-accent-foreground text-sm font-bold flex items-center justify-center border-2 border-background">
                    {step.num}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Buyer Paths */}
      <section className="py-16 md:py-20 bg-card border-y border-border" data-testid="buyer-paths-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-brand-orange text-sm font-semibold uppercase tracking-wider">{t("home.getStartedLabel")}</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4 tracking-tight" data-testid="text-buyer-tracks-title">{t("home.buyerTracksTitle")}</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">{t("home.buyerTracksSubtitle")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {buyerCards.map((card) => (
              <Link key={card.testId} href="/get-certified" className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl block">
                <Card
                  className={`group relative overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 h-full ${
                    card.popular
                      ? "border-2 border-accent shadow-md ring-1 ring-accent/20"
                      : "border-border hover:border-primary/40"
                  }`}
                  data-testid={card.testId}
                >
                  {card.popular && (
                    <div className="absolute top-0 left-0 right-0 bg-accent text-accent-foreground text-xs font-semibold text-center py-1.5 flex items-center justify-center gap-1.5">
                      <Star className="w-3 h-3 fill-current" />
                      {t("common.mostPopular")}
                    </div>
                  )}
                  <CardContent className={`p-6 flex flex-col h-full ${card.popular ? "pt-10" : ""}`}>
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
                      {t("cta.getCertified")} <ArrowRight className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Compact Trust Section */}
      <section className="py-12 md:py-14 bg-brand-dark text-white" data-testid="trust-section">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <Shield className="w-8 h-8 text-accent" />
              <span className="text-sm font-semibold">{t("home.trust2")}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Award className="w-8 h-8 text-accent" />
              <span className="text-sm font-semibold">{t("home.trust3")}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Clock className="w-8 h-8 text-accent" />
              <span className="text-sm font-semibold">{t("home.trust1")}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Building2 className="w-8 h-8 text-accent" />
              <span className="text-sm font-semibold">{t("home.trustRealFacilities")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Location Pills */}
      <section className="py-12 md:py-16 bg-background" data-testid="location-pills-section">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 tracking-tight">{t("home.locationPillsTitle")}</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {locations.map((loc) => (
              <Link
                key={loc.slug}
                href={`/service-areas/${loc.slug}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-card hover:bg-accent hover:text-accent-foreground hover:border-accent transition-colors text-sm font-semibold"
                data-testid={`pill-${loc.slug}`}
              >
                <MapPin className="w-4 h-4" />
                {loc.city}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <FAQSection
        items={faqItems}
        maxItems={6}
        title={t("home.commonQuestions")}
        subtitle={t("home.commonQuestionsDesc")}
      />
    </>
  );
}
