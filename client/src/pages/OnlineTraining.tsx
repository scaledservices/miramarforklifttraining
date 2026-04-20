import Hero from "@/components/sections/Hero";
import CTABand from "@/components/sections/CTABand";
import ProductCard from "@/components/sections/ProductCard";
import { useTranslation } from "react-i18next";
import SEOHead from "@/components/seo/SEOHead";
import { industry } from "@shared/config/industry";
import { getProductsByCategory } from "@/data/catalog";

export default function OnlineTraining() {
  const { t } = useTranslation();
  const products = getProductsByCategory("online");

  return (
    <>
      <SEOHead
        title={t("seo.onlineTraining.title", { body: industry.regulatory.body })}
        description={t("seo.onlineTraining.description", { body: industry.regulatory.body })}
        canonical="/online-training"
      />
      <Hero
        image="/images/online-learning.jpg"
        title={t("onlineTrainingPage.heroTitle")}
        subtitle={t("onlineTrainingPage.heroSubtitle", { body: industry.regulatory.body })}
        primaryCta={{ label: t("onlineTrainingPage.getCertifiedNow"), href: "/online-forklift-certification" }}
      />

      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-2">{t("onlineTrainingPage.individualTitle")}</h2>
          <p className="text-muted-foreground mb-8">{t("onlineTrainingPage.individualDesc")}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {products.filter((p) => !p.priceLabel).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <h2 className="text-2xl font-bold tracking-tight mb-2">{t("onlineTrainingPage.teamTitle")}</h2>
          <p className="text-muted-foreground mb-8">{t("onlineTrainingPage.teamDesc")}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {products.filter((p) => !!p.priceLabel).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <CTABand
        title={t("onlineTrainingPage.ctaTitle")}
        subtitle={t("onlineTrainingPage.ctaSubtitle")}
        primaryCta={{ label: t("onlineTrainingPage.viewHandsOn"), href: "/hands-on-training" }}
        secondaryCta={{ label: t("cta.contactUs"), href: "/contact" }}
      />
    </>
  );
}
