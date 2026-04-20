import { useTranslation } from "react-i18next";
import { brand } from "@shared/config/brand";
import { industry } from "@shared/config/industry";
import SEOHead from "@/components/seo/SEOHead";
import { organizationSchema } from "@/components/seo/StructuredData";
import { useCurrentLocale } from "@/hooks/useLocaleLocation";
import { faqItems } from "@/data/faq";
import FAQSection from "@/components/sections/FAQSection";
import Testimonials from "@/components/sections/Testimonials";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Shield, Award, Clock, MapPin, Monitor, Wrench, Users,
  ArrowRight, CheckCircle, Building2, Star, Zap,
} from "lucide-react";

export default function Home() {
  const { t } = useTranslation();
  const locale = useCurrentLocale();

  return (
    <>
      <SEOHead
        title={t("seo.home.title", { brand: brand.name, body: industry.regulatory.body })}
        description={t("seo.home.description", { body: industry.regulatory.body })}
        canonical="/"
        jsonLd={[organizationSchema(locale)]}
      />

      <section className="relative bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/hero-forklift.jpg')] bg-cover bg-center opacity-15" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6" data-testid="text-hero-title">
              {t("home.heroTitle")}
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              {t("home.heroSubtitle")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/in-person-training">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-white text-base px-8 py-6" data-testid="button-hero-in-person">
                  <Wrench className="h-5 w-5 mr-2" />
                  {t("home.bookInPerson")}
                </Button>
              </Link>
              <Link href="/online-forklift-certification">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 text-base px-8 py-6" data-testid="button-hero-online">
                  <Monitor className="h-5 w-5 mr-2" />
                  {t("home.getOnlineCertified")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 bg-card border-y border-border" data-testid="trust-bar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { icon: Clock, label: t("home.trust1") },
              { icon: Shield, label: t("home.trust2") },
              { icon: Award, label: t("home.trust3") },
              { icon: MapPin, label: t("home.trust4") },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-2">
                <item.icon className="w-6 h-6 text-accent" />
                <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-accent text-sm font-semibold uppercase tracking-wider">{t("home.getStartedLabel")}</span>
            <h2 className="text-3xl font-bold mt-2 mb-4 tracking-tight" data-testid="text-buyer-tracks-title">{t("home.buyerTracksTitle")}</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">{t("home.buyerTracksSubtitle")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Link href="/in-person-training" className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg block">
                <Card className="group relative overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg h-full border-border hover:border-muted-foreground/30" data-testid="card-in-person">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="w-14 h-14 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mb-5">
                      <Wrench className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{t("home.inPersonTitle")}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-5">{t("home.inPersonDesc")}</p>
                    <ul className="space-y-2 mb-6 flex-1">
                      {[t("home.inPersonF1"), t("home.inPersonF2"), t("home.inPersonF3")].map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-muted-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent/5 transition-colors">
                      {t("home.viewInPersonCta")} <ArrowRight className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
            </Link>

            <Link href="/p/online-forklift-operator-training" className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg block">
                <Card className="group relative overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg h-full border-2 border-accent shadow-md ring-1 ring-accent/20" data-testid="card-online">
                  <div className="absolute top-0 left-0 right-0 bg-accent text-accent-foreground text-xs font-semibold text-center py-1.5 flex items-center justify-center gap-1.5">
                    <Star className="w-3 h-3 fill-current" />{t("common.mostPopular")}
                  </div>
                  <CardContent className="p-6 pt-10 flex flex-col h-full">
                    <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
                      <Monitor className="w-7 h-7 text-accent" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{t("home.onlineTitle")}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-5">{t("home.onlineDesc")}</p>
                    <ul className="space-y-2 mb-6 flex-1">
                      {[t("home.onlineF1"), t("home.onlineF2"), t("home.onlineF3")].map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 shrink-0 text-accent" />
                          <span className="text-muted-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-accent text-accent-foreground px-4 py-2.5 text-sm font-medium transition-colors">
                      {t("cta.getCertifiedNow")} <ArrowRight className="w-4 h-4" />
                    </div>
                    <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-muted-foreground">
                      <Zap className="w-3 h-3 text-accent" />
                      <span>{t("home.certIn2Hours")}</span>
                    </div>
                  </CardContent>
                </Card>
            </Link>

            <Link href="/request-quote" className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg block">
                <Card className="group relative overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg h-full border-border hover:border-muted-foreground/30" data-testid="card-b2b">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="w-14 h-14 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center mb-5">
                      <Building2 className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{t("home.b2bTitle")}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-5">{t("home.b2bDesc")}</p>
                    <ul className="space-y-2 mb-6 flex-1">
                      {[t("home.b2bF1"), t("home.b2bF2"), t("home.b2bF3")].map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 shrink-0 text-purple-600 dark:text-purple-400" />
                          <span className="text-muted-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent/5 transition-colors">
                      {t("home.getQuoteCta")} <ArrowRight className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <Users className="h-10 w-10 text-accent mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4" data-testid="text-b2b-section-title">{t("home.b2bSectionTitle")}</h2>
            <p className="text-blue-100 text-lg mb-8">{t("home.b2bSectionDesc")}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/request-quote">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-white px-8" data-testid="button-b2b-quote">
                  {t("home.requestQuoteCta")}
                </Button>
              </Link>
              <Link href="/business">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8" data-testid="button-b2b-learn">
                  {t("cta.learnMore")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Testimonials />

      <FAQSection
        items={faqItems}
        maxItems={6}
        title={t("home.commonQuestions")}
        subtitle={t("home.commonQuestionsDesc")}
      />

      <section className="py-16 md:py-20 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">{t("home.readyToGetCertified")}</h2>
          <p className="text-blue-100 text-lg mb-8">{t("home.readyToGetCertifiedDesc")}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/in-person-training">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white px-8">
                {t("home.bookInPerson")}
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8">
                {t("cta.contactUs")}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
