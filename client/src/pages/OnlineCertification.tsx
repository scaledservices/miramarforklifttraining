import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import Hero from "@/components/sections/Hero";
import TrustBar from "@/components/sections/TrustBar";
import CTABand from "@/components/sections/CTABand";
import SEOHead from "@/components/seo/SEOHead";
import { courseSchema, faqSchema } from "@/components/seo/StructuredData";
import { useCurrentLocale } from "@/hooks/useLocaleLocation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { industry } from "@shared/config/industry";
import {
  ArrowRight,
  Check,
  Monitor,
  Clock,
  Award,
  Shield,
  Smartphone,
  RotateCcw,
  CreditCard,
  FileCheck,
  Wallet,
  Building2,
  UserCheck,
  Pencil,
  PlayCircle,
  BadgeCheck,
} from "lucide-react";

export default function OnlineCertification() {
  const { t } = useTranslation();
  const locale = useCurrentLocale();

  const benefits = [
    { icon: Monitor, title: t("onlineCert.benefit100Online"), desc: t("onlineCert.benefit100OnlineDesc") },
    { icon: Clock, title: t("onlineCert.benefitSelfPaced"), desc: t("onlineCert.benefitSelfPacedDesc") },
    { icon: Award, title: t("onlineCert.benefitInstantCert"), desc: t("onlineCert.benefitInstantCertDesc") },
    { icon: Shield, title: t("onlineCert.benefitOshaAligned"), desc: t("onlineCert.benefitOshaAlignedDesc") },
    { icon: Smartphone, title: t("onlineCert.benefitMobileFriendly"), desc: t("onlineCert.benefitMobileFriendlyDesc") },
    { icon: RotateCcw, title: t("onlineCert.benefitUnlimitedRetakes"), desc: t("onlineCert.benefitUnlimitedRetakesDesc") },
  ];

  const steps = [
    {
      icon: Pencil,
      title: t("onlineCert.step1Title"),
      desc: t("onlineCert.step1Desc"),
    },
    {
      icon: PlayCircle,
      title: t("onlineCert.step2Title"),
      desc: t("onlineCert.step2Desc"),
    },
    {
      icon: BadgeCheck,
      title: t("onlineCert.step3Title"),
      desc: t("onlineCert.step3Desc"),
    },
  ];

  const whatYouGet = [
    { icon: FileCheck, title: t("onlineCert.whatYouGetCertTitle"), desc: t("onlineCert.whatYouGetCertDesc") },
    { icon: Wallet, title: t("onlineCert.whatYouGetWalletTitle"), desc: t("onlineCert.whatYouGetWalletDesc") },
    { icon: Building2, title: t("onlineCert.whatYouGetEmployerTitle"), desc: t("onlineCert.whatYouGetEmployerDesc") },
  ];

  const trustSignals = [
    { icon: Shield, text: t("onlineCert.trustOshaAligned") },
    { icon: Clock, text: t("onlineCert.trustInstantCert") },
    { icon: UserCheck, text: t("onlineCert.trustEmployerAccepted") },
    { icon: CreditCard, text: t("onlineCert.trustPrice59") },
  ];

  const comparisonRows = [
    { feature: t("onlineCert.compareFeature1"), online: t("onlineCert.compareOnline1"), inPerson: t("onlineCert.compareInPerson1") },
    { feature: t("onlineCert.compareFeature2"), online: t("onlineCert.compareOnline2"), inPerson: t("onlineCert.compareInPerson2") },
    { feature: t("onlineCert.compareFeature3"), online: t("onlineCert.compareOnline3"), inPerson: t("onlineCert.compareInPerson3") },
    { feature: t("onlineCert.compareFeature4"), online: t("onlineCert.compareOnline4"), inPerson: t("onlineCert.compareInPerson4") },
    { feature: t("onlineCert.compareFeature5"), online: t("onlineCert.compareOnline5"), inPerson: t("onlineCert.compareInPerson5") },
  ];

  const faqs = [
    { question: t("onlineCert.faq1Q"), answer: t("onlineCert.faq1A") },
    { question: t("onlineCert.faq2Q"), answer: t("onlineCert.faq2A") },
    { question: t("onlineCert.faq3Q"), answer: t("onlineCert.faq3A") },
    { question: t("onlineCert.faq4Q"), answer: t("onlineCert.faq4A") },
    { question: t("onlineCert.faq5Q"), answer: t("onlineCert.faq5A") },
    { question: t("onlineCert.faq6Q"), answer: t("onlineCert.faq6A") },
    { question: t("onlineCert.faq7Q"), answer: t("onlineCert.faq7A") },
    { question: t("onlineCert.faq8Q"), answer: t("onlineCert.faq8A") },
  ];

  return (
    <>
      <SEOHead
        title={t("onlineCert.seoTitle", { body: industry.regulatory.body })}
        description={t("onlineCert.seoDescription", { body: industry.regulatory.body })}
        canonical="/online-forklift-certification"
        jsonLd={[
          courseSchema({
            name: t("onlineCert.seoCourseName"),
            description: t("onlineCert.seoCourseDescription", { body: industry.regulatory.body }),
            url: "/online-forklift-certification",
            price: 45,
            duration: "PT2H",
            locale,
            image: "/images/online-learning.jpg",
          }),
          faqSchema(faqs, locale),
        ]}
      />
      <Hero
        image="/images/online-learning.jpg"
        imageAlt={t("productImages.onlineLearning")}
        title={t("onlineCert.heroTitle")}
        subtitle={t("onlineCert.heroSubtitle")}
        primaryCta={{ label: t("cta.getCertifiedOnline"), href: "/p/online-forklift-operator-training" }}
        secondaryCta={{ label: t("cta.viewAllPrograms"), href: "/training-programs" }}
      />
      <TrustBar />

      {/* Trust signals */}
      <section className="py-10 bg-card" data-testid="online-trust-signals">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {trustSignals.map((ts, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <ts.icon className="w-6 h-6 text-accent" />
                </div>
                <span className="text-sm font-medium text-foreground">{ts.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How Online Certification Works - 3 Steps */}
      <section className="py-16 md:py-20 bg-background" data-testid="online-how-it-works">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-brand-orange text-sm font-semibold uppercase tracking-wider">{t("onlineCert.howItWorksLabel")}</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mt-2 mb-4 tracking-tight">
              {t("onlineCert.howItWorksTitle")}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t("onlineCert.howItWorksDesc")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground font-bold text-xl mb-4">
                  {i + 1}
                </div>
                <div className="flex justify-center mb-3">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 md:py-20 bg-card" data-testid="online-pricing">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-brand-orange text-sm font-semibold uppercase tracking-wider">{t("onlineCert.pricingLabel")}</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mt-2 mb-4 tracking-tight">
            {t("onlineCert.pricingTitle")}
          </h2>
          <p className="text-muted-foreground text-lg mb-8">{t("onlineCert.pricingSubtitle")}</p>
          <Card className="border-border max-w-md mx-auto">
            <CardContent className="p-8">
              <div className="mb-6">
                <span className="text-5xl font-bold text-foreground">$45.00</span>
                <span className="text-muted-foreground ml-2">{t("onlineCert.pricingPerPerson")}</span>
              </div>
              <ul className="space-y-3 text-left mb-8">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-accent shrink-0" />
                  <span>{t("onlineCert.pricingInclude1")}</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-accent shrink-0" />
                  <span>{t("onlineCert.pricingInclude2")}</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-accent shrink-0" />
                  <span>{t("onlineCert.pricingInclude3")}</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-accent shrink-0" />
                  <span>{t("onlineCert.pricingInclude4")}</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-accent shrink-0" />
                  <span>{t("onlineCert.pricingInclude5")}</span>
                </li>
              </ul>
              <p className="text-xs text-muted-foreground mb-6">{t("onlineCert.pricingNoHiddenFees")}</p>
              <Link href="/p/online-forklift-operator-training">
                <Button size="lg" className="w-full bg-accent text-accent-foreground border-accent-border" data-testid="button-pricing-cta">
                  {t("cta.getCertifiedOnline")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-16 md:py-20 bg-background" data-testid="online-what-you-get">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-brand-orange text-sm font-semibold uppercase tracking-wider">{t("onlineCert.whatYouGetLabel")}</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mt-2 mb-4 tracking-tight">
              {t("onlineCert.whatYouGetTitle")}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t("onlineCert.whatYouGetSubtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {whatYouGet.map((item, i) => (
              <Card key={i} className="border-border">
                <CardContent className="p-6 flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 md:py-20 bg-card" data-testid="online-benefits">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-brand-orange text-sm font-semibold uppercase tracking-wider">{t("onlineCert.whyChooseOnline")}</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mt-2 mb-4 tracking-tight">
              {t("onlineCert.fastestPath")}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t("onlineCert.fastestPathDesc")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b) => (
              <Card key={b.title} className="border-border" data-testid={`benefit-${b.title.toLowerCase().replace(/\s+/g, "-")}`}>
                <CardContent className="p-6 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <b.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">{b.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison: Why online cert vs in-person */}
      <section className="py-16 md:py-20 bg-background" data-testid="online-comparison">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-brand-orange text-sm font-semibold uppercase tracking-wider">{t("onlineCert.compareLabel")}</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mt-2 mb-4 tracking-tight">
              {t("onlineCert.compareTitle")}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t("onlineCert.compareSubtitle")}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">{t("onlineCert.compareColFeature")}</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-foreground">
                    <Badge variant="secondary" className="mb-1">{t("onlineCert.compareColOnline")}</Badge>
                  </th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-muted-foreground">{t("onlineCert.compareColInPerson")}</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-4 px-4 text-sm font-medium text-foreground">{row.feature}</td>
                    <td className="py-4 px-4 text-sm text-muted-foreground text-center">{row.online}</td>
                    <td className="py-4 px-4 text-sm text-muted-foreground text-center">{row.inPerson}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground text-center mt-6">{t("onlineCert.compareNote")}</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20 bg-card" data-testid="online-faq">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-brand-orange text-sm font-semibold uppercase tracking-wider">{t("onlineCert.faqLabel")}</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-2 mb-3">
              {t("onlineCert.faqTitle")}
            </h2>
            <p className="text-muted-foreground">{t("onlineCert.faqSubtitle")}</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <Card key={i} className="border-border" data-testid={`faq-card-${i}`}>
                <CardContent className="p-5">
                  <h3 className="font-semibold text-sm mb-2">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <CTABand
        title={t("onlineCert.needHandsOn")}
        subtitle={t("onlineCert.needHandsOnDesc")}
        primaryCta={{ label: t("cta.viewHandsOnTraining"), href: "/hands-on-training" }}
        secondaryCta={{ label: t("cta.contactUs"), href: "/contact" }}
      />
    </>
  );
}
