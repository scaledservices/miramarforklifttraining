import Hero from "@/components/sections/Hero";
import CTABand from "@/components/sections/CTABand";
import ProductCard from "@/components/sections/ProductCard";
import { useTranslation } from "react-i18next";
import SEOHead from "@/components/seo/SEOHead";
import { getProductsByCategory } from "@/data/catalog";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Building2, DollarSign } from "lucide-react";

export default function TrainTheTrainer() {
  const { t } = useTranslation();
  const products = getProductsByCategory("trainer");

  const reasons = [
    { icon: Users, titleKey: "trainTheTrainerPage.reason1Title", descKey: "trainTheTrainerPage.reason1Desc" },
    { icon: Building2, titleKey: "trainTheTrainerPage.reason2Title", descKey: "trainTheTrainerPage.reason2Desc" },
    { icon: DollarSign, titleKey: "trainTheTrainerPage.reason3Title", descKey: "trainTheTrainerPage.reason3Desc" },
  ];

  return (
    <>
      <SEOHead
        title={t("seo.trainTheTrainer.title")}
        description={t("seo.trainTheTrainer.description")}
        canonical="/train-the-trainer"
      />
      <Hero
        image="/images/training-class.jpg"
        title={t("trainTheTrainerPage.heroTitle")}
        subtitle={t("trainTheTrainerPage.heroSubtitle")}
        primaryCta={{ label: t("trainTheTrainerPage.viewPrograms"), href: "#programs" }}
        secondaryCta={{ label: t("cta.contactUs"), href: "/contact" }}
      />

      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">{t("trainTheTrainerPage.whyBecomeTrainer")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("trainTheTrainerPage.whyBecomeTrainerDesc")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {reasons.map((r) => (
              <Card key={r.titleKey} className="border-border" data-testid={`reason-${r.titleKey}`}>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <r.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2">{t(r.titleKey)}</h3>
                  <p className="text-sm text-muted-foreground">{t(r.descKey)}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div id="programs">
            <h2 className="text-2xl font-bold tracking-tight mb-6">{t("trainTheTrainerPage.availablePrograms")}</h2>
            <div className="space-y-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} variant="full" />
              ))}
            </div>
          </div>
        </div>
      </section>

      <CTABand
        title={t("trainTheTrainerPage.ctaTitle")}
        subtitle={t("trainTheTrainerPage.ctaSubtitle")}
        primaryCta={{ label: t("cta.contactUs"), href: "/contact" }}
        secondaryCta={{ label: t("trainTheTrainerPage.viewBusinessProducts"), href: "/business/products" }}
      />
    </>
  );
}
