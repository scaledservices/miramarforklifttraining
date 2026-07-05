import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import Hero from "@/components/sections/Hero";
import TrustBar from "@/components/sections/TrustBar";
import FAQSection from "@/components/sections/FAQSection";
import CTABand from "@/components/sections/CTABand";
import SEOHead from "@/components/seo/SEOHead";
import { courseSchema } from "@/components/seo/StructuredData";
import { useCurrentLocale } from "@/hooks/useLocaleLocation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getFAQsByCategory } from "@/data/faq";
import { getProductBySlug } from "@/data/catalog";
import { industry } from "@shared/config/industry";
import OptimizedImage from "@/components/ui/optimized-image";
import { ArrowRight, Check, Monitor, Clock, Award, Shield, Smartphone, RotateCcw } from "lucide-react";

export default function OnlineCertification() {
  const { t } = useTranslation();
  const locale = useCurrentLocale();
  const product = getProductBySlug("online-forklift-operator-training");

  const benefits = [
    { icon: Monitor, title: t("onlineCert.benefit100Online"), desc: t("onlineCert.benefit100OnlineDesc") },
    { icon: Clock, title: t("onlineCert.benefitSelfPaced"), desc: t("onlineCert.benefitSelfPacedDesc") },
    { icon: Award, title: t("onlineCert.benefitInstantCert"), desc: t("onlineCert.benefitInstantCertDesc") },
    { icon: Shield, title: t("onlineCert.benefitOshaAligned"), desc: t("onlineCert.benefitOshaAlignedDesc") },
    { icon: Smartphone, title: t("onlineCert.benefitMobileFriendly"), desc: t("onlineCert.benefitMobileFriendlyDesc") },
    { icon: RotateCcw, title: t("onlineCert.benefitUnlimitedRetakes"), desc: t("onlineCert.benefitUnlimitedRetakesDesc") },
  ];

  const topics = [
    t("onlineCert.topic1"),
    t("onlineCert.topic2"),
    t("onlineCert.topic3"),
    t("onlineCert.topic4"),
    t("onlineCert.topic5"),
    t("onlineCert.topic6"),
    t("onlineCert.topic7"),
    t("onlineCert.topic8"),
    t("onlineCert.topic9"),
    t("onlineCert.topic10"),
    t("onlineCert.topic11"),
    t("onlineCert.topic12"),
    t("onlineCert.topic13"),
    t("onlineCert.topic14"),
    t("onlineCert.topic15"),
    t("onlineCert.topic16"),
  ];

  return (
    <>
      <SEOHead
        title={t("onlineCert.seoTitle", { body: industry.regulatory.body })}
        description={t("onlineCert.seoDescription", { body: industry.regulatory.body })}
        canonical="/online-forklift-certification"
        jsonLd={[courseSchema({
          name: t("onlineCert.seoCourseName"),
          description: t("onlineCert.seoCourseDescription", { body: industry.regulatory.body }),
          url: "/online-forklift-certification",
          price: 59.99,
          duration: "PT2H",
          locale,
          image: "/images/online-learning.jpg",
        })]}
      />
      <Hero
        image="/images/online-learning.jpg"
        imageAlt={t("productImages.onlineLearning")}
        title={t("onlineCert.title")}
        subtitle={t("onlineCert.subtitle")}
        primaryCta={{ label: t("cta.startTraining"), href: `/p/${product?.slug || "online-forklift-operator-training"}` }}
        secondaryCta={{ label: t("cta.viewAllPrograms"), href: "/training-programs" }}
      />
      <TrustBar />

      <section className="py-16 md:py-20 bg-background" data-testid="online-benefits">
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

      <section className="py-16 md:py-20 bg-card" data-testid="online-curriculum">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">{t("onlineCert.whatYouWillLearn")}</h2>
            <p className="text-muted-foreground">{t("onlineCert.whatYouWillLearnDesc")}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {topics.map((topic, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <Check className="w-4 h-4 text-accent shrink-0" />
                <span className="text-sm">{topic}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="relative rounded-lg overflow-hidden">
              <OptimizedImage
                src="/images/certification-success.jpg"
                alt={t("onlineCert.certSuccessAlt")}
                className="w-full h-72 object-cover rounded-lg"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-accent" />
                  <span className="text-white text-sm font-medium">{t("onlineCert.certIssuedInstantly")}</span>
                </div>
              </div>
            </div>
            <div className="text-center md:text-left">
              <Badge variant="secondary" className="mb-4">{t("common.mostPopular")}</Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">{t("onlineCert.readyToStart")}</h2>
              <p className="text-muted-foreground mb-6">
                {t("onlineCert.readyToStartDesc")}
              </p>
              <ul className="space-y-2 mb-8 text-left">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-accent shrink-0" />
                  <span>{t("onlineCert.studyAnywhere")}</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-accent shrink-0" />
                  <span>{t("onlineCert.printableCertAfterPassing")}</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-accent shrink-0" />
                  <span>{t("onlineCert.unlimitedRetakesIncluded")}</span>
                </li>
              </ul>
              <Link href={`/p/${product?.slug || "online-forklift-operator-training"}`}>
                <Button size="lg" className="bg-accent text-accent-foreground border-accent-border" data-testid="button-start-online">
                  {t("cta.startOnlineTraining")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <FAQSection
        items={getFAQsByCategory("online")}
        title={t("onlineCert.onlineFaq")}
        subtitle={t("onlineCert.onlineFaqDesc")}
      />

      <CTABand
        title={t("onlineCert.needHandsOn")}
        subtitle={t("onlineCert.needHandsOnDesc")}
        primaryCta={{ label: t("cta.viewHandsOnTraining"), href: "/hands-on-training" }}
        secondaryCta={{ label: t("cta.contactUs"), href: "/contact" }}
      />
    </>
  );
}
