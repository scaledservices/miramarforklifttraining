import { useTranslation } from "react-i18next";
import { brand } from "@shared/config/brand";
import { industry } from "@shared/config/industry";
import SEOHead from "@/components/seo/SEOHead";
import { organizationSchema } from "@/components/seo/StructuredData";
import { useCurrentLocale } from "@/hooks/useLocaleLocation";
import { faqItems } from "@/data/faq";
import { getAllServiceAreaCities } from "@/data/serviceAreas";
import FAQSection from "@/components/sections/FAQSection";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import OptimizedImage from "@/components/ui/optimized-image";
import {
  Shield, Award, Clock, MapPin, Wrench, Users,
  ArrowRight, CheckCircle, Building2, Star, Truck, RefreshCw,
} from "lucide-react";

export default function Home() {
  const { t } = useTranslation();
  const locale = useCurrentLocale();
  const serviceAreas = getAllServiceAreaCities(locale);

  return (
    <>
      <SEOHead
        title={t("seo.home.title", { brand: brand.name, body: industry.regulatory.body })}
        description={t("seo.home.description", { body: industry.regulatory.body })}
        canonical="/"
        jsonLd={[organizationSchema(locale)]}
      />

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
            </div>

            <Link href="/renewal" className="inline-flex items-center gap-1.5 mt-6 text-sm text-white/80 hover:text-white underline underline-offset-4 decoration-white/40" data-testid="link-hero-renew">
              <RefreshCw className="w-3.5 h-3.5 text-accent" />
              {t("home.heroRenewLink")}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-6 bg-card border-y border-border" data-testid="trust-bar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { icon: Clock, label: t("home.trust1") },
              { icon: Shield, label: t("home.trust2") },
              { icon: Award, label: t("home.trust3") },
              { icon: MapPin, label: t("home.trust4") },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-center gap-3 text-center sm:text-left">
                <div className="w-9 h-9 rounded-lg bg-brand-dark flex items-center justify-center shrink-0">
                  <item.icon className="w-[18px] h-[18px] text-accent" />
                </div>
                <span className="text-sm font-semibold text-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-brand-orange text-sm font-semibold uppercase tracking-wider">{t("home.getStartedLabel")}</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4 tracking-tight" data-testid="text-buyer-tracks-title">{t("home.buyerTracksTitle")}</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">{t("home.buyerTracksSubtitle")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Link href="/get-certified" className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl block">
                <Card className="group relative overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 h-full border-2 border-accent shadow-md ring-1 ring-accent/20" data-testid="card-b2b">
                  <div className="absolute top-0 left-0 right-0 bg-accent text-accent-foreground text-xs font-semibold text-center py-1.5 flex items-center justify-center gap-1.5">
                    <Star className="w-3 h-3 fill-current" />{t("common.mostPopular")}
                  </div>
                  <CardContent className="p-6 pt-10 flex flex-col h-full">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                      <Building2 className="w-7 h-7 text-brand-dark" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{t("home.b2bTitle")}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-5">{t("home.b2bDesc")}</p>
                    <ul className="space-y-2 mb-6 flex-1">
                      {[t("home.b2bF1"), t("home.b2bF2"), t("home.b2bF3")].map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 shrink-0 text-brand-green" />
                          <span className="text-muted-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-accent text-accent-foreground px-4 py-2.5 text-sm font-medium transition-colors">
                      {t("cta.getCertified")} <ArrowRight className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
            </Link>

            <Link href="/get-certified" className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl block">
                <Card className="group relative overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 h-full border-border hover:border-primary/40" data-testid="card-in-person">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                      <Wrench className="w-7 h-7 text-brand-dark" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{t("home.inPersonTitle")}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-5">{t("home.inPersonDesc")}</p>
                    <ul className="space-y-2 mb-6 flex-1">
                      {[t("home.inPersonF1"), t("home.inPersonF2"), t("home.inPersonF3")].map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 shrink-0 text-brand-green" />
                          <span className="text-muted-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent/5 transition-colors">
                      {t("cta.getCertified")} <ArrowRight className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
            </Link>

            <Link href="/get-certified" className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl block">
                <Card className="group relative overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 h-full border-border hover:border-primary/40" data-testid="card-renew">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                      <RefreshCw className="w-7 h-7 text-brand-dark" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{t("home.renewTitle")}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-5">{t("home.renewDesc")}</p>
                    <ul className="space-y-2 mb-6 flex-1">
                      {[t("home.renewF1"), t("home.renewF2"), t("home.renewF3")].map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 shrink-0 text-brand-green" />
                          <span className="text-muted-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent/5 transition-colors">
                      {t("home.renewCta")} <ArrowRight className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-brand-dark text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <span className="text-accent text-sm font-semibold uppercase tracking-wider">{t("home.getStartedLabel")}</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4 tracking-tight" data-testid="text-b2b-section-title">{t("home.b2bSectionTitle")}</h2>
              <p className="text-white/80 text-lg mb-8 leading-relaxed">{t("home.b2bSectionDesc")}</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/get-certified">
                  <Button size="lg" className="w-full sm:w-auto bg-accent text-accent-foreground border-accent-border px-8" data-testid="button-b2b-quote">
                    {t("cta.getCertified")}
                  </Button>
                </Link>
                <Link href="/business">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/30 text-white bg-white/10 px-8" data-testid="button-b2b-learn">
                    {t("cta.learnMore")}
                  </Button>
                </Link>
              </div>
              <Link href="/request-quote" className="inline-flex items-center gap-1.5 mt-4 text-sm text-white/70 hover:text-white underline underline-offset-4 decoration-white/40" data-testid="link-b2b-large-group">
                {t("home.largeGroupLink")}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <div className="flex flex-wrap gap-x-6 gap-y-3 mt-8 text-sm text-white/80">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-accent" />
                  <span>{t("home.statBilingual")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-accent" />
                  <span>{t("home.statSameDay")}</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                <OptimizedImage
                  src="/images/business-team.jpg"
                  alt={t("home.businessAlt")}
                  className="w-full h-full object-cover aspect-[4/3]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials hidden until real reviews are collected per senior review Section B.8 */}

      {/* Service Areas */}
      <section className="py-16 md:py-20 bg-card border-y border-border" data-testid="service-areas-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-brand-orange text-sm font-semibold uppercase tracking-wider">{t("home.serviceAreasLabel")}</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4 tracking-tight" data-testid="text-service-areas-title">{t("home.serviceAreasTitle")}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t("home.serviceAreasDesc", { body: industry.regulatory.body })}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {serviceAreas.map((area) => (
              <Link key={area.slug} href={`/service-areas/${area.slug}`} className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl block">
                <Card className="group relative overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 h-full border-border hover:border-accent" data-testid={`card-service-area-${area.slug}`}>
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center mb-5">
                      <Truck className="w-7 h-7 text-brand-dark" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{area.city}, {area.stateAbbrev}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-5 flex-1">
                      {t("home.serviceAreaCardDesc", { city: area.city })}
                    </p>
                    <div className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent/5 transition-colors">
                      {t("cta.learnMore")} <ArrowRight className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
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

      <section className="py-16 md:py-20 bg-gradient-to-br from-brand-dark to-[hsl(10,22%,15%)] text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("home.readyToGetCertified")}</h2>
          <p className="text-white/80 text-lg mb-8">{t("home.readyToGetCertifiedDesc")}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/get-certified">
              <Button size="lg" className="bg-accent text-accent-foreground border-accent-border px-8" data-testid="button-final-get-certified">
                {t("cta.getCertified")}
              </Button>
            </Link>
            <Link href="/renewal">
              <Button size="lg" variant="outline" className="border-white/30 text-white bg-white/10 px-8" data-testid="button-final-renew">
                {t("home.renewCta")}
              </Button>
            </Link>
          </div>
          <Link href="/request-quote" className="inline-flex items-center gap-1.5 mt-6 text-sm text-white/70 hover:text-white underline underline-offset-4 decoration-white/40" data-testid="link-final-large-group">
            {t("home.largeGroupLink")}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    </>
  );
}
