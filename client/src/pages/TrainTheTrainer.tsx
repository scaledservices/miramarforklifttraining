import { useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import SEOHead from "@/components/seo/SEOHead";
import { faqSchema } from "@/components/seo/StructuredData";
import { brand } from "@shared/config/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen,
  Presentation,
  ClipboardCheck,
  Award,
  ShieldCheck,
  Users,
  Building2,
  RefreshCw,
  CheckCircle2,
  ChevronDown,
  Phone,
  ArrowRight,
  Calculator,
} from "lucide-react";

export default function TrainTheTrainer() {
  const { t, i18n } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // ROI calculator state
  const [operatorsPerYear, setOperatorsPerYear] = useState(20);
  const [costPerOperator, setCostPerOperator] = useState(45);

  const withoutKitTotal = operatorsPerYear * costPerOperator;
  const kitPrice = 350;
  const savings = withoutKitTotal - kitPrice;
  const savingsPositive = savings > 0;

  const kitIncludes = [
    { icon: BookOpen, key: "trainTheTrainerPage.kitCurriculum" },
    { icon: Presentation, key: "trainTheTrainerPage.kitSlides" },
    { icon: ClipboardCheck, key: "trainTheTrainerPage.kitExam" },
    { icon: ClipboardCheck, key: "trainTheTrainerPage.kitPractical" },
    { icon: Award, key: "trainTheTrainerPage.kitCertificates" },
    { icon: ShieldCheck, key: "trainTheTrainerPage.kitOshaGuide" },
  ];

  const whoFor = [
    { icon: Users, key: "trainTheTrainerPage.who10Plus" },
    { icon: Building2, key: "trainTheTrainerPage.whoMultiSite" },
    { icon: RefreshCw, key: "trainTheTrainerPage.whoHighTurnover" },
  ];

  const trustSignals = [
    { icon: ShieldCheck, key: "trainTheTrainerPage.trustOsha" },
    { icon: Users, key: "trainTheTrainerPage.trustCompanies" },
    { icon: Award, key: "trainTheTrainerPage.trustExperience" },
  ];

  const faqs = [
    {
      qKey: "trainTheTrainerPage.faq1Q",
      aKey: "trainTheTrainerPage.faq1A",
    },
    {
      qKey: "trainTheTrainerPage.faq2Q",
      aKey: "trainTheTrainerPage.faq2A",
    },
    {
      qKey: "trainTheTrainerPage.faq3Q",
      aKey: "trainTheTrainerPage.faq3A",
    },
    {
      qKey: "trainTheTrainerPage.faq4Q",
      aKey: "trainTheTrainerPage.faq4A",
    },
    {
      qKey: "trainTheTrainerPage.faq5Q",
      aKey: "trainTheTrainerPage.faq5A",
    },
    {
      qKey: "trainTheTrainerPage.faq6Q",
      aKey: "trainTheTrainerPage.faq6A",
    },
  ];

  // Build FAQ schema from translated Q/A
  const faqSchemaData = faqs.map((f) => ({
    question: t(f.qKey),
    answer: t(f.aKey),
  }));
  const jsonLd = [faqSchema(faqSchemaData, i18n.language)];

  // Comparison table data
  const comparisonRows = [
    { featureKey: "trainTheTrainerPage.cmpDelivery", digital: t("trainTheTrainerPage.cmpDeliveryDigital"), inPerson: t("trainTheTrainerPage.cmpDeliveryInPerson") },
    { featureKey: "trainTheTrainerPage.cmpPrice", digital: t("trainTheTrainerPage.cmpPriceDigital"), inPerson: t("trainTheTrainerPage.cmpPriceInPerson") },
    { featureKey: "trainTheTrainerPage.cmpScheduling", digital: t("trainTheTrainerPage.cmpSchedulingDigital"), inPerson: t("trainTheTrainerPage.cmpSchedulingInPerson") },
    { featureKey: "trainTheTrainerPage.cmpCoaching", digital: t("trainTheTrainerPage.cmpCoachingDigital"), inPerson: t("trainTheTrainerPage.cmpCoachingInPerson") },
    { featureKey: "trainTheTrainerPage.cmpMaterials", digital: t("trainTheTrainerPage.cmpMaterialsDigital"), inPerson: t("trainTheTrainerPage.cmpMaterialsInPerson") },
    { featureKey: "trainTheTrainerPage.cmpBest", digital: t("trainTheTrainerPage.cmpBestDigital"), inPerson: t("trainTheTrainerPage.cmpBestInPerson") },
  ];

  const quoteHref = "/request-quote?ref=ttt-digital-kit";

  return (
    <>
      <SEOHead
        title={t("seo.trainTheTrainer.title")}
        description={t("seo.trainTheTrainer.description")}
        canonical="/train-the-trainer"
        jsonLd={jsonLd}
      />

      {/* ─── HERO ─────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-brand-dark via-brand-dark to-[hsl(10,22%,15%)] text-white py-16 md:py-24 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/20 text-primary-foreground px-4 py-1.5 rounded-full text-sm font-medium mb-6" style={{ backgroundColor: "rgba(255,195,38,0.15)", color: "#FFC326" }}>
            <Award className="w-4 h-4" />
            {t("trainTheTrainerPage.heroBadge")}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Roboto Slab', serif" }}>
            {t("trainTheTrainerPage.h1")}
          </h1>
          <p className="text-lg sm:text-xl text-white/80 mb-8 max-w-3xl mx-auto">
            {t("trainTheTrainerPage.heroSubtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-base px-8 py-3">
              <Link href={quoteHref}>
                {t("trainTheTrainerPage.heroCta")}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base px-8 py-3 border-white/30 text-white hover:bg-white/10">
              <a href={`tel:${brand.support.phoneTel}`}>
                <Phone className="mr-2 w-5 h-5" />
                {brand.support.phone}
              </a>
            </Button>
          </div>
          <p className="text-sm text-white/60 mt-6">
            {t("trainTheTrainerPage.heroTrust")}
          </p>
        </div>
      </section>

      {/* ─── WHAT'S INCLUDED ──────────────────────────────── */}
      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Roboto Slab', serif" }}>
              {t("trainTheTrainerPage.whatsIncluded")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("trainTheTrainerPage.whatsIncludedDesc")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {kitIncludes.map((item) => (
              <Card key={item.key} className="border-border hover:shadow-lg transition-shadow" data-testid={`kit-item-${item.key}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(255,195,38,0.12)" }}>
                      <item.icon className="w-5 h-5" style={{ color: "#FFC326" }} />
                    </div>
                    <p className="font-medium pt-1">{t(item.key)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ──────────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Roboto Slab', serif" }}>
              {t("trainTheTrainerPage.pricingTitle")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("trainTheTrainerPage.pricingDesc")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Digital Kit */}
            <Card className="border-border relative" data-testid="pricing-card-digital">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Roboto Slab', serif" }}>
                  {t("trainTheTrainerPage.priceDigitalTitle")}
                </h3>
                <p className="text-muted-foreground text-sm mb-6">
                  {t("trainTheTrainerPage.priceDigitalDesc")}
                </p>
                <div className="mb-6">
                  <span className="text-4xl font-bold" style={{ color: "#4f3b3b" }}>$350</span>
                  <span className="text-muted-foreground ml-2">{t("trainTheTrainerPage.priceOneTime")}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {[
                    "trainTheTrainerPage.priceDigitalF1",
                    "trainTheTrainerPage.priceDigitalF2",
                    "trainTheTrainerPage.priceDigitalF3",
                    "trainTheTrainerPage.priceDigitalF4",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#019E7C" }} />
                      <span>{t(f)}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link href={quoteHref}>
                    {t("trainTheTrainerPage.buyKit")}
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Kit + Coaching */}
            <Card className="relative border-2 border-primary" data-testid="pricing-card-coaching">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full" style={{ backgroundColor: "#FFC326", color: "#4f3b3b" }}>
                {t("trainTheTrainerPage.popular")}
              </div>
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Roboto Slab', serif" }}>
                  {t("trainTheTrainerPage.priceCoachingTitle")}
                </h3>
                <p className="text-muted-foreground text-sm mb-6">
                  {t("trainTheTrainerPage.priceCoachingDesc")}
                </p>
                <div className="mb-6">
                  <span className="text-4xl font-bold" style={{ color: "#4f3b3b" }}>$750</span>
                  <span className="text-muted-foreground ml-2">{t("trainTheTrainerPage.priceOneTime")}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {[
                    "trainTheTrainerPage.priceCoachingF1",
                    "trainTheTrainerPage.priceCoachingF2",
                    "trainTheTrainerPage.priceCoachingF3",
                    "trainTheTrainerPage.priceCoachingF4",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#019E7C" }} />
                      <span>{t(f)}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link href={quoteHref}>
                    {t("trainTheTrainerPage.buyCoaching")}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── WHO THIS IS FOR ──────────────────────────────── */}
      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Roboto Slab', serif" }}>
              {t("trainTheTrainerPage.whoTitle")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("trainTheTrainerPage.whoDesc")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {whoFor.map((item) => (
              <Card key={item.key} className="border-border text-center" data-testid={`who-for-${item.key}`}>
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "rgba(255,195,38,0.12)" }}>
                    <item.icon className="w-6 h-6" style={{ color: "#FFC326" }} />
                  </div>
                  <p className="font-medium">{t(item.key)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ROI CALCULATOR ──────────────────────────────── */}
      <section className="py-16 md:py-20 bg-muted/30" id="roi-calculator">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <Calculator className="w-6 h-6" style={{ color: "#FFC326" }} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Roboto Slab', serif" }}>
              {t("trainTheTrainerPage.roiTitle")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("trainTheTrainerPage.roiDesc")}
            </p>
          </div>

          <Card className="border-border" data-testid="roi-calculator">
            <CardContent className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium mb-2" htmlFor="operators-count">
                    {t("trainTheTrainerPage.roiOperators")}
                  </label>
                  <input
                    id="operators-count"
                    type="range"
                    min={5}
                    max={100}
                    step={5}
                    value={operatorsPerYear}
                    onChange={(e) => setOperatorsPerYear(Number(e.target.value))}
                    className="w-full accent-primary"
                    style={{ accentColor: "#FFC326" }}
                    data-testid="roi-operators-slider"
                  />
                  <p className="text-2xl font-bold mt-2" style={{ color: "#4f3b3b" }}>
                    {operatorsPerYear}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" htmlFor="cost-per-operator">
                    {t("trainTheTrainerPage.roiCostPer")}
                  </label>
                  <input
                    id="cost-per-operator"
                    type="range"
                    min={45}
                    max={200}
                    step={5}
                    value={costPerOperator}
                    onChange={(e) => setCostPerOperator(Number(e.target.value))}
                    className="w-full"
                    style={{ accentColor: "#FFC326" }}
                    data-testid="roi-cost-slider"
                  />
                  <p className="text-2xl font-bold mt-2" style={{ color: "#4f3b3b" }}>
                    ${costPerOperator.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-border pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">{t("trainTheTrainerPage.roiWithoutKit")}</p>
                  <p className="text-2xl font-bold" style={{ color: "#4f3b3b" }}>${withoutKitTotal.toFixed(0)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">{t("trainTheTrainerPage.roiWithKit")}</p>
                  <p className="text-2xl font-bold" style={{ color: "#4f3b3b" }}>${kitPrice}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">{t("trainTheTrainerPage.roiSavings")}</p>
                  <p className="text-2xl font-bold" style={{ color: savingsPositive ? "#019E7C" : "#dc2626" }}>
                    {savingsPositive ? "$" : "-$"}{Math.abs(savings).toFixed(0)}
                  </p>
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground mt-6">
                {t("trainTheTrainerPage.roiExample", {
                  operators: operatorsPerYear,
                  cost: costPerOperator.toFixed(2),
                  without: withoutKitTotal.toFixed(0),
                  kit: kitPrice,
                  savings: Math.max(0, savings).toFixed(0),
                })}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ─── COMPARISON TABLE ────────────────────────────── */}
      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Roboto Slab', serif" }}>
              {t("trainTheTrainerPage.cmpTitle")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("trainTheTrainerPage.cmpDesc")}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" data-testid="comparison-table">
              <thead>
                <tr>
                  <th className="text-left p-4 border-b-2 border-border font-semibold text-sm">{t("trainTheTrainerPage.cmpFeature")}</th>
                  <th className="text-center p-4 border-b-2 border-border font-semibold text-sm" style={{ color: "#4f3b3b" }}>
                    {t("trainTheTrainerPage.cmpDigitalKit")}
                  </th>
                  <th className="text-center p-4 border-b-2 border-border font-semibold text-sm">{t("trainTheTrainerPage.cmpInPerson")}</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.featureKey} className="border-b border-border">
                    <td className="p-4 text-sm font-medium">{t(row.featureKey)}</td>
                    <td className="p-4 text-sm text-center">{row.digital}</td>
                    <td className="p-4 text-sm text-center text-muted-foreground">{row.inPerson}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─── TRUST SIGNALS ───────────────────────────────── */}
      <section className="py-12 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {trustSignals.map((item) => (
              <div key={item.key} className="flex items-center gap-3 justify-center text-center sm:text-left" data-testid={`trust-${item.key}`}>
                <item.icon className="w-8 h-8 shrink-0" style={{ color: "#FFC326" }} />
                <p className="text-sm font-medium">{t(item.key)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-background" id="faq">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Roboto Slab', serif" }}>
              {t("trainTheTrainerPage.faqTitle")}
            </h2>
          </div>
          <div className="space-y-3" data-testid="faq-list">
            {faqs.map((faq, idx) => (
              <Card key={faq.qKey} className="border-border">
                <button
                  className="w-full text-left p-5 flex items-center justify-between gap-4"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  aria-expanded={openFaq === idx}
                  data-testid={`faq-toggle-${idx}`}
                >
                  <span className="font-medium">{t(faq.qKey)}</span>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 transition-transform ${openFaq === idx ? "rotate-180" : ""}`}
                    style={{ color: "#FFC326" }}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-sm text-muted-foreground">
                    {t(faq.aKey)}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ───────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-brand-dark to-[hsl(10,22%,16%)] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Roboto Slab', serif" }}>
            {t("trainTheTrainerPage.finalCtaTitle")}
          </h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            {t("trainTheTrainerPage.finalCtaSubtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-base px-8 py-3" style={{ backgroundColor: "#FFC326", color: "#4f3b3b" }}>
              <Link href={quoteHref}>
                {t("trainTheTrainerPage.buyKit")}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base px-8 py-3 border-white/30 text-white hover:bg-white/10">
              <Link href="/contact">
                {t("cta.contactUs")}
              </Link>
            </Button>
          </div>
          <p className="text-sm text-white/60 mt-6">
            {t("trainTheTrainerPage.finalCtaTrust")}
          </p>
        </div>
      </section>
    </>
  );
}
