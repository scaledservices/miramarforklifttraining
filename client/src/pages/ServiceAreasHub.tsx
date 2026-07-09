import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useCurrentLocale } from "@/hooks/useLocaleLocation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { brand } from "@shared/config/brand";
import { industry } from "@shared/config/industry";
import SEOHead from "@/components/seo/SEOHead";
import {
  getAllServiceAreaCities,
  getRegionGroup,
  type ServiceAreaCity,
  type ServiceAreaRegionGroup,
} from "@/data/serviceAreas";
import { MapPin, ArrowRight, Truck, Building2, Search } from "lucide-react";

interface RegionMeta {
  key: ServiceAreaRegionGroup;
  labelKey: string;
  facilityKey: string | null; // i18n key describing the anchor facility; null = onsite-only region
}

// Display order mirrors the business footprint: the three facility regions
// first, then onsite-only coverage (Bay Area).
const REGIONS: RegionMeta[] = [
  { key: "southern-california", labelKey: "serviceAreas.regionSoCal", facilityKey: "serviceAreas.regionSoCalFacility" },
  { key: "central-california", labelKey: "serviceAreas.regionCentral", facilityKey: "serviceAreas.regionCentralFacility" },
  { key: "southern-nevada", labelKey: "serviceAreas.regionNevada", facilityKey: "serviceAreas.regionNevadaFacility" },
  { key: "northern-california", labelKey: "serviceAreas.regionNorCal", facilityKey: null },
];

export default function ServiceAreasHub() {
  const { t } = useTranslation();
  const locale = useCurrentLocale();
  const [query, setQuery] = useState("");

  const allCities = useMemo(() => getAllServiceAreaCities(locale), [locale]);

  // Search across name, region, and county; results stay grouped by region.
  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (c: ServiceAreaCity) =>
      !q ||
      c.city.toLowerCase().includes(q) ||
      c.region.toLowerCase().includes(q) ||
      (c.county ?? "").toLowerCase().includes(q);

    const byGroup = new Map<ServiceAreaRegionGroup, ServiceAreaCity[]>();
    for (const city of allCities) {
      if (!matches(city)) continue;
      const group = getRegionGroup(city);
      if (!byGroup.has(group)) byGroup.set(group, []);
      byGroup.get(group)!.push(city);
    }
    byGroup.forEach((cities) => {
      cities.sort((a, b) => (b.population ?? 0) - (a.population ?? 0) || a.city.localeCompare(b.city));
    });
    return byGroup;
  }, [allCities, query]);

  let shownCount = 0;
  grouped.forEach((cities) => {
    shownCount += cities.length;
  });

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
          <div className="max-w-md mx-auto relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("serviceAreas.hubSearchPlaceholder")}
              className="pl-9 bg-white text-foreground"
              data-testid="input-hub-search"
            />
          </div>
          <p className="text-white/60 text-sm mt-3" data-testid="text-hub-count">
            {t("serviceAreas.hubCityCount", { shown: shownCount, total: allCities.length })}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
        {REGIONS.map((region) => {
          const cities = grouped.get(region.key) ?? [];
          if (cities.length === 0) return null;
          return (
            <section key={region.key} data-testid={`region-section-${region.key}`}>
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-5 border-b border-border pb-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">{t(region.labelKey)}</h2>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                    {region.facilityKey ? (
                      <>
                        <Building2 className="w-4 h-4 text-brand-green shrink-0" />
                        {t(region.facilityKey)}
                      </>
                    ) : (
                      <>
                        <Truck className="w-4 h-4 text-brand-green shrink-0" />
                        {t("serviceAreas.regionOnsiteOnly")}
                      </>
                    )}
                  </p>
                </div>
                <span className="text-sm text-muted-foreground shrink-0">
                  {t("serviceAreas.regionCityCount", { count: cities.length })}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {cities.map((city) => (
                  <Link
                    key={city.slug}
                    href={`/service-areas/${city.slug}`}
                    className="group flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-medium hover:border-accent hover:shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    data-testid={`card-service-area-${city.slug}`}
                  >
                    <MapPin className="w-3.5 h-3.5 text-brand-dark shrink-0 group-hover:text-accent transition-colors" />
                    <span className="truncate">
                      {city.city}, {city.stateAbbrev}
                    </span>
                    {city.distanceTier === "facility" && (
                      <span className="ml-auto shrink-0 text-[10px] font-semibold uppercase tracking-wide text-brand-green">
                        {t("serviceAreas.tierFacilityBadge")}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        {shownCount === 0 && (
          <p className="text-center text-muted-foreground py-8" data-testid="text-hub-no-results">
            {t("serviceAreas.hubNoResults", { query })}
          </p>
        )}

        <div className="text-center border-t border-border pt-10">
          <p className="text-muted-foreground mb-4">{t("serviceAreas.hubNoCity")}</p>
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
