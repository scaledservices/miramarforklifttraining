import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useCurrentLocale } from "@/hooks/useLocaleLocation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { brand } from "@shared/config/brand";
import { industry } from "@shared/config/industry";
import { INDUSTRIES } from "@shared/config/industries";
import SEOHead from "@/components/seo/SEOHead";
import { breadcrumbSchema } from "@/components/seo/StructuredData";
import { SITE_URL } from "@/components/seo/siteUrl";
import { ArrowRight, Truck, Phone, Users } from "lucide-react";

const INDUSTRY_ICONS: Record<string, string> = {
  warehousing: "📦",
  logistics: "🚛",
  construction: "🏗️",
  manufacturing: "🏭",
  retail: "🛒",
  "food-beverage": "🥶",
  "lumber-building-materials": "🪵",
  "shipping-ports": "🚢",
};

export default function IndustriesHub() {
  const { t } = useTranslation();
  const locale = useCurrentLocale();
  const isEs = locale === "es";

  const breadcrumbs = breadcrumbSchema(
    [
      { name: t("industries.breadcrumbHome"), url: "/" },
      { name: t("industries.breadcrumbHub"), url: "/industries" },
    ],
    locale
  );

  return (
    <div>
      <SEOHead
        title={isEs
          ? `Certificacion de Montacargas por Industria | ${brand.name}`
          : `Forklift Certification by Industry | ${brand.name}`}
        description={isEs
          ? "Certificacion de montacargas alineada con OSHA para almacenes, logistica, construccion, manufactura, retail, alimentos y bebidas, madera y puertos en San Diego, Las Vegas y Fresno."
          : "OSHA-aligned forklift certification for warehousing, logistics, construction, manufacturing, retail, food & beverage, lumber, and shipping in San Diego, Las Vegas & Fresno."}
        canonical="/industries"
        jsonLd={[breadcrumbs]}
      />

      {/* Hero */}
      <div className="bg-gradient-to-br from-brand-dark to-[hsl(10,22%,17%)] text-white py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-4 bg-white/10 text-white border-white/20">
            <Truck className="w-3 h-3 mr-1" /> {t("industries.hubBadge")}
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            {t("industries.hubTitle")}
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
            {t("industries.hubSubtitle", { body: industry.regulatory.body })}
          </p>
        </div>
      </div>

      {/* Industry Grid */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {INDUSTRIES.map((ind) => {
            const name = isEs ? ind.nameEs : ind.name;
            const desc = isEs ? ind.descriptionEs : ind.description;
            return (
              <Link key={ind.slug} href={`/industries/${ind.slug}`}>
                <Card
                  className="group hover:shadow-lg transition-all duration-300 cursor-pointer h-full border-border hover:border-accent"
                  data-testid={`card-industry-${ind.slug}`}
                >
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="text-4xl mb-4">{INDUSTRY_ICONS[ind.slug] || "🏭"}</div>
                    <h3 className="text-xl font-bold mb-2">{name}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1 line-clamp-3">
                      {desc}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {ind.equipment.slice(0, 3).map((eq) => (
                        <span key={eq} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                          {eq.split("(")[0].trim()}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-brand-orange">
                      {t("industries.learnMore")} <ArrowRight className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center bg-card border border-border rounded-lg p-8 md:p-12">
          <h2 className="text-2xl font-bold mb-3">{t("industries.hubCtaTitle")}</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            {t("industries.hubCtaSubtitle")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/get-certified">
              <Button size="lg" className="bg-accent text-accent-foreground border-accent-border" data-testid="hub-cta-certify">
                {t("industries.ctaCertify")}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <a href={`tel:${brand.support.phoneTel}`}>
              <Button size="lg" variant="outline">
                <Phone className="w-4 h-4 mr-2" />
                {brand.support.phone}
              </Button>
            </a>
          </div>
        </div>

        {/* Staffing Agency Program Link */}
        <div className="mt-8 bg-gradient-to-r from-brand-dark to-[hsl(10,22%,16%)] text-white rounded-lg p-8 md:p-10 text-center">
          <Badge variant="secondary" className="mb-3 bg-white/10 text-white border-white/20">
            <Users className="w-3 h-3 mr-1" /> {isEs ? "Programa Especial" : "Special Program"}
          </Badge>
          <h3 className="text-xl md:text-2xl font-bold mb-2">
            {isEs ? "Es Agencia de Personal Temporal?" : "Staffing Agency?"}
          </h3>
          <p className="text-white/80 mb-5 max-w-2xl mx-auto">
            {isEs
              ? "Certifique a sus trabajadores temporales en 24 horas con reservacion prioritaria, descuentos por volumen y facturacion net-30."
              : "Get your temps certified in 24 hours with priority booking, volume pricing, and net-30 invoicing."}
          </p>
          <Link href="/staffing-agency-program">
            <Button size="lg" className="bg-accent text-accent-foreground border-accent-border" data-testid="hub-cta-staffing">
              {isEs ? "Ver Programa para Agencias" : "View Staffing Agency Program"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
