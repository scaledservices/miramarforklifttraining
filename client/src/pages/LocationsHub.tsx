import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import OptimizedImage from "@/components/ui/optimized-image";
import { Badge } from "@/components/ui/badge";
import { brand } from "@shared/config/brand";
import { industry } from "@shared/config/industry";
import { getActiveLocations } from "@shared/config/locations";
import { MapPin, ChevronRight, Building2, Users, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import SEOHead from "@/components/seo/SEOHead";

const activeLocations = getActiveLocations();

export default function LocationsHub() {
  const { t } = useTranslation();

  return (
    <div>
      <SEOHead
        title={`${t("locationsHubPage.title")} | ${brand.name}`}
        description={t("seo.locations.description", { brand: brand.name, body: industry.regulatory.body })}
        canonical="/locations"
      />

      <div className="bg-gradient-to-br from-brand-dark to-[hsl(10,22%,17%)] text-white py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-4 bg-white/10 text-white border-white/20">
            <MapPin className="w-3 h-3 mr-1" /> {t("locationsHubPage.badgeLabel")}
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">{t("locationsHubPage.title")}</h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
            {t("locationsHubPage.subtitle", { body: industry.regulatory.body })}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {activeLocations.map((loc) => (
            <Link key={loc.slug} href={`/locations/${loc.slug}`}>
              <Card
                className="cursor-pointer hover:shadow-lg transition-all h-full group"
                data-testid={`card-area-${loc.slug}`}
              >
                <div className="h-48 relative overflow-hidden rounded-t-lg">
                  <OptimizedImage src={loc.heroImage} alt={loc.displayName} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-brand-dark/30 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-xl font-bold">{loc.displayName}</h3>
                    <p className="text-sm text-white/80">{loc.address.full}</p>
                  </div>
                </div>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground mb-4">
                    {t("locationsHubPage.facilityDesc")}
                  </p>
                  <div className="flex items-center text-sm text-brand-orange font-medium group-hover:text-brand-dark">
                    {t("locationsHubPage.viewTrainingOptions")} <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          <Link href="/request-quote">
            <Card
              className="cursor-pointer hover:shadow-lg transition-all h-full group"
              data-testid="card-onsite-training"
            >
              <div className="h-48 relative overflow-hidden rounded-t-lg">
                <OptimizedImage src="/images/trainer-instructor.jpg" alt={t("locationsHubPage.onSiteTraining")} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-brand-dark/30 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-xl font-bold">{t("locationsHubPage.onSiteTraining")}</h3>
                  <p className="text-sm text-white/80">{t("locationsHubPage.onSiteSubtitle")}</p>
                </div>
              </div>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground mb-4">
                  {t("locationsHubPage.onSiteDesc")}
                </p>
                <div className="flex items-center text-sm text-brand-orange font-medium group-hover:text-brand-dark">
                  {t("locationsHubPage.requestQuote")} <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 text-center">
            <Building2 className="w-10 h-10 mx-auto mb-3 text-brand-dark" />
            <h3 className="font-semibold mb-2">{t("locationsHubPage.inPersonTitle")}</h3>
            <p className="text-sm text-muted-foreground">{t("locationsHubPage.inPersonDesc")}</p>
          </Card>
          <Card className="p-6 text-center">
            <Users className="w-10 h-10 mx-auto mb-3 text-brand-dark" />
            <h3 className="font-semibold mb-2">{t("locationsHubPage.groupsTitle")}</h3>
            <p className="text-sm text-muted-foreground">{t("locationsHubPage.groupsDesc")}</p>
          </Card>
          <Card className="p-6 text-center">
            <Clock className="w-10 h-10 mx-auto mb-3 text-brand-dark" />
            <h3 className="font-semibold mb-2">{t("locationsHubPage.sameDayTitle")}</h3>
            <p className="text-sm text-muted-foreground">{t("locationsHubPage.sameDayDesc", { body: industry.regulatory.body })}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
