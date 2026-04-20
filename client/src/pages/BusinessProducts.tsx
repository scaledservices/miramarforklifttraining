import Hero from "@/components/sections/Hero";
import CTABand from "@/components/sections/CTABand";
import ProductCard from "@/components/sections/ProductCard";
import { useTranslation } from "react-i18next";
import SEOHead from "@/components/seo/SEOHead";
import { brand } from "@shared/config/brand";
import { getProductsByCategory } from "@/data/catalog";

export default function BusinessProducts() {
  const { t } = useTranslation();
  const businessProducts = getProductsByCategory("business");
  const trainerProducts = getProductsByCategory("trainer");

  return (
    <>
      <SEOHead
        title={t("seo.businessProducts.title", { brand: brand.name })}
        description={t("seo.businessProducts.description", { brand: brand.name })}
        canonical="/business/products"
      />
      <Hero
        image="/images/warehouse-facility.jpg"
        title={t("businessProductsPage.heroTitle")}
        subtitle={t("businessProductsPage.heroSubtitle")}
        primaryCta={{ label: t("businessProductsPage.contactSales"), href: "/contact" }}
      />

      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-2">{t("businessProductsPage.certMaterials")}</h2>
          <p className="text-muted-foreground mb-6 text-sm">{t("businessProductsPage.certMaterialsDesc")}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {businessProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <h2 className="text-2xl font-bold tracking-tight mb-2">{t("businessProductsPage.trainerPrograms")}</h2>
          <p className="text-muted-foreground mb-6 text-sm">{t("businessProductsPage.trainerProgramsDesc")}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainerProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <CTABand
        title={t("businessProductsPage.ctaTitle")}
        subtitle={t("businessProductsPage.ctaSubtitle")}
        primaryCta={{ label: t("cta.contactUs"), href: "/contact" }}
        secondaryCta={{ label: t("businessProductsPage.viewFaq"), href: "/business/faq" }}
      />
    </>
  );
}
