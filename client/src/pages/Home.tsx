import { useTranslation } from "react-i18next";
import { brand } from "@shared/config/brand";
import { industry } from "@shared/config/industry";
import SEOHead from "@/components/seo/SEOHead";
import { organizationSchema, faqSchema } from "@/components/seo/StructuredData";
import { useCurrentLocale } from "@/hooks/useLocaleLocation";
import { faqItems } from "@/data/faq";
import FAQSection from "@/components/sections/FAQSection";
import TrustBadgeBar from "@/components/sections/TrustBadgeBar";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import OptimizedImage from "@/components/ui/optimized-image";
import {
  Shield, Award, Clock, MapPin, Wrench, Users,
  ArrowRight, CheckCircle, Building2, Star, RefreshCw, Phone,
  AlertTriangle, Warehouse, HardHat, Truck, Factory,
} from "lucide-react";

export default function Home() {
  const { t } = useTranslation();
  const locale = useCurrentLocale();

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

  // Each buyer type routes to its own funnel: B2B crews get a quote form,
  // individuals go straight to self-serve booking, renewals stay online.
  const buyerCards = [
    {
      icon: Building2,
      title: t("home.buyerCardCrewTitle"),
      desc: t("home.buyerCardCrewDesc"),
      features: [t("home.b2bF1"), t("home.b2bF2"), t("home.b2bF3")],
      popular: true,
      testId: "card-b2b",
      href: "/request-quote",
      cta: t("cta.getFastQuote"),
    },
    {
      icon: Users,
      title: t("home.buyerCardSelfTitle"),
      desc: t("home.buyerCardSelfDesc"),
      features: [t("home.inPersonF1"), t("home.inPersonF2"), t("home.inPersonF3")],
      popular: false,
      testId: "card-in-person",
      href: "/book-training",
      cta: t("home.bookTrainingCta"),
    },
    {
      icon: RefreshCw,
      title: t("home.buyerCardRenewTitle"),
      desc: t("home.buyerCardRenewDesc"),
      features: [t("home.renewF1"), t("home.renewF2"), t("home.renewF3")],
      popular: false,
      testId: "card-renew",
      href: "/renewal",
      cta: t("home.renewCta"),
    },
  ];

  const industries = [
    { icon: Warehouse, title: t("home.industryWarehousingTitle"), desc: t("home.industryWarehousingDesc"), ref: "industry-warehousing", testId: "industry-warehousing" },
    { icon: HardHat, title: t("home.industryConstructionTitle"), desc: t("home.industryConstructionDesc"), ref: "industry-construction", testId: "industry-construction" },
    { icon: Truck, title: t("home.industryLogisticsTitle"), desc: t("home.industryLogisticsDesc"), ref: "industry-logistics", testId: "industry-logistics" },
    { icon: Factory, title: t("home.industryManufacturingTitle"), desc: t("home.industryManufacturingDesc"), ref: "industry-manufacturing", testId: "industry-manufacturing" },
  ];

  const testimonials = [
    { quote: t("home.testimonial1Quote"), name: t("home.testimonial1Name"), role: t("home.testimonial1Role") },
    { quote: t("home.testimonial2Quote"), name: t("home.testimonial2Name"), role: t("home.testimonial2Role") },
    { quote: t("home.testimonial3Quote"), name: t("home.testimonial3Name"), role: t("home.testimonial3Role") },
  ];

  return (
    <>
      <SEOHead
        title={t("seo.home.title", { brand: brand.name, body: industry.regulatory.body })}
        description={t("seo.home.description", { body: industry.regulatory.body })}
        canonical="/"
        jsonLd={[
          organizationSchema(locale),
          // faqItems are English-only content — emitting them with
          // inLanguage:"es" on the Spanish page is invalid, so EN only.
          ...(locale === "en"
            ? [faqSchema(faqItems.slice(0, 6).map(({ question, answer }) => ({ question, answer })), locale)]
            : []),
        ]}
      />

      {/* Unified hero — onsite-first for every visitor, in-region or not. */}
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

          <TrustBadgeBar />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 lg:py-32">
            <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 mb-6 text-xs font-semibold uppercase tracking-wider bg-white/10 text-white/90 rounded-full backdrop-blur-sm border border-white/10">
                <MapPin className="w-3 h-3 text-accent" />
                {t("home.heroEyebrowUnified")}
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight mb-6 drop-shadow-md" style={{ fontFamily: "'Roboto Slab', serif" }} data-testid="text-hero-title">
                {t("home.heroTitleUnified")}
              </h1>
              <p className="text-lg sm:text-xl text-white/85 leading-relaxed mb-8 max-w-2xl drop-shadow-sm">
                {t("home.heroSubtitleUnified")}
              </p>

              {/* One focused CTA — no competing actions in the hero. */}
              <div>
                <Link href="/get-certified">
                  <Button size="lg" className="w-full sm:w-auto bg-accent text-accent-foreground border-accent-border text-base px-8 py-6 transition-transform hover:scale-[1.02]" data-testid="button-hero-get-certified">
                    <Shield className="h-5 w-5 mr-2" />
                    {t("cta.getCertifiedToday")}
                  </Button>
                </Link>
              </div>

              <p className="mt-5 text-sm font-semibold text-accent drop-shadow-sm" data-testid="text-hero-price-anchor">
                {t("home.priceAnchorUnified")}
              </p>

              <a
                href={`tel:${brand.support.phoneTel}`}
                className="mt-2 inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors"
                data-testid="link-hero-phone"
              >
                <Phone className="h-3.5 w-3.5 text-accent" />
                {brand.support.phone}
              </a>

              <div className="flex flex-wrap gap-x-6 gap-y-3 mt-6 text-sm text-white/80">
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
              {locale === "en" && (
                <div className="mt-6">
                  <Link
                    href="/es/certificacion-montacargas"
                    className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-accent transition-colors"
                    data-testid="link-en-espanol"
                  >
                    🇪🇸 En Espanol
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

      {/* Loss framing — compliance risk strip */}
      <section className="bg-brand-dark border-t border-white/10 py-6" data-testid="loss-framing-strip">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-brand-orange shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-semibold" data-testid="text-loss-title">{t("home.lossTitle")}</p>
              <p className="text-white/75 text-sm mt-0.5">{t("home.lossDesc")}</p>
            </div>
          </div>
          <Link
            href="/get-certified"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-accent text-accent-foreground text-sm font-semibold whitespace-nowrap shrink-0 hover:brightness-95 transition-all"
            data-testid="link-loss-cta"
          >
            {t("home.lossCta")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

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
              <Link key={card.testId} href={card.href} className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl block">
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
                      {card.cta} <ArrowRight className="w-4 h-4" />
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

      {/* Testimonials */}
      <section className="py-16 md:py-20 bg-background" data-testid="testimonials-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-brand-orange text-sm font-semibold uppercase tracking-wider">{t("home.testimonialsLabel")}</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4 tracking-tight" data-testid="text-testimonials-title">{t("home.testimonialsTitle")}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((tm) => (
              <Card key={tm.name} className="border-border h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex gap-0.5 mb-4" aria-hidden="true">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-accent fill-current" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed flex-1">“{tm.quote}”</p>
                  <div className="flex items-center gap-3 mt-5 pt-4 border-t border-border">
                    <div className="w-10 h-10 rounded-full bg-brand-dark text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {tm.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{tm.name}</p>
                      <p className="text-xs text-muted-foreground">{tm.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Industry segmentation — B2B buyers want their use case addressed */}
      <section className="py-16 md:py-20 bg-card border-y border-border" data-testid="industries-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-brand-orange text-sm font-semibold uppercase tracking-wider">{t("home.industriesLabel")}</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4 tracking-tight" data-testid="text-industries-title">{t("home.industriesTitle")}</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">{t("home.industriesSubtitle")}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {industries.map((ind) => (
              <Link
                key={ind.ref}
                href={`/request-quote?ref=${ind.ref}`}
                className="group block rounded-xl border border-border bg-background p-6 hover:border-accent hover:shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                data-testid={ind.testId}
              >
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <ind.icon className="w-6 h-6 text-brand-dark" />
                </div>
                <h3 className="font-bold mb-1.5">{ind.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{ind.desc}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green group-hover:text-accent transition-colors">
                  {t("home.industryCta")}
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
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

      {/* Train-the-Trainer cross-sell banner */}
      <section className="py-10 md:py-12 bg-muted/30" data-testid="ttt-cross-sell">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div>
              <h3 className="text-xl font-bold mb-1" style={{ fontFamily: "'Roboto Slab', serif" }}>
                {t("home.tttBannerTitle")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("home.tttBannerDesc")}
              </p>
            </div>
            <Link
              href="/train-the-trainer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold whitespace-nowrap"
              data-testid="ttt-banner-link"
            >
              {t("home.tttBannerCta")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <FAQSection
        items={faqItems}
        maxItems={6}
        title={t("home.commonQuestions")}
        subtitle={t("home.commonQuestionsDesc")}
      />

      {/* Mobile sticky CTA is provided by the global MobileCtaBar (App.tsx) —
          do not add a page-level fixed bottom bar here, they overlap. */}
    </>
  );
}
