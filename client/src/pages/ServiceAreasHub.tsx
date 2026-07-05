import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useCurrentLocale } from "@/hooks/useLocaleLocation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { brand } from "@shared/config/brand";
import { industry } from "@shared/config/industry";
import SEOHead from "@/components/seo/SEOHead";
import { getAllServiceAreaCities } from "@/data/serviceAreas";
import { MapPin, ArrowRight, Truck } from "lucide-react";

export default function ServiceAreasHub() {
  const { t } = useTranslation();
  const locale = useCurrentLocale();
  const serviceAreas = getAllServiceAreaCities(locale);

  return (
    <div>
      <SEOHead
        title={t("serviceAreas.hubSeoTitle", { brand: brand.name })}
        description={t("serviceAreas.hubSeoDescription", { body: industry.regulatory.body })}
        canonical="/service-areas"
      />

      <div className="bg-gradient-to-br from-brand-dark to-[hsl(10,22%,17%)] text-white py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-4 bg-white/10 text-white border-white/20">
            <Truck className="w-3 h-3 mr-1" /> {t("serviceAreas.hubBadge")}
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">{t("serviceAreas.hubTitle")}</h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
            {t("serviceAreas.hubSubtitle", { body: industry.regulatory.body })}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {serviceAreas.map((area) => (
            <Link key={area.slug} href={`/service-areas/${area.slug}`}>
              <Card
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer h-full border-border hover:border-accent"
                data-testid={`card-service-area-${area.slug}`}
              >
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center mb-5">
                    <MapPin className="w-7 h-7 text-brand-dark" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{area.city}, {area.stateAbbrev}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">
                    {area.seo.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {area.industriesServed.slice(0, 3).map((ind) => (
                      <span key={ind} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                        {ind.split("(")[0].trim()}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-brand-orange">
                    {t("serviceAreas.learnMore")} <ArrowRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            {t("serviceAreas.hubNoCity")}
          </p>
          <Link href="/request-quote">
            <Button size="lg" className="bg-accent text-accent-foreground border-accent-border px-6" data-testid="button-quote-your-location">
              {t("serviceAreas.hubQuoteCta")}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
